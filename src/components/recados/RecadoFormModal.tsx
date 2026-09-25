import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Trash2, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Recado } from '../../types';
import { apiService } from '../../services/api';
import { Button } from '../ui/Button';
import { getImageDisplayUrl } from '../../utils/imageUtils';

interface RecadoFormModalProps {
  recado?: Recado | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const RecadoFormModal: React.FC<RecadoFormModalProps> = ({
  recado,
  onClose,
  onSuccess
}) => {
  const isEditing = !!recado;

  const [titulo, setTitulo] = useState(recado?.titulo || '');
  const [mensagem, setMensagem] = useState(recado?.mensagem || '');
  const [ativo, setAtivo] = useState<'SIM' | 'NAO'>(recado?.ativo === 'NAO' ? 'NAO' : 'SIM');
  
  // Image handling
  const [imagePreview, setImagePreview] = useState<string | null>(
    recado?.imagemUrl ? getImageDisplayUrl(recado.imagemUrl) : null
  );
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (recado) {
      setTitulo(recado.titulo || '');
      setMensagem(recado.mensagem || '');
      setAtivo(recado.ativo === 'NAO' ? 'NAO' : 'SIM');
      setImagePreview(recado.imagemUrl ? getImageDisplayUrl(recado.imagemUrl) : null);
      setImageBase64(null);
    }
  }, [recado]);

  const handleFile = (file: File) => {
    setErrorMessage(null);

    // Validações de arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Formato de imagem não suportado. Escolha um arquivo JPEG, PNG ou WEBP.');
      return;
    }

    const maxSize = 3.5 * 1024 * 1024; // 3.5 MB
    if (file.size > maxSize) {
      setErrorMessage('O tamanho da imagem excede 3.5MB. Escolha uma foto menor.');
      return;
    }

    setImageFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageBase64(result);
      setImagePreview(result);
    };
    reader.onerror = () => {
      setErrorMessage('Erro ao ler a imagem selecionada.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageBase64('');
    setImageFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!titulo.trim() && !mensagem.trim()) {
      setErrorMessage('Por favor, informe ao menos um título ou texto para o recado.');
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && recado) {
        const payload: any = {
          titulo: titulo.trim(),
          mensagem: mensagem.trim(),
          ativo: ativo
        };

        if (imageBase64 !== null) {
          if (imageBase64 === '') {
            payload.imagemUrl = '';
          } else {
            payload.imagemBase64 = imageBase64;
          }
        }

        const res = await apiService.updateRecado(recado.id, payload);
        if (!res.sucesso) {
          throw new Error(res.mensagem || 'Não foi possível atualizar o recado.');
        }

        onSuccess(res.mensagem || 'Recado atualizado com sucesso!');
      } else {
        const payload: any = {
          titulo: titulo.trim(),
          mensagem: mensagem.trim()
        };

        if (imageBase64) {
          payload.imagemBase64 = imageBase64;
        }

        const res = await apiService.createRecado(payload);
        if (!res.sucesso) {
          throw new Error(res.mensagem || 'Não foi possível publicar o recado.');
        }

        onSuccess(res.mensagem || 'Recado publicado com sucesso!');
      }
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar recado:', err);
      setErrorMessage(err.message || 'Erro de comunicação ao salvar recado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="recado-form-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        id="recado-form-modal"
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-zinc-800 bg-zinc-900/90">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Liderança
            </span>
            <h3 className="text-lg md:text-xl font-black text-zinc-100 mt-1">
              {isEditing ? 'Editar Recado' : 'Novo Recado do Mural'}
            </h3>
          </div>
          <button
            id="btn-close-recado-modal"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Título do Comunicado
            </label>
            <input
              id="input-recado-titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Ensaio Geral no Sábado às 18h"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-zinc-100 text-sm placeholder-zinc-500 font-medium transition-all disabled:opacity-50"
            />
          </div>

          {/* Mensagem */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Mensagem / Descrição
            </label>
            <textarea
              id="input-recado-mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Descreva as orientações, horários, vestimentas e detalhes para a equipe..."
              rows={4}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-zinc-100 text-sm placeholder-zinc-500 font-medium transition-all resize-none disabled:opacity-50"
            />
          </div>

          {/* Status Ativo / Inativo (se em edição) */}
          {isEditing && (
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Visibilidade no Mural
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  id="btn-status-ativo"
                  onClick={() => setAtivo('SIM')}
                  disabled={isLoading}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                    ativo === 'SIM'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Ativo (Visível)
                </button>
                <button
                  type="button"
                  id="btn-status-inativo"
                  onClick={() => setAtivo('NAO')}
                  disabled={isLoading}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                    ativo === 'NAO'
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                      : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Inativo (Oculto)
                </button>
              </div>
            </div>
          )}

          {/* Upload de Imagem */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Imagem / Banner (Opcional)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              disabled={isLoading}
            />

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 p-2">
                <div className="relative max-h-48 flex items-center justify-center rounded-xl overflow-hidden bg-black/40">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 w-auto object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/80 px-1 text-xs">
                  <span className="text-zinc-400 truncate max-w-[200px]">
                    {imageFileName || 'Imagem anexada'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-[11px] transition-colors"
                    >
                      Trocar Foto
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={isLoading}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                      title="Remover imagem"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition-all ${
                  isDragOver
                    ? 'border-orange-500 bg-orange-500/5'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-950/80'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-orange-400">
                    <Upload size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-200 text-xs block">
                      Clique para escolher ou arraste uma foto
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      PNG, JPG, WEBP até 3.5MB
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={isLoading}
              className="px-5 py-2.5 text-xs font-black"
            >
              {isEditing ? 'Salvar Alterações' : 'Publicar Recado'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
