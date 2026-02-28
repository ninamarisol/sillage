import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { ARCHETYPES, type ArchetypeId } from "@shared/schema";

const FRAMES_DIR = path.join(process.cwd(), "client", "public", "frames");
const ZIP_PATH = path.join(process.cwd(), "attached_assets", "ezgif-18cae09368354b83-jpg_1772291979647.zip");

function extractFramesIfNeeded() {
  if (fs.existsSync(FRAMES_DIR)) {
    const existing = fs.readdirSync(FRAMES_DIR).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    if (existing.length > 0) {
      console.log(`[frames] ${existing.length} frames already extracted`);
      return;
    }
  }
  if (!fs.existsSync(ZIP_PATH)) {
    console.warn(`[frames] ZIP file not found at ${ZIP_PATH}`);
    return;
  }
  console.log("[frames] Extracting frames from ZIP...");
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  const zip = new AdmZip(ZIP_PATH);
  const entries = zip.getEntries();
  let count = 0;
  for (const entry of entries) {
    if (!entry.isDirectory && /\.(jpg|jpeg|png)$/i.test(entry.entryName)) {
      const basename = path.basename(entry.entryName);
      fs.writeFileSync(path.join(FRAMES_DIR, basename), entry.getData());
      count++;
    }
  }
  console.log(`[frames] Extracted ${count} frames`);
}

function computeArchetype(user: any): ArchetypeId {
  const scores: Record<string, number> = {};
  Object.keys(ARCHETYPES).forEach(k => scores[k] = 0);

  const scentMap: Record<string, ArchetypeId[]> = {
    "Warm": ["velvet-dusk", "solar-nomad"],
    "Fresh": ["green-wanderer", "citrus-architect"],
    "Mysterious": ["velvet-dusk", "baroque-collector"],
    "Clean": ["clean-canvas", "citrus-architect"],
    "Earthy": ["green-wanderer", "baroque-collector"],
    "Sweet": ["solar-nomad", "baroque-collector"],
    "Powdery": ["clean-canvas", "velvet-dusk"],
    "Bold": ["baroque-collector", "velvet-dusk"],
    "Quiet": ["clean-canvas", "green-wanderer"],
  };

  (user.scentPreferences || []).forEach((pref: string) => {
    (scentMap[pref] || []).forEach((a: string) => scores[a] += 2);
  });

  const noteMap: Record<string, ArchetypeId[]> = {
    "floral": ["velvet-dusk", "clean-canvas"],
    "woody": ["green-wanderer", "baroque-collector"],
    "citrus": ["citrus-architect", "solar-nomad"],
    "gourmand": ["baroque-collector", "solar-nomad"],
    "aquatic": ["clean-canvas", "solar-nomad"],
    "oriental": ["velvet-dusk", "baroque-collector"],
    "green": ["green-wanderer", "citrus-architect"],
    "leather": ["baroque-collector", "velvet-dusk"],
  };

  (user.noteLikes || []).forEach((note: string) => {
    (noteMap[note] || []).forEach((a: string) => scores[a] += 3);
  });
  (user.noteDislikes || []).forEach((note: string) => {
    (noteMap[note] || []).forEach((a: string) => scores[a] -= 2);
  });

  const seasonMap: Record<string, ArchetypeId[]> = {
    "Spring": ["citrus-architect", "green-wanderer"],
    "Summer": ["solar-nomad", "citrus-architect"],
    "Fall": ["velvet-dusk", "baroque-collector"],
    "Winter": ["baroque-collector", "velvet-dusk"],
  };
  if (user.seasonPreference && seasonMap[user.seasonPreference]) {
    seasonMap[user.seasonPreference].forEach((a: string) => scores[a] += 1);
  }

  const vibes = user.vibeAnswers || {};
  if (vibes.texture === "Velvet") scores["velvet-dusk"] += 2;
  if (vibes.texture === "Linen") scores["clean-canvas"] += 2;
  if (vibes.texture === "Cashmere") scores["solar-nomad"] += 2;
  if (vibes.texture === "Worn leather") scores["baroque-collector"] += 2;
  if (vibes.texture === "Crisp paper") scores["citrus-architect"] += 2;
  if (vibes.colorEnergy === "Deep jewel tones") scores["velvet-dusk"] += 2;
  if (vibes.colorEnergy === "Soft neutrals") scores["clean-canvas"] += 2;
  if (vibes.colorEnergy === "Bold primaries") scores["citrus-architect"] += 2;
  if (vibes.colorEnergy === "Black, always") scores["baroque-collector"] += 2;
  if (vibes.showUp === "The calm in the room") scores["clean-canvas"] += 2;
  if (vibes.showUp === "The energy in the room") scores["citrus-architect"] += 2;
  if (vibes.showUp === "The mystery") scores["velvet-dusk"] += 2;
  if (vibes.showUp === "The warmth") scores["solar-nomad"] += 2;

  let best: ArchetypeId = "clean-canvas";
  let bestScore = -Infinity;
  for (const [k, v] of Object.entries(scores)) {
    if (v > bestScore) { bestScore = v; best = k as ArchetypeId; }
  }
  return best;
}

function computeMatchScore(fragrance: any, user: any): number {
  let score = 50;
  const allNotes = [...(fragrance.topNotes || []), ...(fragrance.heartNotes || []), ...(fragrance.baseNotes || [])];
  const userLikes = user.noteLikes || [];
  const userDislikes = user.noteDislikes || [];
  const noteMap: Record<string, string[]> = {
    "floral": ["rose", "jasmine", "iris", "ylang-ylang", "peony", "orange blossom", "lily-of-the-valley", "freesia", "orchid"],
    "woody": ["cedar", "sandalwood", "vetiver", "rosewood", "birch", "oakmoss"],
    "citrus": ["bergamot", "lemon", "grapefruit", "neroli", "lime", "orange", "yuzu", "sicilian lemon"],
    "gourmand": ["vanilla", "praline", "caramel", "chocolate", "tonka bean", "truffle"],
    "aquatic": ["calone", "sea salt", "marine"],
    "oriental": ["oud", "amber", "incense", "saffron", "ambergris", "ambroxan", "labdanum"],
    "green": ["moss", "green tea", "fig", "tree moss"],
    "leather": ["leather", "suede", "tobacco", "smoke"],
  };
  for (const [family, familyNotes] of Object.entries(noteMap)) {
    const hasMatchingNote = allNotes.some((n: string) => familyNotes.some(fn => n.toLowerCase().includes(fn)));
    if (hasMatchingNote) {
      if (userLikes.includes(family)) score += 8;
      if (userDislikes.includes(family)) score -= 10;
    }
  }
  if (user.archetypeId && ARCHETYPES[user.archetypeId as ArchetypeId]) {
    const archNotes = ARCHETYPES[user.archetypeId as ArchetypeId].notes;
    const overlap = allNotes.filter((n: string) => archNotes.some(an => n.toLowerCase().includes(an.toLowerCase())));
    score += overlap.length * 5;
  }
  return Math.max(10, Math.min(99, Math.round(score)));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  extractFramesIfNeeded();
  await seedDatabase();

  app.get("/api/frames", (_req, res) => {
    try {
      const files = fs.readdirSync(FRAMES_DIR)
        .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
        .sort((a, b) => {
          const numA = parseInt(a.match(/(\d+)/)?.[1] || "0");
          const numB = parseInt(b.match(/(\d+)/)?.[1] || "0");
          return numA - numB;
        });
      res.json({ frames: files.map(f => `/frames/${f}`), total: files.length });
    } catch {
      res.status(500).json({ error: "Failed to read frames directory" });
    }
  });

  app.post("/api/access-code/validate", async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Code required" });
    const ac = await storage.validateAccessCode(code);
    if (!ac) return res.status(404).json({ error: "Invalid access code" });
    await storage.incrementAccessCodeUses(ac.id);
    res.json({ valid: true, creatorName: ac.creatorName });
  });

  app.post("/api/auth/register", async (req, res) => {
    const { username, password, displayName, accessCode } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    if (!accessCode) return res.status(400).json({ error: "Access code required" });
    const ac = await storage.validateAccessCode(accessCode);
    if (!ac) return res.status(403).json({ error: "Invalid access code" });
    const existing = await storage.getUserByUsername(username);
    if (existing) return res.status(409).json({ error: "Username already taken" });
    const user = await storage.createUser({ username, password, displayName, accessCode });
    res.json({ user: { ...user, password: undefined } });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ user: { ...user, password: undefined } });
  });

  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ ...user, password: undefined });
  });

  app.patch("/api/users/:id", async (req, res) => {
    const user = await storage.updateUser(req.params.id, req.body);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ ...user, password: undefined });
  });

  app.post("/api/users/:id/complete-quiz", async (req, res) => {
    const { seasonPreference, settingPreferences, scentPreferences, noteLikes, noteDislikes, vibeAnswers, themePreference } = req.body;
    const updateData: any = {
      seasonPreference,
      settingPreferences,
      scentPreferences,
      noteLikes,
      noteDislikes,
      vibeAnswers,
      onboardingComplete: true,
    };
    if (themePreference) updateData.themePreference = themePreference;
    const archetypeId = computeArchetype(updateData);
    updateData.archetypeId = archetypeId;
    const user = await storage.updateUser(req.params.id, updateData);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: { ...user, password: undefined }, archetypeId, archetype: ARCHETYPES[archetypeId] });
  });

  app.get("/api/fragrances", async (req, res) => {
    const { search } = req.query;
    if (search && typeof search === "string") {
      const results = await storage.searchFragrances(search);
      return res.json(results);
    }
    const all = await storage.getFragrances();
    res.json(all);
  });

  app.get("/api/fragrances/:id", async (req, res) => {
    const f = await storage.getFragrance(req.params.id);
    if (!f) return res.status(404).json({ error: "Fragrance not found" });
    res.json(f);
  });

  app.get("/api/users/:userId/recommendations", async (req, res) => {
    const user = await storage.getUser(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const allFragrances = await storage.getFragrances();
    const vaultItemsList = await storage.getVaultItems(user.id);
    const vaultFragIds = new Set(vaultItemsList.map(v => v.fragranceId));
    const recommendations = allFragrances
      .filter(f => !vaultFragIds.has(f.id))
      .map(f => ({ ...f, matchScore: computeMatchScore(f, user) }))
      .sort((a, b) => b.matchScore - a.matchScore);
    res.json(recommendations);
  });

  app.get("/api/users/:userId/vault", async (req, res) => {
    const items = await storage.getVaultItems(req.params.userId);
    const fragrancesData = await storage.getFragrances();
    const fragMap = new Map(fragrancesData.map(f => [f.id, f]));
    const enriched = items.map(item => ({ ...item, fragrance: fragMap.get(item.fragranceId) }));
    res.json(enriched);
  });

  app.post("/api/users/:userId/vault", async (req, res) => {
    const { fragranceId, bottleSize, fillLevel, wearFrequency, wouldSell } = req.body;
    if (!fragranceId) return res.status(400).json({ error: "Fragrance ID required" });
    const user = await storage.getUser(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const fragrance = await storage.getFragrance(fragranceId);
    if (!fragrance) return res.status(404).json({ error: "Fragrance not found" });
    const matchScore = computeMatchScore(fragrance, user);
    const item = await storage.createVaultItem({
      userId: req.params.userId, fragranceId, bottleSize, fillLevel, wearFrequency, wouldSell, matchScore,
    });
    res.json({ ...item, fragrance });
  });

  app.patch("/api/vault/:id", async (req, res) => {
    const item = await storage.updateVaultItem(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: "Vault item not found" });
    res.json(item);
  });

  app.delete("/api/vault/:id", async (req, res) => {
    await storage.deleteVaultItem(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/users/:userId/to-try", async (req, res) => {
    const items = await storage.getToTryItems(req.params.userId);
    const fragrancesData = await storage.getFragrances();
    const fragMap = new Map(fragrancesData.map(f => [f.id, f]));
    const enriched = items.map(item => ({ ...item, fragrance: fragMap.get(item.fragranceId) }));
    res.json(enriched);
  });

  app.post("/api/users/:userId/to-try", async (req, res) => {
    const { fragranceId, priority } = req.body;
    if (!fragranceId) return res.status(400).json({ error: "Fragrance ID required" });
    const user = await storage.getUser(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const fragrance = await storage.getFragrance(fragranceId);
    if (!fragrance) return res.status(404).json({ error: "Fragrance not found" });
    const matchScore = computeMatchScore(fragrance, user);
    const item = await storage.createToTryItem({ userId: req.params.userId, fragranceId, priority, matchScore });
    res.json({ ...item, fragrance });
  });

  app.patch("/api/to-try/:id", async (req, res) => {
    const item = await storage.updateToTryItem(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: "To-try item not found" });
    res.json(item);
  });

  app.delete("/api/to-try/:id", async (req, res) => {
    await storage.deleteToTryItem(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/users/:userId/wear-logs", async (req, res) => {
    const logs = await storage.getWearLogs(req.params.userId);
    const fragrancesData = await storage.getFragrances();
    const fragMap = new Map(fragrancesData.map(f => [f.id, f]));
    const enriched = logs.map(log => ({ ...log, fragrance: fragMap.get(log.fragranceId) }));
    res.json(enriched);
  });

  app.post("/api/users/:userId/wear-logs", async (req, res) => {
    const { fragranceId, occasion, notes } = req.body;
    if (!fragranceId) return res.status(400).json({ error: "Fragrance ID required" });
    const user = await storage.getUser(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const log = await storage.createWearLog({ userId: req.params.userId, fragranceId, occasion, notes });
    const fragrance = await storage.getFragrance(fragranceId);
    await storage.createFeedPost({
      userId: req.params.userId,
      type: "wear_log",
      content: occasion ? `Wore this for ${occasion.toLowerCase()}` : "Logged a wear",
      fragranceId,
    });
    res.json({ ...log, fragrance });
  });

  app.get("/api/feed", async (req, res) => {
    const posts = await storage.getFeedPosts();
    const allUsers = await Promise.all(
      [...new Set(posts.map(p => p.userId))].map(id => storage.getUser(id))
    );
    const userMap = new Map(allUsers.filter(Boolean).map(u => [u!.id, u!]));
    const fragrancesData = await storage.getFragrances();
    const fragMap = new Map(fragrancesData.map(f => [f.id, f]));

    const requestingUserId = req.query.userId as string | undefined;
    let userLikes = new Set<string>();
    if (requestingUserId) {
      const allLikesForUser = await Promise.all(
        posts.map(p => storage.getPostLike(p.id, requestingUserId))
      );
      allLikesForUser.forEach((like, i) => {
        if (like) userLikes.add(posts[i].id);
      });
    }

    const enriched = posts.map(post => {
      const postUser = userMap.get(post.userId);
      return {
        ...post,
        user: postUser ? { id: postUser.id, username: postUser.username, displayName: postUser.displayName, archetypeId: postUser.archetypeId } : null,
        fragrance: post.fragranceId ? fragMap.get(post.fragranceId) : null,
        liked: userLikes.has(post.id),
      };
    });
    res.json(enriched);
  });

  app.post("/api/feed", async (req, res) => {
    const { userId, type, content, fragranceId, rating } = req.body;
    if (!userId || !type) return res.status(400).json({ error: "User ID and type required" });
    const post = await storage.createFeedPost({ userId, type, content, fragranceId, rating });
    res.json(post);
  });

  app.post("/api/feed/:id/like", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });
    const existing = await storage.getPostLike(req.params.id, userId);
    if (existing) {
      await storage.deletePostLike(req.params.id, userId);
      await storage.updateFeedPostLikeCount(req.params.id, -1);
      res.json({ liked: false });
    } else {
      await storage.createPostLike({ postId: req.params.id, userId });
      await storage.updateFeedPostLikeCount(req.params.id, 1);
      res.json({ liked: true });
    }
  });

  app.delete("/api/feed/:id", async (req, res) => {
    const post = await storage.getFeedPost(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    await storage.deleteFeedPost(req.params.id);
    res.json({ success: true });
  });

  return httpServer;
}
