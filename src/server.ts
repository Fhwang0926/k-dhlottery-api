import express from "express";
import { createApiRouter } from "./api/routes";

const pkg = require("../package.json");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "dhapi",
    description: "동행복권 비공식 API",
    version: pkg.version,
    endpoints: {
      "GET /api/profiles": "등록된 프로필 목록",
      "GET /api/balance": "예치금 현황 (query: profile)",
      "POST /api/buy-lotto645": "로또 6/45 구매 (body: profile?, tickets?, skipConfirm?)",
      "GET /api/buy-list": "구매 내역 (query: profile, format?, startDate?, endDate?)",
      "POST /api/assign-virtual-account": "가상계좌 세팅 (body: profile?, amount)",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api", createApiRouter());

app.listen(PORT, () => {
  console.log(`dhapi server listening on http://localhost:${PORT}`);
});
