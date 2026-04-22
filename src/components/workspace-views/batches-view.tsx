"use client";

import {
  ActionIcon,
  Box,
  Button,
  Card,
  Group,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { IconArrowLeft, IconBottle, IconInfoCircle, IconPencil, IconTrash } from "@tabler/icons-react";
import type { Dispatch, SetStateAction } from "react";

import { Batch, BatchStatus, BatchStatusHistoryItem } from "@/lib/types";
import { BATCH_STATUS_OPTIONS, formatBatchStatus, formatCurrency, formatLiters, formatShortDate, getBatchStatusColor } from "@/lib/ui";

import { BatchFormState, BatchWorkspaceMode, EditorMode } from "../limoncello-workspace-support";
import { DetailRow, EmptyState, InfoLabel, SectionCard, ToneBadge } from "../workspace-primitives";
import { WorkspaceTableFrame, WorkspaceTableRows } from "../workspace-table";

export function BatchesWorkspaceView({
  batchWorkspaceMode,
  batchEditorCopy,
  batchEditorMode,
  editingBatchId,
  batchCount,
  batchForm,
  setBatchForm,
  ratioTemplateOptions,
  selectedBatchTemplateSummary,
  selectedBatch,
  selectedBatchOrdersCount,
  selectedBatchExpensesCount,
  selectedBatchRevenueCount,
  selectedBatchReservedOrdersCount,
  selectedBatchHistory,
  readyBatchCount,
  steepingBatchCount,
  soldOutBatchCount,
  visibleAvailableLiters,
  visibleBatchesMissingActualOutputCount,
  batchSearchQuery,
  setBatchSearchQuery,
  showArchivedBatches,
  setShowArchivedBatches,
  archivedBatchCount,
  batchSearchTerm,
  filteredVisibleBatches,
  batchActualProducedInputs,
  setBatchActualProducedInputs,
  databaseUnavailable,
  pendingAction,
  onBatchTemplateChange,
  onBatchAlcoholInputChange,
  onSubmitBatch,
  onCommitBatchActualProduced,
  onResetBatchActualProducedInput,
  onOpenBatchOverview,
  onOpenBatch,
  onOpenBatchCreator,
  onOpenBatchEditor,
  onOpenOrdersForBatch,
  onOpenExpensesForBatch,
  onOpenRevenueForBatch,
  onUpdateBatchStatus,
  onDeleteBatch,
}: {
  batchWorkspaceMode: BatchWorkspaceMode;
  batchEditorCopy: { title: string; submit: string; success: string; subtitle?: string };
  batchEditorMode: EditorMode;
  editingBatchId: string | null;
  batchCount: number;
  batchForm: BatchFormState;
  setBatchForm: Dispatch<SetStateAction<BatchFormState>>;
  ratioTemplateOptions: Array<{ value: string; label: string }>;
  selectedBatchTemplateSummary: string | null;
  selectedBatch: Batch | null;
  selectedBatchOrdersCount: number;
  selectedBatchExpensesCount: number;
  selectedBatchRevenueCount: number;
  selectedBatchReservedOrdersCount: number;
  selectedBatchHistory: BatchStatusHistoryItem[];
  readyBatchCount: number;
  steepingBatchCount: number;
  soldOutBatchCount: number;
  visibleAvailableLiters: number;
  visibleBatchesMissingActualOutputCount: number;
  batchSearchQuery: string;
  setBatchSearchQuery: Dispatch<SetStateAction<string>>;
  showArchivedBatches: boolean;
  setShowArchivedBatches: Dispatch<SetStateAction<boolean>>;
  archivedBatchCount: number;
  batchSearchTerm: string;
  filteredVisibleBatches: Batch[];
  batchActualProducedInputs: Record<string, string>;
  setBatchActualProducedInputs: Dispatch<SetStateAction<Record<string, string>>>;
  databaseUnavailable: boolean;
  pendingAction: string | null;
  onBatchTemplateChange: (templateId: string) => void;
  onBatchAlcoholInputChange: (value: string) => void;
  onSubmitBatch: () => void;
  onCommitBatchActualProduced: (batch: Batch) => Promise<void>;
  onResetBatchActualProducedInput: (batch: Batch) => void;
  onOpenBatchOverview: () => void;
  onOpenBatch: (batchId: string) => void;
  onOpenBatchCreator: () => void;
  onOpenBatchEditor: (batch: Batch) => void;
  onOpenOrdersForBatch: (batchId: string) => void;
  onOpenExpensesForBatch: (batchId: string) => void;
  onOpenRevenueForBatch: (batchId: string) => void;
  onUpdateBatchStatus: (batchId: string, status: BatchStatus) => void;
  onDeleteBatch: (batchId: string) => void;
}) {
  const latestHistory = selectedBatchHistory[0] ?? null;

  if (batchWorkspaceMode === "create") {
    return (
      <Box className="batch-workspace-shell">
        <Stack gap="md" className="batch-screen-shell">
          <SectionCard
            title={batchEditorCopy.title}
            subtitle={batchEditorCopy.subtitle}
            headerStart={
              batchCount > 0 ? (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  radius="xl"
                  size="lg"
                  className="batch-detail-back-button"
                  aria-label="Terug naar batches"
                  onClick={() =>
                    batchEditorMode === "edit" && editingBatchId
                      ? onOpenBatch(editingBatchId)
                      : onOpenBatchOverview()
                  }
                >
                  <IconArrowLeft size={18} />
                </ActionIcon>
              ) : undefined
            }
            className="batch-screen-card"
          >
            <Stack gap="md">
              <NativeSelect
                label="Ratio template"
                data={ratioTemplateOptions}
                value={batchForm.ratioTemplateId}
                onChange={(event) => onBatchTemplateChange(event.currentTarget.value)}
              />
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                <TextInput
                  label="Startdatum"
                  type="date"
                  value={batchForm.startedSteepingAt}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setBatchForm((current) => ({
                      ...current,
                      startedSteepingAt: value,
                    }));
                  }}
                />
                <TextInput
                  label="Trekdagen"
                  type="number"
                  min="0"
                  value={batchForm.steepDays}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setBatchForm((current) => ({ ...current, steepDays: value }));
                  }}
                />
                <TextInput
                  label="Alcohol input (L)"
                  type="number"
                  step="0.1"
                  value={batchForm.alcoholInputLiters}
                  onChange={(event) => onBatchAlcoholInputChange(event.currentTarget.value)}
                />
                <TextInput
                  label="Verwachte output (L)"
                  type="number"
                  step="0.1"
                  value={batchForm.expectedOutputLiters}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setBatchForm((current) => ({
                      ...current,
                      expectedOutputLiters: value,
                    }));
                  }}
                />
                <TextInput
                  label="Prijs per liter"
                  type="number"
                  step="0.01"
                  value={batchForm.unitPricePerLiter}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setBatchForm((current) => ({
                      ...current,
                      unitPricePerLiter: value,
                    }));
                  }}
                />
                <NativeSelect
                  label="Startstatus"
                  data={BATCH_STATUS_OPTIONS}
                  value={batchForm.status}
                  onChange={(event) => {
                    const value = event.currentTarget.value as BatchStatus;
                    setBatchForm((current) => ({
                      ...current,
                      status: value,
                    }));
                  }}
                />
              </SimpleGrid>
              <Textarea
                label="Notitie"
                minRows={3}
                value={batchForm.notes}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setBatchForm((current) => ({ ...current, notes: value }));
                }}
              />
              {selectedBatchTemplateSummary ? (
                <Text size="sm" className="muted-copy">
                  {selectedBatchTemplateSummary}
                </Text>
              ) : null}
              <Button
                loading={pendingAction === batchEditorCopy.success}
                disabled={databaseUnavailable}
                onClick={onSubmitBatch}
              >
                {batchEditorCopy.submit}
              </Button>
            </Stack>
          </SectionCard>
        </Stack>
      </Box>
    );
  }

  if (batchWorkspaceMode === "detail" && selectedBatch) {
    return (
      <Box className="batch-workspace-shell">
        <Stack gap="md" className="batch-screen-shell batch-detail-screen">
          <SectionCard
            title={selectedBatch.batchNumber}
            subtitle={`${selectedBatch.finishedGoodArticleName} - ${selectedBatch.ratioTemplateName}`}
            className="batch-screen-card batch-detail-hero-card"
            compact
            headerStart={
              <ActionIcon
                variant="transparent"
                color="gray"
                size="md"
                radius="xl"
                aria-label="Terug naar batches"
                className="batch-detail-back-button"
                onClick={onOpenBatchOverview}
              >
                <IconArrowLeft size={18} />
              </ActionIcon>
            }
            action={
              <Group gap="xs" wrap="nowrap">
                <ToneBadge color="gray" label={selectedBatch.finishedGoodArticleName} />
                <ToneBadge
                  color={getBatchStatusColor(selectedBatch.status)}
                  label={formatBatchStatus(selectedBatch.status)}
                />
                <ActionIcon
                  size="lg"
                  radius="sm"
                  variant="light"
                  color="gray"
                  className="batch-toolbar-icon-button"
                  aria-label="Batch aanpassen"
                  title="Batch aanpassen"
                  onClick={() => onOpenBatchEditor(selectedBatch)}
                >
                  <IconPencil size={16} />
                </ActionIcon>
              </Group>
            }
          >
            <Box className="batch-kpi-grid">
              <Card radius="md" padding="md" className="batch-kpi-card batch-kpi-card-hero">
                <Stack gap={6}>
                  <InfoLabel
                    label="Beschikbaar"
                    description="Beschikbaar volume is wat nog vrij is voor nieuwe orders. We nemen eerst het effectief geproduceerde volume als dat ingevuld is, anders de verwachte output, en trekken daar verkocht en gereserveerd volume vanaf."
                  />
                  <Title order={1} className="batch-kpi-value">
                    {formatLiters(selectedBatch.availableLiters)}
                  </Title>
                </Stack>
              </Card>
              <Card radius="md" padding="md" className="batch-kpi-card">
                <Stack gap={6}>
                  <InfoLabel
                    label="Geproduceerd"
                    description="Dit is het effectief geproduceerde aantal liters van deze batch. Als dit nog niet ingevuld is, blijft de batch werken op basis van de verwachte output."
                  />
                  <Title order={2} className="batch-kpi-value">
                    {selectedBatch.actualProducedLiters ? formatLiters(selectedBatch.actualProducedLiters) : "Nog open"}
                  </Title>
                </Stack>
              </Card>
              <Card radius="md" padding="md" className="batch-kpi-card">
                <Stack gap={6}>
                  <InfoLabel
                    label="Verkocht"
                    description="Verkocht volume telt alleen liters mee uit orders die afgerond zijn en dus ook als opbrengst geboekt werden op deze batch."
                  />
                  <Title order={2} className="batch-kpi-value">
                    {formatLiters(selectedBatch.soldLiters)}
                  </Title>
                </Stack>
              </Card>
              <Card radius="md" padding="md" className="batch-kpi-card">
                <Stack gap={6}>
                  <InfoLabel
                    label="Omzet"
                    description="Omzet is de som van alle opbrengsten die effectief op deze batch gerealiseerd zijn via afgeronde orders."
                  />
                  <Title order={2} className="batch-kpi-value">
                    {formatCurrency(selectedBatch.revenueAmount)}
                  </Title>
                </Stack>
              </Card>
              <Card radius="md" padding="md" className="batch-kpi-card">
                <Stack gap={6}>
                  <Group justify="space-between" gap="sm">
                    <InfoLabel
                      label="Marge"
                      description="Marge is omzet min alle geregistreerde batchkosten. Een negatieve marge betekent dat de batch momenteel meer kost dan ze heeft opgebracht."
                    />
                    <ToneBadge
                      color={selectedBatch.marginAmount >= 0 ? "teal" : "red"}
                      label={selectedBatch.marginAmount >= 0 ? "Positief" : "Onder water"}
                    />
                  </Group>
                  <Title order={2} className="batch-kpi-value">
                    {formatCurrency(selectedBatch.marginAmount)}
                  </Title>
                </Stack>
              </Card>
            </Box>
            <Box className="batch-kpi-strip">
              <Box className="batch-kpi-strip-item">
                <InfoLabel
                  label="Verwacht"
                  size="xs"
                  description="Dit is de verwachte output waarmee de batch gestart is, berekend op basis van alcohol input en het gekozen ratio template."
                />
                <Text fw={700}>{formatLiters(selectedBatch.expectedOutputLiters)}</Text>
              </Box>
              <Box className="batch-kpi-strip-item">
                <InfoLabel
                  label="Kosten"
                  size="xs"
                  description="Kosten is de som van alle geregistreerde uitgaven die aan deze batch gekoppeld zijn, zoals alcohol, fruit, flessen of verpakking."
                />
                <Text fw={700}>{formatCurrency(selectedBatch.costAmount)}</Text>
              </Box>
              <Box className="batch-kpi-strip-item">
                <InfoLabel
                  label="Prijs per liter"
                  size="xs"
                  description="Dit is de standaardprijs per liter van de batch. Bij het aanmaken van een order wordt deze prijs overgenomen zodat historische orders correct blijven."
                />
                <Text fw={700}>{formatCurrency(selectedBatch.unitPricePerLiter)}</Text>
              </Box>
              <Box className="batch-kpi-strip-item">
                <InfoLabel
                  label="Template"
                  size="xs"
                  description="Het template toont op welk ratio recept deze batch gebaseerd is. Het bepaalt onder meer de verwachte output bij de start van de batch."
                />
                <Text fw={700} truncate>
                  {selectedBatch.ratioTemplateName}
                </Text>
              </Box>
            </Box>
          </SectionCard>

          <Box className="batch-detail-layout">
            <Box className="batch-detail-pane">
              <SectionCard
                title="Details"
                className="batch-screen-card batch-detail-static-card"
                contentClassName="batch-detail-static-content"
              >
                <Box className="batch-panel-layout">
                  <Group gap="xs" className="batch-detail-actions">
                    <Button
                      size="xs"
                      radius="sm"
                      variant="light"
                      color="sage"
                      className="batch-context-button"
                      onClick={() => onOpenOrdersForBatch(selectedBatch.id)}
                    >
                      Orders ({selectedBatchOrdersCount})
                    </Button>
                    <Button
                      size="xs"
                      radius="sm"
                      variant="light"
                      color="sage"
                      className="batch-context-button"
                      onClick={() => onOpenExpensesForBatch(selectedBatch.id)}
                    >
                      Kosten ({selectedBatchExpensesCount})
                    </Button>
                    <Button
                      size="xs"
                      radius="sm"
                      variant="light"
                      color="sage"
                      className="batch-context-button"
                      onClick={() => onOpenRevenueForBatch(selectedBatch.id)}
                    >
                      Opbrengsten ({selectedBatchRevenueCount})
                    </Button>
                  </Group>
                  <Box className="batch-panel-auto-grid batch-panel-grow">
                    <Box className="batch-panel-block">
                      <Stack gap="xs">
                        <Text fw={700}>Batchinfo</Text>
                        <DetailRow label="Product" value={selectedBatch.finishedGoodArticleName} />
                        <DetailRow label="Template" value={selectedBatch.ratioTemplateName} />
                        <DetailRow label="Aangemaakt" value={formatShortDate(selectedBatch.createdAt.slice(0, 10))} />
                        <DetailRow label="Status" value={formatBatchStatus(selectedBatch.status)} />
                      </Stack>
                    </Box>
                    <Box className="batch-panel-block">
                      <Stack gap="xs">
                        <Text fw={700}>Productieritme</Text>
                        <DetailRow label="Start steeping" value={formatShortDate(selectedBatch.startedSteepingAt)} />
                        <DetailRow label="Steeping tot" value={formatShortDate(selectedBatch.steepingUntil)} />
                        <DetailRow label="Klaar sinds" value={formatShortDate(selectedBatch.readyAt)} />
                        <DetailRow label="Trekdagen" value={String(selectedBatch.steepDays)} />
                      </Stack>
                    </Box>
                    <Box className="batch-panel-block">
                      <Stack gap="xs">
                        <Text fw={700}>Recept & volume</Text>
                        <DetailRow label="Alcohol input" value={formatLiters(selectedBatch.alcoholInputLiters)} />
                        <DetailRow label="Verwacht volume" value={formatLiters(selectedBatch.expectedOutputLiters)} />
                        <DetailRow
                          label="Effectief geproduceerd"
                          value={
                            selectedBatch.actualProducedLiters
                              ? formatLiters(selectedBatch.actualProducedLiters)
                              : "Nog open"
                          }
                        />
                        <DetailRow label="Prijs per liter" value={formatCurrency(selectedBatch.unitPricePerLiter)} />
                      </Stack>
                    </Box>
                    <Box className="batch-panel-block">
                      <Stack gap="xs">
                        <Text fw={700}>Commercieel</Text>
                        <DetailRow label="Besteld" value={formatLiters(selectedBatch.orderedLiters)} />
                        <DetailRow label="Gereserveerd" value={formatLiters(selectedBatch.reservedLiters)} />
                        <DetailRow
                          label="Reservaties"
                          value={`${selectedBatchReservedOrdersCount} order${selectedBatchReservedOrdersCount === 1 ? "" : "s"}`}
                        />
                        <DetailRow label="Verkocht" value={formatLiters(selectedBatch.soldLiters)} />
                        <DetailRow label="Nog bestelbaar" value={formatLiters(selectedBatch.bookableLiters)} />
                        <DetailRow label="Beschikbaar" value={formatLiters(selectedBatch.availableLiters)} />
                        <DetailRow label="Marge" value={formatCurrency(selectedBatch.marginAmount)} />
                      </Stack>
                    </Box>
                  </Box>
                </Box>
              </SectionCard>
            </Box>
            <Box className="batch-detail-pane">
              <SectionCard
                title="Historiek"
                className="batch-screen-card batch-history-card"
                contentClassName="batch-history-card-content"
              >
                <Box className="batch-panel-layout batch-history-panel">
                  <Box className="batch-panel-stat-grid">
                    <Box className="batch-panel-block">
                      <Stack gap="xs">
                        <Text fw={700}>Statuswissels</Text>
                        <Title order={3}>{selectedBatchHistory.length}</Title>
                      </Stack>
                    </Box>
                    <Box className="batch-panel-block">
                      <Stack gap="xs">
                        <Text fw={700}>Huidige status</Text>
                        <Title order={3}>{formatBatchStatus(selectedBatch.status)}</Title>
                      </Stack>
                    </Box>
                    <Box className="batch-panel-block">
                      <Stack gap="xs">
                        <Text fw={700}>Laatste wijziging</Text>
                        <Title order={3}>
                          {latestHistory ? formatShortDate(latestHistory.changedAt.slice(0, 10)) : "Nog leeg"}
                        </Title>
                      </Stack>
                    </Box>
                  </Box>
                  <Box className="batch-panel-feed-shell">
                    {selectedBatchHistory.length > 0 ? (
                      <Stack gap="sm" className="batch-history-list">
                        {selectedBatchHistory.map((item) => (
                          <Box key={item.id} className="batch-history-item">
                            <Stack gap={4}>
                              <Text fw={700}>{formatBatchStatus(item.toStatus)}</Text>
                              <Text size="sm" className="muted-copy">
                                {formatShortDate(item.changedAt.slice(0, 10))}
                              </Text>
                              {item.fromStatus ? (
                                <Text size="sm" className="muted-copy">
                                  Van {formatBatchStatus(item.fromStatus)}
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
                          description="Zodra statussen wijzigen verschijnt hier de historiek."
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
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
            <Stack gap="sm">
              <InfoLabel
                label="Status"
                description="Deze verdeling toont hoeveel zichtbare batches momenteel klaar zijn, aan het trekken zijn of uitverkocht zijn."
              />
              <Box className="batch-summary-status-grid">
                <Box className="batch-summary-status-item">
                  <InfoLabel
                    label="Klaar"
                    size="xs"
                    description="Batches met status klaar zijn productiegewijs afgerond en beschikbaar voor orders."
                  />
                  <Text className="batch-summary-status-value">{readyBatchCount}</Text>
                </Box>
                <Box className="batch-summary-status-item">
                  <InfoLabel
                    label="Aan het trekken"
                    size="xs"
                    description="Batches met deze status zitten nog in hun steeping-periode en zijn nog niet klaar voor verkoop."
                  />
                  <Text className="batch-summary-status-value">{steepingBatchCount}</Text>
                </Box>
                <Box className="batch-summary-status-item">
                  <InfoLabel
                    label="Uitverkocht"
                    size="xs"
                    description="Uitverkochte batches hebben geen beschikbaar volume meer voor nieuwe orders."
                  />
                  <Text className="batch-summary-status-value">{soldOutBatchCount}</Text>
                </Box>
              </Box>
            </Stack>
          </Card>
          <Card radius="md" padding="md" className="batch-summary-card">
            <Stack gap={6}>
              <InfoLabel
                label="Beschikbaar volume"
                description="Beschikbaar volume is de som van het vrije volume uit alle zichtbare batches samen."
              />
              <Title order={2}>{formatLiters(visibleAvailableLiters)}</Title>
            </Stack>
          </Card>
          <Card radius="md" padding="md" className="batch-summary-card">
            <Stack gap={6}>
              <InfoLabel
                label="Output open"
                description="Output open telt batches waar de effectieve productie nog niet manueel werd ingevuld."
              />
              <Title order={2}>{visibleBatchesMissingActualOutputCount}</Title>
            </Stack>
          </Card>
        </Box>

        <SectionCard
          title="Batches"
          action={
            <Group gap="xs">
              <TextInput
                aria-label="Zoek batches"
                placeholder="Zoek batch"
                value={batchSearchQuery}
                onChange={(event) => setBatchSearchQuery(event.currentTarget.value)}
                className="workspace-toolbar-select"
              />
              {archivedBatchCount > 0 ? (
                <Button
                  size="xs"
                  radius="sm"
                  variant="subtle"
                  color="gray"
                  className={
                    showArchivedBatches
                      ? "batch-toolbar-button batch-toolbar-button-active"
                      : "batch-toolbar-button"
                  }
                  onClick={() => setShowArchivedBatches((current) => !current)}
                >
                  {showArchivedBatches ? "Verberg archief" : `Toon archief (${archivedBatchCount})`}
                </Button>
              ) : null}
              <Button
                size="xs"
                radius="sm"
                variant="subtle"
                color="gray"
                className="batch-toolbar-button batch-toolbar-button-primary"
                onClick={onOpenBatchCreator}
              >
                Nieuwe batch
              </Button>
            </Group>
          }
          className="batch-screen-card batch-overview-card"
          contentClassName="batch-section-content"
        >
          <WorkspaceTableFrame
            columns={[
              { label: "Batch" },
              { label: "Status" },
              { label: "Type" },
              { label: "Steeping tot", hiddenOnMobile: true },
              { label: "Geproduceerd", hiddenOnMobile: true },
              { label: "Beschikbaar" },
              { label: "Verkocht", hiddenOnMobile: true },
              { label: "Marge" },
              { label: "Acties", hiddenOnMobile: true },
            ]}
          >
            {filteredVisibleBatches.length > 0 ? (
              <WorkspaceTableRows>
                {filteredVisibleBatches.map((batch) => {
                  const statusTone = getBatchStatusColor(batch.status);
                  const batchStatusSelectId = `batch-status-${batch.id}`;
                  const batchActualProducedInputId = `batch-output-${batch.id}`;

                  return (
                    <Box
                      key={batch.id}
                      className="batch-table-row"
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
                      <Box className="batch-table-cell batch-table-cell-mobile-full" data-label="Status">
                        <Group gap={8} wrap="nowrap" className="batch-table-status">
                          <Box className={`batch-status-dot batch-status-dot-${statusTone}`} />
                          <NativeSelect
                            id={batchStatusSelectId}
                            aria-label={`Status voor ${batch.batchNumber}`}
                            size="xs"
                            radius="md"
                            value={batch.status}
                            data={BATCH_STATUS_OPTIONS}
                            disabled={databaseUnavailable || pendingAction === "Batchstatus bijgewerkt"}
                            className={`batch-table-select batch-table-select-tag batch-table-select-tag-${statusTone}`}
                            onClick={(event) => event.stopPropagation()}
                            onMouseDown={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                            onChange={(event) => {
                              event.stopPropagation();
                              const nextStatus = event.currentTarget.value as BatchStatus;

                              if (nextStatus === batch.status) {
                                return;
                              }

                              onUpdateBatchStatus(batch.id, nextStatus);
                            }}
                          />
                        </Group>
                      </Box>
                      <Box className="batch-table-cell" data-label="Type">
                        <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                          {batch.finishedGoodArticleName}
                        </Text>
                      </Box>
                      <Box className="batch-table-cell table-mobile-hidden" data-label="Steeping tot">
                        <Text size="sm" fw={600} className="batch-table-metric batch-table-metric-soft">
                          {formatShortDate(batch.steepingUntil)}
                        </Text>
                      </Box>
                      <Box className="batch-table-cell table-mobile-hidden" data-label="Geproduceerd">
                        <TextInput
                          id={batchActualProducedInputId}
                          aria-label={`Effectieve output voor ${batch.batchNumber}`}
                          size="xs"
                          radius="md"
                          type="number"
                          step="0.1"
                          inputMode="decimal"
                          value={batchActualProducedInputs[batch.id] ?? ""}
                          disabled={databaseUnavailable || pendingAction === "Effectieve output bijgewerkt"}
                          className="batch-table-input"
                          onClick={(event) => event.stopPropagation()}
                          onMouseDown={(event) => event.stopPropagation()}
                          onFocus={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            event.stopPropagation();
                            const value = event.currentTarget.value;
                            setBatchActualProducedInputs((current) => ({
                              ...current,
                              [batch.id]: value,
                            }));
                          }}
                          onBlur={() => {
                            void onCommitBatchActualProduced(batch);
                          }}
                          onKeyDown={(event) => {
                            event.stopPropagation();

                            if (event.key === "Enter") {
                              event.preventDefault();
                              event.currentTarget.blur();
                            }

                            if (event.key === "Escape") {
                              event.preventDefault();
                              onResetBatchActualProducedInput(batch);
                              event.currentTarget.blur();
                            }
                          }}
                        />
                      </Box>
                      <Box className="batch-table-cell" data-label="Beschikbaar">
                        <Text size="sm" fw={700} className="batch-table-metric">
                          {formatLiters(batch.availableLiters)}
                        </Text>
                      </Box>
                      <Box className="batch-table-cell table-mobile-hidden" data-label="Verkocht">
                        <Text size="sm" fw={600} className="batch-table-metric batch-table-metric-soft">
                          {formatLiters(batch.soldLiters)}
                        </Text>
                      </Box>
                      <Box className="batch-table-cell" data-label="Marge">
                        <Text
                          size="sm"
                          fw={700}
                          className="batch-table-metric"
                          c={batch.marginAmount >= 0 ? "teal.8" : "red.7"}
                        >
                          {formatCurrency(batch.marginAmount)}
                        </Text>
                      </Box>
                      <Box className="batch-table-cell batch-table-cell-actions table-mobile-hidden" data-label="Acties">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          radius="md"
                          aria-label={`Verwijder ${batch.batchNumber}`}
                          disabled={databaseUnavailable || pendingAction === "Batch verwijderd"}
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteBatch(batch.id);
                          }}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Box>
                    </Box>
                  );
                })}
              </WorkspaceTableRows>
            ) : archivedBatchCount > 0 && !showArchivedBatches ? (
              <EmptyState
                icon={<IconBottle size={20} />}
                title="Archief is verborgen"
                description="Toon het archief om ook gearchiveerde batches terug te zien."
              />
            ) : batchSearchTerm ? (
              <EmptyState
                icon={<IconInfoCircle size={20} />}
                title="Geen batches gevonden"
                description="Pas je zoekterm aan om opnieuw batches in de lijst te zien."
              />
            ) : (
              <EmptyState
                icon={<IconBottle size={20} />}
                title="Nog geen batches"
                description="Maak je eerste batch aan om productie, kosten en orders te koppelen."
              />
            )}
          </WorkspaceTableFrame>
        </SectionCard>
      </Stack>
    </Box>
  );
}
