const ALLOWED_AMOUNTS = [
  5000, 10000, 20000, 30000, 50000, 100000, 200000, 300000, 500000, 700000,
  1000000,
];

export class Deposit {
  public readonly amount: number;

  constructor(amount: number | string) {
    const n = typeof amount === "string" ? parseInt(amount, 10) : amount;
    if (Number.isNaN(n)) {
      throw new Error(`숫자를 입력하세요 (입력된 값: ${amount}).`);
    }
    if (!ALLOWED_AMOUNTS.includes(n)) {
      throw new Error(
        "입금 가능한 금액은 5천원, 1만원, 2만원, 3만원, 5만원, 10만원, 20만원, 30만원, 50만원, 70만원, 100만원입니다 (입력된 값: " +
          amount +
          ")."
      );
    }
    this.amount = n;
  }
}
