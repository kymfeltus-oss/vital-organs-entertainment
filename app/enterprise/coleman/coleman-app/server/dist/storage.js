"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initStorage = initStorage;
exports.getUploadsDir = getUploadsDir;
exports.resolveUploadPath = resolveUploadPath;
exports.inferStemType = inferStemType;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const UPLOADS_DIR = path_1.default.join(__dirname, "..", "uploaded_assets");
function initStorage() {
    if (!fs_1.default.existsSync(UPLOADS_DIR)) {
        fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
}
function getUploadsDir() {
    initStorage();
    return UPLOADS_DIR;
}
function resolveUploadPath(filename) {
    initStorage();
    const safeName = path_1.default.basename(filename);
    const fullPath = path_1.default.join(UPLOADS_DIR, safeName);
    if (!fullPath.startsWith(UPLOADS_DIR)) {
        return null;
    }
    if (!fs_1.default.existsSync(fullPath)) {
        return null;
    }
    return fullPath;
}
function inferStemType(fileName) {
    const lower = fileName.toLowerCase();
    if (lower.includes("click"))
        return "Click";
    if (lower.includes("cue"))
        return "Cue";
    if (lower.includes("pad"))
        return "Pad";
    if (lower.includes("loop"))
        return "Loop";
    if (lower.includes("keys"))
        return "Keys";
    if (lower.includes("drums"))
        return "Drums";
    if (lower.includes("bass"))
        return "Bass";
    return "Other";
}
