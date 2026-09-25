import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FileJson,
  Layers,
  Sparkles,
  ArrowLeft,
  Trash2,
  Download
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigation } from '../context/NavigationContext';

interface DiagnosticData {
  url: string;
  isHttps: boolean;
  isSecureContext: boolean;
  browserName: string;
  browserVersion: string;
  isAndroid: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  isInIframe: boolean;

  // Manifest
  manifestUrl: string;
  manifestHttpStatus: number | string;
  manifestContentType: string;
  manifestJsonValid: boolean;
  manifestData: any;

  // Icons
  icon192Status: number | string;
  icon192ValidImage: boolean;
  icon192Dimensions: string;
  icon512Status: number | string;
  icon512ValidImage: boolean;
  icon512Dimensions: string;
  iconMaskable192Status: number | string;
  iconMaskable512Status: number | string;

  // Service Worker
  swSupported: boolean;
  swRegistered: boolean;
  swScope: string;
  swState: string;
  swControllingPage: boolean;
  swScriptUrl: string;
  registrationsCount: number;

  // beforeinstallprompt
  beforeInstallPromptFired: boolean;
  appInstalledFired: boolean;
}

export const PwaDiagnosticPage: React.FC = () => {
  const { navigate } = useNavigation();
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setIsLoading(true);
    setActionMessage(null);

    const ua = navigator.userAgent;
    let browserName = 'Desconhecido';
    let browserVersion = '';

    if (/Chrome\/([0-9.]+)/.test(ua) && !/Edg/.test(ua) && !/OPR/.test(ua)) {
      browserName = 'Google Chrome';
      browserVersion = RegExp.$1;
    } else if (/Edg\/([0-9.]+)/.test(ua)) {
      browserName = 'Microsoft Edge';
      browserVersion = RegExp.$1;
    } else if (/Firefox\/([0-9.]+)/.test(ua)) {
      browserName = 'Mozilla Firefox';
      browserVersion = RegExp.$1;
    } else if (/Safari\/([0-9.]+)/.test(ua) && !/Chrome/.test(ua)) {
      browserName = 'Apple Safari';
      browserVersion = RegExp.$1;
    }

    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    const isSecureContext = window.isSecureContext === true;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    let isInIframe = false;
    try {
      isInIframe = window.self !== window.top;
    } catch {
      isInIframe = true;
    }

    // 1. Inspecionar Manifest no DOM e na Rede
    let manifestUrl = '';
    let manifestHttpStatus: number | string = 'Não encontrado';
    let manifestContentType = '';
    let manifestJsonValid = false;
    let manifestData: any = null;

    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (manifestLink && manifestLink.href) {
      manifestUrl = manifestLink.href;
      try {
        const res = await fetch(manifestUrl, { cache: 'no-store' });
        manifestHttpStatus = res.status;
        manifestContentType = res.headers.get('content-type') || '';
        if (res.ok) {
          manifestData = await res.json();
          manifestJsonValid = true;
        }
      } catch (err: any) {
        manifestHttpStatus = `Erro: ${err.message}`;
      }
    }

    // 2. Inspecionar Imagens Reais (Carregar via new Image() e fetch)
    const testImage = async (url: string): Promise<{ status: number | string; valid: boolean; dims: string }> => {
      try {
        const fetchRes = await fetch(url, { cache: 'no-store' });
        if (!fetchRes.ok) {
          return { status: fetchRes.status, valid: false, dims: '0x0' };
        }
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            resolve({ status: fetchRes.status, valid: true, dims: `${img.naturalWidth}x${img.naturalHeight}` });
          };
          img.onerror = () => {
            resolve({ status: fetchRes.status, valid: false, dims: 'Falha no decode' });
          };
          img.src = url;
        });
      } catch (err: any) {
        return { status: `Erro: ${err.message}`, valid: false, dims: 'Erro' };
      }
    };

    const i192 = await testImage('/icon-192.png');
    const i512 = await testImage('/icon-512.png');
    const im192 = await testImage('/icon-maskable-192.png');
    const im512 = await testImage('/icon-maskable-512.png');

    // 3. Service Worker
    const swSupported = 'serviceWorker' in navigator;
    let swRegistered = false;
    let swScope = '';
    let swState = 'Não registrado';
    let swControllingPage = false;
    let swScriptUrl = '';
    let registrationsCount = 0;

    if (swSupported) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        registrationsCount = regs.length;
        if (regs.length > 0) {
          const activeReg = regs[0];
          swRegistered = true;
          swScope = activeReg.scope;
          if (activeReg.active) {
            swState = 'Ativo (activated)';
            swScriptUrl = activeReg.active.scriptURL;
          } else if (activeReg.waiting) {
            swState = 'Aguardando (waiting)';
            swScriptUrl = activeReg.waiting.scriptURL;
          } else if (activeReg.installing) {
            swState = 'Instalando (installing)';
            swScriptUrl = activeReg.installing.scriptURL;
          }
        }
        swControllingPage = !!navigator.serviceWorker.controller;
      } catch (err: any) {
        swState = `Erro: ${err.message}`;
      }
    }

    const beforeInstallPromptFired = !!(window as any).__pwa_deferred_prompt;
    const appInstalledFired = !!(window as any).__pwa_app_installed;

    setData({
      url: window.location.href,
      isHttps,
      isSecureContext,
      browserName,
      browserVersion,
      isAndroid,
      isIOS,
      isStandalone,
      isInIframe,
      manifestUrl,
      manifestHttpStatus,
      manifestContentType,
      manifestJsonValid,
      manifestData,
      icon192Status: i192.status,
      icon192ValidImage: i192.valid,
      icon192Dimensions: i192.dims,
      icon512Status: i512.status,
      icon512ValidImage: i512.valid,
      icon512Dimensions: i512.dims,
      iconMaskable192Status: im192.status,
      iconMaskable512Status: im512.status,
      swSupported,
      swRegistered,
      swScope,
      swState,
      swControllingPage,
      swScriptUrl,
      registrationsCount,
      beforeInstallPromptFired,
      appInstalledFired,
    });

    setIsLoading(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const handleTriggerInstall = async () => {
    const promptEvent = (window as any).__pwa_deferred_prompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        setActionMessage(`Resultado da escolha do usuário: ${choice.outcome}`);
      } catch (err: any) {
        setActionMessage(`Erro ao abrir prompt: ${err.message}`);
      }
    } else {
      setActionMessage('Evento beforeinstallprompt ainda não foi disparado pelo navegador.');
    }
  };

  const handleClearSWAndCache = async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
      }
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const k of keys) {
        await caches.delete(k);
      }
    }
    setActionMessage('Service Workers e caches limpos com sucesso. Recarregando página em 1 segundo...');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/configuracoes')}
            className="p-2"
            title="Voltar às Configurações"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              <Smartphone className="text-orange-500" />
              <span>Diagnóstico PWA em Produção</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Auditoria em tempo real de conformidade com os critérios de instalação do Chromium / Android
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostic}
            leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
          >
            Reexecutar Testes
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSWAndCache}
            leftIcon={<Trash2 size={14} className="text-rose-400" />}
            className="text-rose-400 hover:bg-rose-500/10"
          >
            Limpar SW & Cache
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs font-mono">
          ℹ️ {actionMessage}
        </div>
      )}

      {/* Aviso de Iframe */}
      {data?.isInIframe && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Atenção: Aplicação sendo executada dentro de um iframe (Preview)</span>
          </div>
          <p className="text-zinc-300">
            Navegadores como o Google Chrome <strong>bloqueiam o evento <code>beforeinstallprompt</code> e a opção de instalação de PWA</strong> quando o site está aninhado em um frame/preview.
            Para testar a instalação real no celular, abra a aplicação em uma aba direta:
          </p>
          <a
            href={window.location.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-xs bg-amber-400 text-zinc-950 px-3.5 py-2 rounded-xl hover:bg-amber-300 transition"
          >
            <span>Abrir em Nova Aba Externa</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {isLoading || !data ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
          <span className="text-sm">Auditando ambiente e critérios PWA...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card 1: Ambiente e Dispositivo */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold text-zinc-100 text-sm border-b border-zinc-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>1. Ambiente e Contexto do Navegador</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <StatusRow label="URL" value={data.url} status="info" />
              <StatusRow label="HTTPS" value={data.isHttps ? 'Sim' : 'Não'} status={data.isHttps ? 'ok' : 'fail'} />
              <StatusRow label="isSecureContext" value={data.isSecureContext ? 'Sim' : 'Não'} status={data.isSecureContext ? 'ok' : 'fail'} />
              <StatusRow label="Navegador" value={`${data.browserName} ${data.browserVersion}`} status="info" />
              <StatusRow label="Android Detectado" value={data.isAndroid ? 'Sim' : 'Não'} status="info" />
              <StatusRow label="iOS Detectado" value={data.isIOS ? 'Sim' : 'Não'} status="info" />
              <StatusRow label="Modo Standalone (PWA Ativo)" value={data.isStandalone ? 'Sim' : 'Não'} status={data.isStandalone ? 'ok' : 'info'} />
              <StatusRow label="Dentro de Iframe" value={data.isInIframe ? 'Sim (Bloqueia prompt)' : 'Não (Aba direta)'} status={data.isInIframe ? 'warn' : 'ok'} />
            </div>
          </Card>

          {/* Card 2: Manifest */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2 font-bold text-zinc-100 text-sm">
                <FileJson className="w-4 h-4 text-orange-400" />
                <span>2. Web App Manifest</span>
              </div>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${data.manifestJsonValid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                HTTP {data.manifestHttpStatus}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <StatusRow label="Manifest URL" value={data.manifestUrl} status={data.manifestUrl ? 'ok' : 'fail'} />
              <StatusRow label="Content-Type" value={data.manifestContentType} status={data.manifestContentType.includes('manifest') || data.manifestContentType.includes('json') ? 'ok' : 'fail'} />
              <StatusRow label="JSON Válido" value={data.manifestJsonValid ? 'Sim' : 'Não'} status={data.manifestJsonValid ? 'ok' : 'fail'} />
              <StatusRow label="name" value={data.manifestData?.name || 'Ausente'} status={data.manifestData?.name ? 'ok' : 'fail'} />
              <StatusRow label="short_name" value={data.manifestData?.short_name || 'Ausente'} status={data.manifestData?.short_name ? 'ok' : 'fail'} />
              <StatusRow label="id" value={data.manifestData?.id || 'Ausente'} status={data.manifestData?.id ? 'ok' : 'warn'} />
              <StatusRow label="start_url" value={data.manifestData?.start_url || 'Ausente'} status={data.manifestData?.start_url ? 'ok' : 'fail'} />
              <StatusRow label="scope" value={data.manifestData?.scope || 'Ausente'} status={data.manifestData?.scope === '/' ? 'ok' : 'warn'} />
              <StatusRow label="display" value={data.manifestData?.display || 'Ausente'} status={data.manifestData?.display === 'standalone' ? 'ok' : 'fail'} />
              <StatusRow label="theme_color" value={data.manifestData?.theme_color || 'Ausente'} status={data.manifestData?.theme_color ? 'ok' : 'warn'} />
            </div>
          </Card>

          {/* Card 3: Ícones */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold text-zinc-100 text-sm border-b border-zinc-800 pb-2">
              <Layers className="w-4 h-4 text-orange-400" />
              <span>3. Auditoria de Ícones PWA (192x192 e 512x512)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <StatusRow
                label="icon-192.png (Any)"
                value={`HTTP ${data.icon192Status} | ${data.icon192Dimensions} | ${data.icon192ValidImage ? 'Decodificado' : 'Falha'}`}
                status={data.icon192ValidImage ? 'ok' : 'fail'}
              />
              <StatusRow
                label="icon-512.png (Any)"
                value={`HTTP ${data.icon512Status} | ${data.icon512Dimensions} | ${data.icon512ValidImage ? 'Decodificado' : 'Falha'}`}
                status={data.icon512ValidImage ? 'ok' : 'fail'}
              />
              <StatusRow
                label="icon-maskable-192.png"
                value={`HTTP ${data.iconMaskable192Status}`}
                status={data.iconMaskable192Status === 200 ? 'ok' : 'warn'}
              />
              <StatusRow
                label="icon-maskable-512.png"
                value={`HTTP ${data.iconMaskable512Status}`}
                status={data.iconMaskable512Status === 200 ? 'ok' : 'warn'}
              />
            </div>
          </Card>

          {/* Card 4: Service Worker */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2 font-bold text-zinc-100 text-sm">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>4. Service Worker e Controle de Página</span>
              </div>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${data.swRegistered ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                {data.swState}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <StatusRow label="SW Suportado pelo Navegador" value={data.swSupported ? 'Sim' : 'Não'} status={data.swSupported ? 'ok' : 'fail'} />
              <StatusRow label="SW Registrado" value={data.swRegistered ? 'Sim' : 'Não'} status={data.swRegistered ? 'ok' : 'fail'} />
              <StatusRow label="Escopo do SW" value={data.swScope || 'Nenhum'} status={data.swScope.endsWith('/') ? 'ok' : 'fail'} />
              <StatusRow label="SW Controlando Página Atual" value={data.swControllingPage ? 'Sim (controller ativo)' : 'Não (recarga pendente)'} status={data.swControllingPage ? 'ok' : 'warn'} />
              <StatusRow label="URL do Script SW" value={data.swScriptUrl || 'Nenhuma'} status="info" />
              <StatusRow label="Total de Registros de SW" value={String(data.registrationsCount)} status={data.registrationsCount === 1 ? 'ok' : data.registrationsCount > 1 ? 'warn' : 'fail'} />
            </div>
          </Card>

          {/* Card 5: Evento beforeinstallprompt e Instalação */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold text-zinc-100 text-sm border-b border-zinc-800 pb-2">
              <Download className="w-4 h-4 text-orange-400" />
              <span>5. Evento beforeinstallprompt & Ação Nativa</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <StatusRow
                label="Evento beforeinstallprompt Capturado"
                value={data.beforeInstallPromptFired ? '✅ Capturado e pronto para prompt()' : '⚠️ Aguardando disparo do navegador'}
                status={data.beforeInstallPromptFired ? 'ok' : 'warn'}
              />
              <StatusRow
                label="Evento appinstalled Disparado"
                value={data.appInstalledFired ? 'Sim (App instalado)' : 'Não'}
                status={data.appInstalledFired ? 'ok' : 'info'}
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={handleTriggerInstall}
                leftIcon={<Download size={14} />}
                disabled={!data.beforeInstallPromptFired}
              >
                Disparar prompt() Nativo Agora
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const StatusRow: React.FC<{ label: string; value: string; status: 'ok' | 'fail' | 'warn' | 'info' }> = ({
  label,
  value,
  status,
}) => {
  let icon = null;
  let textColor = 'text-zinc-300';

  if (status === 'ok') {
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />;
    textColor = 'text-emerald-300';
  } else if (status === 'fail') {
    icon = <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />;
    textColor = 'text-rose-300';
  } else if (status === 'warn') {
    icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />;
    textColor = 'text-amber-300';
  }

  return (
    <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-1 min-w-0">
      <span className="text-[11px] text-zinc-500 truncate">{label}:</span>
      <div className={`flex items-center gap-1.5 font-bold truncate ${textColor}`}>
        {icon}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
};
