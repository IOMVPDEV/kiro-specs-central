import { existsSync } from "node:fs";
import kleur from "kleur";
import { saveConfig, configPath } from "../config.js";
import type { KiroProjectConfig } from "../types.js";

interface PackageJsonShape {
  readonly version?: string;
}

async function packageVersion(): Promise<string> {
  try {
    const url = new URL("../../package.json", import.meta.url);
    const { readFile } = await import("node:fs/promises");
    const raw = await readFile(url, "utf8");
    const parsed = JSON.parse(raw) as PackageJsonShape;
    return parsed.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export async function runInit(cwd: string): Promise<void> {
  const p = configPath(cwd);
  if (existsSync(p)) {
    console.log(kleur.yellow(`Already initialized: ${p}`));
    return;
  }
  const version = await packageVersion();
  const cfg: KiroProjectConfig = {
    version,
    templatesSource: "@iomvpdev/kiro-specs",
    addedTemplates: [],
  };
  saveConfig(cwd, cfg);
  console.log(kleur.green(`Initialized kiro-specs: ${p}`));
}
