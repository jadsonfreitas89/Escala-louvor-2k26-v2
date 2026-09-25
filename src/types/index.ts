/**
 * Tipos de Domínio - ESCALA DE LOUVOR
 * Mapeamento dos modelos originais do Android / Google Sheets / Apps Script
 */

export type UserRole = 'LIDER' | 'DIRIGENTE' | 'INTEGRANTE' | 'VISITANTE';

export interface Integrante {
  nome: string;
  funcao: string;
  senha?: string;
  instrumento?: string;
  tokenFcm?: string;
}

export interface Escala {
  data: string; // Formato dd/MM/yyyy
  dirigente: string;
  vocal: string; // Nomes separados por vírgula
  musicos: string; // Músicos formatados ou separados por vírgula
  mesario: string;
  louvores: string; // Resumo textual
  uniforme: string;
}

export interface LouvorItem {
  id?: string;
  dataEscala?: string;
  data?: string;
  ordem?: number | string;
  louvor?: string;
  titulo?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  linkYoutube?: string;
  link_youtube?: string;
  playlistId?: string;
  playlistTitle?: string;
  thumbnailUrl?: string;
  createdAt?: string;
}

export interface YouTubePlaylistItem {
  videoId: string;
  title: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  position: number;
  playlistId: string;
  isAvailable?: boolean;
  unavailableReason?: string;
}

export interface YouTubePlaylistDetails {
  playlistId: string;
  playlistTitle: string;
  itemCount: number;
  thumbnailUrl?: string;
  items: YouTubePlaylistItem[];
}

export type SolicitacaoStatus = 'PENDENTE' | 'APROVADA' | 'RECUSADA' | 'CANCELADA';

export interface Solicitacao {
  id: string;
  dataEscala: string;
  quemPediu: string;
  funcao?: string;
  instrumento?: string;
  substituto: string;
  motivo: string;
  status: SolicitacaoStatus;
  dataCriacao?: string;
  dataDecisao?: string;
  decididoPor?: string;
  motivoDecisao?: string;
}

export interface Recado {
  id: string;
  titulo: string;
  mensagem: string;
  imagemUrl?: string;
  ativo: string; // "SIM" | "NAO"
  dataCriacao: string;
  dataAtualizacao?: string;
}

export type NotificacaoTipo =
  | 'CULTO'
  | 'NOVO_RECADO'
  | 'NOVA_ESCALA'
  | 'SOLICITACAO_NOVA'
  | 'SOLICITACAO_APROVADA'
  | 'SOLICITACAO_RECUSADA'
  | 'LOUVORES_UNIFORMES'
  | 'ESCALA'
  | 'RECADO'
  | 'SOLICITACAO'
  | 'LEMBRETE'
  | 'GERAL'
  | string;

export interface Notificacao {
  id: string;
  destinatario: string;
  titulo: string;
  mensagem: string;
  tipo: NotificacaoTipo;
  data: string; // ISO 8601 string
  dataHora?: string;
  lida: 'SIM' | 'NAO' | string;
  eventoId?: string;
  origem?: 'APP' | 'GOOGLE_SHEETS' | string;
}

export interface EscalaData {
  escala: Escala[];
  integrantes: Integrante[];
  solicitacoes: Solicitacao[];
  recados: Recado[];
  linkLouvores: LouvorItem[];
}

export interface ApiResponse<T> {
  sucesso: boolean;
  mensagem?: string;
  dados?: T;
  data?: T;
}

export interface UpdateResponse {
  sucesso: boolean;
  mensagem: string;
}

export interface AuthUser {
  nome: string;
  funcao: string;
  instrumento?: string;
  role: UserRole;
}

export interface LoginCredentials {
  nome: string;
  senha?: string;
}

export interface LoginResult {
  sucesso: boolean;
  mensagem?: string;
  token?: string;
  user?: AuthUser;
}

export interface AuthSession {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRole;
  isLider: boolean;
  isDirigente: boolean;
  isIntegrante: boolean;
}

export type AppRoute =
  | '/'
  | '/login'
  | '/escala'
  | '/recados'
  | '/solicitacoes'
  | '/notificacoes'
  | '/perfil'
  | '/configuracoes'
  | '/pwa-diagnostic';

export interface NavigationItem {
  name: string;
  path: AppRoute;
  iconName: string;
  badgeCount?: number;
  requiresAuth?: boolean;
  requiresLider?: boolean;
}
