export function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? { __bigint: value.toString() } : value;
}
