import pg from "pg";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Client } = pg;

loadLocalEnv();

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;

  if (!value) {
    throw new Error("DATABASE_URL is required. Copy .env.example to .env.local and fill it in.");
  }

  return value;
}

function round(value, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function splitVolume(total, count) {
  if (count <= 0 || total <= 0) {
    return [];
  }

  const weights = [1.18, 0.92, 1.24, 0.88, 1.08, 0.96];
  const selectedWeights = Array.from({ length: count }, (_, index) => weights[index % weights.length]);
  const weightSum = selectedWeights.reduce((sum, weight) => sum + weight, 0);
  const values = selectedWeights.map((weight) => round((total * weight) / weightSum, 1));
  const currentSum = round(values.reduce((sum, value) => sum + value, 0), 1);
  values[values.length - 1] = round(values[values.length - 1] + (total - currentSum), 1);

  return values;
}

async function ensureArticle(client, input) {
  const existing = await client.query(
    `select id from articles where lower(name) = lower($1) limit 1`,
    [input.name],
  );

  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const created = await client.query(
    `insert into articles (name, sku, category, default_unit)
     values ($1, $2, $3, $4)
     returning id`,
    [input.name, input.sku ?? null, input.category, input.defaultUnit],
  );

  return created.rows[0].id;
}

async function ensureCustomer(client, input) {
  const existing = await client.query(
    `select id from customers
     where lower(first_name) = lower($1)
       and lower(last_name) = lower($2)
     limit 1`,
    [input.firstName, input.lastName],
  );

  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const created = await client.query(
    `insert into customers (first_name, last_name, email, phone, notes)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [input.firstName, input.lastName, input.email ?? null, input.phone ?? null, input.notes ?? null],
  );

  return created.rows[0].id;
}

async function ensureRatioTemplate(client, input) {
  const existing = await client.query(
    `select id from ratio_templates where lower(name) = lower($1) limit 1`,
    [input.name],
  );

  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const created = await client.query(
    `insert into ratio_templates (
       name,
       finished_good_article_id,
       base_alcohol_liters,
       expected_output_liters_per_base_alcohol_liter,
       notes
     )
     values ($1, $2, $3, $4, $5)
     returning id`,
    [
      input.name,
      input.finishedGoodArticleId,
      input.baseAlcoholLiters,
      input.expectedOutput,
      input.notes ?? null,
    ],
  );

  return created.rows[0].id;
}

async function ensureRatioLines(client, ratioTemplateId, lines) {
  const existing = await client.query(
    `select count(*)::int as count from ratio_template_lines where ratio_template_id = $1`,
    [ratioTemplateId],
  );

  if ((existing.rows[0]?.count ?? 0) > 0) {
    return;
  }

  for (const line of lines) {
    await client.query(
      `insert into ratio_template_lines (
         ratio_template_id,
         article_id,
         quantity,
         unit,
         sort_order
       )
       values ($1, $2, $3, $4, $5)`,
      [ratioTemplateId, line.articleId, line.quantity, line.unit, line.sortOrder],
    );
  }
}

async function ensureBatch(client, input) {
  const existing = await client.query(
    `select id from batches where lower(batch_number) = lower($1) limit 1`,
    [input.batchNumber],
  );

  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const created = await client.query(
    `insert into batches (
       batch_number,
       started_steeping_at,
       steep_days,
       steeping_until,
       ready_at,
       status,
       finished_good_article_id,
       ratio_template_id,
       ratio_template_name_snapshot,
       alcohol_input_liters,
       expected_output_liters,
       actual_produced_liters,
       unit_price_per_liter,
       notes
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     returning id`,
    [
      input.batchNumber,
      input.startedSteepingAt,
      input.steepDays,
      input.steepingUntil,
      input.readyAt ?? null,
      input.status,
      input.finishedGoodArticleId,
      input.ratioTemplateId,
      input.ratioTemplateNameSnapshot,
      input.alcoholInputLiters,
      input.expectedOutputLiters,
      input.actualProducedLiters ?? null,
      input.unitPricePerLiter,
      input.notes ?? null,
    ],
  );

  await client.query(
    `insert into batch_status_history (batch_id, from_status, to_status, note)
     values ($1, null, $2, $3)`,
    [created.rows[0].id, input.status, "Dev seed"],
  );

  return created.rows[0].id;
}

async function ensureOrder(client, input) {
  const existing = await client.query(
    `select id from orders where lower(order_number) = lower($1) limit 1`,
    [input.orderNumber],
  );

  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const created = await client.query(
    `insert into orders (
       order_number,
       customer_id,
       batch_id,
       ordered_liters,
       unit_price_per_liter,
       status,
       ordered_at,
       completed_at,
       notes
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning id`,
    [
      input.orderNumber,
      input.customerId,
      input.batchId,
      input.orderedLiters,
      input.unitPricePerLiter,
      input.status,
      input.orderedAt,
      input.completedAt ?? null,
      input.notes ?? null,
    ],
  );

  await client.query(
    `insert into order_status_history (order_id, from_status, to_status, note)
     values ($1, null, $2, $3)`,
    [created.rows[0].id, input.status, "Dev seed"],
  );

  if (input.status === "afgerond") {
    await client.query(
      `insert into revenue_entries (
         order_id,
         batch_id,
         customer_id,
         finished_good_article_id,
         liters_sold,
         unit_price_per_liter,
         recognized_at,
         notes
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        created.rows[0].id,
        input.batchId,
        input.customerId,
        input.finishedGoodArticleId,
        input.orderedLiters,
        input.unitPricePerLiter,
        input.completedAt ?? input.orderedAt,
        "Dev seed",
      ],
    );
  }

  return created.rows[0].id;
}

async function ensureExpense(client, input) {
  const existing = await client.query(
    `select id
     from expenses
     where batch_id = $1
       and article_id = $2
       and amount = $3
       and expense_date = $4
     limit 1`,
    [input.batchId, input.articleId, input.amount, input.expenseDate],
  );

  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const created = await client.query(
    `insert into expenses (
       batch_id,
       article_id,
       expense_date,
       quantity,
       unit,
       amount,
       payment_method,
       supplier_name,
       notes
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning id`,
    [
      input.batchId,
      input.articleId,
      input.expenseDate,
      input.quantity ?? null,
      input.unit ?? null,
      input.amount,
      input.paymentMethod,
      input.supplierName ?? null,
      input.notes ?? null,
    ],
  );

  return created.rows[0].id;
}

function buildBatchBlueprints() {
  return [
    {
      batchNumber: "LIM-2026-001",
      templateKey: "classic",
      startedSteepingAt: "2026-01-04",
      steepDays: 14,
      status: "archived",
      alcoholInputLiters: 4,
      expectedOutputLiters: 11.2,
      actualProducedLiters: 10.9,
      unitPricePerLiter: 23.5,
      notes: "Nieuwjaarsreeks voor wintermarkten.",
    },
    {
      batchNumber: "LIM-2026-002",
      templateKey: "intense",
      startedSteepingAt: "2026-01-20",
      steepDays: 16,
      status: "sold_out",
      alcoholInputLiters: 5,
      expectedOutputLiters: 13.5,
      actualProducedLiters: 13.2,
      unitPricePerLiter: 24,
      notes: "Intenser citrusprofiel voor horeca.",
    },
    {
      batchNumber: "LIM-2026-003",
      templateKey: "classic",
      startedSteepingAt: "2026-02-06",
      steepDays: 14,
      status: "archived",
      alcoholInputLiters: 6,
      expectedOutputLiters: 16.8,
      actualProducedLiters: 16.2,
      unitPricePerLiter: 24.2,
      notes: "Grote valentijnsproductie voor retail.",
    },
    {
      batchNumber: "LIM-2026-004",
      templateKey: "classic",
      startedSteepingAt: "2026-02-24",
      steepDays: 14,
      status: "ready",
      alcoholInputLiters: 4.5,
      expectedOutputLiters: 12.6,
      actualProducedLiters: 12.3,
      unitPricePerLiter: 24.8,
      notes: "Voorjaarsbatch met hoge helderheid.",
    },
    {
      batchNumber: "LIM-2026-005",
      templateKey: "intense",
      startedSteepingAt: "2026-03-08",
      steepDays: 16,
      status: "ready",
      alcoholInputLiters: 3.5,
      expectedOutputLiters: 9.45,
      actualProducedLiters: 9.3,
      unitPricePerLiter: 25.1,
      notes: "Speciaal voor tasting packs.",
    },
    {
      batchNumber: "LIM-2026-006",
      templateKey: "classic",
      startedSteepingAt: "2026-04-02",
      steepDays: 14,
      status: "steeping",
      alcoholInputLiters: 5,
      expectedOutputLiters: 14,
      actualProducedLiters: null,
      unitPricePerLiter: 25.3,
      notes: "Lentebatch die nog aan het trekken is.",
    },
    {
      batchNumber: "LIM-2026-007",
      templateKey: "intense",
      startedSteepingAt: "2026-04-16",
      steepDays: 16,
      status: "draft",
      alcoholInputLiters: 4,
      expectedOutputLiters: 10.8,
      actualProducedLiters: null,
      unitPricePerLiter: 25.6,
      notes: "Conceptbatch voor extra intense reeks.",
    },
    {
      batchNumber: "ARA-2026-001",
      templateKey: "soft_arancello",
      startedSteepingAt: "2026-01-12",
      steepDays: 18,
      status: "archived",
      alcoholInputLiters: 4,
      expectedOutputLiters: 11.6,
      actualProducedLiters: 11.3,
      unitPricePerLiter: 22.8,
      notes: "Winterbatch voor brunchconcepten.",
    },
    {
      batchNumber: "ARA-2026-002",
      templateKey: "soft_arancello",
      startedSteepingAt: "2026-02-02",
      steepDays: 18,
      status: "sold_out",
      alcoholInputLiters: 4.5,
      expectedOutputLiters: 13.05,
      actualProducedLiters: 12.8,
      unitPricePerLiter: 23.2,
      notes: "Snelle doorloop via pop-up events.",
    },
    {
      batchNumber: "ARA-2026-003",
      templateKey: "soft_arancello",
      startedSteepingAt: "2026-03-01",
      steepDays: 18,
      status: "ready",
      alcoholInputLiters: 3.5,
      expectedOutputLiters: 10.15,
      actualProducedLiters: 9.9,
      unitPricePerLiter: 23.4,
      notes: "Rustige batch voor mix van retail en horeca.",
    },
    {
      batchNumber: "ARA-2026-004",
      templateKey: "soft_arancello",
      startedSteepingAt: "2026-04-10",
      steepDays: 18,
      status: "steeping",
      alcoholInputLiters: 4,
      expectedOutputLiters: 11.6,
      actualProducedLiters: null,
      unitPricePerLiter: 23.7,
      notes: "Verse citrus voor paasverkoop.",
    },
    {
      batchNumber: "MAN-2026-001",
      templateKey: "frisse_mandarino",
      startedSteepingAt: "2026-02-18",
      steepDays: 15,
      status: "ready",
      alcoholInputLiters: 3,
      expectedOutputLiters: 8.7,
      actualProducedLiters: 8.4,
      unitPricePerLiter: 24.4,
      notes: "Kleinere reeks voor cadeaupakketten.",
    },
    {
      batchNumber: "MAN-2026-002",
      templateKey: "frisse_mandarino",
      startedSteepingAt: "2026-03-05",
      steepDays: 15,
      status: "sold_out",
      alcoholInputLiters: 3.5,
      expectedOutputLiters: 10.15,
      actualProducedLiters: 9.8,
      unitPricePerLiter: 24.9,
      notes: "Volledig opgegaan in weekendboxen.",
    },
    {
      batchNumber: "MAN-2026-003",
      templateKey: "frisse_mandarino",
      startedSteepingAt: "2026-04-08",
      steepDays: 15,
      status: "steeping",
      alcoholInputLiters: 3,
      expectedOutputLiters: 8.7,
      actualProducedLiters: null,
      unitPricePerLiter: 25.1,
      notes: "Paasbatch in voorbereiding.",
    },
    {
      batchNumber: "MAN-2026-004",
      templateKey: "frisse_mandarino",
      startedSteepingAt: "2026-04-18",
      steepDays: 15,
      status: "draft",
      alcoholInputLiters: 2.5,
      expectedOutputLiters: 7.25,
      actualProducedLiters: null,
      unitPricePerLiter: 25.4,
      notes: "Concept voor zomerstarter pack.",
    },
  ];
}

function buildExpensesForBatch(batch, catalog, batchId) {
  const producedVolume = batch.actualProducedLiters ?? batch.expectedOutputLiters;
  const bottleCount = Math.ceil(producedVolume * 2);
  const labelCount = bottleCount;
  const transportBoxCount = Math.max(1, Math.ceil(bottleCount / 6));
  const giftBoxCount = Math.max(0, Math.floor(bottleCount * 0.22));
  const citrusCount = Math.ceil(batch.alcoholInputLiters * catalog.citrusUnitsPerAlcoholLiter);
  const sugarGrams = Math.ceil(batch.alcoholInputLiters * catalog.sugarGramsPerAlcoholLiter);
  const readyReference = batch.readyAt ?? addDays(batch.steepingUntil, 1);

  return [
    {
      batchId,
      articleId: catalog.alcoholArticleId,
      expenseDate: batch.startedSteepingAt,
      quantity: batch.alcoholInputLiters,
      unit: "l",
      amount: round(batch.alcoholInputLiters * catalog.alcoholCostPerLiter),
      paymentMethod: "overschrijving",
      supplierName: "Distillaat Partners",
      notes: `Alcoholvoorraad voor ${batch.batchNumber}`,
    },
    {
      batchId,
      articleId: catalog.sugarArticleId,
      expenseDate: addDays(batch.startedSteepingAt, 1),
      quantity: sugarGrams,
      unit: "g",
      amount: round(sugarGrams * catalog.sugarCostPerGram),
      paymentMethod: "overschrijving",
      supplierName: "Suikerfabriek Noord",
      notes: `Suiker voor ${batch.batchNumber}`,
    },
    {
      batchId,
      articleId: catalog.citrusArticleId,
      expenseDate: addDays(batch.startedSteepingAt, 2),
      quantity: citrusCount,
      unit: "st",
      amount: round(citrusCount * catalog.citrusUnitPrice),
      paymentMethod: "cash",
      supplierName: catalog.citrusSupplier,
      notes: `Verse citrus voor ${batch.batchNumber}`,
    },
    {
      batchId,
      articleId: catalog.bottleArticleId,
      expenseDate: readyReference,
      quantity: bottleCount,
      unit: "st",
      amount: round(bottleCount * 0.84),
      paymentMethod: "overschrijving",
      supplierName: "Bottle House",
      notes: `Flessen voor ${batch.batchNumber}`,
    },
    {
      batchId,
      articleId: catalog.labelArticleId,
      expenseDate: addDays(readyReference, 1),
      quantity: labelCount,
      unit: "st",
      amount: round(labelCount * 0.19),
      paymentMethod: "overschrijving",
      supplierName: "Print Studio",
      notes: `Etiketten voor ${batch.batchNumber}`,
    },
    {
      batchId,
      articleId: catalog.transportBoxArticleId,
      expenseDate: addDays(readyReference, 2),
      quantity: transportBoxCount,
      unit: "st",
      amount: round(transportBoxCount * 1.95),
      paymentMethod: "cash",
      supplierName: "Pack & Ship",
      notes: `Transportdozen voor ${batch.batchNumber}`,
    },
    {
      batchId,
      articleId: catalog.giftBoxArticleId,
      expenseDate: addDays(readyReference, 3),
      quantity: giftBoxCount,
      unit: "st",
      amount: round(giftBoxCount * 1.45),
      paymentMethod: "cash",
      supplierName: "GiftBox Atelier",
      notes: `Giftboxes voor ${batch.batchNumber}`,
    },
  ];
}

function buildOrdersForBatch(batch, batchId, customerRecords, finishedGoodArticleId, nextOrderNumber) {
  const orders = [];
  const readyReference = batch.readyAt ?? addDays(batch.steepingUntil, 1);
  const marketableVolume = batch.actualProducedLiters ?? batch.expectedOutputLiters;
  let customerCursor = 0;

  function nextCustomer() {
    const customer = customerRecords[customerCursor % customerRecords.length];
    customerCursor += 1;
    return customer;
  }

  function pushOrder(input) {
    const customer = nextCustomer();
    orders.push({
      orderNumber: nextOrderNumber(),
      customerId: customer.id,
      batchId,
      finishedGoodArticleId,
      orderedLiters: input.orderedLiters,
      unitPricePerLiter: batch.unitPricePerLiter,
      status: input.status,
      orderedAt: input.orderedAt,
      completedAt: input.completedAt ?? null,
      notes: input.notes,
    });
  }

  if (batch.status === "archived") {
    for (const [index, liters] of splitVolume(round(marketableVolume * 0.9, 1), 4).entries()) {
      pushOrder({
        orderedLiters: liters,
        status: "afgerond",
        orderedAt: addDays(readyReference, 2 + index * 4),
        completedAt: addDays(readyReference, 3 + index * 4),
        notes: "Historisch order uit een eerdere verkoopperiode.",
      });
    }

    pushOrder({
      orderedLiters: 0.8,
      status: "geannuleerd",
      orderedAt: addDays(readyReference, 22),
      notes: "Geannuleerd door laattijdige bevestiging.",
    });
  }

  if (batch.status === "sold_out") {
    for (const [index, liters] of splitVolume(round(marketableVolume * 0.97, 1), 5).entries()) {
      pushOrder({
        orderedLiters: liters,
        status: "afgerond",
        orderedAt: addDays(readyReference, 1 + index * 3),
        completedAt: addDays(readyReference, 2 + index * 3),
        notes: "Volledig geleverd en afgerekend.",
      });
    }

    pushOrder({
      orderedLiters: 0.7,
      status: "geannuleerd",
      orderedAt: addDays(readyReference, 18),
      notes: "Vraag viel weg na reservering.",
    });
  }

  if (batch.status === "ready") {
    for (const [index, liters] of splitVolume(round(marketableVolume * 0.48, 1), 3).entries()) {
      pushOrder({
        orderedLiters: liters,
        status: "afgerond",
        orderedAt: addDays(readyReference, 1 + index * 5),
        completedAt: addDays(readyReference, 2 + index * 5),
        notes: "Reeds uitgeleverd.",
      });
    }

    const activeVolumes = splitVolume(round(marketableVolume * 0.2, 1), 2);

    pushOrder({
      orderedLiters: activeVolumes[0] ?? 1.2,
      status: "in_verwerking",
      orderedAt: addDays(readyReference, 18),
      notes: "Wordt momenteel gebotteld en klaargezet.",
    });
    pushOrder({
      orderedLiters: activeVolumes[1] ?? 1,
      status: "klaar_voor_uitlevering",
      orderedAt: addDays(readyReference, 21),
      notes: "Klaar voor afhaling of levering.",
    });
    pushOrder({
      orderedLiters: round(Math.max(0.8, marketableVolume * 0.08), 1),
      status: "besteld",
      orderedAt: addDays(readyReference, 24),
      notes: "Nieuwe bestelling wacht op planning.",
    });
  }

  if (batch.status === "steeping") {
    pushOrder({
      orderedLiters: round(Math.max(1, marketableVolume * 0.15), 1),
      status: "besteld",
      orderedAt: addDays(batch.startedSteepingAt, 6),
      notes: "Voorbestelling tijdens steeping.",
    });
    pushOrder({
      orderedLiters: round(Math.max(0.7, marketableVolume * 0.1), 1),
      status: "besteld",
      orderedAt: addDays(batch.startedSteepingAt, 11),
      notes: "Tweede reservatie voor deze lopende batch.",
    });
  }

  if (batch.status === "draft") {
    pushOrder({
      orderedLiters: round(Math.max(0.8, marketableVolume * 0.12), 1),
      status: "geannuleerd",
      orderedAt: addDays(batch.startedSteepingAt, 3),
      notes: "Conceptbatch nog niet bevestigd voor productie.",
    });
  }

  return orders;
}

async function main() {
  const client = new Client({
    connectionString: getDatabaseUrl(),
  });

  await client.connect();

  try {
    await client.query("begin");

    const alcoholId = await ensureArticle(client, {
      name: "Alcohol 96%",
      sku: "ING-ALC-96",
      category: "ingredient",
      defaultUnit: "l",
    });
    const waterId = await ensureArticle(client, {
      name: "Water",
      sku: "ING-WATER",
      category: "ingredient",
      defaultUnit: "l",
    });
    const sugarId = await ensureArticle(client, {
      name: "Suiker",
      sku: "ING-SUGAR",
      category: "ingredient",
      defaultUnit: "g",
    });
    const lemonId = await ensureArticle(client, {
      name: "Citroen",
      sku: "ING-LEMON",
      category: "ingredient",
      defaultUnit: "st",
    });
    const orangeId = await ensureArticle(client, {
      name: "Appelsien",
      sku: "ING-ORANGE",
      category: "ingredient",
      defaultUnit: "st",
    });
    const mandarinId = await ensureArticle(client, {
      name: "Mandarijn",
      sku: "ING-MANDARIN",
      category: "ingredient",
      defaultUnit: "st",
    });
    const bottleId = await ensureArticle(client, {
      name: "Fles 500ml",
      sku: "PACK-BOTTLE-500",
      category: "packaging",
      defaultUnit: "st",
    });
    const labelId = await ensureArticle(client, {
      name: "Etiket",
      sku: "PACK-LABEL",
      category: "packaging",
      defaultUnit: "st",
    });
    const transportBoxId = await ensureArticle(client, {
      name: "Transportdoos 6 flessen",
      sku: "PACK-BOX-6",
      category: "packaging",
      defaultUnit: "st",
    });
    const giftBoxId = await ensureArticle(client, {
      name: "Giftbox",
      sku: "PACK-GIFTBOX",
      category: "packaging",
      defaultUnit: "st",
    });
    const limoncelloId = await ensureArticle(client, {
      name: "Limoncello",
      sku: "FG-LIMONCELLO",
      category: "finished_good",
      defaultUnit: "l",
    });
    const arancelloId = await ensureArticle(client, {
      name: "Arancello",
      sku: "FG-ARANCELLO",
      category: "finished_good",
      defaultUnit: "l",
    });
    const mandarinoId = await ensureArticle(client, {
      name: "Mandarino",
      sku: "FG-MANDARINO",
      category: "finished_good",
      defaultUnit: "l",
    });

    const classicLimoncelloTemplateId = await ensureRatioTemplate(client, {
      name: "Klassieke Limoncello",
      finishedGoodArticleId: limoncelloId,
      baseAlcoholLiters: 1,
      expectedOutput: 2.8,
      notes: "Heldere, klassieke stijl voor kleine en middelgrote batches.",
    });
    await ensureRatioLines(client, classicLimoncelloTemplateId, [
      { articleId: alcoholId, quantity: 1, unit: "l", sortOrder: 0 },
      { articleId: waterId, quantity: 1.2, unit: "l", sortOrder: 1 },
      { articleId: sugarId, quantity: 700, unit: "g", sortOrder: 2 },
      { articleId: lemonId, quantity: 14, unit: "st", sortOrder: 3 },
    ]);

    const intenseLimoncelloTemplateId = await ensureRatioTemplate(client, {
      name: "Intense Limoncello",
      finishedGoodArticleId: limoncelloId,
      baseAlcoholLiters: 1,
      expectedOutput: 2.7,
      notes: "Iets krachtiger citrusprofiel met meer zeste per liter alcohol.",
    });
    await ensureRatioLines(client, intenseLimoncelloTemplateId, [
      { articleId: alcoholId, quantity: 1, unit: "l", sortOrder: 0 },
      { articleId: waterId, quantity: 1.1, unit: "l", sortOrder: 1 },
      { articleId: sugarId, quantity: 680, unit: "g", sortOrder: 2 },
      { articleId: lemonId, quantity: 16, unit: "st", sortOrder: 3 },
    ]);

    const arancelloTemplateId = await ensureRatioTemplate(client, {
      name: "Zachte Arancello",
      finishedGoodArticleId: arancelloId,
      baseAlcoholLiters: 1,
      expectedOutput: 2.9,
      notes: "Milder citrusprofiel met zachte bitterheid.",
    });
    await ensureRatioLines(client, arancelloTemplateId, [
      { articleId: alcoholId, quantity: 1, unit: "l", sortOrder: 0 },
      { articleId: waterId, quantity: 1.35, unit: "l", sortOrder: 1 },
      { articleId: sugarId, quantity: 650, unit: "g", sortOrder: 2 },
      { articleId: orangeId, quantity: 10, unit: "st", sortOrder: 3 },
    ]);

    const mandarinoTemplateId = await ensureRatioTemplate(client, {
      name: "Frisse Mandarino",
      finishedGoodArticleId: mandarinoId,
      baseAlcoholLiters: 1,
      expectedOutput: 2.9,
      notes: "Fris, toegankelijk profiel voor cadeauboxen en aperitiefsets.",
    });
    await ensureRatioLines(client, mandarinoTemplateId, [
      { articleId: alcoholId, quantity: 1, unit: "l", sortOrder: 0 },
      { articleId: waterId, quantity: 1.3, unit: "l", sortOrder: 1 },
      { articleId: sugarId, quantity: 620, unit: "g", sortOrder: 2 },
      { articleId: mandarinId, quantity: 16, unit: "st", sortOrder: 3 },
    ]);

    const customerInputs = [
      ["Sofie", "Peeters"],
      ["Bruno", "Maes"],
      ["Lotte", "Vermeulen"],
      ["Pieter", "Claes"],
      ["Nina", "Jacobs"],
      ["Tom", "Van den Broeck"],
      ["Ellen", "Wouters"],
      ["Jasper", "De Smet"],
      ["Hanne", "Goossens"],
      ["Koen", "Mertens"],
      ["An", "Van Acker"],
      ["Michiel", "Dubois"],
      ["Leen", "Pauwels"],
      ["Ruben", "Vandamme"],
      ["Maaike", "Bosmans"],
      ["Karel", "Aerts"],
      ["Julie", "Martens"],
      ["Jonas", "Verstraete"],
      ["Ilse", "Geerts"],
      ["Matthias", "De Wilde"],
      ["Lore", "Bockstael"],
      ["Wim", "Baeten"],
      ["Astrid", "Michiels"],
      ["Bert", "Hermans"],
    ];

    const customerRecords = [];

    for (const [index, [firstName, lastName]] of customerInputs.entries()) {
      const id = await ensureCustomer(client, {
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, "")}@example.com`,
        phone: `+32 470 10 ${String(index + 1).padStart(2, "0")} ${String(index + 11).padStart(2, "0")}`,
        notes:
          index % 3 === 0
            ? "Regelmatige besteller met terugkerende seizoensaankopen."
            : index % 3 === 1
              ? "Koopt vaak voor events of grotere groepen."
              : "Wisselende volumes, vaak cadeauverpakkingen.",
      });

      customerRecords.push({ id, firstName, lastName });
    }

    const templateCatalog = {
      classic: {
        ratioTemplateId: classicLimoncelloTemplateId,
        ratioTemplateNameSnapshot: "Klassieke Limoncello",
        finishedGoodArticleId: limoncelloId,
        alcoholArticleId: alcoholId,
        sugarArticleId: sugarId,
        citrusArticleId: lemonId,
        citrusUnitsPerAlcoholLiter: 14,
        sugarGramsPerAlcoholLiter: 700,
        alcoholCostPerLiter: 19.5,
        sugarCostPerGram: 0.0023,
        citrusUnitPrice: 0.58,
        citrusSupplier: "Citrus Supply",
        bottleArticleId: bottleId,
        labelArticleId: labelId,
        transportBoxArticleId: transportBoxId,
        giftBoxArticleId: giftBoxId,
      },
      intense: {
        ratioTemplateId: intenseLimoncelloTemplateId,
        ratioTemplateNameSnapshot: "Intense Limoncello",
        finishedGoodArticleId: limoncelloId,
        alcoholArticleId: alcoholId,
        sugarArticleId: sugarId,
        citrusArticleId: lemonId,
        citrusUnitsPerAlcoholLiter: 16,
        sugarGramsPerAlcoholLiter: 680,
        alcoholCostPerLiter: 19.9,
        sugarCostPerGram: 0.0024,
        citrusUnitPrice: 0.6,
        citrusSupplier: "Citrus Supply",
        bottleArticleId: bottleId,
        labelArticleId: labelId,
        transportBoxArticleId: transportBoxId,
        giftBoxArticleId: giftBoxId,
      },
      soft_arancello: {
        ratioTemplateId: arancelloTemplateId,
        ratioTemplateNameSnapshot: "Zachte Arancello",
        finishedGoodArticleId: arancelloId,
        alcoholArticleId: alcoholId,
        sugarArticleId: sugarId,
        citrusArticleId: orangeId,
        citrusUnitsPerAlcoholLiter: 10,
        sugarGramsPerAlcoholLiter: 650,
        alcoholCostPerLiter: 19.2,
        sugarCostPerGram: 0.0022,
        citrusUnitPrice: 0.72,
        citrusSupplier: "Lokale markt",
        bottleArticleId: bottleId,
        labelArticleId: labelId,
        transportBoxArticleId: transportBoxId,
        giftBoxArticleId: giftBoxId,
      },
      frisse_mandarino: {
        ratioTemplateId: mandarinoTemplateId,
        ratioTemplateNameSnapshot: "Frisse Mandarino",
        finishedGoodArticleId: mandarinoId,
        alcoholArticleId: alcoholId,
        sugarArticleId: sugarId,
        citrusArticleId: mandarinId,
        citrusUnitsPerAlcoholLiter: 16,
        sugarGramsPerAlcoholLiter: 620,
        alcoholCostPerLiter: 19.4,
        sugarCostPerGram: 0.00225,
        citrusUnitPrice: 0.43,
        citrusSupplier: "Fruit Atelier",
        bottleArticleId: bottleId,
        labelArticleId: labelId,
        transportBoxArticleId: transportBoxId,
        giftBoxArticleId: giftBoxId,
      },
    };

    const createdBatches = [];

    for (const blueprint of buildBatchBlueprints()) {
      const template = templateCatalog[blueprint.templateKey];
      const steepingUntil = addDays(blueprint.startedSteepingAt, blueprint.steepDays);
      const readyAt =
        blueprint.status === "draft" || blueprint.status === "steeping" ? null : steepingUntil;
      const batchId = await ensureBatch(client, {
        ...blueprint,
        steepingUntil,
        readyAt,
        finishedGoodArticleId: template.finishedGoodArticleId,
        ratioTemplateId: template.ratioTemplateId,
        ratioTemplateNameSnapshot: template.ratioTemplateNameSnapshot,
      });

      createdBatches.push({
        ...blueprint,
        id: batchId,
        steepingUntil,
        readyAt,
        finishedGoodArticleId: template.finishedGoodArticleId,
        template,
      });
    }

    for (const batch of createdBatches) {
      const expenses = buildExpensesForBatch(batch, batch.template, batch.id);

      for (const expense of expenses) {
        await ensureExpense(client, expense);
      }
    }

    let orderSequence = 1;

    function nextOrderNumber() {
      const next = `ORD-2026-${String(orderSequence).padStart(3, "0")}`;
      orderSequence += 1;
      return next;
    }

    for (const [index, batch] of createdBatches.entries()) {
      const rotatedCustomers = customerRecords
        .slice(index % customerRecords.length)
        .concat(customerRecords.slice(0, index % customerRecords.length));
      const orders = buildOrdersForBatch(
        batch,
        batch.id,
        rotatedCustomers,
        batch.finishedGoodArticleId,
        nextOrderNumber,
      );

      for (const order of orders) {
        await ensureOrder(client, order);
      }
    }

    await client.query("commit");
    console.log(`Seed data applied successfully. Added ${createdBatches.length} batches and a large demo dataset.`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
