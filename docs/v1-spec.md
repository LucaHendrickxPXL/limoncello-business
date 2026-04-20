# Limoncello Business Webapp V1 Spec

## Doel

Deze webapp wordt een interne business tool voor een limoncello- en arancello-activiteit.

De app is in `v1` bewust eenvoudig:

- geen login of auth flow
- geen publieke customer-facing flows
- geen losse API-structuur met veel endpoints
- een enkele hoofdroute `/`
- views binnen die route
- focus op de kern van de operatie:
  - batches
  - ratio templates
  - klanten
  - orders
  - opbrengsten
  - kosten
  - rapportage/dashboard

De centrale businesslogica is `batch-centric`:

- alles vertrekt vanuit een batch
- een batch produceert een afgewerkt artikel zoals `Limoncello` of `Arancello`
- orders worden aan exact één batch gekoppeld
- opbrengsten worden per afgerond order in een aparte opbrengstentabel geregistreerd
- kosten worden altijd aan een batch gekoppeld

## V1 Scope

De app moet in `v1` minstens toelaten om:

- artikelmasterdata te beheren
- ratio templates te beheren
- batches aan te maken en op te volgen
- de statusgeschiedenis van batches bij te houden
- klanten te beheren
- orders aan batches en klanten te koppelen
- orderstatussen te wijzigen
- automatisch opbrengsten te registreren wanneer een order `afgerond` wordt
- de opbrengst terug te verwijderen wanneer een afgerond order terug naar een niet-afgeronde status gaat
- kosten per batch te registreren, gekoppeld aan een artikel
- rapportage te tonen over:
  - liters verwacht
  - liters effectief geproduceerd
  - liters gereserveerd
  - liters verkocht
  - liters beschikbaar
  - opbrengsten per batch
  - kosten per batch
  - verkoop en aankopen per artikel

## Buiten Scope Voor V1

Deze zaken horen voorlopig niet in `v1`:

- user login
- rollen en permissies
- multi-user conflict handling
- losse `/api/*` routecollectie zoals een klassieke CRUD API
- gedeeltelijke leveringen
- voorraadengine met generieke stock movements
- algemene kosten zonder batch
- boekhouding of btw-logica
- betalingen met meerdere deelbetalingen
- productieplanning over meerdere productiestappen

## Tech Stack

De app gebruikt dezelfde algemene stackrichting als de bestaande portfolio tracker, behalve de databasekeuze.

- `Next.js App Router`
- `TypeScript`
- `Mantine`
- `TanStack Query`
- `Postgres`
- `pg` voor server-side database toegang
- `Docker Compose` voor de database
- webapp lokaal draaien via `npm run dev`

## Runtime Aanpak

### Development

- `Postgres` draait in Docker
- de webapp draait lokaal op het systeem via `npm run dev`
- database connectie loopt via `DATABASE_URL`

### Routing

De app gebruikt voorlopig één hoofdroute:

- `/`

Binnen die route worden verschillende views gerenderd, vergelijkbaar met de portfolio tracker:

- `Dashboard`
- `Batches`
- `Orders`
- `Kosten`
- `Klanten`
- `Ratio templates`
- `Artikelen`

### Data mutations

De voorkeur is:

- geen verspreide REST API-routes
- geen grote `/api/*` structuur
- data lezen server-side in de route
- mutaties via server actions
- view-driven UI binnen dezelfde route

TanStack Query kan nog steeds gebruikt worden voor client-state en refetching, maar de architectuur blijft route- en view-gericht in plaats van API-first.

## UX/UI Richting

De UX-richting neemt bewust enkele sterke patronen over uit de portfolio tracker, maar vertaalt ze naar een operationele business app voor limoncello.

De app mag niet aanvoelen als een developer tool of generiek admin paneel.

De basisprincipes zijn:

- werk vanuit dagelijkse taken
- toon alleen relevante informatie per moment
- gebruik een rustige workspace in plaats van drukke dashboards
- laat navigatie helpen bij het werk in plaats van enkel data te tonen

### Home View

`Home` is het centrale startpunt.

Desktop:

- een lichte command center layout
- minimalistische `Actions / Now / Attention` indeling

Mobile:

- een compacte action grid
- `Home` werkt als launcher naar de rest van de app

### Workspace Patronen

De hoofdviews volgen een consistente workspace-logica:

- `Dashboard`
  - compacte signalen links
  - analyse of samenvatting rechts
- `Batches`
  - list-detail
  - linker pane met batches
  - rechter pane met batchdetail
- `Orders`
  - linker pane voor entry of filters
  - rechter pane voor lijst of detail
- `Kosten`
  - linker pane voor invoer
  - rechter pane voor overzicht
- `Klanten`
  - rustige list-detail
- `Ratio templates`
  - template-overzicht links
  - lines en detail rechts
- `Artikelen`
  - eenvoudige beheerweergave zonder technische overload

### Mobile Principes

- mobile mag een andere weergave hebben als scanning en snelle input dan beter werken
- detailweergaves mogen op smallere schermen als aparte focuslaag openen
- tabellen zijn niet de standaardweergave op mobile

### Taalgebruik

De interface gebruikt operationele taal in plaats van technische systeemtaal.

Goede voorbeelden:

- `Nieuwe batch`
- `Beschikbaar volume`
- `Klaar voor uitlevering`
- `Voeg kost toe`
- `Recente verkopen`

Te vermijden voorbeelden:

- `Create entity`
- `Manage records`
- `Allocation state`
- `Transition status`

### Navigatieprincipes

- `Home` is het primaire ankerpunt
- de hoofdnavigatie bevat alleen operationele werkdomeinen
- utility-acties horen niet thuis in de primaire flow
- contextsprongen tussen views zijn belangrijker dan veel top-level tabs

## Kernconcepten

### 1. Artikelen

Een artikel is de generieke masterdata-entiteit voor alles wat gekocht of verkocht kan worden.

Voorbeelden:

- `Alcohol 96%`
- `Water`
- `Suiker`
- `Citroen`
- `Appelsien`
- `Fles 500ml`
- `Etiket`
- `Limoncello`
- `Arancello`

Artikelen worden gebruikt in:

- ratio templates
- kosten
- rapportage
- batches via het geproduceerde afgewerkte artikel

### 2. Ratio templates

Een ratio template is een herbruikbaar receptmodel gebaseerd op `1L alcohol`.

Een ratio template heeft:

- een naam
- een verwijzing naar het afgewerkte artikel dat ermee geproduceerd wordt
- een verwachte output per `1L alcohol`
- meerdere ratio lines met artikel + hoeveelheid + eenheid

Voorbeeld:

- `Alcohol 96%` -> `1 L`
- `Water` -> `2.2 L`
- `Suiker` -> `700 g`
- `Citroen` -> `14 st`

### 3. Batches

Een batch is het centrale object van de applicatie.

Een batch heeft onder meer:

- batchnummer
- creatiedatum
- aantal trekdagen
- datum klaar om te verwerken (`steeping_until` of `ready_at`)
- gekozen ratio template
- geproduceerd afgewerkt artikel
- hoeveelheid alcohol-input
- verwachte output
- effectieve geproduceerde output
- eenheidsprijs per liter
- status

Orders, opbrengsten en kosten hangen rechtstreeks aan een batch.

### 4. Orders

Een order koppelt:

- één klant
- één batch
- een aantal bestelde liters
- een unit price per liter
- een totaalbedrag
- een status

Een order reserveert liters pas vanaf status:

- `in_verwerking`
- `klaar_voor_uitlevering`

Een order reserveert geen liters in status:

- `besteld`
- `afgerond`
- `geannuleerd`

### 5. Opbrengsten

Opbrengsten worden bewust in een aparte tabel bewaard.

Regel:

- wanneer een order naar `afgerond` gaat, wordt exact één `revenue_entry` aangemaakt
- wanneer een afgerond order teruggaat naar een niet-afgeronde status, wordt de gekoppelde `revenue_entry` verwijderd

Zo blijft de opbrengstentabel een expliciete financiële registratie van gerealiseerde verkoop.

### 6. Kosten

Kosten worden altijd aan een batch gekoppeld.

Een kost verwijst ook naar een artikel, zodat later rapportage mogelijk wordt zoals:

- hoeveel alcohol gekocht
- hoeveel citroenen gekocht
- hoeveel flessen gekocht

## Data Model

## Tabellenoverzicht

V1 gebruikt deze tabellen:

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

## 1. articles

Doel:

- masterdata voor aankoop- en verkoopartikelen

Belangrijkste velden:

- `id`
- `name`
- `sku` nullable
- `category`
- `default_unit`
- `is_active`
- `created_at`
- `updated_at`

Voorgestelde categorieën:

- `ingredient`
- `packaging`
- `finished_good`
- `other`

Voorgestelde eenheden:

- `l`
- `g`
- `kg`
- `st`

Belangrijke regels:

- `Limoncello` en `Arancello` zijn artikelen van type `finished_good`
- ratio templates en kosten verwijzen naar artikelen

## 2. ratio_templates

Doel:

- herbruikbare receptheaders

Belangrijkste velden:

- `id`
- `name`
- `finished_good_article_id`
- `base_alcohol_liters`
- `expected_output_liters_per_base_alcohol_liter`
- `notes`
- `is_active`
- `created_at`
- `updated_at`

Belangrijke regels:

- `base_alcohol_liters` is in praktijk normaal `1`, maar blijft expliciet bewaard
- de template verwijst naar het geproduceerde finished good artikel

## 3. ratio_template_lines

Doel:

- ingrediëntenregels binnen een ratio template

Belangrijkste velden:

- `id`
- `ratio_template_id`
- `article_id`
- `quantity`
- `unit`
- `sort_order`
- `created_at`
- `updated_at`

Belangrijke regels:

- elke line verwijst naar één artikel
- unit wordt expliciet per line vastgezet
- sortering zorgt voor stabiele weergave

## 4. batches

Doel:

- hoofdentiteit van de business

Belangrijkste velden:

- `id`
- `batch_number`
- `created_at`
- `started_steeping_at`
- `steep_days`
- `steeping_until`
- `ready_at` nullable
- `status`
- `finished_good_article_id`
- `ratio_template_id`
- `ratio_template_name_snapshot`
- `alcohol_input_liters`
- `expected_output_liters`
- `actual_produced_liters` nullable
- `unit_price_per_liter`
- `notes`
- `updated_at`

Belangrijke regels:

- `batch_number` is uniek
- `batch_number` wordt automatisch gegenereerd bij het aanmaken van een batch
- `finished_good_article_id` verwijst naar bv. `Limoncello` of `Arancello`
- templategegevens die businesskritisch zijn worden ook als snapshot op batchniveau bewaard
- `expected_output_liters` wordt opgeslagen op de batch en niet enkel dynamisch afgeleid

Voorgestelde batchstatussen:

- `draft`
- `steeping`
- `ready`
- `sold_out`
- `archived`

## 5. batch_status_history

Doel:

- historiek van statuswijzigingen op batches

Belangrijkste velden:

- `id`
- `batch_id`
- `from_status` nullable
- `to_status`
- `changed_at`
- `note` nullable

Belangrijke regels:

- elke relevante statuswijziging wordt gelogd
- eerste statuswissel mag `from_status = null` hebben

## 6. customers

Doel:

- klantgegevens beheren

Belangrijkste velden:

- `id`
- `first_name`
- `last_name`
- `email` nullable
- `phone` nullable
- `notes` nullable
- `created_at`
- `updated_at`

Belangrijke regels:

- enkel `first_name` en `last_name` zijn verplicht in `v1`

## 7. orders

Doel:

- verkooporder gekoppeld aan batch en klant

Belangrijkste velden:

- `id`
- `order_number`
- `customer_id`
- `batch_id`
- `ordered_liters`
- `unit_price_per_liter`
- `total_amount`
- `status`
- `ordered_at`
- `completed_at` nullable
- `notes` nullable
- `updated_at`

Voorgestelde orderstatussen:

- `besteld`
- `in_verwerking`
- `klaar_voor_uitlevering`
- `afgerond`
- `geannuleerd`

Belangrijke regels:

- `order_number` is uniek
- `unit_price_per_liter` wordt gekopieerd van de batch en daarna vastgezet op het order
- `total_amount = ordered_liters * unit_price_per_liter`
- een order kan niet gedeeltelijk afgerond worden in `v1`
- batch wijzigen is alleen toegestaan zolang order status `besteld` is
- vanaf `in_verwerking` wordt de batchkoppeling vastgezet

## 8. order_status_history

Doel:

- historiek van statuswijzigingen op orders

Belangrijkste velden:

- `id`
- `order_id`
- `from_status` nullable
- `to_status`
- `changed_at`
- `note` nullable

Belangrijke regels:

- elke statusovergang wordt gelogd
- deze tabel ondersteunt latere rapportage en auditability

## 9. revenue_entries

Doel:

- expliciete registratie van gerealiseerde opbrengsten

Belangrijkste velden:

- `id`
- `order_id`
- `batch_id`
- `customer_id`
- `finished_good_article_id`
- `liters_sold`
- `unit_price_per_liter`
- `total_amount`
- `recognized_at`
- `notes` nullable
- `created_at`

Belangrijke regels:

- exact één revenue entry per afgerond order
- `order_id` moet uniek zijn in deze tabel
- bij terugzetten van een order van `afgerond` naar een andere status wordt de gekoppelde revenue entry verwijderd

## 10. expenses

Doel:

- kostenregistratie per batch

Belangrijkste velden:

- `id`
- `batch_id`
- `article_id`
- `expense_date`
- `quantity` nullable
- `unit` nullable
- `amount`
- `payment_method`
- `supplier_name` nullable
- `notes` nullable
- `created_at`
- `updated_at`

Voorgestelde betaalmethodes:

- `cash`
- `overschrijving`

Belangrijke regels:

- elke kost moet aan een batch hangen
- elke kost verwijst naar een artikel
- quantity en unit zijn wenselijk voor rapportage, maar kunnen in uitzonderlijke gevallen nullable blijven

## Afgeleide Businesswaarden

De volgende waarden worden in eerste instantie niet als bron van waarheid opgeslagen, maar berekend op basis van onderliggende data.

### Sold liters per batch

Afleiding:

- som van `revenue_entries.liters_sold` voor die batch

### Reserved liters per batch

Afleiding:

- som van `orders.ordered_liters` voor die batch
- enkel waar status in:
  - `in_verwerking`
  - `klaar_voor_uitlevering`

### Available liters per batch

Regel:

- als `actual_produced_liters` ingevuld is:
  - `actual_produced_liters - sold_liters - reserved_liters`
- anders:
  - `expected_output_liters - sold_liters - reserved_liters`

### Batch revenue

Afleiding:

- som van `revenue_entries.total_amount` per batch

### Batch costs

Afleiding:

- som van `expenses.amount` per batch

### Batch margin

Afleiding:

- `batch revenue - batch costs`

## Belangrijkste Businessregels

## Orders

- een order hoort bij exact één batch
- een order hoort bij exact één klant
- een order heeft geen deelleveringen in `v1`
- liters worden pas gereserveerd vanaf `in_verwerking`
- liters blijven gereserveerd in `klaar_voor_uitlevering`
- liters worden niet gereserveerd in `besteld`
- liters worden niet als reserved geteld in `afgerond`
- liters worden niet als reserved geteld in `geannuleerd`

## Revenue

- een order in status `afgerond` krijgt een `revenue_entry`
- een order dat uit `afgerond` wordt gehaald verliest zijn `revenue_entry`
- er kan maximaal één `revenue_entry` bestaan per order

## Batch wijzigbaarheid

- zolang een order `besteld` is, mag de batch nog gewijzigd worden
- zodra een order `in_verwerking` is, mag de batch niet meer wijzigen

## Historische correctheid

Om historiek stabiel te houden:

- `unit_price_per_liter` wordt vastgezet op orderniveau
- `expected_output_liters` wordt vastgezet op batchniveau
- relevante template-informatie kan als snapshot op batchniveau bewaard worden

## Rapportagevisie Voor V1

De app moet rapportage kunnen tonen op basis van:

- batches
- opbrengsten
- kosten
- orders
- artikelen

Belangrijke rapportagevragen die `v1` moet kunnen beantwoorden:

- hoeveel liter werd verwacht per batch
- hoeveel liter werd effectief geproduceerd per batch
- hoeveel liter is momenteel gereserveerd per batch
- hoeveel liter werd effectief verkocht per batch
- hoeveel liter is nog beschikbaar per batch
- hoeveel opbrengst bracht een batch op
- hoeveel kosten zijn aan een batch gekoppeld
- wat is de marge per batch
- hoeveel van een artikel werd gekocht via kosten
- hoeveel van een afgewerkt artikel werd verkocht via opbrengsten

Voor `v1` is er nog geen volledige stock engine voor actuele voorraden van grondstoffen.
Rapportage over aankopen en verkopen per artikel is wel voorzien.

## Viewstructuur

## Dashboard

Toont een operationeel overzicht:

- actieve batches
- batches die bijna klaar zijn
- liters gereserveerd
- liters verkocht
- omzet
- kosten
- marge
- aandachtspunten

## Batches

Doel:

- batches aanmaken en beheren

Belangrijke functies:

- batch aanmaken
- status wijzigen
- batchdetail openen
- verwachte en effectieve output beheren
- gekoppelde orders, kosten en opbrengsten bekijken

## Orders

Doel:

- orders beheren

Belangrijke functies:

- order aanmaken
- klant selecteren
- batch selecteren
- liters invullen
- status beheren
- automatisch opbrengstlogica toepassen bij `afgerond`

## Kosten

Doel:

- kosten registreren per batch

Belangrijke functies:

- batch selecteren
- artikel selecteren
- bedrag invoeren
- quantity en unit optioneel of verplicht afhankelijk van gekozen UX
- betaalmethode kiezen

## Klanten

Doel:

- klantlijst beheren

Belangrijke functies:

- klant aanmaken
- klant bewerken
- orderhistoriek per klant zien

## Ratio templates

Doel:

- recepttemplates beheren

Belangrijke functies:

- template header aanmaken
- ratio lines beheren
- expected output definiëren

## Artikelen

Doel:

- masterdata beheren

Belangrijke functies:

- artikelen toevoegen
- categorie kiezen
- default unit bepalen
- actieve/inactieve status beheren

## Implementatierichting

## Database

De database draait in Docker via `docker compose`.

De webapp gebruikt:

- `DATABASE_URL`

Het schema wordt beheerd met gewone SQL files of een lichte migratie-aanpak.

## Serverlaag

Er komt een centrale database helper op basis van `pg`.

Bijvoorbeeld:

- `src/lib/server/db.ts`

Daarboven komen domeinservices zoals:

- `articles-data.ts`
- `batches-data.ts`
- `orders-data.ts`
- `expenses-data.ts`
- `dashboard-data.ts`

Deze services voeren SQL uit en encapsuleren businessregels.

## UI-laag

De app gebruikt één hoofdworkspace-component die views toont, naar analogie met de portfolio tracker.

Voorbeeld van mogelijke top-level state:

- `activeView = dashboard | batches | orders | expenses | customers | ratios | articles`

## Mutaties

Mutaties verlopen bij voorkeur via server actions.

Voorbeelden:

- `createBatch`
- `updateBatchStatus`
- `createOrder`
- `updateOrderStatus`
- `createExpense`
- `createCustomer`
- `createRatioTemplate`
- `createArticle`

## Kritieke transacties

De volgende acties moeten transactioneel uitgevoerd worden in Postgres:

- orderstatus wijzigen naar `afgerond`
  - order updaten
  - order_status_history toevoegen
  - revenue_entry aanmaken

- orderstatus wijzigen van `afgerond` naar niet-afgerond
  - order updaten
  - order_status_history toevoegen
  - gekoppelde revenue_entry verwijderen

- batchstatus wijzigen
  - batch updaten
  - batch_status_history toevoegen

## Aanbevolen eerste implementatiefase

Als een volgende AI of developer hierop verder bouwt, is dit de aanbevolen volgorde:

1. project scaffolden met `Next.js + TypeScript + Mantine`
2. Docker Compose voor Postgres toevoegen
3. SQL schema maken voor de 10 kern-tabellen
4. seeddata voorzien voor:
   - basisartikelen
   - finished goods
   - voorbeeld ratio template
5. centrale db helper maken met `pg`
6. domeinservices bouwen voor:
   - artikelen
   - ratio templates
   - batches
   - klanten
   - orders
   - opbrengsten
   - kosten
7. hoofdroute `/` maken met view-based workspace
8. eerst `Batches`, `Orders` en `Kosten` bouwen
9. daarna dashboard en rapportage

## Samenvatting

De app is een interne batch-gedreven business tool voor limoncello en arancello.

De kernrelaties zijn:

- een `article` beschrijft wat gekocht of verkocht wordt
- een `ratio_template` beschrijft hoe een finished good gemaakt wordt
- een `batch` produceert één finished good op basis van één ratio template
- een `order` verkoopt liters uit één batch aan één klant
- een `revenue_entry` registreert gerealiseerde opbrengst van een afgerond order
- een `expense` registreert een kost op een batch voor een artikel

De belangrijkste businessregels zijn:

- orders reserveren liters pas vanaf `in_verwerking`
- afgeronde orders krijgen een revenue entry
- terugzetten van een afgerond order verwijdert de revenue entry
- kosten hangen altijd aan een batch
- rapportage moet mogelijk zijn per batch en per artikel

Dit document is de functionele en technische bron van waarheid voor `v1`.
