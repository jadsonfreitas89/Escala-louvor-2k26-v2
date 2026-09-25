import { EscalaData } from '../types';

/**
 * Dados de amostra para desenvolvimento local / fallback
 * Segue estritamente os campos reais da planilha Google Sheets
 */
export const initialMockData: EscalaData = {
  escala: [
    {
      data: '21/08/2026',
      dirigente: 'Jadson Freitas',
      vocal: 'Camila, Beatriz, Matheus',
      musicos: 'Lucas - Teclado, Daniel - Bateria, Samuel - Baixo, Felipe - Violão',
      mesario: 'Rodrigo',
      louvores: 'Ruja o Leão, Bondade de Deus, A Ele a Glória',
      uniforme: 'Camisa Preta do Ministério'
    },
    {
      data: '23/08/2026',
      dirigente: 'Pr. Marcos',
      vocal: 'Juliana, Larissa, Gabriel',
      musicos: 'Lucas - Teclado, Daniel - Bateria, Thiago - Guitarra',
      mesario: 'Vinicius',
      louvores: 'Vitorioso és, Ousado Amor, Porque Ele Vive',
      uniforme: 'Blazer / Social'
    },
    {
      data: '28/08/2026',
      dirigente: 'Camila Santos',
      vocal: 'Jadson Freitas, Matheus, Ana',
      musicos: 'Lucas - Teclado, Samuel - Baixo, Felipe - Violão',
      mesario: 'Rodrigo',
      louvores: 'Tu és Bom, Leão e o Cordeiro, Grandioso és Tu',
      uniforme: 'Camiseta Branca Oficial'
    },
    {
      data: '14/08/2026',
      dirigente: 'Jadson Freitas',
      vocal: 'Beatriz, Larissa',
      musicos: 'Lucas - Teclado, Daniel - Bateria',
      mesario: 'Rodrigo',
      louvores: 'Vem Me Buscar, Santo para Sempre',
      uniforme: 'Preto Básico'
    }
  ],
  integrantes: [
    { nome: 'Jadson Freitas', funcao: 'LÍDER', instrumento: 'Vocal / Violão' },
    { nome: 'Camila Santos', funcao: 'DIRIGENTE', instrumento: 'Vocal' },
    { nome: 'Beatriz Lima', funcao: 'INTEGRANTE', instrumento: 'Vocal' },
    { nome: 'Matheus Costa', funcao: 'INTEGRANTE', instrumento: 'Vocal' },
    { nome: 'Juliana Rocha', funcao: 'INTEGRANTE', instrumento: 'Vocal' },
    { nome: 'Lucas Silva', funcao: 'INTEGRANTE', instrumento: 'Teclado' },
    { nome: 'Daniel Oliveira', funcao: 'INTEGRANTE', instrumento: 'Bateria' },
    { nome: 'Samuel Pereira', funcao: 'INTEGRANTE', instrumento: 'Contrabaixo' },
    { nome: 'Felipe Mendes', funcao: 'INTEGRANTE', instrumento: 'Violão' },
    { nome: 'Thiago Martins', funcao: 'INTEGRANTE', instrumento: 'Guitarra' },
    { nome: 'Rodrigo Alves', funcao: 'INTEGRANTE', instrumento: 'Mesa de Som' },
    { nome: 'Vinicius Souza', funcao: 'INTEGRANTE', instrumento: 'Projeção / Mídia' }
  ],
  solicitacoes: [
    {
      id: 'solic_001',
      dataEscala: '21/08/2026',
      quemPediu: 'Matheus Costa',
      funcao: 'Vocal',
      instrumento: 'Vocal',
      substituto: 'Gabriel',
      motivo: 'Compromisso acadêmico inadiável na sexta-feira à noite.',
      status: 'PENDENTE',
      dataCriacao: '17/08/2026'
    }
  ],
  recados: [
    {
      id: 'recado_001',
      titulo: 'Ensaio Geral com Todos os Músicos',
      mensagem: 'Lembramos a todos os instrumentistas e vocais que no próximo sábado às 16h teremos ensaio geral para os novos arranjos da conferência.',
      ativo: 'SIM',
      dataCriacao: '15/08/2026'
    },
    {
      id: 'recado_002',
      titulo: 'Pontualidade na Passagem de Som',
      mensagem: 'A equipe escalada deve estar no templo pontualmente 45 minutos antes do início do culto para afinação e passagem de som.',
      ativo: 'SIM',
      dataCriacao: '10/08/2026'
    }
  ],
  linkLouvores: [
    {
      id: 'praise_1',
      dataEscala: '21/08/2026',
      ordem: 1,
      louvor: 'Ruja o Leão',
      linkYoutube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: 'praise_2',
      dataEscala: '21/08/2026',
      ordem: 2,
      louvor: 'Bondade de Deus',
      linkYoutube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: 'praise_3',
      dataEscala: '21/08/2026',
      ordem: 3,
      louvor: 'A Ele a Glória',
      linkYoutube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    }
  ]
};
