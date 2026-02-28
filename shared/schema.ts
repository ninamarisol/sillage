import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  accessCode: text("access_code"),
  onboardingComplete: boolean("onboarding_complete").default(false),
  archetypeId: text("archetype_id"),
  themePreference: text("theme_preference").default("dark"),
  seasonPreference: text("season_preference"),
  settingPreferences: text("setting_preferences").array(),
  scentPreferences: text("scent_preferences").array(),
  noteLikes: text("note_likes").array(),
  noteDislikes: text("note_dislikes").array(),
  vibeAnswers: jsonb("vibe_answers"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accessCodes = pgTable("access_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  creatorName: text("creator_name").notNull(),
  usesCount: integer("uses_count").default(0),
  active: boolean("active").default(true),
});

export const fragrances = pgTable("fragrances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  house: text("house").notNull(),
  concentration: text("concentration"),
  topNotes: text("top_notes").array(),
  heartNotes: text("heart_notes").array(),
  baseNotes: text("base_notes").array(),
  family: text("family"),
  imageUrl: text("image_url"),
  description: text("description"),
});

export const vaultItems = pgTable("vault_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fragranceId: varchar("fragrance_id").notNull(),
  bottleSize: text("bottle_size"),
  fillLevel: integer("fill_level").default(100),
  wearFrequency: text("wear_frequency"),
  wouldSell: boolean("would_sell").default(false),
  rating: integer("rating"),
  notes: text("notes"),
  matchScore: real("match_score"),
  addedAt: timestamp("added_at").defaultNow(),
});

export const toTryItems = pgTable("to_try_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fragranceId: varchar("fragrance_id").notNull(),
  priority: text("priority").default("curious"),
  matchScore: real("match_score"),
  addedAt: timestamp("added_at").defaultNow(),
});

export const wearLogs = pgTable("wear_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fragranceId: varchar("fragrance_id").notNull(),
  occasion: text("occasion"),
  notes: text("notes"),
  wornAt: timestamp("worn_at").defaultNow(),
});

export const feedPosts = pgTable("feed_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
  content: text("content"),
  fragranceId: varchar("fragrance_id"),
  rating: integer("rating"),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postLikes = pgTable("post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  accessCode: true,
});

export const insertAccessCodeSchema = createInsertSchema(accessCodes).pick({
  code: true,
  creatorName: true,
});

export const insertFragranceSchema = createInsertSchema(fragrances).omit({
  id: true,
});

export const insertVaultItemSchema = createInsertSchema(vaultItems).omit({
  id: true,
  addedAt: true,
});

export const insertToTryItemSchema = createInsertSchema(toTryItems).omit({
  id: true,
  addedAt: true,
});

export const insertWearLogSchema = createInsertSchema(wearLogs).omit({
  id: true,
  wornAt: true,
});

export const insertFeedPostSchema = createInsertSchema(feedPosts).omit({
  id: true,
  likeCount: true,
  createdAt: true,
});

export const insertPostLikeSchema = createInsertSchema(postLikes).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type AccessCode = typeof accessCodes.$inferSelect;
export type Fragrance = typeof fragrances.$inferSelect;
export type VaultItem = typeof vaultItems.$inferSelect;
export type ToTryItem = typeof toTryItems.$inferSelect;
export type WearLog = typeof wearLogs.$inferSelect;
export type FeedPost = typeof feedPosts.$inferSelect;
export type PostLike = typeof postLikes.$inferSelect;
export type InsertAccessCode = z.infer<typeof insertAccessCodeSchema>;
export type InsertFragrance = z.infer<typeof insertFragranceSchema>;
export type InsertVaultItem = z.infer<typeof insertVaultItemSchema>;
export type InsertToTryItem = z.infer<typeof insertToTryItemSchema>;
export type InsertWearLog = z.infer<typeof insertWearLogSchema>;
export type InsertFeedPost = z.infer<typeof insertFeedPostSchema>;
export type InsertPostLike = z.infer<typeof insertPostLikeSchema>;

export const ARCHETYPES = {
  "velvet-dusk": {
    name: "The Velvet Dusk",
    tagline: "Sensual, sophisticated, evening-forward",
    description: "You gravitate toward depth and drama. Your scent is a whispered invitation — rich, enveloping, and impossible to forget.",
    notes: ["oud", "amber", "rose", "sandalwood", "incense"],
    color: "#6B2D5B",
  },
  "green-wanderer": {
    name: "The Green Wanderer",
    tagline: "Outdoorsy, grounded, effortlessly cool",
    description: "Nature speaks your language. You carry the freshness of open fields and mossy trails wherever you go.",
    notes: ["vetiver", "moss", "green tea", "cedar", "bergamot"],
    color: "#2D5B3A",
  },
  "clean-canvas": {
    name: "The Clean Canvas",
    tagline: "Minimalist, serene, comfort-seeking",
    description: "Less is everything. Your signature is the quiet confidence of clean skin, soft fabric, and understated beauty.",
    notes: ["musk", "white florals", "clean woods", "skin scents"],
    color: "#8B8B8B",
  },
  "citrus-architect": {
    name: "The Citrus Architect",
    tagline: "Sharp, energized, cerebral",
    description: "You build your days with precision and light. Bright, invigorating, and always ahead of the room.",
    notes: ["neroli", "grapefruit", "yuzu", "lemon", "white pepper"],
    color: "#C4912B",
  },
  "baroque-collector": {
    name: "The Baroque Collector",
    tagline: "Maximalist, historical, a story in every bottle",
    description: "Every fragrance you own has a narrative. You are drawn to complexity, heritage, and the art of layering.",
    notes: ["leather", "tobacco", "vanilla", "patchouli", "labdanum"],
    color: "#5B2D2D",
  },
  "solar-nomad": {
    name: "The Solar Nomad",
    tagline: "Warm, radiant, forever summer",
    description: "You carry sunshine in your wake. Effortless warmth, golden skin, and the promise of an endless horizon.",
    notes: ["coconut", "tiare", "salt", "solar musks", "frangipani"],
    color: "#C47A2B",
  },
} as const;

export type ArchetypeId = keyof typeof ARCHETYPES;

export const QUIZ_SEASONS = ["Spring", "Summer", "Fall", "Winter"] as const;
export const QUIZ_SETTINGS = ["Office", "Going Out", "Travel", "Everyday", "Occasions"] as const;
export const QUIZ_SCENT_VIBES = ["Warm", "Fresh", "Mysterious", "Clean", "Earthy", "Sweet", "Powdery", "Bold", "Quiet"] as const;
export const QUIZ_NOTE_FAMILIES = [
  { id: "floral", label: "Floral", icon: "Fl", examples: "Rose, jasmine, iris" },
  { id: "woody", label: "Woody", icon: "Wd", examples: "Cedar, sandalwood, vetiver" },
  { id: "citrus", label: "Citrus", icon: "Ct", examples: "Bergamot, lemon, neroli" },
  { id: "gourmand", label: "Gourmand", icon: "Gm", examples: "Vanilla, caramel, chocolate" },
  { id: "aquatic", label: "Aquatic", icon: "Aq", examples: "Sea salt, marine, rain" },
  { id: "oriental", label: "Oriental", icon: "Or", examples: "Amber, incense, oud" },
  { id: "green", label: "Green", icon: "Gr", examples: "Moss, green tea, fig" },
  { id: "leather", label: "Leather & Tobacco", icon: "Lt", examples: "Suede, smoke, tobacco" },
] as const;
export const QUIZ_VIBES = {
  sundayMorning: {
    question: "Your ideal Sunday morning is...",
    options: ["Farmers market", "Slow coffee & a book", "Brunch with the crew", "Long run outside"],
  },
  texture: {
    question: "Pick a texture:",
    options: ["Velvet", "Linen", "Cashmere", "Worn leather", "Crisp paper"],
  },
  colorEnergy: {
    question: "Your signature color energy:",
    options: ["Deep jewel tones", "Soft neutrals", "Bold primaries", "Black, always"],
  },
  showUp: {
    question: "You show up as:",
    options: ["The calm in the room", "The energy in the room", "The mystery", "The warmth"],
  },
  decade: {
    question: "Pick a decade's aesthetic:",
    options: ["70s earthy", "80s opulent", "90s minimalist", "2000s playful", "Timeless"],
  },
} as const;

export const WEAR_OCCASIONS = ["Daily", "Date Night", "Work", "Special Event", "Travel", "Casual"] as const;

export const FAMILY_COLORS: Record<string, string> = {
  "Floral": "#E8C4D8",
  "Woody": "#8B6914",
  "Citrus": "#FFD700",
  "Gourmand": "#D2691E",
  "Aquatic": "#4A90D9",
  "Oriental": "#C7833E",
  "Green": "#5B8C5A",
  "Fresh": "#87CEEB",
  "Chypre": "#8B7355",
  "Leather": "#654321",
};
