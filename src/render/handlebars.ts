import Handlebars from "handlebars";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { PARTIALS_ROOT } from "../manifest.js";

let registered = false;

function registerHelpers(): void {
  Handlebars.registerHelper(
    "eq",
    function (this: unknown, a: unknown, b: unknown, options?: Handlebars.HelperOptions) {
      const equal = a === b;
      if (options && typeof options.fn === "function") {
        return equal ? options.fn(this) : options.inverse(this);
      }
      return equal;
    },
  );
  Handlebars.registerHelper("not", (a: unknown) => !a);
  Handlebars.registerHelper("kebab", (s: string) =>
    s
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/\s+/g, "-")
      .toLowerCase(),
  );
  Handlebars.registerHelper("pascal", (s: string) =>
    s
      .replace(/[-_\s]+(.)?/g, (_, c: string | undefined) =>
        c ? c.toUpperCase() : "",
      )
      .replace(/^./, (c) => c.toUpperCase()),
  );
  Handlebars.registerHelper("camel", (s: string) => {
    const pascal = s
      .replace(/[-_\s]+(.)?/g, (_, c: string | undefined) =>
        c ? c.toUpperCase() : "",
      )
      .replace(/^./, (c) => c.toUpperCase());
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  });
  Handlebars.registerHelper("upper", (s: string) => s.toUpperCase());
  Handlebars.registerHelper("snake", (s: string) =>
    s
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/[-\s]+/g, "_")
      .toLowerCase(),
  );
  Handlebars.registerHelper(
    "times",
    function (
      this: unknown,
      n: string | number,
      options: Handlebars.HelperOptions,
    ) {
      const count = parseInt(String(n), 10);
      let result = "";
      for (let i = 0; i < count; i++) {
        result += options.fn({ index: i + 1, index0: i });
      }
      return result;
    },
  );
  Handlebars.registerHelper("gt", (a: string | number, b: string | number) =>
    Number(a) > Number(b),
  );
  Handlebars.registerHelper("add", (a: string | number, b: string | number) =>
    Number(a) + Number(b),
  );
}

function registerPartials(): void {
  const entries = readdirSync(PARTIALS_ROOT);
  for (const entry of entries) {
    const full = join(PARTIALS_ROOT, entry);
    if (!statSync(full).isFile()) continue;
    if (extname(entry) !== ".hbs") continue;
    const name = basename(entry, ".md.hbs").replace(/\.hbs$/, "");
    const content = readFileSync(full, "utf8");
    Handlebars.registerPartial(name, content);
  }
}

export function init(): void {
  if (registered) return;
  registerHelpers();
  registerPartials();
  registered = true;
}

export function render(
  template: string,
  context: Readonly<Record<string, unknown>>,
): string {
  init();
  const compiled = Handlebars.compile(template, { noEscape: true });
  return compiled(context);
}
