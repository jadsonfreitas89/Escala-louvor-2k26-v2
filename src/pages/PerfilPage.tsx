import React from 'react';
import { User, Shield, Music, LogOut, CheckCircle2, Calendar, Repeat, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEscala } from '../context/EscalaContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigation } from '../context/NavigationContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { isUserInEscala } from '../utils/cultoUtils';

export const PerfilPage: React.FC = () => {
  const { user, isLider, isDirigente, role, logout } = useAuth();
  const { data } = useEscala();
  const { unreadCount, notificacoes } = useNotifications();
  const { navigate } = useNavigation();

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
          <User size={32} />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Nenhum Usuário Conectado</h2>
        <p className="text-xs text-zinc-400">
          Faça login com seu nome cadastrado na equipe de louvor para gerenciar suas escalas e perfil.
        </p>
        <Button variant="primary" onClick={() => navigate('/login')}>
          Acessar com Minha Conta
        </Button>
      </div>
    );
  }

  const cultosEscalados = data.escala.filter((e) => isUserInEscala(e, user.nome)).length;
  const minhasSolicitacoes = data.solicitacoes.filter(
    (s) => s.quemPediu.toLowerCase() === user.nome.toLowerCase()
  ).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Card */}
      <Card variant="default" className="text-center py-8 px-6 space-y-4 relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 text-zinc-950 flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-orange-500/20">
          {user.nome.charAt(0).toUpperCase()}
        </div>

        <div>
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">{user.nome}</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant={isLider ? 'primary' : isDirigente ? 'amber' : 'secondary'} size="md">
              <Shield size={12} />
              {isLider ? 'Líder do Ministério' : isDirigente ? 'Dirigente de Louvor' : user.funcao || 'Integrante'}
            </Badge>
          </div>
        </div>

        {user.instrumento && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
            <Music size={13} className="text-orange-400" />
            <span>Instrumento Principal: <strong className="text-zinc-200">{user.instrumento}</strong></span>
          </div>
        )}
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card variant="default" className="p-3.5 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold mb-1">
            <Calendar size={16} />
          </div>
          <div className="text-lg font-black text-zinc-100">{cultosEscalados}</div>
          <div className="text-[10px] text-zinc-500 font-semibold uppercase">Escalados</div>
        </Card>

        <Card variant="default" className="p-3.5 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold mb-1">
            <Repeat size={16} />
          </div>
          <div className="text-lg font-black text-zinc-100">{minhasSolicitacoes}</div>
          <div className="text-[10px] text-zinc-500 font-semibold uppercase">Trocas</div>
        </Card>

        <Card
          variant="default"
          onClick={() => navigate('/notificacoes')}
          className="p-3.5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-orange-500/40 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold mb-1 relative">
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-500" />
            )}
          </div>
          <div className="text-lg font-black text-zinc-100">{notificacoes.length}</div>
          <div className="text-[10px] text-zinc-500 font-semibold uppercase">
            {unreadCount > 0 ? `${unreadCount} Novas` : 'Avisos'}
          </div>
        </Card>
      </div>

      {/* Account Actions */}
      <Card variant="default" className="p-4 space-y-3">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ações da Conta</h4>

        <Button
          variant="secondary"
          size="md"
          onClick={() => navigate('/notificacoes')}
          leftIcon={<Bell size={16} />}
          className="w-full"
        >
          Abrir Central de Notificações {unreadCount > 0 ? `(${unreadCount} não lidas)` : ''}
        </Button>

        <Button
          variant="danger"
          size="md"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          leftIcon={<LogOut size={16} />}
          className="w-full"
        >
          Sair da Conta / Desconectar
        </Button>
      </Card>
    </div>
  );
};
