"use client";

import { Box, Stack, Text } from "@mantine/core";
import { ReactNode } from "react";

type WorkspaceTableColumn = {
  label: string;
  hiddenOnMobile?: boolean;
};

function joinClassNames(...classNames: Array<string | undefined | false>) {
  return classNames.filter(Boolean).join(" ");
}

export function WorkspaceTableFrame({
  columns,
  headClassName,
  children,
}: {
  columns: WorkspaceTableColumn[];
  headClassName?: string;
  children: ReactNode;
}) {
  return (
    <Box className="batch-table-frame">
      <Box className={joinClassNames("batch-table-head", headClassName)}>
        {columns.map((column) => (
          <Text
            key={column.label}
            className={joinClassNames(
              "batch-table-head-cell",
              column.hiddenOnMobile ? "table-mobile-hidden" : undefined,
            )}
          >
            {column.label}
          </Text>
        ))}
      </Box>
      <Box className="batch-table-scroll">{children}</Box>
    </Box>
  );
}

export function WorkspaceTableRows({ children }: { children: ReactNode }) {
  return <Stack gap={0}>{children}</Stack>;
}
