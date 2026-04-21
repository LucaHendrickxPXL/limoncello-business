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
- [migrations/](./migrations): bron van waarheid voor databasewijzigingen
- [schema.sql](./schema.sql): leesbare schema-snapshot voor snelle referentie

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

`DATABASE_URL` hoef je normaal niet handmatig te zetten in Portainer.
De webcontainer bouwt die nu zelf op uit `POSTGRES_DB`, `POSTGRES_USER` en `POSTGRES_PASSWORD`.
Alleen als je bewust naar een externe database wilt wijzen, zet je zelf `DATABASE_URL`.

### Wat je na een push nog wel en niet hoeft te doen

Na een gewone GitHub push en een Portainer stack update hoef je normaal geen losse database-setupstap meer te doen.

- niet nodig in productie: `npm run db:init`
- niet nodig in Portainer: handmatig schema of seed scripts uitvoeren
- wel automatisch: de webcontainer wacht op Postgres en voert daarna alle open migraties uit

De bedoeling is dus:

1. push naar GitHub
2. GitHub Actions bouwt een nieuwe image
3. Portainer update de stack
4. de container past open migraties toe
5. daarna start de app normaal op

Door de advisory lock in de migratielogica kunnen meerdere starts of restarts niet tegelijk dezelfde migraties uitvoeren.

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
- draait eerst `npm ci`, `typecheck`, tests en een productiebuild
- bouwt een Docker image
- pushed tags naar GHCR
- kan optioneel een Portainer webhook triggeren via `PORTAINER_STACK_WEBHOOK`

Als je automatische redeploy wilt:

- maak in Portainer een stack webhook aan
- zet die URL als GitHub secret `PORTAINER_STACK_WEBHOOK`

## Schema en data

- `scripts/apply-schema.mjs` voert openstaande SQL-migraties uit uit `migrations/`
- de productiecontainer voert dat script bij start uit
- elke migratie wordt exact één keer bijgehouden in `schema_migrations`
- `schema.sql` blijft een snapshot voor documentatie en snelle inspectie, maar is niet langer de runtime bron van waarheid
- nieuwe databasewijzigingen krijgen een nieuwe genummerde file in `migrations/`; pas bestaande migraties niet stilzwijgend aan zodra ze al ergens zijn toegepast
- demo-seeddata wordt niet automatisch in productie geladen

Praktische afspraak:

- lokaal gebruik je `npm run db:init` voor migraties + demo-data
- in productie vertrouw je op de automatische migratierun bij containerstart
- elke schemawijziging krijgt een nieuwe migration file
- bestaande migrations pas je niet "even snel" aan om een deploy te redden

Belangrijk:

- bestaande oude auth-tabellen uit vroegere versies worden niet meer gebruikt
- bij een volledig verse database zitten ze niet meer in het schema
- als je een bestaande database volledig wilt opruimen, doe dat bewust via een aparte cleanup of reset, niet impliciet tijdens een gewone deploy

## Belangrijkste scripts

- `npm run dev`: start de webapp lokaal
- `npm run build`: productiebuild
- `npm run typecheck`: TypeScript controle
- `npm run db:up`: start Postgres lokaal via Docker
- `npm run db:init`: voer migraties uit en seed voorbeelddata
- `npm run db:seed`: seed alleen voorbeelddata
- `npm run db:reset`: reset database, voer migraties opnieuw uit en seeddata
- `npm run db:down`: stop de lokale database

## Opmerking voor een volgende AI of developer

Start altijd vanuit deze volgorde:

1. lees [docs/v1-spec.md](./docs/v1-spec.md)
2. lees [docs/ux-direction.md](./docs/ux-direction.md)
3. controleer eerst [migrations/](./migrations) en gebruik [schema.sql](./schema.sql) alleen als snapshot
4. pas daarna UI of businesslogica aan

De bedoeling is dat het product operationeel en menselijk blijft aanvoelen, niet technisch of CRUD-gedreven.
