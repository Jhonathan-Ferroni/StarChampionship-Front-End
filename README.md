# StarChampionship Front

Frontend administrativo do StarChampionship para gerenciar jogadores e gerar times de futebol balanceados.

O projeto foi construido com React + Vite e consome uma API externa para autenticacao, CRUD de jogadores e, quando disponivel, geracao de times. Quando o endpoint de geracao nao existe, a aplicacao faz um balanceamento local como fallback.

## Visao geral

O app entrega um painel protegido por login com os seguintes fluxos:

- autenticacao por senha com armazenamento de token no `localStorage`
- dashboard inicial com resumo rapido e status basico da API
- listagem de jogadores em formato de cards
- visualizacao individual em um card estilo FIFA
- criacao, edicao e exclusao de jogadores
- planilha ordenavel com os principais atributos
- gerador de times com selecao manual de jogadores
- suporte a capitaes fixos e margem alvo de equilibrio
- fallback local para o gerador se `POST /api/generator/generate` retornar `404`

## Stack

- React 19
- Vite 8
- React Router DOM 7
- Axios
- ESLint 9

## Rotas da aplicacao

| Rota                | Tipo      | Descricao                           |
| ------------------- | --------- | ----------------------------------- |
| `/login`            | publica   | tela de autenticacao                |
| `/`                 | protegida | dashboard com resumo da aplicacao   |
| `/players`          | protegida | cards com a lista de jogadores      |
| `/players/new`      | protegida | formulario de cadastro              |
| `/players/:id`      | protegida | detalhes do jogador                 |
| `/players/:id/edit` | protegida | formulario de edicao                |
| `/players/sheets`   | protegida | planilha ordenavel com estatisticas |
| `/generator`        | protegida | geracao e visualizacao dos times    |

## Requisitos

- Node.js em versao LTS recente
- npm
- API do StarChampionship disponivel localmente ou publicada

## Instalacao

1. Clone o repositorio.
2. Instale as dependencias.
3. Configure a URL base da API.
4. Inicie o servidor de desenvolvimento.

```bash
git clone <url-do-repositorio>
cd StarChampionship-Front
npm install
```

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No PowerShell, voce tambem pode usar:

```powershell
Copy-Item .env.example .env
```

Preencha o `.env` com a URL da API:

```env
VITE_API_BASE_URL=http://localhost:5098
```

Depois execute:

```bash
npm run dev
```

Por padrao, o Vite exibira a URL local no terminal, normalmente `http://localhost:5173`.

## Variaveis de ambiente

| Variavel            | Obrigatoria | Descricao                               |
| ------------------- | ----------- | --------------------------------------- |
| `VITE_API_BASE_URL` | sim         | URL base da API consumida pelo frontend |

Observacoes:

- a aplicacao remove barras finais da URL automaticamente
- o valor deve apontar para a raiz da API, por exemplo `http://localhost:5098` ou `https://seu-backend.com`

## Scripts disponiveis

| Comando           | Descricao                                  |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | sobe o ambiente de desenvolvimento com HMR |
| `npm run build`   | gera a build de producao em `dist/`        |
| `npm run preview` | publica localmente a build gerada          |
| `npm run lint`    | executa o ESLint no projeto                |

## Fluxo de autenticacao

O login e feito por senha simples e segue este comportamento:

- o frontend tenta `POST /api/auth/login`
- se esse endpoint retornar `404`, ele tenta `POST /api/account/login`
- o token retornado e salvo em `localStorage` na chave `token`
- o campo de expiracao, quando existir, e salvo em `tokenExpiresAt`
- todas as requisicoes seguintes recebem `Authorization: Bearer <token>`
- respostas `401` limpam o token local e redirecionam o usuario para `/login`

Payload esperado para login:

```json
{
  "password": "sua-senha"
}
```

Resposta esperada:

```json
{
  "token": "jwt-ou-token-equivalente",
  "expiresAt": "2026-04-26T23:59:59Z",
  "success": true
}
```

O frontend tambem aceita variacoes de capitalizacao como `Token`, `ExpiresAt` e `Success`.

## Integracao com a API

### Endpoints utilizados

| Metodo   | Endpoint                  | Uso no frontend                                      |
| -------- | ------------------------- | ---------------------------------------------------- |
| `POST`   | `/api/auth/login`         | login principal                                      |
| `POST`   | `/api/account/login`      | fallback de login                                    |
| `GET`    | `/api/players`            | dashboard, listagens, planilha, formulario e gerador |
| `GET`    | `/api/players/:id`        | detalhes e edicao de jogador                         |
| `POST`   | `/api/players`            | criacao de jogador                                   |
| `PUT`    | `/api/players/:id`        | edicao de jogador                                    |
| `DELETE` | `/api/players/:id`        | remocao de jogador                                   |
| `POST`   | `/api/generator/generate` | geracao de times pela API                            |

### Formatos aceitos para colecoes

O frontend aceita listas retornadas de formas diferentes. Alem de arrays diretos, ele tambem tenta extrair colecoes de chaves como:

- `$values`
- `items` ou `Items`
- `players` ou `Players`
- `data` ou `Data`
- `results` ou `Results`
- `teams` ou `Teams`

Isso ajuda a integrar tanto com respostas simples quanto com payloads encapsulados.

### Campos de jogador aceitos

O projeto normaliza diferentes aliases vindos da API. Exemplos:

| Campo normalizado | Aliases aceitos                                                              |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | `id`, `Id`, `playerId`, `PlayerId`                                           |
| `name`            | `name`, `Name`, `playerName`, `PlayerName`                                   |
| `overall`         | `overall`, `Overall`                                                         |
| `imageUrl`        | `imageUrl`, `ImageUrl`, `photoUrl`, `PhotoUrl`, `avatarUrl`, `AvatarUrl`     |
| `speed`           | `speed`, `Speed`, `pace`, `Pace`                                             |
| `shoot`           | `shoot`, `Shoot`, `shooting`, `Shooting`, `finishing`, `Finishing`           |
| `dribble`         | `dribble`, `Dribble`, `dribbling`, `Dribbling`                               |
| `pass`            | `pass`, `Pass`, `passing`, `Passing`                                         |
| `defense`         | `defense`, `Defense`, `defending`, `Defending`                               |
| `strength`        | `strength`, `Strength`, `physical`, `Physical`, `physicality`, `Physicality` |
| `team`            | `team`, `Team`, `club`, `Club`                                               |
| `nationality`     | `nationality`, `Nationality`, `country`, `Country`                           |

Exemplo de jogador compativel:

```json
{
  "id": 10,
  "name": "Joao",
  "imageUrl": "https://exemplo.com/jogador.png",
  "overall": 82,
  "speed": 78,
  "shoot": 81,
  "pass": 76,
  "dribble": 80,
  "defense": 60,
  "strength": 74,
  "firstTouch": 79,
  "ballControl": 83,
  "team": "Azul",
  "nationality": "Brasil"
}
```

### Payload enviado no cadastro e na edicao

O formulario reaproveita o shape original retornado pela API sempre que possivel e preenche os aliases conhecidos com os novos valores. Isso reduz quebra de compatibilidade entre diferentes contratos do backend.

Campos como `position` e `role` sao omitidos do payload final pelo utilitario de normalizacao atual.

## Gerador de times

Na tela `/generator`, o usuario pode:

- selecionar manualmente quais jogadores participam
- definir a quantidade de times
- informar uma margem alvo de equilibrio
- travar capitaes por time

Payload enviado para a API:

```json
{
  "SelectedIds": [10, 11, 12, 13],
  "NumberOfTeams": 2,
  "HasFixedCaptains": true,
  "SelectedCaptains": {
    "0": "Joao",
    "1": "Carlos"
  },
  "Margin": 5
}
```

Resposta esperada em formato compativel:

```json
{
  "Teams": [
    {
      "TeamNumber": 1,
      "TotalScore": 160,
      "Players": []
    },
    {
      "TeamNumber": 2,
      "TotalScore": 158,
      "Players": []
    }
  ],
  "Score": 2
}
```

Se `POST /api/generator/generate` retornar `404`, o frontend monta os times localmente ordenando os jogadores por `overall` e distribuindo-os no time com menor soma acumulada.

## Estrutura do projeto

```text
.
|-- public/
|-- src/
|   |-- components/
|   |-- hooks/
|   |-- pages/
|   |-- services/
|   |-- utils/
|   |-- App.jsx
|   |-- index.css
|   `-- main.jsx
|-- .env.example
|-- eslint.config.js
|-- index.html
|-- package.json
`-- vite.config.js
```

Resumo por pasta:

- `src/pages`: telas principais da aplicacao
- `src/components`: componentes reutilizaveis de interface
- `src/services`: cliente HTTP e servicos de autenticacao
- `src/hooks`: hooks customizados, como o controle de autenticacao
- `src/utils`: normalizacao de dados, formatacoes e montagem de payloads

## Comportamentos importantes

- todas as rotas, exceto `/login`, sao protegidas
- o dashboard usa `GET /api/players` como fonte de resumo rapido
- a pagina de planilha permite ordenacao por nome e atributos numericos
- a tela de detalhes aplica um visual estilo card FIFA com tiers por `overall`
- o formulario detecta campos adicionais vindos da API e os exibe dinamicamente na edicao

## Build e publicacao

Para gerar os arquivos de producao:

```bash
npm run build
```

O resultado sera criado em `dist/`. Para validar localmente a build:

```bash
npm run preview
```

Ao publicar, lembre-se de configurar `VITE_API_BASE_URL` no ambiente do provedor antes da build.

## Qualidade de codigo

Lint:

```bash
npm run lint
```
