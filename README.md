# @iomvpdev/kiro-specs

Reusable [Kiro](https://kiro.dev) specs templates for AWS CDK projects. A central source of truth for `requirements.md` / `design.md` / `tasks.md` across the iomvpdev infrastructure repos (lambdas, API Gateway, platform resources, Step Functions).

This package distributes a CLI that renders parameterized Handlebars templates into a target project's `.kiro/specs/<feature>/` directory.

---

## Why

Across repos we repeatedly bootstrap the same kinds of features:

- HTTP Lambdas behind API Gateway (hex arch + Middy)
- Event-driven Lambdas (SQS / EventBridge / Streams)
- Platform resources (DynamoDB, S3, Parameter Store, Secrets Manager)
- Step Functions workflows / sagas

Each one starts with the same set of decisions: requirements, hex layers, observability, IAM least-privilege, CDK stack layout, testing strategy. This repo encodes those decisions as reusable Kiro specs so a new feature in any consumer repo can be scaffolded in seconds with the right starting point.

---

## Install

In a consumer project:

```bash
npm install --save-dev @iomvpdev/kiro-specs
# or run on-demand without installing
npx @iomvpdev/kiro-specs <command>
```

Requires Node 20+.

---

## Usage

### 1. Initialize

```bash
npx @iomvpdev/kiro-specs init
```

Creates `.kiro/.kirorc.json` tracking the templates source and added specs.

### 2. List available templates

```bash
npx @iomvpdev/kiro-specs list
```

### 3. Add a template

```bash
npx @iomvpdev/kiro-specs add lambda-http-handler
```

Prompts for template variables (feature name, HTTP method, auth flags, etc.) and renders into `.kiro/specs/<featureName>/`.

Use `--force` to overwrite existing files.

---

## Template catalog

| Template | Category | Status |
|----------|----------|--------|
| `lambda-http-handler` | lambda | ✅ available |
| `platform-dynamodb-table` | platform | ✅ available |
| `lambda-event-handler` | lambda | 🚧 phase 2 |
| `lambda-stream-processor` | lambda | 🚧 phase 2 |
| `lambda-scheduled-job` | lambda | 🚧 phase 2 |
| `apigw-rest-api` | apigw | 🚧 phase 2 |
| `apigw-http-api` | apigw | 🚧 phase 2 |
| `platform-s3-bucket` | platform | 🚧 phase 2 |
| `platform-parameter-store` | platform | 🚧 phase 2 |
| `platform-secrets-manager` | platform | 🚧 phase 2 |
| `stepfunctions-workflow` | stepfunctions | 🚧 phase 2 |
| `stepfunctions-saga` | stepfunctions | 🚧 phase 2 |

---

## Architecture

```
kiro-specs-central/
├── src/
│   ├── cli.ts                  # commander entry, registers commands
│   ├── commands/
│   │   ├── init.ts             # write .kiro/.kirorc.json
│   │   ├── list.ts             # list templates grouped by category
│   │   └── add.ts              # prompts → render → write
│   ├── render/
│   │   ├── handlebars.ts       # helpers + partial registration
│   │   └── prompts.ts          # inquirer prompt loop with `when` conditions
│   ├── manifest.ts             # template registry (reads templates/*/template.json)
│   ├── config.ts               # .kirorc.json read/write
│   └── types.ts                # TemplateManifest, TemplateVar, etc.
├── templates/
│   └── <name>/
│       ├── template.json       # { name, description, category, vars[], files[] }
│       ├── requirements.md.hbs
│       ├── design.md.hbs
│       └── tasks.md.hbs
├── partials/                   # shared Handlebars partials
│   ├── hex-layers.md.hbs
│   ├── observability.md.hbs
│   ├── error-handling.md.hbs
│   ├── testing-strategy.md.hbs
│   └── cdk-stack-pattern.md.hbs
└── tests/
    └── smoke-render.mjs        # renders both seed templates with mock vars
```

### Handlebars helpers

| Helper | Example | Output |
|--------|---------|--------|
| `pascal` | `{{pascal "create-user"}}` | `CreateUser` |
| `camel` | `{{camel "create-user"}}` | `createUser` |
| `kebab` | `{{kebab "CreateUser"}}` | `create-user` |
| `snake` | `{{snake "createUser"}}` | `create_user` |
| `upper` | `{{upper "create_user"}}` | `CREATE_USER` |
| `eq` (block + inline) | `{{#eq billingMode "PROVISIONED"}}…{{/eq}}` | conditional block |
| `not` | `{{#if (not authRequired)}}…{{/if}}` | negation |

### Partials

Files in `partials/*.md.hbs` are auto-registered with name = filename minus `.md.hbs`. Use with `{{> partialName}}`.

---

## Authoring a new template

1. Create `templates/<name>/`.
2. Add `template.json`:

   ```json
   {
     "name": "<name>",
     "description": "Short, action-oriented description.",
     "category": "lambda | apigw | platform | stepfunctions",
     "vars": [
       { "name": "featureName", "prompt": "Feature name:", "type": "string", "required": true },
       { "name": "needsAuth", "prompt": "Requires auth?", "type": "boolean", "default": true },
       { "name": "env", "prompt": "Env:", "type": "select", "choices": ["dev","qa","prod"], "default": "dev" }
     ],
     "files": [
       { "src": "requirements.md.hbs", "dest": ".kiro/specs/{{featureName}}/requirements.md" },
       { "src": "design.md.hbs", "dest": ".kiro/specs/{{featureName}}/design.md" },
       { "src": "tasks.md.hbs", "dest": ".kiro/specs/{{featureName}}/tasks.md" }
     ]
   }
   ```

3. Author `requirements.md.hbs`, `design.md.hbs`, `tasks.md.hbs`. Reference shared partials with `{{> hex-layers}}`, `{{> observability}}`, etc.
4. Add an entry to `tests/smoke-render.mjs` with realistic mock vars to verify rendering.
5. Run `npm run build && node tests/smoke-render.mjs` and inspect output.

### Var types

- `string` — free text. Supports `required` and `default`.
- `boolean` — confirm prompt. `default: true | false`.
- `select` — list prompt. Requires `choices: string[]`. Supports `default`.
- `when: { var, equals }` — only ask if a previous answer matches.

---

## Development

```bash
npm install
npm run build          # compile TS → dist/
npm run dev -- list    # run CLI from source (tsx)
node tests/smoke-render.mjs  # render seed templates with mock vars
```

### Publishing

```bash
npm version patch|minor|major
npm publish --access public   # @iomvpdev/kiro-specs is a scoped package
```

`prepublishOnly` cleans + rebuilds. `.npmignore` keeps only `dist/`, `templates/`, `partials/` in the published tarball.

---

## License

MIT
