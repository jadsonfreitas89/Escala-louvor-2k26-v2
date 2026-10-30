import React from 'react';
import { X, Trash2, AlertTriangle, ShieldAlert, History } from 'lucide-react';
import { Integrante } from '../../types';
import { Button } from '../ui/Button';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  integrante: Integrante | null;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  errorMsg?: string | null;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  integrante,
  onConfirm,
  isLoading,
  errorMsg,
}) => {
  if (!isOpen || !integrante) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-rose-500/10">
          <div className="flex items-center gap-2.5 text-rose-400">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <Trash2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-100">Excluir Integrante</h3>
              <p className="text-[11px] text-rose-300/80 font-medium">Ação irreversível pelo painel</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Member Highlight */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500/20 to-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-sm shrink-0">
              {integrante.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">Integrante a ser excluído:</p>
              <h4 className="text-sm font-bold text-zinc-100">{integrante.nome}</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">{integrante.funcao || 'Sem função registrada'}</p>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert size={15} className="shrink-0 text-amber-400" />
              <span>Confirmação de Segurança</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed pl-5">
              Tem certeza de que deseja excluir <strong>{integrante.nome}</strong>?
              Esta operação removerá o integrante da listagem de cadastros ativos e bloqueará seu acesso ao aplicativo.
            </p>
          </div>

          {/* History Info Notice */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-2">
            <History size={14} className="shrink-0 mt-0.5 text-zinc-500" />
            <p className="leading-relaxed">
              <strong>Preservação de Histórico:</strong> Caso {integrante.nome} possua registros em escalas, solicitações ou recados anteriores, seu histórico será preservado e o cadastro será inativado (exclusão lógica).
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-950/80 border-t border-zinc-800/80 flex items-center justify-end gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            leftIcon={<Trash2 size={14} />}
            className="bg-rose-600 text-white hover:bg-rose-500 border-none font-bold shadow-lg shadow-rose-950"
          >
            Confirmar Exclusão
          </Button>
        </div>
      </div>
    </div>
  );
};
