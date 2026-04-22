"use client";

import {
  Alert,
  ActionIcon,
  Box,
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconArrowLeft, IconInfoCircle, IconPencil, IconTrash } from "@tabler/icons-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import { RatioTemplate, RatioTemplateLine } from "@/lib/types";
import { formatLiters, formatShortDate } from "@/lib/ui";

import { EmptyState, InfoLabel, MetricCard, SectionCard, ToneBadge } from "../workspace-primitives";
import { WorkspaceTableFrame, WorkspaceTableRows } from "../workspace-table";

type RatioTemplateSummary = RatioTemplate & {
  lineCount: number;
  latestActivityAt: string;
};

type RatioArticleUsage = {
  articleId: string;
  articleName: string;
  usageCount: number;
};

export function RatiosWorkspaceView({
  ratioTemplateCount,
  ratioTemplateLineCount,
  ratioFinishedGoodsCount,
  averageRatioLinesPerTemplate,
  ratioAverageOutput,
  topRatioArticle,
  ratioWorkspaceMode,
  selectedRatioTemplate,
  selectedRatioLines,
  ratioTemplateSearchQuery,
  setRatioTemplateSearchQuery,
  ratioTemplateSearchTerm,
  searchedRatioTemplateSummaries,
  ratioEditorDrawers,
  onOpenRatioOverview,
  onOpenRatioTemplate,
  onOpenRatioTemplateCreator,
  onOpenRatioTemplateEditor,
  onOpenRatioLineCreator,
  onDeleteRatioLine,
}: {
  ratioTemplateCount: number;
  ratioTemplateLineCount: number;
  ratioFinishedGoodsCount: number;
  averageRatioLinesPerTemplate: number | null;
  ratioAverageOutput: number | null;
  topRatioArticle: RatioArticleUsage | null;
  ratioWorkspaceMode: "overview" | "detail";
  selectedRatioTemplate: RatioTemplate | null;
  selectedRatioLines: RatioTemplateLine[];
  ratioTemplateSearchQuery: string;
  setRatioTemplateSearchQuery: Dispatch<SetStateAction<string>>;
  ratioTemplateSearchTerm: string;
  searchedRatioTemplateSummaries: RatioTemplateSummary[];
  ratioEditorDrawers: ReactNode;
  onOpenRatioOverview: () => void;
  onOpenRatioTemplate: (templateId: string) => void;
  onOpenRatioTemplateCreator: () => void;
  onOpenRatioTemplateEditor: (template: RatioTemplate) => void;
  onOpenRatioLineCreator: (templateId: string) => void;
  onDeleteRatioLine: (lineId: string) => void;
}) {
  if (ratioWorkspaceMode === "detail" && selectedRatioTemplate) {
    return (
      <>
        <Box className="batch-workspace-shell">
          <Stack gap="md" className="batch-screen-shell batch-detail-screen ratio-screen-shell">
            <SectionCard
              title={selectedRatioTemplate.name}
              subtitle={`${selectedRatioTemplate.finishedGoodArticleName} · ${selectedRatioTemplate.expectedOutputLitersPerBaseAlcoholLiter} L output`}
              className="batch-screen-card batch-detail-hero-card"
              compact
              headerStart={
                <ActionIcon
                  variant="transparent"
                  color="gray"
                  size="md"
                  radius="xl"
                  aria-label="Terug naar templates"
                  className="batch-detail-back-button"
                  onClick={onOpenRatioOverview}
                >
                  <IconArrowLeft size={18} />
                </ActionIcon>
              }
              action={
                <Group gap="xs" wrap="nowrap">
                  <ToneBadge color="gray" label={selectedRatioTemplate.finishedGoodArticleName} />
                  <ToneBadge
                    color={selectedRatioLines.length > 0 ? "teal" : "gray"}
                    label={`${selectedRatioLines.length} regel${selectedRatioLines.length === 1 ? "" : "s"}`}
                  />
                  <ActionIcon
                    size="lg"
                    radius="sm"
                    variant="light"
                    color="gray"
                    className="batch-toolbar-icon-button"
                    aria-label="Ratio template aanpassen"
                    title="Ratio template aanpassen"
                    onClick={() => onOpenRatioTemplateEditor(selectedRatioTemplate)}
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
                      label="Verwachte output"
                      description="Verwachte output van deze template per referentiehoeveelheid alcohol."
                    />
                    <Title order={1} className="batch-kpi-value">
                      {selectedRatioTemplate.expectedOutputLitersPerBaseAlcoholLiter} L
                    </Title>
                  </Stack>
                </Card>
                <Card radius="md" padding="md" className="batch-kpi-card">
                  <Stack gap={6}>
                    <InfoLabel
                      label="Basis alcohol"
                      description="Referentiehoeveelheid alcohol waarop dit recept gebaseerd is."
                    />
                    <Title order={2} className="batch-kpi-value">
                      {selectedRatioTemplate.baseAlcoholLiters} L
                    </Title>
                  </Stack>
                </Card>
                <Card radius="md" padding="md" className="batch-kpi-card">
                  <Stack gap={6}>
                    <InfoLabel label="Ingredienten" description="Aantal ingredientregels op deze template." />
                    <Title order={2} className="batch-kpi-value">
                      {selectedRatioLines.length}
                    </Title>
                  </Stack>
                </Card>
                <Card radius="md" padding="md" className="batch-kpi-card">
                  <Stack gap={6}>
                    <InfoLabel
                      label="Laatste update"
                      description="Laatste gekende wijziging op deze recepttemplate."
                    />
                    <Title order={2} className="batch-kpi-value">
                      {formatShortDate(selectedRatioTemplate.updatedAt)}
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
                  <Box className="ratio-scroll-shell">
                    <Stack gap="md">
                      <Stack gap="xs">
                        <Text size="sm" fw={700}>Template</Text>
                        <Text size="sm" className="muted-copy">{selectedRatioTemplate.name}</Text>
                        <Text size="sm" fw={700}>Afgewerkt product</Text>
                        <Text size="sm" className="muted-copy">{selectedRatioTemplate.finishedGoodArticleName}</Text>
                        <Text size="sm" fw={700}>Basis alcohol</Text>
                        <Text size="sm" className="muted-copy">{selectedRatioTemplate.baseAlcoholLiters} L</Text>
                        <Text size="sm" fw={700}>Verwachte output</Text>
                        <Text size="sm" className="muted-copy">
                          {selectedRatioTemplate.expectedOutputLitersPerBaseAlcoholLiter} L
                        </Text>
                        <Text size="sm" fw={700}>Laatste update</Text>
                        <Text size="sm" className="muted-copy">{formatShortDate(selectedRatioTemplate.updatedAt)}</Text>
                      </Stack>
                      {selectedRatioTemplate.notes ? (
                        <Alert color="orange" variant="light" icon={<IconInfoCircle size={16} />}>
                          {selectedRatioTemplate.notes}
                        </Alert>
                      ) : (
                        <Alert color="teal" variant="light" icon={<IconInfoCircle size={16} />}>
                          Geen extra notitie op deze template. Gebruik dit veld voor receptcontext of procesafspraken.
                        </Alert>
                      )}
                    </Stack>
                  </Box>
                </SectionCard>
              </Box>

              <Box className="batch-detail-pane">
                <SectionCard
                  title="Receptregels"
                  action={
                    <Button
                      size="xs"
                      radius="sm"
                      className="batch-toolbar-button-primary"
                      onClick={() => onOpenRatioLineCreator(selectedRatioTemplate.id)}
                    >
                      Regel toevoegen
                    </Button>
                  }
                  className="batch-screen-card batch-history-card"
                  contentClassName="batch-history-card-content"
                >
                  <Box className="ratio-scroll-shell">
                    {selectedRatioLines.length > 0 ? (
                      <Stack gap="sm" className="batch-history-list">
                        {selectedRatioLines.map((line) => (
                          <Box key={line.id} className="batch-history-item">
                            <Stack gap={6}>
                              <Group justify="space-between" align="flex-start" gap="sm">
                                <Stack gap={2}>
                                  <Text fw={700}>{line.articleName}</Text>
                                  <Text size="sm" className="muted-copy">
                                    {line.quantity} {line.unit}
                                  </Text>
                                </Stack>
                                <Group gap="xs" wrap="nowrap">
                                  <Text size="sm" className="muted-copy">
                                    Toegevoegd op {formatShortDate(line.updatedAt)}
                                  </Text>
                                  <ActionIcon
                                    size="md"
                                    radius="sm"
                                    variant="light"
                                    color="red"
                                    aria-label={`Verwijder receptregel ${line.articleName}`}
                                    title="Receptregel verwijderen"
                                    onClick={() => onDeleteRatioLine(line.id)}
                                  >
                                    <IconTrash size={14} />
                                  </ActionIcon>
                                </Group>
                              </Group>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Box className="batch-panel-empty">
                        <EmptyState
                          icon={<IconInfoCircle size={20} />}
                          title="Nog geen regels"
                          description="Voeg ingredientregels toe zodat batches op dit recept kunnen steunen."
                        />
                      </Box>
                    )}
                  </Box>
                </SectionCard>
              </Box>
            </Box>
          </Stack>
        </Box>

        {ratioEditorDrawers}
      </>
    );
  }

  return (
    <>
      <Box className="batch-workspace-shell">
        <Stack gap="md" className="batch-screen-shell ratio-screen-shell">
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
            <MetricCard
              label="Templates"
              value={`${ratioTemplateCount}`}
              meta={`${ratioFinishedGoodsCount} afgewerkte producten`}
              infoDescription="Aantal actieve recepttemplates in de database."
            />
            <MetricCard
              label="Receptregels"
              value={`${ratioTemplateLineCount}`}
              meta={
                averageRatioLinesPerTemplate === null
                  ? "Nog geen templates"
                  : `${averageRatioLinesPerTemplate.toFixed(1)} per template`
              }
              infoDescription="Totaal aantal ingredientregels over alle templates heen."
            />
            <MetricCard
              label="Gem. output"
              value={ratioAverageOutput === null ? "n.v.t." : `${ratioAverageOutput.toFixed(2)} L`}
              meta="Per 1 L alcoholbasis"
              infoDescription="Gemiddelde verwachte outputfactor over alle templates."
            />
            <MetricCard
              label="Meest gebruikt artikel"
              value={topRatioArticle?.articleName ?? "Geen regels"}
              meta={
                topRatioArticle
                  ? `${topRatioArticle.usageCount} receptregel${topRatioArticle.usageCount === 1 ? "" : "s"}`
                  : "Nog geen ingredienten"
              }
              infoDescription="Artikel dat het vaakst voorkomt in receptregels."
            />
          </SimpleGrid>

          <SectionCard
            title="Templates"
            subtitle="Volledige receptbibliotheek. Klik op een template om details en receptregels te openen."
            compact
            action={
              <Group gap="xs">
                <TextInput
                  aria-label="Zoek ratio templates"
                  placeholder="Zoek op naam"
                  value={ratioTemplateSearchQuery}
                  onChange={(event) => setRatioTemplateSearchQuery(event.currentTarget.value)}
                  className="workspace-toolbar-select"
                />
                <Button
                  size="xs"
                  radius="sm"
                  className="batch-toolbar-button-primary"
                  onClick={onOpenRatioTemplateCreator}
                >
                  Nieuw template
                </Button>
              </Group>
            }
            className="batch-screen-card batch-overview-card"
            contentClassName="batch-section-content"
          >
            <WorkspaceTableFrame
              headClassName="ratio-table-head"
              columns={[
                { label: "Template" },
                { label: "Product", hiddenOnMobile: true },
                { label: "Basis alcohol", hiddenOnMobile: true },
                { label: "Output" },
                { label: "Receptregels" },
                { label: "Laatste update" },
              ]}
            >
              {searchedRatioTemplateSummaries.length > 0 ? (
                <WorkspaceTableRows>
                  {searchedRatioTemplateSummaries.map((template) => (
                    <Box
                      key={template.id}
                      className="batch-table-row ratio-table-row"
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenRatioTemplate(template.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpenRatioTemplate(template.id);
                        }
                      }}
                    >
                      <Box className="batch-table-cell batch-table-cell-primary" data-label="Template">
                        <Text className="batch-table-batch-number">{template.name}</Text>
                      </Box>
                      <Box className="batch-table-cell table-mobile-hidden" data-label="Product">
                        <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                          {template.finishedGoodArticleName}
                        </Text>
                      </Box>
                      <Box className="batch-table-cell table-mobile-hidden" data-label="Basis alcohol">
                        <Text size="sm" fw={700} className="batch-table-metric">
                          {formatLiters(template.baseAlcoholLiters)}
                        </Text>
                      </Box>
                      <Box className="batch-table-cell" data-label="Output">
                        <Text size="sm" fw={700} className="batch-table-metric">
                          {template.expectedOutputLitersPerBaseAlcoholLiter.toFixed(2)} L
                        </Text>
                      </Box>
                      <Box className="batch-table-cell" data-label="Receptregels">
                        <Text size="sm" fw={700} className="batch-table-metric batch-table-metric-soft">
                          {template.lineCount}
                        </Text>
                      </Box>
                      <Box className="batch-table-cell" data-label="Laatste update">
                        <Text size="sm" fw={600} className="batch-table-metric batch-table-metric-soft">
                          {formatShortDate(template.latestActivityAt)}
                        </Text>
                      </Box>
                    </Box>
                  ))}
                </WorkspaceTableRows>
              ) : (
                <EmptyState
                  icon={<IconInfoCircle size={20} />}
                  title={ratioTemplateSearchTerm ? "Geen templates gevonden" : "Nog geen templates"}
                  description={
                    ratioTemplateSearchTerm
                      ? "Verfijn je zoekterm om een template op naam terug te vinden."
                      : "Maak je eerste ratio template aan om batches op recepten te baseren."
                  }
                />
              )}
            </WorkspaceTableFrame>
          </SectionCard>
        </Stack>
      </Box>

      {ratioEditorDrawers}
    </>
  );
}
