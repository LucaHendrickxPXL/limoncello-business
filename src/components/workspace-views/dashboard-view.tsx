"use client";

import { ActionIcon, Box, Grid, ScrollArea, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconBottle, IconChartBar, IconInfoCircle, IconShoppingBag } from "@tabler/icons-react";

import { WorkspaceData } from "@/lib/types";
import {
  formatBatchStatus,
  formatCurrency,
  formatLiters,
  formatShortDate,
  getBatchStatusColor,
} from "@/lib/ui";

import {
  CustomerSummary,
  getMarginToneClass,
  getMarginToneColor,
  sortBatchesNewToOld,
} from "../limoncello-workspace-support";
import { EmptyState, MetricCard, SectionCard, SelectableCard, ToneBadge } from "../workspace-primitives";
import { WorkspaceTableFrame, WorkspaceTableRows } from "../workspace-table";

export function DashboardView({
  data,
  customerSummaries,
  onOpenBatch,
  onOpenCustomer,
  onOpenExpenses,
  onOpenBatches,
}: {
  data: WorkspaceData;
  customerSummaries: CustomerSummary[];
  onOpenBatch: (batchId: string) => void;
  onOpenCustomer: (customerId: string) => void;
  onOpenExpenses: () => void;
  onOpenBatches: () => void;
}) {
  const totalOpenOrderCount = data.dashboard.ordersInProgressCount + data.dashboard.ordersReadyCount;
  const marginPerSoldLiter =
    data.dashboard.totalSoldLiters > 0
      ? data.dashboard.totalMarginAmount / data.dashboard.totalSoldLiters
      : null;
  const profitableBatchesCount = data.batches.filter((batch) => batch.marginAmount > 0).length;
  const dashboardBatchRows = sortBatchesNewToOld(data.batches);
  const expenseTotalsByArticle = Array.from(
    data.expenses
      .reduce<
        Map<
          string,
          {
            articleId: string;
            articleName: string;
            totalAmount: number;
            registrations: number;
          }
        >
      >((totals, expense) => {
        const current = totals.get(expense.articleId);
        totals.set(expense.articleId, {
          articleId: expense.articleId,
          articleName: expense.articleName,
          totalAmount: (current?.totalAmount ?? 0) + expense.amount,
          registrations: (current?.registrations ?? 0) + 1,
        });

        return totals;
      }, new Map())
      .values(),
  ).sort((left, right) => right.totalAmount - left.totalAmount);

  return (
    <Box className="batch-workspace-shell">
      <Stack gap="md" className="batch-screen-shell dashboard-screen-shell">
        <Box className="dashboard-kpi-groups">
          <SectionCard title="Operatie" compact className="dashboard-kpi-group-card">
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" className="dashboard-kpi-group-grid">
              <MetricCard
                label="Beschikbaar volume"
                value={formatLiters(data.dashboard.totalAvailableLiters)}
                meta={`${data.dashboard.activeBatchCount} actieve batches`}
                infoDescription="Volume dat nog niet verkocht of gereserveerd is in de huidige voorraad."
              />
              <MetricCard
                label="Gereserveerd"
                value={formatLiters(data.dashboard.totalReservedLiters)}
                meta={`${totalOpenOrderCount} open orders`}
                infoDescription="Volume dat al vastligt in lopende orders."
              />
              <MetricCard
                label="Klaar voor levering"
                value={`${data.dashboard.ordersReadyCount}`}
                meta={`${data.dashboard.ordersInProgressCount} in verwerking`}
                infoDescription="Orders die operationeel klaar zijn om uit te leveren."
              />
            </SimpleGrid>
          </SectionCard>

          <SectionCard title="Financieel" compact className="dashboard-kpi-group-card dashboard-kpi-group-card-financial">
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" className="dashboard-kpi-group-grid">
              <MetricCard
                label="Omzet"
                value={formatCurrency(data.dashboard.totalRevenueAmount)}
                meta={`${data.dashboard.completedOrderCount} afgeronde orders`}
                infoDescription="Totale gerealiseerde omzet uit opbrengstregels."
              />
              <MetricCard
                label="Marge"
                value={formatCurrency(data.dashboard.totalMarginAmount)}
                meta={`${profitableBatchesCount} winstgevende batches`}
                tone={
                  <ToneBadge
                    color={getMarginToneColor(data.dashboard.totalMarginAmount)}
                    label={
                      data.dashboard.totalMarginAmount > 0
                        ? "Winst"
                        : data.dashboard.totalMarginAmount < 0
                          ? "Verlies"
                          : "Break-even"
                    }
                  />
                }
                valueClassName={getMarginToneClass(data.dashboard.totalMarginAmount)}
                infoDescription="Omzet min geregistreerde kosten over de huidige dataset."
              />
              <MetricCard
                label="Marge / L"
                value={marginPerSoldLiter === null ? "n.v.t." : `${formatCurrency(marginPerSoldLiter)}/L`}
                meta={formatLiters(data.dashboard.totalSoldLiters)}
                tone={
                  marginPerSoldLiter === null ? undefined : (
                    <ToneBadge
                      color={getMarginToneColor(marginPerSoldLiter)}
                      label={
                        marginPerSoldLiter > 0
                          ? "Positief"
                          : marginPerSoldLiter < 0
                            ? "Negatief"
                            : "Neutraal"
                      }
                    />
                  )
                }
                valueClassName={getMarginToneClass(marginPerSoldLiter)}
                infoDescription="Gemiddelde marge per verkochte liter."
              />
            </SimpleGrid>
          </SectionCard>
        </Box>

        <Grid gutter="md" className="dashboard-main-layout">
          <Grid.Col span={12} className="batch-detail-pane">
            <SectionCard
              title="Batchperformantie"
              compact
              action={
                <ActionIcon
                  size="lg"
                  radius="sm"
                  variant="subtle"
                  color="gray"
                  className="batch-toolbar-button batch-toolbar-icon-button"
                  aria-label="Open batches"
                  title="Open batches"
                  onClick={onOpenBatches}
                >
                  <IconBottle size={18} />
                </ActionIcon>
              }
              className="batch-screen-card batch-detail-static-card dashboard-scroll-card dashboard-primary-card"
              contentClassName="batch-detail-static-content dashboard-scroll-card-content"
            >
              <WorkspaceTableFrame
                headClassName="dashboard-table-head"
                columns={[
                  { label: "Batch" },
                  { label: "Status" },
                  { label: "Product", hiddenOnMobile: true },
                  { label: "Beschikbaar" },
                  { label: "Verkocht", hiddenOnMobile: true },
                  { label: "Kosten", hiddenOnMobile: true },
                  { label: "Omzet" },
                  { label: "Marge" },
                ]}
              >
                {dashboardBatchRows.length > 0 ? (
                  <WorkspaceTableRows>
                    {dashboardBatchRows.map((batch) => (
                      <Box
                        key={batch.id}
                        className="batch-table-row dashboard-table-row"
                        role="button"
                        tabIndex={0}
                        onClick={() => onOpenBatch(batch.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onOpenBatch(batch.id);
                          }
                        }}
                      >
                        <Box className="batch-table-cell batch-table-cell-primary" data-label="Batch">
                          <Text className="batch-table-batch-number">{batch.batchNumber}</Text>
                        </Box>
                        <Box className="batch-table-cell" data-label="Status">
                          <ToneBadge color={getBatchStatusColor(batch.status)} label={formatBatchStatus(batch.status)} />
                        </Box>
                        <Box className="batch-table-cell table-mobile-hidden" data-label="Product">
                          <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                            {batch.finishedGoodArticleName}
                          </Text>
                        </Box>
                        <Box className="batch-table-cell" data-label="Beschikbaar">
                          <Text size="sm" fw={700} className="batch-table-metric">
                            {formatLiters(batch.availableLiters)}
                          </Text>
                        </Box>
                        <Box className="batch-table-cell table-mobile-hidden" data-label="Verkocht">
                          <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                            {formatLiters(batch.soldLiters)}
                          </Text>
                        </Box>
                        <Box className="batch-table-cell table-mobile-hidden" data-label="Kosten">
                          <Text size="sm" fw={700} className="batch-table-metric">
                            {formatCurrency(batch.costAmount)}
                          </Text>
                        </Box>
                        <Box className="batch-table-cell" data-label="Omzet">
                          <Text size="sm" fw={700} className="batch-table-metric">
                            {formatCurrency(batch.revenueAmount)}
                          </Text>
                        </Box>
                        <Box className="batch-table-cell" data-label="Marge">
                          <Text
                            size="sm"
                            fw={700}
                            className={["batch-table-metric", getMarginToneClass(batch.marginAmount)].join(" ")}
                          >
                            {formatCurrency(batch.marginAmount)}
                          </Text>
                        </Box>
                      </Box>
                    ))}
                  </WorkspaceTableRows>
                ) : (
                  <EmptyState
                    icon={<IconChartBar size={20} />}
                    title="Nog geen batchdata"
                    description="Voeg eerst batches, orders en kosten toe om performantie te kunnen lezen."
                  />
                )}
              </WorkspaceTableFrame>
            </SectionCard>
          </Grid.Col>
        </Grid>

        <Grid gutter="md" className="dashboard-secondary-layout">
          <Grid.Col span={{ base: 12, xl: 6 }} className="batch-detail-pane">
            <SectionCard
              title="Topklanten"
              compact
              className="batch-screen-card batch-history-card dashboard-scroll-card dashboard-secondary-card"
              contentClassName="batch-history-card-content dashboard-scroll-card-content"
            >
              <ScrollArea
                type="hover"
                offsetScrollbars
                scrollbars="y"
                scrollbarSize={8}
                className="dashboard-scroll-shell"
              >
                {customerSummaries.filter((customer) => customer.revenueAmount > 0).length > 0 ? (
                  <Stack gap="sm">
                    {customerSummaries
                      .filter((customer) => customer.revenueAmount > 0)
                      .slice(0, 8)
                      .map((customer) => (
                        <SelectableCard
                          key={customer.id}
                          title={customer.fullName}
                          subtitle={`${customer.completedOrderCount} afgerond · ${formatLiters(customer.litersSold)}`}
                          badge={<ToneBadge color="teal" label={formatCurrency(customer.revenueAmount)} />}
                          meta={
                            <Text size="sm" className="muted-copy">
                              Laatste activiteit · {formatShortDate(customer.latestActivityAt)}
                            </Text>
                          }
                          onClick={() => onOpenCustomer(customer.id)}
                        />
                      ))}
                  </Stack>
                ) : (
                  <EmptyState
                    icon={<IconShoppingBag size={20} />}
                    title="Nog geen klantomzet"
                    description="Zodra orders afgerond zijn, zie je hier wie de omzet draagt."
                  />
                )}
              </ScrollArea>
            </SectionCard>
          </Grid.Col>

          <Grid.Col span={{ base: 12, xl: 6 }} className="batch-detail-pane">
            <SectionCard
              title="Kostendrijvers"
              compact
              className="batch-screen-card batch-history-card dashboard-scroll-card dashboard-secondary-card"
              contentClassName="batch-history-card-content dashboard-scroll-card-content"
            >
              <ScrollArea
                type="hover"
                offsetScrollbars
                scrollbars="y"
                scrollbarSize={8}
                className="dashboard-scroll-shell"
              >
                {expenseTotalsByArticle.length > 0 ? (
                  <Stack gap="sm">
                    {expenseTotalsByArticle.slice(0, 8).map((article) => (
                      <SelectableCard
                        key={article.articleId}
                        title={article.articleName}
                        subtitle={`${article.registrations} registratie${article.registrations === 1 ? "" : "s"}`}
                        badge={<ToneBadge color="orange" label={formatCurrency(article.totalAmount)} />}
                        meta={<Text size="sm" className="muted-copy">Totaal geregistreerde kost</Text>}
                        onClick={onOpenExpenses}
                      />
                    ))}
                  </Stack>
                ) : (
                  <EmptyState
                    icon={<IconInfoCircle size={20} />}
                    title="Nog geen kostendrijvers"
                    description="Zodra kosten geregistreerd zijn, zie je hier welke artikels het zwaarst doorwegen."
                  />
                )}
              </ScrollArea>
            </SectionCard>
          </Grid.Col>
        </Grid>
      </Stack>
    </Box>
  );
}
