"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Card,
  Group,
  Popover,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { ReactNode, useState } from "react";

export function InfoLabel({
  label,
  description,
  size = "sm",
}: {
  label: string;
  description: string;
  size?: "xs" | "sm";
}) {
  const [opened, setOpened] = useState(false);
  const [pinned, setPinned] = useState(false);

  function open() {
    setOpened(true);
  }

  function close() {
    if (!pinned) {
      setOpened(false);
    }
  }

  function togglePinned() {
    setPinned((current) => {
      const next = !current;
      setOpened(next);
      return next;
    });
  }

  return (
    <Group gap={6} wrap="nowrap" className="kpi-label-group">
      <Text size={size} fw={700} className="muted-copy">
        {label}
      </Text>
      <Popover
        width={240}
        position="bottom-start"
        withArrow
        shadow="md"
        opened={opened}
        onChange={(next) => {
          setOpened(next);

          if (!next) {
            setPinned(false);
          }
        }}
      >
        <Popover.Target>
          <ActionIcon
            size={size === "xs" ? "sm" : "md"}
            radius="sm"
            variant="subtle"
            color="gray"
            className="kpi-info-button"
            aria-label={`Meer uitleg over ${label}`}
            onMouseEnter={open}
            onMouseLeave={close}
            onFocus={open}
            onBlur={close}
            onClick={(event) => {
              event.stopPropagation();
              togglePinned();
            }}
          >
            <IconInfoCircle size={size === "xs" ? 13 : 14} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown className="kpi-info-popover" onMouseEnter={open} onMouseLeave={close}>
          <Text size="sm" c="#344054">
            {description}
          </Text>
        </Popover.Dropdown>
      </Popover>
    </Group>
  );
}

export function SectionCard({
  title,
  headerStart,
  action,
  compact,
  className,
  contentClassName,
  hideHeader,
  onClick,
  children,
}: {
  title: string;
  subtitle?: string;
  headerStart?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
  contentClassName?: string;
  hideHeader?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Card
      radius="lg"
      padding={compact ? "md" : "lg"}
      className={["workspace-card", className].filter(Boolean).join(" ")}
      style={{ cursor: onClick ? "pointer" : undefined }}
      onClick={onClick}
    >
      <Stack
        gap={compact ? "sm" : "md"}
        className={contentClassName}
      >
        {hideHeader ? null : (
          <Group justify="space-between" align="flex-start" gap="sm">
            <Group align="flex-start" gap="sm" wrap="nowrap">
              {headerStart}
              <Stack gap={compact ? 2 : 4}>
                <Title order={compact ? 4 : 3}>{title}</Title>
              </Stack>
            </Group>
            {action}
          </Group>
        )}
        {children}
      </Stack>
    </Card>
  );
}

export function MetricCard({
  label,
  value,
  tone,
  meta,
  infoDescription,
  valueClassName,
}: {
  label: string;
  value: string;
  tone?: ReactNode;
  meta?: string;
  infoDescription?: string;
  valueClassName?: string;
}) {
  return (
    <Card radius="lg" padding="lg" className="workspace-card">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start">
          {infoDescription ? (
            <InfoLabel label={label} description={infoDescription} />
          ) : (
            <Text size="sm" fw={600} className="muted-copy">
              {label}
            </Text>
          )}
          {tone}
        </Group>
        <Title order={2} className={["metric-card-value", valueClassName].filter(Boolean).join(" ")}>
          {value}
        </Title>
        {meta ? (
          <Text size="sm" className="muted-copy">
            {meta}
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}

export function SelectableCard({
  selected,
  title,
  subtitle,
  badge,
  meta,
  compact,
  onClick,
}: {
  selected?: boolean;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  meta?: ReactNode;
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card
      radius="lg"
      padding="md"
      className={selected ? "workspace-card-selected" : "workspace-card-soft"}
      style={{ cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
    >
      <Stack gap={compact ? 6 : "xs"}>
        <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Text fw={700} truncate>
              {title}
            </Text>
            {subtitle ? (
              <Text size="sm" className="muted-copy" truncate>
                {subtitle}
              </Text>
            ) : null}
          </Box>
          {badge}
        </Group>
        {meta}
      </Stack>
    </Card>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card radius="lg" padding="xl" className="workspace-card-soft">
      <Stack gap="sm" align="flex-start">
        <ThemeIcon
          size="xl"
          radius="md"
          variant="subtle"
          color="gray"
          className="empty-state-icon"
        >
          {icon}
        </ThemeIcon>
        <Title order={4}>{title}</Title>
        <Text size="sm" className="muted-copy">
          {description}
        </Text>
      </Stack>
    </Card>
  );
}

export function DetailRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: string;
}) {
  return (
    <Group justify="space-between" align="flex-start" gap="sm">
      <Text size="sm" className="muted-copy">
        {label}
      </Text>
      <Text size="sm" fw={600} ta="right" c={tone}>
        {value}
      </Text>
    </Group>
  );
}

export function ToneBadge({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <Badge
      variant="transparent"
      radius="sm"
      className={["tone-badge", `tone-badge-${color}`].join(" ")}
    >
      {label}
    </Badge>
  );
}
