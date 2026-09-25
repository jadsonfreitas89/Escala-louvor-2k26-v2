import React, { useState } from 'react';
import {
  Settings,
  Cloud,
  Database,
  RefreshCw,
  Trash2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Bell,
  BellRing
} from 'lucide-react';
import { useEscala } from '../context/EscalaContext';
import { useNotifications } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const ConfiguracoesPage: React.FC = () => {
  const { isRefreshing, refreshData, lastUpdated } = useEscala();
  const {
    browserPermission,
    isWebPushSupported,
    requestBrowserPermission,
    refreshNotificacoes,
    lastChecked
  } = useNotifications();
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleClearCache = () => {
    localStorage.removeItem('escala_louvor_cache_v2');
    localStorage.removeItem('escala_louvor_notificacoes_cache');
    setCacheCleared(true);
    setTimeout(() => {
      refreshData();
      refreshNotificacoes();
      setCacheCleared(false);
    }, 800);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-zinc-100">Configurações</h2>
        <p className="text-xs text-zinc-400">
          Gerenciamento de notificações, cache local e conectividade com o Google Apps Script.
        </p>
      </div>

      {/* Notifications Section */}
      <Card variant="default" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center font-bold">
              <BellRing size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Notificações no Navegador</h3>
              <p className="text-[11px] text-zinc-400">Alertas de cultos, recados e solicitações</p>
            </div>
          </div>

          <Badge
            variant={
              browserPermission === 'granted'
                ? 'success'
                : browserPermission === 'denied'
                ? 'danger'
                : 'secondary'
            }
            size="sm"
          >
            {browserPermission === 'granted'
              ? 'Ativadas'
              : browserPermission === 'denied'
              ? 'Bloqueadas no Navegador'
              : 'Não Solicitadas'}
          </Badge>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/70">
            <span className="text-zinc-400">Fuso Horário Padrão:</span>
            <span className="text-zinc-200 font-mono font-semibold">America/Sao_Paulo (BRT)</span>
          </div>

          {lastChecked && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/70">
              <span className="text-zinc-400">Última Checagem de Avisos:</span>
              <span className="text-zinc-200 font-mono">
                {lastChecked.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </span>
            </div>
          )}
        </div>

        {isWebPushSupported && browserPermission !== 'granted' && (
          <Button
            variant="primary"
            size="sm"
            onClick={requestBrowserPermission}
            leftIcon={<Bell size={14} />}
            className="w-full"
          >
            Ativar Alertas no Navegador
          </Button>
        )}
      </Card>

      {/* Backend & Cloud Connectivity */}
      <Card variant="default" className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
            <Cloud size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Serviço de Backend</h3>
            <p className="text-[11px] text-zinc-400">Google Apps Script & Google Sheets</p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/70">
            <span className="text-zinc-400">Status da Conexão:</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Ativo e Sincronizado
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/70">
            <span className="text-zinc-400">Última Atualização:</span>
            <span className="text-zinc-200 font-mono">
              {lastUpdated ? lastUpdated.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Aguardando sincronização'}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refreshData();
            refreshNotificacoes();
          }}
          isLoading={isRefreshing}
          leftIcon={<RefreshCw size={14} />}
          className="w-full"
        >
          Forçar Sincronização Agora
        </Button>
      </Card>

      {/* Cache Management */}
      <Card variant="default" className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold">
            <Database size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Armazenamento Local</h3>
            <p className="text-[11px] text-zinc-400">Cache para acesso offline e performance</p>
          </div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Os dados das escalas, recados e notificações são armazenados localmente para garantir rapidez no carregamento e funcionamento sem sinal de internet.
        </p>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleClearCache}
          leftIcon={<Trash2 size={14} className="text-rose-400" />}
          className="w-full"
        >
          {cacheCleared ? 'Cache Limpo! Recarregando...' : 'Limpar Dados em Cache'}
        </Button>
      </Card>

      {/* System Info */}
      <div className="text-center py-4 text-[11px] text-zinc-600 space-y-1">
        <div>ESCALA DE LOUVOR • Edição Web</div>
        <div>Construído com React, TypeScript, Vite e Tailwind CSS</div>
      </div>
    </div>
  );
};
