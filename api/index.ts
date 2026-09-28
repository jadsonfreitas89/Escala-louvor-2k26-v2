import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApiApp } from "../src/server/app";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: "ok",
    message: "Import de src/server/app funcionou",
    timestamp: new Date().toISOString()
  });
}
