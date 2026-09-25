import { YouTubePlaylistDetails, YouTubePlaylistItem } from "../types";

/**
 * Utilitário de backend para integração segura com a YouTube Data API v3
 * A chave da API é mantida exclusivamente no ambiente do servidor/Cloud Function.
 */

export function extractPlaylistId(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  // Caso 1: ID direto fornecido (ex: PL1234567890abcdef ou RD... / OLAK5uy_...)
  if (/^[a-zA-Z0-9_-]{10,64}$/.test(trimmed) && !trimmed.includes(".") && !trimmed.includes("/")) {
    return trimmed;
  }

  // Caso 2: URL completa ou com parâmetros
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const listParam = parsed.searchParams.get("list");
    if (listParam && listParam.trim().length > 0) {
      return listParam.trim();
    }
  } catch (e) {
    // Falha no parser de URL nativo, tenta via regex
  }

  // Caso 3: Extração via Regex de query param ?list= ou &list=
  const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }

  return null;
}

export interface FetchPlaylistResult {
  success: boolean;
  statusCode?: number;
  errorMessage?: string;
  data?: YouTubePlaylistDetails;
}

/**
 * Consulta a YouTube Data API v3 para obter os metadados da playlist e todos os seus vídeos
 */
export async function fetchYouTubePlaylist(
  playlistId: string,
  apiKey?: string
): Promise<FetchPlaylistResult> {
  const cleanId = (playlistId || "").trim();
  if (!cleanId) {
    return {
      success: false,
      statusCode: 400,
      errorMessage: "O link informado não parece ser uma playlist válida do YouTube."
    };
  }

  const key = apiKey || process.env.YOUTUBE_API_KEY || "";
  if (!key) {
    console.warn("[YouTube API] Variável de ambiente YOUTUBE_API_KEY não configurada no backend.");
    return {
      success: false,
      statusCode: 503,
      errorMessage: "Não foi possível importar a playlist no momento. Tente novamente."
    };
  }

  try {
    // 1. Obter detalhes da playlist (título, descrição, thumbnail)
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
          errorMessage: "Não foi possível encontrar essa playlist. Verifique o link e tente novamente."
        };
      }

      return {
        success: false,
        statusCode: 502,
        errorMessage: "Não foi possível importar a playlist no momento. Tente novamente."
      };
    }

    const playlistJson: any = await playlistRes.json();
    if (!playlistJson.items || playlistJson.items.length === 0) {
      return {
        success: false,
        statusCode: 404,
        errorMessage: "Não foi possível encontrar essa playlist. Verifique o link e tente novamente."
      };
    }

    const playlistSnippet = playlistJson.items[0].snippet || {};
    const playlistTitle = playlistSnippet.title || "Playlist do YouTube";
    const playlistThumbnail =
      playlistSnippet.thumbnails?.high?.url ||
      playlistSnippet.thumbnails?.medium?.url ||
      playlistSnippet.thumbnails?.default?.url ||
      "";

    // 2. Obter os itens da playlist com suporte a paginação (nextPageToken)
    let allItems: YouTubePlaylistItem[] = [];
    let nextPageToken: string | undefined = undefined;
    let pageCount = 0;
    const maxPages = 10; // Suporta até 500 itens com segurança de cota

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
        console.error(`[YouTube API] Erro ao buscar itens da página ${pageCount} (${itemsRes.status}):`, errText);
        break;
      }

      const itemsJson: any = await itemsRes.json();
      const rawItems = itemsJson.items || [];

      for (const item of rawItems) {
        const snippet = item.snippet || {};
        const contentDetails = item.contentDetails || {};

        const videoId = snippet.resourceId?.videoId || contentDetails.videoId || "";
        const rawTitle = (snippet.title || "").trim();

        // Identifica vídeos privados, deletados ou indisponíveis
        const isUnavailable =
          !videoId ||
          rawTitle === "Private video" ||
          rawTitle === "Deleted video" ||
          rawTitle === "Vídeo privado" ||
          rawTitle === "Vídeo excluído";

        const position = typeof snippet.position === "number" ? snippet.position + 1 : allItems.length + 1;
        const thumbnail =
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "");

        allItems.push({
          videoId: videoId,
          title: isUnavailable ? "Vídeo indisponível" : rawTitle || "Louvor sem título",
          youtubeUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
          thumbnailUrl: thumbnail,
          position: position,
          playlistId: cleanId,
          isAvailable: !isUnavailable,
          unavailableReason: isUnavailable ? "Vídeo privado ou removido no YouTube" : undefined
        });
      }

      nextPageToken = itemsJson.nextPageToken;
    } while (nextPageToken && pageCount < maxPages);

    return {
      success: true,
      data: {
        playlistId: cleanId,
        playlistTitle: playlistTitle,
        itemCount: allItems.length,
        thumbnailUrl: playlistThumbnail,
        items: allItems
      }
    };
  } catch (err: any) {
    console.error("[YouTube API] Exceção inesperada:", err);
    return {
      success: false,
      statusCode: 500,
      errorMessage: "Não foi possível importar a playlist no momento. Tente novamente."
    };
  }
}
