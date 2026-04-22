"use client";

import {
  Alert,
  ActionIcon,
  Box,
  Button,
  Card,
  Grid,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconArrowLeft, IconInfoCircle, IconPencil } from "@tabler/icons-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import {
  Article,
  ArticleReport,
  Batch,
  Expense,
  Order,
  RatioTemplate,
  RatioTemplateLine,
  RevenueEntry,
} from "@/lib/types";
import {
  formatArticleCategory,
  formatBatchStatus,
  formatCurrency,
  formatLiters,
  formatShortDate,
  getBatchStatusColor,
} from "@/lib/ui";

import { ArticleDetailPanel, buildBatchRecommendations } from "../limoncello-workspace-support";
import { EmptyState, MetricCard, SectionCard, SelectableCard, ToneBadge } from "../workspace-primitives";
import { WorkspaceTableFrame, WorkspaceTableRows } from "../workspace-table";

type ArticleRow = {
  article: Article;
  report: ArticleReport;
};

export function ArticlesWorkspaceView({
  articleCount,
  ingredientCount,
  packagingCount,
  finishedGoodCount,
  totalPurchaseAmount,
  totalSalesAmount,
  topPurchaseArticleName,
  topSalesArticleName,
  articleWorkspaceMode,
  articleSearchQuery,
  setArticleSearchQuery,
  articleSearchTerm,
  searchedArticleRows,
  articleEditorDrawer,
  selectedArticle,
  selectedArticleReport,
  selectedArticleRatioLines,
  selectedArticleExpenses,
  selectedArticleBatches,
  selectedArticleOrders,
  selectedArticleRevenueEntries,
  ratioTemplates,
  articleDetailPanel,
  setArticleDetailPanel,
  onOpenArticlesOverview,
  onOpenArticle,
  onOpenArticleCreator,
  onOpenArticleEditor,
  onOpenRatioTemplate,
  onOpenExpensesForBatch,
  onOpenBatch,
  onOpenRevenueEntry,
}: {
  articleCount: number;
  ingredientCount: number;
  packagingCount: number;
  finishedGoodCount: number;
  totalPurchaseAmount: number;
  totalSalesAmount: number;
  topPurchaseArticleName: string | null;
  topSalesArticleName: string | null;
  articleWorkspaceMode: "overview" | "detail";
  articleSearchQuery: string;
  setArticleSearchQuery: Dispatch<SetStateAction<string>>;
  articleSearchTerm: string;
  searchedArticleRows: ArticleRow[];
  articleEditorDrawer: ReactNode;
  selectedArticle: Article | null;
  selectedArticleReport: ArticleReport | null;
  selectedArticleRatioLines: RatioTemplateLine[];
  selectedArticleExpenses: Expense[];
  selectedArticleBatches: Batch[];
  selectedArticleOrders: Order[];
  selectedArticleRevenueEntries: RevenueEntry[];
  ratioTemplates: RatioTemplate[];
  articleDetailPanel: ArticleDetailPanel;
  setArticleDetailPanel: Dispatch<SetStateAction<ArticleDetailPanel>>;
  onOpenArticlesOverview: () => void;
  onOpenArticle: (articleId: string) => void;
  onOpenArticleCreator: () => void;
  onOpenArticleEditor: (article: Article) => void;
  onOpenRatioTemplate: (templateId: string) => void;
  onOpenExpensesForBatch: (batchId: string) => void;
  onOpenBatch: (batchId: string) => void;
  onOpenRevenueEntry: (entryId: string) => void;
}) {
  if (articleWorkspaceMode === "detail" && selectedArticle) {
    return (
      <>
        <Box className="batch-workspace-shell">
          <Stack gap="md" className="batch-screen-shell batch-detail-screen customer-screen-shell">
            <SectionCard
              title={selectedArticle.name}
              subtitle={`${formatArticleCategory(selectedArticle.category)} · ${selectedArticle.sku || "Geen SKU"}`}
              className="batch-screen-card batch-detail-hero-card"
              compact
              headerStart={
                <ActionIcon
                  variant="transparent"
                  color="gray"
                  size="md"
                  radius="xl"
                  aria-label="Terug naar artikelen"
                  className="batch-detail-back-button"
                  onClick={onOpenArticlesOverview}
                >
                  <IconArrowLeft size={18} />
                </ActionIcon>
              }
              action={
                <Group gap="xs" wrap="nowrap">
                  <ToneBadge color="gray" label={selectedArticle.defaultUnit} />
                  <ActionIcon
                    size="lg"
                    radius="sm"
                    variant="light"
                    color="gray"
                    className="batch-toolbar-icon-button"
                    aria-label="Artikel aanpassen"
                    title="Artikel aanpassen"
                    onClick={() => onOpenArticleEditor(selectedArticle)}
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
                      Aankoop
                    </Text>
                    <Title order={1} className="batch-kpi-value">
                      {formatCurrency(selectedArticleReport?.totalPurchaseAmount ?? 0)}
                    </Title>
                  </Stack>
                </Card>
                <Card radius="md" padding="md" className="batch-kpi-card">
                  <Stack gap={6}>
                    <Text size="sm" className="muted-copy">
                      Verkoop
                    </Text>
                    <Title order={2} className="batch-kpi-value">
                      {formatCurrency(selectedArticleReport?.totalSalesAmount ?? 0)}
                    </Title>
                  </Stack>
                </Card>
                <Card radius="md" padding="md" className="batch-kpi-card">
                  <Stack gap={6}>
                    <Text size="sm" className="muted-copy">
                      Laatste update
                    </Text>
                    <Title order={2} className="batch-kpi-value">
                      {formatShortDate(selectedArticle.updatedAt)}
                    </Title>
                  </Stack>
                </Card>
              </Box>
            </SectionCard>

            <Grid gutter="md" className="revenue-detail-layout">
              <Grid.Col
                span={{
                  base: 12,
                  xl: selectedArticle.category === "finished_good" ? 5 : 12,
                  lg: selectedArticle.category === "finished_good" ? 5 : 12,
                }}
                className="batch-detail-pane"
              >
                <SectionCard
                  title="Artikelcontext"
                  compact
                  action={
                    <SegmentedControl
                      size="xs"
                      radius="xl"
                      value={articleDetailPanel}
                      onChange={(value) => setArticleDetailPanel(value as ArticleDetailPanel)}
                      data={[
                        { label: "Receptgebruik", value: "recipe_usage" },
                        { label: "Kosten", value: "expense_registrations" },
                      ]}
                    />
                  }
                  className="batch-screen-card batch-history-card"
                  contentClassName="batch-history-card-content"
                >
                  <Box className="revenue-insight-card-body">
                    {articleDetailPanel === "recipe_usage" ? (
                      selectedArticleRatioLines.length > 0 ? (
                        <Stack gap="sm" className="batch-history-list">
                          {selectedArticleRatioLines.map((line) => (
                            <SelectableCard
                              key={line.id}
                              title={line.articleName}
                              subtitle={`${line.quantity} ${line.unit}`}
                              meta={
                                <Text size="sm" className="muted-copy">
                                  Template · {ratioTemplates.find((template) => template.id === line.ratioTemplateId)?.name ?? "Onbekend"}
                                </Text>
                              }
                              onClick={() => onOpenRatioTemplate(line.ratioTemplateId)}
                            />
                          ))}
                        </Stack>
                      ) : (
                        <Alert color="gray" variant="light" icon={<IconInfoCircle size={16} />}>
                          Dit artikel zit nog in geen enkele recepttemplate.
                        </Alert>
                      )
                    ) : selectedArticleExpenses.length > 0 ? (
                      <Stack gap="sm" className="batch-history-list">
                        {selectedArticleExpenses.map((expense) => (
                          <SelectableCard
                            key={expense.id}
                            title={expense.batchNumber}
                            subtitle={`${formatShortDate(expense.expenseDate)} · ${expense.quantity} ${expense.unit}`}
                            badge={<ToneBadge color="orange" label={formatCurrency(expense.amount)} />}
                            meta={
                              <Text size="sm" className="muted-copy">
                                {expense.supplierName || expense.paymentMethod}
                              </Text>
                            }
                            onClick={() => onOpenExpensesForBatch(expense.batchId)}
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Alert color="gray" variant="light" icon={<IconInfoCircle size={16} />}>
                        Nog geen kosten geregistreerd voor dit artikel.
                      </Alert>
                    )}
                  </Box>
                </SectionCard>
              </Grid.Col>

              {selectedArticle.category === "finished_good" ? (
                <Grid.Col span={{ base: 12, xl: 7, lg: 7 }} className="batch-detail-pane">
                  <SectionCard
                    title="Commercieel gebruik"
                    compact
                    className="batch-screen-card batch-detail-static-card customer-scroll-card"
                    contentClassName="batch-detail-static-content customer-scroll-card-content"
                  >
                    <Box className="customer-scroll-shell">
                      <Stack gap="sm">
                        <Group justify="space-between" align="center" gap="sm">
                          <Text size="sm" className="muted-copy">
                            {selectedArticleBatches.length} batch{selectedArticleBatches.length === 1 ? "" : "es"} ·{" "}
                            {selectedArticleOrders.length} order{selectedArticleOrders.length === 1 ? "" : "s"}
                          </Text>
                          <ToneBadge color="gray" label={selectedArticle.defaultUnit} />
                        </Group>

                        {selectedArticleBatches.length > 0 ? (
                          selectedArticleBatches.map((batch) => (
                            <SelectableCard
                              key={batch.id}
                              title={batch.batchNumber}
                              subtitle={`${formatShortDate(batch.startedSteepingAt)} · ${formatLiters(batch.availableLiters)} beschikbaar`}
                              badge={
                                <ToneBadge
                                  color={getBatchStatusColor(batch.status)}
                                  label={formatBatchStatus(batch.status)}
                                />
                              }
                              meta={
                                <Stack gap={2}>
                                  <Text size="sm" className="muted-copy">
                                    {formatCurrency(batch.revenueAmount)} omzet · {formatCurrency(batch.marginAmount)} marge
                                  </Text>
                                  <Text size="sm" className="muted-copy">
                                    {batch.status === "ready" ? "Klaar voor verkoop" : buildBatchRecommendations(batch)}
                                  </Text>
                                </Stack>
                              }
                              onClick={() => onOpenBatch(batch.id)}
                            />
                          ))
                        ) : selectedArticleRevenueEntries.length > 0 ? (
                          selectedArticleRevenueEntries.map((entry) => (
                            <SelectableCard
                              key={entry.id}
                              title={entry.orderNumber}
                              subtitle={`${entry.batchNumber} · ${formatShortDate(entry.recognizedAt)}`}
                              badge={<ToneBadge color="teal" label={formatCurrency(entry.totalAmount)} />}
                              meta={
                                <Text size="sm" className="muted-copy">
                                  {formatLiters(entry.litersSold)} verkocht
                                </Text>
                              }
                              onClick={() => onOpenRevenueEntry(entry.id)}
                            />
                          ))
                        ) : (
                          <Alert color="gray" variant="light" icon={<IconInfoCircle size={16} />}>
                            Dit afgewerkte product is nog niet commercieel gebruikt.
                          </Alert>
                        )}
                      </Stack>
                    </Box>
                  </SectionCard>
                </Grid.Col>
              ) : null}
            </Grid>
          </Stack>
        </Box>

        {articleEditorDrawer}
      </>
    );
  }

  return (
    <>
      <Box className="batch-workspace-shell">
        <Stack gap="md" className="batch-screen-shell customer-screen-shell">
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
            <MetricCard
              label="Artikelen"
              value={`${articleCount}`}
              meta={`${finishedGoodCount} afgewerkte producten`}
              infoDescription="Totaal aantal artikels in masterdata."
            />
            <MetricCard
              label="Ingrediënten"
              value={`${ingredientCount}`}
              meta={`${packagingCount} verpakking`}
              infoDescription="Beschikbare ingrediënten en verpakkingsartikelen."
            />
            <MetricCard
              label="Aankoopwaarde"
              value={formatCurrency(totalPurchaseAmount)}
              meta={topPurchaseArticleName ?? "Nog geen aankopen"}
              infoDescription="Totale geregistreerde aankoopwaarde over alle artikels."
            />
            <MetricCard
              label="Verkoopwaarde"
              value={formatCurrency(totalSalesAmount)}
              meta={topSalesArticleName ?? "Nog geen verkoop"}
              infoDescription="Totale gerealiseerde verkoopwaarde over alle artikels."
            />
          </SimpleGrid>

          <Grid gutter="md" className="customer-detail-layout">
            <Grid.Col span={12} className="batch-detail-pane">
              <SectionCard
                title="Artikelen"
                subtitle="Masterdata met aankoop-, verkoop- en gebruikscontext."
                compact
                action={
                  <Group gap="xs">
                    <TextInput
                      aria-label="Zoek artikelen"
                      placeholder="Zoek op artikelnaam"
                      value={articleSearchQuery}
                      onChange={(event) => setArticleSearchQuery(event.currentTarget.value)}
                      className="workspace-toolbar-select"
                    />
                    <Button
                      size="xs"
                      radius="sm"
                      className="batch-toolbar-button-primary"
                      onClick={onOpenArticleCreator}
                    >
                      Nieuw artikel
                    </Button>
                  </Group>
                }
                className="batch-screen-card batch-overview-card"
                contentClassName="batch-section-content"
              >
                <WorkspaceTableFrame
                  headClassName="article-table-head"
                  columns={[
                    { label: "Artikel" },
                    { label: "Categorie", hiddenOnMobile: true },
                    { label: "Eenheid" },
                    { label: "Aankoop" },
                    { label: "Verkoop" },
                    { label: "Laatste update", hiddenOnMobile: true },
                  ]}
                >
                  {searchedArticleRows.length > 0 ? (
                    <WorkspaceTableRows>
                      {searchedArticleRows.map(({ article, report }) => (
                        <Box
                          key={article.id}
                          className="batch-table-row article-table-row"
                          role="button"
                          tabIndex={0}
                          onClick={() => onOpenArticle(article.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onOpenArticle(article.id);
                            }
                          }}
                        >
                          <Box className="batch-table-cell batch-table-cell-primary" data-label="Artikel">
                            <Text className="batch-table-batch-number">{report.name}</Text>
                          </Box>
                          <Box className="batch-table-cell table-mobile-hidden" data-label="Categorie">
                            <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                              {formatArticleCategory(report.category)}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell" data-label="Eenheid">
                            <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                              {report.defaultUnit}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell" data-label="Aankoop">
                            <Text size="sm" fw={700} className="batch-table-metric">
                              {formatCurrency(report.totalPurchaseAmount)}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell" data-label="Verkoop">
                            <Text size="sm" fw={700} className="batch-table-metric">
                              {formatCurrency(report.totalSalesAmount)}
                            </Text>
                          </Box>
                          <Box className="batch-table-cell table-mobile-hidden" data-label="Laatste update">
                            <Text size="sm" fw={600} className="batch-table-metric batch-table-metric-soft">
                              {formatShortDate(article.updatedAt)}
                            </Text>
                          </Box>
                        </Box>
                      ))}
                    </WorkspaceTableRows>
                  ) : (
                    <EmptyState
                      icon={<IconInfoCircle size={20} />}
                      title={articleSearchTerm ? "Geen artikelen gevonden" : "Nog geen artikelen"}
                      description="Voeg artikelen toe voor ingrediënten, verpakking en afgewerkte producten."
                    />
                  )}
                </WorkspaceTableFrame>
              </SectionCard>
            </Grid.Col>
          </Grid>
        </Stack>
      </Box>

      {articleEditorDrawer}
    </>
  );
}
