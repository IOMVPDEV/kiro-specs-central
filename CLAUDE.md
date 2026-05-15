# CLAUDE.md — kiro-specs-central

Agent guidance for continuing work on `@iomvpdev/kiro-specs`.

## What this repo is

A CLI + template registry distributed as the npm package `@iomvpdev/kiro-specs`. It scaffolds Kiro spec files (`.kiro/specs/<feature>/{requirements,design,tasks}.md`) into AWS CDK consumer repos. Templates are Handlebars-rendered with parameterized prompts.

Owner context: `iomvpdev` ships AWS infrastructure across multiple repos. **IaC differs by repo type:**

- **Platform repos** (`io-*-platform-*`): Terraform modules from Terraform Cloud private registry (`app.terraform.io/IO-BANKING/...`). No CDK. Resources: DynamoDB, S3, Parameter Store, Secrets Manager, EventBridge rules, SNS topics.
- **Lambda / service repos**: AWS CDK in TypeScript, hexagonal architecture (Inversify), Middy v5, Powertools, Jest + jest-mock-extended.
- **Step Functions repos**: AWS CDK in TypeScript.

Templates for `platform-*` category must target Terraform, not CDK.

## Stack

- Node 20+, TypeScript strict + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`.
- ESM only (`"type": "module"`). Use `.js` extensions in relative imports even from `.ts` source.
- Deps: `commander`, `inquirer` v10, `handlebars`, `kleur`. Dev: `tsx`, `jest`, `jest-mock-extended`, `ts-jest`.
- Output: `dist/cli.js` is the bin entry. `bin/kiro-specs` points there.

## Repo layout

```
src/
  cli.ts                 # commander entry
  commands/{init,list,add}.ts
  render/handlebars.ts   # helpers + partial autoload
  render/prompts.ts      # inquirer driver
  manifest.ts            # reads templates/*/template.json
  config.ts              # .kiro/.kirorc.json lifecycle
  types.ts               # TemplateManifest, TemplateVar, KiroProjectConfig
templates/<name>/
  template.json
  requirements.md.hbs
  design.md.hbs
  tasks.md.hbs
partials/<name>.md.hbs   # shared fragments, autoloaded as `<name>`
tests/smoke-render.mjs   # renders seed templates with mock vars
```

## Conventions

### Handlebars

- Helpers registered in `src/render/handlebars.ts`: `pascal`, `camel`, `kebab`, `snake`, `upper`, `eq` (dual-use block + inline), `not`, `times` (block, generates N iterations), `gt` (numeric >), `add` (numeric +).
- Partials are auto-discovered from `partials/`. Filename `foo.md.hbs` → partial name `foo`. Reference with `{{> foo}}`.
- **`eq` is a custom block helper.** Use `{{#eq var "value"}}…{{/eq}}`. Do NOT assume vanilla Handlebars `#eq` exists — it's our helper. Inline form (`{{#if (eq a b)}}`) also works.
- **`times` block helper**: `{{#times gsiCount}}<content using {{index}} (1-based) and {{index0}} (0-based)>{{/times}}`. String or number input.
- **`gt` inline**: `{{#if (gt gsiCount "0")}}…{{/if}}` — numeric comparison (both args coerced to Number).
- New helpers must be pure, return `string` or `boolean`, and stay framework-agnostic.

### Templates

- Always render three files: `requirements.md`, `design.md`, `tasks.md`. Destination pattern: `.kiro/specs/<name>/...`. The `<name>` segment is derived from `featureName` (lambda/apigw) or `dyn-{businessDomain}-{serviceDomain}-{tableName}` (platform DynamoDB).
- Compose with partials wherever content overlaps another template. Add a new partial before duplicating prose.
- **Lambda / APIGW / StepFunctions templates**: target AWS CDK TypeScript + hex arch + Inversify + Middy + Powertools. No SAM/Serverless Framework.
- **Platform templates** (DynamoDB, S3, etc.): target Terraform + `IO-BANKING` private registry modules. Show real Terraform module blocks, real variable names, real naming convention.
- Security defaults: KMS CMK > AWS-managed, least-privilege IAM, no `dynamodb:Scan` for services, no secrets in env vars, CloudWatch alarms required.
- Acceptance criteria sections must be concrete and checkable (`[ ]`), not aspirational.

### Platform DynamoDB template — key facts (from real examples)

- Module: `app.terraform.io/IO-BANKING/cloud-dynamodb/module` — latest stable was `0.0.17`.
- Naming: `dyn-{env}-io-{business_domain}-{service_domain}-{name}-{version_project}`.
- Vars: `business_domain`, `service_domain`, `version_project`, `owner`, `journey`, `feature`, `project_name` (always "io"), `prefix_table_name` (always "dyn").
- PITR: hardcoded enabled inside module — no var needed.
- KMS: always `data.aws_kms_key.dynamodb.arn` via data source — alias `alias/io-{env}-dynamodb`.
- SSM param path pattern: `/io/{env}/{business_domain}/{service_domain}/{table_name}/{key}`.
- `pci_account` always comes from Terraform Cloud workspace variable (secret injection) — never hardcoded.
- Real examples: `dyn-sale-custmr-offer-events-01` (PK=source/S, SK=id/N, streams=true, 1 GSI by-author), `dyn-sale-custmr-offer-view-01` (PK=PK/S, SK=SK/S, 3 GSIs: by-SK, by-username, by-username-by-type).

### CLI

- All commands take an explicit `cwd` (`process.cwd()` from `cli.ts`); commands themselves accept `cwd` as a param so they're unit-testable.
- `add` reads the manifest, runs `promptVars`, renders each file's `src` content AND its `dest` path through Handlebars (path templating), then writes. Existing files are skipped unless `--force`.
- `init` writes `.kiro/.kirorc.json`. `loadConfig` returns `null` if missing — `appendAddedTemplate` throws if not initialized.

### TypeScript strictness gotchas

- `exactOptionalPropertyTypes: true` blocks `default: undefined`. In `prompts.ts` we build the question object conditionally (spread `default` only when defined). Keep that pattern when adding new prompt types.
- `noUncheckedIndexedAccess` requires fallback for `array[i]` access (e.g. `choices[0] ?? ""`).

## Workflow

```bash
npm install
npm run build               # tsc → dist/
npm run dev -- list         # run CLI from src via tsx
node tests/smoke-render.mjs # render both seed templates with mock vars
```

When adding a template, **always** append a smoke render call in `tests/smoke-render.mjs` covering all conditional branches.

## Status (as of 2026-05-14)

### Completed (Phase 1 MVP)

- Repo scaffold, package.json, strict tsconfig, .gitignore/.npmignore.
- CLI with `init`, `list`, `add` (no `update` yet).
- Render engine: helpers, partial autoload, dual-use `eq` block helper.
- Inquirer prompts with conditional `when` support.
- 6 partials: `hex-layers`, `observability`, `error-handling`, `testing-strategy`, `cdk-stack-pattern`, `terraform-naming`.
- 2 seed templates: `lambda-http-handler` (CDK), `platform-dynamodb-table` (Terraform, fully rebuilt from real examples).
- Smoke test exercising both templates with all conditionals true.
- Build clean, smoke render clean.

### Pending (Phase 2)

Templates to add — same three-file structure, reuse existing partials, add smoke render entry per template:

- **lambda**: `lambda-event-handler` (SQS/SNS/EventBridge + DLQ + partial batch failures), `lambda-stream-processor` (DynamoDB Streams / Kinesis + idempotency), `lambda-scheduled-job` (EventBridge cron).
- **apigw**: `apigw-rest-api` (REST + Cognito or Lambda authorizer + WAF + usage plans), `apigw-http-api` (HTTP API v2 + JWT authorizer), `apigw-private-api` (VPC endpoint).
- **platform**: `platform-s3-bucket` (versioning + lifecycle + encryption + replication + access logs), `platform-parameter-store` (hierarchy `/env/service/key` + KMS), `platform-secrets-manager` (secret + rotation Lambda + resource policies).
- **stepfunctions**: `stepfunctions-workflow` (state machine std/express), `stepfunctions-saga` (compensation + idempotency + DLQ).

### Pending (Phase 3+)

- `update` command with 3-way diff/merge vs original template at the version recorded in `.kirorc.json`.
- Real Jest tests (replace smoke script — currently a `.mjs` shim because the package is ESM and Jest+ts-jest+ESM needs config).
- GitHub Actions: lint + build + smoke render on PR; publish on tag.
- Composable mixins: optional add-ons (`--with observability,dlq`) that splice extra sections.

### Open decisions

- NPM publish: public or private (CodeArtifact)? Default assumed public.
- Versioning policy for templates vs CLI (independent or coupled).

## Anti-patterns to avoid

- Don't bake feature-specific copy into partials. Partials are universal fragments.
- Don't add a GSI in a `platform-dynamodb-table` template change without a documented access pattern row.
- Don't introduce framework alternatives (SAM, Serverless Framework, AWS SAM CLI). This stack is CDK-only.
- Don't render trailing whitespace or empty conditional blocks. Test conditionals with both `true` and `false` paths in smoke render.
- Don't bypass `requirements → design → tasks` triplet. Every template ships all three.

## Quick reference

- Add template: `templates/<name>/template.json` + 3 `.hbs` files + entry in `tests/smoke-render.mjs`.
- Add helper: edit `src/render/handlebars.ts::registerHelpers`. Pure functions only.
- Add partial: drop `partials/<name>.md.hbs`. Reference as `{{> name}}`.
- Test rendering: `npm run build && node tests/smoke-render.mjs`.
- Run CLI without build: `npm run dev -- <command>`.
