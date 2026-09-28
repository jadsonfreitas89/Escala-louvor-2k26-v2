import type { VercelRequest, VercelResponse } from "@vercel/node";
// @ts-ignore
import serverModule from "../dist/server.cjs";

const app = typeof serverModule === "function" 
  ? serverModule 
  : (serverModule?.default || serverModule);

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (typeof app !== "function") {
    return res.status(500).json({
      error: "Express app is not a function",
      type: typeof app,
      keys: Object.keys(serverModule || {})
    });
  }
  return app(req, res);
}
