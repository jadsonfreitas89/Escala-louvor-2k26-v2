import express, { Request, Response, NextFunction, Express } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { subscribeUserToFcm, unsubscribeUserFromFcm, getFcmTokensForUser } from "./fcmService";
import { getMessaging } from 'firebase-admin/messaging';
import { getFirebaseAdminApp } from "./firebaseAdmin";
import {
  loadNotifications,
  getNotificacoesParaUsuario,
  marcarComoLidaLocal,
  marcarTodasComoLidasLocal,
  mergeGasNotifications,
  processarLembretesDeCulto,
  processarNotificacaoNovoRecado,
  processarNotificacaoNovaEscala,
  processarNotificacaoNovaSolicitacao,
  processarNotificacaoDecisaoSolicitacao,
  processarNotificacaoLouvoresUniformes,
  detectarAlteracoesNaPlanilha,
  getSheetsSnapshot,
  setGasApiUrlForNotifications,
  extrairMembrosDaEscala,
  normalizarNome,
  criarNotificacaoSeNaoExiste,
  EscalaRef,
  IntegranteRef
} from "./notifications";
import { executarBateriaDeTestesDetector } from "./tests";
import { extractPlaylistId, fetchYouTubePlaylist } from "./youtube";

/**
 * URL do Web App do Google Apps Script (Execução Oficial)
 */
const GAS_API_URL =
  process.env.GAS_API_URL ||
  "https://script.google.com/macros/s/AKfycbyK1dC5cjUtK0YZRN2FFp2wGuJpiLHU_g4rajI-SkMv2gDsbrKt2XgptQg_olu2tcs/exec";

setGasApiUrlForNotifications(GAS_API_URL);

const DATA_DIR = path.join(process.cwd(), "data");
const LINK_LOUVORES_FILE = path.join(DATA_DIR, "link_louvores.json");

let cachedLinkLouvores: any[] = [];

/**
 * Normaliza datas no formato estrito DD/MM/YYYY
 */
function cleanDateString(dateStr: string | null | undefined): string {
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
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LINK_LOUVORES_FILE)) {
      const raw = fs.readFileSync(LINK_LOUVORES_FILE, "utf-8");
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
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LINK_LOUVORES_FILE, JSON.stringify(cachedLinkLouvores, null, 2), "utf-8");
  } catch (e) {
    // Ignore error
  }
}

loadCachedLinkLouvores();

/**
 * Extrai o ID do vídeo do YouTube a partir de string ou URL
 */
function extractYouTubeVideoId(urlOrId?: string): string {
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
  } catch (e) {}

  const match = trimmed.match(/(?:v=|youtu\.be\/|\/v\/|\/embed\/|\/shorts\/)([\w-]{11})/i);
  return match && match[1] && /^[a-zA-Z0-9_-]{11}$/.test(match[1]) ? match[1] : "";
}

/**
 * Normaliza uma URL do YouTube no formato canônico
 */
function normalizeYouTubeUrl(urlOrId?: string): string {
  if (!urlOrId) return "";
  const videoId = extractYouTubeVideoId(urlOrId);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return urlOrId.trim();
}

/**
 * Limpa URLs do YouTube de um texto para garantir que a aba ESCALA contenha apenas nomes das músicas
 */
function cleanLouvoresText(raw: string): string {
  if (!raw) return "";
  return raw
    .split("\n")
    .map((line) => {
      let l = line.trim();
      if (!l) return null;
      l = l
        .replace(/(https?:\/\/[^\s\)\],]+|(?:www\.|m\.|music\.)?youtube\.com\/[^\s\)\],]+|youtu\.be\/[^\s\)\],]+)/gi, "")
        .replace(/\(\s*\)/g, "")
        .replace(/\[\s*\]/g, "")
        .replace(/[\|\(\)\[\]\-]+$/, "")
        .trim();
      return l || null;
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * Extrai lista estruturada de louvores com link a partir de um texto ou lista
 */
function extractStructuredLouvores(raw: string, dataEscala: string): any[] {
  if (!raw) return [];
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.map((line, idx) => {
    let l = line.replace(/^(\(\d+\)|\d+[\.\-\)])\s*/i, "").trim();
    let url = "";
    const ytMatch = l.match(/(https?:\/\/[^\s\)\],]+|(?:www\.|m\.|music\.)?youtube\.com\/[^\s\)\],]+|youtu\.be\/[^\s\)\],]+)/i);
    if (ytMatch) {
      url = ytMatch[0];
      l = l
        .replace(url, "")
        .replace(/\(\s*\)/g, "")
        .replace(/\[\s*\]/g, "")
        .replace(/[\|\(\)\[\]\-]+$/, "")
        .trim();
    }
    const finalName = l || line;
    const videoId = extractYouTubeVideoId(url);
    const finalUrl = normalizeYouTubeUrl(url) || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : "");
    return {
      id: `louvor-${dataEscala.replace(/[^0-9]/g, "")}-${idx}`,
      data: dataEscala,
      dataEscala: dataEscala,
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

/**
 * Chave de assinatura e cifragem de tokens (AES-256-GCM)
 */
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "escala-louvor-2k26-secret-token-sign-key-production-v2";

/**
 * Interface para a Sessão Segura mantida em memória e serializada em token
 */
export interface UserSession {
  nome: string;
  funcao: string;
  instrumento?: string;
  role: "LIDER" | "DIRIGENTE" | "INTEGRANTE";
  rawPassword?: string;
  createdAt: number;
}

// Armazenamento em memória de sessões ativas (Cache rápido)
const activeSessions = new Map<string, UserSession>();

// Cache local da escala e integrantes para os lembretes automáticos e notificações oficiais
let cachedEscalas: EscalaRef[] = [];
let cachedIntegrantes: IntegranteRef[] = [];
let backgroundTimerStarted = false;

/**
 * Função interna para sincronizar dados da escala, detectar alterações e disparar lembretes
 */
async function syncEscalaDataBackground(origem: "APP" | "GOOGLE_SHEETS" = "GOOGLE_SHEETS") {
  try {
    const gasResponse = await fetch(`${GAS_API_URL}?action=getEscalaData`, {
      method: "GET",
      headers: { Accept: "application/json" }
    });
    if (gasResponse.ok) {
      const data: any = await gasResponse.json();
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

      // Executa detecção de alterações na planilha (ESCALA, SOLICITAÇÕES, RECADOS)
      if (cachedEscalas.length > 0) {
        detectarAlteracoesNaPlanilha({
          escalaAtual: cachedEscalas,
          solicitacoesAtuais: Array.isArray(data.solicitacoes) ? data.solicitacoes : [],
          recadosAtuais: Array.isArray(data.recados) ? data.recados : [],
          integrantes: cachedIntegrantes,
          origem
        });
      }

      // Processa lembretes de culto com base no fuso America/Sao_Paulo
      processarLembretesDeCulto(cachedEscalas, cachedIntegrantes);
    }
  } catch (err) {
    // Falha silenciosa em background para não interromper a execução
  }
}

/**
 * Inicia o temporizador contínuo do backend para checagem dos horários oficiais dos cultos
 */
function startCultoScheduler() {
  if (backgroundTimerStarted) return;
  backgroundTimerStarted = true;

  // Primeira execução imediata
  syncEscalaDataBackground();

  // Execução a cada 30 segundos
  setInterval(() => {
    try {
      processarLembretesDeCulto(cachedEscalas, cachedIntegrantes);
    } catch (e) {
      // Ignora erro em loop de intervalo
    }
  }, 30000);

  // Sincronização periódica da planilha a cada 5 minutos
  setInterval(() => {
    syncEscalaDataBackground();
  }, 5 * 60 * 1000);
}

/**
 * Cria token seguro cifrado (Stateless AES-256-GCM)
 */
function createSessionToken(sessionData: UserSession): string {
  try {
    const payload = JSON.stringify(sessionData);
    const iv = crypto.randomBytes(12);
    const key = crypto.createHash("sha256").update(SESSION_SECRET).digest();
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(payload, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    const token = `${iv.toString("hex")}.${authTag}.${encrypted}`;
    activeSessions.set(token, sessionData);
    return token;
  } catch (err) {
    const fallbackToken = crypto.randomBytes(32).toString("hex");
    activeSessions.set(fallbackToken, sessionData);
    return fallbackToken;
  }
}

/**
 * Decifra e valida token de sessão com suporte a Serverless e Cache
 */
function verifySessionToken(tokenStr: string): UserSession | null {
  if (!tokenStr) return null;

  // 1. Verifica cache em memória primeiro
  if (activeSessions.has(tokenStr)) {
    const session = activeSessions.get(tokenStr)!;
    // Validade de 30 dias
    if (Date.now() - session.createdAt < 30 * 24 * 60 * 60 * 1000) {
      return session;
    }
    activeSessions.delete(tokenStr);
  }

  // 2. Decifra token stateless AES-256-GCM
  try {
    const parts = tokenStr.split(".");
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = crypto.createHash("sha256").update(SESSION_SECRET).digest();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    const sessionData = JSON.parse(decrypted) as UserSession;

    if (Date.now() - sessionData.createdAt < 30 * 24 * 60 * 60 * 1000) {
      activeSessions.set(tokenStr, sessionData);
      return sessionData;
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Helper para identificar o perfil a partir da função cadastrada
 */
function identificarPerfil(funcaoStr: string): "LIDER" | "DIRIGENTE" | "INTEGRANTE" {
  const norm = (funcaoStr || "").toLowerCase();
  if (norm.includes("lider")) return "LIDER";
  if (norm.includes("dirigente")) return "DIRIGENTE";
  return "INTEGRANTE";
}

/**
 * Middleware para validar o token de sessão do usuário
 */
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({
      sucesso: false,
      mensagem: "Acesso não autorizado. Faça login para continuar."
    });
    return;
  }

  const session = verifySessionToken(token);
  if (!session) {
    res.status(401).json({
      sucesso: false,
      mensagem: "Sessão expirada ou inválida. Por favor, autentique-se novamente."
    });
    return;
  }

  (req as any).user = session;
  (req as any).token = token;
  next();
}

/**
 * Middleware para autorizar apenas Líderes
 */
function requireLider(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as UserSession;
  if (!user || user.role !== "LIDER") {
    res.status(403).json({
      sucesso: false,
      mensagem: "Ação restrita a líderes do ministério de louvor."
    });
    return;
  }
  next();
}

/**
 * Middleware para autorizar Líderes ou Dirigentes
 */
function requireDirigenteOuLider(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as UserSession;
  if (!user || (user.role !== "LIDER" && user.role !== "DIRIGENTE")) {
    res.status(403).json({
      sucesso: false,
      mensagem: "Ação restrita a líderes e dirigentes do ministério de louvor."
    });
    return;
  }
  next();
}

/**
 * Cria a aplicação Express com todos os endpoints e middlewares configurados
 */
export function createApiApp(): Express {
  const app = express();

  // Inicia o motor de lembretes e checagem de cultos em segundo plano
  startCultoScheduler();

  // Permite payloads de até 15MB (suporte a fotos e recados)
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Middleware de CORS completo para produção (Vercel, Cloud Run, Localhost)
  app.use((req, res, next) => {
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

  // Health Check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      sucesso: true,
      status: "online",
      ambiente: process.env.NODE_ENV || "production",
      backend: "Google Apps Script",
      timestamp: new Date().toISOString()
    });
  });

  // =========================================================================
  // ROTAS DE AUTENTICAÇÃO SEGURA (Backend Proxy)
  // =========================================================================

  /**
   * POST /api/auth/login
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { nome, senha } = req.body;

      if (!nome || typeof nome !== "string" || !nome.trim()) {
        res.status(400).json({
          sucesso: false,
          mensagem: "Nome de usuário é obrigatório."
        });
        return;
      }

      const cleanNome = nome.trim();
      const inputSenha = senha ? String(senha).trim() : "";

      // 1. Busca os dados reais do Google Apps Script
      const gasResponse = await fetch(`${GAS_API_URL}?action=getEscalaData`, {
        method: "GET",
        headers: { Accept: "application/json" }
      });

      if (!gasResponse.ok) {
        throw new Error(`Falha de comunicação com o Google Apps Script: ${gasResponse.statusText}`);
      }

      const data: any = await gasResponse.json();

      if (!data || !data.sucesso || !Array.isArray(data.integrantes)) {
        throw new Error("Não foi possível carregar os integrantes da planilha.");
      }

      // 2. Localiza o integrante
      const integrante = data.integrantes.find(
        (i: any) =>
          (i.nome || "").trim().toLowerCase() === cleanNome.toLowerCase()
      );

      if (!integrante) {
        res.status(404).json({
          sucesso: false,
          mensagem: `Integrante "${cleanNome}" não foi encontrado na base de membros.`
        });
        return;
      }

      // 3. Validação de senha
      const memberSenha = (integrante.senha || "").toString().trim();
      if (memberSenha) {
        if (!inputSenha) {
          res.status(401).json({
            sucesso: false,
            mensagem: "Este usuário possui senha cadastrada. Por favor, informe sua senha."
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

      // 4. Cria sessão segura
      const role = identificarPerfil(integrante.funcao);
      const sessionData: UserSession = {
        nome: integrante.nome,
        funcao: integrante.funcao || "",
        instrumento: integrante.instrumento || "",
        role: role,
        rawPassword: memberSenha,
        createdAt: Date.now()
      };

      const sessionToken = createSessionToken(sessionData);

      // 5. Retorna dados do usuário higienizados (NUNCA envia a senha ao cliente)
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
    } catch (error: any) {
      console.error("Erro na autenticação:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao processar login com o Google Apps Script."
      });
    }
  });

  /**
   * GET /api/auth/me
   */
  app.get("/api/auth/me", authenticateToken, (req: Request, res: Response) => {
    const user = (req as any).user as UserSession;
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

  /**
   * POST /api/auth/logout
   */
  app.post("/api/auth/logout", authenticateToken, (req: Request, res: Response) => {
    const token = (req as any).token as string;
    if (token) {
      activeSessions.delete(token);
    }
    res.json({
      sucesso: true,
      mensagem: "Sessão finalizada com sucesso."
    });
  });

  /**
   * POST /api/notifications/subscribe
   */
  app.post("/api/notifications/subscribe", authenticateToken, async (req: Request, res: Response) => {
    const user = (req as any).user as UserSession;
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ sucesso: false, mensagem: "Token é obrigatório." });
      return;
    }
    await subscribeUserToFcm(user.nome, token);
    res.json({ sucesso: true, mensagem: "Token registrado com sucesso." });
  });

  /**
   * POST /api/notifications/unsubscribe
   */
  app.post("/api/notifications/unsubscribe", authenticateToken, async (req: Request, res: Response) => {
    const user = (req as any).user as UserSession;
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ sucesso: false, mensagem: "Token é obrigatório." });
      return;
    }
    const sucesso = await unsubscribeUserFromFcm(user.nome, token);
    res.json({ sucesso, mensagem: sucesso ? "Token removido com sucesso." : "Token não encontrado." });
  });

  /**
   * POST /api/notifications/test-fcm
   */
  app.post("/api/notifications/test-fcm", authenticateToken, async (req: Request, res: Response) => {
    const user = (req as any).user as UserSession;
    const tokens = await getFcmTokensForUser(user.nome);

    if (tokens.length === 0) {
      res.json({
        success: true,
        sent: 0,
        failed: 0,
        message: "Nenhum token FCM registrado ou ativo para o usuário no momento."
      });
      return;
    }

    const adminApp = getFirebaseAdminApp();
    if (!adminApp) {
      res.status(503).json({
        success: false,
        sent: 0,
        failed: tokens.length,
        message: "Firebase Admin SDK não inicializado no servidor (credenciais ausentes)."
      });
      return;
    }

    const messaging = getMessaging(adminApp);
    const notificationId = crypto.randomUUID();

    let sent = 0;
    let failed = 0;

    for (const token of tokens) {
      try {
        await messaging.send({
          token,
          notification: {
            title: "EscalaLouvor — Teste FCM",
            body: "Se você recebeu esta notificação, o Firebase Cloud Messaging está funcionando!"
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
      } catch (error: any) {
        console.error(`Falha ao enviar FCM para token ${token.substring(0, 6)}...:`, error?.message);
        if (
          error.code === 'messaging/registration-token-not-registered' ||
          error.code === 'messaging/invalid-registration-token'
        ) {
          await unsubscribeUserFromFcm(user.nome, token);
        }
        failed++;
      }
    }

    res.json({ success: true, sent, failed, notificationId });
  });

  // =========================================================================
  // ROTAS DO YOUTUBE (Backend Seguro com YouTube Data API v3)
  // =========================================================================

  /**
   * POST /api/youtube/playlist
   * GET /api/youtube/playlist
   * Importa vídeos de uma playlist do YouTube de forma segura no backend
   */
  const handleFetchYouTubePlaylist = async (req: Request, res: Response) => {
    try {
      const urlOrId = (req.body?.url || req.body?.playlistId || req.query?.url || req.query?.playlistId || "").toString().trim();

      if (!urlOrId) {
        res.status(400).json({
          sucesso: false,
          mensagem: "O link ou ID da playlist do YouTube é obrigatório."
        });
        return;
      }

      const playlistId = extractPlaylistId(urlOrId);
      if (!playlistId) {
        res.status(400).json({
          sucesso: false,
          mensagem: "O link informado não parece ser uma playlist válida do YouTube."
        });
        return;
      }

      const result = await fetchYouTubePlaylist(playlistId);

      if (!result.success || !result.data) {
        res.status(result.statusCode || 500).json({
          sucesso: false,
          mensagem: result.errorMessage || "Não foi possível importar a playlist no momento. Tente novamente."
        });
        return;
      }

      res.json({
        sucesso: true,
        dados: result.data,
        data: result.data
      });
    } catch (err: any) {
      console.error("[Backend] Erro na rota /api/youtube/playlist:", err);
      res.status(500).json({
        sucesso: false,
        mensagem: "Não foi possível importar a playlist no momento. Tente novamente."
      });
    }
  };

  app.post("/api/youtube/playlist", authenticateToken, handleFetchYouTubePlaylist);
  app.get("/api/youtube/playlist", authenticateToken, handleFetchYouTubePlaylist);

  // =========================================================================
  // ROTAS DE DADOS DA ESCALA E PLANILHA (Backend Proxy Seguro)
  // =========================================================================

  /**
   * GET /api/escala
   * Carrega escalas, integrantes, recados, links e histórico de solicitações
   */
  app.get("/api/escala", async (req: Request, res: Response) => {
    try {
      // Verifica se há token de autenticação para repassar nome e senha ao Apps Script
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

      const data: any = await gasResponse.json();

      // Sanitiza dados de integrantes removendo senhas
      if (data && Array.isArray(data.integrantes)) {
        data.integrantes = data.integrantes.map((item: any) => {
          const { senha, ...safeItem } = item;
          return safeItem;
        });
      }

      // Normaliza lista de solicitações
      if (data && Array.isArray(data.solicitacoes)) {
        data.solicitacoes = data.solicitacoes.map((s: any, index: number) => {
          const dataEscala = s.data_escala || s.dataEscala || s.data || "";
          const quemPediu = s.quem_pediu || s.quemPediu || s.nome || "";
          const substituto = s.substituto || "";
          return {
            id: s.id || `sol-${dataEscala.replace(/[^0-9]/g, '')}-${quemPediu}-${substituto}-${index}`,
            dataEscala: dataEscala,
            quemPediu: quemPediu,
            funcao: s.funcao || "",
            instrumento: s.instrumento || "",
            substituto: substituto,
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

      // Normaliza dados de escala garantindo datas consistentes
      if (data && Array.isArray(data.escala)) {
        data.escala = data.escala.map((esc: any) => ({
          ...esc,
          data: cleanDateString(esc.data || esc.dataEscala || esc.dataCulto)
        }));
      }

      // Normaliza e mescla links de louvores
      const incomingLinks = Array.isArray(data?.link_louvores) && data.link_louvores.length > 0
        ? data.link_louvores
        : (Array.isArray(data?.linkLouvores) && data.linkLouvores.length > 0 ? data.linkLouvores : []);

      if (incomingLinks.length > 0) {
        let normalizedIncoming = incomingLinks.map((it: any, idx: number) => {
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
            ordem: it.ordem !== undefined ? it.ordem : idx + 1,
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

        // Preserva YouTube URLs do cache local se o GAS retornou vazio para o mesmo louvor e data
        normalizedIncoming = normalizedIncoming.map((n: any) => {
          if (!n.youtubeUrl) {
            const existing = cachedLinkLouvores.find(
              (c) => cleanDateString(c.data || c.dataEscala) === cleanDateString(n.data) &&
                     c.louvor.toLowerCase().trim() === n.louvor.toLowerCase().trim() &&
                     c.youtubeUrl
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
          normalizedIncoming.map((n: any) => cleanDateString(n.data)).filter(Boolean)
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

      // Normaliza recados do mural
      if (data && Array.isArray(data.recados)) {
        data.recados = data.recados.map((r: any, index: number) => {
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

      // Atualiza cache em memória e executa detector de alterações da planilha
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
    } catch (error: any) {
      console.error("Erro ao buscar dados da escala:", error);
      res.status(502).json({
        sucesso: false,
        mensagem: "Não foi possível conectar ao Google Apps Script para obter as escalas.",
        escala: [],
        integrantes: [],
        solicitacoes: [],
        recados: [],
        linkLouvores: []
      });
    }
  });

  /**
   * POST /api/webhook/sheets-change
   * Webhook chamado pelo Google Apps Script (onEdit / onChange / trigger instalável)
   * Recebe notificação imediata de alteração direta nas abas da planilha
   */
  app.post("/api/webhook/sheets-change", async (req: Request, res: Response) => {
    try {
      const { aba, linha, data: dataLinha, origem = "GOOGLE_SHEETS" } = req.body || {};
      console.log(`[CHANGE-DETECTOR] Webhook recebido de alteração na planilha. Aba: ${aba || 'TODAS'}, Linha: ${linha || 'N/A'}, Origem: ${origem}`);

      // Executa sincronização e detecção completa imediatamente
      await syncEscalaDataBackground(origem as any);

      res.json({
        sucesso: true,
        mensagem: "Alteração da planilha processada com sucesso pelo detector de eventos.",
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("Erro no webhook de alteração da planilha:", err);
      res.status(500).json({
        sucesso: false,
        mensagem: err.message || "Erro ao processar webhook de alteração."
      });
    }
  });

  /**
   * GET /api/escala/snapshot
   * Retorna o snapshot atual armazenado pelo detector de alterações
   */
  app.get("/api/escala/snapshot", authenticateToken, (req: Request, res: Response) => {
    const snapshot = getSheetsSnapshot();
    res.json({
      sucesso: true,
      snapshot
    });
  });

  /**
   * POST /api/escala/detectar-alteracoes
   * Força execução manual da detecção de alterações comparando dados atuais com o snapshot
   */
  app.post("/api/escala/detectar-alteracoes", authenticateToken, async (req: Request, res: Response) => {
    try {
      await syncEscalaDataBackground("GOOGLE_SHEETS");
      res.json({
        sucesso: true,
        mensagem: "Verificação de alterações no Google Sheets concluída com sucesso."
      });
    } catch (err: any) {
      res.status(500).json({
        sucesso: false,
        mensagem: err.message || "Erro ao verificar alterações."
      });
    }
  });

  /**
   * GET e POST /api/admin/testar-detector-alteracoes
   * Executa a bateria completa de 10 testes de conformidade do detector de alterações
   */
  const handleTestarDetector = (req: Request, res: Response) => {
    try {
      const resultado = executarBateriaDeTestesDetector();
      res.json({
        sucesso: resultado.sucessoGeral,
        timestamp: new Date().toISOString(),
        resultados: resultado.resultados
      });
    } catch (err: any) {
      console.error("Erro ao executar bateria de testes:", err);
      res.status(500).json({
        sucesso: false,
        mensagem: err.message || "Erro ao executar testes do detector."
      });
    }
  };

  app.get("/api/admin/testar-detector-alteracoes", handleTestarDetector);
  app.post("/api/admin/testar-detector-alteracoes", handleTestarDetector);

  /**
   * POST /api/escala/notificar-nova-escala
   * Dispara notificação oficial de nova escala pelo Líder
   * Mensagem: "ATENÇÃO!! NOVA ESCALA DISPONIVEL"
   * Anti-duplicação: 1 envio por mês
   */
  app.post("/api/escala/notificar-nova-escala", authenticateToken, requireLider, async (req: Request, res: Response) => {
    try {
      const { mes } = req.body;

      // Garante que integrantes estejam carregados
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
    } catch (error: any) {
      console.error("Erro ao notificar nova escala:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao processar notificação de nova escala."
      });
    }
  });

  /**
   * PUT /api/escala/campo ou POST /api/escala/campo
   * Atualiza campo específico da escala (ex: dirigente, louvores, uniforme, vocal, etc.)
   */
  const handleUpdateCampoEscala = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as UserSession;
      const { dataEscala, data, dataCulto, campo, valor, louvores, uniforme, linkLouvores } = req.body || {};
      const rawTargetData = (dataEscala || data || dataCulto || "").toString().trim();
      const targetData = cleanDateString(rawTargetData);

      if (!targetData) {
        res.status(400).json({ sucesso: false, mensagem: "Data da escala é obrigatória." });
        return;
      }

      let finalValor = (valor !== undefined ? String(valor) : "").trim();
      let structuredLinks: any[] = [];

      if (campo === "louvores" || louvores !== undefined) {
        const rawLouv = campo === "louvores" ? finalValor : String(louvores).trim();
        finalValor = cleanLouvoresText(rawLouv);

        if (Array.isArray(linkLouvores) && linkLouvores.length > 0) {
          structuredLinks = linkLouvores.map((it: any, idx: number) => {
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
              ordem: it.ordem !== undefined ? it.ordem : idx + 1,
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

        // Salva links estruturados no cache e na aba LINK_LOUVORES
        if (Array.isArray(linkLouvores) || structuredLinks.length > 0) {
          cachedLinkLouvores = cachedLinkLouvores.filter(
            (l) => cleanDateString(l.data || l.dataEscala) !== targetData
          );
          if (structuredLinks.length > 0) {
            cachedLinkLouvores.push(...structuredLinks);
          }
          saveCachedLinkLouvores();

          // Envia para o Google Apps Script para persistir na aba LINK_LOUVORES
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

      // Prepara requisição para o Google Apps Script para a aba ESCALA
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

      if (louvores !== undefined && campo !== "louvores") {
        form.append("louvores", cleanLouvoresText(String(louvores)));
      }
      if (uniforme !== undefined && campo !== "uniforme") {
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

      const result: any = await gasResponse.json();

      // Se atualizou louvores ou uniforme, dispara notificações para TODOS os escalados
      if (campo === "louvores" || campo === "uniforme" || louvores !== undefined || uniforme !== undefined) {
        if (cachedIntegrantes.length === 0) {
          await syncEscalaDataBackground();
        }
        const escalaObj = cachedEscalas.find((e) => e.data.trim().replace(/[^0-9/]/g, "") === targetData.replace(/[^0-9/]/g, ""));
        if (escalaObj) {
          const targetLouvores = campo === "louvores" ? finalValor : (louvores ? cleanLouvoresText(String(louvores)) : escalaObj.louvores);
          const targetUniforme = campo === "uniforme" ? finalValor : (uniforme || escalaObj.uniforme);

          processarNotificacaoLouvoresUniformes({
            dataEscala: targetData,
            louvores: targetLouvores,
            uniforme: targetUniforme,
            escala: escalaObj,
            integrantes: cachedIntegrantes
          });
        }
      }

      // Sincroniza cache em background
      syncEscalaDataBackground();

      res.json(result);
    } catch (error: any) {
      console.error("Erro ao atualizar campo da escala:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao atualizar escala no Google Apps Script."
      });
    }
  };

  app.put("/api/escala/campo", authenticateToken, requireDirigenteOuLider, handleUpdateCampoEscala);
  app.post("/api/escala/campo", authenticateToken, requireDirigenteOuLider, handleUpdateCampoEscala);

  /**
   * PUT /api/escala/completa ou POST /api/escala/completa
   * Atualiza linha/campos da escala no Google Sheets de forma sequencial e resiliente
   */
  const handleUpdateEscalaCompleta = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as UserSession;
      const { dataEscala, data, dataCulto, dirigente, vocal, musicos, mesario, louvores, uniforme, linkLouvores } = req.body || {};
      const rawTargetData = (dataEscala || data || dataCulto || "").toString().trim();
      const targetData = cleanDateString(rawTargetData);

      if (!targetData) {
        res.status(400).json({ sucesso: false, mensagem: "Data da escala é obrigatória." });
        return;
      }

      const cleanLouvoresVal = louvores !== undefined ? cleanLouvoresText(String(louvores)) : undefined;

      const escalaExistente = cachedEscalas.find(
        (e) => cleanDateString(e.data) === targetData
      );
      const membrosAntigos = escalaExistente ? extrairMembrosDaEscala(escalaExistente) : [];

      // Trata links de louvores para persistência na aba LINK_LOUVORES
      let structuredLinks: any[] = [];
      if (Array.isArray(linkLouvores) && linkLouvores.length > 0) {
        structuredLinks = linkLouvores.map((it: any, idx: number) => {
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
            ordem: it.ordem !== undefined ? it.ordem : idx + 1,
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
      } else if (louvores !== undefined) {
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

      // Envia atualização completa para o Google Apps Script em uma única chamada robusta
      let ultimoResultado: any = { sucesso: true, mensagem: "Escala atualizada com sucesso." };
      try {
        const fullForm = new URLSearchParams({
          action: "updateFullEscala",
          nome: user.nome.trim(),
          senha: user.rawPassword || "",
          dataEscala: targetData,
          data: targetData,
          dataCulto: targetData,
          dirigente: dirigente !== undefined ? String(dirigente).trim() : "",
          vocal: vocal !== undefined ? String(vocal).trim() : "",
          musicos: musicos !== undefined ? String(musicos).trim() : "",
          mesario: mesario !== undefined ? String(mesario).trim() : "",
          louvores: cleanLouvoresVal !== undefined ? String(cleanLouvoresVal).trim() : "",
          uniforme: uniforme !== undefined ? String(uniforme).trim() : "",
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
        console.warn("[YT SERVER DEBUG] Tentando fallback de atualização campo a campo:", gasFullErr);
        // Fallback sequencial se o endpoint full falhar
        const camposPossiveis: Array<{ campo: string; valor: any }> = [
          { campo: "louvores", valor: cleanLouvoresVal },
          { campo: "uniforme", valor: uniforme },
          { campo: "dirigente", valor: dirigente },
          { campo: "vocal", valor: vocal },
          { campo: "musicos", valor: musicos },
          { campo: "mesario", valor: mesario }
        ];
        for (const item of camposPossiveis) {
          if (item.valor !== undefined) {
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
            }).catch(() => {});
          }
        }
      }

      // Constrói objeto com os dados finais da escala
      const escalaObj: EscalaRef = {
        data: targetData,
        dirigente: dirigente !== undefined ? String(dirigente).trim() : (escalaExistente?.dirigente || ""),
        vocal: vocal !== undefined ? String(vocal).trim() : (escalaExistente?.vocal || ""),
        musicos: musicos !== undefined ? String(musicos).trim() : (escalaExistente?.musicos || ""),
        mesario: mesario !== undefined ? String(mesario).trim() : (escalaExistente?.mesario || ""),
        louvores: cleanLouvoresVal !== undefined ? String(cleanLouvoresVal).trim() : (escalaExistente?.louvores || ""),
        uniforme: uniforme !== undefined ? String(uniforme).trim() : (escalaExistente?.uniforme || "")
      };

      // Atualiza o cache local imediatamente para refletir no frontend
      if (escalaExistente) {
        if (dirigente !== undefined) escalaExistente.dirigente = escalaObj.dirigente;
        if (vocal !== undefined) escalaExistente.vocal = escalaObj.vocal;
        if (musicos !== undefined) escalaExistente.musicos = escalaObj.musicos;
        if (mesario !== undefined) escalaExistente.mesario = escalaObj.mesario;
        if (cleanLouvoresVal !== undefined) escalaExistente.louvores = escalaObj.louvores;
        if (uniforme !== undefined) escalaExistente.uniforme = escalaObj.uniforme;
      } else {
        cachedEscalas.push({
          ...escalaObj
        });
      }

      if (cachedIntegrantes.length === 0) {
        await syncEscalaDataBackground();
      }

      // 1. Notificações individuais para novos integrantes escalados ou mudanças de função
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
            titulo: "Nova Escala para Você",
            mensagem: `A Paz ${mNovo.nome}! Você foi escalado(a) para o culto do dia ${targetData} como ${detalheFuncao}!`,
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
              const roleHash = crypto.createHash("md5").update(detalheNovo).digest("hex").substring(0, 6);
              const normNome = normalizarNome(mNovo.nome).replace(/\s+/g, "_");
              const eventoId = `ESCALA_ALTERADA_${cleanDataKey}_${normNome}_${roleHash}`;
              criarNotificacaoSeNaoExiste({
                destinatario: mNovo.nome,
                tipo: "ESCALA",
                titulo: "Função Alterada na Escala",
                mensagem: `A Paz ${mNovo.nome}! Sua função na escala do dia ${targetData} foi alterada para ${detalheNovo}.`,
                eventoId,
                origem: "APP"
              });
            }
          }
        }
      }

      // 2. Dispara notificação de louvores/uniformes para TODOS os escalados caso tenham sido definidos
      if (louvores !== undefined || uniforme !== undefined || (Array.isArray(linkLouvores) && linkLouvores.length > 0)) {
        processarNotificacaoLouvoresUniformes({
          dataEscala: targetData,
          louvores: escalaObj.louvores,
          uniforme: escalaObj.uniforme,
          escala: escalaObj,
          integrantes: cachedIntegrantes
        });
      }

      // Dispara sincronização em background
      syncEscalaDataBackground();

      res.json({
        ...ultimoResultado,
        sucesso: true,
        mensagem: ultimoResultado?.mensagem || "Escala atualizada com sucesso.",
        linkLouvores: structuredLinks,
        escala: escalaObj
      });
    } catch (error: any) {
      console.error("Erro ao atualizar escala:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao atualizar escala no Google Apps Script."
      });
    }
  };

  app.put("/api/escala/completa", authenticateToken, requireDirigenteOuLider, handleUpdateEscalaCompleta);
  app.post("/api/escala/completa", authenticateToken, requireDirigenteOuLider, handleUpdateEscalaCompleta);

  // =========================================================================
  // ROTAS DE SOLICITAÇÕES DE TROCA
  // =========================================================================

  /**
   * POST /api/solicitacoes
   * Cria uma nova solicitação de substituição na planilha SOLICITAÇÕES
   */
  app.post("/api/solicitacoes", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as UserSession;
      const { dataEscala, data, dataCulto, motivo, substituto, funcao, instrumento } = req.body || {};

      const targetData = (dataEscala || data || dataCulto || "").toString().trim();
      const targetMotivo = (motivo || "").toString().trim();
      const targetSubstituto = (substituto || "").toString().trim();

      if (!targetData) {
        res.status(400).json({
          sucesso: false,
          mensagem: "Data da escala é obrigatória."
        });
        return;
      }

      if (!targetSubstituto) {
        res.status(400).json({
          sucesso: false,
          mensagem: "Substituto é obrigatório."
        });
        return;
      }

      if (!targetMotivo) {
        res.status(400).json({
          sucesso: false,
          mensagem: "Motivo da solicitação é obrigatório."
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

      // Dispara notificação oficial para os líderes
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
        console.error("Erro ao disparar notificação de solicitação:", notifErr);
      }

      res.json(result);
    } catch (error: any) {
      console.error("Erro ao criar solicitação:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao enviar solicitação ao Google Apps Script."
      });
    }
  });

  /**
   * POST /api/solicitacoes/processar e POST /api/solicitacoes/responder
   * Processa aprovação, recusa ou cancelamento de solicitação
   */
  const handleProcessarSolicitacao = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as UserSession;
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
          mensagem: "Data da escala e solicitante (quemPediu) são obrigatórios."
        });
        return;
      }

      // Normaliza a ação: APROVAR | RECUSAR | CANCELAR
      let acaoFinal: "APROVAR" | "RECUSAR" | "CANCELAR" = "APROVAR";
      if (acao) {
        acaoFinal = acao.toString().toUpperCase() as any;
      } else if (novoStatus) {
        const norm = novoStatus.toString().toUpperCase();
        if (norm === "APROVADA" || norm === "APROVAR" || norm === "AUTORIZADA") acaoFinal = "APROVAR";
        else if (norm === "RECUSADA" || norm === "RECUSAR" || norm === "REPROVADA") acaoFinal = "RECUSAR";
        else if (norm === "CANCELADA" || norm === "CANCELAR") acaoFinal = "CANCELAR";
      }

      // Validação de permissões: Líder pode aprovar/recusar/cancelar; Integrante pode apenas cancelar sua própria solicitação
      if (acaoFinal === "APROVAR" || acaoFinal === "RECUSAR") {
        if (user.role !== "LIDER" && user.role !== "DIRIGENTE") {
          res.status(403).json({
            sucesso: false,
            mensagem: "Apenas líderes têm permissão para aprovar ou recusar solicitações."
          });
          return;
        }
      } else if (acaoFinal === "CANCELAR") {
        if (
          user.role !== "LIDER" &&
          user.nome.trim().toLowerCase() !== targetQuemPediu.toLowerCase()
        ) {
          res.status(403).json({
            sucesso: false,
            mensagem: "Você só pode cancelar suas próprias solicitações."
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

      // Dispara notificações para solicitante e substituto se aprovado ou recusado
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
        console.error("Erro ao disparar notificação de decisão da solicitação:", notifErr);
      }

      res.json(result);
    } catch (error: any) {
      console.error("Erro ao processar solicitação:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao processar solicitação no Google Apps Script."
      });
    }
  };

  app.post("/api/solicitacoes/processar", authenticateToken, handleProcessarSolicitacao);
  app.post("/api/solicitacoes/responder", authenticateToken, handleProcessarSolicitacao);

  // =========================================================================
  // ROTAS DE RECADOS E MURAL
  // =========================================================================

  // Helper para extrair ID do Google Drive de URLs variadas
  const extractDriveFileId = (input: string): string | null => {
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

  /**
   * GET /api/recados/imagem e GET /api/recados/download
   * Proxy e download seguro de imagens de recados (Drive, URLs externas e Base64)
   * Resolve completamente problemas de CORS, restrições do Drive e compatibilidade com mobile/PWA
   */
  const handleProxyImagemRecado = async (req: Request, res: Response) => {
    try {
      const urlQuery = (req.query.url || req.query.src || req.query.id || req.body?.url) as string;
      const isDownload = req.query.download === "true" || req.path.includes("/download");
      const rawFilename = (req.query.filename as string) || "imagem_recado";
      const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9_.-]/g, "_");

      if (!urlQuery) {
        res.status(400).json({ sucesso: false, mensagem: "Parâmetro 'url' ou 'id' é obrigatório." });
        return;
      }

      // Se for Data URL Base64 direta
      if (urlQuery.startsWith("data:image/")) {
        const matches = urlQuery.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          const ext = contentType.split("/")[1]?.split("+")[0] || "jpg";
          const safeFilename = cleanFilename.endsWith(`.${ext}`) ? cleanFilename : `${cleanFilename}.${ext}`;

          res.setHeader("Content-Type", contentType);
          res.setHeader("Content-Length", buffer.length);
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cache-Control", "public, max-age=86400");
          if (isDownload) {
            res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
          }
          res.send(buffer);
          return;
        }
      }

      const driveId = extractDriveFileId(urlQuery);
      let targetUrl = urlQuery;

      if (driveId) {
        // Usa URL direta do CDN Googleusercontent
        targetUrl = `https://lh3.googleusercontent.com/d/${driveId}`;
      }

      let fetchResponse = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
      });

      // Fallback para download do Drive caso o CDN retorne não-ok
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
          mensagem: `Não foi possível carregar a imagem do recado: ${fetchResponse.statusText}`
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
    } catch (error: any) {
      console.error("Erro no proxy de imagem de recado:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro ao processar imagem."
      });
    }
  };

  app.get("/api/recados/imagem", handleProxyImagemRecado);
  app.get("/api/recados/download", handleProxyImagemRecado);

  /**
   * POST /api/recados (Publicar novo recado)
   */
  app.post("/api/recados", authenticateToken, requireLider, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as UserSession;
      const { titulo, mensagem, imagemBase64, imagemUrl } = req.body;

      if (!titulo || !mensagem) {
        res.status(400).json({
          sucesso: false,
          mensagem: "Título e mensagem do recado são obrigatórios."
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

      // Dispara notificação oficial para todos os integrantes
      try {
        if (cachedIntegrantes.length === 0) {
          syncEscalaDataBackground();
        }
        const recadoId = result?.id || result?.recado?.id || `rec_${Date.now()}`;
        processarNotificacaoNovoRecado(recadoId, cachedIntegrantes);
      } catch (notifErr) {
        console.error("Erro ao disparar notificação de novo recado:", notifErr);
      }

      res.json(result);
    } catch (error: any) {
      console.error("Erro ao publicar recado:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao salvar recado no Google Apps Script."
      });
    }
  });

  /**
   * PUT /api/recados/:id ou POST /api/recados/editar (Editar recado existente)
   */
  const handleEditarRecado = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as UserSession;
      const { id, titulo, mensagem, imagemBase64, imagemUrl, ativo } = req.body;
      const recadoId = req.params.id || id;

      if (!recadoId || !titulo || !mensagem) {
        res.status(400).json({
          sucesso: false,
          mensagem: "ID, título e mensagem do recado são obrigatórios."
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
    } catch (error: any) {
      console.error("Erro ao editar recado:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao atualizar recado no Google Apps Script."
      });
    }
  };

  app.put("/api/recados/:id", authenticateToken, requireLider, handleEditarRecado);
  app.post("/api/recados/editar", authenticateToken, requireLider, handleEditarRecado);

  /**
   * DELETE /api/recados/:id ou POST /api/recados/excluir (Excluir recado)
   */
  const handleExcluirRecado = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as UserSession;
      const recadoId = req.params.id || req.body.id;

      if (!recadoId) {
        res.status(400).json({
          sucesso: false,
          mensagem: "ID do recado é obrigatório."
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
    } catch (error: any) {
      console.error("Erro ao excluir recado:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao excluir recado no Google Apps Script."
      });
    }
  };

  app.delete("/api/recados/:id", authenticateToken, requireLider, handleExcluirRecado);
  app.post("/api/recados/excluir", authenticateToken, requireLider, handleExcluirRecado);

  // =========================================================================
  // ROTAS DE NOTIFICAÇÕES (Sincronização & Persistência)
  // =========================================================================

  /**
   * GET /api/notificacoes
   */
  app.get("/api/notificacoes", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as UserSession;

      // Tenta obter notificações adicionais do Google Apps Script
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
          const data: any = await gasResponse.json();
          const rawList = Array.isArray(data.notificacoes)
            ? data.notificacoes
            : Array.isArray(data)
            ? data
            : [];
          if (rawList.length > 0) {
            mergeGasNotifications(rawList);
          }
        }
      } catch (gasErr) {
        // Usa as notificações locais persistentes se o GAS falhar
      }

      // Retorna notificações do usuário do repositório local resiliente
      const userNotificacoes = getNotificacoesParaUsuario(user.nome);

      res.json({
        sucesso: true,
        notificacoes: userNotificacoes,
        mensagem: `${userNotificacoes.length} notificação(ões) encontrada(s).`
      });
    } catch (error: any) {
      console.error("Erro ao buscar notificações:", error);
      const fallbackList = getNotificacoesParaUsuario(((req as any).user as UserSession)?.nome || "");
      res.json({
        sucesso: true,
        notificacoes: fallbackList,
        mensagem: `${fallbackList.length} notificação(ões) encontrada(s).`
      });
    }
  });

  /**
   * POST /api/notificacoes/:id/lida ou PUT /api/notificacoes/:id/lida
   */
  const handleMarcarNotifLida = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as UserSession;
      const notifId = req.params.id;

      if (!notifId || typeof notifId !== "string" || !notifId.trim()) {
        res.status(400).json({
          sucesso: false,
          mensagem: "ID da notificação é obrigatório."
        });
        return;
      }

      // Marca localmente
      marcarComoLidaLocal(notifId.trim());

      // Repassa ao Google Apps Script de forma resiliente
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
        // Registro local já foi atualizado com sucesso
      }

      res.json({
        sucesso: true,
        mensagem: "Notificação marcada como lida."
      });
    } catch (error: any) {
      console.error("Erro ao marcar notificação como lida:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao marcar notificação."
      });
    }
  };

  app.put("/api/notificacoes/:id/lida", authenticateToken, handleMarcarNotifLida);
  app.post("/api/notificacoes/:id/lida", authenticateToken, handleMarcarNotifLida);

  /**
   * POST /api/notificacoes/marcar-todas-lidas
   */
  app.post("/api/notificacoes/marcar-todas-lidas", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as UserSession;

      // Marca localmente
      marcarTodasComoLidasLocal(user.nome);

      // Repassa ao Google Apps Script de forma resiliente
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
        // Registro local já atualizado com sucesso
      }

      res.json({
        sucesso: true,
        mensagem: "Todas as notificações foram marcadas como lidas."
      });
    } catch (error: any) {
      console.error("Erro ao marcar todas as notificações como lidas:", error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || "Erro interno ao marcar notificações."
      });
    }
  });

  function getRenderedServiceWorker(): string {
    const swPath = path.join(process.cwd(), "public", "sw.js");
    let swContent = "";
    try {
      swContent = fs.readFileSync(swPath, "utf-8");
    } catch {
      const altPath = path.join(process.cwd(), "dist", "sw.js");
      if (fs.existsSync(altPath)) {
        swContent = fs.readFileSync(altPath, "utf-8");
      }
    }

    const apiKey = process.env.VITE_FIREBASE_API_KEY || "AIzaSyBy56kEmfcHWNQ7t15bF2RtLb5CkdHwLK4";
    const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN || "escala-louvor-2.firebaseapp.com";
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || "escala-louvor-2";
    const messagingSenderId = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "979295298532";
    const appId = process.env.VITE_FIREBASE_APP_ID || "1:979295298532:web:8093b4212b9fff6d0b9df1";

    return swContent
      .replace(/__FIREBASE_API_KEY__/g, apiKey)
      .replace(/__FIREBASE_AUTH_DOMAIN__/g, authDomain)
      .replace(/__FIREBASE_PROJECT_ID__/g, projectId)
      .replace(/__FIREBASE_MESSAGING_SENDER_ID__/g, messagingSenderId)
      .replace(/__FIREBASE_APP_ID__/g, appId)
      .replace(/PLACEHOLDER_KEY/g, apiKey);
  }

  app.get("/sw.js", (req, res) => {
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.send(getRenderedServiceWorker());
  });

  app.get("/api/sw.js", (req, res) => {
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.send(getRenderedServiceWorker());
  });

  return app;
}
