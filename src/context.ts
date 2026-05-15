type VarValue = string | boolean;

export interface TableContext {
  readonly index: number;
  readonly name: string;
  readonly hashKey: string;
  readonly hashKeyType: string;
  readonly hasRangeKey: boolean;
  readonly rangeKey: string;
  readonly rangeKeyType: string;
  readonly gsiCount: string;
  readonly streamEnabled: boolean;
  readonly streamViewType: string;
  readonly ttlEnabled: boolean;
  readonly ttlAttr: string;
  readonly resourcePolicy: boolean;
  readonly pciAccount: string;
}

export function buildContext(
  vars: Record<string, VarValue>,
): Record<string, unknown> {
  if (!("tableCount" in vars)) return { ...vars };

  const count = parseInt(String(vars["tableCount"]), 10);
  const tables: TableContext[] = [];

  for (let i = 1; i <= count; i++) {
    const p = `t${i}`;
    tables.push({
      index: i,
      name: String(vars[`${p}Name`] ?? ""),
      hashKey: String(vars[`${p}HashKey`] ?? ""),
      hashKeyType: String(vars[`${p}HashKeyType`] ?? "S"),
      hasRangeKey: Boolean(vars[`${p}HasRangeKey`] ?? false),
      rangeKey: String(vars[`${p}RangeKey`] ?? ""),
      rangeKeyType: String(vars[`${p}RangeKeyType`] ?? "S"),
      gsiCount: String(vars[`${p}GsiCount`] ?? "0"),
      streamEnabled: Boolean(vars[`${p}StreamEnabled`] ?? false),
      streamViewType: String(vars[`${p}StreamViewType`] ?? "NEW_AND_OLD_IMAGES"),
      ttlEnabled: Boolean(vars[`${p}TtlEnabled`] ?? false),
      ttlAttr: String(vars[`${p}TtlAttr`] ?? "expireAt"),
      resourcePolicy: Boolean(vars[`${p}ResourcePolicy`] ?? false),
      pciAccount: String(vars[`${p}PciAccount`] ?? ""),
    });
  }

  return { ...vars, tables };
}
