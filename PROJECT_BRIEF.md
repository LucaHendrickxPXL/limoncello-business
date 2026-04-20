# Limoncello Business Webapp Brief

## Productdoel

Deze app wordt een interne operationele tool voor een limoncello- en arancello-business.

De kern van de applicatie is `batch-centric`:

- productie vertrekt vanuit een batch
- orders worden aan een batch gekoppeld
- opbrengsten worden gerealiseerd wanneer orders afgerond zijn
- kosten worden altijd aan een batch gekoppeld

De app is bedoeld om de dagelijkse werking eenvoudig te beheren zonder onnodige technische complexiteit.

## V1 Focus

De eerste versie focust op:

- artikelen beheren
- ratio templates beheren
- batches beheren
- klanten beheren
- orders beheren
- opbrengsten registreren
- kosten registreren
- dashboard- en batchrapportage

## Niet In V1

Voorlopig niet voorzien:

- login of auth
- multi-user permissies
- publieke bestelpagina's
- uitgebreide boekhoudlogica
- generieke voorraadengine
- deelorders of deelleveringen

## Tech Stack

- `Next.js App Router`
- `TypeScript`
- `Mantine`
- `TanStack Query`
- `Postgres`
- `pg`
- `Docker Compose` voor de database

Lokale workflow:

- database in Docker
- webapp lokaal via `npm run dev`

## Architectuurrichting

De app gebruikt:

- één hoofdroute: `/`
- view-based workspace binnen die route
- server-side dataloading
- server actions voor mutaties
- geen grote verzameling losse API-routes

Belangrijkste views:

- `Dashboard`
- `Batches`
- `Orders`
- `Kosten`
- `Klanten`
- `Ratio templates`
- `Artikelen`

## UX Richting

De app mag niet aanvoelen als een developer dashboard of een admin CRUD-paneel.

De interface moet:

- rustig en menselijk aanvoelen
- operationeel en taakgericht zijn
- snel scanbaar zijn
- duidelijke volgende acties tonen
- informatie groeperen volgens dagelijkse werking, niet volgens database-tabellen

We nemen daarom enkele sterke UX-patronen over uit de portfolio tracker.

### Home Als Command Center

`Home` wordt het centrale startpunt van de app.

Op desktop gebruikt `Home` een minimalistische indeling:

- `Actions`
- `Now`
- `Attention`

Dat betekent concreet:

- links: de belangrijkste acties van het moment
- midden: wat nu operationeel relevant is
- rechts: wat aandacht nodig heeft

Voor deze business kan dat bijvoorbeeld worden:

- `Actions`
  - nieuwe batch aanmaken
  - nieuw order aanmaken
  - kost registreren
  - klant toevoegen
- `Now`
  - batches die aan het trekken zijn
  - batches die klaar zijn voor verwerking of levering
  - orders in verwerking
  - recent afgeronde verkopen
- `Attention`
  - batches met weinig beschikbare liters
  - orders die klaar staan voor uitlevering
  - batches zonder `actual produced liters`
  - batches waar kosten of prijs nog ontbreken

Belangrijk:

- `Home` is geen dump van alle data
- `Home` is een operationeel command center
- het scherm moet snel antwoord geven op: wat moet ik nu doen

### Workspace Per View

Net zoals in de portfolio tracker krijgt elke hoofdview een duidelijke workspace-logica.

- `Dashboard`
  - compacte signalen links
  - analyse of samenvatting rechts
- `Batches`
  - list-detail werkruimte
  - links lijst van batches
  - rechts detail van geselecteerde batch
- `Orders`
  - linker pane voor orderinvoer of filters
  - rechter pane voor orderlijst of detail
- `Kosten`
  - linker pane voor nieuwe kost
  - rechter pane voor recente kosten of batchgekoppelde kosten
- `Klanten`
  - eenvoudige list-detail opzet
- `Ratio templates`
  - template links, lines/detail rechts
- `Artikelen`
  - rustige masterdata-view, niet overvol

De bedoeling is dat een gebruiker altijd snapt:

- waar hij zich bevindt
- wat hij hier kan doen
- wat het primaire werkvlak is

### Geen Developer-Gevoel

Om te vermijden dat de app te technisch aanvoelt:

- geen schermen die voelen als ruwe tabellen met alleen CRUD-acties
- geen overdadige filters als standaard
- geen te technische termen als die operationeel niet nodig zijn
- geen overvolle navigatie
- geen “database eerst”-layout

Wel:

- duidelijke titels
- zachte hiërarchie
- compacte kaarten
- korte statussamenvattingen
- duidelijke CTA's
- context bij belangrijke cijfers

Voorbeelden van betere taal:

- `Nieuwe batch`
- `Klaar voor uitlevering`
- `Beschikbaar volume`
- `Verkocht volume`
- `Nog te verwerken`

in plaats van:

- `Create record`
- `Entity details`
- `Status transition`
- `Inventory allocation`

### Mobile Richting

Mobile hoeft niet dezelfde layout als desktop te volgen.

We nemen deze principes over:

- mobile `Home` werkt als launcher
- mobile toont compacte action cards
- detailweergaves mogen op mobile als aparte focuslaag openen
- scanning en snelle input gaan voor op tabelweergave

Concreet:

- mobile bottom nav blijft eenvoudig
- `Home` is het ankerpunt
- andere views zijn bereikbaar via `Home` en contextsprongen

### Utility Buiten De Primaire Navigatie

Net zoals in de portfolio tracker houden we utility-acties buiten de primaire werkflow.

Dus:

- de hoofdnav is voor operationele domeinen
- secundaire zaken zoals instellingen komen later in een aparte utility-laag

Voor `v1` is die utility-laag nog beperkt, maar de informatiearchitectuur houdt hier al rekening mee.

### Ontwerpprioriteiten

Bij UI-beslissingen gelden deze prioriteiten:

1. dagelijkse workflow eerst
2. scanbaarheid boven datadichtheid
3. duidelijkheid boven flexibiliteit
4. operationele context boven technische volledigheid
5. mobile mag afwijken als dat gebruiksvriendelijker is

## Kernobjecten

### Artikelen

Masterdata voor alles wat gekocht of verkocht wordt, zoals:

- alcohol
- citroenen
- suiker
- flessen
- limoncello
- arancello

### Ratio templates

Herbruikbare recepttemplates met een header en meerdere lines.

### Batches

De centrale productie-entiteit met:

- batchnummer
- ratio template
- produced finished good
- alcohol input
- expected output
- actual produced output
- unit price per liter
- status en statushistoriek

### Orders

Orders koppelen:

- klant
- batch
- aantal liters
- prijs per liter
- totaalbedrag
- status en statushistoriek

### Opbrengsten

Elke afgeronde order krijgt een aparte `revenue entry`.

### Kosten

Elke kost:

- hangt aan een batch
- verwijst naar een artikel
- bewaart bedrag en betaalmethode

## Belangrijkste Businessregels

- liters worden pas gereserveerd vanaf `in_verwerking`
- liters blijven gereserveerd in `klaar_voor_uitlevering`
- `besteld` reserveert nog niets
- een afgerond order krijgt exact één `revenue entry`
- als een afgerond order teruggezet wordt, wordt die `revenue entry` verwijderd
- batch wijzigen op een order mag enkel zolang de orderstatus `besteld` is
- prijs per liter wordt gekopieerd van batch naar order zodat historiek stabiel blijft

## Rapportagevisie

De app moet minstens kunnen tonen:

- verwachte liters per batch
- effectief geproduceerde liters per batch
- gereserveerde liters per batch
- verkochte liters per batch
- beschikbare liters per batch
- opbrengsten per batch
- kosten per batch
- marge per batch
- aankopen per artikel
- verkopen per afgewerkt artikel

## Belangrijke Referentie

De uitgebreide bron van waarheid voor `v1` staat in:

- [docs/v1-spec.md](./docs/v1-spec.md)
