"use client";

import {
  Alert,
  ActionIcon,
  Box,
  Button,
  Card,
  Divider,
  Group,
  NativeSelect,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBottle,
  IconInfoCircle,
  IconPencil,
  IconShoppingBag,
  IconUser,
} from "@tabler/icons-react";
import type { Dispatch, SetStateAction } from "react";

import { Batch, Order, OrderStatus, OrderStatusHistoryItem } from "@/lib/types";
import {
  ORDER_STATUS_OPTIONS,
  formatCurrency,
  formatLiters,
  formatOrderStatus,
  formatShortDate,
  getOrderStatusColor,
} from "@/lib/ui";

import {
  EditorMode,
  OrderFormState,
  OrderWorkspaceMode,
  getMarginToneClass,
  getOrderReservationCopy,
  orderStatusReservesBatchCapacity,
} from "../limoncello-workspace-support";
import { DetailRow, EmptyState, InfoLabel, SectionCard, ToneBadge } from "../workspace-primitives";
import { WorkspaceTableFrame, WorkspaceTableRows } from "../workspace-table";

export function OrdersWorkspaceView({
  databaseUnavailable,
  pendingAction,
  orderEditorCopy,
  orderEditorMode,
  editingOrderId,
  orderWorkspaceMode,
  orderForm,
  setOrderForm,
  showCompletedOrders,
  setShowCompletedOrders,
  orderSearchQuery,
  setOrderSearchQuery,
  batchSelectOptions,
  customerOptions,
  ordersBatchFilterId,
  setOrdersBatchFilterId,
  ordersFilterBatch,
  completedOrderCount,
  openOrderCount,
  openOrderLiters,
  filteredOrderMarginAmount,
  orderSearchTerm,
  searchedVisibleOrders,
  filteredOrders,
  visibleOrders,
  selectedOrder,
  selectedOrderBatch,
  selectedOrderDetailBatch,
  selectedOrderHistory,
  onOpenOrdersOverview,
  onOpenOrder,
  onOpenBatch,
  onOpenCustomer,
  onOpenOrderEditor,
  onOpenOrderCreator,
  onUpdateOrderStatus,
  onSubmitOrder,
}: {
  databaseUnavailable: boolean;
  pendingAction: string | null;
  orderEditorCopy: { title: string; submit: string; success: string; subtitle?: string };
  orderEditorMode: EditorMode;
  editingOrderId: string | null;
  orderWorkspaceMode: OrderWorkspaceMode;
  orderForm: OrderFormState;
  setOrderForm: Dispatch<SetStateAction<OrderFormState>>;
  showCompletedOrders: boolean;
  setShowCompletedOrders: Dispatch<SetStateAction<boolean>>;
  orderSearchQuery: string;
  setOrderSearchQuery: Dispatch<SetStateAction<string>>;
  batchSelectOptions: Array<{ value: string; label: string }>;
  customerOptions: Array<{ value: string; label: string }>;
  ordersBatchFilterId: string | null;
  setOrdersBatchFilterId: Dispatch<SetStateAction<string | null>>;
  ordersFilterBatch: Batch | null;
  completedOrderCount: number;
  openOrderCount: number;
  openOrderLiters: number;
  filteredOrderMarginAmount: number;
  orderSearchTerm: string;
  searchedVisibleOrders: Order[];
  filteredOrders: Order[];
  visibleOrders: Order[];
  selectedOrder: Order | null;
  selectedOrderBatch: Batch | null;
  selectedOrderDetailBatch: Batch | null;
  selectedOrderHistory: OrderStatusHistoryItem[];
  onOpenOrdersOverview: () => void;
  onOpenOrder: (orderId: string) => void;
  onOpenBatch: (batchId: string) => void;
  onOpenCustomer: (customerId: string) => void;
  onOpenOrderEditor: (order: Order) => void;
  onOpenOrderCreator: () => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onSubmitOrder: () => void;
}) {
  const detailPanel = selectedOrder ? (
    <Box className="batch-panel-layout">
      <Group gap="xs" className="batch-detail-actions">
        <ActionIcon
          size="lg"
          radius="sm"
          variant="light"
          color="sage"
          className="batch-context-icon-button"
          aria-label="Batch openen"
          title="Batch openen"
          onClick={() => onOpenBatch(selectedOrder.batchId)}
        >
          <IconBottle size={18} />
        </ActionIcon>
        <ActionIcon
          size="lg"
          radius="sm"
          variant="light"
          color="sage"
          className="batch-context-icon-button"
          aria-label="Klant openen"
          title="Klant openen"
          onClick={() => onOpenCustomer(selectedOrder.customerId)}
        >
          <IconUser size={18} />
        </ActionIcon>
        <ActionIcon
          size="lg"
          radius="sm"
          variant="light"
          color="gray"
          className="batch-context-icon-button"
          aria-label="Order aanpassen"
          title="Order aanpassen"
          onClick={() => onOpenOrderEditor(selectedOrder)}
        >
          <IconPencil size={16} />
        </ActionIcon>
      </Group>
      <Box className="batch-panel-auto-grid batch-panel-grow">
        <Box className="batch-panel-block">
          <Stack gap="xs">
            <Text fw={700}>Orderinfo</Text>
            <DetailRow label="Klant" value={selectedOrder.customerName} />
            <DetailRow label="Batch" value={selectedOrder.batchNumber} />
            {selectedOrderDetailBatch ? (
              <Box className="order-detail-inline-note">
                <Stack gap={2}>
                  <Text size="sm" fw={600}>
                    Nog bestelbaar: {formatLiters(selectedOrderDetailBatch.bookableLiters)}
                  </Text>
                  <Text size="sm" className="muted-copy">
                    Vrij voor reservatie: {formatLiters(selectedOrderDetailBatch.availableLiters)}
                  </Text>
                </Stack>
              </Box>
            ) : null}
            <DetailRow label="Product" value={selectedOrder.finishedGoodArticleName} />
            <DetailRow label="Volume" value={formatLiters(selectedOrder.orderedLiters)} />
            <DetailRow label="Prijs per liter" value={formatCurrency(selectedOrder.unitPricePerLiter)} />
            <DetailRow label="Totaal" value={formatCurrency(selectedOrder.totalAmount)} />
            <DetailRow label="Kost" value={formatCurrency(selectedOrder.costAmount)} />
            <DetailRow label="Marge" value={formatCurrency(selectedOrder.marginAmount)} />
            <DetailRow
              label="Reservatie"
              value={getOrderReservationCopy(selectedOrder.status, selectedOrder.orderedLiters)}
            />
            <DetailRow label="Besteld op" value={formatShortDate(selectedOrder.orderedAt)} />
            <DetailRow label="Afgerond op" value={formatShortDate(selectedOrder.completedAt)} />
            {selectedOrder.notes ? (
              <>
                <Divider my="xs" />
                <Text size="sm" className="muted-copy">
                  {selectedOrder.notes}
                </Text>
              </>
            ) : null}
          </Stack>
        </Box>
      </Box>
    </Box>
  ) : null;

  const historyPanel = selectedOrder ? (
    <Box className="batch-history-panel">
      <Box className="batch-panel-feed-shell">
        {selectedOrderHistory.length > 0 ? (
          <Stack gap="sm" className="batch-history-list">
            {selectedOrderHistory.map((item) => (
              <Box key={item.id} className="batch-history-item">
                <Stack gap={6}>
                  <Group justify="space-between" align="flex-start" gap="sm">
                    <Text fw={700}>{formatOrderStatus(item.toStatus)}</Text>
                    <Text size="sm" className="muted-copy">
                      {formatShortDate(item.changedAt.slice(0, 10))}
                    </Text>
                  </Group>
                  {item.fromStatus ? (
                    <Text size="sm" className="muted-copy">
                      Van {formatOrderStatus(item.fromStatus)}
                    </Text>
                  ) : null}
                  {item.note ? (
                    <Text size="sm" className="muted-copy">
                      {item.note}
                    </Text>
                  ) : null}
                </Stack>
              </Box>
            ))}
          </Stack>
        ) : (
          <Box className="batch-panel-empty">
            <EmptyState
              icon={<IconInfoCircle size={20} />}
              title="Nog geen historiek"
              description="Statuswijzigingen van dit order verschijnen hier."
            />
          </Box>
        )}
      </Box>
    </Box>
  ) : null;

  const createPanel = (
    <SectionCard
      title={orderEditorCopy.title}
      className="batch-screen-card"
      subtitle={orderEditorCopy.subtitle}
      headerStart={
        <ActionIcon
          variant="transparent"
          color="gray"
          size="md"
          radius="xl"
          aria-label="Terug naar orders"
          className="batch-detail-back-button"
          onClick={() =>
            orderEditorMode === "edit" && editingOrderId ? onOpenOrder(editingOrderId) : onOpenOrdersOverview()
          }
        >
          <IconArrowLeft size={18} />
        </ActionIcon>
      }
    >
      <Stack gap="sm">
        {orderEditorMode === "edit" ? (
          <TextInput
            label="Ordernummer"
            value={orderForm.orderNumber}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setOrderForm((current) => ({ ...current, orderNumber: value }));
            }}
          />
        ) : null}
        <NativeSelect
          label="Klant"
          data={customerOptions}
          value={orderForm.customerId}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setOrderForm((current) => ({ ...current, customerId: value }));
          }}
        />
        <NativeSelect
          label="Batch"
          data={batchSelectOptions}
          value={orderForm.batchId}
          onChange={(event) => {
            const batchId = event.currentTarget.value;
            setOrderForm((current) => ({ ...current, batchId }));
          }}
        />
        <Group grow>
          <TextInput
            label="Liters"
            type="number"
            step="0.1"
            value={orderForm.orderedLiters}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setOrderForm((current) => ({ ...current, orderedLiters: value }));
            }}
          />
          <TextInput
            label="Orderdatum"
            type="date"
            value={orderForm.orderedAt}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setOrderForm((current) => ({ ...current, orderedAt: value }));
            }}
          />
        </Group>
        <NativeSelect
          label="Status"
          data={ORDER_STATUS_OPTIONS}
          value={orderForm.status}
          onChange={(event) => {
            const value = event.currentTarget.value as OrderStatus;
            setOrderForm((current) => ({
              ...current,
              status: value,
            }));
          }}
        />
        <Textarea
          label="Notitie"
          minRows={3}
          value={orderForm.notes}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setOrderForm((current) => ({ ...current, notes: value }));
          }}
        />
        <Alert color="orange" variant="light" icon={<IconInfoCircle size={16} />}>
          {selectedOrderBatch ? (
            <Stack gap={2}>
              <Text size="sm">
                Batchprijs: {formatCurrency(selectedOrderBatch.unitPricePerLiter)} per liter
              </Text>
              <Text size="sm">Nog bestelbaar: {formatLiters(selectedOrderBatch.bookableLiters)}</Text>
              <Text size="sm">Vrij voor reservatie: {formatLiters(selectedOrderBatch.availableLiters)}</Text>
              <Text size="sm">
                Reservatie:{" "}
                {orderStatusReservesBatchCapacity(orderForm.status)
                  ? `${formatLiters(Number(orderForm.orderedLiters || 0))} wordt vastgezet op deze batch`
                  : orderForm.status === "afgerond"
                    ? "Volume wordt als verkoop geboekt bij afronden"
                    : "Status besteld telt wel mee tegen de verwachte output, maar houdt nog geen batchvolume vast"}
              </Text>
              <Text size="sm">
                Geschat bedrag:{" "}
                {formatCurrency(Number(orderForm.orderedLiters || 0) * selectedOrderBatch.unitPricePerLiter)}
              </Text>
            </Stack>
          ) : (
            <Text size="sm">Kies eerst een batch om het bedrag te zien.</Text>
          )}
        </Alert>
        <Button
          loading={pendingAction === orderEditorCopy.success}
          disabled={databaseUnavailable}
          className="batch-toolbar-button-primary"
          onClick={onSubmitOrder}
        >
          {orderEditorCopy.submit}
        </Button>
      </Stack>
    </SectionCard>
  );

  if (orderWorkspaceMode === "create") {
    return (
      <Box className="batch-workspace-shell">
        <Stack gap="md" className="batch-screen-shell">
          {createPanel}
        </Stack>
      </Box>
    );
  }

  if (orderWorkspaceMode === "detail" && selectedOrder) {
    return (
      <Box className="batch-workspace-shell">
        <Stack gap="md" className="batch-screen-shell batch-detail-screen">
          <SectionCard
            title={selectedOrder.orderNumber}
            subtitle={`${selectedOrder.customerName} · ${selectedOrder.finishedGoodArticleName}`}
            className="batch-screen-card batch-detail-hero-card"
            compact
            headerStart={
              <ActionIcon
                variant="transparent"
                color="gray"
                size="md"
                radius="xl"
                aria-label="Terug naar orders"
                className="batch-detail-back-button"
                onClick={onOpenOrdersOverview}
              >
                <IconArrowLeft size={18} />
              </ActionIcon>
            }
            action={
              <Group gap="xs" wrap="nowrap">
                <ToneBadge color="gray" label={selectedOrder.batchNumber} />
                <ToneBadge
                  color={getOrderStatusColor(selectedOrder.status)}
                  label={formatOrderStatus(selectedOrder.status)}
                />
                <ActionIcon
                  size="lg"
                  radius="sm"
                  variant="light"
                  color="gray"
                  className="batch-toolbar-icon-button"
                  aria-label="Order aanpassen"
                  title="Order aanpassen"
                  onClick={() => onOpenOrderEditor(selectedOrder)}
                >
                  <IconPencil size={16} />
                </ActionIcon>
              </Group>
            }
          >
            <Box className="batch-kpi-grid">
              <Card radius="md" padding="md" className="batch-kpi-card batch-kpi-card-hero">
                <Stack gap={6}>
                  <Text size="sm" fw={700} className="muted-copy">
                    Totaal
                  </Text>
                  <Title order={1} className="batch-kpi-value">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </Title>
                </Stack>
              </Card>
              <Card radius="md" padding="md" className="batch-kpi-card">
                <Stack gap={6}>
                  <Text size="sm" fw={700} className="muted-copy">
                    Volume
                  </Text>
                  <Title order={2} className="batch-kpi-value">
                    {formatLiters(selectedOrder.orderedLiters)}
                  </Title>
                </Stack>
              </Card>
              <Card radius="md" padding="md" className="batch-kpi-card">
                <Stack gap={6}>
                  <InfoLabel
                    label="Prijs per liter"
                    description="Deze prijs wordt op het order vastgezet zodat historiek stabiel blijft."
                  />
                  <Title order={2} className="batch-kpi-value">
                    {formatCurrency(selectedOrder.unitPricePerLiter)}
                  </Title>
                </Stack>
              </Card>
              <Card radius="md" padding="md" className="batch-kpi-card">
                <Stack gap={6}>
                  <InfoLabel
                    label="Nog bestelbaar"
                    description="Resterend volume op basis van verwachte output, open orders en afgeronde verkoop."
                  />
                  <Title order={2} className="batch-kpi-value">
                    {selectedOrderDetailBatch
                      ? formatLiters(selectedOrderDetailBatch.bookableLiters)
                      : "Niet gevonden"}
                  </Title>
                </Stack>
              </Card>
              <Card radius="md" padding="md" className="batch-kpi-card">
                <Stack gap={6}>
                  <Text size="sm" fw={700} className="muted-copy">
                    Marge
                  </Text>
                  <Title
                    order={2}
                    className={["batch-kpi-value", getMarginToneClass(selectedOrder.marginAmount)].join(" ")}
                  >
                    {formatCurrency(selectedOrder.marginAmount)}
                  </Title>
                </Stack>
              </Card>
            </Box>
          </SectionCard>

          <Box className="batch-detail-layout">
            <Box className="batch-detail-pane">
              <SectionCard
                title="Details"
                className="batch-screen-card batch-detail-static-card"
                contentClassName="batch-detail-static-content"
              >
                {detailPanel}
              </SectionCard>
            </Box>
            <Box className="batch-detail-pane">
              <SectionCard
                title="Historiek"
                className="batch-screen-card batch-history-card"
                contentClassName="batch-history-card-content"
              >
                {historyPanel}
              </SectionCard>
            </Box>
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box className="batch-workspace-shell">
      <Stack gap="md" className="batch-screen-shell">
        <Box className="batch-overview-summary-grid">
          <Card radius="md" padding="md" className="batch-summary-card">
            <Stack gap={6}>
              <Text size="sm" fw={700} className="muted-copy">
                Open volume
              </Text>
              <Title order={2}>{formatLiters(openOrderLiters)}</Title>
            </Stack>
          </Card>
          <Card radius="md" padding="md" className="batch-summary-card">
            <Stack gap={6}>
              <Text size="sm" fw={700} className="muted-copy">
                Open orders
              </Text>
              <Title order={2}>{openOrderCount}</Title>
            </Stack>
          </Card>
          <Card radius="md" padding="md" className="batch-summary-card">
            <Stack gap={6}>
              <Text size="sm" fw={700} className="muted-copy">
                Ordermarge
              </Text>
              <Title order={2} className={getMarginToneClass(filteredOrderMarginAmount)}>
                {formatCurrency(filteredOrderMarginAmount)}
              </Title>
            </Stack>
          </Card>
        </Box>

        <SectionCard
          title="Orders"
          subtitle={
            ordersFilterBatch
              ? `Gefilterd op ${ordersFilterBatch.batchNumber}`
              : "Volg statussen, batchkoppeling en verkoopmomenten in één werkruimte."
          }
          action={
            <Group gap="xs">
              <TextInput
                aria-label="Zoek orders"
                placeholder="Zoek order, batch of klant"
                value={orderSearchQuery}
                onChange={(event) => setOrderSearchQuery(event.currentTarget.value)}
                className="workspace-toolbar-select"
              />
              {completedOrderCount > 0 ? (
                <Button
                  size="xs"
                  radius="sm"
                  variant="subtle"
                  color="gray"
                  className={
                    showCompletedOrders
                      ? "batch-toolbar-button batch-toolbar-button-active"
                      : "batch-toolbar-button"
                  }
                  onClick={() => setShowCompletedOrders((current) => !current)}
                >
                  {showCompletedOrders ? "Verberg afgerond" : `Toon afgerond (${completedOrderCount})`}
                </Button>
              ) : null}
              {ordersFilterBatch ? (
                <Button
                  size="xs"
                  radius="sm"
                  variant="subtle"
                  color="gray"
                  className="batch-toolbar-button"
                  onClick={() => setOrdersBatchFilterId(null)}
                >
                  Wis batchfilter
                </Button>
              ) : null}
              <Button
                size="xs"
                radius="sm"
                className="batch-toolbar-button-primary"
                onClick={onOpenOrderCreator}
              >
                Nieuw order
              </Button>
            </Group>
          }
          className="batch-screen-card batch-overview-card"
          contentClassName="batch-section-content"
        >
          <WorkspaceTableFrame
            headClassName="order-table-head"
            columns={[
              { label: "Order" },
              { label: "Status" },
              { label: "Klant" },
              { label: "Batch" },
              { label: "Volume" },
              { label: "Totaal" },
              { label: "Marge" },
            ]}
          >
            {searchedVisibleOrders.length > 0 ? (
              <WorkspaceTableRows>
                {searchedVisibleOrders.map((order) => {
                  const statusTone = getOrderStatusColor(order.status);

                  return (
                    <Box
                      key={order.id}
                      className="batch-table-row order-table-row"
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenOrder(order.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpenOrder(order.id);
                        }
                      }}
                    >
                      <Box className="batch-table-cell batch-table-cell-primary" data-label="Order">
                        <Text className="batch-table-batch-number">{order.orderNumber}</Text>
                      </Box>
                      <Box className="batch-table-cell batch-table-cell-mobile-full" data-label="Status">
                        <Group gap={8} wrap="nowrap" className="batch-table-status">
                          <Box className={`batch-status-dot batch-status-dot-${statusTone}`} />
                          <NativeSelect
                            aria-label={`Status voor ${order.orderNumber}`}
                            size="xs"
                            radius="md"
                            value={order.status}
                            data={ORDER_STATUS_OPTIONS}
                            disabled={databaseUnavailable || pendingAction === "Orderstatus bijgewerkt"}
                            className={`batch-table-select batch-table-select-tag batch-table-select-tag-${statusTone}`}
                            onClick={(event) => event.stopPropagation()}
                            onMouseDown={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                            onChange={(event) => {
                              event.stopPropagation();
                              const nextStatus = event.currentTarget.value as OrderStatus;

                              if (nextStatus === order.status) {
                                return;
                              }

                              onUpdateOrderStatus(order.id, nextStatus);
                            }}
                          />
                        </Group>
                      </Box>
                      <Box className="batch-table-cell" data-label="Klant">
                        <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                          {order.customerName}
                        </Text>
                      </Box>
                      <Box className="batch-table-cell" data-label="Batch">
                        <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                          {order.batchNumber}
                        </Text>
                      </Box>
                      <Box className="batch-table-cell" data-label="Volume">
                        <Text size="sm" fw={700} className="batch-table-metric">
                          {formatLiters(order.orderedLiters)}
                        </Text>
                      </Box>
                      <Box className="batch-table-cell" data-label="Totaal">
                        <Text size="sm" fw={700} className="batch-table-metric">
                          {formatCurrency(order.totalAmount)}
                        </Text>
                      </Box>
                      <Box className="batch-table-cell" data-label="Marge">
                        <Text
                          size="sm"
                          fw={700}
                          className={["batch-table-metric", getMarginToneClass(order.marginAmount)].join(" ")}
                        >
                          {formatCurrency(order.marginAmount)}
                        </Text>
                      </Box>
                    </Box>
                  );
                })}
              </WorkspaceTableRows>
            ) : orderSearchTerm ? (
              <EmptyState
                icon={<IconShoppingBag size={20} />}
                title="Geen orders gevonden"
                description="Pas je zoekterm aan om opnieuw orders in de lijst te zien."
              />
            ) : completedOrderCount > 0 && !showCompletedOrders ? (
              <EmptyState
                icon={<IconShoppingBag size={20} />}
                title="Afgeronde orders zijn verborgen"
                description="Gebruik de filter rechtsboven om ook afgeronde orders terug te zien."
              />
            ) : ordersFilterBatch ? (
              <EmptyState
                icon={<IconShoppingBag size={20} />}
                title="Nog geen orders op deze batch"
                description="Je kan vanuit deze context meteen een nieuw order voor deze batch toevoegen."
              />
            ) : (
              <EmptyState
                icon={<IconShoppingBag size={20} />}
                title="Nog geen orders"
                description="Nieuwe orders verschijnen hier zodra ze aangemaakt zijn."
              />
            )}
          </WorkspaceTableFrame>
        </SectionCard>
      </Stack>
    </Box>
  );
}
