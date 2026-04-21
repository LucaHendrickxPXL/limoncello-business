import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";

import { mantineHtmlProps } from "@mantine/core";
import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Limoncello Business",
  description: "Batchgerichte operationele tool voor limoncello en arancello.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      {...mantineHtmlProps}
      data-mantine-color-scheme="light"
      data-theme="light"
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
