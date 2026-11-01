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
    first: 'Fernanda',
    second: 'Giullia',
    /** Monograma usado no menu (versão clara) e no rodapé/ícone. */
    monogramLight: '/images/monograma-branco.png',
    monogramDark: '/images/monograma-marsala.png',
  },

  /** Data/hora da cerimônia em horário de Brasília. */
  date: {
    iso: '2027-05-16T16:30:00-03:00',
    label: '16 de maio · 2027',
    long: '16 de maio de 2027',
  },

  venue: {
    name: 'Porto São Jorge',
    city: 'São Bernardo do Campo, São Paulo',
    shortCity: 'São Bernardo do Campo · SP',
    mapsUrl:
      'https://www.google.com/maps/place/Porto+S%C3%A3o+Jorge/@-23.7827523,-46.5440955,17z/data=!3m1!4b1!4m6!3m5!1s0x94ce3fc812f6245f:0x667c238db2147681!8m2!3d-23.7827572!4d-46.5415206!16s%2Fg%2F11kq7szndx',
  },

  links: {
    playlist: 'https://open.spotify.com/',
    /** Link da lista de presentes (usado no carrossel e nos popups após o RSVP). */
    giftList: 'https://example.com/lista-de-presentes',
  },

  rsvp: {
    /** Prazo exibido no site e aplicado no servidor (após o prazo, respostas são bloqueadas). */
    deadlineIso: '2027-04-16T23:59:59-03:00',
    deadlineLabel: '16 de abril de 2027',
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
      desktop: '/images/home-casal.webp',
      mobile: '/images/home-casal.webp',
      alt: 'Fernanda e Giullia sorrindo juntas no sofá de um barco',
      positionDesktop: 'center 40%',
      positionMobile: '52% center',
    },
    venue: {
      desktop: '/images/local-porto-sao-jorge.webp',
      alt: 'Cerimônia ao ar livre no Porto São Jorge, com arco de flores secas diante da represa',
      positionDesktop: 'center 60%',
      positionMobile: 'center 60%',
    },
    dressCode: {
      desktop: '/images/dresscode-padrinhos-madrinhas.webp',
      alt: 'Ilustração das madrinhas em vestidos longos marsala e dos padrinhos em terno cinza claro com camisa branca e tênis branco',
    },
    party: {
      desktop: '/images/party-desktop.webp',
      mobile: '/images/party-mobile.webp',
      alt: '',
      positionDesktop: 'center',
      positionMobile: 'center',
    },
    rsvp: {
      desktop: '/images/rsvp-casal.webp',
      alt: 'Fernanda e Giullia se beijando no barco, segurando cartazes de Save the Date 16.05.27',
      positionDesktop: 'center 60%',
      positionMobile: 'center 62%',
    },
  } satisfies Record<string, ResponsiveImage>,

  nav: [
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
    eyebrow: 'Um amor que sempre soube o caminho',
    title: 'A vida nos separou em capítulos. *O amor nos reuniu na mesma história.*',
    paragraphs: [
      'A vida nos transformou, o tempo nos amadureceu e o amor nos trouxe de volta. Hoje, com a certeza de quem já se escolheu mais de uma vez, decidimos construir a nossa família e celebrar um amor que nunca deixou de existir.',
      'E não poderíamos viver esse momento sem as pessoas que, de alguma forma, também fazem parte da nossa história.',
    ],
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
      text: 'Traje esporte fino. Veja as orientações no dress code logo abaixo.',
    },
  },

  dressCode: {
    eyebrow: 'Dress code',
    title: 'Esporte *fino*',
    text: 'Queremos todo mundo elegante e confortável para celebrar com a gente. Separamos algumas orientações para ajudar na escolha do look.',
    rules: [
      {
        icon: 'dress',
        title: 'Traje esporte fino',
        text: 'Vestidos, saias e conjuntos elegantes; calça social ou de alfaiataria com camisa — blazer é bem-vindo.',
      },
      {
        icon: 'palette',
        title: 'Evite estas cores',
        text: 'Pedimos, com carinho, que os convidados não usem marsala nem cinza claro — elas são das nossas madrinhas e padrinhos.',
        swatches: ['#722F37', '#B9B9BB'],
      },
      {
        icon: 'ban',
        title: 'Não será permitida a entrada com',
        text: 'Jeans, shorts ou chinelo.',
      },
    ],
    figureTitle: 'Nossas madrinhas e *padrinhos*',
    figureText: 'Madrinhas de longo marsala; padrinhos de terno cinza claro, camisa branca e tênis branco.',
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

  /** Popup exibido depois que o servidor confirma que a resposta foi salva. */
  confirmationPopup: {
    titleAttending: 'Presença confirmada!',
    titleDeclined: 'Resposta enviada',
    text: 'Recebemos sua resposta com muito carinho. Pode ser que a nossa assessoria entre em contato para fazer uma dupla confirmação.',
    giftText: 'E, se quiser nos presentear, é só clicar no botão abaixo.',
    giftButton: 'Presentear',
    closeButton: 'Fechar',
  },

  faq: {
    eyebrow: 'Um detalhe ou outro',
    title: 'Ficou alguma *dúvida?*',
    text: 'Reunimos aqui as respostas para você aproveitar o dia sem preocupações.',
    items: [
      {
        q: 'Qual é o traje recomendado?',
        a: 'Esporte fino. Pedimos que evitem marsala e cinza claro (cores das madrinhas e padrinhos). Não será permitida a entrada com jeans, shorts ou chinelo.',
      },
      {
        q: 'Posso levar crianças?',
        a: 'Cada convite tem um número de vagas de acompanhante. Ao inserir o seu código, você verá quantas pessoas pode levar e informará o nome e o telefone de cada uma.',
      },
      {
        q: 'Há estacionamento no local?',
        a: 'Sim. O Porto São Jorge conta com estacionamento para os convidados.',
      },
      {
        q: 'Até quando posso confirmar presença?',
        a: 'Pedimos que a confirmação seja feita até 16 de abril de 2027.',
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
    title: 'Fernanda & Giullia — 16.05.2027',
    description: 'Celebre conosco o nosso casamento. Confirme sua presença e confira todos os detalhes.',
  },
} as const;

export type WeddingConfig = typeof wedding;
