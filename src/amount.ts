import BN from "bn.js";
import { Token } from "./token";

export class TokenAmount {
  static toU64AmountSync({ amount, token }: { amount: number | string; token: Token }): BN {
    const [intString, decimalString] = Number(amount).toString().split(".");
    const unitAmount = 10 ** token.decimals;
    const floatString = "0." + (decimalString || "0");
    return new BN(intString).mul(new BN(unitAmount)).add(new BN(Math.trunc(Number(floatString) * unitAmount)));
  }

  static toUiAmountSync({ amount, token }: { amount: BN; token: Token }): number {
    const unitAmount = 10 ** token.decimals;
    const intNum = amount.div(new BN(unitAmount)).toNumber();
    const floatNum = amount.sub(new BN(intNum).mul(new BN(unitAmount))).toNumber() / unitAmount;
    return intNum + floatNum;
  }

  static async toU64Amount({ amount, token }: { amount: number | string; token: Token }): Promise<BN> {
    await token.loadTokenInfo();
    return TokenAmount.toU64AmountSync({ amount, token });
  }

  static async toUiAmount({ amount, token }: { amount: BN; token: Token }): Promise<number> {
    await token.loadTokenInfo();
    return TokenAmount.toUiAmountSync({ amount, token });
  }
}
