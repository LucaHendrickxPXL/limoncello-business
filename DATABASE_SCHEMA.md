# Database Schema Overview

## Doel

Dit document beschrijft het voorziene `v1` datamodel voor de limoncello business webapp.

Het schema is batch-gedreven:

- batches zijn het centrale object
- orders, opbrengsten en kosten hangen aan batches
- ratio templates beschrijven hoe een batch wordt gemaakt
- artikelen vormen de gedeelde masterdata voor aankoop en verkoop

## Tabellen

V1 voorziet deze kern-tabellen:

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

- masterdata voor alle artikelen

Voorbeelden:

- `Alcohol 96%`
- `Water`
- `Suiker`
- `Citroen`
- `Fles 500ml`
- `Limoncello`
- `Arancello`

Belangrijkste kolommen:

- `id`
- `name`
- `sku`
- `category`
- `default_unit`
- `is_active`
- `created_at`
- `updated_at`

Voorgestelde constraints:

- `name` verplicht
- `category` in `ingredient | packaging | finished_good | other`
- `default_unit` in `l | g | kg | st`

## 2. ratio_templates

Doel:

- herbruikbare receptheaders

Belangrijkste kolommen:

- `id`
- `name`
- `finished_good_article_id`
- `base_alcohol_liters`
- `expected_output_liters_per_base_alcohol_liter`
- `notes`
- `is_active`
- `created_at`
- `updated_at`

Relaties:

- `finished_good_article_id -> articles.id`

Belangrijke regels:

- een template beschrijft één finished good
- `base_alcohol_liters` blijft expliciet opgeslagen

## 3. ratio_template_lines

Doel:

- ingrediëntenregels binnen een ratio template

Belangrijkste kolommen:

- `id`
- `ratio_template_id`
- `article_id`
- `quantity`
- `unit`
- `sort_order`
- `created_at`
- `updated_at`

Relaties:

- `ratio_template_id -> ratio_templates.id`
- `article_id -> articles.id`

Belangrijke regels:

- elke line hoort bij één template
- elke line verwijst naar één artikel
- `unit` wordt per line vastgezet

## 4. batches

Doel:

- hoofdentiteit van de productie- en verkoopflow

Belangrijkste kolommen:

- `id`
- `batch_number`
- `created_at`
- `started_steeping_at`
- `steep_days`
- `steeping_until`
- `ready_at`
- `status`
- `finished_good_article_id`
- `ratio_template_id`
- `ratio_template_name_snapshot`
- `alcohol_input_liters`
- `expected_output_liters`
- `actual_produced_liters`
- `unit_price_per_liter`
- `notes`
- `updated_at`

Relaties:

- `finished_good_article_id -> articles.id`
- `ratio_template_id -> ratio_templates.id`

Belangrijke regels:

- `batch_number` is uniek
- `batch_number` wordt automatisch gegenereerd bij het aanmaken van een batch
- `expected_output_liters` wordt op batchniveau opgeslagen
- `actual_produced_liters` is de effectief geproduceerde hoeveelheid
- template-info mag deels gesnapshot worden voor historische correctheid

Voorgestelde statusset:

- `draft`
- `steeping`
- `ready`
- `sold_out`
- `archived`

## 5. batch_status_history

Doel:

- audit trail van batchstatussen

Belangrijkste kolommen:

- `id`
- `batch_id`
- `from_status`
- `to_status`
- `changed_at`
- `note`

Relaties:

- `batch_id -> batches.id`

## 6. customers

Doel:

- minimale klantmasterdata

Belangrijkste kolommen:

- `id`
- `first_name`
- `last_name`
- `email`
- `phone`
- `notes`
- `created_at`
- `updated_at`

Belangrijke regels:

- `first_name` verplicht
- `last_name` verplicht

## 7. orders

Doel:

- verkooporders gekoppeld aan batch en klant

Belangrijkste kolommen:

- `id`
- `order_number`
- `customer_id`
- `batch_id`
- `ordered_liters`
- `unit_price_per_liter`
- `total_amount`
- `status`
- `ordered_at`
- `completed_at`
- `notes`
- `updated_at`

Relaties:

- `customer_id -> customers.id`
- `batch_id -> batches.id`

Belangrijke regels:

- `order_number` is uniek
- `total_amount = ordered_liters * unit_price_per_liter`
- batch mag enkel gewijzigd worden zolang status `besteld` is
- geen gedeeltelijke leveringen in `v1`

Voorgestelde statusset:

- `besteld`
- `in_verwerking`
- `klaar_voor_uitlevering`
- `afgerond`
- `geannuleerd`

## 8. order_status_history

Doel:

- audit trail van orderstatussen

Belangrijkste kolommen:

- `id`
- `order_id`
- `from_status`
- `to_status`
- `changed_at`
- `note`

Relaties:

- `order_id -> orders.id`

## 9. revenue_entries

Doel:

- expliciete registratie van gerealiseerde opbrengsten

Belangrijkste kolommen:

- `id`
- `order_id`
- `batch_id`
- `customer_id`
- `finished_good_article_id`
- `liters_sold`
- `unit_price_per_liter`
- `total_amount`
- `recognized_at`
- `notes`
- `created_at`

Relaties:

- `order_id -> orders.id`
- `batch_id -> batches.id`
- `customer_id -> customers.id`
- `finished_good_article_id -> articles.id`

Belangrijke regels:

- exact één revenue entry per afgerond order
- `order_id` moet uniek zijn
- als een order uit `afgerond` wordt gehaald, moet de gekoppelde revenue entry verwijderd worden

## 10. expenses

Doel:

- kostenregistratie per batch

Belangrijkste kolommen:

- `id`
- `batch_id`
- `article_id`
- `expense_date`
- `quantity`
- `unit`
- `amount`
- `payment_method`
- `supplier_name`
- `notes`
- `created_at`
- `updated_at`

Relaties:

- `batch_id -> batches.id`
- `article_id -> articles.id`

Voorgestelde payment method set:

- `cash`
- `overschrijving`

Belangrijke regels:

- kosten hangen altijd aan een batch
- kosten verwijzen altijd naar een artikel

## Afgeleide waarden

Deze waarden worden berekend en hoeven niet de primaire bron van waarheid te zijn.

### Sold liters

Per batch:

- som van `revenue_entries.liters_sold`

### Reserved liters

Per batch:

- som van `orders.ordered_liters`
- enkel voor orders met status:
  - `in_verwerking`
  - `klaar_voor_uitlevering`

### Available liters

Per batch:

- indien `actual_produced_liters` bekend:
  - `actual_produced_liters - sold_liters - reserved_liters`
- anders:
  - `expected_output_liters - sold_liters - reserved_liters`

### Revenue per batch

- som van `revenue_entries.total_amount`

### Costs per batch

- som van `expenses.amount`

### Margin per batch

- `revenue - costs`

## Kritieke transacties

Deze operaties moeten transactioneel uitgevoerd worden:

### Order naar `afgerond`

- update `orders.status`
- zet `completed_at`
- insert `order_status_history`
- insert `revenue_entries`

### Order uit `afgerond`

- update `orders.status`
- reset of behoud `completed_at` volgens gekozen implementatie
- insert `order_status_history`
- delete gekoppelde `revenue_entries`

### Batchstatus wijzigen

- update `batches.status`
- insert `batch_status_history`

## Rapportage-implicaties

Met dit schema moet rapportage mogelijk zijn over:

- opbrengsten per batch
- kosten per batch
- marge per batch
- liters verwacht, geproduceerd, verkocht, gereserveerd en beschikbaar
- aankopen per artikel via `expenses`
- verkopen per finished good via `revenue_entries`

## Referentie

Voor de volledige functionele context:

- [docs/v1-spec.md](./docs/v1-spec.md)
