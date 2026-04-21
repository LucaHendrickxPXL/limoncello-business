"use client";

import {
  Box,
  Button,
  Card,
  Grid,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconChartBar, IconHome2, IconBottle, IconReceipt2, IconShoppingBag, IconUsers } from "@tabler/icons-react";
import { ReactNode } from "react";

import { WorkspaceData } from "@/lib/types";
import { formatLiters } from "@/lib/ui";

import { EmptyState, MetricCard, SectionCard, SelectableCard } from "../workspace-primitives";

export type WorkspaceSignal = {
  id: string;
  title: string;
  subtitle: string;
  badge: ReactNode;
  meta: string;
  onClick: () => void;
};

export function HomeView({
  data,
  lowAvailabilityCount,
  batchesMissingActualOutputCount,
  signals,
  onOpenBatchCreator,
  onOpenOrderCreator,
  onOpenExpenseCreator,
  onOpenCustomerCreator,
  onOpenDashboard,
}: {
  data: WorkspaceData;
  lowAvailabilityCount: number;
  batchesMissingActualOutputCount: number;
  signals: WorkspaceSignal[];
  onOpenBatchCreator: () => void;
  onOpenOrderCreator: () => void;
  onOpenExpenseCreator: () => void;
  onOpenCustomerCreator: () => void;
  onOpenDashboard: () => void;
}) {
  const homeQuickActions = [
    {
      key: "batch",
      label: "Nieuwe batch",
      description: "Start een nieuwe productieflow",
      icon: <IconBottle size={18} />,
      onClick: onOpenBatchCreator,
    },
    {
      key: "order",
      label: "Nieuw order",
      description: "Boek verkoop op een batch",
      icon: <IconShoppingBag size={18} />,
      onClick: onOpenOrderCreator,
    },
    {
      key: "expense",
      label: "Nieuwe kost",
      description: "Registreer aankoop of verpakking",
      icon: <IconReceipt2 size={18} />,
      onClick: onOpenExpenseCreator,
    },
    {
      key: "customer",
      label: "Nieuwe klant",
      description: "Voeg een nieuwe relatie toe",
      icon: <IconUsers size={18} />,
      onClick: onOpenCustomerCreator,
    },
  ];
  const homeSignals = signals.slice(0, 3);

  return (
    <Box className="home-shell">
      <Stack gap="md" className="home-desktop-only">
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md">
          <MetricCard
            label="Beschikbaar volume"
            value={formatLiters(data.dashboard.totalAvailableLiters)}
            meta={`${data.dashboard.activeBatchCount} actieve batches`}
            infoDescription="Liters die nog niet verkocht of gereserveerd zijn."
          />
          <MetricCard
            label="Open orders"
            value={`${data.dashboard.ordersInProgressCount + data.dashboard.ordersReadyCount}`}
            meta={`${data.dashboard.ordersReadyCount} klaar voor levering`}
            infoDescription="Orders die nog opvolging vragen in de flow."
          />
          <MetricCard
            label="Output checks"
            value={`${batchesMissingActualOutputCount}`}
            meta="Batches zonder effectieve output"
            infoDescription="Werk deze batches bij om voorraad en marge correct te houden."
          />
          <MetricCard
            label="Bijna leeg"
            value={`${lowAvailabilityCount}`}
            meta="Batches onder 2 liter beschikbaar"
            infoDescription="Helpt om tijdig nieuwe productie of opvolging te plannen."
          />
        </SimpleGrid>

        <Grid gutter="md" align="stretch" className="home-desktop-layout">
          <Grid.Col span={{ base: 12, xl: 4 }}>
            <SectionCard title="Snel starten" className="workspace-card">
              <Stack gap="xs" className="home-action-list">
                {homeQuickActions.map((action) => (
                  <Button
                    key={action.key}
                    variant="subtle"
                    radius="xl"
                    size="md"
                    className="home-desktop-action-button"
                    leftSection={action.icon}
                    justify="space-between"
                    onClick={action.onClick}
                  >
                    {action.label}
                  </Button>
                ))}
              </Stack>
              <Button
                variant="light"
                radius="xl"
                leftSection={<IconChartBar size={18} />}
                onClick={onOpenDashboard}
              >
                Open dashboard
              </Button>
            </SectionCard>
          </Grid.Col>

          <Grid.Col span={{ base: 12, xl: 8 }}>
            <SectionCard title="Signal Center" className="workspace-card">
              <Stack gap="sm">
                {homeSignals.length > 0 ? (
                  homeSignals.map((signal) => (
                    <SelectableCard
                      key={signal.id}
                      title={signal.title}
                      subtitle={signal.subtitle}
                      badge={signal.badge}
                      meta={<Text size="sm" className="muted-copy">{signal.meta}</Text>}
                      onClick={signal.onClick}
                    />
                  ))
                ) : (
                  <EmptyState
                    icon={<IconHome2 size={20} />}
                    title="Rustig moment"
                    description="Er staan geen dringende aandachtspunten open."
                  />
                )}
              </Stack>
            </SectionCard>
          </Grid.Col>
        </Grid>
      </Stack>

      <Stack gap="md" className="home-mobile-only">
        <SimpleGrid cols={2} spacing="md">
          {homeQuickActions.map((action) => (
            <Card
              key={action.key}
              radius="lg"
              padding="lg"
              className="workspace-card home-mobile-action-card"
              style={{ cursor: "pointer" }}
              onClick={action.onClick}
            >
              <Stack gap="sm" align="flex-start">
                <ThemeIcon radius="md" size="lg" className="workspace-brand-icon">
                  {action.icon}
                </ThemeIcon>
                <Stack gap={2}>
                  <Text fw={700}>{action.label}</Text>
                  <Text size="sm" className="muted-copy">
                    {action.description}
                  </Text>
                </Stack>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        <SectionCard title="Signal Center">
          <Stack gap="sm">
            {homeSignals.length > 0 ? (
              homeSignals.map((signal) => (
                <SelectableCard
                  key={signal.id}
                  title={signal.title}
                  subtitle={signal.subtitle}
                  badge={signal.badge}
                  meta={<Text size="sm" className="muted-copy">{signal.meta}</Text>}
                  onClick={signal.onClick}
                />
              ))
            ) : (
              <EmptyState
                icon={<IconHome2 size={20} />}
                title="Rustig moment"
                description="Er staan geen dringende aandachtspunten open."
              />
            )}
          </Stack>
        </SectionCard>
      </Stack>
    </Box>
  );
}
