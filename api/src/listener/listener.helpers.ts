import { currencyDecimals } from "./listener.constants";

export function normalizeCurrency(value: bigint, currency: string): number {
  let decimals = 1;
  switch (currency) {
    case "ALICE": {
      decimals = currencyDecimals.ALICE;
    }
    case "BJORN": {
      decimals = currencyDecimals.ALICE;
    }
    default: {
      console.log(
        `Failed to normalize currency: ${currency}, potential overflow with bigint: ${value}`,
      );
    }
  }
  const scaledDown = value / BigInt(10 ^ decimals);
  return Number(scaledDown);
}
