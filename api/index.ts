import type { VercelRequest, VercelResponse } from "@vercel/node";
// @ts-ignore
import app from "../dist/server.cjs";

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
