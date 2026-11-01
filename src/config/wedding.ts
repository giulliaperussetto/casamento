/**
 * ============================================================================
 *  CONTEÚDO DO SITE — edite apenas este arquivo para personalizar o casamento.
 * ============================================================================
 *  • Textos, datas, local, links, cronograma, dress code e FAQ.
 *  • Imagens: coloque os arquivos em /public/images e altere os caminhos.
 *    Cada imagem aceita uma versão para desktop e outra para celular, além do
 *    enquadramento (object-position) específico de cada uma.
 *  • Cores: altere a paleta em `theme` (aplicada como variáveis CSS).
 */

export type ResponsiveImage = {
  /** Imagem para telas grandes (paisagem). */
  desktop: string;
  /** Imagem para celular (retrato). Se omitida, usa a de desktop. */
  mobile?: string;
  alt: string;
  /** Enquadramento no desktop, ex.: "center", "50% 30%". */
  positionDesktop?: string;
  /** Enquadramento no celular. */
  positionMobile?: string;
};

export const wedding = {
  couple: {
    first: 'Helena',
    second: 'Gabriel',
  },

  /** Data/hora da cerimônia em horário de Brasília. */
  date: {
    iso: '2027-05-22T16:00:00-03:00',
    day: '22',
    month: 'Maio',
    year: '2027',
    long: '22 de maio de 2027',
    time: '16h',
  },

  venue: {
    name: 'Villa Serena Eventos',
    address: 'Estrada das Hortênsias, 1200 — Gramado, RS',
    mapsUrl: 'https://maps.google.com/?q=Estrada+das+Hortensias+1200+Gramado+RS',
  },

  links: {
    playlist: 'https://open.spotify.com/',
    giftList: 'https://example.com/lista-de-presentes',
  },

  rsvp: {
    /** Prazo exibido no FAQ e aplicado no servidor (após o prazo, respostas são bloqueadas). */
    deadlineIso: '2027-04-22T23:59:59-03:00',
    deadlineLabel: '22 de abril de 2027',
    /** Permite que o convidado altere uma resposta já enviada (até o prazo). */
    allowChanges: true,
  },

  theme: {
    white: '#FFFFFF',
    warmWhite: '#FAF8F5',
    marsala: '#722F37',
    marsalaDeep: '#4A1922',
    gold: '#C5A46D',
    goldSoft: '#D8BF91',
    black: '#080808',
    text: '#292323',
  },

  images: {
    hero: {
      desktop: '/images/hero-desktop.webp',
      mobile: '/images/hero-mobile.webp',
      alt: 'Os noivos abraçados ao entardecer',
      positionDesktop: 'center 40%',
      positionMobile: 'center 35%',
    },
    rings: {
      desktop: '/images/rings-desktop.webp',
      mobile: '/images/rings-mobile.webp',
      alt: 'As mãos dos noivos mostrando as alianças',
      positionDesktop: 'center',
      positionMobile: 'center',
    },
    story: {
      desktop: '/images/story.webp',
      alt: 'Os noivos sorrindo juntos',
      positionDesktop: 'center',
      positionMobile: 'center 30%',
    },
    celebration: {
      desktop: '/images/celebration-desktop.webp',
      mobile: '/images/celebration-mobile.webp',
      alt: 'O espaço da cerimônia decorado com flores',
      positionDesktop: 'center',
      positionMobile: 'center',
    },
    timeline: {
      desktop: '/images/fabric-desktop.webp',
      mobile: '/images/fabric-mobile.webp',
      alt: '',
      positionDesktop: 'center',
      positionMobile: 'center',
    },
    party: {
      desktop: '/images/party-desktop.webp',
      mobile: '/images/party-mobile.webp',
      alt: '',
      positionDesktop: 'center',
      positionMobile: 'center',
    },
  } satisfies Record<string, ResponsiveImage>,

  hero: {
    tagline: 'O início de um novo capítulo da nossa história.',
    scrollHint: 'Deslize para descobrir nossa história',
  },

  message: {
    title: 'O amor nos trouxe até aqui.',
    paragraphs: [
      'Entre encontros, caminhos inesperados e momentos que se tornaram inesquecíveis, descobrimos que as histórias mais bonitas são aquelas que escolhemos viver juntos.',
      'Agora, com o coração cheio de alegria, queremos dividir com você um dos capítulos mais especiais da nossa vida.',
    ],
  },

  story: {
    eyebrow: 'Capítulo um',
    title: 'Nossa história',
    paragraphs: [
      'Tudo começou de um jeito simples, daqueles que a vida prepara sem avisar.',
      'Entre conversas, sorrisos e sonhos compartilhados, fomos construindo uma história que hoje ganha um novo significado.',
      'Mais do que celebrar o nosso amor, queremos celebrar todas as pessoas que fizeram parte dessa caminhada.',
    ],
  },

  celebration: {
    title: 'A celebração',
    paragraphs: [
      'Preparamos cada detalhe deste dia com muito carinho para que possamos viver momentos inesquecíveis ao lado das pessoas que amamos.',
      'Será uma celebração do amor, da alegria e de todos os caminhos que nos trouxeram até aqui.',
    ],
    directionsLabel: 'Como chegar',
  },

  dressCode: {
    title: 'Dress code',
    subtitle: 'Traje: passeio completo',
    text: 'Queremos que você se sinta elegante e confortável para celebrar conosco. Preparamos algumas referências para ajudar na escolha do traje.',
    groups: [
      {
        title: 'Madrinhas',
        description: 'Vestidos longos, tecidos fluidos, em tons de marsala e vinho.',
        /** Caminhos das ilustrações (deixe vazio para exibir o espaço reservado). */
        images: [
          { src: '', alt: 'Ilustração de vestido de madrinha — modelo 1' },
          { src: '', alt: 'Ilustração de vestido de madrinha — modelo 2' },
          { src: '', alt: 'Ilustração de vestido de madrinha — modelo 3' },
        ],
      },
      {
        title: 'Padrinhos',
        description: 'Terno escuro bem cortado, gravata em marsala ou dourado envelhecido.',
        images: [
          { src: '', alt: 'Ilustração de traje de padrinho — modelo 1' },
          { src: '', alt: 'Ilustração de traje de padrinho — modelo 2' },
        ],
      },
    ],
    paletteTitle: 'Paleta da celebração',
    palette: [
      { name: 'Marsala', hex: '#722F37' },
      { name: 'Vinho', hex: '#4A1922' },
      { name: 'Rosé seco', hex: '#B7787B' },
      { name: 'Dourado', hex: '#C5A46D' },
      { name: 'Champagne', hex: '#E8D9BE' },
    ],
    note: 'Pedimos, com carinho, que o branco e os tons muito claros fiquem reservados à noiva.',
  },

  timeline: {
    eyebrow: 'Programação',
    title: 'Nosso grande dia',
    events: [
      { time: '16:00', title: 'A cerimônia', text: 'O momento em que dois caminhos se tornam um só.' },
      { time: '17:00', title: 'Recepção dos convidados', text: 'Um brinde aos encontros que fazem a vida mais bonita.' },
      { time: '18:00', title: 'Jantar', text: 'Sabores especiais para compartilhar momentos inesquecíveis.' },
      { time: '20:00', title: 'Nossa primeira dança', text: 'Uma música, uma história e um instante para guardar para sempre.' },
      { time: '21:00', title: 'A festa começa', text: 'Agora é hora de celebrar, dançar e criar novas memórias.' },
    ],
  },

  party: {
    title: 'A noite está só começando.',
    text: 'Depois de tantas emoções, chega a hora de deixar a alegria tomar conta. Queremos ver você sorrindo, dançando e celebrando cada instante dessa noite com a gente.',
  },

  playlist: {
    title: 'Já pode entrar no clima!',
    text: 'Selecionamos algumas músicas para você começar a sentir a energia da nossa festa. Prepare o coração, escolha seus passos favoritos e venha celebrar conosco.',
    buttonLabel: 'Ouvir nossa playlist',
  },

  mission: {
    question: 'Você já sabe qual é a sua missão?',
    title: 'Sua missão é simples: viver esse momento com a gente.',
    paragraphs: [
      'Queremos dividir esse dia com pessoas que fazem parte da nossa história. Sua presença tornará essa celebração ainda mais especial.',
      'Por isso, pedimos que confirme sua participação e nos ajude a preparar tudo com muito carinho.',
    ],
  },

  rsvpCopy: {
    title: 'Confirme sua presença',
    text: 'Estamos ansiosos para compartilhar esse dia com você. Digite o código recebido no seu convite para continuar.',
    codeLabel: 'Código do convite',
    codePlaceholder: 'CASA-XXXXX-XXXXX',
    verifyButton: 'Verificar meu convite',
    attendLabel: 'Vou comparecer',
    declineLabel: 'Não poderei comparecer',
    submitButton: 'Enviar confirmação',
    successTitle: 'Recebemos sua resposta com carinho!',
  },

  giftPrompt: {
    first: {
      title: 'Quer nos presentear?',
      text: 'Sua presença já é um presente muito especial para nós. Mas, se desejar contribuir de alguma forma com esse novo capítulo, preparamos uma lista de presentes com muito carinho.',
      yes: 'Sim, quero presentear',
      no: 'Agora não',
    },
    second: {
      title: 'Tem certeza?',
      text: 'Não existe obrigação nenhuma! Mas, caso queira conhecer nossa lista, ela está disponível para você.',
      yes: 'Quero conhecer a lista',
      no: 'Não quero presentear',
    },
  },

  faq: {
    title: 'Ainda tem alguma dúvida?',
    text: 'Reunimos algumas informações para ajudar você a aproveitar esse dia da melhor maneira possível.',
    items: [
      {
        q: 'Qual será o horário da cerimônia?',
        a: 'A cerimônia terá início às 16h. Recomendamos chegar com antecedência para aproveitar cada momento.',
      },
      {
        q: 'Existe estacionamento no local?',
        a: 'O espaço contará com informações de estacionamento que serão disponibilizadas em breve.',
      },
      {
        q: 'Posso levar acompanhante?',
        a: 'A quantidade de pessoas autorizadas está vinculada ao código de cada convite. Ao inserir seu código, você poderá visualizar exatamente quem está incluído.',
      },
      {
        q: 'Qual é o traje recomendado?',
        a: 'Preparamos uma seção especial com orientações de dress code e referências para ajudar na escolha do visual.',
      },
      {
        q: 'Até quando posso confirmar minha presença?',
        a: 'Pedimos que a confirmação seja realizada até 22 de abril de 2027.',
      },
      {
        q: 'Onde encontro a lista de presentes?',
        a: 'A lista de presentes estará disponível por meio do link que será divulgado neste site.',
      },
    ],
  },

  footer: {
    text: 'Feito com amor para compartilhar esse momento com você.',
  },

  seo: {
    title: 'Helena & Gabriel — 22.05.2027',
    description: 'Celebre conosco o nosso casamento. Confirme sua presença e confira todos os detalhes.',
  },
} as const;

export type WeddingConfig = typeof wedding;
