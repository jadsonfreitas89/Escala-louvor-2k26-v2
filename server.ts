import path from "path";
import { createServer } from "node:http";
import express from "express";
import { createServer as createViteServer } from "vite";
import { createApiApp } from "./src/server/app";

async function startServer() {
  const app = createApiApp();
  const httpServer = createServer(app);
  const PORT = 3000;

  // Headers explícitos para PWA Manifest
  app.get(["/manifest.json", "/manifest.webmanifest"], (req, res, next) => {
    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, must-revalidate");
    next();
  });

  // Headers explícitos para Service Worker
  app.get("/sw.js", (req, res, next) => {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    next();
  });

  // =========================================================================
  // VITE MIDDLEWARE (DEV) & STATIC FILES (PROD)
  // =========================================================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true"
          ? false
          : { server: httpServer, protocol: "wss", clientPort: 443 },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[ESCALA DE LOUVOR] Servidor backend ativo em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Erro fatal ao iniciar o servidor:", err);
  process.exit(1);
});
