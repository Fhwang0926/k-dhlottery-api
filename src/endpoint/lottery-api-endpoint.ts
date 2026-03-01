import type { LotteryEndpoint } from "../port/lottery-endpoint";

/**
 * Endpoint adapter that captures results for API responses (no stdout).
 */
export interface ApiResult {
  buyLotto645?: { slots: Array<{ slot: string; mode: string; numbers: string[] }> };
  showBalance?: {
    totalDeposit: number;
    purchaseAvailable: number;
    reservedAmount: number;
    withdrawalPending: number;
    purchaseUnavailable: number;
    lastMonthTotalPurchase: number;
  };
  showBuyList?: {
    startDate: string;
    endDate: string;
    format: string;
    data: Array<{ headers: string[]; rows: string[][] }>;
  };
  assignVirtualAccount?: { accountNumber: string; amount: string };
}

export class LotteryApiEndpoint implements LotteryEndpoint {
  readonly result: ApiResult = {};

  printResultOfBuyLotto645(
    slots: Array<{ slot: string; mode: string; numbers: string[] }>
  ): void {
    this.result.buyLotto645 = { slots };
  }

  printResultOfShowBalance(data: {
    totalDeposit: number;
    purchaseAvailable: number;
    reservedAmount: number;
    withdrawalPending: number;
    purchaseUnavailable: number;
    lastMonthTotalPurchase: number;
  }): void {
    this.result.showBalance = { ...data };
  }

  printResultOfShowBuyList(
    data: Array<{ headers: string[]; rows: string[][] }>,
    outputFormat: string,
    startDate: string,
    endDate: string
  ): void {
    this.result.showBuyList = {
      startDate,
      endDate,
      format: outputFormat,
      data,
    };
  }

  printResultOfAssignVirtualAccount(accountNumber: string, amount: string): void {
    this.result.assignVirtualAccount = { accountNumber, amount };
  }
}
