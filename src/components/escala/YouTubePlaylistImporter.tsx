import React, { useState } from 'react';
import {
  X,
  Youtube,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  ExternalLink,
  Plus,
  Music2,
  RefreshCw,
  Check,
  Ban
} from 'lucide-react';
import { YouTubePlaylistDetails, YouTubePlaylistItem, LouvorItem } from '../../types';
import { youtubeService } from '../../services/youtubeService';
import { Button } from '../ui/Button';

interface YouTubePlaylistImporterProps {
  isOpen: boolean;
  onClose: () => void;
  existingLouvores?: Array<{ louvor?: string; youtubeUrl?: string; youtubeVideoId?: string }>;
  onAddSelected: (
    items: Array<{ louvor: string; youtubeUrl: string; youtubeVideoId?: string; playlistId?: string; playlistTitle?: string }>,
    summaryMessage: string
  ) => void;
}

export const YouTubePlaylistImporter: React.FC<YouTubePlaylistImporterProps> = ({
  isOpen,
  onClose,
  existingLouvores = [],
  onAddSelected
}) => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playlistData, setPlaylistData] = useState<YouTubePlaylistDetails | null>(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  // Extrai IDs de vídeos já existentes na escala para evitar duplicações
  const existingVideoIds = new Set<string>();
  const existingUrls = new Set<string>();

  existingLouvores.forEach((item) => {
    if (item.youtubeVideoId) {
      existingVideoIds.add(item.youtubeVideoId);
    }
    if (item.youtubeUrl) {
      existingUrls.add(item.youtubeUrl.toLowerCase().trim());
      const match = item.youtubeUrl.match(/(?:v=|youtu\.be\/|\/v\/|embed\/)([a-zA-Z0-9_-]{11})/i);
      if (match && match[1]) {
        existingVideoIds.add(match[1]);
      }
    }
  });

  const handleSearchPlaylist = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const trimmed = playlistUrl.trim();
    if (!trimmed) {
      setErrorMessage('Por favor, informe o link da playlist do YouTube.');
      return;
    }

    const playlistId = youtubeService.extractPlaylistId(trimmed);
    if (!playlistId) {
      setErrorMessage('O link informado não parece ser uma playlist válida do YouTube.');
      return;
    }

    setIsLoading(true);
    setPlaylistData(null);
    setSelectedVideoIds(new Set());

    try {
      const res = await youtubeService.fetchPlaylist(trimmed);
      if (!res.sucesso || !res.data) {
        setErrorMessage(res.mensagem || 'Não foi possível importar a playlist no momento. Tente novamente.');
        return;
      }

      setPlaylistData(res.data);

      // Por padrão, pré-seleciona todos os vídeos válidos que ainda NÃO estão na escala
      const initialSelected = new Set<string>();
      res.data.items.forEach((item) => {
        if (item.isAvailable !== false && item.videoId && !existingVideoIds.has(item.videoId)) {
          initialSelected.add(item.videoId);
        }
      });
      setSelectedVideoIds(initialSelected);
    } catch (err: any) {
      console.error('Erro ao buscar playlist:', err);
      setErrorMessage('Não foi possível importar a playlist no momento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelectVideo = (videoId: string, isAvailable: boolean = true) => {
    if (!isAvailable) return;
    const next = new Set(selectedVideoIds);
    if (next.has(videoId)) {
      next.delete(videoId);
    } else {
      next.add(videoId);
    }
    setSelectedVideoIds(next);
  };

  const handleSelectAll = () => {
    if (!playlistData) return;
    const next = new Set<string>();
    playlistData.items.forEach((item) => {
      if (item.isAvailable !== false && item.videoId) {
        next.add(item.videoId);
      }
    });
    setSelectedVideoIds(next);
  };

  const handleDeselectAll = () => {
    setSelectedVideoIds(new Set());
  };

  const handleConfirmAddSelected = () => {
    if (!playlistData) return;

    const selectedItems = playlistData.items.filter(
      (it) => selectedVideoIds.has(it.videoId) && it.isAvailable !== false
    );

    if (selectedItems.length === 0) {
      setErrorMessage('Selecione ao menos um louvor para adicionar à escala.');
      return;
    }

    let addedCount = 0;
    let duplicateCount = 0;
    const toAdd: Array<{
      louvor: string;
      youtubeUrl: string;
      youtubeVideoId?: string;
      playlistId?: string;
      playlistTitle?: string;
    }> = [];

    selectedItems.forEach((item) => {
      const isDuplicate =
        (item.videoId && existingVideoIds.has(item.videoId)) ||
        (item.youtubeUrl && existingUrls.has(item.youtubeUrl.toLowerCase().trim()));

      if (isDuplicate) {
        duplicateCount++;
      } else {
        addedCount++;
        toAdd.push({
          louvor: item.title,
          youtubeUrl: item.youtubeUrl,
          youtubeVideoId: item.videoId,
          playlistId: playlistData.playlistId,
          playlistTitle: playlistData.playlistTitle
        });
      }
    });

    let summary = '';
    if (addedCount > 0 && duplicateCount > 0) {
      summary = `${addedCount} ${addedCount === 1 ? 'louvor adicionado' : 'louvores adicionados'} à escala (${duplicateCount} já ${duplicateCount === 1 ? 'estava' : 'estavam'} na escala e não ${duplicateCount === 1 ? 'foi duplicado' : 'foram duplicados'}).`;
    } else if (addedCount > 0) {
      summary = `${addedCount} ${addedCount === 1 ? 'louvor adicionado' : 'louvores adicionados'} à escala.`;
    } else {
      summary = `${duplicateCount} ${duplicateCount === 1 ? 'louvor selecionado já estava' : 'louvores selecionados já estavam'} na escala e não ${duplicateCount === 1 ? 'foi duplicado' : 'foram duplicados'}.`;
    }

    onAddSelected(toAdd, summary);
    handleClose();
  };

  const handleClose = () => {
    if (isLoading) return;
    setPlaylistUrl('');
    setErrorMessage(null);
    setPlaylistData(null);
    setSelectedVideoIds(new Set());
    onClose();
  };

  const availableItemsCount = playlistData
    ? playlistData.items.filter((it) => it.isAvailable !== false).length
    : 0;

  return (
    <div
      id="modal-youtube-playlist-backdrop"
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) handleClose();
      }}
    >
      <div
        id="modal-youtube-playlist-container"
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-zinc-800 bg-zinc-900/95">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-red-600/15 border border-red-500/30 text-red-500 shadow-inner">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-zinc-100 flex items-center gap-2">
                Importar Playlist do YouTube
              </h3>
              <p className="text-xs text-zinc-400">
                Selecione os louvores da playlist para adicionar à escala do culto
              </p>
            </div>
          </div>

          <button
            id="btn-close-modal-youtube"
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
          {/* Formulário de Busca da Playlist */}
          <form onSubmit={handleSearchPlaylist} className="space-y-3">
            <label
              htmlFor="input-playlist-url"
              className="block text-xs font-bold text-zinc-300 uppercase tracking-wider"
            >
              Link da playlist do YouTube
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  id="input-playlist-url"
                  type="text"
                  value={playlistUrl}
                  onChange={(e) => {
                    setPlaylistUrl(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Cole aqui o link da playlist (ex: https://www.youtube.com/playlist?list=...)"
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-zinc-100 text-xs sm:text-sm font-medium transition-all"
                />
              </div>

              <Button
                id="btn-buscar-playlist"
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={isLoading || !playlistUrl.trim()}
                className="px-5 py-3 rounded-2xl text-xs font-black shrink-0 bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
              >
                {isLoading ? (
                  <span>Buscando playlist...</span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Search size={15} />
                    Buscar playlist
                  </span>
                )}
              </Button>
            </div>

            <p className="text-[11px] text-zinc-400">
              Exemplo: <code>https://www.youtube.com/playlist?list=PLxxxxxxxxxxxxxx</code>
            </p>
          </form>

          {/* Mensagem de Erro Amigável */}
          {errorMessage && (
            <div
              id="alert-error-youtube"
              className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="font-semibold leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Estado de Carregamento */}
          {isLoading && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3 bg-zinc-950/40 rounded-3xl border border-zinc-800/80">
              <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
              <div>
                <p className="text-sm font-bold text-zinc-100">Buscando playlist...</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Consultando vídeos e louvores da playlist no YouTube
                </p>
              </div>
            </div>
          )}

          {/* Resultado: Playlist Encontrada */}
          {!isLoading && playlistData && (
            <div className="space-y-4 animate-in fade-in">
              {/* Header do Resultado */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {playlistData.thumbnailUrl ? (
                    <img
                      src={playlistData.thumbnailUrl}
                      alt={playlistData.playlistTitle}
                      className="w-14 h-14 rounded-xl object-cover border border-zinc-800 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-red-500">
                      <Music2 className="w-6 h-6" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                      Playlist encontrada
                    </span>
                    <h4 className="text-sm md:text-base font-bold text-zinc-100 truncate">
                      {playlistData.playlistTitle}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {playlistData.items.length} {playlistData.items.length === 1 ? 'vídeo' : 'vídeos'} encontrados
                    </p>
                  </div>
                </div>

                {/* Ações Rápidas de Seleção */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    <CheckSquare size={13} className="text-orange-400" />
                    <span>Selecionar todos</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Square size={13} />
                    <span>Desmarcar todos</span>
                  </button>
                </div>
              </div>

              {/* Lista dos Vídeos */}
              {playlistData.items.length === 0 ? (
                <div className="p-6 rounded-2xl bg-zinc-950/40 border border-zinc-800 text-center text-xs text-zinc-400">
                  Nenhum vídeo disponível foi encontrado nesta playlist.
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {playlistData.items.map((item, idx) => {
                    const isSelected = selectedVideoIds.has(item.videoId);
                    const isUnavailable = item.isAvailable === false;
                    const isAlreadyInEscala =
                      item.videoId && existingVideoIds.has(item.videoId);

                    return (
                      <div
                        key={item.videoId || `item-${idx}`}
                        id={`playlist-video-item-${idx}`}
                        onClick={() => {
                          if (!isUnavailable) {
                            handleToggleSelectVideo(item.videoId, !isUnavailable);
                          }
                        }}
                        className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                          isUnavailable
                            ? 'bg-zinc-950/30 border-zinc-800/40 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-orange-500/10 border-orange-500/40 ring-1 ring-orange-500/20'
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Checkbox */}
                          <div className="shrink-0">
                            {isUnavailable ? (
                              <div className="w-5 h-5 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500">
                                <Ban size={12} />
                              </div>
                            ) : isSelected ? (
                              <div className="w-5 h-5 rounded-lg bg-orange-500 border border-orange-400 flex items-center justify-center text-zinc-950">
                                <Check size={13} strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-lg bg-zinc-900 border border-zinc-700" />
                            )}
                          </div>

                          {/* Miniatura do Vídeo */}
                          {item.thumbnailUrl && (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-12 h-8 rounded-lg object-cover bg-zinc-900 border border-zinc-800 shrink-0 hidden sm:block"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          )}

                          {/* Informações do Louvor */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-extrabold text-zinc-400">
                                #{item.position || idx + 1}
                              </span>
                              {isAlreadyInEscala && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  Já na escala
                                </span>
                              )}
                              {isUnavailable && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                                  Vídeo indisponível
                                </span>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm font-semibold text-zinc-100 truncate mt-0.5">
                              {item.title}
                            </p>
                          </div>
                        </div>

                        {/* Link Direto para YouTube */}
                        {item.youtubeUrl && !isUnavailable && (
                          <a
                            href={item.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 text-[11px] font-bold transition-all shrink-0 cursor-pointer shadow-sm"
                            title="Ouvir vídeo no YouTube"
                          >
                            <Youtube className="w-3.5 h-3.5 text-red-500" />
                            <span className="hidden sm:inline">YouTube</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 md:p-5 border-t border-zinc-800 bg-zinc-900/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 font-medium text-center sm:text-left">
            {playlistData ? (
              <span>
                <strong className="text-orange-400 font-black">{selectedVideoIds.size}</strong> de{' '}
                {availableItemsCount} louvores selecionados
              </span>
            ) : (
              <span>Insira a URL da playlist acima para buscar as músicas.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-all disabled:opacity-50"
            >
              Cancelar
            </button>

            {playlistData && (
              <Button
                id="btn-adicionar-selecionados-escala"
                type="button"
                variant="primary"
                onClick={handleConfirmAddSelected}
                disabled={isLoading || selectedVideoIds.size === 0}
                className="px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 shadow-lg shadow-orange-500/15"
              >
                <Plus size={16} />
                <span>Adicionar selecionados à escala ({selectedVideoIds.size})</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
