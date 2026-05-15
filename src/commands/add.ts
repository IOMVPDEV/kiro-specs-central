import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import kleur from "kleur";
import { getTemplate, templateDir } from "../manifest.js";
import { promptVars } from "../render/prompts.js";
import { render } from "../render/handlebars.js";
import { appendAddedTemplate, loadConfig } from "../config.js";
import { buildContext } from "../context.js";
import type { AddedTemplate } from "../types.js";

interface AddOptions {
  readonly force?: boolean;
}

type VarValue = string | boolean;

function resolveSpecName(vars: Record<string, VarValue>, templateName: string): string {
  if (typeof vars["featureName"] === "string") return vars["featureName"];
  if (typeof vars["businessDomain"] === "string" && typeof vars["tableName"] === "string") {
    return `${vars["businessDomain"]}-${vars["tableName"]}`;
  }
  if (typeof vars["businessDomain"] === "string" && typeof vars["serviceDomain"] === "string") {
    return `${vars["businessDomain"]}-${vars["serviceDomain"]}`;
  }
  return templateName;
}

export async function runAdd(
  cwd: string,
  templateName: string,
  options: AddOptions,
): Promise<void> {
  if (!loadConfig(cwd)) {
    console.log(kleur.red("Not initialized. Run: kiro-specs init"));
    process.exitCode = 1;
    return;
  }

  const manifest = getTemplate(templateName);
  const dir = templateDir(templateName);

  console.log(kleur.cyan(`Adding template: ${manifest.name}`));
  console.log(kleur.gray(manifest.description));

  const vars = await promptVars(manifest.vars);
  const context = buildContext(vars);

  for (const f of manifest.files) {
    const srcPath = join(dir, f.src);
    const raw = readFileSync(srcPath, "utf8");
    const renderedDest = render(f.dest, context);
    const destPath = join(cwd, renderedDest);

    if (existsSync(destPath) && !options.force) {
      console.log(kleur.yellow(`Skip (exists): ${renderedDest}`));
      continue;
    }

    const rendered = render(raw, context);
    mkdirSync(dirname(destPath), { recursive: true });
    writeFileSync(destPath, rendered, "utf8");
    console.log(kleur.green(`Created: ${renderedDest}`));
  }

  const added: AddedTemplate = {
    template: manifest.name,
    specName: resolveSpecName(vars, manifest.name),
    addedAt: new Date().toISOString(),
    vars,
  };
  appendAddedTemplate(cwd, added);
  console.log(kleur.green().bold("Done."));
}
