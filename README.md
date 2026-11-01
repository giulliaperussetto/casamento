# Casamento — landing page premium + RSVP

Página única, estática na apresentação (sem animações de scroll, parallax ou transições), mobile-first, com confirmação de presença real em PostgreSQL/Supabase e painel administrativo protegido.

**Stack:** Next.js 15 (App Router) · React 19 · PostgreSQL (Supabase) · TypeScript. Sem GSAP, Three.js ou bibliotecas de animação.

## Começando

```bash
npm install
cp .env.example .env        # preencha as variáveis (veja abaixo)
npm run db:migrate          # cria o schema "wedding" no banco (ou cole os arquivos de supabase/migrations no SQL Editor, em ordem)
npm run admin:create -- voces@email.com
npm run dev                 # http://localhost:3000  ·  painel em /admin
```

### Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Conexão PostgreSQL. No Supabase: *Project Settings → Database → Connection string*. |
| `INVITE_CODE_PEPPER` | Segredo do hash HMAC dos códigos. `openssl rand -base64 48`. **Não altere depois de criar convites.** |
| `INVITE_CODE_ENCRYPTION_KEY` | 32 bytes em base64 para cifrar os códigos exibidos no painel. `openssl rand -base64 32`. |
| `RATE_LIMIT_SECRET` | Hash dos IPs usados nos limites de tentativas. |
| `INSECURE_COOKIES` | `true` apenas em desenvolvimento local sem HTTPS. |
| `NEXT_PUBLIC_SITE_URL` | URL pública (imagens de compartilhamento). |

Nenhum segredo vai para o navegador: todo acesso ao banco acontece no servidor.

## Editando o conteúdo

Tudo fica em **`src/config/wedding.ts`**: nomes, data, horário, local, link do mapa, playlist, lista de presentes, prazo do RSVP, textos de todas as seções, cronograma, dress code (grupos, ilustrações, paleta), FAQ, cores e imagens.

**Imagens:** as atuais em `public/images` são **provisórias** (geradas por `npm run images:placeholders`). Substitua pelos arquivos reais com os mesmos nomes ou altere os caminhos no config. Cada imagem aceita versão `desktop` e `mobile` e enquadramento próprio (`positionDesktop` / `positionMobile`, ex.: `"center 30%"`). O Next.js converte para AVIF/WebP e gera tamanhos responsivos; só a hero carrega com prioridade, as demais usam lazy loading.

**Ilustrações do dress code:** preencha `src` em `dressCode.groups[].images` (ex.: `/images/madrinha-1.png`). Vazio exibe o espaço reservado.

## Ordem das seções

Hero (com menu) → Nossa história → O grande dia (programação, local e traje) → Dress code (foto dos padrinhos e madrinhas) → A festa → Nossa trilha (lista de músicas) → Sua missão → Presentes (carrossel) → Confirmação de presença → Dúvidas → Rodapé. Componentes em `src/components/`.

Nos títulos do arquivo de configuração, o trecho entre `*asteriscos*` aparece em itálico de destaque (ex.: `'Um dia. *Uma vida inteira.*'`).

## RSVP — regras e segurança

- Códigos no formato `CASA-XXXXX-XXXXX` (~50 bits de entropia, sem caracteres ambíguos). O convidado pode digitar com ou sem hífens/maiúsculas.
- O banco guarda apenas o **hash HMAC** (para validar) e uma cópia **cifrada** (para o painel). Não existe consulta por lista.
- **Individual:** 1 pessoa, sem acompanhante. **Casal:** máximo 2 — o acompanhante pode vir cadastrado (nome imutável) ou, se o convite permitir, ser informado pelo convidado uma única vez.
- A capacidade é garantida no **PostgreSQL** (gatilhos + índices únicos + bloqueio de linha em `submit_rsvp`), inclusive com envios simultâneos.
- Cada participante tem sua própria resposta; alterações atualizam os registros existentes (`allowChanges` e o prazo no config controlam isso). Todo envio fica em `rsvp_events`.
- O convidado só vê e altera participantes do próprio convite. Convites inativos são rejeitados.
- Proteção contra força bruta: limite por IP (8 códigos inválidos/hora), limite global e limite geral de requisições, persistidos no banco; honeypot; verificação de origem.
- O RSVP não depende da lista de presentes: os popups só aparecem **depois** que o servidor confirma o salvamento, uma vez por confirmação.

## Painel administrativo (`/admin`)

Login com e-mail e senha (scrypt), sessão em cookie `httpOnly`/`Secure`/`SameSite=Strict` validada no banco em cada página, ação e exportação. Limite de tentativas de login.

Funções: criar convites individuais e de casal (código gerado automaticamente), cadastrar/remover acompanhantes, editar nomes e status, ativar/desativar, gerar novo código, excluir, filtrar por confirmados/recusas/pendentes/inativos, buscar por nome, totais e **exportar CSV** (compatível com Excel).

### Importar a lista real

```bash
npm run guests:import -- convidados.csv
```

CSV com cabeçalho `tipo;convidado;acompanhante;permitir_acompanhante;identificacao` (`tipo` = `individual` ou `casal`). Gera `convites-gerados.csv` com os códigos de cada convite. Guarde em local seguro.

## Testes

Com o servidor rodando:

```bash
BASE_URL=http://localhost:3000 npm run test:rsvp
```

29 verificações: código inválido, individual, casal, nome imutável, terceiro participante, isolamento entre convites, concorrência, convite inativo, força bruta, honeypot, origem e proteção do painel. Os dados de teste são removidos ao final.

## Deploy

Recomendado: **Vercel + Supabase**. Configure as variáveis de ambiente no projeto, rode `npm run db:migrate` apontando para o banco de produção e crie o administrador. A Vercel fornece HTTPS e define o IP real do cliente (usado nos limites de tentativas). Em servidor próprio, coloque a aplicação atrás de um proxy reverso com HTTPS que sobrescreva `X-Forwarded-For`.

O schema `wedding` não é exposto pela API pública do Supabase (RLS ativo, permissões revogadas de `anon`/`authenticated`).
