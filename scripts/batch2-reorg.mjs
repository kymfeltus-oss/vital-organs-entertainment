import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SKIP_LIB = new Set([
  "awakening-auth-assets.ts",
  "awakening-dashboard-assets.ts",
  "awakening-program.ts",
]);

const LIB_MOVES = {
  live: [
    "attendee-chat-realtime.ts",
    "broadcast-attendee-chat-message.ts",
    "chat-author-color.ts",
    "chat-message-variant.ts",
    "fellowship-chat.ts",
    "fellowship-chat-db.ts",
    "fellowship-chat-server.ts",
    "useFellowshipChat.ts",
    "useFellowshipChatMonitor.ts",
    "useAttendeeChatRealtime.ts",
    "polls.ts",
    "polls-server.ts",
    "live-reactions.ts",
    "live-reactions-server.ts",
    "LiveStreamReactionsContext.tsx",
    "live-viewer-count.ts",
    "useLiveViewerCount.ts",
    "useLiveStreamGraphics.ts",
    "useLiveMonetizationReminder.ts",
    "useLiveElapsedTimer.ts",
    "useLiveAnnouncementRedirect.ts",
    "live-seed-monetization.ts",
    "live-stream-gate.ts",
    "live-routes.ts",
    "live-go-live-transition.ts",
    "direct-camera-live.ts",
    "stream-experiences.ts",
    "useAttendeeStreamExperiences.ts",
    "resolve-live-nav-target.ts",
    "useAttendeeLiveNavTarget.ts",
    "event-lifecycle.ts",
    "ig-live-config.ts",
    "live-pov-mock.ts",
    "useIanCraigLiveLayout.ts",
    "useIanCraigLiveSeedActions.ts",
    "useMobileLandscape.ts",
  ],
  "holding-room": [
    "holding-room-assets.ts",
    "holding-room-countdown-circles.ts",
    "holding-room-countdown-slots.ts",
    "holding-room-schedule.ts",
  ],
  dashboard: [
    "auth-layout-slots.ts",
    "dashboard-beam-position.ts",
    "load-tab-page-profile.ts",
    "fetch-attendee-profile.ts",
    "user-profile-display.ts",
    "countdown-display.ts",
    "useEventCountdown.ts",
  ],
  giving: ["giving-mobile-slots.ts"],
  intro: ["intro-assets.ts", "intro-layout-slots.ts"],
  branding: ["brand-assets.ts"],
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function write(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function hasDefaultExport(content) {
  return /export\s+default\b/.test(content);
}

function moveLibFile(fileName, featureModule) {
  const oldPath = path.join(ROOT, "lib", "experience", fileName);
  const newPath = path.join(ROOT, "lib", "features", featureModule, fileName);
  if (!fs.existsSync(oldPath)) {
    console.log(`skip missing lib file: ${fileName}`);
    return null;
  }
  const content = read(oldPath);
  if (content.includes("@deprecated Import from")) {
    console.log(`skip shim lib file: ${fileName}`);
    return null;
  }
  ensureDir(path.dirname(newPath));
  fs.renameSync(oldPath, newPath);
  return { fileName, featureModule, newPath, hasDefault: hasDefaultExport(content) };
}

function createLibShim(fileName, featureModule, hasDefault) {
  const shimPath = path.join(ROOT, "lib", "experience", fileName);
  const target = `@/lib/features/${featureModule}/${fileName.replace(/\.(ts|tsx)$/, "")}`;
  const lines = [
    `/** @deprecated Import from \`${target}\` instead. */`,
    `export * from "${target}";`,
  ];
  if (hasDefault) {
    lines.push(`export { default } from "${target}";`);
  }
  write(shimPath, `${lines.join("\n")}\n`);
}

function buildLibImportMap() {
  const map = new Map();
  for (const [featureModule, files] of Object.entries(LIB_MOVES)) {
    for (const fileName of files) {
      const base = fileName.replace(/\.(ts|tsx)$/, "");
      map.set(`@/lib/experience/${base}`, `@/lib/features/${featureModule}/${base}`);
    }
  }
  return map;
}

function rewriteImports(content, importMap) {
  let next = content;
  const entries = [...importMap.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of entries) {
    next = next.split(from).join(to);
  }
  return next;
}

function updateMovedLibImports(importMap) {
  for (const [featureModule] of Object.entries(LIB_MOVES)) {
    const dir = path.join(ROOT, "lib", "features", featureModule);
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      const filePath = path.join(dir, entry.name);
      const updated = rewriteImports(read(filePath), importMap);
      write(filePath, updated);
    }
  }
}

function moveDirectoryContents(srcRel, destRel, shimPrefix) {
  const src = path.join(ROOT, srcRel);
  const dest = path.join(ROOT, destRel);
  if (!fs.existsSync(src)) {
    console.log(`skip missing component dir: ${srcRel}`);
    return;
  }

  function walk(currentSrc, currentDest) {
    ensureDir(currentDest);
    for (const entry of fs.readdirSync(currentSrc, { withFileTypes: true })) {
      const srcPath = path.join(currentSrc, entry.name);
      const destPath = path.join(currentDest, entry.name);
      if (entry.isDirectory()) {
        walk(srcPath, destPath);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      ensureDir(path.dirname(destPath));
      fs.renameSync(srcPath, destPath);
      const relFromComponents = path
        .relative(path.join(ROOT, "components"), destPath)
        .replace(/\\/g, "/")
        .replace(/\.(ts|tsx)$/, "");
      const shimPath = path.join(currentSrc, entry.name);
      const hasDefault = hasDefaultExport(read(destPath));
      const target = `@/components/${relFromComponents}`;
      const lines = [
        `/** @deprecated Import from \`${target}\` instead. */`,
        `export * from "${target}";`,
      ];
      if (hasDefault) {
        lines.push(`export { default } from "${target}";`);
      }
      write(shimPath, `${lines.join("\n")}\n`);
    }
    const remaining = fs.readdirSync(currentSrc);
    if (remaining.length === 0) {
      fs.rmdirSync(currentSrc);
    }
  }

  walk(src, dest);
  console.log(`moved ${srcRel} -> ${destRel}`);
}

function buildComponentImportMap() {
  const map = new Map();
  const replacements = [
    ["@/components/experience/live/", "@/components/features/live/"],
    ["@/components/experience/holding-room/", "@/components/features/live/holding-room/"],
  ];
  for (const [from, to] of replacements) {
    map.set(from, to);
  }
  return map;
}

function updateAllComponentImports(importMap) {
  const roots = ["components", "app", "hooks", "lib"];
  for (const root of roots) {
    const start = path.join(ROOT, root);
    if (!fs.existsSync(start)) continue;
    walkAndUpdate(start, importMap);
  }
}

function walkAndUpdate(dir, importMap) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walkAndUpdate(full, importMap);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    const original = read(full);
    const updated = rewriteImports(original, importMap);
    if (updated !== original) {
      write(full, updated);
    }
  }
}

function updateFeatureComponentInternalImports(libImportMap, componentImportMap) {
  const start = path.join(ROOT, "components", "features");
  if (!fs.existsSync(start)) return;
  walkAndUpdate(start, new Map([...libImportMap, ...componentImportMap]));
}

// Phase 3
const moved = [];
for (const [featureModule, files] of Object.entries(LIB_MOVES)) {
  for (const fileName of files) {
    if (SKIP_LIB.has(fileName)) continue;
    const result = moveLibFile(fileName, featureModule);
    if (result) moved.push(result);
  }
}

const libImportMap = buildLibImportMap();
updateMovedLibImports(libImportMap);

for (const item of moved) {
  createLibShim(item.fileName, item.featureModule, item.hasDefault);
}

// Phase 4
moveDirectoryContents(
  path.join("components", "experience", "live"),
  path.join("components", "features", "live"),
  "live",
);
moveDirectoryContents(
  path.join("components", "experience", "holding-room"),
  path.join("components", "features", "live", "holding-room"),
  "holding-room",
);

const componentImportMap = buildComponentImportMap();
updateFeatureComponentInternalImports(libImportMap, componentImportMap);
updateAllComponentImports(componentImportMap);

// Update live shim at components/live/LiveExperienceClient.tsx
const liveShim = path.join(ROOT, "components", "live", "LiveExperienceClient.tsx");
if (fs.existsSync(liveShim)) {
  write(
    liveShim,
    'export { default } from "@/components/features/live/LiveExperienceClient";\n',
  );
}

console.log(`Batch 2 complete. Moved ${moved.length} lib files.`);
