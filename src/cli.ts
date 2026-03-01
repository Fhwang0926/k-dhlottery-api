import { Command } from "commander";
import Table from "cli-table3";
import { Deposit } from "./domain/deposit";
import { Lotto645Ticket } from "./domain/lotto645-ticket";
import { LotteryStdoutPrinter } from "./endpoint/lottery-stdout-printer";
import { printVersion } from "./endpoint/version-stdout-printer";
import { CredentialsProvider } from "./port/credentials-provider";
import { LotteryClient } from "./port/lottery-client";
import { Lotto645BuyConfirmer } from "./purchase/lotto645-buy-confirmer";

const pkg = require("../package.json");

const program = new Command();

program
  .name("dhapi")
  .description("동행복권 비공식 API\n\n각 명령어에 대한 자세한 도움말은 'dhapi [명령어] -h'를 입력하세요.")
  .version(pkg.version, "-V, --version", "dhapi 버전을 출력합니다.");

program
  .command("assign-virtual-account")
  .description(
    "예치금 충전용 가상계좌를 세팅합니다. dhapi에서는 본인 전용 계좌를 발급받는 것까지만 가능합니다. 출력되는 계좌로 직접 입금해주세요."
  )
  .argument(
    "[amount]",
    "입금할 금액 (5천원, 1만원, 2만원, 3만원, 5만원, 10만원, 20만원, 30만원, 50만원, 70만원, 100만원 중 하나)",
    "50000"
  )
  .option("-p, --profile <name>", "프로필을 지정합니다", "default")
  .option("-d, --debug", "debug 로그를 활성화합니다")
  .action(async (amountStr: string, opts: { profile: string }) => {
    const user = new CredentialsProvider(opts.profile).getUser();
    const amount = parseInt(amountStr, 10);
    const deposit = new Deposit(amount);
    const endpoint = new LotteryStdoutPrinter();
    const client = new LotteryClient(user, endpoint);
    await client.assignVirtualAccount(deposit);
  });

program
  .command("show-balance")
  .description("예치금 현황을 조회합니다.")
  .option("-p, --profile <name>", "프로필을 지정합니다", "default")
  .option("-d, --debug", "debug 로그를 활성화합니다")
  .action(async (opts: { profile: string }) => {
    const user = new CredentialsProvider(opts.profile).getUser();
    const endpoint = new LotteryStdoutPrinter();
    const client = new LotteryClient(user, endpoint);
    await client.showBalance();
  });

program
  .command("show-buy-list")
  .description(
    "구매 내역을 조회합니다. 기본적으로 최근 14일간의 내역을 조회하며, --start-date 및 --end-date 옵션을 통해 조회 기간을 지정할 수 있습니다."
  )
  .option("-p, --profile <name>", "프로필을 지정합니다", "default")
  .option("-f, --format <format>", "출력 형식 (table, json)", "table")
  .option("-s, --start-date <YYYYMMDD>", "조회 시작 날짜")
  .option("-e, --end-date <YYYYMMDD>", "조회 종료 날짜")
  .option("-d, --debug", "debug 로그를 활성화합니다")
  .action(
    async (opts: {
      profile: string;
      format: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const user = new CredentialsProvider(opts.profile).getUser();
      const endpoint = new LotteryStdoutPrinter();
      const client = new LotteryClient(user, endpoint);
      await client.showBuyList(
        opts.format,
        opts.startDate,
        opts.endDate
      );
    }
  );

program
  .command("show-profiles")
  .description("등록된 프로필 목록을 출력합니다.")
  .action(() => {
    try {
      const profiles = CredentialsProvider.listProfiles();
      const table = new Table({ head: ["profiles"], style: { head: [] } });
      profiles.forEach((name: string) => table.push([name]));
      console.log(table.toString());
    } catch (e: any) {
      console.error("❌", e.message);
      process.exit(1);
    }
  });

program
  .command("buy-lotto645")
  .description(
    `로또6/45 복권을 구매합니다. 매주 최대 다섯 장까지 구매할 수 있습니다.

예시:
  dhapi buy-lotto645              자동모드 5장 (default)
  dhapi buy-lotto645 ''           자동모드 1장
  dhapi buy-lotto645 '1,2,3,4,5,6'   수동모드 1장
  dhapi buy-lotto645 '1,2,3'     반자동모드 1장
  dhapi buy-lotto645 '1,2,3,4,5,6' '7,8,9'  수동 1장 + 반자동 1장
  dhapi buy-lotto645 -y           확인 스킵하고 자동 5장 구매`
  )
  .argument("[tickets...]", "구매할 번호 (생략 시 자동 5장)")
  .option("-y, --yes", "구매 전 확인 절차를 스킵합니다.")
  .option("-p, --profile <name>", "프로필을 지정합니다", "default")
  .option("-d, --debug", "debug 로그를 활성화합니다")
  .action(async (ticketArgs: string[], opts: { profile: string; yes?: boolean }) => {
    const user = new CredentialsProvider(opts.profile).getUser();
    const tickets =
      ticketArgs && ticketArgs.length > 0
        ? Lotto645Ticket.createTickets(ticketArgs)
        : Lotto645Ticket.createAutoTickets(5);
    const endpoint = new LotteryStdoutPrinter();
    const client = new LotteryClient(user, endpoint);
    const confirmer = new Lotto645BuyConfirmer();
    const ok = confirmer.confirm(tickets, !!opts.yes);
    if (!ok) process.exit(0);
    await client.buyLotto645(tickets);
  });

program.parse();
