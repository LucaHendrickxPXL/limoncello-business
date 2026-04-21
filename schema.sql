create extension if not exists pgcrypto;

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  category text not null,
  default_unit text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_category_check
    check (category in ('ingredient', 'packaging', 'finished_good', 'other')),
  constraint articles_default_unit_check
    check (default_unit in ('l', 'g', 'kg', 'st')),
  constraint articles_sku_unique unique (sku)
);

create unique index if not exists idx_articles_name_lower_unique
  on articles ((lower(name)));

create table if not exists ratio_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  finished_good_article_id uuid not null references articles(id) on delete restrict,
  base_alcohol_liters numeric(12, 3) not null default 1.000,
  expected_output_liters_per_base_alcohol_liter numeric(12, 3) not null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ratio_templates_base_alcohol_liters_check
    check (base_alcohol_liters > 0),
  constraint ratio_templates_expected_output_check
    check (expected_output_liters_per_base_alcohol_liter > 0)
);

create unique index if not exists idx_ratio_templates_name_lower_unique
  on ratio_templates ((lower(name)));

create table if not exists ratio_template_lines (
  id uuid primary key default gen_random_uuid(),
  ratio_template_id uuid not null references ratio_templates(id) on delete cascade,
  article_id uuid not null references articles(id) on delete restrict,
  quantity numeric(14, 3) not null,
  unit text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ratio_template_lines_quantity_check
    check (quantity > 0),
  constraint ratio_template_lines_unit_check
    check (unit in ('l', 'g', 'kg', 'st')),
  constraint ratio_template_lines_sort_order_check
    check (sort_order >= 0),
  constraint ratio_template_lines_template_sort_unique
    unique (ratio_template_id, sort_order)
);

create index if not exists idx_ratio_template_lines_template
  on ratio_template_lines (ratio_template_id, sort_order);

create index if not exists idx_ratio_template_lines_article
  on ratio_template_lines (article_id);

create table if not exists batches (
  id uuid primary key default gen_random_uuid(),
  batch_number text not null,
  started_steeping_at date not null default current_date,
  steep_days integer not null,
  steeping_until date not null,
  ready_at date,
  status text not null,
  finished_good_article_id uuid not null references articles(id) on delete restrict,
  ratio_template_id uuid not null references ratio_templates(id) on delete restrict,
  ratio_template_name_snapshot text not null,
  alcohol_input_liters numeric(12, 3) not null,
  expected_output_liters numeric(12, 3) not null,
  actual_produced_liters numeric(12, 3),
  unit_price_per_liter numeric(14, 2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint batches_batch_number_unique unique (batch_number),
  constraint batches_steep_days_check
    check (steep_days >= 0),
  constraint batches_steeping_until_check
    check (steeping_until >= started_steeping_at),
  constraint batches_status_check
    check (status in ('draft', 'steeping', 'ready', 'sold_out', 'archived')),
  constraint batches_alcohol_input_liters_check
    check (alcohol_input_liters > 0),
  constraint batches_expected_output_liters_check
    check (expected_output_liters > 0),
  constraint batches_actual_produced_liters_check
    check (actual_produced_liters is null or actual_produced_liters >= 0),
  constraint batches_unit_price_per_liter_check
    check (unit_price_per_liter >= 0)
);

create unique index if not exists idx_batches_batch_number_lower_unique
  on batches ((lower(batch_number)));

create index if not exists idx_batches_status_started
  on batches (status, started_steeping_at desc);

create index if not exists idx_batches_finished_good
  on batches (finished_good_article_id, created_at desc);

create table if not exists batch_status_history (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references batches(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_at timestamptz not null default now(),
  note text,
  constraint batch_status_history_from_status_check
    check (from_status is null or from_status in ('draft', 'steeping', 'ready', 'sold_out', 'archived')),
  constraint batch_status_history_to_status_check
    check (to_status in ('draft', 'steeping', 'ready', 'sold_out', 'archived'))
);

create index if not exists idx_batch_status_history_batch_changed
  on batch_status_history (batch_id, changed_at desc);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_last_name_first_name
  on customers (lower(last_name), lower(first_name));

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  customer_id uuid not null references customers(id) on delete restrict,
  batch_id uuid not null references batches(id) on delete restrict,
  ordered_liters numeric(12, 3) not null,
  unit_price_per_liter numeric(14, 2) not null,
  total_amount numeric(14, 2) generated always as (round((ordered_liters * unit_price_per_liter)::numeric, 2)) stored,
  status text not null,
  ordered_at date not null default current_date,
  completed_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_order_number_unique unique (order_number),
  constraint orders_ordered_liters_check
    check (ordered_liters > 0),
  constraint orders_unit_price_per_liter_check
    check (unit_price_per_liter >= 0),
  constraint orders_status_check
    check (status in ('besteld', 'in_verwerking', 'klaar_voor_uitlevering', 'afgerond', 'geannuleerd'))
);

create unique index if not exists idx_orders_order_number_lower_unique
  on orders ((lower(order_number)));

create index if not exists idx_orders_batch_status
  on orders (batch_id, status, ordered_at desc);

create index if not exists idx_orders_customer_date
  on orders (customer_id, ordered_at desc);

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_at timestamptz not null default now(),
  note text,
  constraint order_status_history_from_status_check
    check (from_status is null or from_status in ('besteld', 'in_verwerking', 'klaar_voor_uitlevering', 'afgerond', 'geannuleerd')),
  constraint order_status_history_to_status_check
    check (to_status in ('besteld', 'in_verwerking', 'klaar_voor_uitlevering', 'afgerond', 'geannuleerd'))
);

create index if not exists idx_order_status_history_order_changed
  on order_status_history (order_id, changed_at desc);

create table if not exists revenue_entries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  batch_id uuid not null references batches(id) on delete restrict,
  customer_id uuid not null references customers(id) on delete restrict,
  finished_good_article_id uuid not null references articles(id) on delete restrict,
  liters_sold numeric(12, 3) not null,
  unit_price_per_liter numeric(14, 2) not null,
  total_amount numeric(14, 2) generated always as (round((liters_sold * unit_price_per_liter)::numeric, 2)) stored,
  recognized_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  constraint revenue_entries_order_unique unique (order_id),
  constraint revenue_entries_liters_sold_check
    check (liters_sold > 0),
  constraint revenue_entries_unit_price_per_liter_check
    check (unit_price_per_liter >= 0)
);

create index if not exists idx_revenue_entries_batch_recognized
  on revenue_entries (batch_id, recognized_at desc);

create index if not exists idx_revenue_entries_article_recognized
  on revenue_entries (finished_good_article_id, recognized_at desc);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references batches(id) on delete cascade,
  article_id uuid not null references articles(id) on delete restrict,
  expense_date date not null default current_date,
  quantity numeric(14, 3),
  unit text,
  amount numeric(14, 2) not null,
  payment_method text not null,
  supplier_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expenses_quantity_unit_pair_check
    check (
      (quantity is null and unit is null)
      or (quantity is not null and unit is not null)
    ),
  constraint expenses_quantity_check
    check (quantity is null or quantity > 0),
  constraint expenses_unit_check
    check (unit is null or unit in ('l', 'g', 'kg', 'st')),
  constraint expenses_amount_check
    check (amount > 0),
  constraint expenses_payment_method_check
    check (payment_method in ('cash', 'overschrijving'))
);

create index if not exists idx_expenses_batch_date
  on expenses (batch_id, expense_date desc);

create index if not exists idx_expenses_article_date
  on expenses (article_id, expense_date desc);

create or replace view batch_metrics_v1 as
select
  b.id as batch_id,
  b.batch_number,
  b.status,
  b.finished_good_article_id,
  b.ratio_template_id,
  b.started_steeping_at,
  b.steeping_until,
  b.ready_at,
  b.alcohol_input_liters,
  b.expected_output_liters,
  b.actual_produced_liters,
  b.unit_price_per_liter,
  coalesce(reserved.reserved_liters, 0)::numeric(12, 3) as reserved_liters,
  coalesce(sold.sold_liters, 0)::numeric(12, 3) as sold_liters,
  coalesce(revenue.revenue_amount, 0)::numeric(14, 2) as revenue_amount,
  coalesce(costs.cost_amount, 0)::numeric(14, 2) as cost_amount,
  (
    case
      when b.actual_produced_liters is not null then b.actual_produced_liters
      else b.expected_output_liters
    end
    - coalesce(reserved.reserved_liters, 0)
    - coalesce(sold.sold_liters, 0)
  )::numeric(12, 3) as available_liters,
  (
    coalesce(revenue.revenue_amount, 0)
    - coalesce(costs.cost_amount, 0)
  )::numeric(14, 2) as margin_amount
from batches b
left join (
  select
    o.batch_id,
    sum(o.ordered_liters) as reserved_liters
  from orders o
  where o.status in ('in_verwerking', 'klaar_voor_uitlevering')
  group by o.batch_id
) reserved on reserved.batch_id = b.id
left join (
  select
    r.batch_id,
    sum(r.liters_sold) as sold_liters
  from revenue_entries r
  group by r.batch_id
) sold on sold.batch_id = b.id
left join (
  select
    r.batch_id,
    sum(r.total_amount) as revenue_amount
  from revenue_entries r
  group by r.batch_id
) revenue on revenue.batch_id = b.id
left join (
  select
    e.batch_id,
    sum(e.amount) as cost_amount
  from expenses e
  group by e.batch_id
) costs on costs.batch_id = b.id;

create or replace view article_reporting_v1 as
select
  a.id as article_id,
  a.name,
  a.category,
  a.default_unit,
  coalesce(expense_totals.total_purchased_quantity, 0)::numeric(14, 3) as total_purchased_quantity,
  coalesce(expense_totals.total_purchase_amount, 0)::numeric(14, 2) as total_purchase_amount,
  coalesce(revenue_totals.total_sold_quantity, 0)::numeric(14, 3) as total_sold_quantity,
  coalesce(revenue_totals.total_sales_amount, 0)::numeric(14, 2) as total_sales_amount
from articles a
left join (
  select
    e.article_id,
    sum(coalesce(e.quantity, 0)) as total_purchased_quantity,
    sum(e.amount) as total_purchase_amount
  from expenses e
  group by e.article_id
) expense_totals on expense_totals.article_id = a.id
left join (
  select
    r.finished_good_article_id as article_id,
    sum(r.liters_sold) as total_sold_quantity,
    sum(r.total_amount) as total_sales_amount
  from revenue_entries r
  group by r.finished_good_article_id
) revenue_totals on revenue_totals.article_id = a.id;
