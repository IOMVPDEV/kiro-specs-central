import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { TemplateManifest } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const TEMPLATES_ROOT = resolve(__dirname, "..", "templates");
export const PARTIALS_ROOT = resolve(__dirname, "..", "partials");

export function listTemplates(): TemplateManifest[] {
  const entries = readdirSync(TEMPLATES_ROOT);
  const manifests: TemplateManifest[] = [];
  for (const entry of entries) {
    const dir = join(TEMPLATES_ROOT, entry);
    if (!statSync(dir).isDirectory()) continue;
    const manifestPath = join(dir, "template.json");
    try {
      const raw = readFileSync(manifestPath, "utf8");
      manifests.push(JSON.parse(raw) as TemplateManifest);
    } catch {
      // skip entries without valid template.json
    }
  }
  return manifests.sort((a, b) => a.name.localeCompare(b.name));
}

export function getTemplate(name: string): TemplateManifest {
  const dir = join(TEMPLATES_ROOT, name);
  const manifestPath = join(dir, "template.json");
  const raw = readFileSync(manifestPath, "utf8");
  return JSON.parse(raw) as TemplateManifest;
}

export function templateDir(name: string): string {
  return join(TEMPLATES_ROOT, name);
}
