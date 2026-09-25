import React from 'react';
import {
  CalendarDays,
  Sparkles,
  Users,
  MessageSquare,
  Repeat,
  Music,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEscala } from '../context/EscalaContext';
import { useNavigation } from '../context/NavigationContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/LoadingState';
import {
  getTituloCulto,
  getDiaSemanaExtenso,
  isUpcoming,
  isUserInEscala,
  getUserRoleInEscala
} from '../utils/cultoUtils';

export const HomePage: React.FC = () => {
  const { user, isLider, role } = useAuth();
  const { data, isLoading, isRefreshing } = useEscala();
  const { navigate } = useNavigation();

  if (isLoading && !data.escala.length) {
    return <LoadingState message="Carregando painel principal..." />;
  }

  // Ordena escalas futuras
  const proximasEscalas = data.escala
    .filter((e) => isUpcoming(e.data))
    .slice(0, 3);

  const proximoCultoGeral = proximasEscalas[0] || data.escala[0];

  // Escala onde o usuário atual está escalado
  const minhaProximaEscala = user
    ? data.escala.find((e) => isUpcoming(e.data) && isUserInEscala(e, user.nome))
    : null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="primary" size="sm">
                Ministério de Louvor
              </Badge>
              {isLider && (
                <Badge variant="amber" size="sm">
                  Painel da Liderança
                </Badge>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-zinc-100 tracking-tight">
              Olá, {user ? user.nome : 'Bem-vindo(a)'}!
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-xl">
              Acompanhe as escalas de cultos, hinos com links do YouTube, avisos e solicitações de substituição.
            </p>
          </div>

          <div>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/escala')}
              rightIcon={<ArrowRight size={16} />}
            >
              Ver Escalas
            </Button>
          </div>
        </div>
      </div>

      {/* Grid: Próximo Culto & Minha Escala */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card: Minha Próxima Escala */}
        <Card variant="highlight" className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                <Sparkles size={16} />
              </div>
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                Sua Próxima Escala
              </span>
            </div>
            {minhaProximaEscala && (
              <Badge variant="success" size="sm">
                Confirmado
              </Badge>
            )}
          </div>

          {user ? (
            minhaProximaEscala ? (
              <div className="space-y-3">
                <div>
                  <div className="text-xl font-black text-zinc-100">{minhaProximaEscala.data}</div>
                  <div className="text-xs text-orange-300 font-semibold">
                    {getTituloCulto(minhaProximaEscala.data)} • {getDiaSemanaExtenso(minhaProximaEscala.data)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Sua Função:</span>
                    <span className="font-bold text-orange-400">
                      {getUserRoleInEscala(minhaProximaEscala, user.nome)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Dirigente:</span>
                    <span className="text-zinc-300">{minhaProximaEscala.dirigente}</span>
                  </div>
                  {minhaProximaEscala.uniforme && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Uniforme:</span>
                      <span className="text-zinc-300 truncate max-w-[180px]">{minhaProximaEscala.uniforme}</span>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/escala')}
                  className="w-full"
                >
                  Ver Detalhes do Culto
                </Button>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-zinc-400">
                  Você não está escalado nos próximos cultos agendados.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/escala')}
                  className="mt-2 text-xs text-orange-400"
                >
                  Consultar escala geral →
                </Button>
              </div>
            )
          ) : (
            <div className="py-4 text-center space-y-3">
              <p className="text-xs text-zinc-400">
                Faça login para ver suas escalas individuais e receber avisos personalizados.
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                Fazer Login
              </Button>
            </div>
          )}
        </Card>

        {/* Card: Próximo Culto Geral */}
        <Card variant="default">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold">
                <CalendarDays size={16} />
              </div>
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Próximo Culto Geral
              </span>
            </div>
            {proximoCultoGeral && (
              <span className="text-[11px] text-zinc-500 font-semibold">
                {getDiaSemanaExtenso(proximoCultoGeral.data)}
              </span>
            )}
          </div>

          {proximoCultoGeral ? (
            <div className="space-y-3">
              <div>
                <div className="text-xl font-black text-zinc-100">{proximoCultoGeral.data}</div>
                <div className="text-xs text-zinc-400 font-semibold">
                  {getTituloCulto(proximoCultoGeral.data)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Dirigente:</span>
                  <span className="text-zinc-200 font-semibold">{proximoCultoGeral.dirigente}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Mesário:</span>
                  <span className="text-zinc-200">{proximoCultoGeral.mesario || 'A definir'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Louvores:</span>
                  <span className="text-zinc-400 truncate max-w-[200px]">
                    {proximoCultoGeral.louvores || 'Aguardando dirigente'}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/escala')}
                className="w-full"
              >
                Abrir Escala Completa
              </Button>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-zinc-500">
              Nenhuma escala futura cadastrada no momento.
            </div>
          )}
        </Card>
      </div>

      {/* Metrics / Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card variant="default" className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center font-bold">
            <CalendarDays size={18} />
          </div>
          <div>
            <div className="text-lg font-black text-zinc-100">{data.escala.length}</div>
            <div className="text-[10px] text-zinc-500 font-semibold uppercase">Escalas Totais</div>
          </div>
        </Card>

        <Card variant="default" className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
            <Users size={18} />
          </div>
          <div>
            <div className="text-lg font-black text-zinc-100">{data.integrantes.length}</div>
            <div className="text-[10px] text-zinc-500 font-semibold uppercase">Integrantes</div>
          </div>
        </Card>

        <Card variant="default" className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
            <MessageSquare size={18} />
          </div>
          <div>
            <div className="text-lg font-black text-zinc-100">
              {data.recados.filter((r) => r.ativo === 'SIM').length}
            </div>
            <div className="text-[10px] text-zinc-500 font-semibold uppercase">Recados Ativos</div>
          </div>
        </Card>

        <Card variant="default" className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
            <Repeat size={18} />
          </div>
          <div>
            <div className="text-lg font-black text-zinc-100">
              {data.solicitacoes.filter((s) => s.status === 'PENDENTE').length}
            </div>
            <div className="text-[10px] text-zinc-500 font-semibold uppercase">Trocas Pendentes</div>
          </div>
        </Card>
      </div>

      {/* Quick Access Modules */}
      <div>
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
          Acesso Rápido aos Módulos
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => navigate('/escala')}
            className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 cursor-pointer transition-all hover:-translate-y-0.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
              <Music size={18} />
            </div>
            <h4 className="text-sm font-bold text-zinc-200">Escala de Louvor</h4>
            <p className="text-xs text-zinc-500 mt-1">Consulte quem toca, canta, dirige e os hinos do culto.</p>
          </div>

          <div
            onClick={() => navigate('/recados')}
            className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 cursor-pointer transition-all hover:-translate-y-0.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
              <MessageSquare size={18} />
            </div>
            <h4 className="text-sm font-bold text-zinc-200">Mural de Avisos</h4>
            <p className="text-xs text-zinc-500 mt-1">Comunicados e informações gerais da liderança.</p>
          </div>

          <div
            onClick={() => navigate('/solicitacoes')}
            className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/40 cursor-pointer transition-all hover:-translate-y-0.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
              <Repeat size={18} />
            </div>
            <h4 className="text-sm font-bold text-zinc-200">Solicitar Substituição</h4>
            <p className="text-xs text-zinc-500 mt-1">Troca de data com aprovação de liderança.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
