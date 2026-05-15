import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { KiroProjectConfig, AddedTemplate } from "./types.js";

const CONFIG_REL_PATH = ".kiro/.kirorc.json";

export function configPath(cwd: string): string {
  return join(cwd, CONFIG_REL_PATH);
}

export function loadConfig(cwd: string): KiroProjectConfig | null {
  const p = configPath(cwd);
  if (!existsSync(p)) return null;
  const raw = readFileSync(p, "utf8");
  return JSON.parse(raw) as KiroProjectConfig;
}

export function saveConfig(cwd: string, cfg: KiroProjectConfig): void {
  const p = configPath(cwd);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(cfg, null, 2) + "\n", "utf8");
}

export function appendAddedTemplate(
  cwd: string,
  added: AddedTemplate,
): KiroProjectConfig {
  const current = loadConfig(cwd);
  if (!current) {
    throw new Error("kiro-specs not initialized. Run: kiro-specs init");
  }
  const next: KiroProjectConfig = {
    ...current,
    addedTemplates: [...current.addedTemplates, added],
  };
  saveConfig(cwd, next);
  return next;
}
