import Table from "cli-table3";
import type { Lotto645Ticket } from "../domain/lotto645-ticket";

function numbersFormatted(numbers: number[]): string[] {
  const arr = numbers.map(String);
  while (arr.length < 6) arr.push("-");
  return arr;
}

export class Lotto645BuyConfirmer {
  confirm(tickets: Lotto645Ticket[], alwaysYes: boolean = false): boolean {
    this.showBuyPreview(tickets);
    process.stdout.write("❓ 위와 같이 구매하시겠습니까? [Y/n] ");

    if (alwaysYes) {
      console.log("\n✅ --yes 플래그가 주어져 자동으로 구매를 진행합니다.");
      return true;
    }
    const readlineSync = require("readline-sync");
    const answer = readlineSync.question("").trim().toLowerCase();
    if (["y", "yes", ""].includes(answer)) return true;
    console.log("❗️구매를 취소했습니다.");
    return false;
  }

  private showBuyPreview(tickets: Lotto645Ticket[]): void {
    const table = new Table({
      head: ["슬롯", "Mode", "번호1", "번호2", "번호3", "번호4", "번호5", "번호6"],
      style: { head: [] },
    });
    const slots = "ABCDE";
    tickets.forEach((ticket, i) => {
      table.push([slots[i], ticket.modeKor, ...numbersFormatted(ticket.numbers)]);
    });
    console.log(table.toString());
  }
}
