"use client";

import { MantineProvider, createTheme } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";

const theme = createTheme({
  colors: {
    petrol: [
      "#edf6f7",
      "#d8e9ec",
      "#b3d2d8",
      "#8cbac4",
      "#679fad",
      "#467f8f",
      "#2c6474",
      "#1c5363",
      "#0f4c5c",
      "#083847",
    ],
    sage: [
      "#f2f6f5",
      "#e1ebe9",
      "#c7d8d4",
      "#adc5bf",
      "#94b3aa",
      "#7aa6a1",
      "#638f8a",
      "#4d7873",
      "#39615d",
      "#274a47",
    ],
  },
  primaryColor: "petrol",
  primaryShade: 8,
  autoContrast: true,
  defaultRadius: "lg",
  fontFamily: "Aptos, Segoe UI, Candara, system-ui, sans-serif",
  headings: {
    fontFamily: "Aptos, Segoe UI, Candara, system-ui, sans-serif",
    fontWeight: "700",
  },
});

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} forceColorScheme="light">
        <DatesProvider settings={{ locale: "nl", firstDayOfWeek: 1 }}>
          {children}
        </DatesProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}
