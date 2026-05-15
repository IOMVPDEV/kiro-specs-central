export type TemplateCategory =
  | "lambda"
  | "apigw"
  | "platform"
  | "stepfunctions";

export type VarType = "string" | "boolean" | "select";

export interface TemplateVar {
  readonly name: string;
  readonly prompt: string;
  readonly type: VarType;
  readonly required?: boolean;
  readonly default?: string | boolean;
  readonly choices?: readonly string[];
  readonly when?:
    | { readonly var: string; readonly equals: string | boolean; readonly in?: undefined }
    | { readonly var: string; readonly in: readonly string[]; readonly equals?: undefined };
}

export interface TemplateFile {
  readonly src: string;
  readonly dest: string;
}

export interface TemplateManifest {
  readonly name: string;
  readonly description: string;
  readonly category: TemplateCategory;
  readonly vars: readonly TemplateVar[];
  readonly files: readonly TemplateFile[];
}

export interface KiroProjectConfig {
  readonly version: string;
  readonly templatesSource: string;
  readonly addedTemplates: readonly AddedTemplate[];
}

export interface AddedTemplate {
  readonly template: string;
  readonly specName: string;
  readonly addedAt: string;
  readonly vars: Readonly<Record<string, string | boolean>>;
}
