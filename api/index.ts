import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApiApp } from "../src/server/app";

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = createApiApp();

    return res.status(200).json({
      status: "ok",
      message: "createApiApp executou com sucesso",
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error("=== CREATE_API_APP_RUNTIME_ERROR ===");
    console.error(error);

    const details =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          }
        : {
            value: String(error)
          };

    return res.status(500).json({
      status: "error",
      message: "createApiApp falhou durante a execução",
      error: details
    });
  }
}
