import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Music,
  CheckCircle2,
  XCircle,
  Pencil,
  UserCheck,
  UserX,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  RotateCw,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEscala } from '../context/EscalaContext';
import { useNavigation } from '../context/NavigationContext';
import { Integrante } from '../types';
import { apiService } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { IntegranteModal } from '../components/integrantes/IntegranteModal';
import { ConfirmDeleteModal } from '../components/integrantes/ConfirmDeleteModal';

export const IntegrantesPage: React.FC = () => {
  const { user, isLider } = useAuth();
  const { data, refreshData, isRefreshing } = useEscala();
  const { navigate } = useNavigation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVOS' | 'INATIVOS'>('ATIVOS');

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntegrante, setSelectedIntegrante] = useState<Integrante | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [integranteToDelete, setIntegranteToDelete] = useState<Integrante | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  const [statusTogglingName, setStatusTogglingName] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Acesso Restrito se não for Líder
  if (!isLider) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-black text-zinc-100">Acesso Restrito à Liderança</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          O gerenciamento de integrantes do ministério é exclusivo para membros com perfil de Líder.
        </p>
        <Button variant="outline" onClick={() => navigate('/')} leftIcon={<ArrowLeft size={16} />}>
          Voltar ao Início
        </Button>
      </div>
    );
  }

  const allIntegrantes = data.integrantes || [];

  // Filtragem da lista
  const filteredIntegrantes = allIntegrantes.filter((item) => {
    // Filtro por status
    const isAtivo = item.ativo !== 'NAO';
    if (statusFilter === 'ATIVOS' && !isAtivo) return false;
    if (statusFilter === 'INATIVOS' && isAtivo) return false;

    // Filtro por busca textual
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase().trim();
    const matchNome = item.nome.toLowerCase().includes(query);
    const matchFuncao = (item.funcao || '').toLowerCase().includes(query);
    const matchInstrumento = (item.instrumento || '').toLowerCase().includes(query);

    return matchNome || matchFuncao || matchInstrumento;
  });

  const countAtivos = allIntegrantes.filter((i) => i.ativo !== 'NAO').length;
  const countInativos = allIntegrantes.filter((i) => i.ativo === 'NAO').length;

  const handleOpenCreateModal = () => {
    setSelectedIntegrante(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (integrante: Integrante) => {
    setSelectedIntegrante(integrante);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (integrante: Integrante) => {
    if (user?.nome && user.nome.trim().toLowerCase() === integrante.nome.trim().toLowerCase()) {
      setFeedbackMsg({
        type: 'error',
        text: 'Não é possível excluir a sua própria conta.',
      });
      return;
    }

    setDeleteErrorMsg(null);
    setIntegranteToDelete(integrante);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!integranteToDelete) return;

    setIsDeleting(true);
    setDeleteErrorMsg(null);

    try {
      const res = await apiService.deleteIntegrante(integranteToDelete.nome);

      if (res.sucesso) {
        setFeedbackMsg({
          type: 'success',
          text: res.mensagem || `Integrante "${integranteToDelete.nome}" excluído com sucesso!`,
        });
        setIsDeleteModalOpen(false);
        setIntegranteToDelete(null);
        await refreshData();
      } else {
        setDeleteErrorMsg(res.mensagem || 'Não foi possível excluir o integrante.');
      }
    } catch (err: any) {
      setDeleteErrorMsg(err.message || 'Erro ao conectar com o servidor.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (integrante: Integrante) => {
    const isCurrentlyAtivo = integrante.ativo !== 'NAO';
    const nextStatus = isCurrentlyAtivo ? 'NAO' : 'SIM';
    const actionText = isCurrentlyAtivo ? 'desativar' : 'ativar';

    if (
      !window.confirm(
        `Tem certeza que deseja ${actionText} o integrante "${integrante.nome}"?\n\n${
          isCurrentlyAtivo
            ? 'Ao desativar, ele não poderá fazer login e não aparecerá para novas escalas. O histórico em escalas passadas é preservado.'
            : 'Ao reativar, ele poderá fazer login e ser escalado normalmente.'
        }`
      )
    ) {
      return;
    }

    setStatusTogglingName(integrante.nome);
    setFeedbackMsg(null);

    try {
      const res = await apiService.toggleIntegranteStatus(integrante.nome, nextStatus);
      if (res.sucesso) {
        setFeedbackMsg({
          type: 'success',
          text: `Situação de ${integrante.nome} alterada para ${nextStatus === 'SIM' ? 'Ativo' : 'Inativo'}.`,
        });
        await refreshData();
      } else {
        setFeedbackMsg({
          type: 'error',
          text: res.mensagem || 'Não foi possível alterar a situação do integrante.',
        });
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Erro ao comunicar com o servidor.',
      });
    } finally {
      setStatusTogglingName(null);
    }
  };

  const renderFuncaoBadges = (funcaoStr: string) => {
    const upper = (funcaoStr || '').toUpperCase();
    const badges: { label: string; variant: 'primary' | 'amber' | 'secondary' | 'success' | 'purple' }[] = [];

    if (upper.includes('LIDER')) badges.push({ label: 'LÍDER', variant: 'primary' });
    if (upper.includes('DIRIGENTE')) badges.push({ label: 'DIRIGENTE', variant: 'amber' });
    if (upper.includes('VOCAL')) badges.push({ label: 'VOCAL', variant: 'purple' });
    if (upper.includes('MUSICO') || upper.includes('MÚSICO')) badges.push({ label: 'MÚSICO', variant: 'success' });
    if (upper.includes('MESARIO') || upper.includes('MESÁRIO')) badges.push({ label: 'MESÁRIO', variant: 'secondary' });

    if (badges.length === 0) {
      badges.push({ label: funcaoStr || 'INTEGRANTE', variant: 'secondary' });
    }

    return (
      <div className="flex flex-wrap gap-1">
        {badges.map((b, idx) => (
          <Badge key={idx} variant={b.variant} size="sm" className="text-[10px] py-0 px-1.5 font-bold">
            {b.label}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">
              <ShieldCheck size={12} />
              Painel da Liderança
            </Badge>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-orange-400" />
            Gerenciamento de Integrantes
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Cadastre novos membros, atualize funções, instrumentos e gerencie a situação cadastral.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenCreateModal}
          leftIcon={<UserPlus size={16} />}
          className="shrink-0"
        >
          Novo Integrante
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card variant="default" className="p-3.5 flex flex-col items-center justify-center text-center">
          <div className="text-xl font-black text-zinc-100">{allIntegrantes.length}</div>
          <div className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">Cadastrados</div>
        </Card>

        <Card variant="default" className="p-3.5 flex flex-col items-center justify-center text-center">
          <div className="text-xl font-black text-emerald-400">{countAtivos}</div>
          <div className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">Membros Ativos</div>
        </Card>

        <Card variant="default" className="p-3.5 flex flex-col items-center justify-center text-center">
          <div className="text-xl font-black text-rose-400">{countInativos}</div>
          <div className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">Inativos</div>
        </Card>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-zinc-400 hover:text-zinc-200 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <Card variant="default" className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Input de Busca */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, função ou instrumento..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800/80 shrink-0 text-xs">
            <button
              onClick={() => setStatusFilter('ATIVOS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'ATIVOS'
                  ? 'bg-orange-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Ativos ({countAtivos})
            </button>

            <button
              onClick={() => setStatusFilter('INATIVOS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'INATIVOS'
                  ? 'bg-orange-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Inativos ({countInativos})
            </button>

            <button
              onClick={() => setStatusFilter('TODOS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'TODOS'
                  ? 'bg-orange-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Todos ({allIntegrantes.length})
            </button>
          </div>
        </div>
      </Card>

      {/* Lista de Integrantes */}
      {filteredIntegrantes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredIntegrantes.map((integrante) => {
            const isAtivo = integrante.ativo !== 'NAO';
            const isToggling = statusTogglingName === integrante.nome;
            const isSelf = Boolean(
              user?.nome && user.nome.trim().toLowerCase() === integrante.nome.trim().toLowerCase()
            );

            return (
              <Card
                key={integrante.nome}
                variant="default"
                className={`p-4 transition-all relative overflow-hidden flex flex-col justify-between ${
                  !isAtivo ? 'opacity-60 bg-zinc-950/40 border-zinc-900' : ''
                }`}
              >
                <div>
                  {/* Top Row: Avatar + Name + Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border ${
                          isAtivo
                            ? 'bg-gradient-to-tr from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        {integrante.nome.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                          <span>{integrante.nome}</span>
                          {isSelf && (
                            <Badge variant="primary" size="sm" className="text-[9px] py-0 px-1">
                              Você
                            </Badge>
                          )}
                        </h4>
                        <div className="mt-1">{renderFuncaoBadges(integrante.funcao)}</div>
                      </div>
                    </div>

                    <Badge
                      variant={isAtivo ? 'success' : 'danger'}
                      size="sm"
                      className="text-[10px] shrink-0"
                    >
                      {isAtivo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  {/* Instrument Info */}
                  <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400 flex items-center gap-2 my-2">
                    <Music size={14} className={integrante.instrumento ? 'text-orange-400' : 'text-zinc-600'} />
                    <span>
                      Instrumento:{' '}
                      <strong className={integrante.instrumento ? 'text-zinc-200' : 'text-zinc-500'}>
                        {integrante.instrumento || 'Nenhum'}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 mt-2 border-t border-zinc-800/60 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditModal(integrante)}
                    leftIcon={<Pencil size={13} />}
                  >
                    Editar
                  </Button>

                  <Button
                    variant={isAtivo ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleToggleStatus(integrante)}
                    isLoading={isToggling}
                    leftIcon={isAtivo ? <UserX size={13} /> : <UserCheck size={13} />}
                  >
                    {isAtivo ? 'Desativar' : 'Ativar'}
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleOpenDeleteModal(integrante)}
                    disabled={isSelf}
                    leftIcon={<Trash2 size={13} />}
                    title={isSelf ? 'Você não pode excluir sua própria conta' : 'Excluir integrante'}
                  >
                    Excluir
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card variant="default" className="py-12 px-4 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
            <Users size={24} />
          </div>
          <h3 className="text-sm font-bold text-zinc-200">Nenhum integrante encontrado</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchTerm
              ? `Nenhum membro corresponde à busca "${searchTerm}".`
              : 'Nenhum integrante cadastrado nesta categoria de filtro.'}
          </p>
          {searchTerm && (
            <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>
              Limpar Pesquisa
            </Button>
          )}
        </Card>
      )}

      {/* Modal de Cadastro / Edição */}
      <IntegranteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        integranteToEdit={selectedIntegrante}
        existingIntegrantes={allIntegrantes}
        onSuccess={async () => {
          setFeedbackMsg({
            type: 'success',
            text: selectedIntegrante
              ? `Integrante "${selectedIntegrante.nome}" atualizado com sucesso!`
              : 'Novo integrante cadastrado com sucesso!',
          });
          await refreshData();
        }}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
            setIntegranteToDelete(null);
            setDeleteErrorMsg(null);
          }
        }}
        integrante={integranteToDelete}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        errorMsg={deleteErrorMsg}
      />
    </div>
  );
};

