#!/usr/bin/env node
import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runList } from "./commands/list.js";
import { runAdd } from "./commands/add.js";

const program = new Command();

program
  .name("kiro-specs")
  .description("Reusable Kiro specs templates for AWS CDK projects")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize kiro-specs in current project")
  .action(async () => {
    await runInit(process.cwd());
  });

program
  .command("list")
  .description("List available templates")
  .action(() => {
    runList();
  });

program
  .command("add <template>")
  .description("Add a template spec to .kiro/specs/")
  .option("-f, --force", "Overwrite existing files", false)
  .action(async (template: string, opts: { force?: boolean }) => {
    await runAdd(process.cwd(), template, { force: opts.force ?? false });
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(msg);
  process.exit(1);
});
