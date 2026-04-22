"use client";

import {
  Alert,
  ActionIcon,
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconArrowLeft, IconInfoCircle, IconPencil } from "@tabler/icons-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import { Customer, Order, RevenueEntry } from "@/lib/types";
import { formatCurrency, formatLiters, formatOrderStatus, formatShortDate, getOrderStatusColor } from "@/lib/ui";

import { CustomerSummary, getCustomerSummaryTone, getMarginToneClass } from "../limoncello-workspace-support";
import { DetailRow, EmptyState, MetricCard, SectionCard, SelectableCard, ToneBadge } from "../workspace-primitives";
import { WorkspaceTableFrame, WorkspaceTableRows } from "../workspace-table";

export function CustomersWorkspaceView({
  customerCount,
  customersWithOrdersCount,
  customersWithRevenueCount,
  customersWithOpenOrdersCount,
  totalOpenCustomerOrders,
  totalCustomerRevenue,
  totalCustomerMargin,
  totalCustomerLitersSold,
  topRevenueCustomerName,
  customerSearchQuery,
  setCustomerSearchQuery,
  customerSearchTerm,
  searchedCustomerSummaries,
  selectedCustomer,
  selectedCustomerSummary,
  selectedCustomerOrders,
  selectedCustomerRevenueEntries,
  customerWorkspaceMode,
  onOpenCustomer,
  onOpenOrder,
  onOpenRevenueEntry,
  onOpenCustomerEditor,
  onOpenCustomerCreator,
  onOpenCustomersOverview,
  customerEditorDrawer,
}: {
  customerCount: number;
  customersWithOrdersCount: number;
  customersWithRevenueCount: number;
  customersWithOpenOrdersCount: number;
  totalOpenCustomerOrders: number;
  totalCustomerRevenue: number;
  totalCustomerMargin: number;
  totalCustomerLitersSold: number;
  topRevenueCustomerName: string | null;
  customerSearchQuery: string;
  setCustomerSearchQuery: Dispatch<SetStateAction<string>>;
  customerSearchTerm: string;
  searchedCustomerSummaries: CustomerSummary[];
  selectedCustomer: Customer | null;
  selectedCustomerSummary: CustomerSummary | null;
  selectedCustomerOrders: Order[];
  selectedCustomerRevenueEntries: RevenueEntry[];
  customerWorkspaceMode: "overview" | "detail";
  onOpenCustomer: (customerId: string) => void;
  onOpenOrder: (orderId: string) => void;
  onOpenRevenueEntry: (entryId: string) => void;
  onOpenCustomerEditor: (customer: Customer) => void;
  onOpenCustomerCreator: () => void;
  onOpenCustomersOverview: () => void;
  customerEditorDrawer: ReactNode;
}) {
  if (customerWorkspaceMode === "detail" && selectedCustomer && selectedCustomerSummary) {
    return (
      <>
        <Box className="batch-workspace-shell">
          <Stack gap="md" className="batch-screen-shell batch-detail-screen customer-screen-shell">
            <SectionCard
              title={selectedCustomerSummary.fullName}
              subtitle="Klantcontext, contactinfo, orders en opbrengsten."
              className="batch-screen-card batch-detail-hero-card"
              compact
              headerStart={
                <ActionIcon
                  variant="transparent"
                  color="gray"
                  size="md"
                  radius="xl"
                  aria-label="Terug naar klanten"
                  className="batch-detail-back-button"
                  onClick={onOpenCustomersOverview}
                >
                  <IconArrowLeft size={18} />
                </ActionIcon>
              }
              action={
                <Group gap="xs" wrap="nowrap">
                  <ToneBadge
                    color={getCustomerSummaryTone(selectedCustomerSummary)}
                    label={
                      selectedCustomerSummary.revenueAmount > 0
                        ? formatCurrency(selectedCustomerSummary.revenueAmount)
                        : `${selectedCustomerSummary.orderCount} order${selectedCustomerSummary.orderCount === 1 ? "" : "s"}`
                    }
                  />
                  <ActionIcon
                    size="lg"
                    radius="sm"
                    variant="light"
                    color="gray"
                    className="batch-toolbar-icon-button"
                    aria-label="Klant aanpassen"
                    title="Klant aanpassen"
                    onClick={() => onOpenCustomerEditor(selectedCustomer)}
                  >
                    <IconPencil size={16} />
                  </ActionIcon>
                </Group>
              }
            >
              <Box className="batch-kpi-grid">
                <Card radius="md" padding="md" className="batch-kpi-card batch-kpi-card-hero">
                  <Stack gap={6}>
                    <Text size="sm" className="muted-copy">
                      Omzet
                    </Text>
                    <Title order={1} className="batch-kpi-value">
                      {formatCurrency(selectedCustomerSummary.revenueAmount)}
                    </Title>
                  </Stack>
                </Card>
                <Card radius="md" padding="md" className="batch-kpi-card">
                  <Stack gap={6}>
                    <Text size="sm" className="muted-copy">
                      Marge
                    </Text>
                    <Title
                      order={2}
                      className={["batch-kpi-value", getMarginToneClass(selectedCustomerSummary.marginAmount)].join(" ")}
                    >
                      {formatCurrency(selectedCustomerSummary.marginAmount)}
                    </Title>
                  </Stack>
                </Card>
                <Card radius="md" padding="md" className="batch-kpi-card">
                  <Stack gap={6}>
                    <Text size="sm" className="muted-copy">
                      Orders
                    </Text>
                    <Title order={2} className="batch-kpi-value">
                      {selectedCustomerSummary.orderCount}
                    </Title>
                  </Stack>
                </Card>
                <Card radius="md" padding="md" className="batch-kpi-card">
                  <Stack gap={6}>
                    <Text size="sm" className="muted-copy">
                      Open
                    </Text>
                    <Title order={2} className="batch-kpi-value">
                      {selectedCustomerSummary.openOrderCount}
                    </Title>
                  </Stack>
                </Card>
              </Box>
            </SectionCard>

            <SectionCard
              title="Klantdetail"
              compact
              className="batch-screen-card batch-detail-static-card customer-scroll-card"
              contentClassName="batch-detail-static-content customer-scroll-card-content"
            >
              <Box className="customer-scroll-shell">
                <Stack gap="md">
                  <Card radius="md" padding="md" className="batch-summary-card">
                    <Stack gap="sm">
                      <Group justify="space-between" align="flex-start" gap="sm">
                        <Text fw={700}>Contact</Text>
                        <ToneBadge
                          color={getCustomerSummaryTone(selectedCustomerSummary)}
                          label={formatLiters(selectedCustomerSummary.litersSold)}
                        />
                      </Group>
                      <DetailRow label="Telefoon" value={selectedCustomer.phone ?? "Niet ingevuld"} />
                      <DetailRow label="E-mail" value={selectedCustomer.email ?? "Niet ingevuld"} />
                      <DetailRow
                        label="Laatste activiteit"
                        value={formatShortDate(selectedCustomerSummary.latestActivityAt)}
                      />
                    </Stack>
                  </Card>

                  {selectedCustomer.notes ? (
                    <Alert color="orange" variant="light" icon={<IconInfoCircle size={16} />}>
                      {selectedCustomer.notes}
                    </Alert>
                  ) : null}

                  <Divider />

                  <Stack gap="sm">
                    <Group justify="space-between" align="center" gap="sm">
                      <Text fw={700}>Orders</Text>
                      <Text size="sm" className="muted-copy">
                        {selectedCustomerOrders.length} totaal
                      </Text>
                    </Group>
                    {selectedCustomerOrders.length > 0 ? (
                      selectedCustomerOrders.map((order) => (
                        <SelectableCard
                          key={order.id}
                          title={order.orderNumber}
                          subtitle={`${order.batchNumber} · ${formatShortDate(order.completedAt ?? order.orderedAt)}`}
                          badge={
                            <ToneBadge
                              color={getOrderStatusColor(order.status)}
                              label={formatOrderStatus(order.status)}
                            />
                          }
                          meta={
                            <Stack gap={2}>
                              <Text size="sm" className="muted-copy">
                                {formatCurrency(order.totalAmount)} · {formatCurrency(order.marginAmount)} marge
                              </Text>
                              <Text size="sm" className="muted-copy">
                                {order.finishedGoodArticleName}
                              </Text>
                            </Stack>
                          }
                          onClick={() => onOpenOrder(order.id)}
                        />
                      ))
                    ) : (
                      <EmptyState
                        icon={<IconInfoCircle size={20} />}
                        title="Nog geen orders"
                        description="Orders van deze klant verschijnen hier zodra ze aangemaakt zijn."
                      />
                    )}
                  </Stack>

                  <Stack gap="sm">
                    <Group justify="space-between" align="center" gap="sm">
                      <Text fw={700}>Opbrengsten</Text>
                      <Text size="sm" className="muted-copy">
                        {formatCurrency(selectedCustomerSummary.revenueAmount)}
                      </Text>
                    </Group>
                    {selectedCustomerRevenueEntries.length > 0 ? (
                      selectedCustomerRevenueEntries.map((entry) => (
                        <SelectableCard
                          key={entry.id}
                          title={entry.orderNumber}
                          subtitle={`${entry.batchNumber} · ${formatShortDate(entry.recognizedAt)}`}
                          badge={<ToneBadge color="teal" label={formatCurrency(entry.totalAmount)} />}
                          meta={
                            <Stack gap={2}>
                              <Text size="sm" className="muted-copy">
                                {formatLiters(entry.litersSold)} · {entry.finishedGoodArticleName}
                              </Text>
                              <Text size="sm" className="muted-copy">
                                Opbrengst geboekt op {formatShortDate(entry.recognizedAt)}
                              </Text>
                            </Stack>
                          }
                          onClick={() => onOpenRevenueEntry(entry.id)}
                        />
                      ))
                    ) : (
                      <Alert color="teal" variant="light" icon={<IconInfoCircle size={16} />}>
                        Nog geen afgeronde orders voor deze klant, dus ook nog geen opbrengsten.
                      </Alert>
                    )}
                  </Stack>
                </Stack>
              </Box>
            </SectionCard>
          </Stack>
        </Box>

        {customerEditorDrawer}
      </>
    );
  }

  return (
    <>
      <Box className="batch-workspace-shell">
        <Stack gap="md" className="batch-screen-shell customer-screen-shell">
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
            <MetricCard
              label="Klanten"
              value={`${customerCount}`}
              meta={`${customersWithOrdersCount} met orders`}
              infoDescription="Totaal aantal klanten in de huidige database."
            />
            <MetricCard
              label="Met omzet"
              value={`${customersWithRevenueCount}`}
              meta={topRevenueCustomerName ?? "Nog geen omzet"}
              infoDescription="Aantal klanten dat al minstens één afgerond order heeft."
            />
            <MetricCard
              label="Open orders"
              value={`${totalOpenCustomerOrders}`}
              meta={`${customersWithOpenOrdersCount} klantdossiers actief`}
              infoDescription="Orders die nog niet afgerond of geannuleerd zijn."
            />
            <MetricCard
              label="Lifetime omzet"
              value={formatCurrency(totalCustomerRevenue)}
              meta={`${formatLiters(totalCustomerLitersSold)} · ${formatCurrency(totalCustomerMargin)} marge`}
              infoDescription="Totale omzet, verkocht volume en marge over alle klanten heen."
            />
          </SimpleGrid>

          <Grid gutter="md" className="customer-detail-layout">
            <Grid.Col span={12} className="batch-detail-pane">
              <SectionCard
                title="Alle klanten"
                subtitle="Gesorteerd op recentste activiteit en gerealiseerde omzet."
                compact
                action={
                  <Group gap="xs">
                    <TextInput
                      aria-label="Zoek klanten"
                      placeholder="Zoek op klantnaam"
                      value={customerSearchQuery}
                      onChange={(event) => setCustomerSearchQuery(event.currentTarget.value)}
                      className="workspace-toolbar-select"
                    />
                    <Button
                      size="xs"
                      radius="sm"
                      className="batch-toolbar-button-primary"
                      onClick={onOpenCustomerCreator}
                    >
                      Nieuwe klant
                    </Button>
                  </Group>
                }
                className="batch-screen-card batch-overview-card"
                contentClassName="batch-section-content"
              >
                <WorkspaceTableFrame
                  headClassName="customer-table-head"
                  columns={[
                    { label: "Klant" },
                    { label: "Contact" },
                    { label: "Orders", hiddenOnMobile: true },
                    { label: "Open", hiddenOnMobile: true },
                    { label: "Omzet" },
                    { label: "Marge", hiddenOnMobile: true },
                  ]}
                >
                  {searchedCustomerSummaries.length > 0 ? (
                    <WorkspaceTableRows>
                      {searchedCustomerSummaries.map((customer) => (
                        <Box
                          key={customer.id}
                          className="batch-table-row customer-table-row"
                          role="button"
                          tabIndex={0}
                          onClick={() => onOpenCustomer(customer.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onOpenCustomer(customer.id);
                            }
                          }}
                        >
                          <Box className="batch-table-cell batch-table-cell-primary" data-label="Klant">
                            <Text className="batch-table-batch-number">{customer.fullName}</Text>
                          </Box>
                          <Box className="batch-table-cell" data-label="Contact">
                            <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                              {customer.phone ?? "Geen telefoon"}
                            </Text>
                            <Text size="sm" className="batch-table-subline-muted" truncate>
                              {customer.email ?? "Geen e-mail"}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell table-mobile-hidden" data-label="Orders">
                            <Text size="sm" fw={700} className="batch-table-metric">
                              {customer.orderCount}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell table-mobile-hidden" data-label="Open">
                            <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                              {customer.openOrderCount}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell" data-label="Omzet">
                            <Text size="sm" fw={700} className="batch-table-metric">
                              {formatCurrency(customer.revenueAmount)}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell table-mobile-hidden" data-label="Marge">
                            <Text
                              size="sm"
                              fw={700}
                              className={["batch-table-metric", getMarginToneClass(customer.marginAmount)].join(" ")}
                            >
                              {formatCurrency(customer.marginAmount)}
                            </Text>
                          </Box>
                        </Box>
                      ))}
                    </WorkspaceTableRows>
                  ) : (
                    <EmptyState
                      icon={<IconInfoCircle size={20} />}
                      title={customerSearchTerm ? "Geen klanten gevonden" : "Nog geen klanten"}
                      description={
                        customerSearchTerm
                          ? "Verfijn je zoekterm om een klant op naam terug te vinden."
                          : "Zodra je een klant aanmaakt, verschijnt die hier in het overzicht."
                      }
                    />
                  )}
                </WorkspaceTableFrame>
              </SectionCard>
            </Grid.Col>
          </Grid>
        </Stack>
      </Box>

      {customerEditorDrawer}
    </>
  );
}
