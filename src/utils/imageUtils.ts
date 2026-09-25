/**
 * Utilitários para tratamento, exibição, download e compartilhamento de imagens de recados
 */

export function getImageDisplayUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Se já for data URL base64, pode ser renderizada diretamente
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Passa pelo proxy seguro do backend para garantir CORS, cache e bypass de bloqueios do Drive
  return `/api/recados/imagem?url=${encodeURIComponent(trimmed)}`;
}

export function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40)
    .toLowerCase();
}

/**
 * Salva a imagem no dispositivo (compatível com Android PWA, iOS e navegadores Desktop)
 * - Em dispositivos móveis com suporte a Web Share com arquivos: abre o seletor nativo (Salvar na Galeria/Compartilhar)
 * - Em Desktop ou como fallback: faz download real do arquivo blob usando o nome formatado
 */
export async function downloadOrSaveImage(
  rawImageUrl: string,
  title?: string,
  date?: string
): Promise<{ success: boolean; message?: string }> {
  if (!rawImageUrl) {
    return { success: false, message: 'URL da imagem não encontrada.' };
  }

  const cleanTitle = sanitizeFileName(title || 'comunicado');
  const cleanDate = (date || '').replace(/[^0-9]/g, '_').slice(0, 15);
  const baseName = `recado_${cleanTitle}${cleanDate ? `_${cleanDate}` : ''}`;

  try {
    // 1. Obtém o blob através do endpoint do backend
    const proxyUrl = getImageDisplayUrl(rawImageUrl);
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`Erro ao baixar arquivo (${response.statusText})`);
    }

    const blob = await response.blob();
    
    // Determina extensão apropriada
    let ext = 'jpg';
    const type = blob.type.toLowerCase();
    if (type.includes('png')) ext = 'png';
    else if (type.includes('webp')) ext = 'webp';
    else if (type.includes('gif')) ext = 'gif';
    else if (type.includes('jpeg') || type.includes('jpg')) ext = 'jpg';

    const fullFileName = `${baseName}.${ext}`;
    const file = new File([blob], fullFileName, { type: blob.type || 'image/jpeg' });

    // 2. Se for Mobile com suporte nativo ao Web Share de arquivos (Android / iOS)
    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: title || 'Recado - Escala Louvor',
          text: title ? `Imagem do recado: ${title}` : 'Imagem do recado da equipe de louvor'
        });
        return { success: true, message: 'Imagem compartilhada ou salva com sucesso!' };
      } catch (shareErr: any) {
        // Se o usuário cancelou o menu de compartilhamento, não é erro crítico
        if (shareErr.name === 'AbortError') {
          return { success: true };
        }
        // Se falhou o share nativo, segue para o fallback de download via Blob
        console.warn('Web Share falhou, usando fallback de download via Blob:', shareErr);
      }
    }

    // 3. Download padrão via Blob URL para navegadores Desktop e PWAs
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fullFileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Libera a memória do Blob após delay
    setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
    }, 2000);

    return { success: true, message: 'Imagem baixada com sucesso no dispositivo!' };
  } catch (err: any) {
    console.error('Erro ao salvar imagem:', err);

    // Fallback de emergência: aciona download direto via tag com rota de download do backend
    try {
      const fallbackUrl = `/api/recados/download?url=${encodeURIComponent(rawImageUrl)}&download=true&filename=${encodeURIComponent(`${baseName}.jpg`)}`;
      const link = document.createElement('a');
      link.href = fallbackUrl;
      link.download = `${baseName}.jpg`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true, message: 'Download iniciado.' };
    } catch (fallbackErr: any) {
      return {
        success: false,
        message: err.message || 'Não foi possível baixar a imagem para o seu dispositivo.'
      };
    }
  }
}
