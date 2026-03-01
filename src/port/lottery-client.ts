import axios, { AxiosInstance } from "axios";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";
import * as forge from "node-forge";
import { CookieJar } from "tough-cookie";
import { Deposit } from "../domain/deposit";
import { Lotto645Mode, Lotto645Ticket } from "../domain/lotto645-ticket";
import { User } from "../domain/user";
import type { LotteryEndpoint } from "./lottery-endpoint";

const BASE_URL = "https://www.dhlottery.co.kr";
const LOGIN_PAGE = "/login";
const RSA_KEY_URL = "/login/selectRsaModulus.do";
const LOGIN_URL = "/login/securityLoginCheck.do";
const BUY_LOTTO645_URL = "https://ol.dhlottery.co.kr/olotto/game/execBuy.do";
const READY_SOCKET = "https://ol.dhlottery.co.kr/olotto/game/egovUserReadySocket.json";
const GAME645_PAGE = "https://ol.dhlottery.co.kr/olotto/game/game645.do";
const ASSIGN_VA_1 = "https://www.dhlottery.co.kr/kbank.do?method=kbankInit";
const ASSIGN_VA_2 = "https://www.dhlottery.co.kr/kbank.do?method=kbankProcess";
const LOTTO_BUY_LIST_URL = "https://www.dhlottery.co.kr/mypage/selectMyLotteryledger.do";
const DETAIL_REQUEST_DELAY = 500;

function rsaEncrypt(plainText: string, modulusHex: string, exponentHex: string): string {
  const BigInteger = (forge as any).jsbn.BigInteger;
  const n = new BigInteger(modulusHex, 16);
  const e = new BigInteger(exponentHex, 16);
  const key = forge.pki.setRsaPublicKey(n, e);
  const encrypted = key.encrypt(plainText, "RSAES-PKCS1-V1_5");
  return forge.util.bytesToHex(encrypted);
}

function getRound(): number {
  const firstRoundDate = new Date(2002, 11, 7); // Dec 7, 2002
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentWeekday = today.getDay();
  const daysUntilSaturday = (6 - currentWeekday + 7) % 7;
  const thisSaturday = new Date(today);
  thisSaturday.setDate(today.getDate() + daysUntilSaturday);
  const daysDiff = Math.floor(
    (thisSaturday.getTime() - firstRoundDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const weeksPassed = Math.floor(daysDiff / 7);
  return 1 + weeksPassed;
}

function formatDateKo(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function getDrawDates(): { drawDate: Date; payLimitDate: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentWeekday = today.getDay();
  const daysUntilSaturday = (6 - currentWeekday + 7) % 7;
  const drawDate = new Date(today);
  drawDate.setDate(today.getDate() + daysUntilSaturday);
  const payLimitDate = new Date(drawDate);
  payLimitDate.setFullYear(payLimitDate.getFullYear() + 1);
  return { drawDate, payLimitDate };
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export class LotteryClient {
  private readonly session: AxiosInstance;
  private readonly lotteryEndpoint: LotteryEndpoint;

  constructor(userProfile: User, lotteryEndpoint: LotteryEndpoint) {
    this.lotteryEndpoint = lotteryEndpoint;
    const jar = new CookieJar();
    this.session = wrapper(
      axios.create({
        jar,
        baseURL: BASE_URL,
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: () => true,
        headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "max-age=0",
      },
      withCredentials: true,
    })
    );

    (this.session as any)._userId = userProfile.username;
    (this.session as any)._userPw = userProfile.password;
  }

  async login(): Promise<void> {
    let resp = await this.session.get("/");
    if (resp.request?.res?.responseUrl?.includes("index_check.html")) {
      throw new Error("동행복권 사이트가 현재 시스템 점검중입니다.");
    }

    await this.session.get(LOGIN_PAGE);

    const rsaResp = await this.session.get(RSA_KEY_URL, {
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Referer: `${BASE_URL}${LOGIN_PAGE}`,
      },
    });
    const rsaData = rsaResp.data;
    if (!rsaData?.data) {
      throw new Error("RSA 키를 가져올 수 없습니다.");
    }
    const modulus = rsaData.data.rsaModulus;
    const exponent = rsaData.data.publicExponent;

    const userId = (this.session as any)._userId;
    const userPw = (this.session as any)._userPw;
    const encryptedUserId = rsaEncrypt(userId, modulus, exponent);
    const encryptedPassword = rsaEncrypt(userPw, modulus, exponent);

    const loginResp = await this.session.post(
      LOGIN_URL,
      new URLSearchParams({
        userId: encryptedUserId,
        userPswdEncn: encryptedPassword,
        inpUserId: userId,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: BASE_URL,
          Referer: `${BASE_URL}${LOGIN_PAGE}`,
        },
        maxRedirects: 5,
        validateStatus: () => true,
      }
    );

    const finalUrl = loginResp.request?.res?.responseUrl ?? loginResp.config.url ?? "";
    if (loginResp.status !== 200 || !finalUrl.includes("loginSuccess")) {
      const $ = cheerio.load(loginResp.data || "");
      const errorBtn = $("a.btn_common");
      if (errorBtn.length) {
        throw new Error("로그인에 실패했습니다. 아이디 또는 비밀번호를 확인해주세요.");
      }
      throw new Error(
        `로그인에 실패했습니다. (Status: ${loginResp.status}, URL: ${finalUrl})`
      );
    }

    await this.session.get("/main");
    await this.session.get(GAME645_PAGE);
  }

  private makeBuyLotto645Param(tickets: Lotto645Ticket[]): string {
    const slots = "ABCDE";
    const params = tickets.map((t, i) => {
      let genType: string;
      let arrGameChoiceNum: string | null;
      if (t.mode === Lotto645Mode.AUTO) {
        genType = "0";
        arrGameChoiceNum = null;
      } else if (t.mode === Lotto645Mode.MANUAL) {
        genType = "1";
        arrGameChoiceNum = t.numbers.join(",");
      } else {
        genType = "2";
        arrGameChoiceNum = t.numbers.join(",");
      }
      return {
        genType,
        arrGameChoiceNum,
        alpabet: slots[i],
      };
    });
    return JSON.stringify(params);
  }

  private isPurchaseSuccess(response: any): boolean {
    return response?.result?.resultCode === "100";
  }

  private formatLottoNumbers(lines: string[]): Array<{ slot: string; mode: string; numbers: string[] }> {
    const modeDict: Record<string, string> = {
      "1": "수동",
      "2": "반자동",
      "3": "자동",
    };
    const slots: Array<{ slot: string; mode: string; numbers: string[] }> = [];
    for (const line of lines) {
      const lastChar = line.slice(-1);
      const mode = modeDict[lastChar] ?? "자동";
      const middle = line.slice(2, -1);
      const numbers = middle.split("|").filter(Boolean);
      slots.push({
        slot: line[0],
        mode,
        numbers,
      });
    }
    return slots;
  }

  async buyLotto645(tickets: Lotto645Ticket[]): Promise<void> {
    await this.login();

    const readyResp = await this.session.post(READY_SOCKET, null, { baseURL: "" });
    const direct = readyResp.data?.ready_ip;
    if (!direct) {
      throw new Error("로또 구매 서버 정보를 가져올 수 없습니다.");
    }

    const roundNumber = getRound();
    const { drawDate, payLimitDate } = getDrawDates();

    const data = {
      round: String(roundNumber),
      direct,
      nBuyAmount: String(1000 * tickets.length),
      param: this.makeBuyLotto645Param(tickets),
      ROUND_DRAW_DATE: formatDateKo(drawDate),
      WAMT_PAY_TLMT_END_DT: formatDateKo(payLimitDate),
      gameCnt: tickets.length,
      saleMdaDcd: "10",
    };

    const buyResp = await this.session.post(BUY_LOTTO645_URL, new URLSearchParams(data as any), {
      baseURL: "",
      headers: {
        Referer: GAME645_PAGE,
        Origin: "https://ol.dhlottery.co.kr",
      },
    });

    let response: any;
    try {
      response = typeof buyResp.data === "string" ? JSON.parse(buyResp.data) : buyResp.data;
    } catch {
      throw new Error("❗ 로또6/45 구매에 실패했습니다. (사유: 알 수 없는 오류)");
    }

    if (!this.isPurchaseSuccess(response)) {
      const msg = response?.result?.resultMsg ?? "알 수 없음";
      throw new Error(`❗ 로또6/45 구매에 실패했습니다. (사유: ${msg})`);
    }

    const lines = response.result?.arrGameChoiceNum ?? [];
    const slots = this.formatLottoNumbers(lines);
    this.lotteryEndpoint.printResultOfBuyLotto645(slots);
  }

  async showBalance(): Promise<void> {
    await this.login();

    const headers = {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      Referer: "https://www.dhlottery.co.kr/mypage/home",
    };

    const resp = await this.session.get(
      "https://www.dhlottery.co.kr/mypage/selectUserMndp.do",
      { headers }
    );
    if (resp.status !== 200 || !String(resp.headers["content-type"] || "").includes("json")) {
      throw new Error("예치금 API 응답 오류");
    }

    const data = resp.data;
    const userMndp = data?.data?.userMndp ?? {};

    const totalDeposit =
      ((userMndp.pntDpstAmt ?? 0) - (userMndp.pntTkmnyAmt ?? 0)) +
      ((userMndp.ncsblDpstAmt ?? 0) - (userMndp.ncsblTkmnyAmt ?? 0)) +
      ((userMndp.csblDpstAmt ?? 0) - (userMndp.csblTkmnyAmt ?? 0));
    const purchaseAvailable = userMndp.crntEntrsAmt ?? 0;
    const reservedAmount = userMndp.rsvtOrdrAmt ?? 0;
    const withdrawalPending = userMndp.dawAplyAmt ?? 0;
    const purchaseUnavailable =
      reservedAmount + withdrawalPending + (userMndp.feeAmt ?? 0);

    let lastMonthTotalPurchase = 0;
    const resp2 = await this.session.get(
      "https://www.dhlottery.co.kr/mypage/selectMyHomeInfo.do",
      { headers }
    );
    if (resp2.status === 200 && String(resp2.headers["content-type"] || "").includes("json")) {
      lastMonthTotalPurchase = resp2.data?.data?.mnthPrchsAmt ?? 0;
    }

    this.lotteryEndpoint.printResultOfShowBalance({
      totalDeposit,
      purchaseAvailable,
      reservedAmount,
      withdrawalPending,
      purchaseUnavailable,
      lastMonthTotalPurchase,
    });
  }

  async showBuyList(
    outputFormat: string,
    startDate?: string,
    endDate?: string
  ): Promise<void> {
    await this.login();

    const today = new Date();
    const startDt = startDate
      ? new Date(
          startDate.slice(0, 4) + "-" + startDate.slice(4, 6) + "-" + startDate.slice(6, 8)
        )
      : new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    const endDt = endDate
      ? new Date(
          endDate.slice(0, 4) + "-" + endDate.slice(4, 6) + "-" + endDate.slice(6, 8)
        )
      : new Date(today);

    const params = {
      srchStrDt: startDt.toISOString().slice(0, 10).replace(/-/g, ""),
      srchEndDt: endDt.toISOString().slice(0, 10).replace(/-/g, ""),
      pageNum: 1,
      recordCountPerPage: 100,
      _: Date.now(),
    };

    await this.session.get("https://www.dhlottery.co.kr/mypage/mylotteryledger");
    const resp = await this.session.get(LOTTO_BUY_LIST_URL, {
      params,
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        Referer: "https://www.dhlottery.co.kr/mypage/mylotteryledger",
      },
    });

    if (resp.status !== 200) {
      throw new Error(`구매 내역 조회 API 요청 실패 (Status: ${resp.status})`);
    }
    if (!String(resp.headers["content-type"] || "").includes("application/json")) {
      throw new Error(
        "구매 내역 조회 API가 JSON을 반환하지 않았습니다. 세션이 만료되었을 수 있습니다."
      );
    }

    const foundData = await this.parseBuyListJson(resp.data);
    this.lotteryEndpoint.printResultOfShowBuyList(
      foundData,
      outputFormat,
      startDt.toISOString().slice(0, 10),
      endDt.toISOString().slice(0, 10)
    );
  }

  private async parseBuyListJson(
    responseData: any
  ): Promise<Array<{ headers: string[]; rows: string[][] }>> {
    if (!responseData?.data?.list) return [];
    const items = responseData.data.list;
    const headers = [
      "구입일자",
      "복권명",
      "회차",
      "선택번호/복권번호",
      "구입매수",
      "당첨결과",
      "당첨금",
      "추첨일",
    ];
    const rows: string[][] = [];

    for (const item of items) {
      const purchaseDate = item.eltOrdrDt ?? "";
      const lotteryName = item.ltGdsNm ?? "";
      const roundNo = item.ltEpsdView ?? "";
      const gmInfo = item.gmInfo ?? "";
      const quantity = String(item.prchsQty ?? "");
      const winResult = item.ltWnResult ?? "";
      const ntslOrdrNo = item.ntslOrdrNo ?? "";
      const winAmt = item.ltWnAmt ?? 0;
      const drawDate = item.epsdRflDt ?? "";
      const winAmtStr = winAmt > 0 ? `${Number(winAmt).toLocaleString()}원` : "-";

      let numbers: string;
      if (gmInfo && lotteryName === "로또6/45" && ntslOrdrNo) {
        numbers = await this.getLotto645TicketDetail(
          ntslOrdrNo,
          gmInfo,
          purchaseDate
        );
        await new Promise((r) => setTimeout(r, DETAIL_REQUEST_DELAY));
      } else {
        numbers = gmInfo;
      }
      rows.push([
        purchaseDate,
        lotteryName,
        roundNo,
        numbers,
        quantity,
        winResult,
        winAmtStr,
        drawDate,
      ]);
    }
    return [{ headers, rows }];
  }

  private async getLotto645TicketDetail(
    ntslOrdrNo: string,
    barcode: string,
    purchaseDate: string
  ): Promise<string> {
    try {
      const d = new Date(purchaseDate);
      const startDate = new Date(d);
      startDate.setDate(d.getDate() - 7);
      const endDate = new Date(d);
      endDate.setDate(d.getDate() + 7);
      const fmt = (x: Date) =>
        x.getFullYear() +
        String(x.getMonth() + 1).padStart(2, "0") +
        String(x.getDate()).padStart(2, "0");

      const resp = await this.session.get(
        "https://www.dhlottery.co.kr/mypage/lotto645TicketDetail.do",
        {
          params: {
            ntslOrdrNo,
            srchStrDt: fmt(startDate),
            srchEndDt: fmt(endDate),
            barcd: barcode,
          },
        }
      );
      const data = resp.data;
      if (!data?.data?.success) return "조회 실패";
      const ticket = data.data.ticket;
      const gameDtl = ticket?.game_dtl ?? [];
      if (!gameDtl.length) return "번호 정보 없음";
      const typeMap: Record<number, string> = { 1: "수동", 2: "반자동", 3: "자동" };
      const result = gameDtl.map(
        (g: any) =>
          `[${g.idx ?? ""}] ${typeMap[g.type] ?? "자동"}: ${(g.num ?? []).join(" ")}`
      );
      return result.join("\n") || "번호 확인 불가";
    } catch {
      return "조회 실패";
    }
  }

  async assignVirtualAccount(deposit: Deposit): Promise<void> {
    await this.login();

    const resp1 = await this.session.post(
      ASSIGN_VA_1,
      new URLSearchParams({
        PayMethod: "VBANK",
        VbankBankCode: "089",
        price: String(deposit.amount),
        goodsName: "복권예치금",
        vExp: getTomorrow(),
      }).toString(),
      { baseURL: "" }
    );
    const data = resp1.data;
    if (!data) throw new Error("❗ 가상계좌를 할당하지 못했습니다.");

    const body = new URLSearchParams({
      PayMethod: "VBANK",
      GoodsName: data.GoodsName ?? "",
      GoodsCnt: "",
      BuyerTel: data.BuyerTel ?? "",
      Moid: data.Moid ?? "",
      MID: data.MID ?? "",
      UserIP: data.UserIP ?? "",
      MallIP: data.MallIP ?? "",
      MallUserID: data.MallUserID ?? "",
      VbankExpDate: data.VbankExpDate ?? "",
      BuyerEmail: data.BuyerEmail ?? "",
      EdiDate: data.EdiDate ?? "",
      EncryptData: data.EncryptData ?? "",
      Amt: data.amt ?? "",
      BuyerName: data.BuyerName ?? "",
      VbankBankCode: data.VbankBankCode ?? "",
      VbankNum: data.FxVrAccountNo ?? "",
      FxVrAccountNo: data.FxVrAccountNo ?? "",
      VBankAccountName: data.BuyerName ?? "",
      svcInfoPgMsgYn: "N",
      OptionList: "no_receipt",
      TransType: "0",
    }).toString();

    const resp2 = await this.session.post(ASSIGN_VA_2, body, { baseURL: "" });
    const $ = cheerio.load(resp2.data || "");
    const contents = $("#contents");
    const accountSpan = contents.find("span").first();
    const amountSpan = contents.find(".color_key1").first();
    const accountNumber = accountSpan.text().trim();
    const amountStr = amountSpan.text().trim();
    this.lotteryEndpoint.printResultOfAssignVirtualAccount(accountNumber, amountStr);
  }
}
