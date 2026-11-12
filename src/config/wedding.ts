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
    iso: '2027-05-16T16:00:00-03:00',
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
    playlist: 'https://open.spotify.com/playlist/72XBTj5OtaZUNvdR4jIZOD',
    /** Link da lista de presentes (usado no carrossel e nos popups após o RSVP). */
    giftList: '/presentes',
  },

  rsvp: {
    /** Prazo exibido no site e aplicado no servidor (após o prazo, respostas são bloqueadas). */
    deadlineIso: '2027-03-16T23:59:59-03:00',
    deadlineLabel: '16 de março de 2027',
    /** Permite que o convidado altere uma resposta já enviada (até o prazo). */
    allowChanges: true,
    /**
     * Mensagem sugerida no botão "Enviar no WhatsApp" do painel.
     * {nome} = primeiro nome do convidado · {link} = link personalizado do convite
     */
    whatsappMessage: [
      'Oi, {nome}!',
      '',
      'Nosso grande dia está chegando! No dia 16 de maio de 2027, vamos celebrar nosso amor e queremos muito você com a gente!',
      '',
      'Seu convite está aqui! Acesse e confirme sua presença:',
      '{link}',
      '',
      'Com carinho,',
      'Fernanda & Giullia',
    ].join('\n'),
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
      desktop: '/images/rsvp-brinde.webp',
      alt: 'Duas mãos brindando com taças de vinho ao pôr do sol, com montanhas ao fundo',
      positionDesktop: 'center 55%',
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
    title: 'Um dia para celebrar. *Uma vida inteira para amar.*',
    text: 'O amor nos trouxe até aqui. E é aqui que celebraremos o nosso para sempre.',
    venueEyebrow: 'Onde tudo acontece',
    directionsLabel: 'Como chegar',
    schedule: [
      {
        time: '15h30',
        title: 'Boas-vindas',
        lead: 'O nosso dia começa com vocês.',
        text: 'Cheguem com calma, sejam recebidos com carinho e encontrem seus lugares. Às 16h em ponto, começa o nosso tão esperado sim!',
      },
      {
        time: '16h00',
        title: 'A cerimônia',
        lead: 'O momento que tanto sonhamos.',
        text: 'Depois de tantos caminhos, chegou a hora de dizer sim ao nosso para sempre, cercadas pelas pessoas que fazem parte da nossa história.',
      },
      {
        time: '17h00',
        title: 'Os primeiros brindes',
        lead: 'A celebração já começou!',
        text: 'Enquanto registramos os primeiros momentos dessa nova fase, aproveitem! Comidas, jantar e bebidas estarão liberados para vocês brindarem e celebrarem conosco.',
      },
      {
        time: '17h30',
        title: 'Pista aberta!',
        lead: 'Agora ninguém fica parado!',
        text: 'É hora de abrir a pista, dançar, cantar e criar memórias inesquecíveis. Preparamos cada detalhe para viver essa festa com vocês!',
      },
    ],
    /** Aviso exibido abaixo da programação. */
    notice: {
      title: 'Celebre sem preocupações!',
      text: 'Queremos que vocês aproveitem cada brinde, cada música e cada momento dessa noite especial! Teremos bebidas durante toda a festa e, para a segurança de todos, pedimos que quem vier de carro tome cuidado com a quantidade de bebida. Se puder, venha de Uber ou outro transporte por aplicativo.',
      highlight: 'O local terá estacionamento, porém ele é pago: R$ 35,00.',
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
    ],
    /** Bloco de restrições, exibido abaixo dos dois anteriores. */
    banned: {
      title: 'Não será permitida a entrada com',
      items: [
        { text: 'Jeans, shorts ou chinelo.' },
        {
          text: 'Roupas brancas, bege, off-white ou de qualquer tom claro — essas cores são reservadas às noivas.',
          swatches: ['#FFFFFF', '#E6D7BF', '#F4EFE4'],
        },
      ],
    },
    figureTitle: 'Nossas madrinhas e padrinhos',
    figureText: 'Madrinhas de longo marsala; padrinhos de terno cinza claro, camisa branca e tênis branco.',
  },

  party: {
    eyebrow: 'E depois do sim...',
    title: 'A noite é *toda nossa.*',
    text: 'Uma mesa cheia, taças erguidas e aquela música que ninguém consegue ouvir sentado.',
    button: 'Conheça a trilha da festa',
  },

  playlist: {
    eyebrow: 'Prepare-se para dançar',
    title: 'Tem música pra todo mundo. *Só não vale ficar parado!*',
    text: 'Preparamos uma noite para todos os gostos, todas as gerações e todos os estilos. Porque o melhor da festa é ver quem a gente ama celebrando junto!',
    button: 'Tem uma música que não pode faltar? Adicione aqui',
    note: 'A última música? Essa a gente escolhe juntas na pista.',
    /** Deixe `title` vazio para exibir "Em seleção". `url` opcional: link da música. */
    tracks: [
      { title: 'Jet Ski', artist: 'Pedro Sampaio', url: '' },
      { title: 'Seu Astral', artist: 'Jorge & Mateus', url: '' },
      { title: 'Danada Vem Que Vem', artist: 'MC Coringa', url: '' },
      { title: 'Pirata e Tesouro', artist: 'Ferrugem', url: '' },
    ],
  },

  gifts: {
    eyebrow: 'Lista de presentes',
    title: 'O amor a gente já tem. *Agora falta o resto!*',
    text: 'Sua presença já é o nosso maior presente! Mas preparamos uma lista com muito carinho para quem quiser fazer parte dessa nova fase. Cada contribuição será um pedacinho do nosso futuro juntas.',
    button: 'Ver lista completa',
    buyLabel: 'Presentear',
    /** Pix direto, para quem preferir não escolher um item da lista. */
    pix: {
      title: 'Prefere mandar um Pix?',
      text: 'Se preferir, você também pode nos presentear com um Pix de qualquer valor. É só escanear o QR Code ou copiar o código abaixo e colar no app do seu banco, em "Pix Copia e Cola".',
      key: 'giulliabp@gmail.com',
      holder: 'Giullia Bertti Perussetto',
      code: '00020126410014BR.GOV.BCB.PIX0119giulliabp@gmail.com5204000053039865802BR5925Giullia Bertti Perussetto6009SAO PAULO62140510jkJBzbdNMv63045A8A',
    },
    /**
     * Destaques do carrossel (3 aparecem por vez, em ordem crescente de preço):
     * um presente por faixa de R$ 100 e dois acima de R$ 1.000.
     * Fotos em /public/images/presentes. O botão "Presentear" abre a lista completa.
     * Se a lista ficar vazia, o carrossel não aparece — só o texto e o botão.
     */
    items: [
      { name: 'Kit 6 taças de vidro para vinho e água', price: 'R$ 47,00', image: '/images/presentes/tacas.webp', url: '/presentes?add=tacas' },
      { name: 'Conjunto de facas inox com suporte (8 peças)', price: 'R$ 188,90', image: '/images/presentes/facas.webp', url: '/presentes?add=facas' },
      { name: 'Processador de alimentos 3 em 1 Electrolux', price: 'R$ 299,97', image: '/images/presentes/processador.webp', url: '/presentes?add=processador' },
      { name: 'Kit furadeira e parafusadeira Bosch', price: 'R$ 332,41', image: '/images/presentes/furadeira.webp', url: '/presentes?add=furadeira' },
      { name: 'Batedeira planetária Electrolux 750W', price: 'R$ 445,72', image: '/images/presentes/batedeira.webp', url: '/presentes?add=batedeira' },
      { name: 'Air fryer Electrolux Rita Lobo 12L', price: 'R$ 599,89', image: '/images/presentes/air-fryer.webp', url: '/presentes?add=airfryer' },
      { name: 'Máquina de pão automática inox', price: 'R$ 739,90', image: '/images/presentes/panificadora.webp', url: '/presentes?add=pao' },
      { name: 'Smart TV 43" LG 4K', price: 'R$ 2.299,00', image: '/images/presentes/smart-tv.webp', url: '/presentes?add=tv' },
      { name: 'Geladeira Electrolux Frost Free 320L', price: 'R$ 2.599,00', image: '/images/presentes/geladeira.webp', url: '/presentes?add=geladeira' },
    ] as { name: string; price: string; image: string; url?: string }[],
  },

  mission: {
    question: 'Você já sabe qual é a sua missão?',
    title: 'Sua missão é simples: *aproveitar cada segundo com a gente!*',
    paragraphs: [
      'Dançar até cansar, comer bem, brindar muito, dar boas risadas e tirar fotos para guardar cada momento dessa noite!',
      'Preparamos tudo com muito carinho para que vocês aproveitem cada pedacinho dessa celebração. Queremos ver sorrisos, abraços apertados, passos de dança e muitas memórias sendo criadas!',
    ],
    request: {
      title: 'Mas temos um pedido especial...',
      paragraphs: [
        'Durante a cerimônia, pedimos carinhosamente que guardem os celulares e deixem as fotos por conta dos nossos fotógrafos. Queremos que todos estejam presentes de corpo e coração, vivendo esse momento com a gente, sem telas ou distrações.',
        'Depois do nosso sim, as câmeras estão liberadas! Registrem tudo, porque queremos ter muitas histórias para lembrar e fotos para compartilhar!',
      ],
    },
    closing: 'A única coisa que não vale é deixar de aproveitar!',
  },

  rsvpCopy: {
    eyebrow: 'Queremos contar com você',
    title: 'Guardamos um lugar *especial para você.*',
    intro: 'Estamos preparando cada detalhe para viver um dia inesquecível ao lado das pessoas que fazem parte da nossa história. E você é uma delas!',
    closing: 'A gente cuida da festa. Você só precisa confirmar e preparar os passos de dança!',
    quote: ['O próximo brinde', 'é com você!'],
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
    /**
     * Respostas: texto simples ou lista de parágrafos.
     * Use **asteriscos duplos** para destacar em negrito.
     */
    items: [
      {
        q: 'Qual é o traje recomendado?',
        a: 'Esporte fino. Pedimos que evitem marsala e cinza claro (cores das madrinhas e padrinhos). Não será permitida a entrada com jeans, shorts, chinelo ou roupas brancas, bege, off-white ou de qualquer tom claro.',
      },
      {
        q: 'Posso levar acompanhantes?',
        a: [
          'Cada convite já vem com o nome de todas as pessoas convidadas. Ao inserir o seu código, você verá quem está incluído e só precisa informar se cada uma vai ou não.',
          '**Atenção:** crianças de qualquer idade, inclusive bebês, também são consideradas acompanhantes e precisam estar incluídas no convite.',
        ],
      },
      {
        q: 'Esquecemos alguém?',
        a: [
          'Pode acontecer! Na correria dos preparativos, alguém muito especial pode ter ficado de fora sem querer.',
          'Se você acha que esquecemos alguém, **mande uma mensagem pra gente**. Vamos olhar com todo o carinho para incluir essa pessoa na lista de convidados ou avaliar se será possível recebê-la.',
        ],
      },
      {
        q: 'Há estacionamento no local?',
        a: 'Sim. O Porto São Jorge tem estacionamento no local, porém ele é pago: o valor é de R$ 35,00. Como teremos bebidas a noite toda, pedimos que quem for de carro tome cuidado com a quantidade de bebida — se puder, vá de Uber ou outro aplicativo.',
      },
      {
        q: 'Até quando posso confirmar presença?',
        a: 'Pedimos que a confirmação seja feita até 16 de março de 2027, utilizando o código que você recebeu no convite.',
      },
      {
        q: 'Posso atualizar minha resposta depois?',
        a: 'Pode, sim. Basta inserir o mesmo código novamente e enviar a nova resposta até o prazo de confirmação.',
      },
      {
        q: 'Os presentes da lista são reais ou apenas ilustrativos?',
        a: [
          '**São reais!** Cada item da lista foi escolhido com muito carinho, pensando na nossa casa e nessa nova fase das nossas vidas.',
          'Pela plataforma, o valor do presente escolhido é revertido para nós, e **vamos comprar exatamente o que está no site**. Ou seja: o seu presente vai mesmo fazer parte da nossa casa!',
          'A lista completa está aqui: [Ver lista de presentes](/presentes).',
        ],
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
