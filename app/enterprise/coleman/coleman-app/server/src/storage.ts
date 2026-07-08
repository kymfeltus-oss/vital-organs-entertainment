import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(__dirname, "..", "uploaded_assets");

export function initStorage() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export function getUploadsDir(): string {
  initStorage();
  return UPLOADS_DIR;
}

import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(__dirname, "..", "uploaded_assets");

export function initStorage() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export function getUploadsDir(): string {
  initStorage();
  return UPLOADS_DIR;
}

export function resolveUploadPath(filename: string): string | null {
  initStorage();
  const safeName = path.basename(filename);
  const fullPath = path.join(UPLOADS_DIR, safeName);
  if (!fullPath.startsWith(UPLOADS_DIR)) {
    return null;
  }
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  return fullPath;
}

export function deleteUploadedFile(filename: string): boolean {
  const fullPath = resolveUploadPath(filename);
  if (!fullPath) {
    return false;
  }
  fs.unlinkSync(fullPath);
  return true;
}

export function inferStemType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("click")) return "Click";
  if (lower.includes("cue")) return "Cue";
  if (lower.includes("pad")) return "Pad";
  if (lower.includes("loop")) return "Loop";
  if (lower.includes("keys")) return "Keys";
  if (lower.includes("drums")) return "Drums";
  if (lower.includes("bass")) return "Bass";
  return "Other";
}
