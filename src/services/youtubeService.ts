import { YouTubePlaylistDetails } from '../types';
import { apiService } from './api';

export interface FetchPlaylistResponse {
  sucesso: boolean;
  mensagem?: string;
  data?: YouTubePlaylistDetails;
}

class YouTubeService {
  /**
   * Extrai e valida o ID da playlist a partir de uma URL ou texto
   */
  public extractPlaylistId(input: string): string | null {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();

    // Caso 1: ID direto (ex: PLxxxx, RDxxxx, OLAK5uy_xxxx)
    if (/^[a-zA-Z0-9_-]{10,64}$/.test(trimmed) && !trimmed.includes('.') && !trimmed.includes('/')) {
      return trimmed;
    }

    // Caso 2: URL completa
    try {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const listParam = parsed.searchParams.get('list');
      if (listParam && listParam.trim().length > 0) {
        return listParam.trim();
      }
    } catch (e) {
      // Ignora falha de parse
    }

    // Caso 3: Regex na query string
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
    if (match && match[1]) {
      return match[1].trim();
    }

    return null;
  }

  /**
   * Busca as informações da playlist e seus vídeos no backend seguro
   */
  public async fetchPlaylist(urlOrId: string): Promise<FetchPlaylistResponse> {
    const cleanId = this.extractPlaylistId(urlOrId);
    if (!cleanId) {
      return {
        sucesso: false,
        mensagem: 'O link informado não parece ser uma playlist válida do YouTube.'
      };
    }

    const token = apiService.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch('/api/youtube/playlist', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url: urlOrId.trim(),
          playlistId: cleanId
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data || !data.sucesso) {
        let msg = data?.mensagem;
        if (response.status === 404) {
          msg = 'Não foi possível encontrar essa playlist. Verifique o link e tente novamente.';
        } else if (!msg) {
          msg = 'Não foi possível importar a playlist no momento. Tente novamente.';
        }
        return {
          sucesso: false,
          mensagem: msg
        };
      }

      return {
        sucesso: true,
        data: data.data || data.dados
      };
    } catch (err: any) {
      console.error('[YouTubeService] Erro ao comunicar com o servidor:', err);
      return {
        sucesso: false,
        mensagem: 'Não foi possível importar a playlist no momento. Tente novamente.'
      };
    }
  }
}

export const youtubeService = new YouTubeService();
