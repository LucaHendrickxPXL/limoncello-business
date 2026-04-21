"use client";

import { MantineProvider, createTheme } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemeMode = "light" | "dark";

type ThemeModeContextValue = {
  colorScheme: ThemeMode;
  setColorScheme: (value: ThemeMode) => void;
};

const THEME_STORAGE_KEY = "limoncello-business-theme";

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

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
  const [colorScheme, setColorScheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const storedValue =
      typeof window !== "undefined"
        ? window.localStorage.getItem(THEME_STORAGE_KEY)
        : null;

    if (storedValue === "light" || storedValue === "dark") {
      setColorScheme(storedValue);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", colorScheme);
    document.documentElement.setAttribute("data-mantine-color-scheme", colorScheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, colorScheme);
  }, [colorScheme]);

  const themeModeValue = useMemo(
    () => ({
      colorScheme,
      setColorScheme,
    }),
    [colorScheme],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeContext.Provider value={themeModeValue}>
        <MantineProvider theme={theme} forceColorScheme={colorScheme}>
          <DatesProvider settings={{ locale: "nl", firstDayOfWeek: 1 }}>
            {children}
          </DatesProvider>
        </MantineProvider>
      </ThemeModeContext.Provider>
    </QueryClientProvider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error("useThemeMode must be used within Providers");
  }

  return context;
}
