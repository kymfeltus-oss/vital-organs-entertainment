"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const path_1 = __importDefault(require("path"));
function loadPrismaClient() {
    const clientPath = path_1.default.join(__dirname, "../../../../lib/generated/prisma");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require(clientPath);
    return module.PrismaClient;
}
const globalForPrisma = globalThis;
const PrismaClient = loadPrismaClient();
exports.prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
