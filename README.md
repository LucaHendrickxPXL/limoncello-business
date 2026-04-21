# Limoncello Business Webapp

Interne webapp voor een limoncello- en arancello-business, gebouwd als rustige operationele workspace rond batches, orders, opbrengsten en kosten.

## V1 in het kort

- batch-centric datamodel
- login met server-side sessies en routebescherming
- een hoofdroute `/` met view-based werkruimtes
- Postgres in Docker
- webapp lokaal via `npm run dev`
- mutaties via server actions, niet via een grote `/api/*`-laag

## Stack

- `Next.js App Router`
- `TypeScript`
- `Mantine`
- `TanStack Query`
- `Postgres`
- `pg`
- `Docker Compose`

## Belangrijkste views

- `Home`
- `Batches`
- `Orders`
- `Kosten`
- `Dashboard`
- `Klanten`
- `Ratio templates`
- `Artikelen`

De UX volgt bewust een operationele aanpak:

- `Home` als command center
- desktop met `Actions / Now / Attention`
- primaire schermen als workspace of list-detail
- geen developer- of admin-tool gevoel

## Projectstructuur

```text
docs/
  ux-direction.md
  v1-spec.md
src/
  app/
  components/
  lib/
scripts/
schema.sql
PROJECT_BRIEF.md
DATABASE_SCHEMA.md
README.md
```

## Documentatie

- [PROJECT_BRIEF.md](./PROJECT_BRIEF.md): productdoel, scope en UX-richting
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md): datamodel in mensentaal
- [docs/v1-spec.md](./docs/v1-spec.md): functionele en technische bron van waarheid voor v1
- [docs/ux-direction.md](./docs/ux-direction.md): schermgedrag, navigatie en UI-richting
- [schema.sql](./schema.sql): effectieve Postgres schemafile

## Snel starten

1. Installeer dependencies:

```bash
npm install
```

2. Maak je lokale env:

```bash
cp .env.example .env.local
```

Windows PowerShell alternatief:

```powershell
Copy-Item .env.example .env.local
```

Vul daarna ook deze auth secrets in met lange unieke waarden:

- `AUTH_SETUP_KEY`
- `AUTH_PASSWORD_PEPPER`

3. Start Postgres in Docker:

```bash
npm run db:up
```

4. Initialiseer schema en seeddata:

```bash
npm run db:init
```

5. Start de webapp:

```bash
npm run dev
```

De standaard lokale databasepoort is `5434`.

## Deploy via Portainer

Deze repo kan nu ook als Docker stack gedeployed worden via Portainer op je host.

Voor jouw setup met Caddy als reverse proxy:

- webapp bindt standaard op `127.0.0.1:5000`
- Postgres bindt standaard op `127.0.0.1:5434`
- de appcontainer praat intern met Postgres via service-naam `postgres`

Belangrijke stack environment variables:

- `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/limoncello_business`
- `AUTH_SETUP_KEY=<lange-unieke-geheime-waarde>`
- `AUTH_PASSWORD_PEPPER=<lange-unieke-geheime-waarde>`
- `POSTGRES_DB=limoncello_business`
- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=<sterk-database-wachtwoord>`
- `WEB_BIND_ADDRESS=127.0.0.1`
- `WEB_PORT=5000`

Aanpak in Portainer:

1. maak een stack aan vanuit je GitHub repo
2. gebruik [`docker-compose.yml`](./docker-compose.yml) als stack file
3. vul de environment variables hierboven in
4. deploy de stack
5. laat Caddy proxy'en naar `127.0.0.1:5000`

Een minimale Caddy reverse proxy ziet er zo uit:

```caddyfile
erp.jouwdomein.be {
  reverse_proxy 127.0.0.1:5000
}
```

## Login en security

De app gebruikt nu:

- een `/login` pagina
- server-side sessies
- `HttpOnly` + `SameSite=Lax` cookies
- routebescherming via middleware en server-side checks
- login throttling
- security headers via `next.config.ts`

Eerste gebruik:

1. zet `AUTH_SETUP_KEY` en `AUTH_PASSWORD_PEPPER` in `.env.local`
2. run `npm run db:init`
3. open `/login`
4. maak het eerste owner-account aan met je e-mail, wachtwoord en setup key

Daarna is de gewone login actief en kan niemand zonder geldige sessie de app openen.

## Belangrijkste scripts

- `npm run dev`: start de app lokaal
- `npm run build`: productiebuild
- `npm run typecheck`: TypeScript controle
- `npm run db:up`: start Postgres via Docker
- `npm run db:init`: pas schema toe en seed voorbeelddata
- `npm run db:seed`: seed alleen voorbeelddata
- `npm run db:reset`: reset schema en seeddata
- `npm run db:down`: stop de Docker stack

## Data-aanpak

De app gebruikt deze kern-tabellen:

- `articles`
- `ratio_templates`
- `ratio_template_lines`
- `batches`
- `batch_status_history`
- `customers`
- `orders`
- `order_status_history`
- `revenue_entries`
- `expenses`

Belangrijke businessregels:

- orders reserveren liters pas vanaf `in_verwerking`
- `klaar_voor_uitlevering` blijft liters reserveren
- afgeronde orders krijgen exact een `revenue_entry`
- als een order uit `afgerond` gehaald wordt, verdwijnt die `revenue_entry`
- kosten hangen altijd aan een batch en een artikel
- rapportage vertrekt uit views zoals `batch_metrics_v1` en `article_reporting_v1`

## Technische richting

- server-side dataloading gebeurt vanuit [src/lib/server/workspace-data.ts](./src/lib/server/workspace-data.ts)
- mutaties zitten in [src/app/actions.ts](./src/app/actions.ts)
- de hoofdworkspace zit in [src/components/limoncello-workspace.tsx](./src/components/limoncello-workspace.tsx)
- databaseconnectie zit in [src/lib/server/db.ts](./src/lib/server/db.ts)

## Seeddata

De seed voorziet een eerste werkbare omgeving met:

- basisartikelen
- finished goods
- ratio templates met lines
- voorbeeldbatches
- klanten
- orders
- opbrengsten
- kosten

Zo kan de eerste versie meteen als echte demo- of testomgeving gebruikt worden.

## Opmerking voor een volgende AI of developer

Start altijd vanuit deze volgorde:

1. lees [docs/v1-spec.md](./docs/v1-spec.md)
2. lees [docs/ux-direction.md](./docs/ux-direction.md)
3. controleer [schema.sql](./schema.sql)
4. pas daarna pas UI of businesslogica aan

De bedoeling is dat het product operationeel en menselijk blijft aanvoelen, niet technisch of CRUD-gedreven.
