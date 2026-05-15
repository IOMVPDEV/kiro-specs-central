import kleur from "kleur";
import { listTemplates } from "../manifest.js";

export function runList(): void {
  const templates = listTemplates();
  if (templates.length === 0) {
    console.log(kleur.yellow("No templates found."));
    return;
  }
  const byCategory = new Map<string, typeof templates>();
  for (const t of templates) {
    const arr = byCategory.get(t.category) ?? [];
    arr.push(t);
    byCategory.set(t.category, arr);
  }
  for (const [category, items] of byCategory) {
    console.log(kleur.bold().cyan(`\n${category}`));
    for (const t of items) {
      console.log(`  ${kleur.green(t.name)} — ${t.description}`);
    }
  }
}
