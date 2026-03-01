import chalk from "chalk";
import Table from "cli-table3";
import type { LotteryEndpoint } from "../port/lottery-endpoint";

function numToMoneyStr(n: number): string {
  return `${n.toLocaleString()} 원`;
}

export class LotteryStdoutPrinter implements LotteryEndpoint {
  printResultOfAssignVirtualAccount(accountNumber: string, amountStr: string): void {
    console.log(chalk.green("✅ 가상계좌를 할당했습니다."));
    console.log(chalk.yellow("❗️입금 전 계좌주 이름을 꼭 확인하세요."));
    const table = new Table({
      head: ["전용가상계좌", "결제신청금액"],
      style: { head: [] },
    });
    table.push([accountNumber, amountStr]);
    console.log(table.toString());
  }

  printResultOfShowBalance(data: {
    totalDeposit: number;
    purchaseAvailable: number;
    reservedAmount: number;
    withdrawalPending: number;
    purchaseUnavailable: number;
    lastMonthTotalPurchase: number;
  }): void {
    console.log(chalk.green("✅ 예치금 현황을 조회했습니다."));
    const table = new Table({
      head: [
        "총예치금",
        "구매가능금액",
        "예약구매금액",
        "출금신청중금액",
        "구매불가능금액",
        "최근1달누적구매금액",
      ],
      style: { head: [] },
    });
    table.push([
      numToMoneyStr(data.totalDeposit),
      numToMoneyStr(data.purchaseAvailable),
      numToMoneyStr(data.reservedAmount),
      numToMoneyStr(data.withdrawalPending),
      numToMoneyStr(data.purchaseUnavailable),
      numToMoneyStr(data.lastMonthTotalPurchase),
    ]);
    console.log(table.toString());
    console.log(chalk.dim("(구매불가능금액 = 예약구매금액 + 출금신청중금액)"));
  }

  printResultOfBuyLotto645(
    slots: Array<{ slot: string; mode: string; numbers: string[] }>
  ): void {
    console.log(chalk.green("✅ 로또6/45 복권을 구매했습니다."));
    const table = new Table({
      head: ["슬롯", "Mode", "번호1", "번호2", "번호3", "번호4", "번호5", "번호6"],
      style: { head: [] },
    });
    for (const slot of slots) {
      table.push([slot.slot, slot.mode, ...slot.numbers]);
    }
    console.log(table.toString());
  }

  printResultOfShowBuyList(
    data: Array<{ headers: string[]; rows: string[][] }>,
    outputFormat: string,
    startDate: string,
    endDate: string
  ): void {
    if (outputFormat === "json") {
      const jsonResults: Record<string, string>[] = [];
      for (const tableData of data) {
        const headers = tableData.headers;
        const rows = tableData.rows;
        for (const row of rows) {
          const item: Record<string, string> = {};
          headers.forEach((h, i) => {
            item[h] = row[i] ?? "";
          });
          jsonResults.push(item);
        }
      }
      console.log(JSON.stringify(jsonResults, null, 2));
      return;
    }

    console.log(chalk.green(`✅ 구매 내역을 조회했습니다. (${startDate} ~ ${endDate})`));
    if (!data.length) {
      console.log("구매 내역이 없습니다.");
      return;
    }

    for (const tableData of data) {
      const headers = tableData.headers;
      const rows = tableData.rows;
      if (!headers.length) continue;
      if (
        rows.length === 1 &&
        rows[0].length === 1 &&
        rows[0][0].includes("조회 결과가 없습니다")
      ) {
        console.log(chalk.dim(rows[0][0]) + "\n");
        continue;
      }
      const table = new Table({ head: headers, style: { head: [] } });
      for (const row of rows) {
        const padded =
          row.length >= headers.length
            ? row.slice(0, headers.length)
            : [...row, ...Array(headers.length - row.length).fill("")];
        table.push(padded);
      }
      console.log(table.toString());
      console.log("");
    }
  }
}
