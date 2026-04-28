import Decimal from "decimal.js";

export function overflowReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") {
    return { __bigint: value.toString() };
  } else if (value instanceof Decimal) {
    return { __decimal: value.toString() };
  } else {
    return value;
  }
}
