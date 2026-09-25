import React, { useState, useEffect } from 'react';
import { Music, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const { navigate } = useNavigation();

  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Por favor, informe seu nome.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await login(nome.trim(), senha.trim());
      if (res.sucesso) {
        navigate('/');
      } else {
        setError(res.mensagem || 'Credenciais inválidas. Verifique seus dados.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar autenticação com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-auto py-6 sm:py-10 px-2 sm:px-4 flex flex-col justify-center">
      {/* Brand Header */}
      <div className="text-center mb-6 sm:mb-8 space-y-3">
        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 text-zinc-950 flex items-center justify-center font-black mx-auto shadow-xl shadow-orange-500/20 ring-1 ring-orange-400/30">
          <Music size={32} className="stroke-[2.5]" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
            ESCALA DE <span className="text-orange-400">LOUVOR</span>
          </h1>
          <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">
            Acesso ao Sistema
          </p>
        </div>
      </div>

      {/* Login Card */}
      <Card variant="highlight" className="p-6 sm:p-8 space-y-6 shadow-2xl border-zinc-800/80">
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Nome Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-300">
              Seu Nome Cadastrado
            </label>
            <div className="relative">
              <User
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 uppercase font-medium transition-all"
                disabled={isSubmitting}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          {/* Senha Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300">Senha de Acesso</label>
              <span className="text-[11px] text-zinc-500 font-medium">
                Obrigatória para líderes/dirigentes
              </span>
            </div>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 font-medium transition-all"
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight size={18} />}
            className="w-full py-3.5 text-sm font-bold mt-2 shadow-lg shadow-orange-500/20"
          >
            Entrar no Sistema
          </Button>
        </form>

        <div className="pt-2 text-center border-t border-zinc-800/60">
          <div className="inline-flex items-center gap-2 text-xs text-zinc-500">
            <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
            <span>Autenticação protegida e sincronizada com a nuvem</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
