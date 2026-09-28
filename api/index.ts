import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApiApp } from "../src/server/app";

const app = createApiApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: "ok",
    message: "createApiApp executou com sucesso",
    timestamp: new Date().toISOString()
  });
}
