/**
 * ============================================================================
 *  CONTEÚDO DO SITE — edite apenas este arquivo para personalizar o casamento.
 * ============================================================================
 *  • Textos, datas, local, links, cronograma, dress code, presentes e FAQ.
 *  • Imagens: coloque os arquivos em /public/images e altere os caminhos.
 *    Cada imagem aceita uma versão para desktop e outra para celular, além do
 *    enquadramento (object-position) específico de cada uma.
 *  • Cores: altere a paleta em `theme` (aplicada como variáveis CSS).
 *  • Trechos entre *asteriscos* nos títulos aparecem em itálico de destaque.
 */

export type ResponsiveImage = {
  desktop: string;
  mobile?: string;
  alt: string;
  positionDesktop?: string;
  positionMobile?: string;
};

export const wedding = {
  couple: {
    first: 'Marina',
    second: 'Gabriel',
    monogram: ['M', 'G'],
  },

  /** Data/hora da cerimônia em horário de Brasília. */
  date: {
    iso: '2026-11-14T16:30:00-03:00',
    label: '14 de novembro · 2026',
    long: '14 de novembro de 2026',
  },

  venue: {
    name: 'Espaço Jardim das Oliveiras',
    city: 'Campinas, São Paulo',
    mapsUrl: 'https://maps.google.com/?q=Espa%C3%A7o+Jardim+das+Oliveiras+Campinas',
  },

  links: {
    playlist: 'https://open.spotify.com/',
    /** Link da lista de presentes (usado no carrossel e nos popups após o RSVP). */
    giftList: 'https://example.com/lista-de-presentes',
  },

  rsvp: {
    /** Prazo exibido no site e aplicado no servidor (após o prazo, respostas são bloqueadas). */
    deadlineIso: '2026-11-07T23:59:59-03:00',
    deadlineLabel: '7 de novembro de 2026',
    /** Permite que o convidado altere uma resposta já enviada (até o prazo). */
    allowChanges: true,
  },

  theme: {
    white: '#FFFFFF',
    warmWhite: '#FAF8F5',
    sand: '#F4EFEA',
    marsala: '#722F37',
    marsalaDeep: '#4A1922',
    rose: '#8A4B5E',
    gold: '#C5A46D',
    goldSoft: '#D8BF91',
    black: '#080808',
    text: '#2A1A1E',
  },

  images: {
    hero: {
      desktop: '/images/casal-provisoria.webp',
      mobile: '/images/casal-provisoria.webp',
      alt: 'Os noivos sob o véu, em um jardim florido',
      positionDesktop: 'center 45%',
      positionMobile: 'center 60%',
    },
    venue: {
      desktop: '/images/celebration-desktop.webp',
      mobile: '/images/celebration-mobile.webp',
      alt: 'O espaço da cerimônia decorado com flores',
      positionDesktop: 'center',
      positionMobile: 'center',
    },
    dressCode: {
      desktop: '/images/padrinhos-desktop.webp',
      mobile: '/images/padrinhos-mobile.webp',
      alt: 'Padrinhos e madrinhas lado a lado',
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
    rsvp: {
      desktop: '/images/casal-provisoria.webp',
      alt: 'Os noivos abraçados sob o véu',
      positionDesktop: 'center 40%',
      positionMobile: 'center 35%',
    },
  } satisfies Record<string, ResponsiveImage>,

  nav: [
    { label: 'Nossa história', href: '#nossa-historia' },
    { label: 'O grande dia', href: '#celebracao' },
    { label: 'Playlist', href: '#trilha' },
    { label: 'Presentes', href: '#presentes' },
  ],

  hero: {
    eyebrow: 'Um convite para celebrar o amor',
    button: 'A nossa história, agora a sua',
    side: ['Um dia para guardar', 'para sempre'],
    scrollHint: 'Role para descobrir',
  },

  story: {
    eyebrow: 'Duas vidas, um mesmo caminho',
    title: 'O acaso nos apresentou. *O amor escolheu ficar.*',
    text: 'Entre conversas que atravessaram a noite, planos divididos e pequenos momentos que viraram tudo, construímos um lugar só nosso. Agora, queremos celebrar esse próximo capítulo com as pessoas que fazem parte da nossa história.',
    signoff: 'Com carinho,',
  },

  celebration: {
    eyebrow: 'Reserve este dia',
    title: 'Um dia. *Uma vida inteira.*',
    text: 'Nos encontramos entre jardins, promessas e abraços apertados.',
    venueEyebrow: 'Onde tudo acontece',
    directionsLabel: 'Como chegar',
    schedule: [
      { time: '16:00', title: 'Boas-vindas', text: 'Chegue com calma. O jardim já estará à nossa espera.' },
      { time: '16:30', title: 'A cerimônia', text: 'O sim que muda tudo, cercado por quem amamos.' },
      { time: '18:00', title: 'Brinde ao amor', text: 'Um brinde, uma boa conversa e o começo da festa.' },
      { time: '20:00', title: 'Pista aberta', text: 'Quando a música chamar, a gente se encontra por lá.' },
    ],
    attire: {
      title: 'Um toque de elegância',
      text: 'Traje social. Venha confortável para celebrar — e dançar.',
    },
  },

  dressCode: {
    eyebrow: 'Dress code',
    title: 'Nossos padrinhos e *madrinhas*',
    text: 'Uma prévia de como eles estarão. Para os convidados, traje social — elegante e confortável.',
  },

  party: {
    eyebrow: 'E depois do sim...',
    title: 'A noite é *toda nossa.*',
    text: 'Uma mesa cheia, taças erguidas e aquela música que ninguém consegue ouvir sentado.',
    button: 'Conheça a trilha da festa',
  },

  playlist: {
    eyebrow: 'Nossa trilha',
    title: 'Canções que *contam um pouco da gente.*',
    text: 'Algumas músicas já têm lugar cativo na nossa história. Dê o play, entre no clima e prepare o coração — e os passos.',
    button: 'Abrir seleção no Spotify',
    note: 'A última música? Essa a gente escolhe juntos na pista.',
    /** `url` opcional: link da música (se vazio, usa o link da playlist). */
    tracks: [
      { title: 'Best Part', artist: 'Daniel Caesar feat. H.E.R.', url: '' },
      { title: 'Turning Page', artist: 'Sleeping At Last', url: '' },
      { title: 'You Are the Best Thing', artist: 'Ray LaMontagne', url: '' },
      { title: 'Velha Infância', artist: 'Tribalistas', url: '' },
    ],
  },

  gifts: {
    eyebrow: 'Lista de presentes',
    title: 'Quer nos *presentear?*',
    text: 'Sua presença já é o nosso maior presente. Mas, se quiser fazer parte desse novo capítulo, separamos algumas ideias com muito carinho.',
    button: 'Ver lista completa',
    buyLabel: 'Presentear',
    /** Itens do carrossel. `image` pode ficar vazio para usar o espaço reservado. */
    items: [
      { name: 'Jogo de taças de cristal', price: 'R$ 320', image: '/images/presente-tacas.webp' },
      { name: 'Jantar romântico na lua de mel', price: 'R$ 450', image: '/images/presente-jantar.webp' },
      { name: 'Aparelho de jantar', price: 'R$ 780', image: '/images/presente-aparelho.webp' },
      { name: 'Passeio de barco', price: 'R$ 600', image: '/images/presente-barco.webp' },
      { name: 'Cafeteira espresso', price: 'R$ 1.200', image: '/images/presente-cafeteira.webp' },
      { name: 'Jogo de cama', price: 'R$ 520', image: '/images/presente-cama.webp' },
    ],
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
    eyebrow: 'Queremos contar com você',
    title: 'Você vem *celebrar com a gente?*',
    quote: ['O melhor presente', 'é ter você por perto.'],
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
    eyebrow: 'Um detalhe ou outro',
    title: 'Ficou alguma *dúvida?*',
    text: 'Reunimos aqui as respostas para você aproveitar o dia sem preocupações.',
    items: [
      {
        q: 'Qual é o traje recomendado?',
        a: 'Traje social. Escolha algo elegante e confortável — a festa acontece em um jardim e a pista vai ficar animada.',
      },
      {
        q: 'Posso levar crianças?',
        a: 'As pessoas convidadas estão vinculadas ao código de cada convite. Ao inserir o seu código, você verá exatamente quem está incluído.',
      },
      {
        q: 'Há estacionamento no local?',
        a: 'Sim. O espaço conta com estacionamento para os convidados.',
      },
      {
        q: 'Até quando posso confirmar presença?',
        a: 'Pedimos que a confirmação seja feita até 7 de novembro de 2026.',
      },
      {
        q: 'Posso atualizar minha resposta depois?',
        a: 'Pode, sim. Basta inserir o mesmo código novamente e enviar a nova resposta até o prazo de confirmação.',
      },
    ],
  },

  footer: {
    text: 'Feito com amor para compartilhar esse momento com você.',
  },

  seo: {
    title: 'Marina & Gabriel — 14.11.2026',
    description: 'Celebre conosco o nosso casamento. Confirme sua presença e confira todos os detalhes.',
  },
} as const;

export type WeddingConfig = typeof wedding;
