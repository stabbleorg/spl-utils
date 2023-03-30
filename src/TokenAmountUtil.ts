import BN from "bn.js";

export class TokenAmountUtil {
  static toAmount(amount: number | string, decimals: number): BN {
    if (!decimals) return new BN(amount);
    const [l, r] = amount.toString().split(".");
    return new BN(l.padEnd(l.length + decimals, "0")).add(
      new BN((r || "0").substring(0, decimals).padEnd(decimals, "0"))
    );
  }

  static toUiAmount(amount: BN, decimals: number): number {
    if (!decimals) return amount.toNumber();
    let amountString = amount.toString();
    if (amountString.length < decimals) amountString = amountString.padStart(decimals, "0");
    return Number(
      (amountString.substring(0, amountString.length - decimals) || "0") +
        "." +
        amountString.substring(amountString.length - decimals, amountString.length)
    );
  }
}
