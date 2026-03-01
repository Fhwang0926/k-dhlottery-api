export enum Lotto645Mode {
  AUTO = "auto",
  SEMIAUTO = "semiauto",
  MANUAL = "manual",
}

export class Lotto645Ticket {
  public readonly numbers: number[];
  public readonly mode: Lotto645Mode;

  constructor(numbersStr?: string) {
    if (!numbersStr || numbersStr.trim() === "") {
      this.numbers = [];
      this.mode = Lotto645Mode.AUTO;
      return;
    }

    const parts = numbersStr.split(",").map((s) => s.trim());
    const numbers = parts
      .map((s) => {
        const n = parseInt(s, 10);
        if (Number.isNaN(n)) throw new Error(`숫자를 입력하세요 (입력된 값: ${numbersStr}).`);
        return n;
      })
      .sort((a, b) => a - b);

    const unique = [...new Set(numbers)];
    if (numbers.length !== unique.length) {
      throw new Error(`중복되지 않도록 숫자들을 입력하세요 (입력된 값: ${numbersStr}).`);
    }

    for (const n of numbers) {
      if (n < 1 || n > 45) {
        throw new Error(
          `각 번호는 1부터 45까지의 숫자만 사용할 수 있습니다 (입력된 값: ${n}).`
        );
      }
    }

    this.numbers = numbers;

    if (numbers.length === 6) {
      this.mode = Lotto645Mode.MANUAL;
    } else if (numbers.length >= 1 && numbers.length <= 5) {
      this.mode = Lotto645Mode.SEMIAUTO;
    } else if (numbers.length === 0) {
      this.mode = Lotto645Mode.AUTO;
    } else {
      throw new Error(
        `숫자는 0개 이상 6개 이하의 숫자를 입력해야 합니다 (입력된 값: ${numbersStr}).`
      );
    }
  }

  get modeKor(): string {
    switch (this.mode) {
      case Lotto645Mode.AUTO:
        return "자동";
      case Lotto645Mode.SEMIAUTO:
        return "반자동";
      case Lotto645Mode.MANUAL:
        return "수동";
      default:
        throw new Error("지원하지 않는 게임 타입입니다.");
    }
  }

  static createAutoTickets(count: number): Lotto645Ticket[] {
    return Array.from({ length: count }, () => new Lotto645Ticket());
  }

  static createTickets(numbersList: string[]): Lotto645Ticket[] {
    return numbersList.map((n) => new Lotto645Ticket(n));
  }
}
