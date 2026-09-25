import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  Shirt,
  Music,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle2,
  Info,
  Lock,
  Youtube,
  Search,
  ExternalLink,
  Edit3,
  Check,
  RotateCcw,
  ListMusic
} from 'lucide-react';
import { Escala, Integrante, LouvorItem } from '../../types';
import { apiService } from '../../services/api';
import {
  getTituloCulto,
  getDiaSemanaExtenso,
  getLouvoresForEscala,
  isValidYouTubeUrl,
  getCleanYouTubeUrl,
  getYouTubeId,
  formatLouvoresListToText,
  formatLouvoresListToCleanText,
  parseLouvorLine,
  cleanDateString
} from '../../utils/cultoUtils';
import { Button } from '../ui/Button';
import { YouTubePlaylistImporter } from './YouTubePlaylistImporter';

interface EditEscalaModalProps {
  escala: Escala;
  linkLouvores?: LouvorItem[];
  integrantes: Integrante[];
  isLider: boolean;
  isDirigente: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface SongEntry {
  id: string;
  louvor: string;
  youtubeUrl: string;
  youtubeVideoId?: string;
  playlistId?: string;
  playlistTitle?: string;
  thumbnailUrl?: string;
}

const UNIFORME_PRESETS = [
  'CAMISA BRANCA E GRAVATA AZUL',
  'CAMISA BRANCA E GRAVATA VERMELHA',
  'CAMISA BRANCA E GRAVATA AMARELA',
  'CAMISA PRETA GRAVATA VERDE',
  'CAMISA PRETA',
  'CAMISA AZUL MARINHO',
  'SOCIAL COMPLETO'
];

export const EditEscalaModal: React.FC<EditEscalaModalProps> = ({
  escala,
  linkLouvores = [],
  integrantes,
  isLider,
  isDirigente,
  onClose,
  onSuccess
}) => {
  const tituloCulto = getTituloCulto(escala.data);
  const diaSemana = getDiaSemanaExtenso(escala.data);

  // Form states
  const [dirigente, setDirigente] = useState(escala.dirigente || '');
  const [selectedVocal, setSelectedVocal] = useState<string[]>([]);
  const [selectedMusicos, setSelectedMusicos] = useState<string[]>([]);
  const [mesario, setMesario] = useState(escala.mesario || '');
  const [uniforme, setUniforme] = useState(escala.uniforme || '');

  // Louvores handling
  const [louvoresList, setLouvoresList] = useState<SongEntry[]>([]);
  const [songNameInput, setSongNameInput] = useState('');
  const [songYoutubeInput, setSongYoutubeInput] = useState('');
  const [editingSongIndex, setEditingSongIndex] = useState<number | null>(null);
  const [rawLouvoresText, setRawLouvoresText] = useState(escala.louvores || '');
  const [louvorEditorMode, setLouvorEditorMode] = useState<'list' | 'text'>('list');

  // YouTube Playlist Importer Modal state
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [importFeedbackMsg, setImportFeedbackMsg] = useState<string | null>(null);

  // Helpers & Feedback
  const [youtubeSearchTip, setYoutubeSearchTip] = useState<string | null>(null);
  const [inputUrlError, setInputUrlError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parse existing vocal, musicos and louvores on mount
  useEffect(() => {
    setDirigente(escala.dirigente || '');
    setMesario(escala.mesario || '');
    setUniforme(escala.uniforme || '');
    setRawLouvoresText(escala.louvores || '');

    // Parse vocal names
    if (escala.vocal) {
      const vocals = escala.vocal
        .split(/[,X]/i)
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
      setSelectedVocal(vocals);
    } else {
      setSelectedVocal([]);
    }

    // Parse musicos names
    if (escala.musicos) {
      const musicos = escala.musicos
        .split(/[,X]/i)
        .map((m) => m.trim().split('(')[0].trim())
        .filter((m) => m.length > 0);
      setSelectedMusicos(musicos);
    } else {
      setSelectedMusicos([]);
    }

    // Parse louvores into structured list with youtube links
    const parsed = getLouvoresForEscala(escala.data, linkLouvores, escala.louvores);
    if (parsed.length > 0) {
      setLouvoresList(
        parsed.map((p, idx) => {
          const ytVideoId = p.youtubeVideoId || getYouTubeId(p.link_youtube || p.linkYoutube || p.youtubeUrl) || undefined;
          const rawUrl = p.link_youtube || p.linkYoutube || p.youtubeUrl || (ytVideoId ? `https://www.youtube.com/watch?v=${ytVideoId}` : '');
          const cleanUrl = getCleanYouTubeUrl(rawUrl) || (ytVideoId ? `https://www.youtube.com/watch?v=${ytVideoId}` : '');

          return {
            id: p.id || `song-${idx}-${Date.now()}`,
            louvor: p.louvor || p.titulo || '',
            youtubeUrl: cleanUrl,
            youtubeVideoId: ytVideoId,
            playlistId: p.playlistId,
            playlistTitle: p.playlistTitle,
            thumbnailUrl: p.thumbnailUrl || (ytVideoId ? `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg` : undefined)
          };
        })
      );
    } else {
      setLouvoresList([]);
    }
  }, [escala, linkLouvores]);

  // Validação em tempo real da URL do YouTube digitada
  const isCurrentUrlValid = songYoutubeInput.trim().length === 0 || isValidYouTubeUrl(songYoutubeInput);

  const handleSearchYouTube = () => {
    const query = songNameInput.trim();
    const targetUrl = query
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' louvor gospel')}`
      : 'https://www.youtube.com';

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    setYoutubeSearchTip('Pesquisa aberta no YouTube! Basta copiar o link do vídeo e colar no campo de link.');
    setTimeout(() => setYoutubeSearchTip(null), 7000);
  };

  const handleSaveSongToList = () => {
    setInputUrlError(null);
    const cleanName = songNameInput.trim();
    if (!cleanName) {
      return;
    }

    const rawUrl = songYoutubeInput.trim();
    let cleanUrl = '';

    // Se o usuário preencheu o campo do YouTube, valida com rigor
    if (rawUrl.length > 0) {
      const validated = getCleanYouTubeUrl(rawUrl);
      if (!validated) {
        setInputUrlError('O link fornecido não é um endereço válido do YouTube. Utilize links como youtube.com ou youtu.be, ou deixe o campo em branco.');
        return;
      }
      cleanUrl = validated;
    }

    if (editingSongIndex !== null && editingSongIndex >= 0 && editingSongIndex < louvoresList.length) {
      // Editando louvor existente
      const updated = [...louvoresList];
      updated[editingSongIndex] = {
        ...updated[editingSongIndex],
        louvor: cleanName,
        youtubeUrl: cleanUrl
      };
      setLouvoresList(updated);
      setRawLouvoresText(formatLouvoresListToText(updated));
      setEditingSongIndex(null);
    } else {
      // Adicionando novo louvor
      const newEntry: SongEntry = {
        id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        louvor: cleanName,
        youtubeUrl: cleanUrl
      };
      const updated = [...louvoresList, newEntry];
      setLouvoresList(updated);
      setRawLouvoresText(formatLouvoresListToText(updated));
    }

    // Limpa inputs
    setSongNameInput('');
    setSongYoutubeInput('');
    setInputUrlError(null);
  };

  const handleStartEditSong = (index: number) => {
    const item = louvoresList[index];
    if (!item) return;
    setEditingSongIndex(index);
    setSongNameInput(item.louvor);
    setSongYoutubeInput(item.youtubeUrl || '');
    setInputUrlError(null);
  };

  const handleCancelEditSong = () => {
    setEditingSongIndex(null);
    setSongNameInput('');
    setSongYoutubeInput('');
    setInputUrlError(null);
  };

  const handleRemoveSong = (index: number) => {
    const updated = louvoresList.filter((_, i) => i !== index);
    setLouvoresList(updated);
    setRawLouvoresText(formatLouvoresListToText(updated));
    if (editingSongIndex === index) {
      handleCancelEditSong();
    }
  };

  const handleRemoveOnlyYoutubeLink = (index: number) => {
    const updated = [...louvoresList];
    if (updated[index]) {
      updated[index] = { ...updated[index], youtubeUrl: '' };
      setLouvoresList(updated);
      setRawLouvoresText(formatLouvoresListToText(updated));
      if (editingSongIndex === index) {
        setSongYoutubeInput('');
      }
    }
  };

  const handleImportFromYouTube = (
    items: Array<{
      louvor: string;
      youtubeUrl: string;
      youtubeVideoId?: string;
      playlistId?: string;
      playlistTitle?: string;
    }>,
    summaryMessage: string
  ) => {
    const newEntries: SongEntry[] = items.map((item, idx) => ({
      id: `yt-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      louvor: item.louvor,
      youtubeUrl: item.youtubeUrl,
      youtubeVideoId: item.youtubeVideoId,
      playlistId: item.playlistId,
      playlistTitle: item.playlistTitle,
      thumbnailUrl: item.youtubeVideoId
        ? `https://img.youtube.com/vi/${item.youtubeVideoId}/hqdefault.jpg`
        : undefined
    }));

    const updated = [...louvoresList, ...newEntries];
    setLouvoresList(updated);
    setRawLouvoresText(formatLouvoresListToText(updated));
    setImportFeedbackMsg(summaryMessage);
    setTimeout(() => setImportFeedbackMsg(null), 8000);
  };

  const handleMoveSong = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= louvoresList.length) return;

    const updated = [...louvoresList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setLouvoresList(updated);
    setRawLouvoresText(formatLouvoresListToText(updated));
    if (editingSongIndex !== null) {
      handleCancelEditSong();
    }
  };

  const toggleVocalMember = (name: string) => {
    if (!isLider) return;
    if (selectedVocal.includes(name)) {
      setSelectedVocal(selectedVocal.filter((v) => v !== name));
    } else {
      setSelectedVocal([...selectedVocal, name]);
    }
  };

  const toggleMusicoMember = (name: string) => {
    if (!isLider) return;
    if (selectedMusicos.includes(name)) {
      setSelectedMusicos(selectedMusicos.filter((m) => m !== name));
    } else {
      setSelectedMusicos([...selectedMusicos, name]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Se houver um louvor digitado nos inputs que ainda não foi adicionado via botão "+", inclui automaticamente
      let currentList = [...louvoresList];
      const pendingSongName = songNameInput.trim();
      if (pendingSongName) {
        const rawUrl = songYoutubeInput.trim();
        const pendingCleanUrl = rawUrl ? getCleanYouTubeUrl(rawUrl) || '' : '';
        if (editingSongIndex !== null && editingSongIndex >= 0 && editingSongIndex < currentList.length) {
          currentList[editingSongIndex] = {
            ...currentList[editingSongIndex],
            louvor: pendingSongName,
            youtubeUrl: pendingCleanUrl
          };
        } else {
          currentList.push({
            id: `song-${Date.now()}`,
            louvor: pendingSongName,
            youtubeUrl: pendingCleanUrl
          });
        }
      }

      // Prepara lista estruturada de louvores e texto limpo (SEM links na aba ESCALA)
      let cleanLouvoresText = '';
      let structuredLouvores: LouvorItem[] = [];

      if (louvorEditorMode === 'list') {
        cleanLouvoresText = formatLouvoresListToCleanText(currentList);
        structuredLouvores = currentList
          .map((item, idx) => {
            const rawUrl = item.youtubeUrl || '';
            let cleanUrl = getCleanYouTubeUrl(rawUrl) || '';
            let ytVideoId = item.youtubeVideoId || '';
            if (!ytVideoId && cleanUrl) {
              ytVideoId = getYouTubeId(cleanUrl) || '';
            }
            if (!cleanUrl && ytVideoId) {
              cleanUrl = `https://www.youtube.com/watch?v=${ytVideoId}`;
            }

            const cleanName = (item.louvor || '').trim();

            return {
              id: item.id || `song-${escala.data.replace(/[^0-9]/g, '')}-${idx}`,
              data: escala.data,
              dataEscala: escala.data,
              ordem: idx + 1,
              louvor: cleanName,
              titulo: cleanName,
              youtubeVideoId: ytVideoId || undefined,
              videoId: ytVideoId || undefined,
              youtubeUrl: cleanUrl,
              linkYoutube: cleanUrl,
              link_youtube: cleanUrl,
              url: cleanUrl,
              playlistId: item.playlistId || '',
              playlistTitle: item.playlistTitle || '',
              thumbnailUrl: item.thumbnailUrl || (ytVideoId ? `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg` : undefined)
            };
          })
          .filter((item) => Boolean(item.louvor));
      } else {
        // Modo texto manual: extrai links de cada linha para salvar na aba correta
        const lines = rawLouvoresText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        const parsedItems = lines.map((line, idx) => parseLouvorLine(line, idx, escala.data));
        cleanLouvoresText = formatLouvoresListToCleanText(parsedItems);
        structuredLouvores = parsedItems.map((item, idx) => {
          const ytUrl = item.linkYoutube || item.youtubeUrl || item.link_youtube || (item as any).url || '';
          const ytId = item.youtubeVideoId || (item as any).videoId || getYouTubeId(ytUrl) || undefined;
          const finalUrl = ytUrl || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : '');
          return {
            ...item,
            titulo: item.louvor,
            youtubeVideoId: ytId,
            videoId: ytId,
            youtubeUrl: finalUrl,
            linkYoutube: finalUrl,
            link_youtube: finalUrl,
            url: finalUrl,
            thumbnailUrl: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : undefined,
            ordem: idx + 1
          };
        });
      }

      const cleanData = cleanDateString(escala.data);
      const payload = {
        data: cleanData,
        dataEscala: cleanData,
        dataCulto: cleanData,
        dirigente: isLider ? dirigente.trim() : (escala.dirigente || ''),
        vocal: isLider ? selectedVocal.join(' X ') : (escala.vocal || ''),
        musicos: isLider ? selectedMusicos.join(' X ') : (escala.musicos || ''),
        mesario: isLider ? mesario.trim() : (escala.mesario || ''),
        louvores: cleanLouvoresText.trim(),
        uniforme: uniforme.trim(),
        linkLouvores: structuredLouvores
      };

      const res = await apiService.updateEscalaCompleta(payload);
      if (!res.sucesso) {
        throw new Error(res.mensagem || 'Falha ao salvar as alterações da escala.');
      }

      onSuccess(res.mensagem || 'Escala e louvores atualizados com sucesso no backend!');
      onClose();
    } catch (err: any) {
      console.error('Erro ao atualizar escala:', err);
      setErrorMessage(err.message || 'Erro de comunicação ao salvar a escala.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter available members
  const dirigentesList = integrantes.filter(
    (i) => i.funcao.toLowerCase().includes('dirigente') || i.funcao.toLowerCase().includes('lider')
  );
  const vocalsList = integrantes.filter((i) => i.funcao.toLowerCase().includes('vocal'));
  const musicosList = integrantes.filter((i) => i.funcao.toLowerCase().includes('musico'));
  const mesariosList = integrantes.filter((i) => i.funcao.toLowerCase().includes('mesario'));

  return (
    <div
      id="edit-escala-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        id="edit-escala-modal"
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-zinc-800 bg-zinc-900/90">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                {tituloCulto}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300">
                {isLider ? 'Edição Completa (Líder)' : 'Edição de Louvores & Uniforme (Dirigente)'}
              </span>
            </div>
            <h3 className="text-xl font-black text-zinc-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              Editar Culto de {escala.data}
              <span className="text-xs font-normal text-zinc-400">({diaSemana})</span>
            </h3>
          </div>
          <button
            id="btn-close-edit-escala-modal"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Banner explicativo para Dirigentes */}
          {!isLider && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Como dirigente deste culto, você pode cadastrar e reordenar a lista de louvores (com links opcionais do YouTube) e a vestimenta/uniforme.
              </span>
            </div>
          )}

          {/* SEÇÃO: INTEGRANTES DA ESCALA */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <User className="w-3.5 h-3.5 text-orange-400" />
              Equipe Escalada
            </h4>

            {/* 1. Dirigente */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Dirigente do Culto</span>
                {!isLider && (
                  <span className="text-[10px] font-normal text-zinc-500 flex items-center gap-1">
                    <Lock size={10} /> Restrito ao Líder
                  </span>
                )}
              </label>
              {isLider ? (
                <select
                  id="select-dirigente"
                  value={dirigente}
                  onChange={(e) => setDirigente(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-zinc-100 text-sm font-medium transition-all"
                >
                  <option value="">Selecione o Dirigente...</option>
                  {dirigentesList.map((d) => (
                    <option key={d.nome} value={d.nome}>
                      {d.nome} ({d.funcao})
                    </option>
                  ))}
                  {dirigente && !dirigentesList.some((d) => d.nome === dirigente) && (
                    <option value={dirigente}>{dirigente}</option>
                  )}
                </select>
              ) : (
                <div className="px-4 py-2.5 rounded-2xl bg-zinc-950/40 border border-zinc-800 text-sm font-semibold text-zinc-300">
                  {dirigente || 'Não definido'}
                </div>
              )}
            </div>

            {/* 2. Vocal */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Vocal</span>
                {!isLider && (
                  <span className="text-[10px] font-normal text-zinc-500 flex items-center gap-1">
                    <Lock size={10} /> Restrito ao Líder
                  </span>
                )}
              </label>
              {isLider ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                    {vocalsList.map((v) => {
                      const isSelected = selectedVocal.includes(v.nome);
                      return (
                        <button
                          key={v.nome}
                          type="button"
                          onClick={() => toggleVocalMember(v.nome)}
                          disabled={isLoading}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-orange-500 text-zinc-950 border-orange-400 shadow-sm'
                              : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {v.nome}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[11px] text-zinc-400 pt-1">
                    Escalados: <span className="font-bold text-zinc-200">{selectedVocal.join(' X ') || 'Nenhum'}</span>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-2.5 rounded-2xl bg-zinc-950/40 border border-zinc-800 text-sm font-semibold text-zinc-300">
                  {selectedVocal.join(' X ') || 'Nenhum escalado'}
                </div>
              )}
            </div>

            {/* 3. Músicos */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Músicos</span>
                {!isLider && (
                  <span className="text-[10px] font-normal text-zinc-500 flex items-center gap-1">
                    <Lock size={10} /> Restrito ao Líder
                  </span>
                )}
              </label>
              {isLider ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                    {musicosList.map((m) => {
                      const isSelected = selectedMusicos.includes(m.nome);
                      return (
                        <button
                          key={m.nome}
                          type="button"
                          onClick={() => toggleMusicoMember(m.nome)}
                          disabled={isLoading}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-sm'
                              : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {m.nome} {m.instrumento ? `(${m.instrumento})` : ''}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[11px] text-zinc-400 pt-1">
                    Escalados: <span className="font-bold text-zinc-200">{selectedMusicos.join(' X ') || 'Nenhum'}</span>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-2.5 rounded-2xl bg-zinc-950/40 border border-zinc-800 text-sm font-semibold text-zinc-300">
                  {selectedMusicos.join(' X ') || 'Nenhum escalado'}
                </div>
              )}
            </div>

            {/* 4. Mesário */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Mesário de Som</span>
                {!isLider && (
                  <span className="text-[10px] font-normal text-zinc-500 flex items-center gap-1">
                    <Lock size={10} /> Restrito ao Líder
                  </span>
                )}
              </label>
              {isLider ? (
                <select
                  id="select-mesario"
                  value={mesario}
                  onChange={(e) => setMesario(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-zinc-100 text-sm font-medium transition-all"
                >
                  <option value="">Selecione o Mesário...</option>
                  {mesariosList.map((m) => (
                    <option key={m.nome} value={m.nome}>
                      {m.nome}
                    </option>
                  ))}
                  {mesario && !mesariosList.some((m) => m.nome === mesario) && (
                    <option value={mesario}>{mesario}</option>
                  )}
                </select>
              ) : (
                <div className="px-4 py-2.5 rounded-2xl bg-zinc-950/40 border border-zinc-800 text-sm font-semibold text-zinc-300">
                  {mesario || 'Não definido'}
                </div>
              )}
            </div>
          </div>

          {/* SEÇÃO: LOUVORES DO CULTO COM LINKS OPCIONAIS DO YOUTUBE */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-orange-400" />
                  Repertório de Louvores
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Adicione as músicas manualmente ou importe direto de uma playlist do YouTube.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Botão de Importar Playlist do YouTube */}
                <button
                  id="btn-importar-playlist-youtube"
                  type="button"
                  onClick={() => setIsYouTubeModalOpen(true)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Importar louvores diretamente de uma playlist do YouTube"
                >
                  <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>🎵 Importar playlist do YouTube</span>
                </button>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setLouvorEditorMode('list')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      louvorEditorMode === 'list'
                        ? 'bg-orange-500 text-zinc-950'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Lista
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRawLouvoresText(formatLouvoresListToText(louvoresList));
                      setLouvorEditorMode('text');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      louvorEditorMode === 'text'
                        ? 'bg-orange-500 text-zinc-950'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Texto Livre
                  </button>
                </div>
              </div>
            </div>

            {/* Feedback após importação de playlist do YouTube */}
            {importFeedbackMsg && (
              <div
                id="alert-import-feedback"
                className="flex items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="font-semibold">{importFeedbackMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setImportFeedbackMsg(null)}
                  className="text-emerald-400 hover:text-emerald-200 p-1 rounded-lg"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {louvorEditorMode === 'list' ? (
              <div className="space-y-4">
                {/* Form Card para Adicionar/Editar Louvor */}
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                      {editingSongIndex !== null ? (
                        <>
                          <Edit3 className="w-3.5 h-3.5" /> Editando Louvor #{editingSongIndex + 1}
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Adicionar Louvor Individual
                        </>
                      )}
                    </span>
                    {editingSongIndex !== null && (
                      <button
                        type="button"
                        onClick={handleCancelEditSong}
                        className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-semibold"
                      >
                        <RotateCcw className="w-3 h-3" /> Cancelar Edição
                      </button>
                    )}
                  </div>

                  {/* Campo 1: Nome da Música */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Nome da Música / Louvor <span className="text-orange-500">*</span>
                    </label>
                    <input
                      id="input-nome-louvor"
                      type="text"
                      value={songNameInput}
                      onChange={(e) => setSongNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveSongToList();
                        }
                      }}
                      placeholder="Ex: Bondade de Deus"
                      disabled={isLoading}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-zinc-100 text-sm font-medium transition-all"
                    />
                  </div>

                  {/* Campo 2: Link do YouTube (Opcional) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                        <Youtube className="w-3.5 h-3.5 text-red-500" />
                        Link do YouTube <span className="text-zinc-500 font-normal lowercase">(opcional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleSearchYouTube}
                        className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Pesquisar este louvor no YouTube"
                      >
                        <Search className="w-3 h-3" />
                        <span>Pesquisar no YouTube</span>
                      </button>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        id="input-youtube-louvor"
                        type="url"
                        value={songYoutubeInput}
                        onChange={(e) => {
                          setSongYoutubeInput(e.target.value);
                          if (inputUrlError) setInputUrlError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveSongToList();
                          }
                        }}
                        placeholder="Ex: https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                        disabled={isLoading}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border text-zinc-100 text-xs font-mono transition-all pr-24 ${
                          songYoutubeInput.trim().length > 0
                            ? isCurrentUrlValid
                              ? 'border-emerald-500/60 focus:border-emerald-500'
                              : 'border-rose-500/60 focus:border-rose-500'
                            : 'border-zinc-800 focus:border-orange-500'
                        }`}
                      />
                      {songYoutubeInput.trim().length > 0 && isCurrentUrlValid && (
                        <span className="absolute right-2.5 flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                          <Check className="w-3 h-3" /> Válido
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-400 mt-1">
                      Link do YouTube (opcional) — Adicione o vídeo caso queira disponibilizá-lo para os integrantes ouvirem na escala.
                    </p>

                    {/* Feedback da pesquisa no YouTube */}
                    {youtubeSearchTip && (
                      <div className="mt-2 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs flex items-center gap-2 animate-in fade-in">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span>{youtubeSearchTip}</span>
                      </div>
                    )}

                    {/* Erro de validação de URL se tentar salvar link inválido */}
                    {inputUrlError && (
                      <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                        <span>{inputUrlError}</span>
                      </div>
                    )}
                  </div>

                  {/* Botão de Ação do Form de Louvor */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {editingSongIndex !== null && (
                      <button
                        type="button"
                        onClick={handleCancelEditSong}
                        className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      id="btn-adicionar-louvor-lista"
                      type="button"
                      onClick={handleSaveSongToList}
                      disabled={isLoading || !songNameInput.trim()}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      {editingSongIndex !== null ? (
                        <>
                          <CheckCircle2 size={15} />
                          <span>Salvar Louvor</span>
                        </>
                      ) : (
                        <>
                          <Plus size={15} />
                          <span>Adicionar Louvor</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Lista de louvores adicionados */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Repertório Cadastrado ({louvoresList.length})
                    </span>
                    {louvoresList.length > 0 && (
                      <span className="text-[11px] text-zinc-400">
                        Use as setas para alterar a ordem dos louvores
                      </span>
                    )}
                  </div>

                  {louvoresList.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-zinc-950/40 border border-zinc-800 text-center space-y-2">
                      <p className="text-xs text-zinc-400 font-medium">
                        Nenhum louvor cadastrado para este culto.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsYouTubeModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 text-xs font-bold transition-all"
                      >
                        <Youtube className="w-3.5 h-3.5 text-red-500" />
                        <span>Importar playlist do YouTube</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {louvoresList.map((song, index) => {
                        const hasYoutube = Boolean(song.youtubeUrl);
                        const isBeingEdited = editingSongIndex === index;
                        const thumbnail =
                          song.thumbnailUrl ||
                          (song.youtubeVideoId
                            ? `https://img.youtube.com/vi/${song.youtubeVideoId}/hqdefault.jpg`
                            : undefined);

                        return (
                          <div
                            key={song.id || `song-${index}`}
                            id={`song-row-${index}`}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl border transition-all ${
                              isBeingEdited
                                ? 'bg-orange-500/10 border-orange-500/40 ring-1 ring-orange-500/30'
                                : 'bg-zinc-950/70 border-zinc-800/90 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                                {index + 1}
                              </span>

                              {/* Thumbnail se disponível */}
                              {thumbnail && (
                                <img
                                  src={thumbnail}
                                  alt={song.louvor}
                                  className="w-10 h-7 rounded-lg object-cover bg-zinc-900 border border-zinc-800 shrink-0 hidden sm:block"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              )}

                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-zinc-100 break-words">
                                  {song.louvor}
                                </p>
                                {hasYoutube ? (
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <a
                                      href={song.youtubeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 text-[11px] font-bold transition-colors cursor-pointer"
                                      title="Testar link no YouTube"
                                    >
                                      <Youtube className="w-3 h-3 text-red-500" />
                                      <span>YouTube</span>
                                      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                    </a>
                                    {song.playlistTitle && (
                                      <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800 truncate max-w-[180px]">
                                        {song.playlistTitle}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOnlyYoutubeLink(index)}
                                      disabled={isLoading}
                                      className="text-[11px] text-zinc-400 hover:text-rose-400 transition-colors font-medium cursor-pointer"
                                      title="Remover apenas o link do YouTube"
                                    >
                                      Remover link
                                    </button>
                                  </div>
                                ) : (
                                  <span className="inline-block text-[11px] text-zinc-400 mt-0.5">
                                    Sem vídeo vinculado
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Controles de Linha */}
                            <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleStartEditSong(index)}
                                disabled={isLoading}
                                className="p-1.5 rounded-xl text-zinc-400 hover:text-orange-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Editar nome ou link do louvor"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveSong(index, 'up')}
                                disabled={index === 0 || isLoading}
                                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-20 transition-colors cursor-pointer"
                                title="Mover para cima"
                              >
                                <ArrowUp size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveSong(index, 'down')}
                                disabled={index === louvoresList.length - 1 || isLoading}
                                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-20 transition-colors cursor-pointer"
                                title="Mover para baixo"
                              >
                                <ArrowDown size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSong(index)}
                                disabled={isLoading}
                                className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-colors ml-1 cursor-pointer"
                                title="Remover este louvor"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <textarea
                  id="textarea-raw-louvores"
                  value={rawLouvoresText}
                  onChange={(e) => setRawLouvoresText(e.target.value)}
                  placeholder="Ex:&#10;1. DAMOS GRAÇAS AO SENHOR (https://youtube.com/...)&#10;2. BOM ESTAMOS AQUI&#10;3. BONDADE DE DEUS"
                  rows={6}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-zinc-100 text-sm font-mono placeholder-zinc-500 leading-relaxed transition-all resize-none"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Você pode incluir links do YouTube entre parênteses em cada linha (ex: <code>1. Nome da Música (https://youtu.be/...)</code>) ou apenas o nome da música.
                </p>
              </div>
            )}
          </div>

          {/* SEÇÃO: UNIFORME DO CULTO */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <Shirt className="w-3.5 h-3.5 text-orange-400" />
              Uniforme / Vestimenta
            </h4>

            <div>
              <input
                id="input-uniforme"
                type="text"
                value={uniforme}
                onChange={(e) => setUniforme(e.target.value)}
                placeholder="Ex: CAMISA BRANCA E GRAVATA AZUL"
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-zinc-100 text-sm font-medium transition-all"
              />
            </div>

            {/* Presets rápidos */}
            <div>
              <span className="block text-[11px] font-bold text-zinc-400 mb-1.5">
                Sugestões rápidas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {UNIFORME_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setUniforme(preset)}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-zinc-950 border border-zinc-800/90 text-zinc-400 hover:text-orange-400 hover:border-orange-500/40 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={isLoading}
              className="px-6 py-2.5 text-xs font-black cursor-pointer"
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>

      {/* Modal de Importação de Playlist do YouTube */}
      <YouTubePlaylistImporter
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        existingLouvores={louvoresList}
        onAddSelected={handleImportFromYouTube}
      />
    </div>
  );
};
