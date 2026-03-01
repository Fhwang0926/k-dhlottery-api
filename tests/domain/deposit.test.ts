import { Deposit } from "../../src/domain/deposit";

describe("Deposit", () => {
  it("should throw on non-digit amount", () => {
    expect(() => new Deposit("a")).toThrow(
      "숫자를 입력하세요 (입력된 값: a)."
    );
  });

  it("should throw on not allowed amount", () => {
    expect(() => new Deposit(777)).toThrow(
      "입금 가능한 금액은 5천원, 1만원, 2만원, 3만원, 5만원, 10만원, 20만원, 30만원, 50만원, 70만원, 100만원입니다 (입력된 값: 777)."
    );
  });

  const allowedAmounts = [
    5000, 10000, 20000, 30000, 50000, 100000, 200000, 300000, 500000,
    700000, 1000000,
  ];
  it.each(allowedAmounts)("should accept amount %i", (amount) => {
    const deposit = new Deposit(amount);
    expect(deposit.amount).toBe(amount);
  });
});
