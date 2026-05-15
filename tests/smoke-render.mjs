import { readFileSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { render } from "../dist/render/handlebars.js";
import { getTemplate, templateDir } from "../dist/manifest.js";
import { buildContext } from "../dist/context.js";

const SMOKE_OUT = resolve(process.cwd(), "tests/.out");
rmSync(SMOKE_OUT, { recursive: true, force: true });
mkdirSync(SMOKE_OUT, { recursive: true });

function renderTemplate(name, vars) {
  const manifest = getTemplate(name);
  const dir = templateDir(name);
  const context = buildContext({ ...vars });
  for (const f of manifest.files) {
    const srcPath = join(dir, f.src);
    const raw = readFileSync(srcPath, "utf8");
    const destRel = render(f.dest, context);
    const out = render(raw, context);
    const destPath = join(SMOKE_OUT, name, destRel);
    mkdirSync(dirname(destPath), { recursive: true });
    writeFileSync(destPath, out, "utf8");
    console.log(`OK ${name} -> ${destRel}`);
  }
}

renderTemplate("lambda-http-handler", {
  featureName: "create-user",
  httpMethod: "POST",
  resourcePath: "/users",
  authRequired: true,
  persistsToDynamo: true,
  publishesEvent: true,
  env: "dev",
});

// dyn-sale-custmr-offer-events — mirrors real example (events table, streams, 1 GSI)
renderTemplate("platform-dynamodb-table", {
  businessDomain: "sale",
  serviceDomain: "custmr-offer",
  tableName: "events",
  owner: "trinity",
  journey: "checkout",
  feature: "offer-creation",
  versionProject: "01",
  hashKeyName: "source",
  hashKeyType: "S",
  hasRangeKey: true,
  rangeKeyName: "id",
  rangeKeyType: "N",
  billingMode: "PAY_PER_REQUEST",
  tableClass: "STANDARD",
  deletionProtectionEnabled: true,
  ttlEnabled: true,
  ttlAttributeName: "expireAt",
  streamEnabled: true,
  streamViewType: "NEW_AND_OLD_IMAGES",
  gsiCount: "1",
  lsiCount: "0",
  enableResourcePolicy: true,
  pciAccountId: "123456789012",
  enableKinesisDestination: false,
});

// platform-dynamodb-service: sale/custmr-offer — 2 tables (events + view), mirrors real example
renderTemplate("platform-dynamodb-service", {
  businessDomain: "sale",
  serviceDomain: "custmr-offer",
  owner: "trinity",
  journey: "checkout",
  feature: "offer-management",
  versionProject: "01",
  tableCount: "2",
  // Table 1: events
  t1Name: "events",
  t1HashKey: "source",
  t1HashKeyType: "S",
  t1HasRangeKey: true,
  t1RangeKey: "id",
  t1RangeKeyType: "N",
  t1GsiCount: "1",
  t1StreamEnabled: true,
  t1StreamViewType: "NEW_AND_OLD_IMAGES",
  t1TtlEnabled: true,
  t1TtlAttr: "expireAt",
  t1ResourcePolicy: true,
  t1PciAccount: "123456789012",
  // Table 2: view
  t2Name: "view",
  t2HashKey: "PK",
  t2HashKeyType: "S",
  t2HasRangeKey: true,
  t2RangeKey: "SK",
  t2RangeKeyType: "S",
  t2GsiCount: "3",
  t2StreamEnabled: false,
  t2TtlEnabled: true,
  t2TtlAttr: "expireAt",
  t2ResourcePolicy: false,
});

// dyn-sale-custmr-offer-view — single-table PK/SK, 3 GSIs, no streams
renderTemplate("platform-dynamodb-table", {
  businessDomain: "sale",
  serviceDomain: "custmr-offer",
  tableName: "view",
  owner: "trinity",
  journey: "checkout",
  feature: "offer-view",
  versionProject: "01",
  hashKeyName: "PK",
  hashKeyType: "S",
  hasRangeKey: true,
  rangeKeyName: "SK",
  rangeKeyType: "S",
  billingMode: "PAY_PER_REQUEST",
  tableClass: "STANDARD",
  deletionProtectionEnabled: true,
  ttlEnabled: true,
  ttlAttributeName: "expireAt",
  streamEnabled: false,
  gsiCount: "3",
  lsiCount: "0",
  enableResourcePolicy: false,
  enableKinesisDestination: false,
});

console.log("\nSmoke render OK. Output dir:", SMOKE_OUT);
