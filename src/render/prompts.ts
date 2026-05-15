import inquirer from "inquirer";
import type { TemplateVar } from "../types.js";

type VarValue = string | boolean;

export async function promptVars(
  vars: readonly TemplateVar[],
): Promise<Record<string, VarValue>> {
  const answers: Record<string, VarValue> = {};
  for (const v of vars) {
    if (v.when) {
      const dep = answers[v.when.var];
      if (v.when.in !== undefined) {
        if (!v.when.in.includes(String(dep))) continue;
      } else {
        if (dep !== v.when.equals) continue;
      }
    }
    answers[v.name] = await askOne(v, answers);
  }
  return answers;
}

async function askOne(
  v: TemplateVar,
  _answers: Readonly<Record<string, VarValue>>,
): Promise<VarValue> {
  if (v.type === "boolean") {
    const defaultValue = typeof v.default === "boolean" ? v.default : false;
    const { value } = await inquirer.prompt<{ value: boolean }>([
      {
        type: "confirm",
        name: "value",
        message: v.prompt,
        default: defaultValue,
      },
    ]);
    return value;
  }
  if (v.type === "select") {
    const choices = v.choices ?? [];
    const defaultValue =
      typeof v.default === "string" ? v.default : (choices[0] ?? "");
    const { value } = await inquirer.prompt<{ value: string }>([
      {
        type: "list",
        name: "value",
        message: v.prompt,
        choices: [...choices],
        default: defaultValue,
      },
    ]);
    return value;
  }
  const base = {
    type: "input" as const,
    name: "value" as const,
    message: v.prompt,
    validate: (input: string): true | string => {
      if (v.required && !input.trim()) return "Required";
      return true;
    },
  };
  const question =
    typeof v.default === "string" ? { ...base, default: v.default } : base;
  const { value } = await inquirer.prompt<{ value: string }>([question]);
  return value;
}
