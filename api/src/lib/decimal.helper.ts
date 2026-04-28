import Decimal from "decimal.js";
import { ValueTransformer } from "typeorm";

export const decimalTransformer: ValueTransformer = {
  to: (value?: Decimal) => {
    return value?.toString();
  },
  from: (value?: string) => {
    return value ? new Decimal(value) : null;
  },
};
export const DecimalToString =
  (decimals: number = 2) =>
  (decimal?: Decimal) =>
    decimal?.toFixed?.(decimals) || decimal;

export const bigIntToDecimal = (value: bigint, decimals: number): Decimal => {
  return new Decimal(value.toString()).div(new Decimal(10).pow(decimals));
};
export const decimaltoBigInt = (value: Decimal, decimals: number): bigint => {
  const scaled = value.mul(new Decimal(10).pow(decimals));
  return BigInt(scaled.toString());
};
