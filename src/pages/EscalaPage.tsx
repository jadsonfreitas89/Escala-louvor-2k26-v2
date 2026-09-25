import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  BellRing,
  Send,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEscala } from '../context/EscalaContext';
import { EscalaCard } from '../components/escala/EscalaCard';
import { EscalaDetailsModal } from '../components/escala/EscalaDetailsModal';
import { EditEscalaModal } from '../components/escala/EditEscalaModal';
import { NovaSolicitacaoModal } from '../components/solicitacoes/NovaSolicitacaoModal';
import { EscalaFilters, TabPeriodo } from '../components/escala/EscalaFilters';
import { CacheStatusBanner } from '../components/escala/CacheStatusBanner';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { Escala } from '../types';
import { apiService } from '../services/api';
import {
  parseDate,
  isUpcoming,
  isUserInEscala,
  getTituloCulto,
  normalizarNome
} from '../utils/cultoUtils';

export const EscalaPage: React.FC = () => {
  const { user, isLider, isDirigente } = useAuth();
  const {
    data,
    isLoading,
    isRefreshing,
    isFromCache,
    error,
    lastUpdated,
    refreshData
  } = useEscala();

  // Estados de Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [periodo, setPeriodo] = useState<TabPeriodo>('proximas');
  const [onlyMyScales, setOnlyMyScales] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedCulto, setSelectedCulto] = useState('');

  // Modais
  const [selectedEscala, setSelectedEscala] = useState<Escala | null>(null);
  const [editingEscala, setEditingEscala] = useState<Escala | null>(null);
  const [trocaEscala, setTrocaEscala] = useState<Escala | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Notificar Nova Escala
  const [isNotifying, setIsNotifying] = useState(false);
  const [showConfirmNotificar, setShowConfirmNotificar] = useState(false);
  const [targetNotifMonth, setTargetNotifMonth] = useState('');

  const handleDispararNotificacaoNovaEscala = async () => {
    setIsNotifying(true);
    setFeedbackError(null);
    try {
      const mesToSend = targetNotifMonth || selectedMonth || undefined;
      const res = await apiService.notificarNovaEscala(mesToSend);
      if (res.sucesso) {
        setFeedbackSuccess(res.mensagem || 'Notificação da nova escala enviada com sucesso a todos os integrantes!');
        setShowConfirmNotificar(false);
        setTimeout(() => setFeedbackSuccess(null), 5000);
      } else {
        if (res.jaEnviada) {
          setFeedbackError(res.mensagem || 'A notificação desta escala já foi disparada anteriormente.');
        } else {
          setFeedbackError(res.mensagem || 'Não foi possível disparar a notificação.');
        }
        setShowConfirmNotificar(false);
        setTimeout(() => setFeedbackError(null), 6000);
      }
    } catch (err: any) {
      setFeedbackError('Erro de conexão ao disparar a notificação.');
      setShowConfirmNotificar(false);
      setTimeout(() => setFeedbackError(null), 5000);
    } finally {
      setIsNotifying(false);
    }
  };

  // Geração dinâmica de meses disponíveis a partir dos dados reais
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, string>();
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    data.escala.forEach((item) => {
      const d = parseDate(item.data);
      if (d) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        monthMap.set(key, label);
      }
    });

    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, label]) => ({ value, label }));
  }, [data.escala]);

  // Geração dinâmica de tipos de cultos disponíveis a partir dos dados reais
  const availableCultos = useMemo(() => {
    const cultosSet = new Set<string>();
    data.escala.forEach((item) => {
      const title = getTituloCulto(item.data);
      if (title && title !== 'Culto') {
        cultosSet.add(title);
      }
    });
    return Array.from(cultosSet).sort();
  }, [data.escala]);

  // Filtragem e Ordenação das Escalas
  const filteredEscalas = useMemo(() => {
    let list = [...data.escala];

    // 1. Filtro Temporal (Próximas x Anteriores)
    if (periodo === 'proximas') {
      list = list.filter((e) => isUpcoming(e.data));
    } else if (periodo === 'anteriores') {
      list = list.filter((e) => !isUpcoming(e.data));
    }

    // 2. Filtro "Minhas Escalas" (se ativado e usuário logado)
    if (onlyMyScales && user?.nome) {
      list = list.filter((e) => isUserInEscala(e, user.nome));
    }

    // 3. Filtro por Mês
    if (selectedMonth) {
      list = list.filter((e) => {
        const d = parseDate(e.data);
        if (!d) return false;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === selectedMonth;
      });
    }

    // 4. Filtro por Tipo de Culto
    if (selectedCulto) {
      list = list.filter((e) => getTituloCulto(e.data) === selectedCulto);
    }

    // 5. Termo de Busca Geral
    if (searchTerm.trim()) {
      const termNorm = normalizarNome(searchTerm);
      list = list.filter((e) => {
        const inData = (e.data || '').toLowerCase().includes(termNorm);
        const inDirigente = normalizarNome(e.dirigente).includes(termNorm);
        const inVocal = normalizarNome(e.vocal).includes(termNorm);
        const inMusicos = normalizarNome(e.musicos).includes(termNorm);
        const inMesario = normalizarNome(e.mesario).includes(termNorm);
        const inLouvores = normalizarNome(e.louvores).includes(termNorm);
        const inUniforme = normalizarNome(e.uniforme).includes(termNorm);
        const inCulto = normalizarNome(getTituloCulto(e.data)).includes(termNorm);

        return (
          inData ||
          inDirigente ||
          inVocal ||
          inMusicos ||
          inMesario ||
          inLouvores ||
          inUniforme ||
          inCulto
        );
      });
    }

    // Ordenação: Próximas em ordem crescente, Anteriores em ordem decrescente
    return list.sort((a, b) => {
      const dateA = parseDate(a.data)?.getTime() || 0;
      const dateB = parseDate(b.data)?.getTime() || 0;
      return periodo === 'anteriores' ? dateB - dateA : dateA - dateB;
    });
  }, [
    data.escala,
    periodo,
    onlyMyScales,
    user?.nome,
    selectedMonth,
    selectedCulto,
    searchTerm
  ]);

  const hasActiveFilters = Boolean(
    searchTerm || onlyMyScales || selectedMonth || selectedCulto
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setOnlyMyScales(false);
    setSelectedMonth('');
    setSelectedCulto('');
  };

  // 1. ESTADO DE CARREGAMENTO INICIAL
  if (isLoading && data.escala.length === 0) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingState message="Carregando escala do Google Apps Script..." />
      </div>
    );
  }

  // 2. ESTADO DE ERRO SEM DADOS EM CACHE
  if (error && data.escala.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center p-6 space-y-4 rounded-3xl bg-zinc-900/60 border border-red-500/20 max-w-lg mx-auto">
        <div className="p-3 rounded-2xl bg-red-500/10 text-red-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-100 mb-1">
            Falha ao carregar escalas reais
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">{error}</p>
        </div>
        <button
          onClick={() => refreshData()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black text-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Tentar Novamente</span>
        </button>
      </div>
    );
  }

  return (
    <div id="escala-page" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-100 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-orange-400" />
            Escala Geral de Louvor
          </h2>
          <p className="text-xs text-zinc-400">
            Consulte datas, equipes escaladas, louvores do culto e solicite substituições.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isLider && (
            <button
              id="btn-notificar-nova-escala"
              onClick={() => {
                setTargetNotifMonth(selectedMonth || (availableMonths[0]?.value ?? ''));
                setShowConfirmNotificar(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs shadow-md shadow-orange-500/10 transition-all cursor-pointer"
            >
              <BellRing className="w-4 h-4" />
              <span>Notificar Nova Escala</span>
            </button>
          )}

          {user && (
            <div className="px-3.5 py-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs">
              <span className="text-zinc-400">Logado como: </span>
              <span className="font-bold text-orange-400">{user.nome}</span>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Toast Success */}
      {feedbackSuccess && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
          <button
            onClick={() => setFeedbackSuccess(null)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Feedback Toast Error / Alert */}
      {feedbackError && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{feedbackError}</span>
          </div>
          <button
            onClick={() => setFeedbackError(null)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Cache / Sincronização Banner */}
      <CacheStatusBanner
        isFromCache={isFromCache}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={refreshData}
      />

      {/* Barra de Filtros */}
      <EscalaFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        periodo={periodo}
        onPeriodoChange={setPeriodo}
        onlyMyScales={onlyMyScales}
        onOnlyMyScalesChange={setOnlyMyScales}
        selectedMonth={selectedMonth}
        onSelectedMonthChange={setSelectedMonth}
        availableMonths={availableMonths}
        selectedCulto={selectedCulto}
        onSelectedCultoChange={setSelectedCulto}
        availableCultos={availableCultos}
        isUserLoggedIn={Boolean(user?.nome)}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Grid de Escalas */}
      {filteredEscalas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEscalas.map((escala) => (
            <EscalaCard
              key={`escala-${escala.data}`}
              escala={escala}
              currentUserNome={user?.nome}
              integrantes={data.integrantes}
              linkLouvores={data.linkLouvores}
              isLider={isLider}
              isDirigente={isDirigente}
              onOpenDetails={(e) => setSelectedEscala(e)}
              onRequestTroca={(e) => setTrocaEscala(e)}
              onEditEscala={(e) => setEditingEscala(e)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <EmptyState
          icon={CalendarDays}
          title="Nenhuma escala encontrada"
          description={
            hasActiveFilters
              ? 'Nenhuma escala corresponde aos filtros ou termo de busca selecionado.'
              : 'Não há cultos registrados para o período selecionado.'
          }
          actionLabel={hasActiveFilters ? 'Limpar Filtros' : undefined}
          onAction={hasActiveFilters ? handleClearFilters : undefined}
        />
      )}

      {/* Modal de Detalhes da Escala */}
      {selectedEscala && (
        <EscalaDetailsModal
          escala={selectedEscala}
          currentUserNome={user?.nome}
          integrantes={data.integrantes}
          linkLouvores={data.linkLouvores}
          isLider={isLider}
          isDirigente={isDirigente}
          onClose={() => setSelectedEscala(null)}
          onRequestTroca={(e) => {
            setSelectedEscala(null);
            setTrocaEscala(e);
          }}
          onEditEscala={(e) => {
            setSelectedEscala(null);
            setEditingEscala(e);
          }}
        />
      )}

      {/* Modal de Edição da Escala (Líder / Dirigente) */}
      {editingEscala && (
        <EditEscalaModal
          escala={editingEscala}
          linkLouvores={data.linkLouvores}
          integrantes={data.integrantes}
          isLider={isLider}
          isDirigente={isDirigente}
          onClose={() => setEditingEscala(null)}
          onSuccess={(msg) => {
            setFeedbackSuccess(msg);
            refreshData(true);
            setTimeout(() => setFeedbackSuccess(null), 4000);
          }}
        />
      )}

      {/* Modal de Criação de Solicitação de Troca */}
      {trocaEscala && user && (
        <NovaSolicitacaoModal
          currentUser={user}
          escalas={data.escala}
          integrantes={data.integrantes}
          initialEscala={trocaEscala}
          onClose={() => setTrocaEscala(null)}
          onSuccess={(msg) => {
            setFeedbackSuccess(msg);
            refreshData();
          }}
        />
      )}

      {/* Modal de Confirmação de Disparo de Notificação de Nova Escala */}
      {showConfirmNotificar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <BellRing className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  Notificar Nova Escala aos Integrantes
                </h3>
                <p className="text-xs text-zinc-400">
                  Um alerta oficial será enviado para todos os membros do ministério.
                </p>
              </div>
            </div>

            {availableMonths.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Selecione o mês de referência:
                </label>
                <select
                  value={targetNotifMonth}
                  onChange={(e) => setTargetNotifMonth(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="">Mês Atual / Ativo</option>
                  {availableMonths.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                <Info className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Anti-duplicação Ativa</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                O sistema impede disparos repetidos para a mesma escala/mês automaticamente no servidor.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmNotificar(false)}
                disabled={isNotifying}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-notificar-escala"
                onClick={handleDispararNotificacaoNovaEscala}
                disabled={isNotifying}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-zinc-950 text-xs font-black transition-all cursor-pointer"
              >
                {isNotifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirmar e Enviar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
