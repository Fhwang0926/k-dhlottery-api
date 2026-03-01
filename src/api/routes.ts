import { Router, Request, Response } from "express";
import { Deposit } from "../domain/deposit";
import { Lotto645Ticket } from "../domain/lotto645-ticket";
import { LotteryApiEndpoint } from "../endpoint/lottery-api-endpoint";
import { CredentialsProvider } from "../port/credentials-provider";
import { LotteryClient } from "../port/lottery-client";

function getProfile(req: Request): string {
  return (req.query.profile as string) || (req.body?.profile as string) || "default";
}

function jsonSuccess<T>(res: Response, data: T, status = 200) {
  res.status(status).json({ success: true, data });
}

function jsonError(res: Response, message: string, status = 500) {
  res.status(status).json({ success: false, error: message });
}

export function createApiRouter(): Router {
  const router = Router();

  /** GET /api/profiles - 등록된 프로필 목록 */
  router.get("/profiles", (req: Request, res: Response) => {
    try {
      const profiles = CredentialsProvider.listProfiles();
      jsonSuccess(res, { profiles });
    } catch (e: any) {
      jsonError(res, e.message || "프로필 목록을 불러올 수 없습니다.", 404);
    }
  });

  /** GET /api/balance - 예치금 현황 (query: profile) */
  router.get("/balance", async (req: Request, res: Response) => {
    const profile = getProfile(req);
    try {
      const user = new CredentialsProvider(profile).getUser();
      const endpoint = new LotteryApiEndpoint();
      const client = new LotteryClient(user, endpoint);
      await client.showBalance();
      if (!endpoint.result.showBalance) {
        return jsonError(res, "예치금 정보를 가져오지 못했습니다.", 502);
      }
      jsonSuccess(res, endpoint.result.showBalance);
    } catch (e: any) {
      jsonError(res, e.message || "예치금 조회에 실패했습니다.", 500);
    }
  });

  /** POST /api/buy-lotto645 - 로또 6/45 구매 (body: { profile?, tickets?: string[], skipConfirm?: boolean }) */
  router.post("/buy-lotto645", async (req: Request, res: Response) => {
    const profile = getProfile(req);
    const ticketsInput = req.body?.tickets as string[] | undefined;
    const skipConfirm = !!req.body?.skipConfirm;

    try {
      const user = new CredentialsProvider(profile).getUser();
      const tickets =
        ticketsInput && ticketsInput.length > 0
          ? Lotto645Ticket.createTickets(ticketsInput)
          : Lotto645Ticket.createAutoTickets(5);

      if (!skipConfirm && tickets.length > 0) {
        // API에서는 기본적으로 확인 스킵 (skipConfirm=true 권장)
      }

      const endpoint = new LotteryApiEndpoint();
      const client = new LotteryClient(user, endpoint);
      await client.buyLotto645(tickets);

      if (!endpoint.result.buyLotto645) {
        return jsonError(res, "구매 결과를 가져오지 못했습니다.", 502);
      }
      jsonSuccess(res, endpoint.result.buyLotto645);
    } catch (e: any) {
      jsonError(res, e.message || "로또 구매에 실패했습니다.", 500);
    }
  });

  /** GET /api/buy-list - 구매 내역 (query: profile, format?, startDate?, endDate?) */
  router.get("/buy-list", async (req: Request, res: Response) => {
    const profile = getProfile(req);
    const format = (req.query.format as string) || "json";
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    try {
      const user = new CredentialsProvider(profile).getUser();
      const endpoint = new LotteryApiEndpoint();
      const client = new LotteryClient(user, endpoint);
      await client.showBuyList(format, startDate, endDate);

      if (!endpoint.result.showBuyList) {
        return jsonError(res, "구매 내역을 가져오지 못했습니다.", 502);
      }
      jsonSuccess(res, endpoint.result.showBuyList);
    } catch (e: any) {
      jsonError(res, e.message || "구매 내역 조회에 실패했습니다.", 500);
    }
  });

  /** POST /api/assign-virtual-account - 가상계좌 세팅 (body: { profile?, amount: number }) */
  router.post("/assign-virtual-account", async (req: Request, res: Response) => {
    const profile = getProfile(req);
    const amount = req.body?.amount != null ? Number(req.body.amount) : 50000;

    try {
      const user = new CredentialsProvider(profile).getUser();
      const deposit = new Deposit(amount);
      const endpoint = new LotteryApiEndpoint();
      const client = new LotteryClient(user, endpoint);
      await client.assignVirtualAccount(deposit);

      if (!endpoint.result.assignVirtualAccount) {
        return jsonError(res, "가상계좌 정보를 가져오지 못했습니다.", 502);
      }
      jsonSuccess(res, endpoint.result.assignVirtualAccount);
    } catch (e: any) {
      jsonError(res, e.message || "가상계좌 할당에 실패했습니다.", 500);
    }
  });

  return router;
}
