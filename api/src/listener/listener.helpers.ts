import { currencyDecimals } from "./listener.constants";

export function normalizeCurrency(value: bigint, currency: string): number {
  let decimals = 0;
  switch (currency) {
    case "ALICE": {
      decimals = currencyDecimals.ALICE;
      break;
    }
    case "BJORN": {
      decimals = currencyDecimals.BJORN;
      break;
    }
    default: {
      console.log(
        `Failed to normalize currency: ${currency}, potential overflow with bigint: ${value}`,
      );
    }
  }
  const scaledDown = Number(value) / (10 ^ decimals);
  console.log(
    `Normalizing ${currency}: ${value.toString()} to: ${scaledDown} `,
  );
  return Number(scaledDown);
}
