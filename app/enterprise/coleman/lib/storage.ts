import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "app/enterprise/coleman/data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploaded_assets");

function ensureUploadsDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export function initColemanStorage() {
  ensureUploadsDir();
}

export function resolveUploadPath(filename: string): string | null {
  ensureUploadsDir();
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

export function saveUploadedFile(
  originalName: string,
  buffer: Buffer,
): string {
  ensureUploadsDir();
  const timestamp = Date.now();
  const cleanName = originalName.replace(/[^\w.\-()+]/g, "_");
  const filename = `${timestamp}-${cleanName}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return filename;
}

export function deleteUploadedFile(filename: string): boolean {
  const fullPath = resolveUploadPath(filename);
  if (!fullPath) {
    return false;
  }
  fs.unlinkSync(fullPath);
  return true;
}
