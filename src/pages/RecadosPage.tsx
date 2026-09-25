import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Calendar,
  Image as ImageIcon,
  Bell,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Maximize2,
  Download,
  Share2,
  Loader2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEscala } from '../context/EscalaContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { RecadoFormModal } from '../components/recados/RecadoFormModal';
import { Recado } from '../types';
import { apiService } from '../services/api';
import { getImageDisplayUrl, downloadOrSaveImage } from '../utils/imageUtils';

export const RecadosPage: React.FC = () => {
  const { isLider } = useAuth();
  const { data, isLoading, refreshData } = useEscala();

  // State
  const [filterTab, setFilterTab] = useState<'ativos' | 'inativos' | 'todos'>('ativos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecado, setSelectedRecado] = useState<Recado | null>(null);
  
  // Feedback and confirm delete state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [recadoToDelete, setRecadoToDelete] = useState<Recado | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Saving / Download image state
  const [savingImageId, setSavingImageId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Lightbox Image Preview
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    title: string;
    date?: string;
    id: string;
  } | null>(null);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading && !data.recados.length) {
    return <LoadingState message="Carregando mural de recados..." />;
  }

  const allRecados = data.recados || [];
  const activeRecados = allRecados.filter((r) => r.ativo === 'SIM');
  const inactiveRecados = allRecados.filter((r) => r.ativo !== 'SIM');

  const displayedRecados =
    filterTab === 'ativos'
      ? activeRecados
      : filterTab === 'inativos'
      ? inactiveRecados
      : allRecados;

  const handleOpenCreate = () => {
    setSelectedRecado(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (recado: Recado) => {
    setSelectedRecado(recado);
    setIsModalOpen(true);
  };

  const handleModalSuccess = (msg: string) => {
    setFeedback({ type: 'success', message: msg });
    refreshData(true);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleAtivo = async (recado: Recado) => {
    const nextAtivo = recado.ativo === 'SIM' ? 'NAO' : 'SIM';
    try {
      const res = await apiService.updateRecado(recado.id, {
        ativo: nextAtivo
      });
      if (!res.sucesso) {
        throw new Error(res.mensagem || 'Falha ao alterar status do recado.');
      }
      setFeedback({
        type: 'success',
        message: nextAtivo === 'SIM' ? 'Recado ativado com sucesso no mural!' : 'Recado ocultado do mural.'
      });
      refreshData(true);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao alterar status.' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!recadoToDelete) return;
    setIsDeleting(true);
    try {
      const res = await apiService.deleteRecado(recadoToDelete.id);
      if (!res.sucesso) {
        throw new Error(res.mensagem || 'Falha ao excluir recado.');
      }
      setFeedback({ type: 'success', message: 'Recado excluído com sucesso do backend!' });
      setRecadoToDelete(null);
      refreshData(true);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao excluir recado.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveImage = async (
    rawUrl: string,
    title: string,
    date?: string,
    recadoId: string = 'single'
  ) => {
    if (!rawUrl || savingImageId) return;
    setSavingImageId(recadoId);

    try {
      const res = await downloadOrSaveImage(rawUrl, title, date);
      if (res.success && res.message) {
        setFeedback({ type: 'success', message: res.message });
        setTimeout(() => setFeedback(null), 3500);
      } else if (!res.success) {
        setFeedback({ type: 'error', message: res.message || 'Falha ao salvar a imagem.' });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao salvar a imagem.' });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setSavingImageId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl md:text-2xl font-black text-zinc-100">Mural de Recados</h2>
            <Badge variant="success" size="sm">
              {activeRecados.length} ativo(s)
            </Badge>
          </div>
          <p className="text-xs text-zinc-400">
            Avisos importantes, escalas de ensaios e comunicados oficiais da liderança.
          </p>
        </div>

        {isLider && (
          <Button
            id="btn-novo-recado"
            variant="primary"
            onClick={handleOpenCreate}
            leftIcon={<Plus size={16} />}
            className="text-xs font-black self-start sm:self-auto"
          >
            Novo Recado
          </Button>
        )}
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-start gap-2.5 p-4 rounded-2xl border text-xs font-semibold animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs Filter for Líder */}
      {isLider && allRecados.length > 0 && (
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-950/80 border border-zinc-800 w-fit">
          <button
            onClick={() => setFilterTab('ativos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'ativos'
                ? 'bg-orange-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ativos ({activeRecados.length})
          </button>
          <button
            onClick={() => setFilterTab('inativos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'inativos'
                ? 'bg-orange-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ocultos ({inactiveRecados.length})
          </button>
          <button
            onClick={() => setFilterTab('todos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'todos'
                ? 'bg-orange-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos ({allRecados.length})
          </button>
        </div>
      )}

      {/* Recados List */}
      {displayedRecados.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={
            filterTab === 'inativos'
              ? 'Nenhum recado inativo'
              : 'Nenhum recado publicado'
          }
          description={
            filterTab === 'inativos'
              ? 'Todos os recados cadastrados estão atualmente visíveis no mural.'
              : 'Quando a liderança publicar avisos ou lembretes de ensaio, eles aparecerão aqui.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedRecados.map((recado) => {
            const isInactive = recado.ativo === 'NAO';
            const hasImage = Boolean(recado.imagemUrl && recado.imagemUrl.trim());
            const displayUrl = hasImage ? getImageDisplayUrl(recado.imagemUrl) : '';
            const isImageBroken = Boolean(imageErrors[recado.id]);
            const isSavingThisImage = savingImageId === recado.id;

            return (
              <Card
                key={recado.id}
                variant="default"
                className={`flex flex-col justify-between overflow-hidden relative group hover:border-zinc-700 transition-all ${
                  isInactive ? 'opacity-70 bg-zinc-950/60 border-dashed border-zinc-800' : ''
                }`}
              >
                <div className="space-y-3">
                  {/* Optional Image */}
                  {hasImage && !isImageBroken && (
                    <div className="space-y-2">
                      <div
                        onClick={() =>
                          setLightboxImage({
                            url: recado.imagemUrl!,
                            title: recado.titulo,
                            date: recado.dataCriacao,
                            id: recado.id
                          })
                        }
                        className="rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 max-h-60 flex items-center justify-center cursor-pointer relative group/img shadow-inner"
                      >
                        <img
                          src={displayUrl}
                          alt={recado.titulo}
                          loading="lazy"
                          onError={() => {
                            setImageErrors((prev) => ({ ...prev, [recado.id]: true }));
                          }}
                          className="w-full h-full max-h-60 object-cover group-hover/img:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 text-xs font-bold backdrop-blur-sm shadow-md">
                            <Maximize2 size={14} /> Ampliar Foto
                          </span>
                        </div>
                      </div>

                      {/* Botão Salvar Imagem no Card */}
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          id={`btn-salvar-imagem-${recado.id}`}
                          onClick={() =>
                            handleSaveImage(
                              recado.imagemUrl!,
                              recado.titulo,
                              recado.dataCriacao,
                              recado.id
                            )
                          }
                          disabled={isSavingThisImage}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-orange-500 hover:text-zinc-950 text-zinc-300 text-xs font-bold border border-zinc-700/80 hover:border-orange-500/80 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          {isSavingThisImage ? (
                            <>
                              <Loader2 size={13} className="animate-spin text-orange-400" />
                              <span>Salvando...</span>
                            </>
                          ) : (
                            <>
                              <Download size={13} />
                              <span>Salvar imagem</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {hasImage && isImageBroken && (
                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-[11px] text-zinc-500 flex items-center gap-2">
                      <ImageIcon size={14} className="text-zinc-600 shrink-0" />
                      <span>Imagem indisponível temporariamente</span>
                    </div>
                  )}

                  {/* Recado Content */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-semibold">
                        <Calendar size={12} />
                        <span>Publicado em {recado.dataCriacao}</span>
                      </div>
                      {isInactive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Oculto
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-zinc-100 tracking-tight leading-snug">
                      {recado.titulo}
                    </h3>

                    <p className="text-xs text-zinc-300 mt-2 leading-relaxed whitespace-pre-line">
                      {recado.mensagem}
                    </p>
                  </div>
                </div>

                {/* Card Footer & Admin Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Bell size={12} className="text-orange-400" />
                    Comunicado Oficial
                  </span>

                  {isLider && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleAtivo(recado)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          recado.ativo === 'SIM'
                            ? 'text-zinc-400 hover:text-amber-400 hover:bg-zinc-800'
                            : 'text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                        title={recado.ativo === 'SIM' ? 'Ocultar recado' : 'Ativar recado'}
                      >
                        {recado.ativo === 'SIM' ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(recado)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                        title="Editar recado"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setRecadoToDelete(recado)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Excluir recado"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <RecadoFormModal
          recado={selectedRecado}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRecado(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {recadoToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => !isDeleting && setRecadoToDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-zinc-100">Excluir Recado?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Esta ação removerá permanentemente o comunicado do mural e do Google Sheets.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRecadoToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
                disabled={isDeleting}
                className="flex-1 py-2.5 text-xs font-black"
              >
                Sim, Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal de Visualização Ampliada com Opção de Salvar */}
      {lightboxImage && (
        <div
          id="recado-lightbox-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-md animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            id="recado-lightbox-container"
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              id="btn-close-lightbox"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-11 right-0 p-2 rounded-xl bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors shadow-lg"
              title="Fechar visualização"
            >
              <X size={20} />
            </button>

            {/* Enlarged Image */}
            <div className="w-full flex items-center justify-center overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl">
              <img
                src={getImageDisplayUrl(lightboxImage.url)}
                alt={lightboxImage.title}
                className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Bottom Actions Bar */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 backdrop-blur-md">
              <div className="text-center sm:text-left truncate max-w-md">
                <h4 className="text-sm font-bold text-zinc-100 truncate">{lightboxImage.title}</h4>
                {lightboxImage.date && (
                  <p className="text-[11px] text-zinc-400">Publicado em {lightboxImage.date}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  id="btn-lightbox-salvar-imagem"
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    handleSaveImage(
                      lightboxImage.url,
                      lightboxImage.title,
                      lightboxImage.date,
                      lightboxImage.id
                    )
                  }
                  isLoading={savingImageId === lightboxImage.id}
                  disabled={savingImageId === lightboxImage.id}
                  leftIcon={<Download size={15} />}
                  className="font-bold text-xs"
                >
                  Salvar imagem no dispositivo
                </Button>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
