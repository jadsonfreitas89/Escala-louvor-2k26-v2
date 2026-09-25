var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// dist/server.cjs
var require_server = __commonJS({
  "dist/server.cjs"(exports2, module2) {
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var server_exports = {};
    __export2(server_exports, {
      default: () => server_default
    });
    module2.exports = __toCommonJS2(server_exports);
    var import_path3 = __toESM2(require("path"), 1);
    var import_promises = require("node:fs/promises");
    var import_node_http = require("node:http");
    var import_express2 = __toESM2(require("express"), 1);
    var import_vite = require("vite");
    var import_express3 = __toESM2(require("express"), 1);
    var import_crypto22 = __toESM2(require("crypto"), 1);
    var import_fs22 = __toESM2(require("fs"), 1);
    var import_path22 = __toESM2(require("path"), 1);
    var import_firestore2 = require("firebase-admin/firestore");
    var import_app3 = require("firebase-admin/app");
    var adminApp2 = null;
    function getFirebaseAdminApp2() {
      if (adminApp2) {
        return adminApp2;
      }
      const existingApps = (0, import_app3.getApps)();
      if (existingApps.length > 0) {
        adminApp2 = existingApps[0];
        return adminApp2;
      }
      const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (!serviceAccountString) {
        console.warn("[Firebase Admin] Vari\xE1vel FIREBASE_SERVICE_ACCOUNT_JSON n\xE3o configurada.");
        return null;
      }
      try {
        const serviceAccount = JSON.parse(serviceAccountString);
        adminApp2 = (0, import_app3.initializeApp)({
          credential: (0, import_app3.cert)(serviceAccount),
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || "escala-louvor-2"
        });
        console.log("[Firebase Admin] Inicializado com sucesso para o projeto", process.env.VITE_FIREBASE_PROJECT_ID || "escala-louvor-2");
        return adminApp2;
      } catch (error) {
        console.error("[Firebase Admin] Falha ao processar credenciais:", error);
        return null;
      }
    }
    var firestoreInstance2 = null;
    function getDb2() {
      if (firestoreInstance2) {
        return firestoreInstance2;
      }
      const adminApp22 = getFirebaseAdminApp2();
      if (adminApp22) {
        firestoreInstance2 = (0, import_firestore2.getFirestore)(adminApp22);
      }
      return firestoreInstance2;
    }
    var db2 = new Proxy({}, {
      get(target, prop, receiver) {
        const inst = getDb2();
        if (!inst) {
          throw new Error("Firestore Admin SDK n\xE3o inicializado (credencial ausente ou inv\xE1lida).");
        }
        const val = inst[prop];
        return typeof val === "function" ? val.bind(inst) : val;
      }
    });
    var import_messaging3 = require("firebase-admin/messaging");
    async function getFcmTokensForUser2(userId) {
      const db22 = getDb2();
      if (!db22) {
        console.warn(`[FCM] DB n\xE3o dispon\xEDvel para consultar tokens do usu\xE1rio ${userId}.`);
        return [];
      }
      try {
        const snapshot = await db22.collection("fcm_tokens").where("userId", "==", userId).where("active", "==", true).get();
        return snapshot.docs.map((doc) => doc.data().token).filter(Boolean);
      } catch (error) {
        console.warn(`[FCM] Erro ao recuperar tokens para usu\xE1rio ${userId}:`, error);
        return [];
      }
    }
    async function subscribeUserToFcm2(userId, token) {
      const db22 = getDb2();
      if (!db22) {
        console.warn("[FCM] Firestore indispon\xEDvel para registro de token.");
        return false;
      }
      try {
        await db22.collection("fcm_tokens").doc(token).set({
          userId,
          token,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          active: true
        }, { merge: true });
        return true;
      } catch (error) {
        console.error("[FCM] Erro ao persistir token no Firestore:", error);
        return false;
      }
    }
    async function unsubscribeUserFromFcm2(userId, token) {
      const db22 = getDb2();
      if (!db22) return false;
      try {
        const docRef = db22.collection("fcm_tokens").doc(token);
        const doc = await docRef.get();
        if (doc.exists) {
          await docRef.update({ active: false, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
          return true;
        }
        return false;
      } catch (error) {
        console.warn("[FCM] Erro ao desativar token:", error);
        return false;
      }
    }
    async function sendFcmPushToUser2(userId, options) {
      const adminApp22 = getFirebaseAdminApp2();
      if (!adminApp22) {
        return { sent: 0, failed: 0 };
      }
      const tokens = await getFcmTokensForUser2(userId);
      if (!tokens || tokens.length === 0) {
        return { sent: 0, failed: 0 };
      }
      const messaging = (0, import_messaging3.getMessaging)(adminApp22);
      const notificationId = options.id || options.eventoId || `notif_${Date.now()}`;
      const targetUrl = options.url || "/notificacoes";
      let sent = 0;
      let failed = 0;
      for (const token of tokens) {
        try {
          await messaging.send({
            token,
            notification: {
              title: options.title,
              body: options.body
            },
            data: {
              id: notificationId,
              eventoId: options.eventoId || "",
              type: options.type || "NOTIFICATION",
              url: targetUrl
            },
            webpush: {
              fcmOptions: {
                link: targetUrl
              },
              notification: {
                icon: "/icon-192.png",
                badge: "/icon-192.png",
                tag: notificationId,
                requireInteraction: false
              }
            }
          });
          sent++;
        } catch (error) {
          console.error(`[FCM] Erro ao enviar para token ${token.substring(0, 6)}...:`, error?.message);
          if (error.code === "messaging/registration-token-not-registered" || error.code === "messaging/invalid-registration-token") {
            await unsubscribeUserFromFcm2(userId, token);
          }
          failed++;
        }
      }
      return { sent, failed };
    }
    var import_messaging22 = require("firebase-admin/messaging");
    var import_fs3 = __toESM2(require("fs"), 1);
    var import_path4 = __toESM2(require("path"), 1);
    var import_crypto3 = __toESM2(require("crypto"), 1);
    var DATA_DIR3 = import_path4.default.join(process.cwd(), "data");
    var DB_FILE2 = import_path4.default.join(DATA_DIR3, "notificacoes_db.json");
    var HASHES_FILE2 = import_path4.default.join(DATA_DIR3, "louvores_hashes.json");
    var SNAPSHOT_FILE2 = import_path4.default.join(DATA_DIR3, "sheets_snapshot.json");
    var READ_KEYS_FILE2 = import_path4.default.join(DATA_DIR3, "notificacoes_lidas.json");
    var localNotificacoes2 = [];
    var louvoresHashes2 = {};
    var markedReadKeys2 = /* @__PURE__ */ new Set();
    var currentSnapshot2 = {
      initialized: false,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      escalas: {},
      solicitacoes: {},
      recados: {}
    };
    function ensureDataDir2() {
      if (process.env.VERCEL) return;
      try {
        if (!import_fs3.default.existsSync(DATA_DIR3)) {
          import_fs3.default.mkdirSync(DATA_DIR3, { recursive: true });
        }
      } catch (err) {
        console.error("Erro ao criar diret\xF3rio data:", err);
      }
    }
    function loadNotifications3() {
      if (!process.env.VERCEL) {
        ensureDataDir2();
      }
      try {
        if (import_fs3.default.existsSync(DB_FILE2)) {
          const raw = import_fs3.default.readFileSync(DB_FILE2, "utf-8");
          localNotificacoes2 = JSON.parse(raw);
        }
      } catch (err) {
        console.warn("Aviso ao ler notificacoes_db.json:", err);
        localNotificacoes2 = [];
      }
      try {
        if (import_fs3.default.existsSync(READ_KEYS_FILE2)) {
          const raw = import_fs3.default.readFileSync(READ_KEYS_FILE2, "utf-8");
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            markedReadKeys2 = new Set(list.map((k) => String(k).trim()).filter(Boolean));
          }
        }
      } catch (err) {
        markedReadKeys2 = /* @__PURE__ */ new Set();
      }
      for (const n of localNotificacoes2) {
        if (n.lida === "SIM") {
          if (n.id) markedReadKeys2.add(n.id.trim());
          if (n.eventoId) markedReadKeys2.add(`evt:${n.eventoId.trim()}`);
          const normDest = normalizarNome2(n.destinatario);
          if (normDest && n.eventoId) markedReadKeys2.add(`user_evt:${normDest}_${n.eventoId.trim()}`);
        }
      }
      try {
        if (import_fs3.default.existsSync(HASHES_FILE2)) {
          const raw = import_fs3.default.readFileSync(HASHES_FILE2, "utf-8");
          louvoresHashes2 = JSON.parse(raw);
        }
      } catch (err) {
        louvoresHashes2 = {};
      }
      try {
        if (import_fs3.default.existsSync(SNAPSHOT_FILE2)) {
          const raw = import_fs3.default.readFileSync(SNAPSHOT_FILE2, "utf-8");
          currentSnapshot2 = JSON.parse(raw);
        }
      } catch (err) {
        currentSnapshot2 = {
          initialized: false,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          escalas: {},
          solicitacoes: {},
          recados: {}
        };
      }
      return localNotificacoes2;
    }
    function saveMarkedReadKeys2() {
      if (process.env.VERCEL) return;
      ensureDataDir2();
      try {
        const list = Array.from(markedReadKeys2);
        import_fs3.default.writeFileSync(READ_KEYS_FILE2, JSON.stringify(list, null, 2), "utf-8");
      } catch (err) {
        console.error("Erro ao salvar notificacoes_lidas.json:", err);
      }
    }
    function saveNotifications2() {
      if (process.env.VERCEL) return;
      ensureDataDir2();
      try {
        import_fs3.default.writeFileSync(DB_FILE2, JSON.stringify(localNotificacoes2, null, 2), "utf-8");
      } catch (err) {
        console.error("Erro ao salvar notificacoes_db.json:", err);
      }
    }
    function saveLouvoresHashes2() {
      if (process.env.VERCEL) return;
      ensureDataDir2();
      try {
        import_fs3.default.writeFileSync(HASHES_FILE2, JSON.stringify(louvoresHashes2, null, 2), "utf-8");
      } catch (err) {
        console.error("Erro ao salvar louvores_hashes.json:", err);
      }
    }
    function saveSheetsSnapshot2() {
      if (process.env.VERCEL) return;
      ensureDataDir2();
      try {
        import_fs3.default.writeFileSync(SNAPSHOT_FILE2, JSON.stringify(currentSnapshot2, null, 2), "utf-8");
      } catch (err) {
        console.error("Erro ao salvar sheets_snapshot.json:", err);
      }
    }
    function getSheetsSnapshot2() {
      return currentSnapshot2;
    }
    loadNotifications3();
    function normalizarNome2(txt) {
      if (!txt) return "";
      return txt.toString().toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
    }
    function isDateInPast2(dataCultoStr) {
      if (!dataCultoStr) return false;
      const match = dataCultoStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!match) return false;
      const dia = parseInt(match[1], 10);
      const mes = parseInt(match[2], 10);
      const ano = parseInt(match[3], 10);
      const sp = getSaoPauloNow2();
      const spMatch = sp.dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!spMatch) return false;
      const spDia = parseInt(spMatch[1], 10);
      const spMes = parseInt(spMatch[2], 10);
      const spAno = parseInt(spMatch[3], 10);
      if (ano < spAno) return true;
      if (ano > spAno) return false;
      if (mes < spMes) return true;
      if (mes > spMes) return false;
      return dia < spDia;
    }
    function extrairMembrosDaEscala2(escala) {
      const result = [];
      if (!escala) return result;
      if (escala.dirigente && escala.dirigente.trim()) {
        const nomeDir = escala.dirigente.trim();
        result.push({
          nome: nomeDir,
          funcao: "Dirigente"
        });
      }
      if (escala.mesario && escala.mesario.trim()) {
        const nomeMes = escala.mesario.trim();
        result.push({
          nome: nomeMes,
          funcao: "Mes\xE1rio de Som"
        });
      }
      if (escala.vocal && escala.vocal.trim()) {
        const vocals = escala.vocal.split(/[,X\/]/i).map((v) => v.trim()).filter((v) => v.length > 0);
        for (const v of vocals) {
          if (!result.some((m) => normalizarNome2(m.nome) === normalizarNome2(v))) {
            result.push({
              nome: v,
              funcao: "Vocal"
            });
          }
        }
      }
      if (escala.musicos && escala.musicos.trim()) {
        const rawMusicos = escala.musicos.split(/[,X\/]/i).map((m) => m.trim()).filter((m) => m.length > 0);
        for (const item of rawMusicos) {
          const matchInst = item.match(/^(.+?)\s*\((.+?)\)$/);
          let nome = item;
          let instrumento = void 0;
          if (matchInst) {
            nome = matchInst[1].trim();
            instrumento = matchInst[2].trim();
          }
          if (nome) {
            const existingIdx = result.findIndex((m) => normalizarNome2(m.nome) === normalizarNome2(nome));
            if (existingIdx >= 0) {
              result[existingIdx].instrumento = instrumento;
            } else {
              result.push({
                nome,
                funcao: "M\xFAsico",
                instrumento
              });
            }
          }
        }
      }
      return result;
    }
    function logChangeDetector2(params) {
      console.log(`
[CHANGE-DETECTOR]`);
      console.log(`aba: ${params.aba}`);
      if (params.linha !== void 0) console.log(`linha: ${params.linha}`);
      if (params.data) console.log(`data: ${params.data}`);
      console.log(`altera\xE7\xE3o detectada: ${params.alteracaoDetectada}`);
      console.log(`estado anterior: ${params.estadoAnterior}`);
      console.log(`estado atual: ${params.estadoAtual}`);
      console.log(`eventoId: ${params.eventoId}`);
      console.log(`destinat\xE1rios: ${params.destinatarios}`);
      console.log(`notifica\xE7\xE3o criada: ${params.notificacaoCriada}`);
      console.log(`origem: ${params.origem}
`);
    }
    function isUserInEscala2(escala, nome) {
      if (!escala || !nome) return false;
      const search = normalizarNome2(nome);
      if (!search) return false;
      const campos = [
        escala.dirigente,
        escala.vocal,
        escala.musicos,
        escala.mesario
      ];
      for (const c of campos) {
        if (c && normalizarNome2(c).includes(search)) {
          return true;
        }
      }
      return false;
    }
    function getSaoPauloNow2() {
      const now = /* @__PURE__ */ new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      const parts = formatter.formatToParts(now);
      let year = "2026";
      let month = "01";
      let day = "01";
      let hour = "00";
      let minute = "00";
      for (const p of parts) {
        if (p.type === "year") year = p.value;
        if (p.type === "month") month = p.value;
        if (p.type === "day") day = p.value;
        if (p.type === "hour") hour = p.value;
        if (p.type === "minute") minute = p.value;
      }
      if (hour === "24") hour = "00";
      const dateStr = `${day}/${month}/${year}`;
      const isoDate = `${year}-${month}-${day}`;
      const timeStr = `${hour}:${minute}`;
      const totalMinutes = parseInt(hour, 10) * 60 + parseInt(minute, 10);
      const spDate = /* @__PURE__ */ new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
      const dayOfWeek = spDate.getDay();
      return {
        dateStr,
        isoDate,
        dayOfWeek,
        timeStr,
        totalMinutes
      };
    }
    function isKeyMarkedRead2(id, eventoId, destinatario) {
      if (id && markedReadKeys2.has(id.trim())) return true;
      if (eventoId) {
        const cleanEvt = eventoId.trim();
        if (markedReadKeys2.has(`evt:${cleanEvt}`)) return true;
        if (destinatario) {
          const normDest = normalizarNome2(destinatario);
          if (normDest && markedReadKeys2.has(`user_evt:${normDest}_${cleanEvt}`)) return true;
        }
      }
      return false;
    }
    function registrarChavesComoLidas2(params) {
      const { id, eventoId, destinatario } = params;
      let changed = false;
      if (id && id.trim()) {
        const cleanId = id.trim();
        if (!markedReadKeys2.has(cleanId)) {
          markedReadKeys2.add(cleanId);
          changed = true;
        }
      }
      if (eventoId && eventoId.trim()) {
        const cleanEvt = eventoId.trim();
        if (!markedReadKeys2.has(`evt:${cleanEvt}`)) {
          markedReadKeys2.add(`evt:${cleanEvt}`);
          changed = true;
        }
        if (destinatario) {
          const normDest = normalizarNome2(destinatario);
          if (normDest && !markedReadKeys2.has(`user_evt:${normDest}_${cleanEvt}`)) {
            markedReadKeys2.add(`user_evt:${normDest}_${cleanEvt}`);
            changed = true;
          }
        }
      }
      if (changed) {
        saveMarkedReadKeys2();
      }
    }
    function criarNotificacaoSeNaoExiste2(params) {
      const { id: customId, destinatario, tipo, titulo, mensagem, eventoId, origem } = params;
      if (!destinatario || !eventoId) {
        return null;
      }
      const normDest = normalizarNome2(destinatario);
      const normEvento = eventoId.trim();
      const cleanCustomId = customId ? customId.trim() : "";
      const existing = localNotificacoes2.find((n) => {
        if (cleanCustomId && n.id && n.id.trim() === cleanCustomId) {
          return true;
        }
        const nDest = normalizarNome2(n.destinatario);
        const nEvento = (n.eventoId || "").trim();
        return (nDest === normDest || nDest === "todos") && nEvento === normEvento;
      });
      if (existing) {
        return null;
      }
      const jaFoiLida = isKeyMarkedRead2(cleanCustomId, normEvento, destinatario);
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      const novaNotif = {
        id: cleanCustomId || import_crypto3.default.randomUUID(),
        destinatario: destinatario.trim(),
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        tipo: tipo.trim().toUpperCase(),
        data: nowIso,
        dataHora: nowIso,
        lida: jaFoiLida ? "SIM" : "NAO",
        eventoId: normEvento,
        origem: origem || "APP"
      };
      localNotificacoes2.unshift(novaNotif);
      saveNotifications2();
      sendFcmPushToUser2(destinatario, {
        title: titulo,
        body: mensagem,
        id: novaNotif.id,
        eventoId: novaNotif.eventoId,
        type: novaNotif.tipo
      }).catch((err) => console.error("[FCM] Erro ao disparar push:", err));
      if (origem !== "GOOGLE_SHEETS") {
        pushNotificacaoParaGas2(novaNotif);
      }
      return novaNotif;
    }
    var gasApiUrlConfigured2 = "";
    function setGasApiUrlForNotifications2(url) {
      gasApiUrlConfigured2 = url;
    }
    async function pushNotificacaoParaGas2(notif) {
      if (!gasApiUrlConfigured2) return;
      try {
        const form = new URLSearchParams({
          action: "criarNotificacao",
          id: notif.id,
          destinatario: notif.destinatario,
          titulo: notif.titulo,
          mensagem: notif.mensagem,
          tipo: notif.tipo,
          data: notif.data,
          lida: notif.lida,
          eventoId: notif.eventoId || "",
          origem: notif.origem || "APP"
        });
        await fetch(gasApiUrlConfigured2, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json"
          },
          body: form.toString()
        });
      } catch (err) {
      }
    }
    function mergeGasNotifications2(gasList) {
      if (!Array.isArray(gasList)) return localNotificacoes2;
      let hasNew = false;
      for (const item of gasList) {
        if (!item || !item.id) continue;
        const normDest = normalizarNome2(item.destinatario);
        const cleanId = String(item.id).trim();
        const cleanEvento = item.eventoId ? String(item.eventoId).trim() : "";
        const cleanTitulo = (item.titulo || "").trim().toLowerCase();
        const cleanMensagem = (item.mensagem || "").trim().toLowerCase();
        const jaFoiMarcadaLida = isKeyMarkedRead2(cleanId, cleanEvento, item.destinatario) || String(item.lida || "").toUpperCase() === "SIM";
        const existing = localNotificacoes2.find((n) => {
          if (cleanId && n.id === cleanId) return true;
          if (cleanEvento && n.eventoId && n.eventoId === cleanEvento && normalizarNome2(n.destinatario) === normDest) {
            return true;
          }
          if (normDest && normalizarNome2(n.destinatario) === normDest && (n.titulo || "").trim().toLowerCase() === cleanTitulo && (n.mensagem || "").trim().toLowerCase() === cleanMensagem) {
            return true;
          }
          return false;
        });
        if (existing) {
          if (existing.lida === "SIM" || jaFoiMarcadaLida) {
            if (existing.lida !== "SIM") {
              existing.lida = "SIM";
              hasNew = true;
            }
            registrarChavesComoLidas2({ id: existing.id, eventoId: existing.eventoId, destinatario: existing.destinatario });
          } else if (item.lida && String(item.lida).toUpperCase() === "SIM") {
            existing.lida = "SIM";
            hasNew = true;
            registrarChavesComoLidas2({ id: existing.id, eventoId: existing.eventoId, destinatario: existing.destinatario });
          }
        } else {
          const statusLida = jaFoiMarcadaLida ? "SIM" : "NAO";
          const novaNotif = {
            id: cleanId || import_crypto3.default.randomUUID(),
            destinatario: item.destinatario || "TODOS",
            titulo: item.titulo || "Notifica\xE7\xE3o",
            mensagem: item.mensagem || "",
            tipo: (item.tipo || "GERAL").toUpperCase(),
            data: item.data || item.dataHora || (/* @__PURE__ */ new Date()).toISOString(),
            dataHora: item.dataHora || item.data || (/* @__PURE__ */ new Date()).toISOString(),
            lida: statusLida,
            eventoId: cleanEvento || void 0,
            origem: item.origem || "GOOGLE_SHEETS"
          };
          localNotificacoes2.push(novaNotif);
          if (statusLida === "SIM") {
            registrarChavesComoLidas2({ id: novaNotif.id, eventoId: novaNotif.eventoId, destinatario: novaNotif.destinatario });
          }
          hasNew = true;
        }
      }
      if (hasNew) {
        saveNotifications2();
      }
      return localNotificacoes2;
    }
    function getNotificacoesParaUsuario2(nomeUsuario) {
      const normUser = normalizarNome2(nomeUsuario);
      return localNotificacoes2.filter((n) => {
        const normDest = normalizarNome2(n.destinatario);
        return normDest === normUser || normDest === "todos" || normDest === "todos os membros" || normDest === "geral";
      }).map((n) => {
        if (n.lida !== "SIM" && isKeyMarkedRead2(n.id, n.eventoId, n.destinatario)) {
          n.lida = "SIM";
        }
        return n;
      }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    }
    function marcarComoLidaLocal2(idOrEventoId) {
      const clean = String(idOrEventoId || "").trim();
      if (!clean) return false;
      let found = false;
      for (const n of localNotificacoes2) {
        if (n.id === clean || n.eventoId && n.eventoId === clean) {
          n.lida = "SIM";
          registrarChavesComoLidas2({ id: n.id, eventoId: n.eventoId, destinatario: n.destinatario });
          found = true;
        }
      }
      registrarChavesComoLidas2({ id: clean, eventoId: clean });
      if (found) {
        saveNotifications2();
        return true;
      }
      return true;
    }
    function marcarTodasComoLidasLocal2(nomeUsuario) {
      const normUser = normalizarNome2(nomeUsuario);
      let count = 0;
      for (const n of localNotificacoes2) {
        const normDest = normalizarNome2(n.destinatario);
        if (normDest === normUser || normDest === "todos" || normDest === "todos os membros" || normDest === "geral") {
          n.lida = "SIM";
          registrarChavesComoLidas2({ id: n.id, eventoId: n.eventoId, destinatario: n.destinatario });
          count++;
        }
      }
      if (count > 0) {
        saveNotifications2();
      }
      return count;
    }
    function processarLembretesDeCulto2(escalas, integrantes) {
      if (!escalas || escalas.length === 0 || !integrantes || integrantes.length === 0) {
        return 0;
      }
      const sp = getSaoPauloNow2();
      const { dateStr, isoDate, dayOfWeek, totalMinutes } = sp;
      let slots = [];
      if (dayOfWeek === 2 || dayOfWeek === 5) {
        slots = [
          { slot: "09:00", slotMinutes: 9 * 60 },
          { slot: "12:00", slotMinutes: 12 * 60 },
          { slot: "15:00", slotMinutes: 15 * 60 },
          { slot: "18:00", slotMinutes: 18 * 60 },
          { slot: "19:00", slotMinutes: 19 * 60 }
        ];
      } else if (dayOfWeek === 0) {
        slots = [
          { slot: "10:00", slotMinutes: 10 * 60 },
          { slot: "13:00", slotMinutes: 13 * 60 },
          { slot: "15:30", slotMinutes: 15 * 60 + 30 },
          { slot: "17:00", slotMinutes: 17 * 60 }
        ];
      } else {
        return 0;
      }
      const escalaHoje = escalas.find((e) => {
        if (!e || !e.data) return false;
        const cleanE = e.data.trim().replace(/[^0-9/]/g, "");
        const cleanHoje = dateStr.replace(/[^0-9/]/g, "");
        return cleanE === cleanHoje;
      });
      if (!escalaHoje) {
        return 0;
      }
      const validSlots = slots.filter((s) => totalMinutes >= s.slotMinutes);
      if (validSlots.length === 0) return 0;
      const currentSlot = validSlots[validSlots.length - 1];
      const slotCode = currentSlot.slot.replace(":", "-");
      const membrosEscalados = extrairMembrosDaEscala2(escalaHoje);
      let totalCriadas = 0;
      for (const integrante of integrantes) {
        if (!integrante || !integrante.nome) continue;
        const normUser = normalizarNome2(integrante.nome).replace(/\s+/g, "_");
        const eventoId = `CULTO_${isoDate}_${slotCode}_${normUser}`;
        const membroInfo = membrosEscalados.find(
          (m) => normalizarNome2(m.nome) === normalizarNome2(integrante.nome)
        );
        const estaEscalado = Boolean(membroInfo) || isUserInEscala2(escalaHoje, integrante.nome);
        let titulo;
        let mensagem;
        let tipo;
        if (estaEscalado) {
          titulo = "Culto Hoje";
          const detalheFuncao = membroInfo ? membroInfo.instrumento ? `${membroInfo.funcao} (${membroInfo.instrumento})` : membroInfo.funcao : "a equipe";
          mensagem = `${integrante.nome}, a Paz! Hoje tem culto e voc\xEA est\xE1 escalado(a) como ${detalheFuncao}!`;
          tipo = "CULTO";
        } else {
          titulo = "Lembrete de Culto";
          mensagem = "Olha que ben\xE7\xE3o! Passando pra lembrar que hoje tem culto!";
          tipo = "LEMBRETE";
        }
        const notif = criarNotificacaoSeNaoExiste2({
          destinatario: integrante.nome,
          tipo,
          titulo,
          mensagem,
          eventoId,
          origem: "APP"
        });
        if (notif) {
          totalCriadas++;
        }
      }
      return totalCriadas;
    }
    function processarNotificacaoNovoRecado2(recadoId, integrantes, origem = "APP") {
      if (!recadoId) return 0;
      const eventoId = `NOVO_RECADO_${recadoId}`;
      let count = 0;
      for (const integrante of integrantes) {
        if (!integrante || !integrante.nome) continue;
        const n = criarNotificacaoSeNaoExiste2({
          destinatario: integrante.nome,
          tipo: "NOVO_RECADO",
          titulo: "Novo Recado",
          mensagem: "ATEN\xC7\xC3O! Tem um novo recado!",
          eventoId,
          origem
        });
        if (n) count++;
      }
      if (count > 0) {
        logChangeDetector2({
          aba: "RECADOS",
          linha: recadoId,
          alteracaoDetectada: "Novo recado inserido",
          estadoAnterior: "(vazio)",
          estadoAtual: `ID: ${recadoId}`,
          eventoId,
          destinatarios: "Todos os integrantes",
          notificacaoCriada: "ATEN\xC7\xC3O! Tem um novo recado!",
          origem
        });
      }
      return count;
    }
    function processarNotificacaoNovaEscala2(mesParam, integrantes, origem = "APP") {
      const sp = getSaoPauloNow2();
      let mesKey = sp.isoDate.substring(0, 7).replace("-", "_");
      if (mesParam && typeof mesParam === "string" && mesParam.trim()) {
        const clean = mesParam.trim().replace(/[^0-9]/g, "_");
        if (clean.length >= 6) {
          mesKey = clean;
        }
      }
      const eventoId = `NOVA_ESCALA_${mesKey}`;
      const jaExiste = localNotificacoes2.some((n) => (n.eventoId || "").trim() === eventoId);
      if (jaExiste) {
        return {
          sucesso: false,
          jaEnviada: true,
          mensagem: "A notifica\xE7\xE3o da nova escala deste m\xEAs j\xE1 foi enviada."
        };
      }
      let count = 0;
      for (const integrante of integrantes) {
        if (!integrante || !integrante.nome) continue;
        const n = criarNotificacaoSeNaoExiste2({
          destinatario: integrante.nome,
          tipo: "NOVA_ESCALA",
          titulo: "Nova Escala",
          mensagem: "ATEN\xC7\xC3O!! NOVA ESCALA DISPONIVEL",
          eventoId,
          origem
        });
        if (n) count++;
      }
      if (count > 0) {
        logChangeDetector2({
          aba: "ESCALA",
          alteracaoDetectada: "Divulga\xE7\xE3o de nova escala mensal",
          estadoAnterior: "(n\xE3o divulgada)",
          estadoAtual: `M\xEAs: ${mesKey}`,
          eventoId,
          destinatarios: "Todos os integrantes",
          notificacaoCriada: "ATEN\xC7\xC3O!! NOVA ESCALA DISPONIVEL",
          origem
        });
      }
      return {
        sucesso: true,
        mensagem: "Notifica\xE7\xE3o da nova escala enviada a todos com sucesso!",
        totalEnviadas: count
      };
    }
    function processarNotificacaoNovaSolicitacao2(params) {
      const { solicitacaoId, quemPediu, dataEscala, integrantes, origem = "APP" } = params;
      const safeId = (solicitacaoId || `${dataEscala}_${quemPediu}`).replace(/[^a-zA-Z0-9_-]/g, "_");
      const eventoId = `SOLICITACAO_${safeId}_NOVA`;
      const lideres = integrantes.filter((i) => {
        const f = (i.funcao || "").toLowerCase();
        return f.includes("lider");
      });
      let count = 0;
      for (const lider of lideres) {
        const n = criarNotificacaoSeNaoExiste2({
          destinatario: lider.nome,
          tipo: "SOLICITACAO_NOVA",
          titulo: "Solicita\xE7\xE3o de Troca",
          mensagem: `Ol\xE1 Lider, ${quemPediu} fez um solicita\xE7\xE3o de troca!`,
          eventoId,
          origem
        });
        if (n) count++;
      }
      return count;
    }
    function processarNotificacaoDecisaoSolicitacao2(params) {
      const { solicitacaoId, quemPediu, substituto, dataEscala, acao, origem = "APP" } = params;
      const safeId = (solicitacaoId || `${dataEscala}_${quemPediu}`).replace(/[^a-zA-Z0-9_-]/g, "_");
      let count = 0;
      if (acao === "APROVAR") {
        const n1 = criarNotificacaoSeNaoExiste2({
          destinatario: quemPediu,
          tipo: "SOLICITACAO_APROVADA",
          titulo: "Solicita\xE7\xE3o Aprovada",
          mensagem: `A Paz ${quemPediu}! Sua solicita\xE7\xE3o foi aprovada!`,
          eventoId: `SOLICITACAO_${safeId}_APROVADA_SOLICITANTE`,
          origem
        });
        if (n1) count++;
        if (substituto) {
          const n2 = criarNotificacaoSeNaoExiste2({
            destinatario: substituto,
            tipo: "SOLICITACAO_APROVADA",
            titulo: "Nova Escala Atribu\xEDda",
            mensagem: `A Paz ${substituto}! Nova escala pra voc\xEA!`,
            eventoId: `SOLICITACAO_${safeId}_APROVADA_SUBSTITUTO`,
            origem
          });
          if (n2) count++;
        }
        logChangeDetector2({
          aba: "SOLICITA\xC7\xD5ES",
          data: dataEscala,
          alteracaoDetectada: `Solicita\xE7\xE3o Aprovada (Solicitante: ${quemPediu}, Substituto: ${substituto})`,
          estadoAnterior: "PENDENTE",
          estadoAtual: "APROVADA",
          eventoId: `SOLICITACAO_${safeId}_APROVADA`,
          destinatarios: `${quemPediu}, ${substituto}`,
          notificacaoCriada: `Solicitante: Aprovada / Substituto: Nova Escala`,
          origem
        });
      } else if (acao === "RECUSAR") {
        const n1 = criarNotificacaoSeNaoExiste2({
          destinatario: quemPediu,
          tipo: "SOLICITACAO_RECUSADA",
          titulo: "Solicita\xE7\xE3o Recusada",
          mensagem: `A Paz ${quemPediu}! Solicita\xE7\xE3o N\xC3O aprovada!`,
          eventoId: `SOLICITACAO_${safeId}_RECUSADA_SOLICITANTE`,
          origem
        });
        if (n1) count++;
        if (substituto) {
          const n2 = criarNotificacaoSeNaoExiste2({
            destinatario: substituto,
            tipo: "SOLICITACAO_RECUSADA",
            titulo: "Solicita\xE7\xE3o N\xE3o Aprovada",
            mensagem: `A Paz ${substituto}! Sem altera\xE7\xE3o na escala!`,
            eventoId: `SOLICITACAO_${safeId}_RECUSADA_SUBSTITUTO`,
            origem
          });
          if (n2) count++;
        }
        logChangeDetector2({
          aba: "SOLICITA\xC7\xD5ES",
          data: dataEscala,
          alteracaoDetectada: `Solicita\xE7\xE3o Recusada (Solicitante: ${quemPediu}, Substituto: ${substituto})`,
          estadoAnterior: "PENDENTE",
          estadoAtual: "RECUSADA",
          eventoId: `SOLICITACAO_${safeId}_RECUSADA`,
          destinatarios: `${quemPediu}, ${substituto}`,
          notificacaoCriada: `Solicitante: N\xC3O aprovada / Substituto: Sem altera\xE7\xE3o`,
          origem
        });
      }
      return count;
    }
    function processarNotificacaoLouvoresUniformes2(params) {
      const { dataEscala, louvores, uniforme, escala, integrantes, origem = "APP" } = params;
      if (!dataEscala || !louvores && !uniforme) {
        return 0;
      }
      const cleanData = dataEscala.trim().replace(/[^0-9/]/g, "").replace(/\//g, "_");
      const content = `${(louvores || "").trim()}||${(uniforme || "").trim()}`;
      if (!content.replace(/\|/g, "").trim()) {
        return 0;
      }
      const hash = import_crypto3.default.createHash("md5").update(content).digest("hex").substring(0, 8);
      const previousHash = louvoresHashes2[dataEscala];
      if (previousHash === hash) {
        return 0;
      }
      louvoresHashes2[dataEscala] = hash;
      saveLouvoresHashes2();
      const eventoId = `LOUVORES_UNIFORMES_${cleanData}_V${hash}`;
      let count = 0;
      const destinatariosNotificados = [];
      const membrosEscala = extrairMembrosDaEscala2(escala);
      const nomesAlvo = /* @__PURE__ */ new Set();
      for (const m of membrosEscala) {
        if (m && m.nome && m.nome.trim()) {
          nomesAlvo.add(m.nome.trim());
        }
      }
      for (const integrante of integrantes || []) {
        if (!integrante || !integrante.nome) continue;
        if (isUserInEscala2(escala, integrante.nome)) {
          nomesAlvo.add(integrante.nome.trim());
        }
      }
      for (const nomeDest of nomesAlvo) {
        const n = criarNotificacaoSeNaoExiste2({
          destinatario: nomeDest,
          tipo: "LOUVORES_UNIFORMES",
          titulo: "Louvores e Uniformes",
          mensagem: `A Paz ${nomeDest}! Os louvores e uniformes j\xE1 est\xE3o dispon\xEDveis!`,
          eventoId,
          origem
        });
        if (n) {
          count++;
          destinatariosNotificados.push(nomeDest);
        }
      }
      if (count > 0) {
        logChangeDetector2({
          aba: "ESCALA",
          data: dataEscala,
          alteracaoDetectada: `Louvores/Uniformes Atualizados`,
          estadoAnterior: previousHash ? `Hash anterior: ${previousHash}` : "(vazio)",
          estadoAtual: `Hash novo: ${hash}`,
          eventoId,
          destinatarios: destinatariosNotificados.join(", "),
          notificacaoCriada: "A Paz (nome)! Os louvores e uniformes j\xE1 est\xE3o dispon\xEDveis!",
          origem
        });
      }
      return count;
    }
    function detectarAlteracoesNaPlanilha2(params) {
      const {
        escalaAtual = [],
        solicitacoesAtuais = [],
        recadosAtuais = [],
        integrantes = [],
        origem = "GOOGLE_SHEETS"
      } = params;
      let totalNotificacoes = 0;
      const eventosDetectados = [];
      if (!currentSnapshot2.initialized) {
        console.log(`[CHANGE-DETECTOR] Inicializando primeiro snapshot de refer\xEAncia (${escalaAtual.length} escalas). Nenhuma notifica\xE7\xE3o ser\xE1 disparada.`);
        currentSnapshot2.initialized = true;
        currentSnapshot2.timestamp = (/* @__PURE__ */ new Date()).toISOString();
        currentSnapshot2.escalas = {};
        currentSnapshot2.solicitacoes = {};
        currentSnapshot2.recados = {};
        for (const e of escalaAtual) {
          if (!e || !e.data) continue;
          const cleanData = e.data.trim();
          const content = `${(e.louvores || "").trim()}||${(e.uniforme || "").trim()}`;
          const hash = content.replace(/\|/g, "").trim() ? import_crypto3.default.createHash("md5").update(content).digest("hex").substring(0, 8) : "";
          currentSnapshot2.escalas[cleanData] = {
            data: cleanData,
            dirigente: e.dirigente || "",
            vocal: e.vocal || "",
            musicos: e.musicos || "",
            mesario: e.mesario || "",
            louvores: e.louvores || "",
            uniforme: e.uniforme || "",
            membros: extrairMembrosDaEscala2(e),
            louvoresHash: hash
          };
          if (hash) {
            louvoresHashes2[cleanData] = hash;
          }
        }
        for (const s of solicitacoesAtuais) {
          if (!s) continue;
          const sId = s.id || `${s.dataEscala}_${s.quemPediu}`;
          currentSnapshot2.solicitacoes[sId] = {
            status: (s.status || "PENDENTE").toUpperCase(),
            quemPediu: s.quemPediu || "",
            substituto: s.substituto || "",
            dataEscala: s.dataEscala || ""
          };
        }
        for (const r of recadosAtuais) {
          if (!r || !r.id) continue;
          currentSnapshot2.recados[r.id] = {
            id: r.id,
            titulo: r.titulo || "",
            ativo: (r.ativo || "SIM").toUpperCase()
          };
        }
        saveSheetsSnapshot2();
        saveLouvoresHashes2();
        return { totalNotificacoes: 0, eventosDetectados: ["PRIMEIRA_EXECUCAO_SNAPSHOT_CRIADO"] };
      }
      for (const escalaNova of escalaAtual) {
        if (!escalaNova || !escalaNova.data) continue;
        const dataCulto = escalaNova.data.trim();
        const cleanDataKey = dataCulto.replace(/[^0-9/]/g, "").replace(/\//g, "_");
        const escalaAntiga = currentSnapshot2.escalas[dataCulto];
        const dataPassada = isDateInPast2(dataCulto);
        const membrosNovos = extrairMembrosDaEscala2(escalaNova);
        if (escalaAntiga) {
          const membrosAntigos = escalaAntiga.membros || [];
          if (!dataPassada) {
            for (const mAntigo of membrosAntigos) {
              const continuaNaEscala = membrosNovos.some(
                (mNovo) => normalizarNome2(mNovo.nome) === normalizarNome2(mAntigo.nome)
              );
              if (!continuaNaEscala) {
                const normNome = normalizarNome2(mAntigo.nome).replace(/\s+/g, "_");
                const eventoId = `ESCALA_REMOVIDO_${cleanDataKey}_${normNome}`;
                eventosDetectados.push(eventoId);
                const n = criarNotificacaoSeNaoExiste2({
                  destinatario: mAntigo.nome,
                  tipo: "ESCALA",
                  titulo: "Altera\xE7\xE3o na Escala",
                  mensagem: `A Paz ${mAntigo.nome}! Voc\xEA foi removido(a) da escala do dia ${dataCulto}.`,
                  eventoId,
                  origem
                });
                if (n) {
                  totalNotificacoes++;
                  logChangeDetector2({
                    aba: "ESCALA",
                    data: dataCulto,
                    alteracaoDetectada: `Integrante Removido: ${mAntigo.nome}`,
                    estadoAnterior: `Escalado como ${mAntigo.funcao}${mAntigo.instrumento ? ` (${mAntigo.instrumento})` : ""}`,
                    estadoAtual: `(Removido da escala)`,
                    eventoId,
                    destinatarios: mAntigo.nome,
                    notificacaoCriada: `A Paz ${mAntigo.nome}! Voc\xEA foi removido(a) da escala do dia ${dataCulto}.`,
                    origem
                  });
                }
              }
            }
            for (const mNovo of membrosNovos) {
              const estavaNaEscala = membrosAntigos.some(
                (mAntigo) => normalizarNome2(mAntigo.nome) === normalizarNome2(mNovo.nome)
              );
              if (!estavaNaEscala) {
                const normNome = normalizarNome2(mNovo.nome).replace(/\s+/g, "_");
                const eventoId = `ESCALA_ADICIONADO_${cleanDataKey}_${normNome}`;
                const detalheFuncao = mNovo.instrumento ? `${mNovo.funcao} (${mNovo.instrumento})` : mNovo.funcao;
                eventosDetectados.push(eventoId);
                const n = criarNotificacaoSeNaoExiste2({
                  destinatario: mNovo.nome,
                  tipo: "ESCALA",
                  titulo: "Nova Escala para Voc\xEA",
                  mensagem: `A Paz ${mNovo.nome}! Voc\xEA foi escalado(a) para o culto do dia ${dataCulto} como ${detalheFuncao}!`,
                  eventoId,
                  origem
                });
                if (n) {
                  totalNotificacoes++;
                  logChangeDetector2({
                    aba: "ESCALA",
                    data: dataCulto,
                    alteracaoDetectada: `Integrante Adicionado: ${mNovo.nome}`,
                    estadoAnterior: `(N\xE3o estava escalado)`,
                    estadoAtual: `Escalado como ${detalheFuncao}`,
                    eventoId,
                    destinatarios: mNovo.nome,
                    notificacaoCriada: `A Paz ${mNovo.nome}! Voc\xEA foi escalado(a) para o culto do dia ${dataCulto} como ${detalheFuncao}!`,
                    origem
                  });
                }
              }
            }
            for (const mNovo of membrosNovos) {
              const exatoAntigo = membrosAntigos.find(
                (mA) => normalizarNome2(mA.nome) === normalizarNome2(mNovo.nome) && mA.funcao === mNovo.funcao && (mA.instrumento || "") === (mNovo.instrumento || "")
              );
              if (exatoAntigo) {
                continue;
              }
              const correspondenteAntigo = membrosAntigos.find(
                (mA) => normalizarNome2(mA.nome) === normalizarNome2(mNovo.nome)
              );
              if (correspondenteAntigo) {
                const funcaoMudou = correspondenteAntigo.funcao !== mNovo.funcao;
                const instAntigo = correspondenteAntigo.instrumento || "";
                const instNovo = mNovo.instrumento || "";
                const instrumentoMudou = instAntigo !== instNovo;
                if (funcaoMudou || instrumentoMudou) {
                  const detalheNovo = mNovo.instrumento ? `${mNovo.funcao} (${mNovo.instrumento})` : mNovo.funcao;
                  const detalheAntigo = correspondenteAntigo.instrumento ? `${correspondenteAntigo.funcao} (${correspondenteAntigo.instrumento})` : correspondenteAntigo.funcao;
                  const roleHash = import_crypto3.default.createHash("md5").update(detalheNovo).digest("hex").substring(0, 6);
                  const normNome = normalizarNome2(mNovo.nome).replace(/\s+/g, "_");
                  const eventoId = `ESCALA_ALTERADA_${cleanDataKey}_${normNome}_${roleHash}`;
                  eventosDetectados.push(eventoId);
                  const n = criarNotificacaoSeNaoExiste2({
                    destinatario: mNovo.nome,
                    tipo: "ESCALA",
                    titulo: "Fun\xE7\xE3o Alterada na Escala",
                    mensagem: `A Paz ${mNovo.nome}! Sua fun\xE7\xE3o na escala do dia ${dataCulto} foi alterada para ${detalheNovo}.`,
                    eventoId,
                    origem
                  });
                  if (n) {
                    totalNotificacoes++;
                    logChangeDetector2({
                      aba: "ESCALA",
                      data: dataCulto,
                      alteracaoDetectada: `Mudan\xE7a de Fun\xE7\xE3o/Instrumento: ${mNovo.nome}`,
                      estadoAnterior: detalheAntigo,
                      estadoAtual: detalheNovo,
                      eventoId,
                      destinatarios: mNovo.nome,
                      notificacaoCriada: `A Paz ${mNovo.nome}! Sua fun\xE7\xE3o na escala do dia ${dataCulto} foi alterada para ${detalheNovo}.`,
                      origem
                    });
                  }
                }
              }
            }
            const louvoresAntigo = (escalaAntiga.louvores || "").trim();
            const louvoresNovo = (escalaNova.louvores || "").trim();
            const uniformeAntigo = (escalaAntiga.uniforme || "").trim();
            const uniformeNovo = (escalaNova.uniforme || "").trim();
            if (louvoresAntigo !== louvoresNovo || uniformeAntigo !== uniformeNovo) {
              const countLouv = processarNotificacaoLouvoresUniformes2({
                dataEscala: dataCulto,
                louvores: louvoresNovo,
                uniforme: uniformeNovo,
                escala: escalaNova,
                integrantes,
                origem
              });
              totalNotificacoes += countLouv;
            }
          }
        } else {
          if (!dataPassada) {
            for (const mNovo of membrosNovos) {
              const normNome = normalizarNome2(mNovo.nome).replace(/\s+/g, "_");
              const eventoId = `ESCALA_ADICIONADO_${cleanDataKey}_${normNome}`;
              const detalheFuncao = mNovo.instrumento ? `${mNovo.funcao} (${mNovo.instrumento})` : mNovo.funcao;
              const n = criarNotificacaoSeNaoExiste2({
                destinatario: mNovo.nome,
                tipo: "ESCALA",
                titulo: "Nova Escala para Voc\xEA",
                mensagem: `A Paz ${mNovo.nome}! Voc\xEA foi escalado(a) para o culto do dia ${dataCulto} como ${detalheFuncao}!`,
                eventoId,
                origem
              });
              if (n) {
                totalNotificacoes++;
                eventosDetectados.push(eventoId);
              }
            }
          }
        }
        const content = `${(escalaNova.louvores || "").trim()}||${(escalaNova.uniforme || "").trim()}`;
        const hash = content.replace(/\|/g, "").trim() ? import_crypto3.default.createHash("md5").update(content).digest("hex").substring(0, 8) : "";
        currentSnapshot2.escalas[dataCulto] = {
          data: dataCulto,
          dirigente: escalaNova.dirigente || "",
          vocal: escalaNova.vocal || "",
          musicos: escalaNova.musicos || "",
          mesario: escalaNova.mesario || "",
          louvores: escalaNova.louvores || "",
          uniforme: escalaNova.uniforme || "",
          membros: membrosNovos,
          louvoresHash: hash
        };
      }
      for (const sol of solicitacoesAtuais) {
        if (!sol) continue;
        const solId = sol.id || `${sol.dataEscala}_${sol.quemPediu}`;
        const statusAtual = (sol.status || "PENDENTE").toUpperCase();
        const solAntiga = currentSnapshot2.solicitacoes[solId];
        if (solAntiga) {
          const statusAntigo = solAntiga.status;
          if (statusAntigo === "PENDENTE" && statusAtual === "APROVADA") {
            const count = processarNotificacaoDecisaoSolicitacao2({
              solicitacaoId: solId,
              quemPediu: sol.quemPediu || solAntiga.quemPediu,
              substituto: sol.substituto || solAntiga.substituto,
              dataEscala: sol.dataEscala || solAntiga.dataEscala,
              acao: "APROVAR",
              origem
            });
            totalNotificacoes += count;
            eventosDetectados.push(`SOLICITACAO_${solId}_APROVADA`);
          } else if (statusAntigo === "PENDENTE" && statusAtual === "RECUSADA") {
            const count = processarNotificacaoDecisaoSolicitacao2({
              solicitacaoId: solId,
              quemPediu: sol.quemPediu || solAntiga.quemPediu,
              substituto: sol.substituto || solAntiga.substituto,
              dataEscala: sol.dataEscala || solAntiga.dataEscala,
              acao: "RECUSAR",
              origem
            });
            totalNotificacoes += count;
            eventosDetectados.push(`SOLICITACAO_${solId}_RECUSADA`);
          }
        }
        currentSnapshot2.solicitacoes[solId] = {
          status: statusAtual,
          quemPediu: sol.quemPediu || (solAntiga ? solAntiga.quemPediu : ""),
          substituto: sol.substituto || (solAntiga ? solAntiga.substituto : ""),
          dataEscala: sol.dataEscala || (solAntiga ? solAntiga.dataEscala : "")
        };
      }
      const novosRecadosSnapshot = {};
      for (const rec of recadosAtuais) {
        if (!rec || !rec.id) continue;
        const recId = rec.id;
        const ativoAtual = (rec.ativo || "SIM").toUpperCase();
        const recAntigo = currentSnapshot2.recados[recId];
        if (!recAntigo && ativoAtual === "SIM") {
          const count = processarNotificacaoNovoRecado2(recId, integrantes, origem);
          totalNotificacoes += count;
          eventosDetectados.push(`NOVO_RECADO_${recId}`);
        }
        novosRecadosSnapshot[recId] = {
          id: recId,
          titulo: rec.titulo || "",
          ativo: ativoAtual
        };
      }
      currentSnapshot2.recados = novosRecadosSnapshot;
      currentSnapshot2.timestamp = (/* @__PURE__ */ new Date()).toISOString();
      saveSheetsSnapshot2();
      return { totalNotificacoes, eventosDetectados };
    }
    function resetSnapshotForTesting2() {
      currentSnapshot2 = {
        initialized: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        escalas: {},
        solicitacoes: {},
        recados: {}
      };
    }
    function executarBateriaDeTestesDetector2() {
      console.log("\n=======================================================");
      console.log("INICIANDO AUDITORIA E TESTES DO DETECTOR DE ALTERA\xC7\xD5ES");
      console.log("=======================================================\n");
      const runId = Math.floor(Math.random() * 1e6);
      const diaNum = 10 + runId % 18;
      const dataTeste = `${diaNum}/08/2026`;
      const resultados = [];
      const integrantesMock = [
        { nome: "Jadson", funcao: "L\xEDder" },
        { nome: "Jo\xE3o", funcao: "Integrante" },
        { nome: "Maria", funcao: "Integrante" },
        { nome: "Lucas", funcao: "Integrante" }
      ];
      resetSnapshotForTesting2();
      const escalaBase = [
        {
          data: dataTeste,
          dirigente: "Maria",
          vocal: "Lucas",
          musicos: "Jadson (Violino)",
          mesario: "Jo\xE3o",
          louvores: `1. Ruja o Le\xE3o, 2. Aclame ao Senhor [T${runId}]`,
          uniforme: "Camisa Preta"
        }
      ];
      console.log(">>> [SETUP] Inicializando Snapshot...");
      const resSnapshot = detectarAlteracoesNaPlanilha2({
        escalaAtual: escalaBase,
        integrantes: integrantesMock,
        origem: "GOOGLE_SHEETS"
      });
      console.log(">>> Executando TESTE 1 (Pessoa removida/adicionada)...");
      const escalaT1 = [
        {
          data: dataTeste,
          dirigente: "Maria",
          vocal: "Lucas",
          musicos: "Jo\xE3o (Viol\xE3o)",
          // Jadson removido, João adicionado nos músicos
          mesario: "Maria",
          // João removido do mesário
          louvores: `1. Ruja o Le\xE3o, 2. Aclame ao Senhor [T${runId}]`,
          uniforme: "Camisa Preta"
        }
      ];
      const resT1 = detectarAlteracoesNaPlanilha2({
        escalaAtual: escalaT1,
        integrantes: integrantesMock,
        origem: "GOOGLE_SHEETS"
      });
      const t1Passou = resT1.eventosDetectados.some((e) => e.includes("ESCALA_REMOVIDO") || e.includes("ESCALA_ADICIONADO"));
      resultados.push({
        teste: "TESTE 1",
        descricao: "Alterar diretamente uma pessoa na escala (remover/adicionar)",
        passou: t1Passou,
        detalhes: `Eventos detectados: ${resT1.eventosDetectados.join(", ")} | Notifica\xE7\xF5es geradas: ${resT1.totalNotificacoes}`
      });
      console.log(">>> Executando TESTE 2 (Mudan\xE7a de Fun\xE7\xE3o/Instrumento)...");
      const escalaT2 = [
        {
          data: dataTeste,
          dirigente: "Maria",
          vocal: "Lucas",
          musicos: "Jo\xE3o (Guitarra)",
          // João alterado de Violão para Guitarra
          mesario: "Maria",
          louvores: `1. Ruja o Le\xE3o, 2. Aclame ao Senhor [T${runId}]`,
          uniforme: "Camisa Preta"
        }
      ];
      const resT2 = detectarAlteracoesNaPlanilha2({
        escalaAtual: escalaT2,
        integrantes: integrantesMock,
        origem: "GOOGLE_SHEETS"
      });
      const t2Passou = resT2.eventosDetectados.some((e) => e.includes("ESCALA_ALTERADA"));
      resultados.push({
        teste: "TESTE 2",
        descricao: "Alterar fun\xE7\xE3o/instrumento de integrante na escala",
        passou: t2Passou,
        detalhes: `Eventos: ${resT2.eventosDetectados.join(", ")}`
      });
      console.log(">>> Executando TESTE 3 (Altera\xE7\xE3o de Louvor)...");
      const escalaT3 = [
        {
          data: dataTeste,
          dirigente: "Maria",
          vocal: "Lucas",
          musicos: "Jo\xE3o (Guitarra)",
          mesario: "Maria",
          louvores: `1. Porque Ele Vive, 2. Bondade de Deus [T${runId}]`,
          // Louvores alterados
          uniforme: "Camisa Preta"
        }
      ];
      const resT3 = detectarAlteracoesNaPlanilha2({
        escalaAtual: escalaT3,
        integrantes: integrantesMock,
        origem: "GOOGLE_SHEETS"
      });
      const t3Passou = resT3.totalNotificacoes > 0;
      resultados.push({
        teste: "TESTE 3",
        descricao: "Alterar louvores diretamente na planilha",
        passou: t3Passou,
        detalhes: `Notifica\xE7\xF5es enviadas aos integrantes escalados: ${resT3.totalNotificacoes}`
      });
      console.log(">>> Executando TESTE 4 (Altera\xE7\xE3o de Uniforme)...");
      const escalaT4 = [
        {
          data: dataTeste,
          dirigente: "Maria",
          vocal: "Lucas",
          musicos: "Jo\xE3o (Guitarra)",
          mesario: "Maria",
          louvores: `1. Porque Ele Vive, 2. Bondade de Deus [T${runId}]`,
          uniforme: `Camisa Branca e Cal\xE7a Jeans [T${runId}]`
          // Uniforme alterado
        }
      ];
      const resT4 = detectarAlteracoesNaPlanilha2({
        escalaAtual: escalaT4,
        integrantes: integrantesMock,
        origem: "GOOGLE_SHEETS"
      });
      const t4Passou = resT4.totalNotificacoes > 0;
      resultados.push({
        teste: "TESTE 4",
        descricao: "Alterar uniforme na planilha",
        passou: t4Passou,
        detalhes: `Notifica\xE7\xF5es enviadas aos escalados: ${resT4.totalNotificacoes}`
      });
      console.log(">>> Executando TESTES 5 & 6 (Sem mudan\xE7as reais)...");
      const resT56 = detectarAlteracoesNaPlanilha2({
        escalaAtual: escalaT4,
        // Mesma escala idêntica
        integrantes: integrantesMock,
        origem: "GOOGLE_SHEETS"
      });
      const t56Passou = resT56.totalNotificacoes === 0 && resT56.eventosDetectados.length === 0;
      resultados.push({
        teste: "TESTE 5 & 6",
        descricao: "Editar a mesma informa\xE7\xE3o ou sem altera\xE7\xE3o relevante",
        passou: t56Passou,
        detalhes: `Total notifica\xE7\xF5es geradas: ${resT56.totalNotificacoes} (Esperado: 0)`
      });
      console.log(">>> Executando TESTES 7 & 8 (Origem APP vs GOOGLE_SHEETS)...");
      const notifApp = criarNotificacaoSeNaoExiste2({
        destinatario: "Jadson",
        tipo: "ESCALA",
        titulo: "Teste Origem APP",
        mensagem: "Notifica\xE7\xE3o gerada pelo App",
        eventoId: `TESTE_ORIGEM_APP_${runId}`,
        origem: "APP"
      });
      const notifSheets = criarNotificacaoSeNaoExiste2({
        destinatario: "Jadson",
        tipo: "ESCALA",
        titulo: "Teste Origem Sheets",
        mensagem: "Notifica\xE7\xE3o gerada pela Planilha",
        eventoId: `TESTE_ORIGEM_SHEETS_${runId}`,
        origem: "GOOGLE_SHEETS"
      });
      const t78Passou = notifApp?.origem === "APP" && notifSheets?.origem === "GOOGLE_SHEETS";
      resultados.push({
        teste: "TESTE 7 & 8",
        descricao: "Rastreamento correto da origem (APP vs GOOGLE_SHEETS)",
        passou: t78Passou,
        detalhes: `Origens registradas: App=${notifApp?.origem}, Sheets=${notifSheets?.origem}`
      });
      console.log(">>> Executando TESTES 9 & 10 (Solicita\xE7\xE3o e Anti-duplicidade)...");
      const solictacoesTeste = [
        {
          id: `sol_teste_${runId}`,
          dataEscala: dataTeste,
          quemPediu: "Maria",
          substituto: "Jo\xE3o",
          status: "APROVADA"
        }
      ];
      const resT9 = detectarAlteracoesNaPlanilha2({
        escalaAtual: escalaT4,
        solicitacoesAtuais: solictacoesTeste,
        integrantes: integrantesMock,
        origem: "GOOGLE_SHEETS"
      });
      const resT10 = detectarAlteracoesNaPlanilha2({
        escalaAtual: escalaT4,
        solicitacoesAtuais: solictacoesTeste,
        integrantes: integrantesMock,
        origem: "GOOGLE_SHEETS"
      });
      const t910Passou = resT10.totalNotificacoes === 0;
      resultados.push({
        teste: "TESTE 9 & 10",
        descricao: "Aprova\xE7\xE3o de solicita\xE7\xE3o e blindagem contra duplicidade",
        passou: t910Passou,
        detalhes: `Segunda execu\xE7\xE3o com dados id\xEAnticos gerou ${resT10.totalNotificacoes} notifica\xE7\xF5es (Anti-duplicidade 100% ativa)`
      });
      console.log(">>> Executando TESTE 11 (Exclus\xE3o de recado silenciosa)...");
      const recado1 = { id: `rec_${runId}`, titulo: "Recado Teste", ativo: "SIM" };
      detectarAlteracoesNaPlanilha2({
        escalaAtual: escalaT4,
        recadosAtuais: [recado1],
        integrantes: integrantesMock,
        origem: "GOOGLE_SHEETS"
      });
      const resT11 = detectarAlteracoesNaPlanilha2({
        escalaAtual: escalaT4,
        recadosAtuais: [],
        integrantes: integrantesMock,
        origem: "GOOGLE_SHEETS"
      });
      const t11Passou = resT11.totalNotificacoes === 0 && !resT11.eventosDetectados.some((e) => e.includes("EXCLUIR"));
      resultados.push({
        teste: "TESTE 11",
        descricao: "Exclus\xE3o de recado n\xE3o gera notifica\xE7\xE3o (comportamento silencioso)",
        passou: t11Passou,
        detalhes: `Notifica\xE7\xF5es na exclus\xE3o: ${resT11.totalNotificacoes} (Esperado: 0)`
      });
      console.log(">>> Executando TESTE 12 (Preserva\xE7\xE3o de UUID \xFAnico)...");
      const evtIdUnico = `EVENTO_UNICO_TESTE_${runId}`;
      const notif1 = criarNotificacaoSeNaoExiste2({
        destinatario: "Jadson",
        tipo: "CULTO",
        titulo: "Teste UUID 1",
        mensagem: "Msg 1",
        eventoId: evtIdUnico
      });
      const notif2 = criarNotificacaoSeNaoExiste2({
        destinatario: "Jadson",
        tipo: "CULTO",
        titulo: "Teste UUID 2",
        mensagem: "Msg 2",
        eventoId: evtIdUnico
      });
      const todasNotifs = getNotificacoesParaUsuario2("Jadson");
      const matchingEvt = todasNotifs.filter((n) => n.eventoId === evtIdUnico);
      const t12Passou = notif1 !== null && notif2 === null && matchingEvt.length === 1;
      resultados.push({
        teste: "TESTE 12",
        descricao: "Preserva\xE7\xE3o de UUID \xFAnico e rejei\xE7\xE3o de duplicatas por eventoId",
        passou: t12Passou,
        detalhes: `Primeira inser\xE7\xE3o: ${notif1 ? "Criada" : "Erro"} | Segunda: ${notif2 ? "Duplicou (Erro)" : "Bloqueada com Sucesso"} | Total com eventoId: ${matchingEvt.length}`
      });
      const sucessoGeral = resultados.every((r) => r.passou);
      console.log("\n=======================================================");
      console.log(`RESULTADO GERAL DOS TESTES: ${sucessoGeral ? "\u2705 TODOS PASSARAM" : "\u274C FALHAS ENCONTRADAS"}`);
      console.log("=======================================================\n");
      return { sucessoGeral, resultados };
    }
    function extractPlaylistId2(input) {
      if (!input || typeof input !== "string") return null;
      const trimmed = input.trim();
      if (/^[a-zA-Z0-9_-]{10,64}$/.test(trimmed) && !trimmed.includes(".") && !trimmed.includes("/")) {
        return trimmed;
      }
      try {
        const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
        const listParam = parsed.searchParams.get("list");
        if (listParam && listParam.trim().length > 0) {
          return listParam.trim();
        }
      } catch (e) {
      }
      const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) {
        return match[1].trim();
      }
      return null;
    }
    async function fetchYouTubePlaylist2(playlistId, apiKey) {
      const cleanId = (playlistId || "").trim();
      if (!cleanId) {
        return {
          success: false,
          statusCode: 400,
          errorMessage: "O link informado n\xE3o parece ser uma playlist v\xE1lida do YouTube."
        };
      }
      const key = apiKey || process.env.YOUTUBE_API_KEY || "";
      if (!key) {
        console.warn("[YouTube API] Vari\xE1vel de ambiente YOUTUBE_API_KEY n\xE3o configurada no backend.");
        return {
          success: false,
          statusCode: 503,
          errorMessage: "N\xE3o foi poss\xEDvel importar a playlist no momento. Tente novamente."
        };
      }
      try {
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${encodeURIComponent(
          cleanId
        )}&key=${encodeURIComponent(key)}`;
        const playlistRes = await fetch(playlistUrl, {
          method: "GET",
          headers: { Accept: "application/json" }
        });
        if (!playlistRes.ok) {
          const errText = await playlistRes.text().catch(() => "");
          console.error(`[YouTube API] Erro ao buscar playlist (${playlistRes.status}):`, errText);
          if (playlistRes.status === 404) {
            return {
              success: false,
              statusCode: 404,
              errorMessage: "N\xE3o foi poss\xEDvel encontrar essa playlist. Verifique o link e tente novamente."
            };
          }
          return {
            success: false,
            statusCode: 502,
            errorMessage: "N\xE3o foi poss\xEDvel importar a playlist no momento. Tente novamente."
          };
        }
        const playlistJson = await playlistRes.json();
        if (!playlistJson.items || playlistJson.items.length === 0) {
          return {
            success: false,
            statusCode: 404,
            errorMessage: "N\xE3o foi poss\xEDvel encontrar essa playlist. Verifique o link e tente novamente."
          };
        }
        const playlistSnippet = playlistJson.items[0].snippet || {};
        const playlistTitle = playlistSnippet.title || "Playlist do YouTube";
        const playlistThumbnail = playlistSnippet.thumbnails?.high?.url || playlistSnippet.thumbnails?.medium?.url || playlistSnippet.thumbnails?.default?.url || "";
        let allItems = [];
        let nextPageToken = void 0;
        let pageCount = 0;
        const maxPages = 10;
        do {
          pageCount++;
          let itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${encodeURIComponent(
            cleanId
          )}&key=${encodeURIComponent(key)}`;
          if (nextPageToken) {
            itemsUrl += `&pageToken=${encodeURIComponent(nextPageToken)}`;
          }
          const itemsRes = await fetch(itemsUrl, {
            method: "GET",
            headers: { Accept: "application/json" }
          });
          if (!itemsRes.ok) {
            const errText = await itemsRes.text().catch(() => "");
            console.error(`[YouTube API] Erro ao buscar itens da p\xE1gina ${pageCount} (${itemsRes.status}):`, errText);
            break;
          }
          const itemsJson = await itemsRes.json();
          const rawItems = itemsJson.items || [];
          for (const item of rawItems) {
            const snippet = item.snippet || {};
            const contentDetails = item.contentDetails || {};
            const videoId = snippet.resourceId?.videoId || contentDetails.videoId || "";
            const rawTitle = (snippet.title || "").trim();
            const isUnavailable = !videoId || rawTitle === "Private video" || rawTitle === "Deleted video" || rawTitle === "V\xEDdeo privado" || rawTitle === "V\xEDdeo exclu\xEDdo";
            const position = typeof snippet.position === "number" ? snippet.position + 1 : allItems.length + 1;
            const thumbnail = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "");
            allItems.push({
              videoId,
              title: isUnavailable ? "V\xEDdeo indispon\xEDvel" : rawTitle || "Louvor sem t\xEDtulo",
              youtubeUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
              thumbnailUrl: thumbnail,
              position,
              playlistId: cleanId,
              isAvailable: !isUnavailable,
              unavailableReason: isUnavailable ? "V\xEDdeo privado ou removido no YouTube" : void 0
            });
          }
          nextPageToken = itemsJson.nextPageToken;
        } while (nextPageToken && pageCount < maxPages);
        return {
          success: true,
          data: {
            playlistId: cleanId,
            playlistTitle,
            itemCount: allItems.length,
            thumbnailUrl: playlistThumbnail,
            items: allItems
          }
        };
      } catch (err) {
        console.error("[YouTube API] Exce\xE7\xE3o inesperada:", err);
        return {
          success: false,
          statusCode: 500,
          errorMessage: "N\xE3o foi poss\xEDvel importar a playlist no momento. Tente novamente."
        };
      }
    }
    var GAS_API_URL2 = process.env.GAS_API_URL || "https://script.google.com/macros/s/AKfycbyK1dC5cjUtK0YZRN2FFp2wGuJpiLHU_g4rajI-SkMv2gDsbrKt2XgptQg_olu2tcs/exec";
    setGasApiUrlForNotifications2(GAS_API_URL2);
    var DATA_DIR22 = import_path22.default.join(process.cwd(), "data");
    var LINK_LOUVORES_FILE2 = import_path22.default.join(DATA_DIR22, "link_louvores.json");
    var cachedLinkLouvores2 = [];
    function cleanDateString2(dateStr) {
      if (!dateStr) return "";
      const str = String(dateStr).trim();
      if (!str) return "";
      if (str.includes("-")) {
        const isoParts = str.split("T")[0].split("-");
        if (isoParts.length === 3 && isoParts[0].length === 4) {
          const year = isoParts[0];
          const month = String(parseInt(isoParts[1], 10) || 0).padStart(2, "0");
          const day = String(parseInt(isoParts[2], 10) || 0).padStart(2, "0");
          return `${day}/${month}/${year}`;
        }
      }
      if (str.includes("/")) {
        const cleanOnly = str.replace(/[^0-9/]/g, "");
        const parts = cleanOnly.split("/");
        if (parts.length === 3) {
          const day = String(parseInt(parts[0], 10) || 0).padStart(2, "0");
          const month = String(parseInt(parts[1], 10) || 0).padStart(2, "0");
          let year = parts[2];
          if (year.length === 2) year = `20${year}`;
          return `${day}/${month}/${year}`;
        }
      }
      return str.replace(/[^0-9/]/g, "");
    }
    function loadCachedLinkLouvores2() {
      try {
        if (!process.env.VERCEL && !import_fs22.default.existsSync(DATA_DIR22)) {
          import_fs22.default.mkdirSync(DATA_DIR22, { recursive: true });
        }
        if (import_fs22.default.existsSync(LINK_LOUVORES_FILE2)) {
          const raw = import_fs22.default.readFileSync(LINK_LOUVORES_FILE2, "utf-8");
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            cachedLinkLouvores2 = parsed.map((item) => ({
              ...item,
              data: cleanDateString2(item.data || item.dataEscala),
              dataEscala: cleanDateString2(item.data || item.dataEscala)
            }));
          }
        }
      } catch (e) {
        cachedLinkLouvores2 = [];
      }
    }
    function saveCachedLinkLouvores2() {
      if (process.env.VERCEL) return;
      try {
        if (!import_fs22.default.existsSync(DATA_DIR22)) {
          import_fs22.default.mkdirSync(DATA_DIR22, { recursive: true });
        }
        import_fs22.default.writeFileSync(LINK_LOUVORES_FILE2, JSON.stringify(cachedLinkLouvores2, null, 2), "utf-8");
      } catch (e) {
      }
    }
    loadCachedLinkLouvores2();
    function extractYouTubeVideoId2(urlOrId) {
      if (!urlOrId) return "";
      const trimmed = urlOrId.trim();
      if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return trimmed;
      }
      try {
        const fullUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
        const parsed = new URL(fullUrl);
        const host = parsed.hostname.toLowerCase();
        if (host.includes("youtu.be")) {
          const id = parsed.pathname.replace(/^\//, "").split(/[\/\?\#]/)[0];
          if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
        }
        if (parsed.pathname.startsWith("/watch")) {
          const v = parsed.searchParams.get("v");
          if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
        }
        if (parsed.pathname.startsWith("/shorts/") || parsed.pathname.startsWith("/embed/") || parsed.pathname.startsWith("/v/")) {
          const parts = parsed.pathname.split("/").filter(Boolean);
          const id = parts[1]?.split(/[\/\?\#]/)[0];
          if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
        }
      } catch (e) {
      }
      const match = trimmed.match(/(?:v=|youtu\.be\/|\/v\/|\/embed\/|\/shorts\/)([\w-]{11})/i);
      return match && match[1] && /^[a-zA-Z0-9_-]{11}$/.test(match[1]) ? match[1] : "";
    }
    function normalizeYouTubeUrl2(urlOrId) {
      if (!urlOrId) return "";
      const videoId = extractYouTubeVideoId2(urlOrId);
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
      return urlOrId.trim();
    }
    function cleanLouvoresText2(raw) {
      if (!raw) return "";
      return raw.split("\n").map((line) => {
        let l = line.trim();
        if (!l) return null;
        l = l.replace(/(https?:\/\/[^\s\)\],]+|(?:www\.|m\.|music\.)?youtube\.com\/[^\s\)\],]+|youtu\.be\/[^\s\)\],]+)/gi, "").replace(/\(\s*\)/g, "").replace(/\[\s*\]/g, "").replace(/[\|\(\)\[\]\-]+$/, "").trim();
        return l || null;
      }).filter(Boolean).join("\n");
    }
    function extractStructuredLouvores2(raw, dataEscala) {
      if (!raw) return [];
      const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
      return lines.map((line, idx) => {
        let l = line.replace(/^(\(\d+\)|\d+[\.\-\)])\s*/i, "").trim();
        let url = "";
        const ytMatch = l.match(/(https?:\/\/[^\s\)\],]+|(?:www\.|m\.|music\.)?youtube\.com\/[^\s\)\],]+|youtu\.be\/[^\s\)\],]+)/i);
        if (ytMatch) {
          url = ytMatch[0];
          l = l.replace(url, "").replace(/\(\s*\)/g, "").replace(/\[\s*\]/g, "").replace(/[\|\(\)\[\]\-]+$/, "").trim();
        }
        const finalName = l || line;
        const videoId = extractYouTubeVideoId2(url);
        const finalUrl = normalizeYouTubeUrl2(url) || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : "");
        return {
          id: `louvor-${dataEscala.replace(/[^0-9]/g, "")}-${idx}`,
          data: dataEscala,
          dataEscala,
          ordem: idx + 1,
          louvor: finalName,
          titulo: finalName,
          youtubeVideoId: videoId,
          youtubeUrl: finalUrl,
          linkYoutube: finalUrl,
          link_youtube: finalUrl,
          playlistId: "",
          playlistTitle: "",
          thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ""
        };
      });
    }
    var SESSION_SECRET2 = process.env.SESSION_SECRET || "escala-louvor-2k26-secret-token-sign-key-production-v2";
    var activeSessions2 = /* @__PURE__ */ new Map();
    var cachedEscalas2 = [];
    var cachedIntegrantes2 = [];
    var backgroundTimerStarted2 = false;
    async function syncEscalaDataBackground2(origem = "GOOGLE_SHEETS") {
      try {
        const gasResponse = await fetch(`${GAS_API_URL2}?action=getEscalaData`, {
          method: "GET",
          headers: { Accept: "application/json" }
        });
        if (gasResponse.ok) {
          const data = await gasResponse.json();
          if (data && Array.isArray(data.escala)) {
            cachedEscalas2 = data.escala;
          }
          if (data && Array.isArray(data.integrantes)) {
            cachedIntegrantes2 = data.integrantes;
          }
          if (data && (Array.isArray(data.link_louvores) || Array.isArray(data.linkLouvores))) {
            const incoming = Array.isArray(data.link_louvores) ? data.link_louvores : data.linkLouvores;
            if (incoming.length > 0) {
              cachedLinkLouvores2 = incoming;
              saveCachedLinkLouvores2();
            }
          }
          if (cachedEscalas2.length > 0) {
            detectarAlteracoesNaPlanilha2({
              escalaAtual: cachedEscalas2,
              solicitacoesAtuais: Array.isArray(data.solicitacoes) ? data.solicitacoes : [],
              recadosAtuais: Array.isArray(data.recados) ? data.recados : [],
              integrantes: cachedIntegrantes2,
              origem
            });
          }
          processarLembretesDeCulto2(cachedEscalas2, cachedIntegrantes2);
        }
      } catch (err) {
      }
    }
    function startCultoScheduler2() {
      if (backgroundTimerStarted2) return;
      backgroundTimerStarted2 = true;
      syncEscalaDataBackground2();
      setInterval(() => {
        try {
          processarLembretesDeCulto2(cachedEscalas2, cachedIntegrantes2);
        } catch (e) {
        }
      }, 3e4);
      setInterval(() => {
        syncEscalaDataBackground2();
      }, 5 * 60 * 1e3);
    }
    function createSessionToken2(sessionData) {
      try {
        const payload = JSON.stringify(sessionData);
        const iv = import_crypto22.default.randomBytes(12);
        const key = import_crypto22.default.createHash("sha256").update(SESSION_SECRET2).digest();
        const cipher = import_crypto22.default.createCipheriv("aes-256-gcm", key, iv);
        let encrypted = cipher.update(payload, "utf8", "hex");
        encrypted += cipher.final("hex");
        const authTag = cipher.getAuthTag().toString("hex");
        const token = `${iv.toString("hex")}.${authTag}.${encrypted}`;
        activeSessions2.set(token, sessionData);
        return token;
      } catch (err) {
        const fallbackToken = import_crypto22.default.randomBytes(32).toString("hex");
        activeSessions2.set(fallbackToken, sessionData);
        return fallbackToken;
      }
    }
    function verifySessionToken2(tokenStr) {
      if (!tokenStr) return null;
      if (activeSessions2.has(tokenStr)) {
        const session = activeSessions2.get(tokenStr);
        if (Date.now() - session.createdAt < 30 * 24 * 60 * 60 * 1e3) {
          return session;
        }
        activeSessions2.delete(tokenStr);
      }
      try {
        const parts = tokenStr.split(".");
        if (parts.length !== 3) return null;
        const [ivHex, authTagHex, encryptedHex] = parts;
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const key = import_crypto22.default.createHash("sha256").update(SESSION_SECRET2).digest();
        const decipher = import_crypto22.default.createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedHex, "hex", "utf8");
        decrypted += decipher.final("utf8");
        const sessionData = JSON.parse(decrypted);
        if (Date.now() - sessionData.createdAt < 30 * 24 * 60 * 60 * 1e3) {
          activeSessions2.set(tokenStr, sessionData);
          return sessionData;
        }
        return null;
      } catch (err) {
        return null;
      }
    }
    function identificarPerfil2(funcaoStr) {
      const norm = (funcaoStr || "").toLowerCase();
      if (norm.includes("lider")) return "LIDER";
      if (norm.includes("dirigente")) return "DIRIGENTE";
      return "INTEGRANTE";
    }
    function authenticateToken2(req, res, next) {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
      if (!token) {
        res.status(401).json({
          sucesso: false,
          mensagem: "Acesso n\xE3o autorizado. Fa\xE7a login para continuar."
        });
        return;
      }
      const session = verifySessionToken2(token);
      if (!session) {
        res.status(401).json({
          sucesso: false,
          mensagem: "Sess\xE3o expirada ou inv\xE1lida. Por favor, autentique-se novamente."
        });
        return;
      }
      req.user = session;
      req.token = token;
      next();
    }
    function requireLider2(req, res, next) {
      const user = req.user;
      if (!user || user.role !== "LIDER") {
        res.status(403).json({
          sucesso: false,
          mensagem: "A\xE7\xE3o restrita a l\xEDderes do minist\xE9rio de louvor."
        });
        return;
      }
      next();
    }
    function requireDirigenteOuLider2(req, res, next) {
      const user = req.user;
      if (!user || user.role !== "LIDER" && user.role !== "DIRIGENTE") {
        res.status(403).json({
          sucesso: false,
          mensagem: "A\xE7\xE3o restrita a l\xEDderes e dirigentes do minist\xE9rio de louvor."
        });
        return;
      }
      next();
    }
    function createApiApp2() {
      const app22 = (0, import_express3.default)();
      startCultoScheduler2();
      app22.use(import_express3.default.json({ limit: "15mb" }));
      app22.use(import_express3.default.urlencoded({ extended: true, limit: "15mb" }));
      app22.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        );
        if (req.method === "OPTIONS") {
          res.sendStatus(204);
          return;
        }
        next();
      });
      app22.get("/api/health", (req, res) => {
        res.json({
          sucesso: true,
          status: "online",
          ambiente: process.env.NODE_ENV || "production",
          backend: "Google Apps Script",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      });
      app22.post("/api/auth/login", async (req, res) => {
        try {
          const { nome, senha } = req.body;
          if (!nome || typeof nome !== "string" || !nome.trim()) {
            res.status(400).json({
              sucesso: false,
              mensagem: "Nome de usu\xE1rio \xE9 obrigat\xF3rio."
            });
            return;
          }
          const cleanNome = nome.trim();
          const inputSenha = senha ? String(senha).trim() : "";
          const gasResponse = await fetch(`${GAS_API_URL2}?action=getEscalaData`, {
            method: "GET",
            headers: { Accept: "application/json" }
          });
          if (!gasResponse.ok) {
            throw new Error(`Falha de comunica\xE7\xE3o com o Google Apps Script: ${gasResponse.statusText}`);
          }
          const data = await gasResponse.json();
          if (!data || !data.sucesso || !Array.isArray(data.integrantes)) {
            throw new Error("N\xE3o foi poss\xEDvel carregar os integrantes da planilha.");
          }
          const integrante = data.integrantes.find(
            (i) => (i.nome || "").trim().toLowerCase() === cleanNome.toLowerCase()
          );
          if (!integrante) {
            res.status(404).json({
              sucesso: false,
              mensagem: `Integrante "${cleanNome}" n\xE3o foi encontrado na base de membros.`
            });
            return;
          }
          const memberSenha = (integrante.senha || "").toString().trim();
          if (memberSenha) {
            if (!inputSenha) {
              res.status(401).json({
                sucesso: false,
                mensagem: "Este usu\xE1rio possui senha cadastrada. Por favor, informe sua senha."
              });
              return;
            }
            if (memberSenha !== inputSenha) {
              res.status(401).json({
                sucesso: false,
                mensagem: "Senha incorreta. Verifique os dados digitados."
              });
              return;
            }
          }
          const role = identificarPerfil2(integrante.funcao);
          const sessionData = {
            nome: integrante.nome,
            funcao: integrante.funcao || "",
            instrumento: integrante.instrumento || "",
            role,
            rawPassword: memberSenha,
            createdAt: Date.now()
          };
          const sessionToken = createSessionToken2(sessionData);
          res.json({
            sucesso: true,
            mensagem: "Login realizado com sucesso.",
            token: sessionToken,
            user: {
              nome: sessionData.nome,
              funcao: sessionData.funcao,
              instrumento: sessionData.instrumento,
              role: sessionData.role
            }
          });
        } catch (error) {
          console.error("Erro na autentica\xE7\xE3o:", error);
          res.status(500).json({
            sucesso: false,
            mensagem: error.message || "Erro interno ao processar login com o Google Apps Script."
          });
        }
      });
      app22.get("/api/auth/me", authenticateToken2, (req, res) => {
        const user = req.user;
        res.json({
          sucesso: true,
          user: {
            nome: user.nome,
            funcao: user.funcao,
            instrumento: user.instrumento,
            role: user.role
          }
        });
      });
      app22.post("/api/auth/logout", authenticateToken2, (req, res) => {
        const token = req.token;
        if (token) {
          activeSessions2.delete(token);
        }
        res.json({
          sucesso: true,
          mensagem: "Sess\xE3o finalizada com sucesso."
        });
      });
      app22.post("/api/notifications/subscribe", authenticateToken2, async (req, res) => {
        const user = req.user;
        const { token } = req.body;
        if (!token) {
          res.status(400).json({ sucesso: false, mensagem: "Token \xE9 obrigat\xF3rio." });
          return;
        }
        await subscribeUserToFcm2(user.nome, token);
        res.json({ sucesso: true, mensagem: "Token registrado com sucesso." });
      });
      app22.post("/api/notifications/unsubscribe", authenticateToken2, async (req, res) => {
        const user = req.user;
        const { token } = req.body;
        if (!token) {
          res.status(400).json({ sucesso: false, mensagem: "Token \xE9 obrigat\xF3rio." });
          return;
        }
        const sucesso = await unsubscribeUserFromFcm2(user.nome, token);
        res.json({ sucesso, mensagem: sucesso ? "Token removido com sucesso." : "Token n\xE3o encontrado." });
      });
      app22.post("/api/notifications/test-fcm", authenticateToken2, async (req, res) => {
        const user = req.user;
        const tokens = await getFcmTokensForUser2(user.nome);
        if (tokens.length === 0) {
          res.json({
            success: true,
            sent: 0,
            failed: 0,
            message: "Nenhum token FCM registrado ou ativo para o usu\xE1rio no momento."
          });
          return;
        }
        const adminApp22 = getFirebaseAdminApp2();
        if (!adminApp22) {
          res.status(503).json({
            success: false,
            sent: 0,
            failed: tokens.length,
            message: "Firebase Admin SDK n\xE3o inicializado no servidor (credenciais ausentes)."
          });
          return;
        }
        const messaging = (0, import_messaging22.getMessaging)(adminApp22);
        const notificationId = import_crypto22.default.randomUUID();
        let sent = 0;
        let failed = 0;
        for (const token of tokens) {
          try {
            await messaging.send({
              token,
              notification: {
                title: "EscalaLouvor \u2014 Teste FCM",
                body: "Se voc\xEA recebeu esta notifica\xE7\xE3o, o Firebase Cloud Messaging est\xE1 funcionando!"
              },
              data: {
                id: notificationId,
                url: "/notificacoes",
                type: "TEST_NOTIFICATION"
              },
              webpush: {
                fcmOptions: {
                  link: "/notificacoes"
                },
                notification: {
                  icon: "/icon-192.png",
                  badge: "/icon-192.png",
                  tag: notificationId,
                  requireInteraction: false
                }
              }
            });
            sent++;
          } catch (error) {
            console.error(`Falha ao enviar FCM para token ${token.substring(0, 6)}...:`, error?.message);
            if (error.code === "messaging/registration-token-not-registered" || error.code === "messaging/invalid-registration-token") {
              await unsubscribeUserFromFcm2(user.nome, token);
            }
            failed++;
          }
        }
        res.json({ success: true, sent, failed, notificationId });
      });
      const handleFetchYouTubePlaylist = async (req, res) => {
        try {
          const urlOrId = (req.body?.url || req.body?.playlistId || req.query?.url || req.query?.playlistId || "").toString().trim();
          if (!urlOrId) {
            res.status(400).json({
              sucesso: false,
              mensagem: "O link ou ID da playlist do YouTube \xE9 obrigat\xF3rio."
            });
            return;
          }
          const playlistId = extractPlaylistId2(urlOrId);
          if (!playlistId) {
            res.status(400).json({
              sucesso: false,
              mensagem: "O link informado n\xE3o parece ser uma playlist v\xE1lida do YouTube."
            });
            return;
          }
          const result = await fetchYouTubePlaylist2(playlistId);
          if (!result.success || !result.data) {
            res.status(result.statusCode || 500).json({
              sucesso: false,
              mensagem: result.errorMessage || "N\xE3o foi poss\xEDvel importar a playlist no momento. Tente novamente."
            });
            return;
          }
          res.json({
            sucesso: true,
            dados: result.data,
            data: result.data
          });
        } catch (err) {
          console.error("[Backend] Erro na rota /api/youtube/playlist:", err);
          res.status(500).json({
            sucesso: false,
            mensagem: "N\xE3o foi poss\xEDvel importar a playlist no momento. Tente novamente."
          });
        }
      };
      app22.post("/api/youtube/playlist", authenticateToken2, handleFetchYouTubePlaylist);
      app22.get("/api/youtube/playlist", authenticateToken2, handleFetchYouTubePlaylist);
      app22.get("/api/escala", async (req, res) => {
        try {
          const authHeader = req.headers["authorization"];
          const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
          let userQuery = "";
          if (token) {
            const session = verifySessionToken2(token);
            if (session) {
              userQuery = `&nome=${encodeURIComponent(session.nome)}&senha=${encodeURIComponent(session.rawPassword || "")}`;
            }
          }
          const gasResponse = await fetch(`${GAS_API_URL2}?action=getEscalaData${userQuery}`, {
            method: "GET",
            headers: { Accept: "application/json" }
          });
          if (!gasResponse.ok) {
            throw new Error(`Erro na resposta do Google Apps Script: ${gasResponse.statusText}`);
          }
          const data = await gasResponse.json();
          if (data && Array.isArray(data.integrantes)) {
            data.integrantes = data.integrantes.map((item) => {
              const { senha, ...safeItem } = item;
              return safeItem;
            });
          }
          if (data && Array.isArray(data.solicitacoes)) {
            data.solicitacoes = data.solicitacoes.map((s, index) => {
              const dataEscala = s.data_escala || s.dataEscala || s.data || "";
              const quemPediu = s.quem_pediu || s.quemPediu || s.nome || "";
              const substituto = s.substituto || "";
              return {
                id: s.id || `sol-${dataEscala.replace(/[^0-9]/g, "")}-${quemPediu}-${substituto}-${index}`,
                dataEscala,
                quemPediu,
                funcao: s.funcao || "",
                instrumento: s.instrumento || "",
                substituto,
                motivo: s.motivo || "",
                status: (s.status || "PENDENTE").toUpperCase(),
                dataCriacao: s.data_criacao || s.dataCriacao || "",
                dataDecisao: s.data_decisao || s.dataDecisao || "",
                decididoPor: s.decidido_por || s.decididoPor || "",
                motivoDecisao: s.motivo_decisao || s.motivoDecisao || ""
              };
            });
          } else if (data) {
            data.solicitacoes = [];
          }
          if (data && Array.isArray(data.escala)) {
            data.escala = data.escala.map((esc) => ({
              ...esc,
              data: cleanDateString2(esc.data || esc.dataEscala || esc.dataCulto)
            }));
          }
          const incomingLinks = Array.isArray(data?.link_louvores) && data.link_louvores.length > 0 ? data.link_louvores : Array.isArray(data?.linkLouvores) && data.linkLouvores.length > 0 ? data.linkLouvores : [];
          if (incomingLinks.length > 0) {
            let normalizedIncoming = incomingLinks.map((it, idx) => {
              const rawDt = (it.dataEscala || it.data || "").toString().trim();
              const dt = cleanDateString2(rawDt);
              const ytVideoId = (it.youtubeVideoId || it.videoId || it.video_id || "").toString().trim();
              let ytUrl = (it.youtubeUrl || it.linkYoutube || it.link_youtube || it.url || "").toString().trim();
              if (!ytUrl && ytVideoId) {
                ytUrl = `https://www.youtube.com/watch?v=${ytVideoId}`;
              }
              const extractedId = ytVideoId || extractYouTubeVideoId2(ytUrl) || "";
              if (!ytUrl && extractedId) {
                ytUrl = `https://www.youtube.com/watch?v=${extractedId}`;
              }
              const title = cleanLouvoresText2(it.titulo || it.louvor || it.nome || "");
              return {
                id: it.id || `link-${dt.replace(/[^0-9]/g, "")}-${idx}`,
                data: dt,
                dataEscala: dt,
                ordem: it.ordem !== void 0 ? it.ordem : idx + 1,
                louvor: title,
                titulo: title,
                youtubeVideoId: extractedId,
                videoId: extractedId,
                youtubeUrl: ytUrl,
                linkYoutube: ytUrl,
                link_youtube: ytUrl,
                url: ytUrl,
                playlistId: (it.playlistId || "").toString().trim(),
                playlistTitle: (it.playlistTitle || "").toString().trim(),
                thumbnailUrl: it.thumbnailUrl || (extractedId ? `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg` : "")
              };
            });
            normalizedIncoming = normalizedIncoming.map((n) => {
              if (!n.youtubeUrl) {
                const existing = cachedLinkLouvores2.find(
                  (c) => cleanDateString2(c.data || c.dataEscala) === cleanDateString2(n.data) && c.louvor.toLowerCase().trim() === n.louvor.toLowerCase().trim() && c.youtubeUrl
                );
                if (existing) {
                  return {
                    ...n,
                    youtubeUrl: existing.youtubeUrl,
                    linkYoutube: existing.youtubeUrl,
                    link_youtube: existing.youtubeUrl,
                    youtubeVideoId: existing.youtubeVideoId,
                    videoId: existing.youtubeVideoId,
                    thumbnailUrl: existing.thumbnailUrl
                  };
                }
              }
              return n;
            });
            const incomingDates = new Set(
              normalizedIncoming.map((n) => cleanDateString2(n.data)).filter(Boolean)
            );
            cachedLinkLouvores2 = [
              ...cachedLinkLouvores2.filter(
                (cl) => !incomingDates.has(cleanDateString2(cl.data || cl.dataEscala))
              ),
              ...normalizedIncoming
            ];
            saveCachedLinkLouvores2();
          }
          if (data) {
            data.linkLouvores = cachedLinkLouvores2;
            data.link_louvores = cachedLinkLouvores2;
          }
          if (data && Array.isArray(data.recados)) {
            data.recados = data.recados.map((r, index) => {
              const id = r.id || `recado-${index}`;
              const titulo = (r.titulo || r.title || "").toString().trim();
              const mensagem = (r.mensagem || r.message || "").toString().trim();
              const imagemRaw = r.imagem_url || r.imagemUrl || r.imagem || r.url_imagem || r.imageUrl || "";
              const imagemUrl = typeof imagemRaw === "string" ? imagemRaw.trim() : "";
              const ativo = (r.ativo || "SIM").toString().trim().toUpperCase();
              const dataCriacao = (r.data_criacao || r.dataCriacao || "").toString().trim();
              const dataAtualizacao = (r.data_atualizacao || r.dataAtualizacao || "").toString().trim();
              return {
                id,
                titulo,
                mensagem,
                imagemUrl,
                ativo,
                dataCriacao,
                dataAtualizacao
              };
            });
          } else if (data) {
            data.recados = [];
          }
          if (data && Array.isArray(data.escala)) {
            cachedEscalas2 = data.escala;
          }
          if (data && Array.isArray(data.integrantes)) {
            cachedIntegrantes2 = data.integrantes;
          }
          if (cachedEscalas2.length > 0) {
            detectarAlteracoesNaPlanilha2({
              escalaAtual: cachedEscalas2,
              solicitacoesAtuais: Array.isArray(data.solicitacoes) ? data.solicitacoes : [],
              recadosAtuais: Array.isArray(data.recados) ? data.recados : [],
              integrantes: cachedIntegrantes2,
              origem: "GOOGLE_SHEETS"
            });
          }
          processarLembretesDeCulto2(cachedEscalas2, cachedIntegrantes2);
          res.json(data);
        } catch (error) {
          console.error("Erro ao buscar dados da escala:", error);
          res.status(502).json({
            sucesso: false,
            mensagem: "N\xE3o foi poss\xEDvel conectar ao Google Apps Script para obter as escalas.",
            escala: [],
            integrantes: [],
            solicitacoes: [],
            recados: [],
            linkLouvores: []
          });
        }
      });
      app22.post("/api/webhook/sheets-change", async (req, res) => {
        try {
          const { aba, linha, data: dataLinha, origem = "GOOGLE_SHEETS" } = req.body || {};
          console.log(`[CHANGE-DETECTOR] Webhook recebido de altera\xE7\xE3o na planilha. Aba: ${aba || "TODAS"}, Linha: ${linha || "N/A"}, Origem: ${origem}`);
          await syncEscalaDataBackground2(origem);
          res.json({
            sucesso: true,
            mensagem: "Altera\xE7\xE3o da planilha processada com sucesso pelo detector de eventos.",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        } catch (err) {
          console.error("Erro no webhook de altera\xE7\xE3o da planilha:", err);
          res.status(500).json({
            sucesso: false,
            mensagem: err.message || "Erro ao processar webhook de altera\xE7\xE3o."
          });
        }
      });
      app22.get("/api/escala/snapshot", authenticateToken2, (req, res) => {
        const snapshot = getSheetsSnapshot2();
        res.json({
          sucesso: true,
          snapshot
        });
      });
      app22.post("/api/escala/detectar-alteracoes", authenticateToken2, async (req, res) => {
        try {
          await syncEscalaDataBackground2("GOOGLE_SHEETS");
          res.json({
            sucesso: true,
            mensagem: "Verifica\xE7\xE3o de altera\xE7\xF5es no Google Sheets conclu\xEDda com sucesso."
          });
        } catch (err) {
          res.status(500).json({
            sucesso: false,
            mensagem: err.message || "Erro ao verificar altera\xE7\xF5es."
          });
        }
      });
      const handleTestarDetector = (req, res) => {
        try {
          const resultado = executarBateriaDeTestesDetector2();
          res.json({
            sucesso: resultado.sucessoGeral,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            resultados: resultado.resultados
          });
        } catch (err) {
          console.error("Erro ao executar bateria de testes:", err);
          res.status(500).json({
            sucesso: false,
            mensagem: err.message || "Erro ao executar testes do detector."
          });
        }
      };
      app22.get("/api/admin/testar-detector-alteracoes", handleTestarDetector);
      app22.post("/api/admin/testar-detector-alteracoes", handleTestarDetector);
      app22.post("/api/escala/notificar-nova-escala", authenticateToken2, requireLider2, async (req, res) => {
        try {
          const { mes } = req.body;
          if (cachedIntegrantes2.length === 0) {
            await syncEscalaDataBackground2();
          }
          const result = processarNotificacaoNovaEscala2(mes, cachedIntegrantes2);
          if (!result.sucesso && result.jaEnviada) {
            res.status(409).json({
              sucesso: false,
              jaEnviada: true,
              mensagem: result.mensagem
            });
            return;
          }
          res.json({
            sucesso: true,
            mensagem: result.mensagem,
            totalEnviadas: result.totalEnviadas
          });
        } catch (error) {
          console.error("Erro ao notificar nova escala:", error);
          res.status(500).json({
            sucesso: false,
            mensagem: error.message || "Erro interno ao processar notifica\xE7\xE3o de nova escala."
          });
        }
      });
      const handleUpdateCampoEscala = async (req, res) => {
        try {
          const user = req.user;
          const { dataEscala, data, dataCulto, campo, valor, louvores, uniforme, linkLouvores } = req.body || {};
          const rawTargetData = (dataEscala || data || dataCulto || "").toString().trim();
          const targetData = cleanDateString2(rawTargetData);
          if (!targetData) {
            res.status(400).json({ sucesso: false, mensagem: "Data da escala \xE9 obrigat\xF3ria." });
            return;
          }
          let finalValor = (valor !== void 0 ? String(valor) : "").trim();
          let structuredLinks = [];
          if (campo === "louvores" || louvores !== void 0) {
            const rawLouv = campo === "louvores" ? finalValor : String(louvores).trim();
            finalValor = cleanLouvoresText2(rawLouv);
            if (Array.isArray(linkLouvores) && linkLouvores.length > 0) {
              structuredLinks = linkLouvores.map((it, idx) => {
                const ytVideoId = (it.youtubeVideoId || it.videoId || it.video_id || "").toString().trim();
                let ytUrl = (it.youtubeUrl || it.linkYoutube || it.link_youtube || it.url || "").toString().trim();
                if (!ytUrl && ytVideoId) {
                  ytUrl = `https://www.youtube.com/watch?v=${ytVideoId}`;
                }
                const extractedId = ytVideoId || extractYouTubeVideoId2(ytUrl) || "";
                if (!ytUrl && extractedId) {
                  ytUrl = `https://www.youtube.com/watch?v=${extractedId}`;
                }
                const title = cleanLouvoresText2(it.titulo || it.louvor || it.nome || "");
                return {
                  id: it.id || `link-${targetData.replace(/[^0-9]/g, "")}-${idx}`,
                  data: targetData,
                  dataEscala: targetData,
                  ordem: it.ordem !== void 0 ? it.ordem : idx + 1,
                  louvor: title,
                  titulo: title,
                  youtubeVideoId: extractedId,
                  videoId: extractedId,
                  youtubeUrl: ytUrl,
                  linkYoutube: ytUrl,
                  link_youtube: ytUrl,
                  url: ytUrl,
                  playlistId: (it.playlistId || "").toString().trim(),
                  playlistTitle: (it.playlistTitle || "").toString().trim(),
                  thumbnailUrl: it.thumbnailUrl || (extractedId ? `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg` : "")
                };
              });
            } else {
              structuredLinks = extractStructuredLouvores2(rawLouv, targetData);
            }
            console.log(`[YT SERVER DEBUG] Campo louvores atualizado para data ${targetData} | Total links: ${structuredLinks.length}`);
            if (Array.isArray(linkLouvores) || structuredLinks.length > 0) {
              cachedLinkLouvores2 = cachedLinkLouvores2.filter(
                (l) => cleanDateString2(l.data || l.dataEscala) !== targetData
              );
              if (structuredLinks.length > 0) {
                cachedLinkLouvores2.push(...structuredLinks);
              }
              saveCachedLinkLouvores2();
              fetch(GAS_API_URL2, {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  Accept: "application/json"
                },
                body: new URLSearchParams({
                  action: "salvarLinkLouvores",
                  dataEscala: targetData,
                  data: targetData,
                  louvores: JSON.stringify(structuredLinks),
                  louvores_detalhes: JSON.stringify(structuredLinks),
                  link_louvores: JSON.stringify(structuredLinks),
                  linkLouvores: JSON.stringify(structuredLinks),
                  louvoresTexto: finalValor
                }).toString()
              }).catch((err) => {
                console.error(`[YT SERVER DEBUG] Erro ao sincronizar LINK_LOUVORES com GAS:`, err);
              });
            }
          }
          const form = new URLSearchParams({
            action: "updateEscala",
            nome: user.nome.trim(),
            senha: user.rawPassword || "",
            dataEscala: targetData,
            data: targetData,
            dataCulto: targetData,
            campo: (campo || "").toString().trim(),
            valor: finalValor,
            louvores_detalhes: JSON.stringify(structuredLinks),
            link_louvores: JSON.stringify(structuredLinks),
            linkLouvores: JSON.stringify(structuredLinks)
          });
          if (louvores !== void 0 && campo !== "louvores") {
            form.append("louvores", cleanLouvoresText2(String(louvores)));
          }
          if (uniforme !== void 0 && campo !== "uniforme") {
            form.append("uniforme", String(uniforme).trim());
          }
          const gasResponse = await fetch(GAS_API_URL2, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json"
            },
            body: form.toString()
          });
          if (!gasResponse.ok) {
            throw new Error(`Erro na resposta do Google Apps Script: ${gasResponse.statusText}`);
          }
          const result = await gasResponse.json();
          if (campo === "louvores" || campo === "uniforme" || louvores !== void 0 || uniforme !== void 0) {
            if (cachedIntegrantes2.length === 0) {
              await syncEscalaDataBackground2();
            }
            const escalaObj = cachedEscalas2.find((e) => e.data.trim().replace(/[^0-9/]/g, "") === targetData.replace(/[^0-9/]/g, ""));
            if (escalaObj) {
              const targetLouvores = campo === "louvores" ? finalValor : louvores ? cleanLouvoresText2(String(louvores)) : escalaObj.louvores;
              const targetUniforme = campo === "uniforme" ? finalValor : uniforme || escalaObj.uniforme;
              processarNotificacaoLouvoresUniformes2({
                dataEscala: targetData,
                louvores: targetLouvores,
                uniforme: targetUniforme,
                escala: escalaObj,
                integrantes: cachedIntegrantes2
              });
            }
          }
          syncEscalaDataBackground2();
          res.json(result);
        } catch (error) {
          console.error("Erro ao atualizar campo da escala:", error);
          res.status(500).json({
            sucesso: false,
            mensagem: error.message || "Erro interno ao atualizar escala no Google Apps Script."
          });
        }
      };
      app22.put("/api/escala/campo", authenticateToken2, requireDirigenteOuLider2, handleUpdateCampoEscala);
      app22.post("/api/escala/campo", authenticateToken2, requireDirigenteOuLider2, handleUpdateCampoEscala);
      const handleUpdateEscalaCompleta = async (req, res) => {
        try {
          const user = req.user;
          const { dataEscala, data, dataCulto, dirigente, vocal, musicos, mesario, louvores, uniforme, linkLouvores } = req.body || {};
          const rawTargetData = (dataEscala || data || dataCulto || "").toString().trim();
          const targetData = cleanDateString2(rawTargetData);
          if (!targetData) {
            res.status(400).json({ sucesso: false, mensagem: "Data da escala \xE9 obrigat\xF3ria." });
            return;
          }
          const cleanLouvoresVal = louvores !== void 0 ? cleanLouvoresText2(String(louvores)) : void 0;
          const escalaExistente = cachedEscalas2.find(
            (e) => cleanDateString2(e.data) === targetData
          );
          const membrosAntigos = escalaExistente ? extrairMembrosDaEscala2(escalaExistente) : [];
          let structuredLinks = [];
          if (Array.isArray(linkLouvores) && linkLouvores.length > 0) {
            structuredLinks = linkLouvores.map((it, idx) => {
              const ytVideoId = (it.youtubeVideoId || it.videoId || it.video_id || "").toString().trim();
              let ytUrl = (it.youtubeUrl || it.linkYoutube || it.link_youtube || it.url || "").toString().trim();
              if (!ytUrl && ytVideoId) {
                ytUrl = `https://www.youtube.com/watch?v=${ytVideoId}`;
              }
              const extractedId = ytVideoId || extractYouTubeVideoId2(ytUrl) || "";
              if (!ytUrl && extractedId) {
                ytUrl = `https://www.youtube.com/watch?v=${extractedId}`;
              }
              const title = cleanLouvoresText2(it.titulo || it.louvor || it.nome || "");
              return {
                id: it.id || `link-${targetData.replace(/[^0-9]/g, "")}-${idx}`,
                data: targetData,
                dataEscala: targetData,
                ordem: it.ordem !== void 0 ? it.ordem : idx + 1,
                louvor: title,
                titulo: title,
                youtubeVideoId: extractedId,
                videoId: extractedId,
                youtubeUrl: ytUrl,
                linkYoutube: ytUrl,
                link_youtube: ytUrl,
                url: ytUrl,
                playlistId: (it.playlistId || "").toString().trim(),
                playlistTitle: (it.playlistTitle || "").toString().trim(),
                thumbnailUrl: it.thumbnailUrl || (extractedId ? `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg` : "")
              };
            });
          } else if (louvores !== void 0) {
            structuredLinks = extractStructuredLouvores2(String(louvores), targetData);
          }
          console.log(`[YT SERVER DEBUG] Escala completa recebida para data ${targetData} | Total links recebidos: ${structuredLinks.length}`);
          if (Array.isArray(linkLouvores) || structuredLinks.length > 0) {
            cachedLinkLouvores2 = cachedLinkLouvores2.filter(
              (l) => cleanDateString2(l.data || l.dataEscala) !== targetData
            );
            if (structuredLinks.length > 0) {
              cachedLinkLouvores2.push(...structuredLinks);
            }
            saveCachedLinkLouvores2();
            fetch(GAS_API_URL2, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json"
              },
              body: new URLSearchParams({
                action: "salvarLinkLouvores",
                dataEscala: targetData,
                data: targetData,
                louvores: JSON.stringify(structuredLinks),
                louvores_detalhes: JSON.stringify(structuredLinks),
                link_louvores: JSON.stringify(structuredLinks),
                linkLouvores: JSON.stringify(structuredLinks),
                louvoresTexto: cleanLouvoresVal || ""
              }).toString()
            }).catch((err) => {
              console.error(`[YT SERVER DEBUG] Erro ao sincronizar LINK_LOUVORES com GAS:`, err);
            });
          }
          let ultimoResultado = { sucesso: true, mensagem: "Escala atualizada com sucesso." };
          try {
            const fullForm = new URLSearchParams({
              action: "updateFullEscala",
              nome: user.nome.trim(),
              senha: user.rawPassword || "",
              dataEscala: targetData,
              data: targetData,
              dataCulto: targetData,
              dirigente: dirigente !== void 0 ? String(dirigente).trim() : "",
              vocal: vocal !== void 0 ? String(vocal).trim() : "",
              musicos: musicos !== void 0 ? String(musicos).trim() : "",
              mesario: mesario !== void 0 ? String(mesario).trim() : "",
              louvores: cleanLouvoresVal !== void 0 ? String(cleanLouvoresVal).trim() : "",
              uniforme: uniforme !== void 0 ? String(uniforme).trim() : "",
              louvores_detalhes: JSON.stringify(structuredLinks),
              link_louvores: JSON.stringify(structuredLinks),
              linkLouvores: JSON.stringify(structuredLinks)
            });
            const gasFullResponse = await fetch(GAS_API_URL2, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json"
              },
              body: fullForm.toString()
            });
            if (gasFullResponse.ok) {
              const jsonFull = await gasFullResponse.json();
              if (jsonFull && jsonFull.sucesso !== false) {
                ultimoResultado = jsonFull;
              }
            }
          } catch (gasFullErr) {
            console.warn("[YT SERVER DEBUG] Tentando fallback de atualiza\xE7\xE3o campo a campo:", gasFullErr);
            const camposPossiveis = [
              { campo: "louvores", valor: cleanLouvoresVal },
              { campo: "uniforme", valor: uniforme },
              { campo: "dirigente", valor: dirigente },
              { campo: "vocal", valor: vocal },
              { campo: "musicos", valor: musicos },
              { campo: "mesario", valor: mesario }
            ];
            for (const item of camposPossiveis) {
              if (item.valor !== void 0) {
                const form = new URLSearchParams({
                  action: "updateEscala",
                  nome: user.nome.trim(),
                  senha: user.rawPassword || "",
                  dataEscala: targetData,
                  data: targetData,
                  dataCulto: targetData,
                  campo: item.campo,
                  valor: String(item.valor).trim()
                });
                await fetch(GAS_API_URL2, {
                  method: "POST",
                  headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
                  body: form.toString()
                }).catch(() => {
                });
              }
            }
          }
          const escalaObj = {
            data: targetData,
            dirigente: dirigente !== void 0 ? String(dirigente).trim() : escalaExistente?.dirigente || "",
            vocal: vocal !== void 0 ? String(vocal).trim() : escalaExistente?.vocal || "",
            musicos: musicos !== void 0 ? String(musicos).trim() : escalaExistente?.musicos || "",
            mesario: mesario !== void 0 ? String(mesario).trim() : escalaExistente?.mesario || "",
            louvores: cleanLouvoresVal !== void 0 ? String(cleanLouvoresVal).trim() : escalaExistente?.louvores || "",
            uniforme: uniforme !== void 0 ? String(uniforme).trim() : escalaExistente?.uniforme || ""
          };
          if (escalaExistente) {
            if (dirigente !== void 0) escalaExistente.dirigente = escalaObj.dirigente;
            if (vocal !== void 0) escalaExistente.vocal = escalaObj.vocal;
            if (musicos !== void 0) escalaExistente.musicos = escalaObj.musicos;
            if (mesario !== void 0) escalaExistente.mesario = escalaObj.mesario;
            if (cleanLouvoresVal !== void 0) escalaExistente.louvores = escalaObj.louvores;
            if (uniforme !== void 0) escalaExistente.uniforme = escalaObj.uniforme;
          } else {
            cachedEscalas2.push({
              ...escalaObj
            });
          }
          if (cachedIntegrantes2.length === 0) {
            await syncEscalaDataBackground2();
          }
          const membrosNovos = extrairMembrosDaEscala2(escalaObj);
          const cleanDataKey = targetData.replace(/[^0-9/]/g, "").replace(/\//g, "_");
          for (const mNovo of membrosNovos) {
            const jaEstava = membrosAntigos.some(
              (mA) => normalizarNome2(mA.nome) === normalizarNome2(mNovo.nome)
            );
            if (!jaEstava) {
              const normNome = normalizarNome2(mNovo.nome).replace(/\s+/g, "_");
              const eventoId = `ESCALA_ADICIONADO_${cleanDataKey}_${normNome}`;
              const detalheFuncao = mNovo.instrumento ? `${mNovo.funcao} (${mNovo.instrumento})` : mNovo.funcao;
              criarNotificacaoSeNaoExiste2({
                destinatario: mNovo.nome,
                tipo: "ESCALA",
                titulo: "Nova Escala para Voc\xEA",
                mensagem: `A Paz ${mNovo.nome}! Voc\xEA foi escalado(a) para o culto do dia ${targetData} como ${detalheFuncao}!`,
                eventoId,
                origem: "APP"
              });
            } else {
              const correspondenteAntigo = membrosAntigos.find(
                (mA) => normalizarNome2(mA.nome) === normalizarNome2(mNovo.nome)
              );
              if (correspondenteAntigo) {
                const mudouFuncao = correspondenteAntigo.funcao !== mNovo.funcao;
                const mudouInst = (correspondenteAntigo.instrumento || "") !== (mNovo.instrumento || "");
                if (mudouFuncao || mudouInst) {
                  const detalheNovo = mNovo.instrumento ? `${mNovo.funcao} (${mNovo.instrumento})` : mNovo.funcao;
                  const roleHash = import_crypto22.default.createHash("md5").update(detalheNovo).digest("hex").substring(0, 6);
                  const normNome = normalizarNome2(mNovo.nome).replace(/\s+/g, "_");
                  const eventoId = `ESCALA_ALTERADA_${cleanDataKey}_${normNome}_${roleHash}`;
                  criarNotificacaoSeNaoExiste2({
                    destinatario: mNovo.nome,
                    tipo: "ESCALA",
                    titulo: "Fun\xE7\xE3o Alterada na Escala",
                    mensagem: `A Paz ${mNovo.nome}! Sua fun\xE7\xE3o na escala do dia ${targetData} foi alterada para ${detalheNovo}.`,
                    eventoId,
                    origem: "APP"
                  });
                }
              }
            }
          }
          if (louvores !== void 0 || uniforme !== void 0 || Array.isArray(linkLouvores) && linkLouvores.length > 0) {
            processarNotificacaoLouvoresUniformes2({
              dataEscala: targetData,
              louvores: escalaObj.louvores,
              uniforme: escalaObj.uniforme,
              escala: escalaObj,
              integrantes: cachedIntegrantes2
            });
          }
          syncEscalaDataBackground2();
          res.json({
            ...ultimoResultado,
            sucesso: true,
            mensagem: ultimoResultado?.mensagem || "Escala atualizada com sucesso.",
            linkLouvores: structuredLinks,
            escala: escalaObj
          });
        } catch (error) {
          console.error("Erro ao atualizar escala:", error);
          res.status(500).json({
            sucesso: false,
            mensagem: error.message || "Erro interno ao atualizar escala no Google Apps Script."
          });
        }
      };
      app22.put("/api/escala/completa", authenticateToken2, requireDirigenteOuLider2, handleUpdateEscalaCompleta);
      app22.post("/api/escala/completa", authenticateToken2, requireDirigenteOuLider2, handleUpdateEscalaCompleta);
      app22.post("/api/solicitacoes", authenticateToken2, async (req, res) => {
        try {
          const user = req.user;
          const { dataEscala, data, dataCulto, motivo, substituto, funcao, instrumento } = req.body || {};
          const targetData = (dataEscala || data || dataCulto || "").toString().trim();
          const targetMotivo = (motivo || "").toString().trim();
          const targetSubstituto = (substituto || "").toString().trim();
          if (!targetData) {
            res.status(400).json({
              sucesso: false,
              mensagem: "Data da escala \xE9 obrigat\xF3ria."
            });
            return;
          }
          if (!targetSubstituto) {
            res.status(400).json({
              sucesso: false,
              mensagem: "Substituto \xE9 obrigat\xF3rio."
            });
            return;
          }
          if (!targetMotivo) {
            res.status(400).json({
              sucesso: false,
              mensagem: "Motivo da solicita\xE7\xE3o \xE9 obrigat\xF3rio."
            });
            return;
          }
          const form = new URLSearchParams({
            action: "createSolicitacao",
            nome: user.nome.trim(),
            dataEscala: targetData,
            data: targetData,
            dataCulto: targetData,
            substituto: targetSubstituto,
            motivo: targetMotivo,
            funcao: (funcao || user.funcao || "").toString().trim(),
            instrumento: (instrumento || user.instrumento || "").toString().trim(),
            senha: user.rawPassword || ""
          });
          const gasResponse = await fetch(GAS_API_URL2, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json"
            },
            body: form.toString()
          });
          if (!gasResponse.ok) {
            throw new Error(`Erro na resposta do Google Apps Script: ${gasResponse.statusText}`);
          }
          const result = await gasResponse.json();
          try {
            if (cachedIntegrantes2.length === 0) {
              syncEscalaDataBackground2();
            }
            processarNotificacaoNovaSolicitacao2({
              solicitacaoId: `${targetData}_${user.nome.trim()}_${targetSubstituto}`,
              quemPediu: user.nome.trim(),
              dataEscala: targetData,
              integrantes: cachedIntegrantes2
            });
          } catch (notifErr) {
            console.error("Erro ao disparar notifica\xE7\xE3o de solicita\xE7\xE3o:", notifErr);
          }
          res.json(result);
        } catch (error) {
          console.error("Erro ao criar solicita\xE7\xE3o:", error);
          res.status(500).json({
            sucesso: false,
            mensagem: error.message || "Erro interno ao enviar solicita\xE7\xE3o ao Google Apps Script."
          });
        }
      });
      const handleProcessarSolicitacao = async (req, res) => {
        try {
          const user = req.user;
          const {
            dataEscala,
            data,
            dataCulto,
            quemPediu,
            solicitante,
            substituto,
            acao,
            novoStatus,
            motivoDecisao,
            funcao,
            instrumento
          } = req.body || {};
          const targetData = (dataEscala || data || dataCulto || "").toString().trim();
          const targetQuemPediu = (quemPediu || solicitante || "").toString().trim();
          const targetSubstituto = (substituto || "").toString().trim();
          if (!targetData || !targetQuemPediu) {
            res.status(400).json({
              sucesso: false,
              mensagem: "Data da escala e solicitante (quemPediu) s\xE3o obrigat\xF3rios."
            });
            return;
          }
          let acaoFinal = "APROVAR";
          if (acao) {
            acaoFinal = acao.toString().toUpperCase();
          } else if (novoStatus) {
            const norm = novoStatus.toString().toUpperCase();
            if (norm === "APROVADA" || norm === "APROVAR" || norm === "AUTORIZADA") acaoFinal = "APROVAR";
            else if (norm === "RECUSADA" || norm === "RECUSAR" || norm === "REPROVADA") acaoFinal = "RECUSAR";
            else if (norm === "CANCELADA" || norm === "CANCELAR") acaoFinal = "CANCELAR";
          }
          if (acaoFinal === "APROVAR" || acaoFinal === "RECUSAR") {
            if (user.role !== "LIDER" && user.role !== "DIRIGENTE") {
              res.status(403).json({
                sucesso: false,
                mensagem: "Apenas l\xEDderes t\xEAm permiss\xE3o para aprovar ou recusar solicita\xE7\xF5es."
              });
              return;
            }
          } else if (acaoFinal === "CANCELAR") {
            if (user.role !== "LIDER" && user.nome.trim().toLowerCase() !== targetQuemPediu.toLowerCase()) {
              res.status(403).json({
                sucesso: false,
                mensagem: "Voc\xEA s\xF3 pode cancelar suas pr\xF3prias solicita\xE7\xF5es."
              });
              return;
            }
          }
          const form = new URLSearchParams({
            action: "processaSolicitacao",
            acao: acaoFinal,
            nome: user.nome.trim(),
            senha: user.rawPassword || "",
            dataEscala: targetData,
            data: targetData,
            dataCulto: targetData,
            quemPediu: targetQuemPediu,
            substituto: targetSubstituto,
            motivoDecisao: motivoDecisao ? String(motivoDecisao).trim() : "",
            funcao: funcao ? String(funcao).trim() : "",
            instrumento: instrumento ? String(instrumento).trim() : ""
          });
          const gasResponse = await fetch(GAS_API_URL2, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json"
            },
            body: form.toString()
          });
          if (!gasResponse.ok) {
            throw new Error(`Erro na resposta do Google Apps Script: ${gasResponse.statusText}`);
          }
          const result = await gasResponse.json();
          try {
            if (acaoFinal === "APROVAR" || acaoFinal === "RECUSAR") {
              processarNotificacaoDecisaoSolicitacao2({
                solicitacaoId: `${targetData}_${targetQuemPediu}_${targetSubstituto}`,
                quemPediu: targetQuemPediu,
                substituto: targetSubstituto,
                dataEscala: targetData,
                acao: acaoFinal
              });
            }
          } catch (notifErr) {
            console.error("Erro ao disparar notifica\xE7\xE3o de decis\xE3o da solicita\xE7\xE3o:", notifErr);
          }
          res.json(result);
        } catch (error) {
          console.error("Erro ao processar solicita\xE7\xE3o:", error);
          res.status(500).json({
            sucesso: false,
            mensagem: error.message || "Erro interno ao processar solicita\xE7\xE3o no Google Apps Script."
          });
        }
      };
      app22.post("/api/solicitacoes/processar", authenticateToken2, handleProcessarSolicitacao);
      app22.post("/api/solicitacoes/responder", authenticateToken2, handleProcessarSolicitacao);
      const extractDriveFileId = (input) => {
        if (!input) return null;
        const str = input.trim();
        if (/^[a-zA-Z0-9_-]{25,}$/.test(str)) {
          return str;
        }
        const matchId = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (matchId) return matchId[1];
        const matchD = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (matchD) return matchD[1];
        const matchFileD = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (matchFileD) return matchFileD[1];
        return null;
      };
      const handleProxyImagemRecado = async (req, res) => {
        try {
          const urlQuery = req.query.url || req.query.src || req.query.id || req.body?.url;
          const isDownload = req.query.download === "true" || req.path.includes("/download");
          const rawFilename = req.query.filename || "imagem_recado";
          const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9_.-]/g, "_");
          if (!urlQuery) {
            res.status(400).json({ sucesso: false, mensagem: "Par\xE2metro 'url' ou 'id' \xE9 obrigat\xF3rio." });
            return;
          }
          if (urlQuery.startsWith("data:image/")) {
            const matches = urlQuery.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const contentType2 = matches[1];
              const buffer2 = Buffer.from(matches[2], "base64");
              const ext2 = contentType2.split("/")[1]?.split("+")[0] || "jpg";
              const safeFilename2 = cleanFilename.endsWith(`.${ext2}`) ? cleanFilename : `${cleanFilename}.${ext2}`;
              res.setHeader("Content-Type", contentType2);
              res.setHeader("Content-Length", buffer2.length);
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.setHeader("Cache-Control", "public, max-age=86400");
              if (isDownload) {
                res.setHeader("Content-Disposition", `attachment; filename="${safeFilename2}"`);
              }
              res.send(buffer2);
              return;
            }
          }
          const driveId = extractDriveFileId(urlQuery);
          let targetUrl = urlQuery;
          if (driveId) {
            targetUrl = `https://lh3.googleusercontent.com/d/${driveId}`;
          }
          let fetchResponse = await fetch(targetUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
            }
          });
          if (!fetchResponse.ok && driveId) {
            const fallbackUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=view`;
            fetchResponse = await fetch(fallbackUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              }
            });
          }
          if (!fetchResponse.ok) {
            res.status(fetchResponse.status).json({
              sucesso: false,
              mensagem: `N\xE3o foi poss\xEDvel carregar a imagem do recado: ${fetchResponse.statusText}`
            });
            return;
          }
          let contentType = fetchResponse.headers.get("content-type") || "image/jpeg";
          if (!contentType.startsWith("image/")) {
            contentType = "image/jpeg";
          }
          const arrayBuffer = await fetchResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          let ext = "jpg";
          if (contentType.includes("png")) ext = "png";
          else if (contentType.includes("webp")) ext = "webp";
          else if (contentType.includes("gif")) ext = "gif";
          else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
          const safeFilename = cleanFilename.endsWith(`.${ext}`) ? cleanFilename : `${cleanFilename}.${ext}`;
          res.setHeader("Content-Type", contentType);
          res.setHeader("Content-Length", buffer.length);
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
          if (isDownload) {
            res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
          }
          res.send(buffer);
        } catch (error) {
          console.error("Erro no proxy de imagem de recado:", error);
          res.status(500).json({
            sucesso: false,
            mensagem: error.message || "Erro ao processar imagem."
          });
        }
      };
      app22.get("/api/recados/imagem", handleProxyImagemRecado);
      app22.get("/api/recados/download", handleProxyImagemRecado);
      app22.post("/api/recados", authenticateToken2, requireLider2, async (req, res) => {
        try {
          const user = req.user;
          const { titulo, mensagem, imagemBase64, imagemUrl } = req.body;
          if (!titulo || !mensagem) {
            res.status(400).json({
              sucesso: false,
              mensagem: "T\xEDtulo e mensagem do recado s\xE3o obrigat\xF3rios."
            });
            return;
          }
          const form = new URLSearchParams({
            action: "createRecado",
            nome: user.nome.trim(),
            senha: user.rawPassword || "",
            titulo: String(titulo).trim(),
            mensagem: String(mensagem).trim(),
            imagemBase64: imagemBase64 ? String(imagemBase64) : "",
            imagemUrl: imagemUrl ? String(imagemUrl) : ""
          });
          const gasResponse = await fetch(GAS_API_URL2, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json"
            },
            body: form.toString()
          });
          if (!gasResponse.ok) {
            throw new Error(`Erro na resposta do Google Apps Script: ${gasResponse.statusText}`);
          }
          const result = await gasResponse.json();
          try {
            if (cachedIntegrantes2.length === 0) {
              syncEscalaDataBackground2();
            }
            const recadoId = result?.id || result?.recado?.id || `rec_${Date.now()}`;
            processarNotificacaoNovoRecado2(recadoId, cachedIntegrantes2);
          } catch (notifErr) {
            console.error("Erro ao disparar notifica\xE7\xE3o de novo recado:", notifErr);
          }
          res.json(result);
        } catch (error) {
          console.error("Erro ao publicar recado:", error);
          res.status(500).json({
            sucesso: false,
            mensagem: error.message || "Erro interno ao salvar recado no Google Apps Script."
          });
        }
      });
      const handleEditarRecado = async (req, res) => {
        try {
          const user = req.user;
          const { id, titulo, mensagem, imagemBase64, imagemUrl, ativo } = req.body;
          const recadoId = req.params.id || id;
          if (!recadoId || !titulo || !mensagem) {
            res.status(400).json({
              sucesso: false,
              mensagem: "ID, t\xEDtulo e mensagem do recado s\xE3o obrigat\xF3rios."
            });
            return;
          }
          const form = new URLSearchParams({
            action: "updateRecado",
            nome: user.nome.trim(),
            senha: user.rawPassword || "",
            id: String(recadoId).trim(),
            titulo: String(titulo).trim(),
            mensagem: String(mensagem).trim(),
            imagemBase64: imagemBase64 ? String(imagemBase64) : "",
            imagemUrl: imagemUrl ? String(imagemUrl) : "",
            ativo: ativo ? String(ativo).trim().toUpperCase() : "SIM"
          });
          const gasResponse = await fetch(GAS_API_URL2, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json"
            },
            body: form.toString()
          });
          if (!gasResponse.ok) {
            throw new Error(`Erro na resposta do Google Apps Script: ${gasResponse.statusText}`);
          }
          const result = await gasResponse.json();
          res.json(result);
        } catch (error) {
          console.error("Erro ao editar recado:", error);
          res.status(500).json({
            sucesso: false,
            mensagem: error.message || "Erro interno ao atualizar recado no Google Apps Script."
          });
        }
      };
      app22.put("/api/recados/:id", authenticateToken2, requireLider2, handleEditarRecado);
      app22.post("/api/recados/editar", authenticateToken2, requireLider2, handleEditarRecado);
      const handleExcluirRecado = async (req, res) => {
        try {
          const user = req.user;
          const recadoId = req.params.id || req.body.id;
          if (!recadoId) {
            res.status(400).json({
              sucesso: false,
              mensagem: "ID do recado \xE9 obrigat\xF3rio."
            });
            return;
          }
          const form = new URLSearchParams({
            action: "deleteRecado",
            nome: user.nome.trim(),
            senha: user.rawPassword || "",
            id: String(recadoId).trim()
          });
          const gasResponse = await fetch(GAS_API_URL2, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json"
            },
            body: form.toString()
          });
          if (!gasResponse.ok) {
            throw new Error(`Erro na resposta do Google Apps Script: ${gasResponse.statusText}`);
          }
          const result = await gasResponse.json();
          res.json(result);
        } catch (error) {
          console.error("Erro ao excluir recado:", error);
          res.status(500).json({
            sucesso: false,
            mensagem: error.message || "Erro interno ao excluir recado no Google Apps Script."
          });
        }
      };
      app22.delete("/api/recados/:id", authenticateToken2, requireLider2, handleExcluirRecado);
      app22.post("/api/recados/excluir", authenticateToken2, requireLider2, handleExcluirRecado);
      app22.get("/api/notificacoes", authenticateToken2, async (req, res) => {
        try {
          const user = req.user;
          try {
            let url = `${GAS_API_URL2}?action=getNotificacoes&nome=${encodeURIComponent(user.nome.trim())}`;
            if (user.rawPassword) {
              url += `&senha=${encodeURIComponent(user.rawPassword)}`;
            }
            const gasResponse = await fetch(url, {
              method: "GET",
              headers: { Accept: "application/json" }
            });
            if (gasResponse.ok) {
              const data = await gasResponse.json();
              const rawList = Array.isArray(data.notificacoes) ? data.notificacoes : Array.isArray(data) ? data : [];
              if (rawList.length > 0) {
                mergeGasNotifications2(rawList);
              }
            }
          } catch (gasErr) {
          }
          const userNotificacoes = getNotificacoesParaUsuario2(user.nome);
          res.json({
            sucesso: true,
            notificacoes: userNotificacoes,
            mensagem: `${userNotificacoes.length} notifica\xE7\xE3o(\xF5es) encontrada(s).`
          });
        } catch (error) {
          console.error("Erro ao buscar notifica\xE7\xF5es:", error);
          const fallbackList = getNotificacoesParaUsuario2(req.user?.nome || "");
          res.json({
            sucesso: true,
            notificacoes: fallbackList,
            mensagem: `${fallbackList.length} notifica\xE7\xE3o(\xF5es) encontrada(s).`
          });
        }
      });
      const handleMarcarNotifLida = async (req, res) => {
        try {
          const user = req.user;
          const notifId = req.params.id;
          if (!notifId || typeof notifId !== "string" || !notifId.trim()) {
            res.status(400).json({
              sucesso: false,
              mensagem: "ID da notifica\xE7\xE3o \xE9 obrigat\xF3rio."
            });
            return;
          }
          marcarComoLidaLocal2(notifId.trim());
          try {
            const form = new URLSearchParams({
              action: "marcarNotificacaoLida",
              id: notifId.trim(),
              nome: user.nome.trim(),
              senha: user.rawPassword || ""
            });
            await fetch(GAS_API_URL2, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json"
              },
              body: form.toString()
            });
          } catch (gasErr) {
          }
          res.json({
            sucesso: true,
            mensagem: "Notifica\xE7\xE3o marcada como lida."
          });
        } catch (error) {
          console.error("Erro ao marcar notifica\xE7\xE3o como lida:", error);
          res.status(500).json({
            sucesso: false,
            mensagem: error.message || "Erro interno ao marcar notifica\xE7\xE3o."
          });
        }
      };
      app22.put("/api/notificacoes/:id/lida", authenticateToken2, handleMarcarNotifLida);
      app22.post("/api/notificacoes/:id/lida", authenticateToken2, handleMarcarNotifLida);
      app22.post("/api/notificacoes/marcar-todas-lidas", authenticateToken2, async (req, res) => {
        try {
          const user = req.user;
          marcarTodasComoLidasLocal2(user.nome);
          try {
            const form = new URLSearchParams({
              action: "marcarTodasNotificacoesLidas",
              nome: user.nome.trim(),
              senha: user.rawPassword || ""
            });
            await fetch(GAS_API_URL2, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json"
              },
              body: form.toString()
            });
          } catch (gasErr) {
          }
          res.json({
            sucesso: true,
            mensagem: "Todas as notifica\xE7\xF5es foram marcadas como lidas."
          });
        } catch (error) {
          console.error("Erro ao marcar todas as notifica\xE7\xF5es como lidas:", error);
          res.status(500).json({
            sucesso: false,
            mensagem: error.message || "Erro interno ao marcar notifica\xE7\xF5es."
          });
        }
      });
      function getRenderedServiceWorker() {
        const swPath = import_path22.default.join(process.cwd(), "public", "sw.js");
        let swContent = "";
        try {
          swContent = import_fs22.default.readFileSync(swPath, "utf-8");
        } catch {
          const altPath = import_path22.default.join(process.cwd(), "dist", "sw.js");
          if (import_fs22.default.existsSync(altPath)) {
            swContent = import_fs22.default.readFileSync(altPath, "utf-8");
          }
        }
        const apiKey = process.env.VITE_FIREBASE_API_KEY || "AIzaSyBy56kEmfcHWNQ7t15bF2RtLb5CkdHwLK4";
        const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN || "escala-louvor-2.firebaseapp.com";
        const projectId = process.env.VITE_FIREBASE_PROJECT_ID || "escala-louvor-2";
        const messagingSenderId = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "979295298532";
        const appId = process.env.VITE_FIREBASE_APP_ID || "1:979295298532:web:8093b4212b9fff6d0b9df1";
        return swContent.replace(/__FIREBASE_API_KEY__/g, apiKey).replace(/__FIREBASE_AUTH_DOMAIN__/g, authDomain).replace(/__FIREBASE_PROJECT_ID__/g, projectId).replace(/__FIREBASE_MESSAGING_SENDER_ID__/g, messagingSenderId).replace(/__FIREBASE_APP_ID__/g, appId).replace(/PLACEHOLDER_KEY/g, apiKey);
      }
      app22.get("/sw.js", (req, res) => {
        res.setHeader("Service-Worker-Allowed", "/");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.send(getRenderedServiceWorker());
      });
      app22.get("/api/sw.js", (req, res) => {
        res.setHeader("Service-Worker-Allowed", "/");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.send(getRenderedServiceWorker());
      });
      return app22;
    }
    var app2 = createApiApp2();
    app2.get(["/manifest.json", "/manifest.webmanifest"], (req, res, next) => {
      res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
      next();
    });
    app2.get("/sw.js", (req, res, next) => {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Service-Worker-Allowed", "/");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      next();
    });
    async function setupServer() {
      const PORT = 3e3;
      const httpServer = (0, import_node_http.createServer)(app2);
      if (process.env.NODE_ENV === "development") {
        const vite = await (0, import_vite.createServer)({
          server: {
            middlewareMode: true,
            allowedHosts: [".v0.build"],
            hmr: process.env.DISABLE_HMR === "true" ? false : { server: httpServer }
          },
          appType: "spa"
        });
        app2.use(async (req, res, next) => {
          const isV0Preview = req.hostname.endsWith(".v0.build");
          const isSpaNavigation = req.method === "GET" && req.accepts("html") && !req.path.startsWith("/api/") && req.path !== "/api" && !import_path3.default.extname(req.path);
          if (!isV0Preview || !isSpaNavigation) {
            next();
            return;
          }
          try {
            const html = await vite.transformIndexHtml(
              req.originalUrl,
              await (0, import_promises.readFile)(import_path3.default.join(process.cwd(), "index.html"), "utf-8")
            );
            res.status(200).set("Cache-Control", "no-store").type("html").send(html.replace('<script type="module" src="/@vite/client"></script>', ""));
          } catch (error) {
            next(error);
          }
        });
        app2.use(vite.middlewares);
      } else {
        const distPath = import_path3.default.join(process.cwd(), "dist");
        app2.use(import_express2.default.static(distPath));
        app2.get("*", (req, res) => {
          res.sendFile(import_path3.default.join(distPath, "index.html"));
        });
      }
      if (!process.env.VERCEL) {
        httpServer.listen(PORT, "0.0.0.0", () => {
          console.log(`[ESCALA DE LOUVOR] Servidor backend ativo em http://0.0.0.0:${PORT}`);
        });
      }
    }
    if (!process.env.VERCEL) {
      setupServer().catch((err) => {
        console.error("Erro fatal ao iniciar o servidor:", err);
        process.exit(1);
      });
    }
    var server_default = app2;
  }
});

// api/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);

// src/server/app.ts
var import_express = __toESM(require("express"), 1);
var import_crypto2 = __toESM(require("crypto"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);

// src/server/db.ts
var import_firestore = require("firebase-admin/firestore");

// src/server/firebaseAdmin.ts
var import_app = require("firebase-admin/app");
var adminApp = null;
function getFirebaseAdminApp() {
  if (adminApp) {
    return adminApp;
  }
  const existingApps = (0, import_app.getApps)();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountString) {
    console.warn("[Firebase Admin] Vari\xE1vel FIREBASE_SERVICE_ACCOUNT_JSON n\xE3o configurada.");
    return null;
  }
  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    adminApp = (0, import_app.initializeApp)({
      credential: (0, import_app.cert)(serviceAccount),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "escala-louvor-2"
    });
    console.log("[Firebase Admin] Inicializado com sucesso para o projeto", process.env.VITE_FIREBASE_PROJECT_ID || "escala-louvor-2");
    return adminApp;
  } catch (error) {
    console.error("[Firebase Admin] Falha ao processar credenciais:", error);
    return null;
  }
}

// src/server/db.ts
var firestoreInstance = null;
function getDb() {
  if (firestoreInstance) {
    return firestoreInstance;
  }
  const adminApp2 = getFirebaseAdminApp();
  if (adminApp2) {
    firestoreInstance = (0, import_firestore.getFirestore)(adminApp2);
  }
  return firestoreInstance;
}
var db = new Proxy({}, {
  get(target, prop, receiver) {
    const inst = getDb();
    if (!inst) {
      throw new Error("Firestore Admin SDK n\xE3o inicializado (credencial ausente ou inv\xE1lida).");
    }
    const val = inst[prop];
    return typeof val === "function" ? val.bind(inst) : val;
  }
});

// src/server/fcmService.ts
var import_messaging = require("firebase-admin/messaging");
async function getFcmTokensForUser(userId) {
  const db2 = getDb();
  if (!db2) {
    console.warn(`[FCM] DB n\xE3o dispon\xEDvel para consultar tokens do usu\xE1rio ${userId}.`);
    return [];
  }
  try {
    const snapshot = await db2.collection("fcm_tokens").where("userId", "==", userId).where("active", "==", true).get();
    return snapshot.docs.map((doc) => doc.data().token).filter(Boolean);
  } catch (error) {
    console.warn(`[FCM] Erro ao recuperar tokens para usu\xE1rio ${userId}:`, error);
    return [];
  }
}
async function subscribeUserToFcm(userId, token) {
  const db2 = getDb();
  if (!db2) {
    console.warn("[FCM] Firestore indispon\xEDvel para registro de token.");
    return false;
  }
  try {
    await db2.collection("fcm_tokens").doc(token).set({
      userId,
      token,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      active: true
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("[FCM] Erro ao persistir token no Firestore:", error);
    return false;
  }
}
async function unsubscribeUserFromFcm(userId, token) {
  const db2 = getDb();
  if (!db2) return false;
  try {
    const docRef = db2.collection("fcm_tokens").doc(token);
    const doc = await docRef.get();
    if (doc.exists) {
      await docRef.update({ active: false, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
      return true;
    }
    return false;
  } catch (error) {
    console.warn("[FCM] Erro ao desativar token:", error);
    return false;
  }
}
async function sendFcmPushToUser(userId, options) {
  const adminApp2 = getFirebaseAdminApp();
  if (!adminApp2) {
    return { sent: 0, failed: 0 };
  }
  const tokens = await getFcmTokensForUser(userId);
  if (!tokens || tokens.length === 0) {
    return { sent: 0, failed: 0 };
  }
  const messaging = (0, import_messaging.getMessaging)(adminApp2);
  const notificationId = options.id || options.eventoId || `notif_${Date.now()}`;
  const targetUrl = options.url || "/notificacoes";
  let sent = 0;
  let failed = 0;
  for (const token of tokens) {
    try {
      await messaging.send({
        token,
        notification: {
          title: options.title,
          body: options.body
        },
        data: {
          id: notificationId,
          eventoId: options.eventoId || "",
          type: options.type || "NOTIFICATION",
          url: targetUrl
        },
        webpush: {
          fcmOptions: {
            link: targetUrl
          },
          notification: {
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: notificationId,
            requireInteraction: false
          }
        }
      });
      sent++;
    } catch (error) {
      console.error(`[FCM] Erro ao enviar para token ${token.substring(0, 6)}...:`, error?.message);
      if (error.code === "messaging/registration-token-not-registered" || error.code === "messaging/invalid-registration-token") {
        await unsubscribeUserFromFcm(userId, token);
      }
      failed++;
    }
  }
  return { sent, failed };
}

// src/server/app.ts
var import_messaging2 = require("firebase-admin/messaging");

// src/server/notifications.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var DB_FILE = import_path.default.join(DATA_DIR, "notificacoes_db.json");
var HASHES_FILE = import_path.default.join(DATA_DIR, "louvores_hashes.json");
var SNAPSHOT_FILE = import_path.default.join(DATA_DIR, "sheets_snapshot.json");
var READ_KEYS_FILE = import_path.default.join(DATA_DIR, "notificacoes_lidas.json");
var localNotificacoes = [];
var louvoresHashes = {};
var markedReadKeys = /* @__PURE__ */ new Set();
var currentSnapshot = {
  initialized: false,
  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
  escalas: {},
  solicitacoes: {},
  recados: {}
};
function ensureDataDir() {
  if (process.env.VERCEL) return;
  try {
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("Erro ao criar diret\xF3rio data:", err);
  }
}
function loadNotifications() {
  if (!process.env.VERCEL) {
    ensureDataDir();
  }
  try {
    if (import_fs.default.existsSync(DB_FILE)) {
      const raw = import_fs.default.readFileSync(DB_FILE, "utf-8");
      localNotificacoes = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Aviso ao ler notificacoes_db.json:", err);
    localNotificacoes = [];
  }
  try {
    if (import_fs.default.existsSync(READ_KEYS_FILE)) {
      const raw = import_fs.default.readFileSync(READ_KEYS_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        markedReadKeys = new Set(list.map((k) => String(k).trim()).filter(Boolean));
      }
    }
  } catch (err) {
    markedReadKeys = /* @__PURE__ */ new Set();
  }
  for (const n of localNotificacoes) {
    if (n.lida === "SIM") {
      if (n.id) markedReadKeys.add(n.id.trim());
      if (n.eventoId) markedReadKeys.add(`evt:${n.eventoId.trim()}`);
      const normDest = normalizarNome(n.destinatario);
      if (normDest && n.eventoId) markedReadKeys.add(`user_evt:${normDest}_${n.eventoId.trim()}`);
    }
  }
  try {
    if (import_fs.default.existsSync(HASHES_FILE)) {
      const raw = import_fs.default.readFileSync(HASHES_FILE, "utf-8");
      louvoresHashes = JSON.parse(raw);
    }
  } catch (err) {
    louvoresHashes = {};
  }
  try {
    if (import_fs.default.existsSync(SNAPSHOT_FILE)) {
      const raw = import_fs.default.readFileSync(SNAPSHOT_FILE, "utf-8");
      currentSnapshot = JSON.parse(raw);
    }
  } catch (err) {
    currentSnapshot = {
      initialized: false,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      escalas: {},
      solicitacoes: {},
      recados: {}
    };
  }
  return localNotificacoes;
}
function saveMarkedReadKeys() {
  if (process.env.VERCEL) return;
  ensureDataDir();
  try {
    const list = Array.from(markedReadKeys);
    import_fs.default.writeFileSync(READ_KEYS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar notificacoes_lidas.json:", err);
  }
}
function saveNotifications() {
  if (process.env.VERCEL) return;
  ensureDataDir();
  try {
    import_fs.default.writeFileSync(DB_FILE, JSON.stringify(localNotificacoes, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar notificacoes_db.json:", err);
  }
}
function saveLouvoresHashes() {
  if (process.env.VERCEL) return;
  ensureDataDir();
  try {
    import_fs.default.writeFileSync(HASHES_FILE, JSON.stringify(louvoresHashes, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar louvores_hashes.json:", err);
  }
}
function saveSheetsSnapshot() {
  if (process.env.VERCEL) return;
  ensureDataDir();
  try {
    import_fs.default.writeFileSync(SNAPSHOT_FILE, JSON.stringify(currentSnapshot, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar sheets_snapshot.json:", err);
  }
}
function getSheetsSnapshot() {
  return currentSnapshot;
}
loadNotifications();
function normalizarNome(txt) {
  if (!txt) return "";
  return txt.toString().toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}
function isDateInPast(dataCultoStr) {
  if (!dataCultoStr) return false;
  const match = dataCultoStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return false;
  const dia = parseInt(match[1], 10);
  const mes = parseInt(match[2], 10);
  const ano = parseInt(match[3], 10);
  const sp = getSaoPauloNow();
  const spMatch = sp.dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!spMatch) return false;
  const spDia = parseInt(spMatch[1], 10);
  const spMes = parseInt(spMatch[2], 10);
  const spAno = parseInt(spMatch[3], 10);
  if (ano < spAno) return true;
  if (ano > spAno) return false;
  if (mes < spMes) return true;
  if (mes > spMes) return false;
  return dia < spDia;
}
function extrairMembrosDaEscala(escala) {
  const result = [];
  if (!escala) return result;
  if (escala.dirigente && escala.dirigente.trim()) {
    const nomeDir = escala.dirigente.trim();
    result.push({
      nome: nomeDir,
      funcao: "Dirigente"
    });
  }
  if (escala.mesario && escala.mesario.trim()) {
    const nomeMes = escala.mesario.trim();
    result.push({
      nome: nomeMes,
      funcao: "Mes\xE1rio de Som"
    });
  }
  if (escala.vocal && escala.vocal.trim()) {
    const vocals = escala.vocal.split(/[,X\/]/i).map((v) => v.trim()).filter((v) => v.length > 0);
    for (const v of vocals) {
      if (!result.some((m) => normalizarNome(m.nome) === normalizarNome(v))) {
        result.push({
          nome: v,
          funcao: "Vocal"
        });
      }
    }
  }
  if (escala.musicos && escala.musicos.trim()) {
    const rawMusicos = escala.musicos.split(/[,X\/]/i).map((m) => m.trim()).filter((m) => m.length > 0);
    for (const item of rawMusicos) {
      const matchInst = item.match(/^(.+?)\s*\((.+?)\)$/);
      let nome = item;
      let instrumento = void 0;
      if (matchInst) {
        nome = matchInst[1].trim();
        instrumento = matchInst[2].trim();
      }
      if (nome) {
        const existingIdx = result.findIndex((m) => normalizarNome(m.nome) === normalizarNome(nome));
        if (existingIdx >= 0) {
          result[existingIdx].instrumento = instrumento;
        } else {
          result.push({
            nome,
            funcao: "M\xFAsico",
            instrumento
          });
        }
      }
    }
  }
  return result;
}
function logChangeDetector(params) {
  console.log(`
[CHANGE-DETECTOR]`);
  console.log(`aba: ${params.aba}`);
  if (params.linha !== void 0) console.log(`linha: ${params.linha}`);
  if (params.data) console.log(`data: ${params.data}`);
  console.log(`altera\xE7\xE3o detectada: ${params.alteracaoDetectada}`);
  console.log(`estado anterior: ${params.estadoAnterior}`);
  console.log(`estado atual: ${params.estadoAtual}`);
  console.log(`eventoId: ${params.eventoId}`);
  console.log(`destinat\xE1rios: ${params.destinatarios}`);
  console.log(`notifica\xE7\xE3o criada: ${params.notificacaoCriada}`);
  console.log(`origem: ${params.origem}
`);
}
function isUserInEscala(escala, nome) {
  if (!escala || !nome) return false;
  const search = normalizarNome(nome);
  if (!search) return false;
  const campos = [
    escala.dirigente,
    escala.vocal,
    escala.musicos,
    escala.mesario
  ];
  for (const c of campos) {
    if (c && normalizarNome(c).includes(search)) {
      return true;
    }
  }
  return false;
}
function getSaoPauloNow() {
  const now = /* @__PURE__ */ new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  let year = "2026";
  let month = "01";
  let day = "01";
  let hour = "00";
  let minute = "00";
  for (const p of parts) {
    if (p.type === "year") year = p.value;
    if (p.type === "month") month = p.value;
    if (p.type === "day") day = p.value;
    if (p.type === "hour") hour = p.value;
    if (p.type === "minute") minute = p.value;
  }
  if (hour === "24") hour = "00";
  const dateStr = `${day}/${month}/${year}`;
  const isoDate = `${year}-${month}-${day}`;
  const timeStr = `${hour}:${minute}`;
  const totalMinutes = parseInt(hour, 10) * 60 + parseInt(minute, 10);
  const spDate = /* @__PURE__ */ new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
  const dayOfWeek = spDate.getDay();
  return {
    dateStr,
    isoDate,
    dayOfWeek,
    timeStr,
    totalMinutes
  };
}
function isKeyMarkedRead(id, eventoId, destinatario) {
  if (id && markedReadKeys.has(id.trim())) return true;
  if (eventoId) {
    const cleanEvt = eventoId.trim();
    if (markedReadKeys.has(`evt:${cleanEvt}`)) return true;
    if (destinatario) {
      const normDest = normalizarNome(destinatario);
      if (normDest && markedReadKeys.has(`user_evt:${normDest}_${cleanEvt}`)) return true;
    }
  }
  return false;
}
function registrarChavesComoLidas(params) {
  const { id, eventoId, destinatario } = params;
  let changed = false;
  if (id && id.trim()) {
    const cleanId = id.trim();
    if (!markedReadKeys.has(cleanId)) {
      markedReadKeys.add(cleanId);
      changed = true;
    }
  }
  if (eventoId && eventoId.trim()) {
    const cleanEvt = eventoId.trim();
    if (!markedReadKeys.has(`evt:${cleanEvt}`)) {
      markedReadKeys.add(`evt:${cleanEvt}`);
      changed = true;
    }
    if (destinatario) {
      const normDest = normalizarNome(destinatario);
      if (normDest && !markedReadKeys.has(`user_evt:${normDest}_${cleanEvt}`)) {
        markedReadKeys.add(`user_evt:${normDest}_${cleanEvt}`);
        changed = true;
      }
    }
  }
  if (changed) {
    saveMarkedReadKeys();
  }
}
function criarNotificacaoSeNaoExiste(params) {
  const { id: customId, destinatario, tipo, titulo, mensagem, eventoId, origem } = params;
  if (!destinatario || !eventoId) {
    return null;
  }
  const normDest = normalizarNome(destinatario);
  const normEvento = eventoId.trim();
  const cleanCustomId = customId ? customId.trim() : "";
  const existing = localNotificacoes.find((n) => {
    if (cleanCustomId && n.id && n.id.trim() === cleanCustomId) {
      return true;
    }
    const nDest = normalizarNome(n.destinatario);
    const nEvento = (n.eventoId || "").trim();
    return (nDest === normDest || nDest === "todos") && nEvento === normEvento;
  });
  if (existing) {
    return null;
  }
  const jaFoiLida = isKeyMarkedRead(cleanCustomId, normEvento, destinatario);
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const novaNotif = {
    id: cleanCustomId || import_crypto.default.randomUUID(),
    destinatario: destinatario.trim(),
    titulo: titulo.trim(),
    mensagem: mensagem.trim(),
    tipo: tipo.trim().toUpperCase(),
    data: nowIso,
    dataHora: nowIso,
    lida: jaFoiLida ? "SIM" : "NAO",
    eventoId: normEvento,
    origem: origem || "APP"
  };
  localNotificacoes.unshift(novaNotif);
  saveNotifications();
  sendFcmPushToUser(destinatario, {
    title: titulo,
    body: mensagem,
    id: novaNotif.id,
    eventoId: novaNotif.eventoId,
    type: novaNotif.tipo
  }).catch((err) => console.error("[FCM] Erro ao disparar push:", err));
  if (origem !== "GOOGLE_SHEETS") {
    pushNotificacaoParaGas(novaNotif);
  }
  return novaNotif;
}
var gasApiUrlConfigured = "";
function setGasApiUrlForNotifications(url) {
  gasApiUrlConfigured = url;
}
async function pushNotificacaoParaGas(notif) {
  if (!gasApiUrlConfigured) return;
  try {
    const form = new URLSearchParams({
      action: "criarNotificacao",
      id: notif.id,
      destinatario: notif.destinatario,
      titulo: notif.titulo,
      mensagem: notif.mensagem,
      tipo: notif.tipo,
      data: notif.data,
      lida: notif.lida,
      eventoId: notif.eventoId || "",
      origem: notif.origem || "APP"
    });
    await fetch(gasApiUrlConfigured, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: form.toString()
    });
  } catch (err) {
  }
}
function mergeGasNotifications(gasList) {
  if (!Array.isArray(gasList)) return localNotificacoes;
  let hasNew = false;
  for (const item of gasList) {
    if (!item || !item.id) continue;
    const normDest = normalizarNome(item.destinatario);
    const cleanId = String(item.id).trim();
    const cleanEvento = item.eventoId ? String(item.eventoId).trim() : "";
    const cleanTitulo = (item.titulo || "").trim().toLowerCase();
    const cleanMensagem = (item.mensagem || "").trim().toLowerCase();
    const jaFoiMarcadaLida = isKeyMarkedRead(cleanId, cleanEvento, item.destinatario) || String(item.lida || "").toUpperCase() === "SIM";
    const existing = localNotificacoes.find((n) => {
      if (cleanId && n.id === cleanId) return true;
      if (cleanEvento && n.eventoId && n.eventoId === cleanEvento && normalizarNome(n.destinatario) === normDest) {
        return true;
      }
      if (normDest && normalizarNome(n.destinatario) === normDest && (n.titulo || "").trim().toLowerCase() === cleanTitulo && (n.mensagem || "").trim().toLowerCase() === cleanMensagem) {
        return true;
      }
      return false;
    });
    if (existing) {
      if (existing.lida === "SIM" || jaFoiMarcadaLida) {
        if (existing.lida !== "SIM") {
          existing.lida = "SIM";
          hasNew = true;
        }
        registrarChavesComoLidas({ id: existing.id, eventoId: existing.eventoId, destinatario: existing.destinatario });
      } else if (item.lida && String(item.lida).toUpperCase() === "SIM") {
        existing.lida = "SIM";
        hasNew = true;
        registrarChavesComoLidas({ id: existing.id, eventoId: existing.eventoId, destinatario: existing.destinatario });
      }
    } else {
      const statusLida = jaFoiMarcadaLida ? "SIM" : "NAO";
      const novaNotif = {
        id: cleanId || import_crypto.default.randomUUID(),
        destinatario: item.destinatario || "TODOS",
        titulo: item.titulo || "Notifica\xE7\xE3o",
        mensagem: item.mensagem || "",
        tipo: (item.tipo || "GERAL").toUpperCase(),
        data: item.data || item.dataHora || (/* @__PURE__ */ new Date()).toISOString(),
        dataHora: item.dataHora || item.data || (/* @__PURE__ */ new Date()).toISOString(),
        lida: statusLida,
        eventoId: cleanEvento || void 0,
        origem: item.origem || "GOOGLE_SHEETS"
      };
      localNotificacoes.push(novaNotif);
      if (statusLida === "SIM") {
        registrarChavesComoLidas({ id: novaNotif.id, eventoId: novaNotif.eventoId, destinatario: novaNotif.destinatario });
      }
      hasNew = true;
    }
  }
  if (hasNew) {
    saveNotifications();
  }
  return localNotificacoes;
}
function getNotificacoesParaUsuario(nomeUsuario) {
  const normUser = normalizarNome(nomeUsuario);
  return localNotificacoes.filter((n) => {
    const normDest = normalizarNome(n.destinatario);
    return normDest === normUser || normDest === "todos" || normDest === "todos os membros" || normDest === "geral";
  }).map((n) => {
    if (n.lida !== "SIM" && isKeyMarkedRead(n.id, n.eventoId, n.destinatario)) {
      n.lida = "SIM";
    }
    return n;
  }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}
function marcarComoLidaLocal(idOrEventoId) {
  const clean = String(idOrEventoId || "").trim();
  if (!clean) return false;
  let found = false;
  for (const n of localNotificacoes) {
    if (n.id === clean || n.eventoId && n.eventoId === clean) {
      n.lida = "SIM";
      registrarChavesComoLidas({ id: n.id, eventoId: n.eventoId, destinatario: n.destinatario });
      found = true;
    }
  }
  registrarChavesComoLidas({ id: clean, eventoId: clean });
  if (found) {
    saveNotifications();
    return true;
  }
  return true;
}
function marcarTodasComoLidasLocal(nomeUsuario) {
  const normUser = normalizarNome(nomeUsuario);
  let count = 0;
  for (const n of localNotificacoes) {
    const normDest = normalizarNome(n.destinatario);
    if (normDest === normUser || normDest === "todos" || normDest === "todos os membros" || normDest === "geral") {
      n.lida = "SIM";
      registrarChavesComoLidas({ id: n.id, eventoId: n.eventoId, destinatario: n.destinatario });
      count++;
    }
  }
  if (count > 0) {
    saveNotifications();
  }
  return count;
}
function processarLembretesDeCulto(escalas, integrantes) {
  if (!escalas || escalas.length === 0 || !integrantes || integrantes.length === 0) {
    return 0;
  }
  const sp = getSaoPauloNow();
  const { dateStr, isoDate, dayOfWeek, totalMinutes } = sp;
  let slots = [];
  if (dayOfWeek === 2 || dayOfWeek === 5) {
    slots = [
      { slot: "09:00", slotMinutes: 9 * 60 },
      { slot: "12:00", slotMinutes: 12 * 60 },
      { slot: "15:00", slotMinutes: 15 * 60 },
      { slot: "18:00", slotMinutes: 18 * 60 },
      { slot: "19:00", slotMinutes: 19 * 60 }
    ];
  } else if (dayOfWeek === 0) {
    slots = [
      { slot: "10:00", slotMinutes: 10 * 60 },
      { slot: "13:00", slotMinutes: 13 * 60 },
      { slot: "15:30", slotMinutes: 15 * 60 + 30 },
      { slot: "17:00", slotMinutes: 17 * 60 }
    ];
  } else {
    return 0;
  }
  const escalaHoje = escalas.find((e) => {
    if (!e || !e.data) return false;
    const cleanE = e.data.trim().replace(/[^0-9/]/g, "");
    const cleanHoje = dateStr.replace(/[^0-9/]/g, "");
    return cleanE === cleanHoje;
  });
  if (!escalaHoje) {
    return 0;
  }
  const validSlots = slots.filter((s) => totalMinutes >= s.slotMinutes);
  if (validSlots.length === 0) return 0;
  const currentSlot = validSlots[validSlots.length - 1];
  const slotCode = currentSlot.slot.replace(":", "-");
  const membrosEscalados = extrairMembrosDaEscala(escalaHoje);
  let totalCriadas = 0;
  for (const integrante of integrantes) {
    if (!integrante || !integrante.nome) continue;
    const normUser = normalizarNome(integrante.nome).replace(/\s+/g, "_");
    const eventoId = `CULTO_${isoDate}_${slotCode}_${normUser}`;
    const membroInfo = membrosEscalados.find(
      (m) => normalizarNome(m.nome) === normalizarNome(integrante.nome)
    );
    const estaEscalado = Boolean(membroInfo) || isUserInEscala(escalaHoje, integrante.nome);
    let titulo;
    let mensagem;
    let tipo;
    if (estaEscalado) {
      titulo = "Culto Hoje";
      const detalheFuncao = membroInfo ? membroInfo.instrumento ? `${membroInfo.funcao} (${membroInfo.instrumento})` : membroInfo.funcao : "a equipe";
      mensagem = `${integrante.nome}, a Paz! Hoje tem culto e voc\xEA est\xE1 escalado(a) como ${detalheFuncao}!`;
      tipo = "CULTO";
    } else {
      titulo = "Lembrete de Culto";
      mensagem = "Olha que ben\xE7\xE3o! Passando pra lembrar que hoje tem culto!";
      tipo = "LEMBRETE";
    }
    const notif = criarNotificacaoSeNaoExiste({
      destinatario: integrante.nome,
      tipo,
      titulo,
      mensagem,
      eventoId,
      origem: "APP"
    });
    if (notif) {
      totalCriadas++;
    }
  }
  return totalCriadas;
}
function processarNotificacaoNovoRecado(recadoId, integrantes, origem = "APP") {
  if (!recadoId) return 0;
  const eventoId = `NOVO_RECADO_${recadoId}`;
  let count = 0;
  for (const integrante of integrantes) {
    if (!integrante || !integrante.nome) continue;
    const n = criarNotificacaoSeNaoExiste({
      destinatario: integrante.nome,
      tipo: "NOVO_RECADO",
      titulo: "Novo Recado",
      mensagem: "ATEN\xC7\xC3O! Tem um novo recado!",
      eventoId,
      origem
    });
    if (n) count++;
  }
  if (count > 0) {
    logChangeDetector({
      aba: "RECADOS",
      linha: recadoId,
      alteracaoDetectada: "Novo recado inserido",
      estadoAnterior: "(vazio)",
      estadoAtual: `ID: ${recadoId}`,
      eventoId,
      destinatarios: "Todos os integrantes",
      notificacaoCriada: "ATEN\xC7\xC3O! Tem um novo recado!",
      origem
    });
  }
  return count;
}
function processarNotificacaoNovaEscala(mesParam, integrantes, origem = "APP") {
  const sp = getSaoPauloNow();
  let mesKey = sp.isoDate.substring(0, 7).replace("-", "_");
  if (mesParam && typeof mesParam === "string" && mesParam.trim()) {
    const clean = mesParam.trim().replace(/[^0-9]/g, "_");
    if (clean.length >= 6) {
      mesKey = clean;
    }
  }
  const eventoId = `NOVA_ESCALA_${mesKey}`;
  const jaExiste = localNotificacoes.some((n) => (n.eventoId || "").trim() === eventoId);
  if (jaExiste) {
    return {
      sucesso: false,
      jaEnviada: true,
      mensagem: "A notifica\xE7\xE3o da nova escala deste m\xEAs j\xE1 foi enviada."
    };
  }
  let count = 0;
  for (const integrante of integrantes) {
    if (!integrante || !integrante.nome) continue;
    const n = criarNotificacaoSeNaoExiste({
      destinatario: integrante.nome,
      tipo: "NOVA_ESCALA",
      titulo: "Nova Escala",
      mensagem: "ATEN\xC7\xC3O!! NOVA ESCALA DISPONIVEL",
      eventoId,
      origem
    });
    if (n) count++;
  }
  if (count > 0) {
    logChangeDetector({
      aba: "ESCALA",
      alteracaoDetectada: "Divulga\xE7\xE3o de nova escala mensal",
      estadoAnterior: "(n\xE3o divulgada)",
      estadoAtual: `M\xEAs: ${mesKey}`,
      eventoId,
      destinatarios: "Todos os integrantes",
      notificacaoCriada: "ATEN\xC7\xC3O!! NOVA ESCALA DISPONIVEL",
      origem
    });
  }
  return {
    sucesso: true,
    mensagem: "Notifica\xE7\xE3o da nova escala enviada a todos com sucesso!",
    totalEnviadas: count
  };
}
function processarNotificacaoNovaSolicitacao(params) {
  const { solicitacaoId, quemPediu, dataEscala, integrantes, origem = "APP" } = params;
  const safeId = (solicitacaoId || `${dataEscala}_${quemPediu}`).replace(/[^a-zA-Z0-9_-]/g, "_");
  const eventoId = `SOLICITACAO_${safeId}_NOVA`;
  const lideres = integrantes.filter((i) => {
    const f = (i.funcao || "").toLowerCase();
    return f.includes("lider");
  });
  let count = 0;
  for (const lider of lideres) {
    const n = criarNotificacaoSeNaoExiste({
      destinatario: lider.nome,
      tipo: "SOLICITACAO_NOVA",
      titulo: "Solicita\xE7\xE3o de Troca",
      mensagem: `Ol\xE1 Lider, ${quemPediu} fez um solicita\xE7\xE3o de troca!`,
      eventoId,
      origem
    });
    if (n) count++;
  }
  return count;
}
function processarNotificacaoDecisaoSolicitacao(params) {
  const { solicitacaoId, quemPediu, substituto, dataEscala, acao, origem = "APP" } = params;
  const safeId = (solicitacaoId || `${dataEscala}_${quemPediu}`).replace(/[^a-zA-Z0-9_-]/g, "_");
  let count = 0;
  if (acao === "APROVAR") {
    const n1 = criarNotificacaoSeNaoExiste({
      destinatario: quemPediu,
      tipo: "SOLICITACAO_APROVADA",
      titulo: "Solicita\xE7\xE3o Aprovada",
      mensagem: `A Paz ${quemPediu}! Sua solicita\xE7\xE3o foi aprovada!`,
      eventoId: `SOLICITACAO_${safeId}_APROVADA_SOLICITANTE`,
      origem
    });
    if (n1) count++;
    if (substituto) {
      const n2 = criarNotificacaoSeNaoExiste({
        destinatario: substituto,
        tipo: "SOLICITACAO_APROVADA",
        titulo: "Nova Escala Atribu\xEDda",
        mensagem: `A Paz ${substituto}! Nova escala pra voc\xEA!`,
        eventoId: `SOLICITACAO_${safeId}_APROVADA_SUBSTITUTO`,
        origem
      });
      if (n2) count++;
    }
    logChangeDetector({
      aba: "SOLICITA\xC7\xD5ES",
      data: dataEscala,
      alteracaoDetectada: `Solicita\xE7\xE3o Aprovada (Solicitante: ${quemPediu}, Substituto: ${substituto})`,
      estadoAnterior: "PENDENTE",
      estadoAtual: "APROVADA",
      eventoId: `SOLICITACAO_${safeId}_APROVADA`,
      destinatarios: `${quemPediu}, ${substituto}`,
      notificacaoCriada: `Solicitante: Aprovada / Substituto: Nova Escala`,
      origem
    });
  } else if (acao === "RECUSAR") {
    const n1 = criarNotificacaoSeNaoExiste({
      destinatario: quemPediu,
      tipo: "SOLICITACAO_RECUSADA",
      titulo: "Solicita\xE7\xE3o Recusada",
      mensagem: `A Paz ${quemPediu}! Solicita\xE7\xE3o N\xC3O aprovada!`,
      eventoId: `SOLICITACAO_${safeId}_RECUSADA_SOLICITANTE`,
      origem
    });
    if (n1) count++;
    if (substituto) {
      const n2 = criarNotificacaoSeNaoExiste({
        destinatario: substituto,
        tipo: "SOLICITACAO_RECUSADA",
        titulo: "Solicita\xE7\xE3o N\xE3o Aprovada",
        mensagem: `A Paz ${substituto}! Sem altera\xE7\xE3o na escala!`,
        eventoId: `SOLICITACAO_${safeId}_RECUSADA_SUBSTITUTO`,
        origem
      });
      if (n2) count++;
    }
    logChangeDetector({
      aba: "SOLICITA\xC7\xD5ES",
      data: dataEscala,
      alteracaoDetectada: `Solicita\xE7\xE3o Recusada (Solicitante: ${quemPediu}, Substituto: ${substituto})`,
      estadoAnterior: "PENDENTE",
      estadoAtual: "RECUSADA",
      eventoId: `SOLICITACAO_${safeId}_RECUSADA`,
      destinatarios: `${quemPediu}, ${substituto}`,
      notificacaoCriada: `Solicitante: N\xC3O aprovada / Substituto: Sem altera\xE7\xE3o`,
      origem
    });
  }
  return count;
}
function processarNotificacaoLouvoresUniformes(params) {
  const { dataEscala, louvores, uniforme, escala, integrantes, origem = "APP" } = params;
  if (!dataEscala || !louvores && !uniforme) {
    return 0;
  }
  const cleanData = dataEscala.trim().replace(/[^0-9/]/g, "").replace(/\//g, "_");
  const content = `${(louvores || "").trim()}||${(uniforme || "").trim()}`;
  if (!content.replace(/\|/g, "").trim()) {
    return 0;
  }
  const hash = import_crypto.default.createHash("md5").update(content).digest("hex").substring(0, 8);
  const previousHash = louvoresHashes[dataEscala];
  if (previousHash === hash) {
    return 0;
  }
  louvoresHashes[dataEscala] = hash;
  saveLouvoresHashes();
  const eventoId = `LOUVORES_UNIFORMES_${cleanData}_V${hash}`;
  let count = 0;
  const destinatariosNotificados = [];
  const membrosEscala = extrairMembrosDaEscala(escala);
  const nomesAlvo = /* @__PURE__ */ new Set();
  for (const m of membrosEscala) {
    if (m && m.nome && m.nome.trim()) {
      nomesAlvo.add(m.nome.trim());
    }
  }
  for (const integrante of integrantes || []) {
    if (!integrante || !integrante.nome) continue;
    if (isUserInEscala(escala, integrante.nome)) {
      nomesAlvo.add(integrante.nome.trim());
    }
  }
  for (const nomeDest of nomesAlvo) {
    const n = criarNotificacaoSeNaoExiste({
      destinatario: nomeDest,
      tipo: "LOUVORES_UNIFORMES",
      titulo: "Louvores e Uniformes",
      mensagem: `A Paz ${nomeDest}! Os louvores e uniformes j\xE1 est\xE3o dispon\xEDveis!`,
      eventoId,
      origem
    });
    if (n) {
      count++;
      destinatariosNotificados.push(nomeDest);
    }
  }
  if (count > 0) {
    logChangeDetector({
      aba: "ESCALA",
      data: dataEscala,
      alteracaoDetectada: `Louvores/Uniformes Atualizados`,
      estadoAnterior: previousHash ? `Hash anterior: ${previousHash}` : "(vazio)",
      estadoAtual: `Hash novo: ${hash}`,
      eventoId,
      destinatarios: destinatariosNotificados.join(", "),
      notificacaoCriada: "A Paz (nome)! Os louvores e uniformes j\xE1 est\xE3o dispon\xEDveis!",
      origem
    });
  }
  return count;
}
function detectarAlteracoesNaPlanilha(params) {
  const {
    escalaAtual = [],
    solicitacoesAtuais = [],
    recadosAtuais = [],
    integrantes = [],
    origem = "GOOGLE_SHEETS"
  } = params;
  let totalNotificacoes = 0;
  const eventosDetectados = [];
  if (!currentSnapshot.initialized) {
    console.log(`[CHANGE-DETECTOR] Inicializando primeiro snapshot de refer\xEAncia (${escalaAtual.length} escalas). Nenhuma notifica\xE7\xE3o ser\xE1 disparada.`);
    currentSnapshot.initialized = true;
    currentSnapshot.timestamp = (/* @__PURE__ */ new Date()).toISOString();
    currentSnapshot.escalas = {};
    currentSnapshot.solicitacoes = {};
    currentSnapshot.recados = {};
    for (const e of escalaAtual) {
      if (!e || !e.data) continue;
      const cleanData = e.data.trim();
      const content = `${(e.louvores || "").trim()}||${(e.uniforme || "").trim()}`;
      const hash = content.replace(/\|/g, "").trim() ? import_crypto.default.createHash("md5").update(content).digest("hex").substring(0, 8) : "";
      currentSnapshot.escalas[cleanData] = {
        data: cleanData,
        dirigente: e.dirigente || "",
        vocal: e.vocal || "",
        musicos: e.musicos || "",
        mesario: e.mesario || "",
        louvores: e.louvores || "",
        uniforme: e.uniforme || "",
        membros: extrairMembrosDaEscala(e),
        louvoresHash: hash
      };
      if (hash) {
        louvoresHashes[cleanData] = hash;
      }
    }
    for (const s of solicitacoesAtuais) {
      if (!s) continue;
      const sId = s.id || `${s.dataEscala}_${s.quemPediu}`;
      currentSnapshot.solicitacoes[sId] = {
        status: (s.status || "PENDENTE").toUpperCase(),
        quemPediu: s.quemPediu || "",
        substituto: s.substituto || "",
        dataEscala: s.dataEscala || ""
      };
    }
    for (const r of recadosAtuais) {
      if (!r || !r.id) continue;
      currentSnapshot.recados[r.id] = {
        id: r.id,
        titulo: r.titulo || "",
        ativo: (r.ativo || "SIM").toUpperCase()
      };
    }
    saveSheetsSnapshot();
    saveLouvoresHashes();
    return { totalNotificacoes: 0, eventosDetectados: ["PRIMEIRA_EXECUCAO_SNAPSHOT_CRIADO"] };
  }
  for (const escalaNova of escalaAtual) {
    if (!escalaNova || !escalaNova.data) continue;
    const dataCulto = escalaNova.data.trim();
    const cleanDataKey = dataCulto.replace(/[^0-9/]/g, "").replace(/\//g, "_");
    const escalaAntiga = currentSnapshot.escalas[dataCulto];
    const dataPassada = isDateInPast(dataCulto);
    const membrosNovos = extrairMembrosDaEscala(escalaNova);
    if (escalaAntiga) {
      const membrosAntigos = escalaAntiga.membros || [];
      if (!dataPassada) {
        for (const mAntigo of membrosAntigos) {
          const continuaNaEscala = membrosNovos.some(
            (mNovo) => normalizarNome(mNovo.nome) === normalizarNome(mAntigo.nome)
          );
          if (!continuaNaEscala) {
            const normNome = normalizarNome(mAntigo.nome).replace(/\s+/g, "_");
            const eventoId = `ESCALA_REMOVIDO_${cleanDataKey}_${normNome}`;
            eventosDetectados.push(eventoId);
            const n = criarNotificacaoSeNaoExiste({
              destinatario: mAntigo.nome,
              tipo: "ESCALA",
              titulo: "Altera\xE7\xE3o na Escala",
              mensagem: `A Paz ${mAntigo.nome}! Voc\xEA foi removido(a) da escala do dia ${dataCulto}.`,
              eventoId,
              origem
            });
            if (n) {
              totalNotificacoes++;
              logChangeDetector({
                aba: "ESCALA",
                data: dataCulto,
                alteracaoDetectada: `Integrante Removido: ${mAntigo.nome}`,
                estadoAnterior: `Escalado como ${mAntigo.funcao}${mAntigo.instrumento ? ` (${mAntigo.instrumento})` : ""}`,
                estadoAtual: `(Removido da escala)`,
                eventoId,
                destinatarios: mAntigo.nome,
                notificacaoCriada: `A Paz ${mAntigo.nome}! Voc\xEA foi removido(a) da escala do dia ${dataCulto}.`,
                origem
              });
            }
          }
        }
        for (const mNovo of membrosNovos) {
          const estavaNaEscala = membrosAntigos.some(
            (mAntigo) => normalizarNome(mAntigo.nome) === normalizarNome(mNovo.nome)
          );
          if (!estavaNaEscala) {
            const normNome = normalizarNome(mNovo.nome).replace(/\s+/g, "_");
            const eventoId = `ESCALA_ADICIONADO_${cleanDataKey}_${normNome}`;
            const detalheFuncao = mNovo.instrumento ? `${mNovo.funcao} (${mNovo.instrumento})` : mNovo.funcao;
            eventosDetectados.push(eventoId);
            const n = criarNotificacaoSeNaoExiste({
              destinatario: mNovo.nome,
              tipo: "ESCALA",
              titulo: "Nova Escala para Voc\xEA",
              mensagem: `A Paz ${mNovo.nome}! Voc\xEA foi escalado(a) para o culto do dia ${dataCulto} como ${detalheFuncao}!`,
              eventoId,
              origem
            });
            if (n) {
              totalNotificacoes++;
              logChangeDetector({
                aba: "ESCALA",
                data: dataCulto,
                alteracaoDetectada: `Integrante Adicionado: ${mNovo.nome}`,
                estadoAnterior: `(N\xE3o estava escalado)`,
                estadoAtual: `Escalado como ${detalheFuncao}`,
                eventoId,
                destinatarios: mNovo.nome,
                notificacaoCriada: `A Paz ${mNovo.nome}! Voc\xEA foi escalado(a) para o culto do dia ${dataCulto} como ${detalheFuncao}!`,
                origem
              });
            }
          }
        }
        for (const mNovo of membrosNovos) {
          const exatoAntigo = membrosAntigos.find(
            (mA) => normalizarNome(mA.nome) === normalizarNome(mNovo.nome) && mA.funcao === mNovo.funcao && (mA.instrumento || "") === (mNovo.instrumento || "")
          );
          if (exatoAntigo) {
            continue;
          }
          const correspondenteAntigo = membrosAntigos.find(
            (mA) => normalizarNome(mA.nome) === normalizarNome(mNovo.nome)
          );
          if (correspondenteAntigo) {
            const funcaoMudou = correspondenteAntigo.funcao !== mNovo.funcao;
            const instAntigo = correspondenteAntigo.instrumento || "";
            const instNovo = mNovo.instrumento || "";
            const instrumentoMudou = instAntigo !== instNovo;
            if (funcaoMudou || instrumentoMudou) {
              const detalheNovo = mNovo.instrumento ? `${mNovo.funcao} (${mNovo.instrumento})` : mNovo.funcao;
              const detalheAntigo = correspondenteAntigo.instrumento ? `${correspondenteAntigo.funcao} (${correspondenteAntigo.instrumento})` : correspondenteAntigo.funcao;
              const roleHash = import_crypto.default.createHash("md5").update(detalheNovo).digest("hex").substring(0, 6);
              const normNome = normalizarNome(mNovo.nome).replace(/\s+/g, "_");
              const eventoId = `ESCALA_ALTERADA_${cleanDataKey}_${normNome}_${roleHash}`;
              eventosDetectados.push(eventoId);
              const n = criarNotificacaoSeNaoExiste({
                destinatario: mNovo.nome,
                tipo: "ESCALA",
                titulo: "Fun\xE7\xE3o Alterada na Escala",
                mensagem: `A Paz ${mNovo.nome}! Sua fun\xE7\xE3o na escala do dia ${dataCulto} foi alterada para ${detalheNovo}.`,
                eventoId,
                origem
              });
              if (n) {
                totalNotificacoes++;
                logChangeDetector({
                  aba: "ESCALA",
                  data: dataCulto,
                  alteracaoDetectada: `Mudan\xE7a de Fun\xE7\xE3o/Instrumento: ${mNovo.nome}`,
                  estadoAnterior: detalheAntigo,
                  estadoAtual: detalheNovo,
                  eventoId,
                  destinatarios: mNovo.nome,
                  notificacaoCriada: `A Paz ${mNovo.nome}! Sua fun\xE7\xE3o na escala do dia ${dataCulto} foi alterada para ${detalheNovo}.`,
                  origem
                });
              }
            }
          }
        }
        const louvoresAntigo = (escalaAntiga.louvores || "").trim();
        const louvoresNovo = (escalaNova.louvores || "").trim();
        const uniformeAntigo = (escalaAntiga.uniforme || "").trim();
        const uniformeNovo = (escalaNova.uniforme || "").trim();
        if (louvoresAntigo !== louvoresNovo || uniformeAntigo !== uniformeNovo) {
          const countLouv = processarNotificacaoLouvoresUniformes({
            dataEscala: dataCulto,
            louvores: louvoresNovo,
            uniforme: uniformeNovo,
            escala: escalaNova,
            integrantes,
            origem
          });
          totalNotificacoes += countLouv;
        }
      }
    } else {
      if (!dataPassada) {
        for (const mNovo of membrosNovos) {
          const normNome = normalizarNome(mNovo.nome).replace(/\s+/g, "_");
          const eventoId = `ESCALA_ADICIONADO_${cleanDataKey}_${normNome}`;
          const detalheFuncao = mNovo.instrumento ? `${mNovo.funcao} (${mNovo.instrumento})` : mNovo.funcao;
          const n = criarNotificacaoSeNaoExiste({
            destinatario: mNovo.nome,
            tipo: "ESCALA",
            titulo: "Nova Escala para Voc\xEA",
            mensagem: `A Paz ${mNovo.nome}! Voc\xEA foi escalado(a) para o culto do dia ${dataCulto} como ${detalheFuncao}!`,
            eventoId,
            origem
          });
          if (n) {
            totalNotificacoes++;
            eventosDetectados.push(eventoId);
          }
        }
      }
    }
    const content = `${(escalaNova.louvores || "").trim()}||${(escalaNova.uniforme || "").trim()}`;
    const hash = content.replace(/\|/g, "").trim() ? import_crypto.default.createHash("md5").update(content).digest("hex").substring(0, 8) : "";
    currentSnapshot.escalas[dataCulto] = {
      data: dataCulto,
      dirigente: escalaNova.dirigente || "",
      vocal: escalaNova.vocal || "",
      musicos: escalaNova.musicos || "",
      mesario: escalaNova.mesario || "",
      louvores: escalaNova.louvores || "",
      uniforme: escalaNova.uniforme || "",
      membros: membrosNovos,
      louvoresHash: hash
    };
  }
  for (const sol of solicitacoesAtuais) {
    if (!sol) continue;
    const solId = sol.id || `${sol.dataEscala}_${sol.quemPediu}`;
    const statusAtual = (sol.status || "PENDENTE").toUpperCase();
    const solAntiga = currentSnapshot.solicitacoes[solId];
    if (solAntiga) {
      const statusAntigo = solAntiga.status;
      if (statusAntigo === "PENDENTE" && statusAtual === "APROVADA") {
        const count = processarNotificacaoDecisaoSolicitacao({
          solicitacaoId: solId,
          quemPediu: sol.quemPediu || solAntiga.quemPediu,
          substituto: sol.substituto || solAntiga.substituto,
          dataEscala: sol.dataEscala || solAntiga.dataEscala,
          acao: "APROVAR",
          origem
        });
        totalNotificacoes += count;
        eventosDetectados.push(`SOLICITACAO_${solId}_APROVADA`);
      } else if (statusAntigo === "PENDENTE" && statusAtual === "RECUSADA") {
        const count = processarNotificacaoDecisaoSolicitacao({
          solicitacaoId: solId,
          quemPediu: sol.quemPediu || solAntiga.quemPediu,
          substituto: sol.substituto || solAntiga.substituto,
          dataEscala: sol.dataEscala || solAntiga.dataEscala,
          acao: "RECUSAR",
          origem
        });
        totalNotificacoes += count;
        eventosDetectados.push(`SOLICITACAO_${solId}_RECUSADA`);
      }
    }
    currentSnapshot.solicitacoes[solId] = {
      status: statusAtual,
      quemPediu: sol.quemPediu || (solAntiga ? solAntiga.quemPediu : ""),
      substituto: sol.substituto || (solAntiga ? solAntiga.substituto : ""),
      dataEscala: sol.dataEscala || (solAntiga ? solAntiga.dataEscala : "")
    };
  }
  const novosRecadosSnapshot = {};
  for (const rec of recadosAtuais) {
    if (!rec || !rec.id) continue;
    const recId = rec.id;
    const ativoAtual = (rec.ativo || "SIM").toUpperCase();
    const recAntigo = currentSnapshot.recados[recId];
    if (!recAntigo && ativoAtual === "SIM") {
      const count = processarNotificacaoNovoRecado(recId, integrantes, origem);
      totalNotificacoes += count;
      eventosDetectados.push(`NOVO_RECADO_${recId}`);
    }
    novosRecadosSnapshot[recId] = {
      id: recId,
      titulo: rec.titulo || "",
      ativo: ativoAtual
    };
  }
  currentSnapshot.recados = novosRecadosSnapshot;
  currentSnapshot.timestamp = (/* @__PURE__ */ new Date()).toISOString();
  saveSheetsSnapshot();
  return { totalNotificacoes, eventosDetectados };
}
function resetSnapshotForTesting() {
  currentSnapshot = {
    initialized: false,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    escalas: {},
    solicitacoes: {},
    recados: {}
  };
}

// src/server/tests.ts
function executarBateriaDeTestesDetector() {
  console.log("\n=======================================================");
  console.log("INICIANDO AUDITORIA E TESTES DO DETECTOR DE ALTERA\xC7\xD5ES");
  console.log("=======================================================\n");
  const runId = Math.floor(Math.random() * 1e6);
  const diaNum = 10 + runId % 18;
  const dataTeste = `${diaNum}/08/2026`;
  const resultados = [];
  const integrantesMock = [
    { nome: "Jadson", funcao: "L\xEDder" },
    { nome: "Jo\xE3o", funcao: "Integrante" },
    { nome: "Maria", funcao: "Integrante" },
    { nome: "Lucas", funcao: "Integrante" }
  ];
  resetSnapshotForTesting();
  const escalaBase = [
    {
      data: dataTeste,
      dirigente: "Maria",
      vocal: "Lucas",
      musicos: "Jadson (Violino)",
      mesario: "Jo\xE3o",
      louvores: `1. Ruja o Le\xE3o, 2. Aclame ao Senhor [T${runId}]`,
      uniforme: "Camisa Preta"
    }
  ];
  console.log(">>> [SETUP] Inicializando Snapshot...");
  const resSnapshot = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaBase,
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });
  console.log(">>> Executando TESTE 1 (Pessoa removida/adicionada)...");
  const escalaT1 = [
    {
      data: dataTeste,
      dirigente: "Maria",
      vocal: "Lucas",
      musicos: "Jo\xE3o (Viol\xE3o)",
      // Jadson removido, João adicionado nos músicos
      mesario: "Maria",
      // João removido do mesário
      louvores: `1. Ruja o Le\xE3o, 2. Aclame ao Senhor [T${runId}]`,
      uniforme: "Camisa Preta"
    }
  ];
  const resT1 = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT1,
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });
  const t1Passou = resT1.eventosDetectados.some((e) => e.includes("ESCALA_REMOVIDO") || e.includes("ESCALA_ADICIONADO"));
  resultados.push({
    teste: "TESTE 1",
    descricao: "Alterar diretamente uma pessoa na escala (remover/adicionar)",
    passou: t1Passou,
    detalhes: `Eventos detectados: ${resT1.eventosDetectados.join(", ")} | Notifica\xE7\xF5es geradas: ${resT1.totalNotificacoes}`
  });
  console.log(">>> Executando TESTE 2 (Mudan\xE7a de Fun\xE7\xE3o/Instrumento)...");
  const escalaT2 = [
    {
      data: dataTeste,
      dirigente: "Maria",
      vocal: "Lucas",
      musicos: "Jo\xE3o (Guitarra)",
      // João alterado de Violão para Guitarra
      mesario: "Maria",
      louvores: `1. Ruja o Le\xE3o, 2. Aclame ao Senhor [T${runId}]`,
      uniforme: "Camisa Preta"
    }
  ];
  const resT2 = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT2,
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });
  const t2Passou = resT2.eventosDetectados.some((e) => e.includes("ESCALA_ALTERADA"));
  resultados.push({
    teste: "TESTE 2",
    descricao: "Alterar fun\xE7\xE3o/instrumento de integrante na escala",
    passou: t2Passou,
    detalhes: `Eventos: ${resT2.eventosDetectados.join(", ")}`
  });
  console.log(">>> Executando TESTE 3 (Altera\xE7\xE3o de Louvor)...");
  const escalaT3 = [
    {
      data: dataTeste,
      dirigente: "Maria",
      vocal: "Lucas",
      musicos: "Jo\xE3o (Guitarra)",
      mesario: "Maria",
      louvores: `1. Porque Ele Vive, 2. Bondade de Deus [T${runId}]`,
      // Louvores alterados
      uniforme: "Camisa Preta"
    }
  ];
  const resT3 = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT3,
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });
  const t3Passou = resT3.totalNotificacoes > 0;
  resultados.push({
    teste: "TESTE 3",
    descricao: "Alterar louvores diretamente na planilha",
    passou: t3Passou,
    detalhes: `Notifica\xE7\xF5es enviadas aos integrantes escalados: ${resT3.totalNotificacoes}`
  });
  console.log(">>> Executando TESTE 4 (Altera\xE7\xE3o de Uniforme)...");
  const escalaT4 = [
    {
      data: dataTeste,
      dirigente: "Maria",
      vocal: "Lucas",
      musicos: "Jo\xE3o (Guitarra)",
      mesario: "Maria",
      louvores: `1. Porque Ele Vive, 2. Bondade de Deus [T${runId}]`,
      uniforme: `Camisa Branca e Cal\xE7a Jeans [T${runId}]`
      // Uniforme alterado
    }
  ];
  const resT4 = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT4,
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });
  const t4Passou = resT4.totalNotificacoes > 0;
  resultados.push({
    teste: "TESTE 4",
    descricao: "Alterar uniforme na planilha",
    passou: t4Passou,
    detalhes: `Notifica\xE7\xF5es enviadas aos escalados: ${resT4.totalNotificacoes}`
  });
  console.log(">>> Executando TESTES 5 & 6 (Sem mudan\xE7as reais)...");
  const resT56 = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT4,
    // Mesma escala idêntica
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });
  const t56Passou = resT56.totalNotificacoes === 0 && resT56.eventosDetectados.length === 0;
  resultados.push({
    teste: "TESTE 5 & 6",
    descricao: "Editar a mesma informa\xE7\xE3o ou sem altera\xE7\xE3o relevante",
    passou: t56Passou,
    detalhes: `Total notifica\xE7\xF5es geradas: ${resT56.totalNotificacoes} (Esperado: 0)`
  });
  console.log(">>> Executando TESTES 7 & 8 (Origem APP vs GOOGLE_SHEETS)...");
  const notifApp = criarNotificacaoSeNaoExiste({
    destinatario: "Jadson",
    tipo: "ESCALA",
    titulo: "Teste Origem APP",
    mensagem: "Notifica\xE7\xE3o gerada pelo App",
    eventoId: `TESTE_ORIGEM_APP_${runId}`,
    origem: "APP"
  });
  const notifSheets = criarNotificacaoSeNaoExiste({
    destinatario: "Jadson",
    tipo: "ESCALA",
    titulo: "Teste Origem Sheets",
    mensagem: "Notifica\xE7\xE3o gerada pela Planilha",
    eventoId: `TESTE_ORIGEM_SHEETS_${runId}`,
    origem: "GOOGLE_SHEETS"
  });
  const t78Passou = notifApp?.origem === "APP" && notifSheets?.origem === "GOOGLE_SHEETS";
  resultados.push({
    teste: "TESTE 7 & 8",
    descricao: "Rastreamento correto da origem (APP vs GOOGLE_SHEETS)",
    passou: t78Passou,
    detalhes: `Origens registradas: App=${notifApp?.origem}, Sheets=${notifSheets?.origem}`
  });
  console.log(">>> Executando TESTES 9 & 10 (Solicita\xE7\xE3o e Anti-duplicidade)...");
  const solictacoesTeste = [
    {
      id: `sol_teste_${runId}`,
      dataEscala: dataTeste,
      quemPediu: "Maria",
      substituto: "Jo\xE3o",
      status: "APROVADA"
    }
  ];
  const resT9 = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT4,
    solicitacoesAtuais: solictacoesTeste,
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });
  const resT10 = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT4,
    solicitacoesAtuais: solictacoesTeste,
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });
  const t910Passou = resT10.totalNotificacoes === 0;
  resultados.push({
    teste: "TESTE 9 & 10",
    descricao: "Aprova\xE7\xE3o de solicita\xE7\xE3o e blindagem contra duplicidade",
    passou: t910Passou,
    detalhes: `Segunda execu\xE7\xE3o com dados id\xEAnticos gerou ${resT10.totalNotificacoes} notifica\xE7\xF5es (Anti-duplicidade 100% ativa)`
  });
  console.log(">>> Executando TESTE 11 (Exclus\xE3o de recado silenciosa)...");
  const recado1 = { id: `rec_${runId}`, titulo: "Recado Teste", ativo: "SIM" };
  detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT4,
    recadosAtuais: [recado1],
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });
  const resT11 = detectarAlteracoesNaPlanilha({
    escalaAtual: escalaT4,
    recadosAtuais: [],
    integrantes: integrantesMock,
    origem: "GOOGLE_SHEETS"
  });
  const t11Passou = resT11.totalNotificacoes === 0 && !resT11.eventosDetectados.some((e) => e.includes("EXCLUIR"));
  resultados.push({
    teste: "TESTE 11",
    descricao: "Exclus\xE3o de recado n\xE3o gera notifica\xE7\xE3o (comportamento silencioso)",
    passou: t11Passou,
    detalhes: `Notifica\xE7\xF5es na exclus\xE3o: ${resT11.totalNotificacoes} (Esperado: 0)`
  });
  console.log(">>> Executando TESTE 12 (Preserva\xE7\xE3o de UUID \xFAnico)...");
  const evtIdUnico = `EVENTO_UNICO_TESTE_${runId}`;
  const notif1 = criarNotificacaoSeNaoExiste({
    destinatario: "Jadson",
    tipo: "CULTO",
    titulo: "Teste UUID 1",
    mensagem: "Msg 1",
    eventoId: evtIdUnico
  });
  const notif2 = criarNotificacaoSeNaoExiste({
    destinatario: "Jadson",
    tipo: "CULTO",
    titulo: "Teste UUID 2",
    mensagem: "Msg 2",
    eventoId: evtIdUnico
  });
  const todasNotifs = getNotificacoesParaUsuario("Jadson");
  const matchingEvt = todasNotifs.filter((n) => n.eventoId === evtIdUnico);
  const t12Passou = notif1 !== null && notif2 === null && matchingEvt.length === 1;
  resultados.push({
    teste: "TESTE 12",
    descricao: "Preserva\xE7\xE3o de UUID \xFAnico e rejei\xE7\xE3o de duplicatas por eventoId",
    passou: t12Passou,
    detalhes: `Primeira inser\xE7\xE3o: ${notif1 ? "Criada" : "Erro"} | Segunda: ${notif2 ? "Duplicou (Erro)" : "Bloqueada com Sucesso"} | Total com eventoId: ${matchingEvt.length}`
  });
  const sucessoGeral = resultados.every((r) => r.passou);
  console.log("\n=======================================================");
  console.log(`RESULTADO GERAL DOS TESTES: ${sucessoGeral ? "\u2705 TODOS PASSARAM" : "\u274C FALHAS ENCONTRADAS"}`);
  console.log("=======================================================\n");
  return { sucessoGeral, resultados };
}

// src/server/youtube.ts
function extractPlaylistId(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{10,64}$/.test(trimmed) && !trimmed.includes(".") && !trimmed.includes("/")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const listParam = parsed.searchParams.get("list");
    if (listParam && listParam.trim().length > 0) {
      return listParam.trim();
    }
  } catch (e) {
  }
  const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}
async function fetchYouTubePlaylist(playlistId, apiKey) {
  const cleanId = (playlistId || "").trim();
  if (!cleanId) {
    return {
      success: false,
      statusCode: 400,
      errorMessage: "O link informado n\xE3o parece ser uma playlist v\xE1lida do YouTube."
    };
  }
  const key = apiKey || process.env.YOUTUBE_API_KEY || "";
  if (!key) {
    console.warn("[YouTube API] Vari\xE1vel de ambiente YOUTUBE_API_KEY n\xE3o configurada no backend.");
    return {
      success: false,
      statusCode: 503,
      errorMessage: "N\xE3o foi poss\xEDvel importar a playlist no momento. Tente novamente."
    };
  }
  try {
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${encodeURIComponent(
      cleanId
    )}&key=${encodeURIComponent(key)}`;
    const playlistRes = await fetch(playlistUrl, {
      method: "GET",
      headers: { Accept: "application/json" }
    });
    if (!playlistRes.ok) {
      const errText = await playlistRes.text().catch(() => "");
      console.error(`[YouTube API] Erro ao buscar playlist (${playlistRes.status}):`, errText);
      if (playlistRes.status === 404) {
        return {
          success: false,
          statusCode: 404,
          errorMessage: "N\xE3o foi poss\xEDvel encontrar essa playlist. Verifique o link e tente novamente."
        };
      }
      return {
        success: false,
        statusCode: 502,
        errorMessage: "N\xE3o foi poss\xEDvel importar a playlist no momento. Tente novamente."
      };
    }
    const playlistJson = await playlistRes.json();
    if (!playlistJson.items || playlistJson.items.length === 0) {
      return {
        success: false,
        statusCode: 404,
        errorMessage: "N\xE3o foi poss\xEDvel encontrar essa playlist. Verifique o link e tente novamente."
      };
    }
    const playlistSnippet = playlistJson.items[0].snippet || {};
    const playlistTitle = playlistSnippet.title || "Playlist do YouTube";
    const playlistThumbnail = playlistSnippet.thumbnails?.high?.url || playlistSnippet.thumbnails?.medium?.url || playlistSnippet.thumbnails?.default?.url || "";
    let allItems = [];
    let nextPageToken = void 0;
    let pageCount = 0;
    const maxPages = 10;
    do {
      pageCount++;
      let itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${encodeURIComponent(
        cleanId
      )}&key=${encodeURIComponent(key)}`;
      if (nextPageToken) {
        itemsUrl += `&pageToken=${encodeURIComponent(nextPageToken)}`;
      }
      const itemsRes = await fetch(itemsUrl, {
        method: "GET",
        headers: { Accept: "application/json" }
      });
      if (!itemsRes.ok) {
        const errText = await itemsRes.text().catch(() => "");
        console.error(`[YouTube API] Erro ao buscar itens da p\xE1gina ${pageCount} (${itemsRes.status}):`, errText);
        break;
      }
      const itemsJson = await itemsRes.json();
      const rawItems = itemsJson.items || [];
      for (const item of rawItems) {
        const snippet = item.snippet || {};
        const contentDetails = item.contentDetails || {};
        const videoId = snippet.resourceId?.videoId || contentDetails.videoId || "";
        const rawTitle = (snippet.title || "").trim();
        const isUnavailable = !videoId || rawTitle === "Private video" || rawTitle === "Deleted video" || rawTitle === "V\xEDdeo privado" || rawTitle === "V\xEDdeo exclu\xEDdo";
        const position = typeof snippet.position === "number" ? snippet.position + 1 : allItems.length + 1;
        const thumbnail = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "");
        allItems.push({
          videoId,
          title: isUnavailable ? "V\xEDdeo indispon\xEDvel" : rawTitle || "Louvor sem t\xEDtulo",
          youtubeUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
          thumbnailUrl: thumbnail,
          position,
          playlistId: cleanId,
          isAvailable: !isUnavailable,
          unavailableReason: isUnavailable ? "V\xEDdeo privado ou removido no YouTube" : void 0
        });
      }
      nextPageToken = itemsJson.nextPageToken;
    } while (nextPageToken && pageCount < maxPages);
    return {
      success: true,
      data: {
        playlistId: cleanId,
        playlistTitle,
        itemCount: allItems.length,
        thumbnailUrl: playlistThumbnail,
        items: allItems
      }
    };
  } catch (err) {
    console.error("[YouTube API] Exce\xE7\xE3o inesperada:", err);
    return {
      success: false,
      statusCode: 500,
      errorMessage: "N\xE3o foi poss\xEDvel importar a playlist no momento. Tente novamente."
    };
  }
}

// src/server/app.ts
var GAS_API_URL = process.env.GAS_API_URL || "https://script.google.com/macros/s/AKfycbyK1dC5cjUtK0YZRN2FFp2wGuJpiLHU_g4rajI-SkMv2gDsbrKt2XgptQg_olu2tcs/exec";
setGasApiUrlForNotifications(GAS_API_URL);
var DATA_DIR2 = import_path2.default.join(process.cwd(), "data");
var LINK_LOUVORES_FILE = import_path2.default.join(DATA_DIR2, "link_louvores.json");
var cachedLinkLouvores = [];
function cleanDateString(dateStr) {
  if (!dateStr) return "";
  const str = String(dateStr).trim();
  if (!str) return "";
  if (str.includes("-")) {
    const isoParts = str.split("T")[0].split("-");
    if (isoParts.length === 3 && isoParts[0].length === 4) {
      const year = isoParts[0];
      const month = String(parseInt(isoParts[1], 10) || 0).padStart(2, "0");
      const day = String(parseInt(isoParts[2], 10) || 0).padStart(2, "0");
      return `${day}/${month}/${year}`;
    }
  }
  if (str.includes("/")) {
    const cleanOnly = str.replace(/[^0-9/]/g, "");
    const parts = cleanOnly.split("/");
    if (parts.length === 3) {
      const day = String(parseInt(parts[0], 10) || 0).padStart(2, "0");
      const month = String(parseInt(parts[1], 10) || 0).padStart(2, "0");
      let year = parts[2];
      if (year.length === 2) year = `20${year}`;
      return `${day}/${month}/${year}`;
    }
  }
  return str.replace(/[^0-9/]/g, "");
}
function loadCachedLinkLouvores() {
  try {
    if (!process.env.VERCEL && !import_fs2.default.existsSync(DATA_DIR2)) {
      import_fs2.default.mkdirSync(DATA_DIR2, { recursive: true });
    }
    if (import_fs2.default.existsSync(LINK_LOUVORES_FILE)) {
      const raw = import_fs2.default.readFileSync(LINK_LOUVORES_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cachedLinkLouvores = parsed.map((item) => ({
          ...item,
          data: cleanDateString(item.data || item.dataEscala),
          dataEscala: cleanDateString(item.data || item.dataEscala)
        }));
      }
    }
  } catch (e) {
    cachedLinkLouvores = [];
  }
}
function saveCachedLinkLouvores() {
  if (process.env.VERCEL) return;
  try {
    if (!import_fs2.default.existsSync(DATA_DIR2)) {
      import_fs2.default.mkdirSync(DATA_DIR2, { recursive: true });
    }
    import_fs2.default.writeFileSync(LINK_LOUVORES_FILE, JSON.stringify(cachedLinkLouvores, null, 2), "utf-8");
  } catch (e) {
  }
}
loadCachedLinkLouvores();
function extractYouTubeVideoId(urlOrId) {
  if (!urlOrId) return "";
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const fullUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
    const parsed = new URL(fullUrl);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtu.be")) {
      const id = parsed.pathname.replace(/^\//, "").split(/[\/\?\#]/)[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    if (parsed.pathname.startsWith("/watch")) {
      const v = parsed.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    }
    if (parsed.pathname.startsWith("/shorts/") || parsed.pathname.startsWith("/embed/") || parsed.pathname.startsWith("/v/")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const id = parts[1]?.split(/[\/\?\#]/)[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
  } catch (e) {
  }
  const match = trimmed.match(/(?:v=|youtu\.be\/|\/v\/|\/embed\/|\/shorts\/)([\w-]{11})/i);
  return match && match[1] && /^[a-zA-Z0-9_-]{11}$/.test(match[1]) ? match[1] : "";
}
function normalizeYouTubeUrl(urlOrId) {
  if (!urlOrId) return "";
  const videoId = extractYouTubeVideoId(urlOrId);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return urlOrId.trim();
}
function cleanLouvoresText(raw) {
  if (!raw) return "";
  return raw.split("\n").map((line) => {
    let l = line.trim();
    if (!l) return null;
    l = l.replace(/(https?:\/\/[^\s\)\],]+|(?:www\.|m\.|music\.)?youtube\.com\/[^\s\)\],]+|youtu\.be\/[^\s\)\],]+)/gi, "").replace(/\(\s*\)/g, "").replace(/\[\s*\]/g, "").replace(/[\|\(\)\[\]\-]+$/, "").trim();
    return l || null;
  }).filter(Boolean).join("\n");
}
function extractStructuredLouvores(raw, dataEscala) {
  if (!raw) return [];
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.map((line, idx) => {
    let l = line.replace(/^(\(\d+\)|\d+[\.\-\)])\s*/i, "").trim();
    let url = "";
    const ytMatch = l.match(/(https?:\/\/[^\s\)\],]+|(?:www\.|m\.|music\.)?youtube\.com\/[^\s\)\],]+|youtu\.be\/[^\s\)\],]+)/i);
    if (ytMatch) {
      url = ytMatch[0];
      l = l.replace(url, "").replace(/\(\s*\)/g, "").replace(/\[\s*\]/g, "").replace(/[\|\(\)\[\]\-]+$/, "").trim();
    }
    const finalName = l || line;
    const videoId = extractYouTubeVideoId(url);
    const finalUrl = normalizeYouTubeUrl(url) || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : "");
    return {
      id: `louvor-${dataEscala.replace(/[^0-9]/g, "")}-${idx}`,
      data: dataEscala,
      dataEscala,
      ordem: idx + 1,
      louvor: finalName,
      titulo: finalName,
      youtubeVideoId: videoId,
      youtubeUrl: finalUrl,
      linkYoutube: finalUrl,
      link_youtube: finalUrl,
      playlistId: "",
      playlistTitle: "",
      thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ""
    };
  });
}
var SESSION_SECRET = process.env.SESSION_SECRET || "escala-louvor-2k26-secret-token-sign-key-production-v2";
var activeSessions = /* @__PURE__ */ new Map();
var cachedEscalas = [];
var cachedIntegrantes = [];
var backgroundTimerStarted = false;
async function syncEscalaDataBackground(origem = "GOOGLE_SHEETS") {
  try {
    const gasResponse = await fetch(`${GAS_API_URL}?action=getEscalaData`, {
      method: "GET",
      headers: { Accept: "application/json" }
    });
    if (gasResponse.ok) {
      const data = await gasResponse.json();
      if (data && Array.isArray(data.escala)) {
        cachedEscalas = data.escala;
      }
      if (data && Array.isArray(data.integrantes)) {
        cachedIntegrantes = data.integrantes;
      }
      if (data && (Array.isArray(data.link_louvores) || Array.isArray(data.linkLouvores))) {
        const incoming = Array.isArray(data.link_louvores) ? data.link_louvores : data.linkLouvores;
        if (incoming.length > 0) {
          cachedLinkLouvores = incoming;
          saveCachedLinkLouvores();
        }
      }
      if (cachedEscalas.length > 0) {
        detectarAlteracoesNaPlanilha({
          escalaAtual: cachedEscalas,
          solicitacoesAtuais: Array.isArray(data.solicitacoes) ? data.solicitacoes : [],
          recadosAtuais: Array.isArray(data.recados) ? data.recados : [],
          integrantes: cachedIntegrantes,
          origem
        });
      }
      processarLembretesDeCulto(cachedEscalas, cachedIntegrantes);
    }
  } catch (err) {
  }
}
function startCultoScheduler() {
  if (backgroundTimerStarted) return;
  backgroundTimerStarted = true;
  syncEscalaDataBackground();
  setInterval(() => {
    try {
      processarLembretesDeCulto(cachedEscalas, cachedIntegrantes);
    } catch (e) {
    }
  }, 3e4);
  setInterval(() => {
    syncEscalaDataBackground();
  }, 5 * 60 * 1e3);
}
function createSessionToken(sessionData) {
  try {
    const payload = JSON.stringify(sessionData);
    const iv = import_crypto2.default.randomBytes(12);
    const key = import_crypto2.default.createHash("sha256").update(SESSION_SECRET).digest();
    const cipher = import_crypto2.default.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(payload, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    const token = `${iv.toString("hex")}.${authTag}.${encrypted}`;
    activeSessions.set(token, sessionData);
    return token;
  } catch (err) {
    const fallbackToken = import_crypto2.default.randomBytes(32).toString("hex");
    activeSessions.set(fallbackToken, sessionData);
    return fallbackToken;
  }
}
function verifySessionToken(tokenStr) {
  if (!tokenStr) return null;
  if (activeSessions.has(tokenStr)) {
    const session = activeSessions.get(tokenStr);
    if (Date.now() - session.createdAt < 30 * 24 * 60 * 60 * 1e3) {
      return session;
    }
    activeSessions.delete(tokenStr);
  }
  try {
    const parts = tokenStr.split(".");
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = import_crypto2.default.createHash("sha256").update(SESSION_SECRET).digest();
    const decipher = import_crypto2.default.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    const sessionData = JSON.parse(decrypted);
    if (Date.now() - sessionData.createdAt < 30 * 24 * 60 * 60 * 1e3) {
      activeSessions.set(tokenStr, sessionData);
      return sessionData;
    }
    return null;
  } catch (err) {
    return null;
  }
}
function identificarPerfil(funcaoStr) {
  const norm = (funcaoStr || "").toLowerCase();
  if (norm.includes("lider")) return "LIDER";
  if (norm.includes("dirigente")) return "DIRIGENTE";
  return "INTEGRANTE";
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
  if (!token) {
    res.status(401).json({
      sucesso: false,
      mensagem: "Acesso n\xE3o autorizado. Fa\xE7a login para continuar."
    });
    return;
  }
  const session = verifySessionToken(token);
  if (!session) {
    res.status(401).json({
      sucesso: false,
      mensagem: "Sess\xE3o expirada ou inv\xE1lida. Por favor, autentique-se novamente."
    });
    return;
  }
  req.user = session;
  req.token = token;
  next();
}
function requireLider(req, res, next) {
  const user = req.user;
  if (!user || user.role !== "LIDER") {
    res.status(403).json({
      sucesso: false,
      mensagem: "A\xE7\xE3o restrita a l\xEDderes do minist\xE9rio de louvor."
    });
    return;
  }
  next();
}
function requireDirigenteOuLider(req, res, next) {
  const user = req.user;
  if (!user || user.role !== "LIDER" && user.role !== "DIRIGENTE") {
    res.status(403).json({
      sucesso: false,
      mensagem: "A\xE7\xE3o restrita a l\xEDderes e dirigentes do minist\xE9rio de louvor."
    });
    return;
  }
  next();
}
function createApiApp() {
  const app2 = (0, import_express.default)();
  startCultoScheduler();
  app2.use(import_express.default.json({ limit: "15mb" }));
  app2.use(import_express.default.urlencoded({ extended: true, limit: "15mb" }));
  app2.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
  app2.get("/api/health", (req, res) => {
    res.json({
      sucesso: true,
      status: "online",
      ambiente: process.env.NODE_ENV || "production",
      backend: "Google Apps Script",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { nome, senha } = req.body;
      if (!nome || typeof nome !== "string" || !nome.trim()) {
        res.status(400).json({
          sucesso: false,
          mensagem: "Nome de usu\xE1rio \xE9 obrigat\xF3rio."
        });
        return;
      }
      const cleanNome = nome.trim();
      const inputSenha = senha ? String(senha).trim() : "";
      const gasResponse = await fetch(`${GAS_API_URL}?action=getEscalaData`, {
        method: "GET",
        headers: { Accept: "application/json" }
      });
      if (!gasResponse.ok) {
        throw new Error(`Falha de comunica\xE7\xE3o com o Google Apps Script: ${gasResponse.statusText}`);
      }
      const data = await gasResponse.json();
      if (!data || !data.sucesso || !Array.isArray(data.integrantes)) {
        throw new Error("N\xE3o foi poss\xEDvel carregar os integrantes da planilha.");
      }
      const integrante = data.integrantes.find(
        (i) => (i.nome || "").trim().toLowerCase() === cleanNome.toLowerCase()
      );
      if (!integrante) {
        res.status(404).json({
          sucesso: false,
          mensagem: `Integrante "${cleanNome}" n\xE3o foi encontrado na base de membros.`
        });
        return;
      }
      const memberSenha = (integrante.senha || "").toString().trim();
      if (memberSenha) {
        if (!inputSenha) {
          res.status(401).json({
            sucesso: false,
            mensagem: "Este usu\xE1rio possui senha cadastrada. Por favor, informe sua senha."
          });
          return;
        }
        if (memberSenha !== inputSenha) {
          res.status(401).json({
            sucesso: false,
            mensagem: "Senha incorreta. Verifique os dados digitados."
          });
          return;
        }
      }
      const role = identificarPerfil(integrante.funcao);
      const sessionData = {
        nome: integrante.nome,
        funcao: integrante.funcao || "",
        instrumento: integrante.instrumento || "",
        role,
        rawPassword: memberSenha,
        createdAt: Date.now()
      };
      const sessionToken = createSessionToken(sessionData);
      res.json({
        sucesso: true,
        mensagem: "Login realizado com sucesso.",
        token: sessionToken,
        user: {
          nome: sessionData.nome,
          funcao: sessionData.funcao,
          instrumento: sessionData.instrumento,
          role: sessionData.role
        }
      });
    } catch (error) {
      console.error("Erro na autentica\xE7\xE3o:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao processar login com o Google Apps Script."
      });
    }
  });
  app2.get("/api/auth/me", authenticateToken, (req, res) => {
    const user = req.user;
    res.json({
      sucesso: true,
      user: {
        nome: user.nome,
        funcao: user.funcao,
        instrumento: user.instrumento,
        role: user.role
      }
    });
  });
  app2.post("/api/auth/logout", authenticateToken, (req, res) => {
    const token = req.token;
    if (token) {
      activeSessions.delete(token);
    }
    res.json({
      sucesso: true,
      mensagem: "Sess\xE3o finalizada com sucesso."
    });
  });
  app2.post("/api/notifications/subscribe", authenticateToken, async (req, res) => {
    const user = req.user;
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ sucesso: false, mensagem: "Token \xE9 obrigat\xF3rio." });
      return;
    }
    await subscribeUserToFcm(user.nome, token);
    res.json({ sucesso: true, mensagem: "Token registrado com sucesso." });
  });
  app2.post("/api/notifications/unsubscribe", authenticateToken, async (req, res) => {
    const user = req.user;
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ sucesso: false, mensagem: "Token \xE9 obrigat\xF3rio." });
      return;
    }
    const sucesso = await unsubscribeUserFromFcm(user.nome, token);
    res.json({ sucesso, mensagem: sucesso ? "Token removido com sucesso." : "Token n\xE3o encontrado." });
  });
  app2.post("/api/notifications/test-fcm", authenticateToken, async (req, res) => {
    const user = req.user;
    const tokens = await getFcmTokensForUser(user.nome);
    if (tokens.length === 0) {
      res.json({
        success: true,
        sent: 0,
        failed: 0,
        message: "Nenhum token FCM registrado ou ativo para o usu\xE1rio no momento."
      });
      return;
    }
    const adminApp2 = getFirebaseAdminApp();
    if (!adminApp2) {
      res.status(503).json({
        success: false,
        sent: 0,
        failed: tokens.length,
        message: "Firebase Admin SDK n\xE3o inicializado no servidor (credenciais ausentes)."
      });
      return;
    }
    const messaging = (0, import_messaging2.getMessaging)(adminApp2);
    const notificationId = import_crypto2.default.randomUUID();
    let sent = 0;
    let failed = 0;
    for (const token of tokens) {
      try {
        await messaging.send({
          token,
          notification: {
            title: "EscalaLouvor \u2014 Teste FCM",
            body: "Se voc\xEA recebeu esta notifica\xE7\xE3o, o Firebase Cloud Messaging est\xE1 funcionando!"
          },
          data: {
            id: notificationId,
            url: "/notificacoes",
            type: "TEST_NOTIFICATION"
          },
          webpush: {
            fcmOptions: {
              link: "/notificacoes"
            },
            notification: {
              icon: "/icon-192.png",
              badge: "/icon-192.png",
              tag: notificationId,
              requireInteraction: false
            }
          }
        });
        sent++;
      } catch (error) {
        console.error(`Falha ao enviar FCM para token ${token.substring(0, 6)}...:`, error?.message);
        if (error.code === "messaging/registration-token-not-registered" || error.code === "messaging/invalid-registration-token") {
          await unsubscribeUserFromFcm(user.nome, token);
        }
        failed++;
      }
    }
    res.json({ success: true, sent, failed, notificationId });
  });
  const handleFetchYouTubePlaylist = async (req, res) => {
    try {
      const urlOrId = (req.body?.url || req.body?.playlistId || req.query?.url || req.query?.playlistId || "").toString().trim();
      if (!urlOrId) {
        res.status(400).json({
          sucesso: false,
          mensagem: "O link ou ID da playlist do YouTube \xE9 obrigat\xF3rio."
        });
        return;
      }
      const playlistId = extractPlaylistId(urlOrId);
      if (!playlistId) {
        res.status(400).json({
          sucesso: false,
          mensagem: "O link informado n\xE3o parece ser uma playlist v\xE1lida do YouTube."
        });
        return;
      }
      const result = await fetchYouTubePlaylist(playlistId);
      if (!result.success || !result.data) {
        res.status(result.statusCode || 500).json({
          sucesso: false,
          mensagem: result.errorMessage || "N\xE3o foi poss\xEDvel importar a playlist no momento. Tente novamente."
        });
        return;
      }
      res.json({
        sucesso: true,
        dados: result.data,
        data: result.data
      });
    } catch (err) {
      console.error("[Backend] Erro na rota /api/youtube/playlist:", err);
      res.status(500).json({
        sucesso: false,
        mensagem: "N\xE3o foi poss\xEDvel importar a playlist no momento. Tente novamente."
      });
    }
  };
  app2.post("/api/youtube/playlist", authenticateToken, handleFetchYouTubePlaylist);
  app2.get("/api/youtube/playlist", authenticateToken, handleFetchYouTubePlaylist);
  app2.get("/api/escala", async (req, res) => {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
      let userQuery = "";
      if (token) {
        const session = verifySessionToken(token);
        if (session) {
          userQuery = `&nome=${encodeURIComponent(session.nome)}&senha=${encodeURIComponent(session.rawPassword || "")}`;
        }
      }
      const gasResponse = await fetch(`${GAS_API_URL}?action=getEscalaData${userQuery}`, {
        method: "GET",
        headers: { Accept: "application/json" }
      });
      if (!gasResponse.ok) {
        throw new Error(`Erro na resposta do Google Apps Script: ${gasResponse.statusText}`);
      }
      const data = await gasResponse.json();
      if (data && Array.isArray(data.integrantes)) {
        data.integrantes = data.integrantes.map((item) => {
          const { senha, ...safeItem } = item;
          return safeItem;
        });
      }
      if (data && Array.isArray(data.solicitacoes)) {
        data.solicitacoes = data.solicitacoes.map((s, index) => {
          const dataEscala = s.data_escala || s.dataEscala || s.data || "";
          const quemPediu = s.quem_pediu || s.quemPediu || s.nome || "";
          const substituto = s.substituto || "";
          return {
            id: s.id || `sol-${dataEscala.replace(/[^0-9]/g, "")}-${quemPediu}-${substituto}-${index}`,
            dataEscala,
            quemPediu,
            funcao: s.funcao || "",
            instrumento: s.instrumento || "",
            substituto,
            motivo: s.motivo || "",
            status: (s.status || "PENDENTE").toUpperCase(),
            dataCriacao: s.data_criacao || s.dataCriacao || "",
            dataDecisao: s.data_decisao || s.dataDecisao || "",
            decididoPor: s.decidido_por || s.decididoPor || "",
            motivoDecisao: s.motivo_decisao || s.motivoDecisao || ""
          };
        });
      } else if (data) {
        data.solicitacoes = [];
      }
      if (data && Array.isArray(data.escala)) {
        data.escala = data.escala.map((esc) => ({
          ...esc,
          data: cleanDateString(esc.data || esc.dataEscala || esc.dataCulto)
        }));
      }
      const incomingLinks = Array.isArray(data?.link_louvores) && data.link_louvores.length > 0 ? data.link_louvores : Array.isArray(data?.linkLouvores) && data.linkLouvores.length > 0 ? data.linkLouvores : [];
      if (incomingLinks.length > 0) {
        let normalizedIncoming = incomingLinks.map((it, idx) => {
          const rawDt = (it.dataEscala || it.data || "").toString().trim();
          const dt = cleanDateString(rawDt);
          const ytVideoId = (it.youtubeVideoId || it.videoId || it.video_id || "").toString().trim();
          let ytUrl = (it.youtubeUrl || it.linkYoutube || it.link_youtube || it.url || "").toString().trim();
          if (!ytUrl && ytVideoId) {
            ytUrl = `https://www.youtube.com/watch?v=${ytVideoId}`;
          }
          const extractedId = ytVideoId || extractYouTubeVideoId(ytUrl) || "";
          if (!ytUrl && extractedId) {
            ytUrl = `https://www.youtube.com/watch?v=${extractedId}`;
          }
          const title = cleanLouvoresText(it.titulo || it.louvor || it.nome || "");
          return {
            id: it.id || `link-${dt.replace(/[^0-9]/g, "")}-${idx}`,
            data: dt,
            dataEscala: dt,
            ordem: it.ordem !== void 0 ? it.ordem : idx + 1,
            louvor: title,
            titulo: title,
            youtubeVideoId: extractedId,
            videoId: extractedId,
            youtubeUrl: ytUrl,
            linkYoutube: ytUrl,
            link_youtube: ytUrl,
            url: ytUrl,
            playlistId: (it.playlistId || "").toString().trim(),
            playlistTitle: (it.playlistTitle || "").toString().trim(),
            thumbnailUrl: it.thumbnailUrl || (extractedId ? `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg` : "")
          };
        });
        normalizedIncoming = normalizedIncoming.map((n) => {
          if (!n.youtubeUrl) {
            const existing = cachedLinkLouvores.find(
              (c) => cleanDateString(c.data || c.dataEscala) === cleanDateString(n.data) && c.louvor.toLowerCase().trim() === n.louvor.toLowerCase().trim() && c.youtubeUrl
            );
            if (existing) {
              return {
                ...n,
                youtubeUrl: existing.youtubeUrl,
                linkYoutube: existing.youtubeUrl,
                link_youtube: existing.youtubeUrl,
                youtubeVideoId: existing.youtubeVideoId,
                videoId: existing.youtubeVideoId,
                thumbnailUrl: existing.thumbnailUrl
              };
            }
          }
          return n;
        });
        const incomingDates = new Set(
          normalizedIncoming.map((n) => cleanDateString(n.data)).filter(Boolean)
        );
        cachedLinkLouvores = [
          ...cachedLinkLouvores.filter(
            (cl) => !incomingDates.has(cleanDateString(cl.data || cl.dataEscala))
          ),
          ...normalizedIncoming
        ];
        saveCachedLinkLouvores();
      }
      if (data) {
        data.linkLouvores = cachedLinkLouvores;
        data.link_louvores = cachedLinkLouvores;
      }
      if (data && Array.isArray(data.recados)) {
        data.recados = data.recados.map((r, index) => {
          const id = r.id || `recado-${index}`;
          const titulo = (r.titulo || r.title || "").toString().trim();
          const mensagem = (r.mensagem || r.message || "").toString().trim();
          const imagemRaw = r.imagem_url || r.imagemUrl || r.imagem || r.url_imagem || r.imageUrl || "";
          const imagemUrl = typeof imagemRaw === "string" ? imagemRaw.trim() : "";
          const ativo = (r.ativo || "SIM").toString().trim().toUpperCase();
          const dataCriacao = (r.data_criacao || r.dataCriacao || "").toString().trim();
          const dataAtualizacao = (r.data_atualizacao || r.dataAtualizacao || "").toString().trim();
          return {
            id,
            titulo,
            mensagem,
            imagemUrl,
            ativo,
            dataCriacao,
            dataAtualizacao
          };
        });
      } else if (data) {
        data.recados = [];
      }
      if (data && Array.isArray(data.escala)) {
        cachedEscalas = data.escala;
      }
      if (data && Array.isArray(data.integrantes)) {
        cachedIntegrantes = data.integrantes;
      }
      if (cachedEscalas.length > 0) {
        detectarAlteracoesNaPlanilha({
          escalaAtual: cachedEscalas,
          solicitacoesAtuais: Array.isArray(data.solicitacoes) ? data.solicitacoes : [],
          recadosAtuais: Array.isArray(data.recados) ? data.recados : [],
          integrantes: cachedIntegrantes,
          origem: "GOOGLE_SHEETS"
        });
      }
      processarLembretesDeCulto(cachedEscalas, cachedIntegrantes);
      res.json(data);
    } catch (error) {
      console.error("Erro ao buscar dados da escala:", error);
      res.status(502).json({
        sucesso: false,
        mensagem: "N\xE3o foi poss\xEDvel conectar ao Google Apps Script para obter as escalas.",
        escala: [],
        integrantes: [],
        solicitacoes: [],
        recados: [],
        linkLouvores: []
      });
    }
  });
  app2.post("/api/webhook/sheets-change", async (req, res) => {
    try {
      const { aba, linha, data: dataLinha, origem = "GOOGLE_SHEETS" } = req.body || {};
      console.log(`[CHANGE-DETECTOR] Webhook recebido de altera\xE7\xE3o na planilha. Aba: ${aba || "TODAS"}, Linha: ${linha || "N/A"}, Origem: ${origem}`);
      await syncEscalaDataBackground(origem);
      res.json({
        sucesso: true,
        mensagem: "Altera\xE7\xE3o da planilha processada com sucesso pelo detector de eventos.",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      console.error("Erro no webhook de altera\xE7\xE3o da planilha:", err);
      res.status(500).json({
        sucesso: false,
        mensagem: err.message || "Erro ao processar webhook de altera\xE7\xE3o."
      });
    }
  });
  app2.get("/api/escala/snapshot", authenticateToken, (req, res) => {
    const snapshot = getSheetsSnapshot();
    res.json({
      sucesso: true,
      snapshot
    });
  });
  app2.post("/api/escala/detectar-alteracoes", authenticateToken, async (req, res) => {
    try {
      await syncEscalaDataBackground("GOOGLE_SHEETS");
      res.json({
        sucesso: true,
        mensagem: "Verifica\xE7\xE3o de altera\xE7\xF5es no Google Sheets conclu\xEDda com sucesso."
      });
    } catch (err) {
      res.status(500).json({
        sucesso: false,
        mensagem: err.message || "Erro ao verificar altera\xE7\xF5es."
      });
    }
  });
  const handleTestarDetector = (req, res) => {
    try {
      const resultado = executarBateriaDeTestesDetector();
      res.json({
        sucesso: resultado.sucessoGeral,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        resultados: resultado.resultados
      });
    } catch (err) {
      console.error("Erro ao executar bateria de testes:", err);
      res.status(500).json({
        sucesso: false,
        mensagem: err.message || "Erro ao executar testes do detector."
      });
    }
  };
  app2.get("/api/admin/testar-detector-alteracoes", handleTestarDetector);
  app2.post("/api/admin/testar-detector-alteracoes", handleTestarDetector);
  app2.post("/api/escala/notificar-nova-escala", authenticateToken, requireLider, async (req, res) => {
    try {
      const { mes } = req.body;
      if (cachedIntegrantes.length === 0) {
        await syncEscalaDataBackground();
      }
      const result = processarNotificacaoNovaEscala(mes, cachedIntegrantes);
      if (!result.sucesso && result.jaEnviada) {
        res.status(409).json({
          sucesso: false,
          jaEnviada: true,
          mensagem: result.mensagem
        });
        return;
      }
      res.json({
        sucesso: true,
        mensagem: result.mensagem,
        totalEnviadas: result.totalEnviadas
      });
    } catch (error) {
      console.error("Erro ao notificar nova escala:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao processar notifica\xE7\xE3o de nova escala."
      });
    }
  });
  const handleUpdateCampoEscala = async (req, res) => {
    try {
      const user = req.user;
      const { dataEscala, data, dataCulto, campo, valor, louvores, uniforme, linkLouvores } = req.body || {};
      const rawTargetData = (dataEscala || data || dataCulto || "").toString().trim();
      const targetData = cleanDateString(rawTargetData);
      if (!targetData) {
        res.status(400).json({ sucesso: false, mensagem: "Data da escala \xE9 obrigat\xF3ria." });
        return;
      }
      let finalValor = (valor !== void 0 ? String(valor) : "").trim();
      let structuredLinks = [];
      if (campo === "louvores" || louvores !== void 0) {
        const rawLouv = campo === "louvores" ? finalValor : String(louvores).trim();
        finalValor = cleanLouvoresText(rawLouv);
        if (Array.isArray(linkLouvores) && linkLouvores.length > 0) {
          structuredLinks = linkLouvores.map((it, idx) => {
            const ytVideoId = (it.youtubeVideoId || it.videoId || it.video_id || "").toString().trim();
            let ytUrl = (it.youtubeUrl || it.linkYoutube || it.link_youtube || it.url || "").toString().trim();
            if (!ytUrl && ytVideoId) {
              ytUrl = `https://www.youtube.com/watch?v=${ytVideoId}`;
            }
            const extractedId = ytVideoId || extractYouTubeVideoId(ytUrl) || "";
            if (!ytUrl && extractedId) {
              ytUrl = `https://www.youtube.com/watch?v=${extractedId}`;
            }
            const title = cleanLouvoresText(it.titulo || it.louvor || it.nome || "");
            return {
              id: it.id || `link-${targetData.replace(/[^0-9]/g, "")}-${idx}`,
              data: targetData,
              dataEscala: targetData,
              ordem: it.ordem !== void 0 ? it.ordem : idx + 1,
              louvor: title,
              titulo: title,
              youtubeVideoId: extractedId,
              videoId: extractedId,
              youtubeUrl: ytUrl,
              linkYoutube: ytUrl,
              link_youtube: ytUrl,
              url: ytUrl,
              playlistId: (it.playlistId || "").toString().trim(),
              playlistTitle: (it.playlistTitle || "").toString().trim(),
              thumbnailUrl: it.thumbnailUrl || (extractedId ? `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg` : "")
            };
          });
        } else {
          structuredLinks = extractStructuredLouvores(rawLouv, targetData);
        }
        console.log(`[YT SERVER DEBUG] Campo louvores atualizado para data ${targetData} | Total links: ${structuredLinks.length}`);
        if (Array.isArray(linkLouvores) || structuredLinks.length > 0) {
          cachedLinkLouvores = cachedLinkLouvores.filter(
            (l) => cleanDateString(l.data || l.dataEscala) !== targetData
          );
          if (structuredLinks.length > 0) {
            cachedLinkLouvores.push(...structuredLinks);
          }
          saveCachedLinkLouvores();
          fetch(GAS_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json"
            },
            body: new URLSearchParams({
              action: "salvarLinkLouvores",
              dataEscala: targetData,
              data: targetData,
              louvores: JSON.stringify(structuredLinks),
              louvores_detalhes: JSON.stringify(structuredLinks),
              link_louvores: JSON.stringify(structuredLinks),
              linkLouvores: JSON.stringify(structuredLinks),
              louvoresTexto: finalValor
            }).toString()
          }).catch((err) => {
            console.error(`[YT SERVER DEBUG] Erro ao sincronizar LINK_LOUVORES com GAS:`, err);
          });
        }
      }
      const form = new URLSearchParams({
        action: "updateEscala",
        nome: user.nome.trim(),
        senha: user.rawPassword || "",
        dataEscala: targetData,
        data: targetData,
        dataCulto: targetData,
        campo: (campo || "").toString().trim(),
        valor: finalValor,
        louvores_detalhes: JSON.stringify(structuredLinks),
        link_louvores: JSON.stringify(structuredLinks),
        linkLouvores: JSON.stringify(structuredLinks)
      });
      if (louvores !== void 0 && campo !== "louvores") {
        form.append("louvores", cleanLouvoresText(String(louvores)));
      }
      if (uniforme !== void 0 && campo !== "uniforme") {
        form.append("uniforme", String(uniforme).trim());
      }
      const gasResponse = await fetch(GAS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        body: form.toString()
      });
      if (!gasResponse.ok) {
        throw new Error(`Erro na resposta do Google Apps Script: ${gasResponse.statusText}`);
      }
      const result = await gasResponse.json();
      if (campo === "louvores" || campo === "uniforme" || louvores !== void 0 || uniforme !== void 0) {
        if (cachedIntegrantes.length === 0) {
          await syncEscalaDataBackground();
        }
        const escalaObj = cachedEscalas.find((e) => e.data.trim().replace(/[^0-9/]/g, "") === targetData.replace(/[^0-9/]/g, ""));
        if (escalaObj) {
          const targetLouvores = campo === "louvores" ? finalValor : louvores ? cleanLouvoresText(String(louvores)) : escalaObj.louvores;
          const targetUniforme = campo === "uniforme" ? finalValor : uniforme || escalaObj.uniforme;
          processarNotificacaoLouvoresUniformes({
            dataEscala: targetData,
            louvores: targetLouvores,
            uniforme: targetUniforme,
            escala: escalaObj,
            integrantes: cachedIntegrantes
          });
        }
      }
      syncEscalaDataBackground();
      res.json(result);
    } catch (error) {
      console.error("Erro ao atualizar campo da escala:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao atualizar escala no Google Apps Script."
      });
    }
  };
  app2.put("/api/escala/campo", authenticateToken, requireDirigenteOuLider, handleUpdateCampoEscala);
  app2.post("/api/escala/campo", authenticateToken, requireDirigenteOuLider, handleUpdateCampoEscala);
  const handleUpdateEscalaCompleta = async (req, res) => {
    try {
      const user = req.user;
      const { dataEscala, data, dataCulto, dirigente, vocal, musicos, mesario, louvores, uniforme, linkLouvores } = req.body || {};
      const rawTargetData = (dataEscala || data || dataCulto || "").toString().trim();
      const targetData = cleanDateString(rawTargetData);
      if (!targetData) {
        res.status(400).json({ sucesso: false, mensagem: "Data da escala \xE9 obrigat\xF3ria." });
        return;
      }
      const cleanLouvoresVal = louvores !== void 0 ? cleanLouvoresText(String(louvores)) : void 0;
      const escalaExistente = cachedEscalas.find(
        (e) => cleanDateString(e.data) === targetData
      );
      const membrosAntigos = escalaExistente ? extrairMembrosDaEscala(escalaExistente) : [];
      let structuredLinks = [];
      if (Array.isArray(linkLouvores) && linkLouvores.length > 0) {
        structuredLinks = linkLouvores.map((it, idx) => {
          const ytVideoId = (it.youtubeVideoId || it.videoId || it.video_id || "").toString().trim();
          let ytUrl = (it.youtubeUrl || it.linkYoutube || it.link_youtube || it.url || "").toString().trim();
          if (!ytUrl && ytVideoId) {
            ytUrl = `https://www.youtube.com/watch?v=${ytVideoId}`;
          }
          const extractedId = ytVideoId || extractYouTubeVideoId(ytUrl) || "";
          if (!ytUrl && extractedId) {
            ytUrl = `https://www.youtube.com/watch?v=${extractedId}`;
          }
          const title = cleanLouvoresText(it.titulo || it.louvor || it.nome || "");
          return {
            id: it.id || `link-${targetData.replace(/[^0-9]/g, "")}-${idx}`,
            data: targetData,
            dataEscala: targetData,
            ordem: it.ordem !== void 0 ? it.ordem : idx + 1,
            louvor: title,
            titulo: title,
            youtubeVideoId: extractedId,
            videoId: extractedId,
            youtubeUrl: ytUrl,
            linkYoutube: ytUrl,
            link_youtube: ytUrl,
            url: ytUrl,
            playlistId: (it.playlistId || "").toString().trim(),
            playlistTitle: (it.playlistTitle || "").toString().trim(),
            thumbnailUrl: it.thumbnailUrl || (extractedId ? `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg` : "")
          };
        });
      } else if (louvores !== void 0) {
        structuredLinks = extractStructuredLouvores(String(louvores), targetData);
      }
      console.log(`[YT SERVER DEBUG] Escala completa recebida para data ${targetData} | Total links recebidos: ${structuredLinks.length}`);
      if (Array.isArray(linkLouvores) || structuredLinks.length > 0) {
        cachedLinkLouvores = cachedLinkLouvores.filter(
          (l) => cleanDateString(l.data || l.dataEscala) !== targetData
        );
        if (structuredLinks.length > 0) {
          cachedLinkLouvores.push(...structuredLinks);
        }
        saveCachedLinkLouvores();
        fetch(GAS_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json"
          },
          body: new URLSearchParams({
            action: "salvarLinkLouvores",
            dataEscala: targetData,
            data: targetData,
            louvores: JSON.stringify(structuredLinks),
            louvores_detalhes: JSON.stringify(structuredLinks),
            link_louvores: JSON.stringify(structuredLinks),
            linkLouvores: JSON.stringify(structuredLinks),
            louvoresTexto: cleanLouvoresVal || ""
          }).toString()
        }).catch((err) => {
          console.error(`[YT SERVER DEBUG] Erro ao sincronizar LINK_LOUVORES com GAS:`, err);
        });
      }
      let ultimoResultado = { sucesso: true, mensagem: "Escala atualizada com sucesso." };
      try {
        const fullForm = new URLSearchParams({
          action: "updateFullEscala",
          nome: user.nome.trim(),
          senha: user.rawPassword || "",
          dataEscala: targetData,
          data: targetData,
          dataCulto: targetData,
          dirigente: dirigente !== void 0 ? String(dirigente).trim() : "",
          vocal: vocal !== void 0 ? String(vocal).trim() : "",
          musicos: musicos !== void 0 ? String(musicos).trim() : "",
          mesario: mesario !== void 0 ? String(mesario).trim() : "",
          louvores: cleanLouvoresVal !== void 0 ? String(cleanLouvoresVal).trim() : "",
          uniforme: uniforme !== void 0 ? String(uniforme).trim() : "",
          louvores_detalhes: JSON.stringify(structuredLinks),
          link_louvores: JSON.stringify(structuredLinks),
          linkLouvores: JSON.stringify(structuredLinks)
        });
        const gasFullResponse = await fetch(GAS_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json"
          },
          body: fullForm.toString()
        });
        if (gasFullResponse.ok) {
          const jsonFull = await gasFullResponse.json();
          if (jsonFull && jsonFull.sucesso !== false) {
            ultimoResultado = jsonFull;
          }
        }
      } catch (gasFullErr) {
        console.warn("[YT SERVER DEBUG] Tentando fallback de atualiza\xE7\xE3o campo a campo:", gasFullErr);
        const camposPossiveis = [
          { campo: "louvores", valor: cleanLouvoresVal },
          { campo: "uniforme", valor: uniforme },
          { campo: "dirigente", valor: dirigente },
          { campo: "vocal", valor: vocal },
          { campo: "musicos", valor: musicos },
          { campo: "mesario", valor: mesario }
        ];
        for (const item of camposPossiveis) {
          if (item.valor !== void 0) {
            const form = new URLSearchParams({
              action: "updateEscala",
              nome: user.nome.trim(),
              senha: user.rawPassword || "",
              dataEscala: targetData,
              data: targetData,
              dataCulto: targetData,
              campo: item.campo,
              valor: String(item.valor).trim()
            });
            await fetch(GAS_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
              body: form.toString()
            }).catch(() => {
            });
          }
        }
      }
      const escalaObj = {
        data: targetData,
        dirigente: dirigente !== void 0 ? String(dirigente).trim() : escalaExistente?.dirigente || "",
        vocal: vocal !== void 0 ? String(vocal).trim() : escalaExistente?.vocal || "",
        musicos: musicos !== void 0 ? String(musicos).trim() : escalaExistente?.musicos || "",
        mesario: mesario !== void 0 ? String(mesario).trim() : escalaExistente?.mesario || "",
        louvores: cleanLouvoresVal !== void 0 ? String(cleanLouvoresVal).trim() : escalaExistente?.louvores || "",
        uniforme: uniforme !== void 0 ? String(uniforme).trim() : escalaExistente?.uniforme || ""
      };
      if (escalaExistente) {
        if (dirigente !== void 0) escalaExistente.dirigente = escalaObj.dirigente;
        if (vocal !== void 0) escalaExistente.vocal = escalaObj.vocal;
        if (musicos !== void 0) escalaExistente.musicos = escalaObj.musicos;
        if (mesario !== void 0) escalaExistente.mesario = escalaObj.mesario;
        if (cleanLouvoresVal !== void 0) escalaExistente.louvores = escalaObj.louvores;
        if (uniforme !== void 0) escalaExistente.uniforme = escalaObj.uniforme;
      } else {
        cachedEscalas.push({
          ...escalaObj
        });
      }
      if (cachedIntegrantes.length === 0) {
        await syncEscalaDataBackground();
      }
      const membrosNovos = extrairMembrosDaEscala(escalaObj);
      const cleanDataKey = targetData.replace(/[^0-9/]/g, "").replace(/\//g, "_");
      for (const mNovo of membrosNovos) {
        const jaEstava = membrosAntigos.some(
          (mA) => normalizarNome(mA.nome) === normalizarNome(mNovo.nome)
        );
        if (!jaEstava) {
          const normNome = normalizarNome(mNovo.nome).replace(/\s+/g, "_");
          const eventoId = `ESCALA_ADICIONADO_${cleanDataKey}_${normNome}`;
          const detalheFuncao = mNovo.instrumento ? `${mNovo.funcao} (${mNovo.instrumento})` : mNovo.funcao;
          criarNotificacaoSeNaoExiste({
            destinatario: mNovo.nome,
            tipo: "ESCALA",
            titulo: "Nova Escala para Voc\xEA",
            mensagem: `A Paz ${mNovo.nome}! Voc\xEA foi escalado(a) para o culto do dia ${targetData} como ${detalheFuncao}!`,
            eventoId,
            origem: "APP"
          });
        } else {
          const correspondenteAntigo = membrosAntigos.find(
            (mA) => normalizarNome(mA.nome) === normalizarNome(mNovo.nome)
          );
          if (correspondenteAntigo) {
            const mudouFuncao = correspondenteAntigo.funcao !== mNovo.funcao;
            const mudouInst = (correspondenteAntigo.instrumento || "") !== (mNovo.instrumento || "");
            if (mudouFuncao || mudouInst) {
              const detalheNovo = mNovo.instrumento ? `${mNovo.funcao} (${mNovo.instrumento})` : mNovo.funcao;
              const roleHash = import_crypto2.default.createHash("md5").update(detalheNovo).digest("hex").substring(0, 6);
              const normNome = normalizarNome(mNovo.nome).replace(/\s+/g, "_");
              const eventoId = `ESCALA_ALTERADA_${cleanDataKey}_${normNome}_${roleHash}`;
              criarNotificacaoSeNaoExiste({
                destinatario: mNovo.nome,
                tipo: "ESCALA",
                titulo: "Fun\xE7\xE3o Alterada na Escala",
                mensagem: `A Paz ${mNovo.nome}! Sua fun\xE7\xE3o na escala do dia ${targetData} foi alterada para ${detalheNovo}.`,
                eventoId,
                origem: "APP"
              });
            }
          }
        }
      }
      if (louvores !== void 0 || uniforme !== void 0 || Array.isArray(linkLouvores) && linkLouvores.length > 0) {
        processarNotificacaoLouvoresUniformes({
          dataEscala: targetData,
          louvores: escalaObj.louvores,
          uniforme: escalaObj.uniforme,
          escala: escalaObj,
          integrantes: cachedIntegrantes
        });
      }
      syncEscalaDataBackground();
      res.json({
        ...ultimoResultado,
        sucesso: true,
        mensagem: ultimoResultado?.mensagem || "Escala atualizada com sucesso.",
        linkLouvores: structuredLinks,
        escala: escalaObj
      });
    } catch (error) {
      console.error("Erro ao atualizar escala:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao atualizar escala no Google Apps Script."
      });
    }
  };
  app2.put("/api/escala/completa", authenticateToken, requireDirigenteOuLider, handleUpdateEscalaCompleta);
  app2.post("/api/escala/completa", authenticateToken, requireDirigenteOuLider, handleUpdateEscalaCompleta);
  app2.post("/api/solicitacoes", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      const { dataEscala, data, dataCulto, motivo, substituto, funcao, instrumento } = req.body || {};
      const targetData = (dataEscala || data || dataCulto || "").toString().trim();
      const targetMotivo = (motivo || "").toString().trim();
      const targetSubstituto = (substituto || "").toString().trim();
      if (!targetData) {
        res.status(400).json({
          sucesso: false,
          mensagem: "Data da escala \xE9 obrigat\xF3ria."
        });
        return;
      }
      if (!targetSubstituto) {
        res.status(400).json({
          sucesso: false,
          mensagem: "Substituto \xE9 obrigat\xF3rio."
        });
        return;
      }
      if (!targetMotivo) {
        res.status(400).json({
          sucesso: false,
          mensagem: "Motivo da solicita\xE7\xE3o \xE9 obrigat\xF3rio."
        });
        return;
      }
      const form = new URLSearchParams({
        action: "createSolicitacao",
        nome: user.nome.trim(),
        dataEscala: targetData,
        data: targetData,
        dataCulto: targetData,
        substituto: targetSubstituto,
        motivo: targetMotivo,
        funcao: (funcao || user.funcao || "").toString().trim(),
        instrumento: (instrumento || user.instrumento || "").toString().trim(),
        senha: user.rawPassword || ""
      });
      const gasResponse = await fetch(GAS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        body: form.toString()
      });
      if (!gasResponse.ok) {
        throw new Error(`Erro na resposta do Google Apps Script: ${gasResponse.statusText}`);
      }
      const result = await gasResponse.json();
      try {
        if (cachedIntegrantes.length === 0) {
          syncEscalaDataBackground();
        }
        processarNotificacaoNovaSolicitacao({
          solicitacaoId: `${targetData}_${user.nome.trim()}_${targetSubstituto}`,
          quemPediu: user.nome.trim(),
          dataEscala: targetData,
          integrantes: cachedIntegrantes
        });
      } catch (notifErr) {
        console.error("Erro ao disparar notifica\xE7\xE3o de solicita\xE7\xE3o:", notifErr);
      }
      res.json(result);
    } catch (error) {
      console.error("Erro ao criar solicita\xE7\xE3o:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao enviar solicita\xE7\xE3o ao Google Apps Script."
      });
    }
  });
  const handleProcessarSolicitacao = async (req, res) => {
    try {
      const user = req.user;
      const {
        dataEscala,
        data,
        dataCulto,
        quemPediu,
        solicitante,
        substituto,
        acao,
        novoStatus,
        motivoDecisao,
        funcao,
        instrumento
      } = req.body || {};
      const targetData = (dataEscala || data || dataCulto || "").toString().trim();
      const targetQuemPediu = (quemPediu || solicitante || "").toString().trim();
      const targetSubstituto = (substituto || "").toString().trim();
      if (!targetData || !targetQuemPediu) {
        res.status(400).json({
          sucesso: false,
          mensagem: "Data da escala e solicitante (quemPediu) s\xE3o obrigat\xF3rios."
        });
        return;
      }
      let acaoFinal = "APROVAR";
      if (acao) {
        acaoFinal = acao.toString().toUpperCase();
      } else if (novoStatus) {
        const norm = novoStatus.toString().toUpperCase();
        if (norm === "APROVADA" || norm === "APROVAR" || norm === "AUTORIZADA") acaoFinal = "APROVAR";
        else if (norm === "RECUSADA" || norm === "RECUSAR" || norm === "REPROVADA") acaoFinal = "RECUSAR";
        else if (norm === "CANCELADA" || norm === "CANCELAR") acaoFinal = "CANCELAR";
      }
      if (acaoFinal === "APROVAR" || acaoFinal === "RECUSAR") {
        if (user.role !== "LIDER" && user.role !== "DIRIGENTE") {
          res.status(403).json({
            sucesso: false,
            mensagem: "Apenas l\xEDderes t\xEAm permiss\xE3o para aprovar ou recusar solicita\xE7\xF5es."
          });
          return;
        }
      } else if (acaoFinal === "CANCELAR") {
        if (user.role !== "LIDER" && user.nome.trim().toLowerCase() !== targetQuemPediu.toLowerCase()) {
          res.status(403).json({
            sucesso: false,
            mensagem: "Voc\xEA s\xF3 pode cancelar suas pr\xF3prias solicita\xE7\xF5es."
          });
          return;
        }
      }
      const form = new URLSearchParams({
        action: "processaSolicitacao",
        acao: acaoFinal,
        nome: user.nome.trim(),
        senha: user.rawPassword || "",
        dataEscala: targetData,
        data: targetData,
        dataCulto: targetData,
        quemPediu: targetQuemPediu,
        substituto: targetSubstituto,
        motivoDecisao: motivoDecisao ? String(motivoDecisao).trim() : "",
        funcao: funcao ? String(funcao).trim() : "",
        instrumento: instrumento ? String(instrumento).trim() : ""
      });
      const gasResponse = await fetch(GAS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        body: form.toString()
      });
      if (!gasResponse.ok) {
        throw new Error(`Erro na resposta do Google Apps Script: ${gasResponse.statusText}`);
      }
      const result = await gasResponse.json();
      try {
        if (acaoFinal === "APROVAR" || acaoFinal === "RECUSAR") {
          processarNotificacaoDecisaoSolicitacao({
            solicitacaoId: `${targetData}_${targetQuemPediu}_${targetSubstituto}`,
            quemPediu: targetQuemPediu,
            substituto: targetSubstituto,
            dataEscala: targetData,
            acao: acaoFinal
          });
        }
      } catch (notifErr) {
        console.error("Erro ao disparar notifica\xE7\xE3o de decis\xE3o da solicita\xE7\xE3o:", notifErr);
      }
      res.json(result);
    } catch (error) {
      console.error("Erro ao processar solicita\xE7\xE3o:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao processar solicita\xE7\xE3o no Google Apps Script."
      });
    }
  };
  app2.post("/api/solicitacoes/processar", authenticateToken, handleProcessarSolicitacao);
  app2.post("/api/solicitacoes/responder", authenticateToken, handleProcessarSolicitacao);
  const extractDriveFileId = (input) => {
    if (!input) return null;
    const str = input.trim();
    if (/^[a-zA-Z0-9_-]{25,}$/.test(str)) {
      return str;
    }
    const matchId = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId) return matchId[1];
    const matchD = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD) return matchD[1];
    const matchFileD = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchFileD) return matchFileD[1];
    return null;
  };
  const handleProxyImagemRecado = async (req, res) => {
    try {
      const urlQuery = req.query.url || req.query.src || req.query.id || req.body?.url;
      const isDownload = req.query.download === "true" || req.path.includes("/download");
      const rawFilename = req.query.filename || "imagem_recado";
      const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9_.-]/g, "_");
      if (!urlQuery) {
        res.status(400).json({ sucesso: false, mensagem: "Par\xE2metro 'url' ou 'id' \xE9 obrigat\xF3rio." });
        return;
      }
      if (urlQuery.startsWith("data:image/")) {
        const matches = urlQuery.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType2 = matches[1];
          const buffer2 = Buffer.from(matches[2], "base64");
          const ext2 = contentType2.split("/")[1]?.split("+")[0] || "jpg";
          const safeFilename2 = cleanFilename.endsWith(`.${ext2}`) ? cleanFilename : `${cleanFilename}.${ext2}`;
          res.setHeader("Content-Type", contentType2);
          res.setHeader("Content-Length", buffer2.length);
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cache-Control", "public, max-age=86400");
          if (isDownload) {
            res.setHeader("Content-Disposition", `attachment; filename="${safeFilename2}"`);
          }
          res.send(buffer2);
          return;
        }
      }
      const driveId = extractDriveFileId(urlQuery);
      let targetUrl = urlQuery;
      if (driveId) {
        targetUrl = `https://lh3.googleusercontent.com/d/${driveId}`;
      }
      let fetchResponse = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
      });
      if (!fetchResponse.ok && driveId) {
        const fallbackUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=view`;
        fetchResponse = await fetch(fallbackUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
      }
      if (!fetchResponse.ok) {
        res.status(fetchResponse.status).json({
          sucesso: false,
          mensagem: `N\xE3o foi poss\xEDvel carregar a imagem do recado: ${fetchResponse.statusText}`
        });
        return;
      }
      let contentType = fetchResponse.headers.get("content-type") || "image/jpeg";
      if (!contentType.startsWith("image/")) {
        contentType = "image/jpeg";
      }
      const arrayBuffer = await fetchResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      let ext = "jpg";
      if (contentType.includes("png")) ext = "png";
      else if (contentType.includes("webp")) ext = "webp";
      else if (contentType.includes("gif")) ext = "gif";
      else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
      const safeFilename = cleanFilename.endsWith(`.${ext}`) ? cleanFilename : `${cleanFilename}.${ext}`;
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      if (isDownload) {
        res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
      }
      res.send(buffer);
    } catch (error) {
      console.error("Erro no proxy de imagem de recado:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro ao processar imagem."
      });
    }
  };
  app2.get("/api/recados/imagem", handleProxyImagemRecado);
  app2.get("/api/recados/download", handleProxyImagemRecado);
  app2.post("/api/recados", authenticateToken, requireLider, async (req, res) => {
    try {
      const user = req.user;
      const { titulo, mensagem, imagemBase64, imagemUrl } = req.body;
      if (!titulo || !mensagem) {
        res.status(400).json({
          sucesso: false,
          mensagem: "T\xEDtulo e mensagem do recado s\xE3o obrigat\xF3rios."
        });
        return;
      }
      const form = new URLSearchParams({
        action: "createRecado",
        nome: user.nome.trim(),
        senha: user.rawPassword || "",
        titulo: String(titulo).trim(),
        mensagem: String(mensagem).trim(),
        imagemBase64: imagemBase64 ? String(imagemBase64) : "",
        imagemUrl: imagemUrl ? String(imagemUrl) : ""
      });
      const gasResponse = await fetch(GAS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        body: form.toString()
      });
      if (!gasResponse.ok) {
        throw new Error(`Erro na resposta do Google Apps Script: ${gasResponse.statusText}`);
      }
      const result = await gasResponse.json();
      try {
        if (cachedIntegrantes.length === 0) {
          syncEscalaDataBackground();
        }
        const recadoId = result?.id || result?.recado?.id || `rec_${Date.now()}`;
        processarNotificacaoNovoRecado(recadoId, cachedIntegrantes);
      } catch (notifErr) {
        console.error("Erro ao disparar notifica\xE7\xE3o de novo recado:", notifErr);
      }
      res.json(result);
    } catch (error) {
      console.error("Erro ao publicar recado:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao salvar recado no Google Apps Script."
      });
    }
  });
  const handleEditarRecado = async (req, res) => {
    try {
      const user = req.user;
      const { id, titulo, mensagem, imagemBase64, imagemUrl, ativo } = req.body;
      const recadoId = req.params.id || id;
      if (!recadoId || !titulo || !mensagem) {
        res.status(400).json({
          sucesso: false,
          mensagem: "ID, t\xEDtulo e mensagem do recado s\xE3o obrigat\xF3rios."
        });
        return;
      }
      const form = new URLSearchParams({
        action: "updateRecado",
        nome: user.nome.trim(),
        senha: user.rawPassword || "",
        id: String(recadoId).trim(),
        titulo: String(titulo).trim(),
        mensagem: String(mensagem).trim(),
        imagemBase64: imagemBase64 ? String(imagemBase64) : "",
        imagemUrl: imagemUrl ? String(imagemUrl) : "",
        ativo: ativo ? String(ativo).trim().toUpperCase() : "SIM"
      });
      const gasResponse = await fetch(GAS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        body: form.toString()
      });
      if (!gasResponse.ok) {
        throw new Error(`Erro na resposta do Google Apps Script: ${gasResponse.statusText}`);
      }
      const result = await gasResponse.json();
      res.json(result);
    } catch (error) {
      console.error("Erro ao editar recado:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao atualizar recado no Google Apps Script."
      });
    }
  };
  app2.put("/api/recados/:id", authenticateToken, requireLider, handleEditarRecado);
  app2.post("/api/recados/editar", authenticateToken, requireLider, handleEditarRecado);
  const handleExcluirRecado = async (req, res) => {
    try {
      const user = req.user;
      const recadoId = req.params.id || req.body.id;
      if (!recadoId) {
        res.status(400).json({
          sucesso: false,
          mensagem: "ID do recado \xE9 obrigat\xF3rio."
        });
        return;
      }
      const form = new URLSearchParams({
        action: "deleteRecado",
        nome: user.nome.trim(),
        senha: user.rawPassword || "",
        id: String(recadoId).trim()
      });
      const gasResponse = await fetch(GAS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        body: form.toString()
      });
      if (!gasResponse.ok) {
        throw new Error(`Erro na resposta do Google Apps Script: ${gasResponse.statusText}`);
      }
      const result = await gasResponse.json();
      res.json(result);
    } catch (error) {
      console.error("Erro ao excluir recado:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao excluir recado no Google Apps Script."
      });
    }
  };
  app2.delete("/api/recados/:id", authenticateToken, requireLider, handleExcluirRecado);
  app2.post("/api/recados/excluir", authenticateToken, requireLider, handleExcluirRecado);
  app2.get("/api/notificacoes", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      try {
        let url = `${GAS_API_URL}?action=getNotificacoes&nome=${encodeURIComponent(user.nome.trim())}`;
        if (user.rawPassword) {
          url += `&senha=${encodeURIComponent(user.rawPassword)}`;
        }
        const gasResponse = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" }
        });
        if (gasResponse.ok) {
          const data = await gasResponse.json();
          const rawList = Array.isArray(data.notificacoes) ? data.notificacoes : Array.isArray(data) ? data : [];
          if (rawList.length > 0) {
            mergeGasNotifications(rawList);
          }
        }
      } catch (gasErr) {
      }
      const userNotificacoes = getNotificacoesParaUsuario(user.nome);
      res.json({
        sucesso: true,
        notificacoes: userNotificacoes,
        mensagem: `${userNotificacoes.length} notifica\xE7\xE3o(\xF5es) encontrada(s).`
      });
    } catch (error) {
      console.error("Erro ao buscar notifica\xE7\xF5es:", error);
      const fallbackList = getNotificacoesParaUsuario(req.user?.nome || "");
      res.json({
        sucesso: true,
        notificacoes: fallbackList,
        mensagem: `${fallbackList.length} notifica\xE7\xE3o(\xF5es) encontrada(s).`
      });
    }
  });
  const handleMarcarNotifLida = async (req, res) => {
    try {
      const user = req.user;
      const notifId = req.params.id;
      if (!notifId || typeof notifId !== "string" || !notifId.trim()) {
        res.status(400).json({
          sucesso: false,
          mensagem: "ID da notifica\xE7\xE3o \xE9 obrigat\xF3rio."
        });
        return;
      }
      marcarComoLidaLocal(notifId.trim());
      try {
        const form = new URLSearchParams({
          action: "marcarNotificacaoLida",
          id: notifId.trim(),
          nome: user.nome.trim(),
          senha: user.rawPassword || ""
        });
        await fetch(GAS_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json"
          },
          body: form.toString()
        });
      } catch (gasErr) {
      }
      res.json({
        sucesso: true,
        mensagem: "Notifica\xE7\xE3o marcada como lida."
      });
    } catch (error) {
      console.error("Erro ao marcar notifica\xE7\xE3o como lida:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao marcar notifica\xE7\xE3o."
      });
    }
  };
  app2.put("/api/notificacoes/:id/lida", authenticateToken, handleMarcarNotifLida);
  app2.post("/api/notificacoes/:id/lida", authenticateToken, handleMarcarNotifLida);
  app2.post("/api/notificacoes/marcar-todas-lidas", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      marcarTodasComoLidasLocal(user.nome);
      try {
        const form = new URLSearchParams({
          action: "marcarTodasNotificacoesLidas",
          nome: user.nome.trim(),
          senha: user.rawPassword || ""
        });
        await fetch(GAS_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json"
          },
          body: form.toString()
        });
      } catch (gasErr) {
      }
      res.json({
        sucesso: true,
        mensagem: "Todas as notifica\xE7\xF5es foram marcadas como lidas."
      });
    } catch (error) {
      console.error("Erro ao marcar todas as notifica\xE7\xF5es como lidas:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao marcar notifica\xE7\xF5es."
      });
    }
  });
  function getRenderedServiceWorker() {
    const swPath = import_path2.default.join(process.cwd(), "public", "sw.js");
    let swContent = "";
    try {
      swContent = import_fs2.default.readFileSync(swPath, "utf-8");
    } catch {
      const altPath = import_path2.default.join(process.cwd(), "dist", "sw.js");
      if (import_fs2.default.existsSync(altPath)) {
        swContent = import_fs2.default.readFileSync(altPath, "utf-8");
      }
    }
    const apiKey = process.env.VITE_FIREBASE_API_KEY || "AIzaSyBy56kEmfcHWNQ7t15bF2RtLb5CkdHwLK4";
    const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN || "escala-louvor-2.firebaseapp.com";
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || "escala-louvor-2";
    const messagingSenderId = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "979295298532";
    const appId = process.env.VITE_FIREBASE_APP_ID || "1:979295298532:web:8093b4212b9fff6d0b9df1";
    return swContent.replace(/__FIREBASE_API_KEY__/g, apiKey).replace(/__FIREBASE_AUTH_DOMAIN__/g, authDomain).replace(/__FIREBASE_PROJECT_ID__/g, projectId).replace(/__FIREBASE_MESSAGING_SENDER_ID__/g, messagingSenderId).replace(/__FIREBASE_APP_ID__/g, appId).replace(/PLACEHOLDER_KEY/g, apiKey);
  }
  app2.get("/sw.js", (req, res) => {
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.send(getRenderedServiceWorker());
  });
  app2.get("/api/sw.js", (req, res) => {
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.send(getRenderedServiceWorker());
  });
  return app2;
}

// api/index.ts
var app;
try {
  const serverModule = require_server();
  app = serverModule.default || serverModule;
} catch (e) {
  app = createApiApp();
}
var index_default = app;
//# sourceMappingURL=index.js.map
