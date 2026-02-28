import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  extractFramesIfNeeded();

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

  return httpServer;
}
