"use client";

import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconBottle, IconChevronDown, IconChevronUp, IconInfoCircle, IconShoppingBag, IconUser } from "@tabler/icons-react";
import type { Dispatch, SetStateAction } from "react";

import { Batch, Customer, Order, RevenueEntry } from "@/lib/types";
import { formatCurrency, formatLiters, formatShortDate } from "@/lib/ui";

import { RevenueInsightsPanel } from "../limoncello-workspace-support";
import { DetailRow, EmptyState, InfoLabel, MetricCard, SectionCard, SelectableCard, ToneBadge } from "../workspace-primitives";

type RevenueBatchSummary = {
  batchId: string;
  batchNumber: string;
  finishedGoodArticleName: string;
  totalAmount: number;
  litersSold: number;
  bookings: number;
};

type RevenueCustomerSummary = {
  customerId: string;
  customerName: string;
  totalAmount: number;
  litersSold: number;
  bookings: number;
};

export function RevenueWorkspaceView({
  filteredRevenueEntries,
  filteredRevenueLiters,
  filteredRevenueAmount,
  filteredRevenueAverageOrderValue,
  filteredRevenueAveragePricePerLiter,
  topRevenueBatch,
  topRevenueCustomer,
  revenueInsightsPanel,
  setRevenueInsightsPanel,
  revenueTotalsByBatch,
  revenueFilterBatch,
  revenueSearchQuery,
  setRevenueSearchQuery,
  revenueBatchFilterId,
  setRevenueBatchFilterId,
  batchFilterOptions,
  searchedRevenueEntries,
  revenueSearchTerm,
  selectedRevenueEntryId,
  setSelectedRevenueEntryId,
  selectedRevenueEntry,
  selectedRevenueOrder,
  selectedRevenueBatchDetail,
  selectedRevenueCustomer,
  onOpenOrder,
  onOpenBatch,
  onOpenCustomer,
}: {
  filteredRevenueEntries: RevenueEntry[];
  filteredRevenueLiters: number;
  filteredRevenueAmount: number;
  filteredRevenueAverageOrderValue: number | null;
  filteredRevenueAveragePricePerLiter: number | null;
  topRevenueBatch: RevenueBatchSummary | null;
  topRevenueCustomer: RevenueCustomerSummary | null;
  revenueInsightsPanel: RevenueInsightsPanel;
  setRevenueInsightsPanel: Dispatch<SetStateAction<RevenueInsightsPanel>>;
  revenueTotalsByBatch: RevenueBatchSummary[];
  revenueFilterBatch: Batch | null;
  revenueSearchQuery: string;
  setRevenueSearchQuery: Dispatch<SetStateAction<string>>;
  revenueBatchFilterId: string | null;
  setRevenueBatchFilterId: Dispatch<SetStateAction<string | null>>;
  batchFilterOptions: Array<{ value: string; label: string }>;
  searchedRevenueEntries: RevenueEntry[];
  revenueSearchTerm: string;
  selectedRevenueEntryId: string;
  setSelectedRevenueEntryId: Dispatch<SetStateAction<string>>;
  selectedRevenueEntry: RevenueEntry | null;
  selectedRevenueOrder: Order | null;
  selectedRevenueBatchDetail: Batch | null;
  selectedRevenueCustomer: Customer | null;
  onOpenOrder: (orderId: string) => void;
  onOpenBatch: (batchId: string) => void;
  onOpenCustomer: (customerId: string) => void;
}) {
  return (
    <Box className="batch-workspace-shell">
      <Stack gap="md" className="batch-screen-shell revenue-screen-shell">
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
          <MetricCard
            label="Boekingen"
            value={String(filteredRevenueEntries.length)}
            infoDescription="Boekingen zijn opbrengstregels die effectief aangemaakt zijn vanuit afgeronde orders."
          />
          <MetricCard
            label="Verkocht volume"
            value={formatLiters(filteredRevenueLiters)}
            infoDescription="Verkocht volume telt alleen liters mee die als opbrengst geboekt zijn."
          />
          <MetricCard
            label="Omzet"
            value={formatCurrency(filteredRevenueAmount)}
            infoDescription="Omzet is de som van alle zichtbare opbrengstregels in deze lijst."
          />
          <MetricCard
            label="Gem. orderwaarde"
            value={
              filteredRevenueAverageOrderValue === null
                ? "n.v.t."
                : formatCurrency(filteredRevenueAverageOrderValue)
            }
            infoDescription="Gemiddelde orderwaarde is de zichtbare omzet gedeeld door het aantal zichtbare afgeronde orders."
          />
        </SimpleGrid>

        <Grid gutter="md" className="revenue-detail-layout">
          <Grid.Col span={{ base: 12, xl: 3 }} className="batch-detail-pane">
            <Box className="revenue-insights-rail">
              <SectionCard
                title="Analyse"
                compact
                onClick={() => setRevenueInsightsPanel("analysis")}
                action={
                  <Box className="revenue-insight-toggle-indicator" aria-hidden="true">
                    {revenueInsightsPanel === "analysis" ? (
                      <IconChevronUp size={16} />
                    ) : (
                      <IconChevronDown size={16} />
                    )}
                  </Box>
                }
                className={[
                  "batch-screen-card",
                  "batch-history-card",
                  "revenue-insight-card",
                  revenueInsightsPanel === "analysis"
                    ? "revenue-insight-card-active"
                    : "revenue-insight-card-collapsed",
                ].join(" ")}
                contentClassName={[
                  "batch-history-card-content",
                  "revenue-insight-card-content",
                  revenueInsightsPanel === "analysis"
                    ? "revenue-insight-card-content-active"
                    : "revenue-insight-card-content-collapsed",
                ].join(" ")}
              >
                {revenueInsightsPanel === "analysis" ? (
                  <Box className="revenue-insight-card-body">
                    <Stack gap="sm">
                      <Card radius="md" padding="md" className="batch-summary-card">
                        <Stack gap={6}>
                          <InfoLabel
                            label="Gem. prijs per L"
                            description="Zichtbare omzet gedeeld door het zichtbare verkochte volume."
                          />
                          <Title order={2}>
                            {filteredRevenueAveragePricePerLiter === null
                              ? "n.v.t."
                              : `${formatCurrency(filteredRevenueAveragePricePerLiter)}/L`}
                          </Title>
                        </Stack>
                      </Card>
                      <Card radius="md" padding="md" className="batch-summary-card">
                        <Stack gap={6}>
                          <InfoLabel
                            label="Sterkste batch"
                            description="Batch die momenteel de meeste omzet draagt binnen de zichtbare opbrengsten."
                          />
                          <Title order={2}>{topRevenueBatch?.batchNumber ?? "Geen batch"}</Title>
                          <Text size="sm" className="muted-copy">
                            {topRevenueBatch
                              ? `${formatCurrency(topRevenueBatch.totalAmount)} · ${formatLiters(topRevenueBatch.litersSold)}`
                              : "Nog geen opbrengsten"}
                          </Text>
                        </Stack>
                      </Card>
                      <Card radius="md" padding="md" className="batch-summary-card">
                        <Stack gap={6}>
                          <InfoLabel
                            label="Topklant"
                            description="Klant die binnen de zichtbare filter het meeste omzet genereert."
                          />
                          <Title order={2}>{topRevenueCustomer?.customerName ?? "Geen klant"}</Title>
                          <Text size="sm" className="muted-copy">
                            {topRevenueCustomer
                              ? `${formatCurrency(topRevenueCustomer.totalAmount)} · ${topRevenueCustomer.bookings} order${topRevenueCustomer.bookings === 1 ? "" : "s"}`
                              : "Nog geen opbrengsten"}
                          </Text>
                        </Stack>
                      </Card>
                    </Stack>
                  </Box>
                ) : null}
              </SectionCard>

              <SectionCard
                title="Omzet per batch"
                compact
                onClick={() => setRevenueInsightsPanel("batch_breakdown")}
                action={
                  <Box className="revenue-insight-toggle-indicator" aria-hidden="true">
                    {revenueInsightsPanel === "batch_breakdown" ? (
                      <IconChevronUp size={16} />
                    ) : (
                      <IconChevronDown size={16} />
                    )}
                  </Box>
                }
                className={[
                  "batch-screen-card",
                  "batch-history-card",
                  "revenue-insight-card",
                  revenueInsightsPanel === "batch_breakdown"
                    ? "revenue-insight-card-active"
                    : "revenue-insight-card-collapsed",
                ].join(" ")}
                contentClassName={[
                  "batch-history-card-content",
                  "revenue-insight-card-content",
                  revenueInsightsPanel === "batch_breakdown"
                    ? "revenue-insight-card-content-active"
                    : "revenue-insight-card-content-collapsed",
                ].join(" ")}
              >
                {revenueInsightsPanel === "batch_breakdown" ? (
                  <Box className="revenue-insight-card-body">
                    <Box className="batch-panel-feed-shell">
                      {revenueTotalsByBatch.length > 0 ? (
                        <Stack gap="sm" className="batch-history-list">
                          {revenueTotalsByBatch.map((batch) => (
                            <Box key={batch.batchId} className="batch-history-item">
                              <Stack gap={6}>
                                <Group justify="space-between" align="flex-start" gap="sm">
                                  <Text fw={700}>{batch.batchNumber}</Text>
                                  <Text size="sm" className="muted-copy">
                                    {formatCurrency(batch.totalAmount)}
                                  </Text>
                                </Group>
                                <Text size="sm" className="muted-copy">
                                  {batch.finishedGoodArticleName}
                                </Text>
                                <Text size="sm" className="muted-copy">
                                  {formatLiters(batch.litersSold)} · {batch.bookings} boeking
                                  {batch.bookings === 1 ? "" : "en"}
                                </Text>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <EmptyState
                          icon={<IconInfoCircle size={20} />}
                          title="Nog geen batchomzet"
                          description="Zodra orders afgerond zijn, zie je hier welke batches de omzet dragen."
                        />
                      )}
                    </Box>
                  </Box>
                ) : null}
              </SectionCard>
            </Box>
          </Grid.Col>
          <Grid.Col span={{ base: 12, xl: 4, lg: 7 }} className="batch-detail-pane">
            <SectionCard
              title={revenueFilterBatch ? `Opbrengsten · ${revenueFilterBatch.batchNumber}` : "Alle opbrengsten"}
              subtitle="Read-only analyse van afgeronde orders en hun omzetregels."
              compact
              action={
                <Group gap="xs" className="workspace-toolbar-group">
                  <TextInput
                    aria-label="Zoek opbrengsten"
                    placeholder="Zoek order, batch of klant"
                    value={revenueSearchQuery}
                    onChange={(event) => setRevenueSearchQuery(event.currentTarget.value)}
                    className="workspace-toolbar-select"
                  />
                  <NativeSelect
                    aria-label="Filter opbrengsten op batch"
                    value={revenueBatchFilterId ?? ""}
                    data={batchFilterOptions}
                    onChange={(event) => {
                      const batchId = event.currentTarget.value;
                      setRevenueBatchFilterId(batchId || null);
                    }}
                    className="workspace-toolbar-select"
                  />
                  {revenueFilterBatch ? (
                    <Button
                      size="xs"
                      radius="sm"
                      variant="subtle"
                      color="gray"
                      onClick={() => setRevenueBatchFilterId(null)}
                    >
                      Alle batches
                    </Button>
                  ) : null}
                </Group>
              }
              className="batch-screen-card batch-detail-static-card"
              contentClassName="batch-detail-static-content"
            >
              <Box className="batch-list-scroll">
                <Stack gap="sm">
                  {searchedRevenueEntries.length > 0 ? (
                    searchedRevenueEntries.map((entry) => (
                      <SelectableCard
                        key={entry.id}
                        selected={entry.id === selectedRevenueEntryId}
                        title={entry.orderNumber}
                        subtitle={`${entry.customerName} · ${entry.batchNumber}`}
                        badge={<ToneBadge color="teal" label={formatCurrency(entry.totalAmount)} />}
                        meta={
                          <Stack gap={2}>
                            <Text size="sm" className="muted-copy">
                              {formatLiters(entry.litersSold)} · {formatShortDate(entry.recognizedAt)}
                            </Text>
                            <Text size="sm" className="muted-copy">
                              {entry.finishedGoodArticleName}
                            </Text>
                          </Stack>
                        }
                        onClick={() => setSelectedRevenueEntryId(entry.id)}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={<IconShoppingBag size={20} />}
                      title={
                        revenueSearchTerm
                          ? "Geen opbrengsten gevonden"
                          : revenueFilterBatch
                            ? "Geen opbrengsten voor deze batch"
                            : "Nog geen opbrengsten"
                      }
                      description={
                        revenueSearchTerm
                          ? "Verfijn je zoekterm of pas de batchfilter aan om een opbrengstregel terug te vinden."
                          : revenueFilterBatch
                            ? "Pas de filter aan of rond orders af om hier omzet voor deze batch te zien."
                            : "Zodra orders afgerond zijn, verschijnen de opbrengsten hier."
                      }
                    />
                  )}
                </Stack>
              </Box>
            </SectionCard>
          </Grid.Col>
          <Grid.Col span={{ base: 12, xl: 5, lg: 5 }} className="batch-detail-pane">
            <SectionCard
              title="Opbrengstdetail"
              compact
              className="batch-screen-card batch-history-card"
              contentClassName="batch-history-card-content"
            >
              <Box className="batch-panel-feed-shell">
                {selectedRevenueEntry ? (
                  <Stack gap="sm" style={{ width: "100%" }}>
                    <Group justify="space-between" align="flex-start" gap="sm">
                      <Stack gap={2}>
                        <Text fw={700}>{selectedRevenueEntry.orderNumber}</Text>
                        <Text size="sm" className="muted-copy">
                          {selectedRevenueEntry.customerName} · {selectedRevenueEntry.batchNumber}
                        </Text>
                      </Stack>
                      <ToneBadge color="teal" label={formatCurrency(selectedRevenueEntry.totalAmount)} />
                    </Group>
                    <DetailRow label="Klant" value={selectedRevenueEntry.customerName} />
                    <DetailRow label="Batch" value={selectedRevenueEntry.batchNumber} />
                    <DetailRow label="Product" value={selectedRevenueEntry.finishedGoodArticleName} />
                    <DetailRow label="Volume" value={formatLiters(selectedRevenueEntry.litersSold)} />
                    <DetailRow
                      label="Prijs per liter"
                      value={formatCurrency(selectedRevenueEntry.unitPricePerLiter)}
                    />
                    <DetailRow
                      label="Geboekt op"
                      value={formatShortDate(selectedRevenueEntry.recognizedAt)}
                    />
                    <DetailRow
                      label="Order afgerond"
                      value={formatShortDate(selectedRevenueOrder?.completedAt ?? selectedRevenueEntry.recognizedAt)}
                    />
                    <Divider />
                    <Text fw={700}>Context</Text>
                    <DetailRow
                      label="Batchomzet"
                      value={
                        selectedRevenueBatchDetail
                          ? formatCurrency(selectedRevenueBatchDetail.revenueAmount)
                          : "Niet gevonden"
                      }
                    />
                    <DetailRow
                      label="Batchkosten"
                      value={
                        selectedRevenueBatchDetail
                          ? formatCurrency(selectedRevenueBatchDetail.costAmount)
                          : "Niet gevonden"
                      }
                    />
                    <DetailRow
                      label="Batchmarge"
                      value={
                        selectedRevenueBatchDetail
                          ? formatCurrency(selectedRevenueBatchDetail.marginAmount)
                          : "Niet gevonden"
                      }
                    />
                    <Group gap="xs" className="batch-detail-actions">
                      <ActionIcon
                        size="lg"
                        radius="sm"
                        variant="light"
                        color="sage"
                        className="batch-context-icon-button"
                        aria-label="Order openen"
                        title="Order openen"
                        onClick={() => onOpenOrder(selectedRevenueEntry.orderId)}
                      >
                        <IconShoppingBag size={18} />
                      </ActionIcon>
                      <ActionIcon
                        size="lg"
                        radius="sm"
                        variant="light"
                        color="gray"
                        className="batch-context-icon-button"
                        aria-label="Batch openen"
                        title="Batch openen"
                        onClick={() => onOpenBatch(selectedRevenueEntry.batchId)}
                      >
                        <IconBottle size={18} />
                      </ActionIcon>
                      {selectedRevenueCustomer ? (
                        <ActionIcon
                          size="lg"
                          radius="sm"
                          variant="light"
                          color="gray"
                          className="batch-context-icon-button"
                          aria-label="Klant openen"
                          title="Klant openen"
                          onClick={() => onOpenCustomer(selectedRevenueCustomer.id)}
                        >
                          <IconUser size={18} />
                        </ActionIcon>
                      ) : null}
                    </Group>
                    {selectedRevenueEntry.notes ? (
                      <Box className="order-detail-inline-note">
                        <Text size="sm" className="muted-copy">
                          {selectedRevenueEntry.notes}
                        </Text>
                      </Box>
                    ) : (
                      <Alert color="teal" variant="light" icon={<IconInfoCircle size={16} />}>
                        Deze opbrengstregel wordt automatisch aangemaakt zodra het gekoppelde order afgerond is.
                      </Alert>
                    )}
                  </Stack>
                ) : (
                  <EmptyState
                    icon={<IconInfoCircle size={20} />}
                    title="Geen opbrengst geselecteerd"
                    description="Kies links een opbrengst om omzet en batchcontext te bekijken."
                  />
                )}
              </Box>
            </SectionCard>
          </Grid.Col>
        </Grid>
      </Stack>
    </Box>
  );
}
