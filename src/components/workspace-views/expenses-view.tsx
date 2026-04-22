"use client";

import {
  ActionIcon,
  Box,
  Button,
  Card,
  Drawer,
  Grid,
  Group,
  NativeSelect,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { IconBottle, IconInfoCircle } from "@tabler/icons-react";
import type { Dispatch, SetStateAction } from "react";

import { Article, Batch, Expense } from "@/lib/types";
import { PAYMENT_METHOD_OPTIONS, UNIT_OPTIONS, formatCurrency, formatPaymentMethod, formatShortDate } from "@/lib/ui";

import { ExpenseFormState } from "../limoncello-workspace-support";
import { DetailRow, EmptyState, InfoLabel, SectionCard, SelectableCard, ToneBadge } from "../workspace-primitives";

type AverageCostByArticle = {
  name: string;
  unit: string;
  totalAmount: number;
  totalQuantity: number;
  registrations: number;
};

export function ExpensesWorkspaceView({
  filteredExpenseTotalAmount,
  averageAlcoholCostPerLiter,
  averageCostPerOutputLiter,
  largestExpenseArticle,
  averageCostPerArticle,
  expensesFilterBatch,
  expensesBatchFilterId,
  setExpensesBatchFilterId,
  batchFilterOptions,
  filteredExpenses,
  selectedExpenseId,
  setSelectedExpenseId,
  selectedExpense,
  onOpenExpenseCreator,
  onOpenBatch,
  expenseCreateOpened,
  onCloseExpenseCreator,
  batchSelectOptions,
  articles,
  expenseForm,
  setExpenseForm,
  pendingAction,
  databaseUnavailable,
  onSubmitExpense,
}: {
  filteredExpenseTotalAmount: number;
  averageAlcoholCostPerLiter: number | null;
  averageCostPerOutputLiter: number | null;
  largestExpenseArticle: { name: string; amount: number } | null;
  averageCostPerArticle: AverageCostByArticle[];
  expensesFilterBatch: Batch | null;
  expensesBatchFilterId: string | null;
  setExpensesBatchFilterId: Dispatch<SetStateAction<string | null>>;
  batchFilterOptions: Array<{ value: string; label: string }>;
  filteredExpenses: Expense[];
  selectedExpenseId: string;
  setSelectedExpenseId: Dispatch<SetStateAction<string>>;
  selectedExpense: Expense | null;
  onOpenExpenseCreator: (preferredBatchId?: string | null) => void;
  onOpenBatch: (batchId: string) => void;
  expenseCreateOpened: boolean;
  onCloseExpenseCreator: () => void;
  batchSelectOptions: Array<{ value: string; label: string }>;
  articles: Article[];
  expenseForm: ExpenseFormState;
  setExpenseForm: Dispatch<SetStateAction<ExpenseFormState>>;
  pendingAction: string | null;
  databaseUnavailable: boolean;
  onSubmitExpense: () => void;
}) {
  return (
    <>
      <Box className="batch-workspace-shell">
        <Stack gap="md" className="batch-screen-shell expenses-screen-shell">
          <Box className="batch-overview-summary-grid">
            <Card radius="md" padding="md" className="batch-summary-card">
              <Stack gap={6}>
                <InfoLabel
                  label="Totale zichtbare kosten"
                  description="Som van alle zichtbare kosten samen binnen de huidige filter."
                />
                <Title order={2}>{formatCurrency(filteredExpenseTotalAmount)}</Title>
              </Stack>
            </Card>
            <Card radius="md" padding="md" className="batch-summary-card">
              <Stack gap={6}>
                <InfoLabel
                  label="Kost per L alcoholinput"
                  description="Alleen geregistreerde alcoholkosten gedeeld door de zichtbare liters alcohol."
                />
                <Title order={2}>
                  {averageAlcoholCostPerLiter === null
                    ? "n.v.t."
                    : `${formatCurrency(averageAlcoholCostPerLiter)}/L`}
                </Title>
              </Stack>
            </Card>
            <Card radius="md" padding="md" className="batch-summary-card">
              <Stack gap={6}>
                <InfoLabel
                  label="Kost per L output"
                  description="Zichtbare kosten gedeeld door de verwachte output van de betrokken batches."
                />
                <Title order={2}>
                  {averageCostPerOutputLiter === null
                    ? "n.v.t."
                    : `${formatCurrency(averageCostPerOutputLiter)}/L`}
                </Title>
              </Stack>
            </Card>
            <Card radius="md" padding="md" className="batch-summary-card">
              <Stack gap={6}>
                <InfoLabel
                  label="Grootste kostenpost"
                  description="Artikelgroep die momenteel het grootste deel van de zichtbare kosten draagt."
                />
                <Title order={2}>{largestExpenseArticle?.name ?? "Geen kosten"}</Title>
                <Text size="sm" className="muted-copy">
                  {largestExpenseArticle ? formatCurrency(largestExpenseArticle.amount) : "Nog geen bedrag"}
                </Text>
              </Stack>
            </Card>
          </Box>

          <Grid gutter="md" className="expenses-detail-layout">
            <Grid.Col span={{ base: 12, xl: 3 }} className="batch-detail-pane">
              <SectionCard
                title="Gemiddelde kost per artikel"
                compact
                className="batch-screen-card batch-history-card expenses-scroll-card"
                contentClassName="batch-history-card-content expenses-scroll-card-content"
              >
                <ScrollArea
                  type="always"
                  offsetScrollbars
                  scrollbars="y"
                  scrollbarSize={8}
                  className="batch-panel-feed-shell expenses-scroll-shell"
                >
                  {averageCostPerArticle.length > 0 ? (
                    <Stack gap="sm" className="batch-history-list">
                      {averageCostPerArticle.map((article) => (
                        <Box key={article.name} className="batch-history-item">
                          <Stack gap={6}>
                            <Group justify="space-between" align="flex-start" gap="sm">
                              <Text fw={700}>{article.name}</Text>
                              <Text size="sm" className="muted-copy">
                                {article.totalQuantity > 0 && article.unit
                                  ? `${formatCurrency(article.totalAmount / article.totalQuantity)}/${article.unit}`
                                  : "n.v.t."}
                              </Text>
                            </Group>
                            <Text size="sm" className="muted-copy">
                              {formatCurrency(article.totalAmount)} totaal
                              {article.totalQuantity > 0 && article.unit
                                ? ` · ${article.totalQuantity} ${article.unit}`
                                : ""}
                            </Text>
                            <Text size="sm" className="muted-copy">
                              {article.registrations} registratie{article.registrations === 1 ? "" : "s"}
                            </Text>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <EmptyState
                      icon={<IconInfoCircle size={20} />}
                      title="Nog geen artikels"
                      description="Zodra er kosten zichtbaar zijn, zie je hier de gemiddelde kost per artikel."
                    />
                  )}
                </ScrollArea>
              </SectionCard>
            </Grid.Col>
            <Grid.Col span={{ base: 12, xl: 4, lg: 7 }} className="batch-detail-pane">
              <SectionCard
                title={expensesFilterBatch ? `Kosten · ${expensesFilterBatch.batchNumber}` : "Alle kosten"}
                compact
                action={
                  <Group gap="xs" className="workspace-toolbar-group">
                    <NativeSelect
                      aria-label="Filter kosten op batch"
                      value={expensesBatchFilterId ?? ""}
                      data={batchFilterOptions}
                      onChange={(event) => {
                        const batchId = event.currentTarget.value;
                        setExpensesBatchFilterId(batchId || null);
                      }}
                      className="workspace-toolbar-select"
                    />
                    <Button
                      radius="sm"
                      className="batch-toolbar-button-primary"
                      onClick={() => onOpenExpenseCreator(expensesBatchFilterId)}
                    >
                      Nieuwe kost
                    </Button>
                  </Group>
                }
                className="batch-screen-card batch-detail-static-card expenses-scroll-card"
                contentClassName="batch-detail-static-content expenses-scroll-card-content"
              >
                <ScrollArea
                  type="always"
                  offsetScrollbars
                  scrollbars="y"
                  scrollbarSize={8}
                  className="batch-list-scroll expenses-scroll-shell"
                >
                  <Stack gap="sm">
                    {filteredExpenses.length > 0 ? (
                      filteredExpenses.map((expense) => (
                        <SelectableCard
                          key={expense.id}
                          selected={expense.id === selectedExpenseId}
                          title={expense.articleName}
                          subtitle={`${expense.batchNumber} · ${formatShortDate(expense.expenseDate)}`}
                          badge={
                            <ToneBadge
                              color={expense.paymentMethod === "cash" ? "orange" : "blue"}
                              label={formatCurrency(expense.amount)}
                            />
                          }
                          meta={
                            <Stack gap={2}>
                              <Text size="sm" className="muted-copy">
                                {formatPaymentMethod(expense.paymentMethod)}
                                {expense.supplierName ? ` · ${expense.supplierName}` : ""}
                              </Text>
                              <Text size="sm" className="muted-copy">
                                {expense.quantity && expense.unit
                                  ? `${expense.quantity} ${expense.unit}`
                                  : "Geen hoeveelheid ingevuld"}
                              </Text>
                            </Stack>
                          }
                          onClick={() => setSelectedExpenseId(expense.id)}
                        />
                      ))
                    ) : (
                      <EmptyState
                        icon={<IconInfoCircle size={20} />}
                        title={expensesFilterBatch ? "Geen kosten voor deze batch" : "Nog geen kosten"}
                        description={
                          expensesFilterBatch
                            ? "Pas de filter aan of registreer meteen een nieuwe kost voor deze batch."
                            : "Registreer de eerste kosten om batchmarges te kunnen zien."
                        }
                      />
                    )}
                  </Stack>
                </ScrollArea>
              </SectionCard>
            </Grid.Col>
            <Grid.Col span={{ base: 12, xl: 5, lg: 5 }} className="batch-detail-pane">
              <SectionCard
                title="Kostdetail"
                compact
                className="batch-screen-card batch-history-card"
                contentClassName="batch-history-card-content"
              >
                <Box className="batch-panel-feed-shell">
                  {selectedExpense ? (
                    <Stack gap="sm" style={{ width: "100%" }}>
                      <Group justify="space-between" align="flex-start" gap="sm">
                        <Stack gap={2}>
                          <Text fw={700}>{selectedExpense.articleName}</Text>
                          <Text size="sm" className="muted-copy">
                            {selectedExpense.batchNumber}
                          </Text>
                        </Stack>
                        <ToneBadge
                          color={selectedExpense.paymentMethod === "cash" ? "orange" : "blue"}
                          label={formatCurrency(selectedExpense.amount)}
                        />
                      </Group>
                      <DetailRow label="Datum" value={formatShortDate(selectedExpense.expenseDate)} />
                      <DetailRow
                        label="Hoeveelheid"
                        value={
                          selectedExpense.quantity && selectedExpense.unit
                            ? `${selectedExpense.quantity} ${selectedExpense.unit}`
                            : "Niet ingevuld"
                        }
                      />
                      <DetailRow
                        label="Betaalmethode"
                        value={formatPaymentMethod(selectedExpense.paymentMethod)}
                      />
                      <DetailRow
                        label="Leverancier"
                        value={selectedExpense.supplierName ?? "Niet ingevuld"}
                      />
                      <DetailRow
                        label="Laatste update"
                        value={formatShortDate(selectedExpense.updatedAt.slice(0, 10))}
                      />
                      <Group gap="xs" className="batch-detail-actions">
                        <ActionIcon
                          size="lg"
                          radius="sm"
                          variant="light"
                          color="sage"
                          className="batch-context-icon-button"
                          aria-label="Batch openen"
                          title="Batch openen"
                          onClick={() => onOpenBatch(selectedExpense.batchId)}
                        >
                          <IconBottle size={18} />
                        </ActionIcon>
                      </Group>
                      {selectedExpense.notes ? (
                        <Box className="order-detail-inline-note">
                          <Text size="sm" className="muted-copy">
                            {selectedExpense.notes}
                          </Text>
                        </Box>
                      ) : null}
                    </Stack>
                  ) : (
                    <EmptyState
                      icon={<IconInfoCircle size={20} />}
                      title="Geen kost geselecteerd"
                      description="Kies links een kost om details en context te zien."
                    />
                  )}
                </Box>
              </SectionCard>
            </Grid.Col>
          </Grid>
        </Stack>
      </Box>

      <Drawer
        opened={expenseCreateOpened}
        onClose={onCloseExpenseCreator}
        position="right"
        size="32rem"
        title="Nieuwe kost"
      >
        <Stack gap="sm">
          <NativeSelect
            label="Batch"
            data={batchSelectOptions}
            value={expenseForm.batchId}
            onChange={(event) => {
              const batchId = event.currentTarget.value;
              setExpenseForm((current) => ({ ...current, batchId }));
            }}
          />
          <NativeSelect
            label="Artikel"
            data={articles.map((article) => ({
              value: article.id,
              label: article.name,
            }))}
            value={expenseForm.articleId}
            onChange={(event) => {
              const articleId = event.currentTarget.value;
              const article = articles.find((item) => item.id === articleId);
              setExpenseForm((current) => ({
                ...current,
                articleId,
                unit: article?.defaultUnit ?? current.unit,
              }));
            }}
          />
          <Group grow>
            <TextInput
              label="Datum"
              type="date"
              value={expenseForm.expenseDate}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setExpenseForm((current) => ({
                  ...current,
                  expenseDate: value,
                }));
              }}
            />
            <TextInput
              label="Bedrag"
              type="number"
              step="0.01"
              value={expenseForm.amount}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setExpenseForm((current) => ({ ...current, amount: value }));
              }}
            />
          </Group>
          <Group grow>
            <TextInput
              label="Hoeveelheid"
              type="number"
              step="0.1"
              value={expenseForm.quantity}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setExpenseForm((current) => ({ ...current, quantity: value }));
              }}
            />
            <NativeSelect
              label="Eenheid"
              data={UNIT_OPTIONS}
              value={expenseForm.unit}
              onChange={(event) => {
                const value = event.currentTarget.value as ExpenseFormState["unit"];
                setExpenseForm((current) => ({
                  ...current,
                  unit: value,
                }));
              }}
            />
          </Group>
          <NativeSelect
            label="Betaalmethode"
            data={PAYMENT_METHOD_OPTIONS}
            value={expenseForm.paymentMethod}
            onChange={(event) => {
              const value = event.currentTarget.value as ExpenseFormState["paymentMethod"];
              setExpenseForm((current) => ({
                ...current,
                paymentMethod: value,
              }));
            }}
          />
          <TextInput
            label="Leverancier"
            value={expenseForm.supplierName}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setExpenseForm((current) => ({
                ...current,
                supplierName: value,
              }));
            }}
          />
          <Textarea
            label="Notitie"
            minRows={3}
            value={expenseForm.notes}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setExpenseForm((current) => ({ ...current, notes: value }));
            }}
          />
          <Button
            loading={pendingAction === "Kost opgeslagen"}
            disabled={databaseUnavailable}
            className="batch-toolbar-button-primary"
            onClick={onSubmitExpense}
          >
            Kost registreren
          </Button>
        </Stack>
      </Drawer>
    </>
  );
}
