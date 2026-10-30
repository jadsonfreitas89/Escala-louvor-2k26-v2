import React, { useState, useEffect } from 'react';
import { X, User, Shield, Music, KeyRound, Check, AlertCircle, UserCheck, UserX } from 'lucide-react';
import { Integrante } from '../../types';
import { apiService } from '../../services/api';
import { Button } from '../ui/Button';

interface IntegranteModalProps {
  isOpen: boolean;
  onClose: () => void;
  integranteToEdit?: Integrante | null;
  existingIntegrantes: Integrante[];
  onSuccess: () => void;
}

const FUNCOES_DISPONIVEIS = [
  { id: 'LIDER', label: 'Líder', desc: 'Acesso total de liderança do ministério' },
  { id: 'DIRIGENTE', label: 'Dirigente', desc: 'Edição de louvores e uniformes dos cultos' },
  { id: 'VOCAL', label: 'Vocal', desc: 'Escalado em equipes de vocais' },
  { id: 'MUSICO', label: 'Músico', desc: 'Escalado para tocar instrumentos' },
  { id: 'MESARIO', label: 'Mesário', desc: 'Responsável pela mesa de som/mídia' },
];

const INSTRUMENTOS_DISPONIVEIS = [
  'VIOLÃO',
  'VIOLINO',
  'BATERIA',
  'FLAUTA',
  'TECLADO',
  'BAIXO',
  'OUTRO',
];

export const IntegranteModal: React.FC<IntegranteModalProps> = ({
  isOpen,
  onClose,
  integranteToEdit,
  existingIntegrantes,
  onSuccess,
}) => {
  const isEditing = Boolean(integranteToEdit);

  const [nome, setNome] = useState('');
  const [selectedFuncoes, setSelectedFuncoes] = useState<string[]>(['VOCAL']);
  const [instrumento, setInstrumento] = useState<string>('');
  const [senha, setSenha] = useState('');
  const [ativo, setAtivo] = useState<'SIM' | 'NAO'>('SIM');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inicializa o formulário com dados do integrante ao abrir
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (integranteToEdit) {
        setNome(integranteToEdit.nome || '');
        setInstrumento((integranteToEdit.instrumento || '').toUpperCase());
        setSenha(''); // Mantém senha em branco para preservação
        setAtivo(integranteToEdit.ativo === 'NAO' ? 'NAO' : 'SIM');

        // Mapeia funções da string (ex: "LIDER, DIRIGENTE, VOCAL, MUSICO")
        const funcaoUpper = (integranteToEdit.funcao || '').toUpperCase();
        const funcoesParsed: string[] = [];
        if (funcaoUpper.includes('LIDER')) funcoesParsed.push('LIDER');
        if (funcaoUpper.includes('DIRIGENTE')) funcoesParsed.push('DIRIGENTE');
        if (funcaoUpper.includes('VOCAL')) funcoesParsed.push('VOCAL');
        if (funcaoUpper.includes('MUSICO') || funcaoUpper.includes('MÚSICO')) funcoesParsed.push('MUSICO');
        if (funcaoUpper.includes('MESARIO') || funcaoUpper.includes('MESÁRIO')) funcoesParsed.push('MESARIO');

        setSelectedFuncoes(funcoesParsed.length > 0 ? funcoesParsed : ['INTEGRANTE']);
      } else {
        setNome('');
        setSelectedFuncoes(['VOCAL']);
        setInstrumento('');
        setSenha('');
        setAtivo('SIM');
      }
    }
  }, [isOpen, integranteToEdit]);

  if (!isOpen) return null;

  const toggleFuncao = (fId: string) => {
    setSelectedFuncoes((prev) => {
      if (prev.includes(fId)) {
        if (prev.length === 1) return prev; // Mantém pelo menos uma função
        return prev.filter((item) => item !== fId);
      } else {
        return [...prev, fId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanNome = nome.trim();
    if (!cleanNome) {
      setErrorMsg('Informe o nome do integrante.');
      return;
    }

    if (selectedFuncoes.length === 0) {
      setErrorMsg('Selecione pelo menos uma função para o integrante.');
      return;
    }

    // Validação de duplicidade
    const nomeNorm = cleanNome.toLowerCase();
    const originalNorm = integranteToEdit ? integranteToEdit.nome.toLowerCase() : '';

    if (!isEditing || (isEditing && nomeNorm !== originalNorm)) {
      const duplicado = existingIntegrantes.some(
        (i) => i.nome.trim().toLowerCase() === nomeNorm
      );
      if (duplicado) {
        setErrorMsg(`Já existe um integrante cadastrado com o nome "${cleanNome}".`);
        return;
      }
    }

    setIsLoading(true);

    try {
      const funcaoStr = selectedFuncoes.join(', ');

      if (isEditing && integranteToEdit) {
        const res = await apiService.updateIntegrante(integranteToEdit.nome, {
          nomeOriginal: integranteToEdit.nome,
          novoNome: cleanNome,
          funcao: funcaoStr,
          instrumento: instrumento,
          senha: senha ? senha.trim() : undefined,
          ativo: ativo,
        });

        if (res.sucesso) {
          onSuccess();
          onClose();
        } else {
          setErrorMsg(res.mensagem || 'Falha ao atualizar integrante.');
        }
      } else {
        const res = await apiService.createIntegrante({
          nome: cleanNome,
          funcao: funcaoStr,
          instrumento: instrumento,
          senha: senha ? senha.trim() : undefined,
          ativo: ativo,
        });

        if (res.sucesso) {
          onSuccess();
          onClose();
        } else {
          setErrorMsg(res.mensagem || 'Falha ao cadastrar novo integrante.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de comunicação ao salvar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center font-bold">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-zinc-100">
                {isEditing ? 'Editar Integrante' : 'Novo Integrante'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isEditing
                  ? `Atualizar cadastro de ${integranteToEdit?.nome}`
                  : 'Adicionar membro à equipe do ministério de louvor'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nome */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-300 flex items-center gap-1.5">
              <span>Nome do Integrante</span>
              <span className="text-orange-400">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              required
              className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Múltiplas Funções */}
          <div className="space-y-2">
            <label className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Shield size={14} className="text-orange-400" />
              <span>Funções no Ministério (Seleção Múltipla)</span>
              <span className="text-orange-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FUNCOES_DISPONIVEIS.map((f) => {
                const isSelected = selectedFuncoes.includes(f.id);
                return (
                  <div
                    key={f.id}
                    onClick={() => toggleFuncao(f.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-orange-500/15 border-orange-500/40 text-orange-200'
                        : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-zinc-200">{f.label}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{f.desc}</div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isSelected ? 'bg-orange-500 text-zinc-950' : 'bg-zinc-800 text-transparent'
                      }`}
                    >
                      <Check size={12} className="stroke-[3]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instrumento */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Music size={14} className="text-orange-400" />
              <span>Instrumento Principal (Opcional)</span>
            </label>
            <select
              value={instrumento}
              onChange={(e) => setInstrumento(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="">Nenhum / Não toca instrumento</option>
              {INSTRUMENTOS_DISPONIVEIS.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-300 flex items-center gap-1.5">
              <KeyRound size={14} className="text-orange-400" />
              <span>Senha de Acesso</span>
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={isEditing ? 'Deixe em branco para manter a senha atual' : 'Opcional'}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors font-mono"
            />
            <p className="text-[10px] text-zinc-500">
              {isEditing
                ? 'Se preenchida, substitui a senha existente. A senha antiga nunca é exposta.'
                : 'A senha é usada para entrar no aplicativo. Se vazia, o integrante não precisará de senha.'}
            </p>
          </div>

          {/* Situação (Ativo/Inativo) */}
          <div className="space-y-1.5 pt-1">
            <label className="font-bold text-zinc-300 flex items-center gap-1.5">
              <span>Situação Cadastral</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAtivo('SIM')}
                className={`py-2.5 px-3 rounded-2xl border font-bold flex items-center justify-center gap-2 transition-all ${
                  ativo === 'SIM'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <UserCheck size={14} />
                <span>Ativo</span>
              </button>

              <button
                type="button"
                onClick={() => setAtivo('NAO')}
                className={`py-2.5 px-3 rounded-2xl border font-bold flex items-center justify-center gap-2 transition-all ${
                  ativo === 'NAO'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <UserX size={14} />
                <span>Inativo</span>
              </button>
            </div>
            <p className="text-[10px] text-zinc-500">
              Integrantes inativos não podem fazer login nem ser selecionados para novas escalas, mas seu histórico permanece intacto.
            </p>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end gap-2">
            <Button variant="ghost" size="md" type="button" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isLoading}>
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Integrante'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
