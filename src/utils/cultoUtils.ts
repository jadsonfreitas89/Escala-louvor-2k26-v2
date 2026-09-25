import { Escala, Integrante, LouvorItem } from '../types';

/**
 * Utilitários de Regras de Negócio de Cultos e Escalas
 * Portado fielmente do Android Kotlin (CultoUtils.kt e EscalaShared.kt)
 */

/**
 * Normaliza strings de data no padrão brasileiro "dd/MM/yyyy"
 * Trata variações como "dd/MM/yy" e caracteres invisíveis / espaços
 */
export function cleanDateString(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (!str) return '';

  // Formato ISO: 2026-03-15 ou 2026-03-15T00:00:00.000Z
  if (str.includes('-')) {
    const isoParts = str.split('T')[0].split('-');
    if (isoParts.length === 3 && isoParts[0].length === 4) {
      const year = isoParts[0];
      const month = String(parseInt(isoParts[1], 10) || 0).padStart(2, '0');
      const day = String(parseInt(isoParts[2], 10) || 0).padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
  }

  // Formato com barras: 1/3/2026, 01/03/2026, 1/3/26, 01/03/26
  if (str.includes('/')) {
    const cleanOnly = str.replace(/[^0-9/]/g, '');
    const parts = cleanOnly.split('/');
    if (parts.length === 3) {
      const day = String(parseInt(parts[0], 10) || 0).padStart(2, '0');
      const month = String(parseInt(parts[1], 10) || 0).padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) year = `20${year}`;
      return `${day}/${month}/${year}`;
    }
  }

  return str.replace(/[^0-9/]/g, '');
}

/**
 * Converte data em formato brasileiro "dd/MM/yyyy" para objeto Date
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
  const clean = cleanDateString(dateStr);
  if (!clean) return null;
  const parts = clean.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed no JS
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
}

/**
 * Formata um objeto Date para "dd/MM/yyyy"
 */
export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Calcula qual domingo do mês a data representa (1º, 2º, 3º...)
 * Equivalente a getNthSundayOfMonth do Kotlin
 */
export function getNthSundayOfMonth(date: Date): number {
  let count = 0;
  const year = date.getFullYear();
  const month = date.getMonth();
  const targetDay = date.getDate();

  for (let day = 1; day <= targetDay; day++) {
    const d = new Date(year, month, day);
    if (d.getDay() === 0) {
      count++;
    }
  }
  return count;
}

/**
 * Obtém o nome/título oficial do culto baseado na data e regras do ministério
 * Regras:
 * - TERÇA: Culto da Família
 * - SEXTA: Cura e Libertação
 * - DOMINGO: 1º Ceia, 2º Oferta, 3º+ Louvor e Adoração
 */
export function getTituloCulto(dataStr: string): string {
  const date = parseDate(dataStr);
  if (!date) return 'Culto';

  const dayOfWeek = date.getDay(); // 0 = Domingo, 2 = Terça, 5 = Sexta

  switch (dayOfWeek) {
    case 2: // Terça-feira
      return 'Culto da Família';
    case 5: // Sexta-feira
      return 'Cura e Libertação';
    case 0: { // Domingo
      const weekOfMonth = getNthSundayOfMonth(date);
      if (weekOfMonth === 1) return 'CEIA';
      if (weekOfMonth === 2) return 'Oferta';
      return 'Louvor e Adoração';
    }
    case 6: // Sábado
      return 'Culto de Jovens';
    default:
      return 'Culto';
  }
}

/**
 * Retorna o dia da semana formatado por extenso em português
 */
export function getDiaSemanaExtenso(dataStr: string): string {
  const date = parseDate(dataStr);
  if (!date) return '';
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return dias[date.getDay()];
}

/**
 * Retorna o dia da semana curto (ex: "DOM", "TER", "SEX")
 */
export function getDiaSemanaCurto(dataStr: string): string {
  const date = parseDate(dataStr);
  if (!date) return '';
  const dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  return dias[date.getDay()];
}

/**
 * Verifica se a data da escala é o dia atual
 */
export function isToday(dataStr: string): boolean {
  const date = parseDate(dataStr);
  if (!date) return false;
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

/**
 * Verifica se uma data é futura ou hoje
 */
export function isUpcoming(dataStr: string): boolean {
  const date = parseDate(dataStr);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date.getTime() >= today.getTime();
}

/**
 * Normalizador de texto para correspondência resiliente (remove acentos e espaços)
 */
export function normalizarNome(txt: string | null | undefined): string {
  if (!txt) return '';
  return txt
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Tabela de apelidos comuns da planilha para garantir correspondência precisa
 */
const NICKNAME_ALIASES: Record<string, string[]> = {
  cristina: ['cris', 'cristina'],
  vitoria: ['vitorinha', 'vitoria', 'vitória'],
  tuida: ['tuida', 'tuída'],
  jadson: ['jadson'],
  rodrigo: ['rodrigo'],
  jaco: ['jaco', 'jacó'],
  victoria: ['victoria'],
  sergio: ['sergio', 'sérgio'],
  otavio: ['otavio', 'otávio'],
  carivaldo: ['carivaldo'],
  thais: ['thais', 'thaís'],
  luciana: ['luciana'],
  isa: ['isa'],
  pietro: ['pietro'],
  samuel: ['samuel'],
  neuza: ['neuza'],
  aniza: ['aniza'],
  maisa: ['maisa', 'maísa'],
  sulamita: ['sulamita'],
  ivone: ['ivone']
};

/**
 * Testa se um nome ou alias está presente em uma linha de integrantes
 */
function containsMember(fieldContent: string | undefined, searchName: string): boolean {
  if (!fieldContent || !searchName) return false;
  const normField = normalizarNome(fieldContent);
  const normSearch = normalizarNome(searchName);

  if (normField.includes(normSearch)) return true;

  // Verifica aliases
  const aliases = NICKNAME_ALIASES[normSearch];
  if (aliases) {
    return aliases.some(alias => normField.includes(alias));
  }

  return false;
}

/**
 * Verifica se um usuário específico está escalado em qualquer função no culto
 */
export function isUserInEscala(escala: Escala, nome?: string | null): boolean {
  if (!nome || !escala) return false;
  return (
    containsMember(escala.dirigente, nome) ||
    containsMember(escala.vocal, nome) ||
    containsMember(escala.musicos, nome) ||
    containsMember(escala.mesario, nome)
  );
}

/**
 * Retorna as funções exatas nas quais o usuário está escalado neste dia
 */
export function getUserRoleInEscala(
  escala: Escala,
  nome?: string | null,
  integrantes: Integrante[] = []
): string | null {
  if (!nome || !escala) return null;

  const roles: string[] = [];

  if (containsMember(escala.dirigente, nome)) {
    roles.push('Dirigente');
  }
  if (containsMember(escala.vocal, nome)) {
    roles.push('Vocal');
  }
  if (containsMember(escala.musicos, nome)) {
    const inst = getMyInstrument(escala, nome, integrantes);
    roles.push(inst ? `Músico (${inst})` : 'Músico');
  }
  if (containsMember(escala.mesario, nome)) {
    roles.push('Mesário');
  }

  return roles.length > 0 ? roles.join(' • ') : null;
}

/**
 * Obtém o instrumento do usuário para a escala específica
 */
export function getMyInstrument(
  escala: Escala,
  nome: string,
  integrantes: Integrante[] = []
): string | null {
  if (!nome || !escala.musicos) return null;
  const normName = normalizarNome(nome);

  // Procura no campo de músicos se já vem no formato "Nome — Instrumento"
  const parts = escala.musicos.split(/[,X]/i);
  for (const part of parts) {
    if (normalizarNome(part).includes(normName)) {
      if (part.includes('—') || part.includes('-')) {
        const separator = part.includes('—') ? '—' : '-';
        const inst = part.split(separator)[1]?.trim();
        if (inst) return inst;
      }
    }
  }

  // Fallback para o cadastro do integrante
  const member = integrantes.find(i => normalizarNome(i.nome) === normName);
  return member?.instrumento || null;
}

/**
 * Formata os músicos vinculando o instrumento cadastrado
 * Trata separadores 'X' ou vírgulas
 */
export function formatMusiciansWithInstrument(musicosStr: string, integrantes: Integrante[]): string {
  if (!musicosStr) return '';
  const names = musicosStr.split(/[\nX,]/i).map(s => s.trim()).filter(Boolean);

  return names
    .map(name => {
      if (name.includes('—') || name.includes('-') || name.includes('(')) return name;
      const found = integrantes.find(i => normalizarNome(i.nome) === normalizarNome(name));
      if (found && found.instrumento) {
        return `${name} (${found.instrumento})`;
      }
      return name;
    })
    .join(' • ');
}

/**
 * Valida se uma string é uma URL válida e segura do YouTube.
 * Aceita formatos oficiais:
 * - https://www.youtube.com/watch?v=XXXXXXXXXXX
 * - https://youtube.com/watch?v=XXXXXXXXXXX
 * - https://youtu.be/XXXXXXXXXXX
 * - https://www.youtube.com/shorts/XXXXXXXXXXX
 * - https://music.youtube.com/watch?v=XXXXXXXXXXX
 * - https://m.youtube.com/watch?v=XXXXXXXXXXX
 * - youtube.com/watch?v=XXXXXXXXXXX (com normalização)
 * - youtu.be/XXXXXXXXXXX (com normalização)
 *
 * Rejeita URLs de domínios desconhecidos, javascript:, etc.
 */
export function isValidYouTubeUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Se não tiver protocolo, adiciona https:// temporariamente para validação
  const urlWithProtocol = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(urlWithProtocol);
    const hostname = parsed.hostname.toLowerCase();

    // Domínios estritamente permitidos do YouTube
    const allowedHosts = [
      'youtube.com',
      'www.youtube.com',
      'm.youtube.com',
      'music.youtube.com',
      'youtu.be'
    ];

    if (!allowedHosts.includes(hostname)) {
      return false;
    }

    // Validação de caminhos válidos
    if (hostname === 'youtu.be') {
      const videoId = parsed.pathname.replace(/^\//, '').split(/[\/\?\#]/)[0];
      return videoId.length === 11 && /^[\w-]{11}$/.test(videoId);
    }

    if (parsed.pathname.startsWith('/watch')) {
      const v = parsed.searchParams.get('v');
      return Boolean(v && v.length === 11 && /^[\w-]{11}$/.test(v));
    }

    if (parsed.pathname.startsWith('/shorts/') || parsed.pathname.startsWith('/embed/') || parsed.pathname.startsWith('/v/')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      const videoId = parts[1]?.split(/[\/\?\#]/)[0];
      return Boolean(videoId && videoId.length === 11 && /^[\w-]{11}$/.test(videoId));
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Normaliza e extrai link válido e seguro do YouTube.
 * Retorna a URL normalizada com https:// ou null se não for válida.
 */
export function getCleanYouTubeUrl(link?: string | null): string | null {
  if (!link || typeof link !== 'string') return null;
  let trimmed = link.trim();
  if (!trimmed) return null;

  // Se já for um videoId de 11 caracteres
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube.com/watch?v=${trimmed}`;
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }

  if (isValidYouTubeUrl(trimmed)) {
    return trimmed;
  }

  // Tenta extrair o videoId mesmo se a URL tiver parâmetros extras
  const id = getYouTubeId(trimmed);
  if (id) {
    return `https://www.youtube.com/watch?v=${id}`;
  }

  return null;
}

/**
 * Extrai o ID do vídeo do YouTube para eventuais miniaturas ou embeds
 */
export function getYouTubeId(urlOrId?: string | null): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // Caso 1: ID direto de 11 caracteres
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Caso 2: URL completa ou com parâmetros
  try {
    const fullUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
    const parsed = new URL(fullUrl);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '').split(/[\/\?\#]/)[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    if (parsed.pathname.startsWith('/watch')) {
      const v = parsed.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    }

    if (parsed.pathname.startsWith('/shorts/') || parsed.pathname.startsWith('/embed/') || parsed.pathname.startsWith('/v/')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      const id = parts[1]?.split(/[\/\?\#]/)[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
  } catch (e) {
    // Ignora erro de parsing e tenta regex
  }

  const match = trimmed.match(/(?:v=|youtu\.be\/|\/v\/|\/embed\/|\/shorts\/)([\w-]{11})/i);
  return match && match[1] && /^[a-zA-Z0-9_-]{11}$/.test(match[1]) ? match[1] : null;
}

/**
 * Faz o parsing inteligente de uma linha textual de louvor,
 * extraindo o nome da música e o link do YouTube (caso exista).
 */
export function parseLouvorLine(
  rawLine: string,
  index: number,
  escalaData: string
): LouvorItem {
  let line = (rawLine || '').trim();
  // Remove prefixo numérico como "1. ", "1 - ", "(1) ", "1) "
  line = line.replace(/^(\(\d+\)|\d+[\.\-\)])\s*/i, '').trim();

  let extractedUrl: string = '';

  // Procura por URLs do YouTube na linha (parênteses, colchetes, pipes ou direto)
  const ytMatch = line.match(/(https?:\/\/[^\s\)\],]+|(?:www\.|m\.|music\.)?youtube\.com\/[^\s\)\],]+|youtu\.be\/[^\s\)\],]+)/i);

  if (ytMatch) {
    const rawMatch = ytMatch[0];
    const cleanUrl = getCleanYouTubeUrl(rawMatch);
    if (cleanUrl) {
      extractedUrl = cleanUrl;
      // Remove o link e delimitadores ao redor da URL
      line = line
        .replace(rawMatch, '')
        .replace(/\(\s*\)/g, '')
        .replace(/\[\s*\]/g, '')
        .replace(/\s*\|\s*$/, '')
        .replace(/^\s*\|\s*/, '')
        .replace(/\s*-\s*$/, '')
        .replace(/[\|\(\)\[\]\-]+$/, '')
        .trim();
    }
  }

  const finalName = line || rawLine.trim();
  const videoId = getYouTubeId(extractedUrl) || '';
  const finalUrl = extractedUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '');

  return {
    id: `louvor-${escalaData.replace(/[^0-9]/g, '')}-${index}`,
    data: escalaData,
    dataEscala: escalaData,
    ordem: index + 1,
    louvor: finalName,
    titulo: finalName,
    youtubeVideoId: videoId || undefined,
    youtubeUrl: finalUrl,
    linkYoutube: finalUrl,
    link_youtube: finalUrl,
    thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined
  };
}

/**
 * Converte a lista estruturada de louvores em texto LIMPO para a aba ESCALA (sem URLs do YouTube)
 */
export function formatLouvoresListToCleanText(
  songs: Array<{ louvor?: string; titulo?: string; nome?: string; youtubeUrl?: string; linkYoutube?: string; link_youtube?: string }>
): string {
  if (!songs || songs.length === 0) {
    return '';
  }

  return songs
    .map((s, idx) => {
      let songName = (s.louvor || s.titulo || s.nome || '').trim();
      if (!songName) return null;

      // Remove qualquer resquício de URL ou parênteses com URL do nome
      songName = songName
        .replace(/(https?:\/\/[^\s\)\],]+|(?:www\.|m\.|music\.)?youtube\.com\/[^\s\)\],]+|youtu\.be\/[^\s\)\],]+)/gi, '')
        .replace(/\(\s*\)/g, '')
        .replace(/\[\s*\]/g, '')
        .replace(/^(\(\d+\)|\d+[\.\-\)])\s*/i, '')
        .replace(/[\|\(\)\[\]\-]+$/, '')
        .trim();

      if (!songName) return null;
      return `${idx + 1}. ${songName}`;
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Converte a lista estruturada de louvores em texto formatado para salvar na escala
 */
export function formatLouvoresListToText(
  songs: Array<{ louvor?: string; titulo?: string; nome?: string; youtubeUrl?: string; linkYoutube?: string; link_youtube?: string; youtubeVideoId?: string }>,
  includeLinks: boolean = false
): string {
  if (!songs || songs.length === 0) {
    return '';
  }

  if (!includeLinks) {
    return formatLouvoresListToCleanText(songs);
  }

  return songs
    .map((s, idx) => {
      let songName = (s.louvor || s.titulo || s.nome || '').trim();
      if (!songName) return null;

      const rawUrl = s.youtubeUrl || s.linkYoutube || s.link_youtube || (s.youtubeVideoId ? `https://www.youtube.com/watch?v=${s.youtubeVideoId}` : '');
      const cleanUrl = getCleanYouTubeUrl(rawUrl) || (s.youtubeVideoId ? `https://www.youtube.com/watch?v=${s.youtubeVideoId}` : null);

      // Limpa nome se já continha url
      songName = songName
        .replace(/(https?:\/\/[^\s\)\],]+|(?:www\.|m\.|music\.)?youtube\.com\/[^\s\)\],]+|youtu\.be\/[^\s\)\],]+)/gi, '')
        .replace(/\(\s*\)/g, '')
        .replace(/\[\s*\]/g, '')
        .replace(/^(\(\d+\)|\d+[\.\-\)])\s*/i, '')
        .replace(/[\|\(\)\[\]\-]+$/, '')
        .trim();

      if (cleanUrl) {
        return `${idx + 1}. ${songName} (${cleanUrl})`;
      }
      return `${idx + 1}. ${songName}`;
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Localiza os louvores detalhados vinculados a uma escala,
 * correlacionando a aba LINK_LOUVORES com a coluna de texto da aba ESCALA
 */
export function getLouvoresForEscala(
  escalaData: string,
  linkLouvores: LouvorItem[] = [],
  fallbackLouvoresText?: string
): LouvorItem[] {
  const cleanTargetDate = cleanDateString(escalaData);

  // 1. Procura na lista detalhada da aba LINK_LOUVORES por data exata
  const matched = (linkLouvores || []).filter(item => {
    const rawData = item.data || item.dataEscala || '';
    const cleanItemDate = cleanDateString(rawData);
    return cleanItemDate === cleanTargetDate && cleanTargetDate !== '';
  });

  // Função auxiliar para normalizar título de louvor para comparação
  const normalizeTitle = (t: string) => {
    return (t || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  // Se houver texto na aba ESCALA (ex: "1. Toma o Teu lugar" ou "1. Eu te busco (https://...)")
  if (fallbackLouvoresText && fallbackLouvoresText.trim().length > 0) {
    const lines = fallbackLouvoresText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length > 0) {
      const itemsFromText: LouvorItem[] = lines.map((line, idx) => {
        const parsed = parseLouvorLine(line, idx, escalaData);
        let finalUrl = parsed.youtubeUrl || parsed.linkYoutube || parsed.link_youtube || '';
        let finalVideoId = parsed.youtubeVideoId || getYouTubeId(finalUrl) || '';

        const normParsedTitle = normalizeTitle(parsed.louvor);

        // Se a linha do texto não tinha link, busca na aba LINK_LOUVORES
        if (!finalUrl && normParsedTitle) {
          // 1º: Tenta achar na lista filtrada pela data
          const inMatched = matched.find(m => {
            const mNorm = normalizeTitle(m.louvor || m.titulo || '');
            return mNorm === normParsedTitle || (mNorm.length >= 4 && (mNorm.includes(normParsedTitle) || normParsedTitle.includes(mNorm)));
          });

          if (inMatched && (inMatched.youtubeUrl || inMatched.linkYoutube || inMatched.link_youtube || inMatched.youtubeVideoId)) {
            finalUrl = inMatched.youtubeUrl || inMatched.linkYoutube || inMatched.link_youtube || '';
            finalVideoId = inMatched.youtubeVideoId || (inMatched as any).videoId || getYouTubeId(finalUrl) || '';
          } else {
            // 2º: Tenta achar em qualquer item de LINK_LOUVORES que tenha a mesma música e tenha URL
            const inAllLinks = (linkLouvores || []).find(l => {
              const lNorm = normalizeTitle(l.louvor || l.titulo || '');
              const hasUrl = Boolean(l.youtubeUrl || l.linkYoutube || l.link_youtube || l.youtubeVideoId || (l as any).videoId);
              return hasUrl && (lNorm === normParsedTitle || (lNorm.length >= 4 && (lNorm.includes(normParsedTitle) || normParsedTitle.includes(lNorm))));
            });

            if (inAllLinks) {
              finalUrl = inAllLinks.youtubeUrl || inAllLinks.linkYoutube || inAllLinks.link_youtube || '';
              finalVideoId = inAllLinks.youtubeVideoId || (inAllLinks as any).videoId || getYouTubeId(finalUrl) || '';
            }
          }
        }

        if (!finalUrl && finalVideoId) {
          finalUrl = `https://www.youtube.com/watch?v=${finalVideoId}`;
        }
        if (!finalVideoId && finalUrl) {
          finalVideoId = getYouTubeId(finalUrl) || '';
        }

        return {
          ...parsed,
          titulo: parsed.louvor,
          youtubeVideoId: finalVideoId || undefined,
          youtubeUrl: finalUrl || undefined,
          linkYoutube: finalUrl || undefined,
          link_youtube: finalUrl || undefined,
          thumbnailUrl: finalVideoId ? `https://img.youtube.com/vi/${finalVideoId}/hqdefault.jpg` : undefined
        };
      });

      // Se temos itens gerados a partir do texto da escala, retornamos essa lista estruturada e enriquecida
      return itemsFromText;
    }
  }

  // Se não havia texto na aba ESCALA mas temos itens em LINK_LOUVORES para esta data
  if (matched.length > 0) {
    return matched
      .map((item, idx) => {
        const ytVideoId = item.youtubeVideoId || (item as any).videoId || (item as any).video_id || '';
        const rawUrl = item.link_youtube || item.linkYoutube || item.youtubeUrl || (item as any).url || (ytVideoId ? `https://www.youtube.com/watch?v=${ytVideoId}` : '');
        let cleanUrl = getCleanYouTubeUrl(rawUrl) || (ytVideoId ? `https://www.youtube.com/watch?v=${ytVideoId}` : '');
        let louvorName = (item.louvor || item.titulo || (item as any).nome || '').trim();

        if (!cleanUrl && louvorName) {
          const parsed = parseLouvorLine(louvorName, idx, escalaData);
          louvorName = parsed.louvor || louvorName;
          cleanUrl = parsed.linkYoutube || '';
        }

        const finalVideoId = ytVideoId || getYouTubeId(cleanUrl) || '';
        const finalUrl = cleanUrl || (finalVideoId ? `https://www.youtube.com/watch?v=${finalVideoId}` : '');

        return {
          id: item.id || `item-${cleanTargetDate}-${idx}`,
          data: escalaData,
          dataEscala: escalaData,
          ordem: item.ordem || idx + 1,
          louvor: louvorName,
          titulo: louvorName,
          youtubeVideoId: finalVideoId || undefined,
          youtubeUrl: finalUrl,
          linkYoutube: finalUrl,
          link_youtube: finalUrl,
          playlistId: item.playlistId || '',
          playlistTitle: item.playlistTitle || '',
          thumbnailUrl: item.thumbnailUrl || (finalVideoId ? `https://img.youtube.com/vi/${finalVideoId}/hqdefault.jpg` : undefined)
        };
      })
      .sort((a, b) => {
        const orderA = typeof a.ordem === 'number' ? a.ordem : parseInt(String(a.ordem || '0'), 10);
        const orderB = typeof b.ordem === 'number' ? b.ordem : parseInt(String(b.ordem || '0'), 10);
        return orderA - orderB;
      });
  }

  return [];
}
