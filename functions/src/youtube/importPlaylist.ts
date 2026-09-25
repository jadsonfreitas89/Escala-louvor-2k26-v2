import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { fetchYouTubePlaylist, extractPlaylistId } from "../../src/server/youtube";

// Inicializa Firebase Admin SDK se ainda não inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud Function HTTPS Callable / Express Handler para importação segura de playlists do YouTube
 * Exige autenticação Firebase Auth e consome a YouTube Data API v3 utilizando secrets/variáveis de ambiente
 */
export const importYouTubePlaylist = functions
  .runWith({
    secrets: ["YOUTUBE_API_KEY"]
  })
  .https.onCall(async (data, context) => {
    // 1. Validação de Autenticação Firebase
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Acesso não autorizado. É necessário estar autenticado para importar playlists."
      );
    }

    const { url, playlistId: rawPlaylistId, igrejaId } = data || {};
    const input = (url || rawPlaylistId || "").toString().trim();

    if (!input) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "O link ou ID da playlist do YouTube é obrigatório."
      );
    }

    // 2. Extração e validação do ID da playlist
    const playlistId = extractPlaylistId(input);
    if (!playlistId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "O link informado não parece ser uma playlist válida do YouTube."
      );
    }

    // 3. Consulta à YouTube Data API v3
    const apiKey = process.env.YOUTUBE_API_KEY;
    const result = await fetchYouTubePlaylist(playlistId, apiKey);

    if (!result.success || !result.data) {
      if (result.statusCode === 404) {
        throw new functions.https.HttpsError(
          "not-found",
          "Não foi possível encontrar essa playlist. Verifique o link e tente novamente."
        );
      }
      throw new functions.https.HttpsError(
        "internal",
        result.errorMessage || "Não foi possível importar a playlist no momento. Tente novamente."
      );
    }

    return {
      sucesso: true,
      data: result.data,
      dados: result.data
    };
  });
