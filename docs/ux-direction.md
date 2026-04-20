# UX Direction

## Doel

Dit document beschrijft hoe de limoncello business webapp moet aanvoelen en hoe de belangrijkste schermen opgebouwd moeten worden.

Het doel is expliciet:

- geen developer-tool gevoel
- geen generieke admin CRUD-ervaring
- wel een rustige, operationele werkplek
- wel duidelijke dagelijkse workflows

Dit document vertaalt de product- en datamodelkeuzes naar schermgedrag, layout en informatieprioriteit.

## Algemene UX-principes

De app moet aanvoelen als een interne business workspace voor iemand die batches maakt, orders opvolgt en kosten registreert.

Niet als:

- een databasebeheerder
- een ERP met twintig modules
- een technisch dashboard voor developers

Wel als:

- een rustige operationele cockpit
- een werkplek waar de volgende actie altijd duidelijk is
- een tool die helpt beslissen wat nu aandacht nodig heeft

## Belangrijkste ontwerpprincipes

### 1. Werkflow Eerst

De UI vertrekt vanuit dagelijkse taken:

- batch aanmaken
- order opvolgen
- kost registreren
- beschikbare liters controleren
- zien wat bijna klaar is

Niet vanuit:

- tabellen
- technische entiteiten
- database-relaties

### 2. Home Is Een Command Center

`Home` is het primaire startpunt.

`Home` moet niet “alles tonen”, maar moet antwoord geven op:

- wat moet ik nu doen
- waar zit de risicozone
- welke acties zijn het meest relevant

### 3. Elke View Heeft Eén Duidelijke Taak

Een scherm mag niet tegelijk:

- administratie
- analyse
- configuratie
- historiek

willen oplossen zonder hiërarchie.

Per view moet duidelijk zijn:

- wat het primaire doel is
- wat het hoofdwerkvlak is
- wat de secundaire info is

### 4. Rust Boven Volledigheid

Niet alles hoeft meteen zichtbaar te zijn.

We kiezen voor:

- compacte kaarten
- duidelijke secties
- sobere kleuraccenten
- korte statustaal
- weinig visuele ruis

### 4b. Geen Card-Subtitels Onder Titels

Kaarten in deze app gebruiken een duidelijke titel, maar standaard geen extra subtitel direct onder die titel.

Dus niet:

- een titel met daaronder nog een verklarende zin in de header van dezelfde kaart

Wel:

- een korte, duidelijke kaarttitel
- extra context in de inhoud van de kaart
- extra context in een empty state, infolabel, alert of actiezone wanneer dat echt nodig is

Waarom:

- het houdt de interface rustiger
- het maakt kaarten sneller scanbaar
- het voorkomt dat elke kaart opnieuw dezelfde UX-uitleg herhaalt

Afspraak voor toekomstige schermen:

- voeg geen subtitel toe onder de titel van `SectionCard`-achtige kaarten
- als uitleg nodig is, zet die in de body van de kaart of in contextuele hulp, niet in de header

### 5. Mobile Mag Anders Zijn

Mobile is geen verkleinde desktop.

Op kleinere schermen:

- mag detail als aparte focuslaag openen
- mag `Home` als launcher werken
- gaan cards voor op grote tabellen

## Visuele Taal

De app gebruikt een beperkte, zakelijke kleurtaal.

Geen zwart als merkaccent en geen losse felle kleuren per scherm.

Wel:

- `petrol` als primaire kleur
- `sage` als secundaire kleur
- neutrale oppervlakken voor rust
- semantische statuskleuren alleen waar ze echt betekenis dragen

### Kleurensysteem

Primaire kleur:

- `#0F4C5C` (`petrol`)

Secundaire kleur:

- `#7AA6A1` (`sage`)

Gebruik:

- primaire kleur voor hoofdacties, actieve navigatie, focuspunten en belangrijke bevestigde staten
- secundaire kleur voor ondersteunende acties, zachte highlights, geselecteerde kaarten en subtiele interface-accenten
- neutrale wit- en grijstinten blijven de basis voor achtergronden, panelen en tabellen

Niet doen:

- elk domein een eigen accentkleur geven
- warme marketingkleuren gebruiken voor operationele knoppen
- zwart gebruiken als primaire interactieve kleur

### Iconen

Iconen ondersteunen begrip, maar mogen het scherm niet druk maken.

De app gebruikt daarom eenvoudige, herkenbare outline-iconen in een consistente stijl.

Richtlijnen:

- gebruik iconen alleen wanneer ze een actie of inhoud sneller herkenbaar maken
- kies herkenbare iconen voor gewone gebruikers, niet voor developers
- gebruik icon-only acties alleen voor conventionele patronen zoals `terug`, `verwijderen`, `sluiten`
- geef icon-only knoppen altijd een duidelijke `aria-label`
- combineer geen verschillende iconstijlen of decoratieve iconsets door elkaar
- houd iconen compact: meestal `14-16px` in acties en `18-20px` in headers of lege staten

Concreet voor deze app:

- de back-actie in batchdetail is een icoon zonder tekst, omdat dat patroon algemeen herkenbaar is naast een titel
- destructieve acties zoals verwijderen blijven rood en krijgen een duidelijke vuilbak-icoon
- merk- en navigatie-iconen krijgen zachte `petrol` of `sage` accenten, niet willekeurige kleuren

Zo blijft de app professioneler, rustiger en consequenter aanvoelen.

## Informatiearchitectuur

De top-level views zijn:

- `Home`
- `Batches`
- `Orders`
- `Kosten`
- `Klanten`
- `Ratio templates`
- `Artikelen`
- `Dashboard`

De primaire werkviews zijn:

- `Home`
- `Batches`
- `Orders`
- `Kosten`

De secundaire beheer- of ondersteunende views zijn:

- `Klanten`
- `Ratio templates`
- `Artikelen`
- `Dashboard`

Dat betekent:

- de primaire navigatie moet eerst draaien rond operationele taken
- ondersteunende masterdata mag zichtbaar zijn, maar niet dominant

## Home

## Rol Van Home

`Home` is de operationele cockpit.

Dit is het scherm dat je opent om snel te begrijpen:

- wat er loopt
- wat bijna klaar is
- wat aandacht nodig heeft
- wat de volgende logische actie is

## Desktop Layout

Desktop `Home` gebruikt een driedelige indeling:

- `Actions`
- `Now`
- `Attention`

### Actions

Links staan snelle acties.

Voorbeelden:

- `Nieuwe batch`
- `Nieuw order`
- `Nieuwe kost`
- `Nieuwe klant`

Eventueel later:

- `Nieuwe ratio template`
- `Nieuw artikel`

Deze zone moet:

- compact zijn
- direct bruikbaar zijn
- duidelijk de primaire taken tonen

### Now

In het midden staat de actuele werking.

Voorbeelden:

- batches die nu aan het trekken zijn
- batches die klaar zijn
- orders in verwerking
- orders klaar voor uitlevering
- recente afgeronde verkopen

Deze zone is geen analytics dashboard, maar een live operationeel overzicht.

### Attention

Rechts staan uitzonderingen of aandachtspunten.

Voorbeelden:

- batch heeft weinig beschikbaar volume
- batch heeft nog geen `actual produced liters`
- order wacht al lang op afronding
- batchprijs ontbreekt
- kosten op batch zijn nog leeg of onvolledig

Deze zone is essentieel om te vermijden dat je iets vergeet.

## Mobile Layout

Op mobile is `Home` een compacte launcher met action cards en samenvattende kaarten.

De prioriteit op mobile is:

- snel starten
- snel scannen
- snel doorklikken

Dus:

- grote tabellen vermijden
- lijstjes kort houden
- kaarten gebruiken

## Batches

## Rol Van De View

`Batches` is het belangrijkste operationele scherm naast `Home`.

Hier beheer je:

- welke batches bestaan
- in welke status ze zitten
- hoeveel volume ze hebben
- welke orders, kosten en opbrengsten eraan hangen

## Desktop Layout

`Batches` volgt een list-detail patroon.

### Linker Pane

Links staat de batchlijst.

Elke rij of kaart moet in één oogopslag tonen:

- batchnummer
- geproduceerd artikel
- status
- created date
- expected liters
- available liters

Optioneel compact extra:

- `ready in 3 days`
- `sold out`
- `attention`

Belangrijk:

- de lijst moet scanbaar zijn
- geen overvolle tabellijst als standaard
- liever rustige, compacte rijen of cards

### Rechter Pane

Rechts staat het batchdetail.

Het detailpaneel toont bij voorkeur in vaste secties:

- kerninfo
- productie
- verkoopstatus
- kosten en marge
- gekoppelde orders
- recente kosten
- opbrengsten

### Detailinhoud

In het batchdetail moeten deze zaken duidelijk zichtbaar zijn:

- batchnummer
- artikel
- status
- ratio template
- steeping periode
- expected output
- actual produced liters
- sold liters
- reserved liters
- available liters
- unit price per liter
- totale opbrengst
- totale kosten
- marge

### Acties In Batchdetail

Belangrijke acties:

- status wijzigen
- actual produced liters invullen
- nieuw order op deze batch
- nieuwe kost op deze batch

De acties moeten dicht bij de context staan, niet verstopt in een generiek menu.

## Mobile Gedrag

Op mobile opent batchdetail best als aparte focuslaag.

Dat betekent:

- eerst een scanbare lijst
- daarna full-focus detail

Zo blijft het scherm bruikbaar zonder miniatuurpanelen.

## Orders

## Rol Van De View

`Orders` is de opvolgingsworkspace voor verkoop.

De kernvraag van deze view is:

- welke orders lopen er
- wat is hun status
- welke batch is eraan gekoppeld
- wat vraagt nu actie

## Desktop Layout

`Orders` gebruikt een workspace met:

- links invoer en filters
- rechts orderlijst of detail

### Linker Pane

Links staat:

- knop `Nieuw order`
- eenvoudige filters
- eventueel statusfilter
- eventueel klant- of batchfilter

Niet te veel filters in `v1`.
De view moet operationeel blijven, niet analytisch.

### Rechter Pane

Rechts staat de orderlijst.

Elke orderrij toont idealiter:

- ordernummer
- klantnaam
- batchnummer
- liters
- bedrag
- status
- laatste relevante datum

Orders moeten visueel makkelijk scanbaar zijn op status.

### Detail Of Edit

Wanneer een order geselecteerd wordt, moet je snel zien:

- gekoppelde klant
- gekoppelde batch
- beschikbare batchliters
- ordervolume
- prijs per liter
- bedrag
- historiek van statussen

### Kritieke UX-punten

Bij statuswijziging moet de gebruiker begrijpen wat er gebeurt:

- `in verwerking` reserveert liters
- `afgerond` maakt opbrengst
- terugzetten uit `afgerond` verwijdert opbrengst

Dit hoeft geen technische waarschuwing te zijn, maar wel duidelijke context.

## Mobile Gedrag

Op mobile werken ordercards beter dan een grote tabel.

Een orderkaart toont:

- klant
- batch
- liters
- bedrag
- status

Doorklikken opent detail als focuslaag.

## Kosten

## Rol Van De View

`Kosten` moet snel en praktisch aanvoelen.

Dit mag niet voelen als boekhoudsoftware.

De kernflow is:

- batch kiezen
- artikel kiezen
- bedrag ingeven
- betaalmethode kiezen
- opslaan

## Desktop Layout

Links:

- snelle invoer voor een nieuwe kost

Rechts:

- recente kosten
- of kosten van geselecteerde batch

### Inputvorm

De invoer moet compact zijn.

Velden:

- batch
- artikel
- datum
- hoeveelheid
- eenheid
- bedrag
- betaalmethode
- leverancier
- notitie

Niet alle velden hoeven even prominent.

### Overzicht

Recente kosten moeten scanbaar zijn op:

- batch
- artikel
- bedrag
- betaalmethode
- datum

## Mobile Gedrag

Ook hier werken compacte cards of eenvoudige lijstitems beter dan een brede tabel.

## Klanten

## Rol Van De View

`Klanten` is ondersteunend.

De view moet sober blijven.

Geen CRM-gevoel.

De belangrijkste taken zijn:

- klant aanmaken
- klantgegevens aanpassen
- klantorders bekijken

## Layout

Eenvoudige list-detail is voldoende.

Links:

- klantenlijst

Rechts:

- kerngegevens
- recente orders
- notities

## Ratio Templates

## Rol Van De View

`Ratio templates` is een beheerweergave voor receptstructuren.

De view hoeft niet zwaar te zijn, maar moet wel duidelijk maken:

- welk finished good dit produceert
- wat de verwachte output is
- welke lines in het recept zitten

## Layout

Links:

- lijst van templates

Rechts:

- headerdetail
- ratio lines

De lines moeten leesbaar zijn als een recept en niet als ruwe database-records.

Bijvoorbeeld liever:

- `Alcohol 96% - 1 L`
- `Water - 2.2 L`
- `Suiker - 700 g`

dan een kale technische grid zonder hiërarchie.

## Artikelen

## Rol Van De View

`Artikelen` is masterdatabeheer.

Deze view moet eenvoudig blijven en mag niet concurreren met de primaire operationele schermen.

## Layout

Een sobere beheerweergave is hier oké, zolang:

- de taal menselijk blijft
- categorie en eenheid duidelijk zijn
- het scherm niet over-ontworpen voelt

## Dashboard

## Rol Van De View

`Dashboard` is niet hetzelfde als `Home`.

Waar `Home` focust op directe actie, focust `Dashboard` op samenvatting en analyse.

Voorbeelden:

- omzet per periode
- kosten per periode
- marge per batch
- verkoop per artikel
- batchprestaties

Dit scherm mag analytischer zijn, maar moet nog steeds rustig blijven.

## Navigatie-aanpak

De navigatie moet de dagelijkse flow ondersteunen.

### Desktop

Voorgestelde hoofdnavigatie:

- `Home`
- `Batches`
- `Orders`
- `Kosten`
- `Dashboard`

Secundair of minder prominent:

- `Klanten`
- `Ratio templates`
- `Artikelen`

Dat kan bijvoorbeeld via:

- een secundaire sectie in de sidebar
- of via een compacte “beheer”-groep

Zo voelt de app minder als een systeem voor databeheer en meer als een werktool.

### Mobile

Mobile navigatie blijft beperkt.

Voorkeur:

- `Home` als anker
- andere acties via launcher cards of contextsprongen

Niet te veel bottom-nav items.

## Taalgebruik

De hele app gebruikt operationele taal.

Goede labels:

- `Nieuwe batch`
- `Beschikbaar volume`
- `In verwerking`
- `Klaar voor uitlevering`
- `Voeg kost toe`
- `Recente verkopen`

Te vermijden labels:

- `Entity`
- `Record`
- `Mutation`
- `Status transition`
- `Resource management`

## Interactieprincipes

### Duidelijke Primaire CTA

Elk scherm heeft idealiter één duidelijke primaire actie.

Voorbeelden:

- `Batches` -> `Nieuwe batch`
- `Orders` -> `Nieuw order`
- `Kosten` -> `Nieuwe kost`

### Contextsprongen

Gebruikers moeten logisch kunnen doorspringen:

- van batchdetail naar nieuw order op die batch
- van batchdetail naar kost op die batch
- van orderdetail naar batchdetail
- van klantdetail naar orders van die klant

### Status Visueel Rustig Maar Duidelijk

Status mag kleur krijgen, maar moet niet schreeuwerig zijn.

Voorkeur:

- rustige badges
- beperkte kleurset
- duidelijke woorden

## UX-valkuilen Die Vermeden Moeten Worden

- te veel tabelschermen
- te veel filters ineens
- ruwe database-termen in de UI
- te veel info boven de vouw
- desktop layouts die op mobile gewoon in elkaar schuiven
- schermen die voelen als generieke admin panels
- acties die verstopt zitten in dropdowns terwijl ze kernacties zijn

## Samenvatting

De app moet voelen als:

- een rustige werkplek
- een operationele cockpit
- een tool voor een zaakvoerder of operator

Niet als:

- een admin dashboard
- een boekhoudpakket
- een developer backoffice

De belangrijkste UX-keuzes zijn:

- `Home` als command center
- `Actions / Now / Attention` als kernindeling voor desktop home
- list-detail voor primaire operationele schermen
- mobile als launcher en focuslaag
- operationele taal boven technische taal
