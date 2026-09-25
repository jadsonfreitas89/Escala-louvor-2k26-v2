import { createApiApp } from "../src/server/app";

let app: any;
try {
  const serverModule = require("../dist/server.cjs");
  app = serverModule.default || serverModule;
} catch (e) {
  app = createApiApp();
}

export default app;
