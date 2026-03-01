export interface LotteryEndpoint {
  printResultOfBuyLotto645(slots: Array<{ slot: string; mode: string; numbers: string[] }>): void;
  printResultOfShowBalance(data: {
    totalDeposit: number;
    purchaseAvailable: number;
    reservedAmount: number;
    withdrawalPending: number;
    purchaseUnavailable: number;
    lastMonthTotalPurchase: number;
  }): void;
  printResultOfShowBuyList(
    data: Array<{ headers: string[]; rows: string[][] }>,
    outputFormat: string,
    startDate: string,
    endDate: string
  ): void;
  printResultOfAssignVirtualAccount(accountNumber: string, amount: string): void;
}
