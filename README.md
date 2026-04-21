# Limoncello Business Webapp

Interne operationele webapp voor een limoncello- en arancello-business, gebouwd rond batches, orders, opbrengsten en kosten.

## V1 in het kort

- batch-centric datamodel
- geen login of auth in v1
- een hoofdroute `/` met view-based werkruimtes
- Postgres als datastore
- server actions voor mutaties
- lokale development los van productie-deploy

## Stack

- `Next.js App Router`
- `TypeScript`
- `Mantine`
- `TanStack Query`
- `Postgres`
- `pg`
- `Docker Compose` voor lokale database
- `GitHub Actions + GHCR + Portainer` voor productie

## Documentatie

- [PROJECT_BRIEF.md](./PROJECT_BRIEF.md): productdoel, scope en UX-richting
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md): datamodel in mensentaal
- [docs/v1-spec.md](./docs/v1-spec.md): functionele en technische bron van waarheid voor v1
- [docs/ux-direction.md](./docs/ux-direction.md): schermgedrag, navigatie en UI-richting
- [schema.sql](./schema.sql): effectieve Postgres schemafile

## Development

Development is bewust simpel gehouden:

- Postgres draait via Docker
- de Next.js app draait lokaal via `npm run dev`
- seeddata is alleen voor development

### Lokale start

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

3. Start Postgres:

```bash
npm run db:up
```

4. Pas schema toe en laad demo-data:

```bash
npm run db:init
```

5. Start de webapp:

```bash
npm run dev
```

De lokale database luistert standaard op `localhost:5434`.

## Productie

De robuuste productie-opzet is:

1. GitHub Actions bouwt een Docker image
2. de image wordt gepusht naar `GHCR`
3. Portainer deployed een stack vanuit deze repo
4. de stack gebruikt de vooraf gebouwde image uit GHCR
5. Caddy reverse-proxy't naar `127.0.0.1:5000`

Waarom deze aanpak:

- Next.js ondersteunt runtime environment variables, waardoor je dezelfde image door meerdere omgevingen kan promoveren
- Portainer Git stacks werken prima met een compose-file uit Git
- Portainer raadt impliciet een image-first flow aan voor Git stacks, omdat build vanuit Git nog niet volledig geïmplementeerd is
- bind mounts naar repo-bestanden zijn fragiel bij Git updates omdat Portainer de repo opnieuw clonet

### Lokale vs productiebestanden

- `docker-compose.yml`: lokale developmentdatabase
- `Dockerfile`: productie-image voor de webapp
- `stack.portainer.yml`: productie-stack voor Portainer
- `stack.env.example`: voorbeeld van runtime variabelen voor Portainer
- `.github/workflows/publish-image.yml`: build en push naar GHCR

### Portainer stack

Gebruik in Portainer:

- repository: deze GitHub repo
- compose file path: `stack.portainer.yml`
- environment variables: gebaseerd op `stack.env.example`

Belangrijkste variabelen:

- `WEB_IMAGE=ghcr.io/lucahendrickxpxl/limoncello-business:latest`
- `WEB_BIND_ADDRESS=127.0.0.1`
- `WEB_PORT=5000`
- `POSTGRES_DB=limoncello_business`
- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=<sterk wachtwoord>`
- `DATABASE_URL=postgresql://postgres:<sterk wachtwoord>@postgres:5432/limoncello_business`

### Caddy

Minimale reverse proxy:

```caddyfile
erp.jouwdomein.be {
  reverse_proxy 127.0.0.1:5000
}
```

### GitHub Actions

De workflow in `.github/workflows/publish-image.yml`:

- draait op pushes naar `main`
- bouwt een Docker image
- pushed tags naar GHCR
- kan optioneel een Portainer webhook triggeren via `PORTAINER_STACK_WEBHOOK`

Als je automatische redeploy wilt:

- maak in Portainer een stack webhook aan
- zet die URL als GitHub secret `PORTAINER_STACK_WEBHOOK`

## Schema en data

- `scripts/apply-schema.mjs` past `schema.sql` toe
- de productiecontainer voert dat script bij start uit
- omdat het schema vooral `create if not exists` en `create or replace view` gebruikt, blijven bestaande records normaal behouden
- demo-seeddata wordt niet automatisch in productie geladen

Belangrijk:

- bestaande oude auth-tabellen uit vroegere versies worden niet meer gebruikt
- bij een volledig verse database zitten ze niet meer in het schema
- als je een bestaande database volledig wilt opruimen, doe dat bewust via een aparte cleanup of reset, niet impliciet tijdens een gewone deploy

## Belangrijkste scripts

- `npm run dev`: start de webapp lokaal
- `npm run build`: productiebuild
- `npm run typecheck`: TypeScript controle
- `npm run db:up`: start Postgres lokaal via Docker
- `npm run db:init`: pas schema toe en seed voorbeelddata
- `npm run db:seed`: seed alleen voorbeelddata
- `npm run db:reset`: reset schema en seeddata
- `npm run db:down`: stop de lokale database

## Opmerking voor een volgende AI of developer

Start altijd vanuit deze volgorde:

1. lees [docs/v1-spec.md](./docs/v1-spec.md)
2. lees [docs/ux-direction.md](./docs/ux-direction.md)
3. controleer [schema.sql](./schema.sql)
4. pas daarna UI of businesslogica aan

De bedoeling is dat het product operationeel en menselijk blijft aanvoelen, niet technisch of CRUD-gedreven.
