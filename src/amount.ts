import BN from "bn.js";
import { Token } from "./token";

export class TokenAmount {
  static toU64AmountSync({ amount, token }: { amount: number | string; token: Token }): BN {
    const uiAmount = Number(amount);
    const intNum = Math.trunc(uiAmount);
    const floatNum = uiAmount - intNum;
    const unitAmount = 10 ** token.decimals;
    return new BN(intNum).mul(new BN(unitAmount)).add(new BN(Math.trunc(floatNum * unitAmount)));
  }

  static toUiAmountSync({ amount, token }: { amount: BN; token: Token }): number {
    const unitAmount = 10 ** token.decimals;
    const intNum = amount.divn(unitAmount).toNumber();
    const floatNum = amount.sub(new BN(intNum).muln(unitAmount)).toNumber() / unitAmount;
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
