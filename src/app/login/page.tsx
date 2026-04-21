import {
  Alert,
  Box,
  Button,
  Card,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconAlertTriangle, IconBottle, IconShieldLock } from "@tabler/icons-react";
import { redirect } from "next/navigation";

import { hasUsersForLoginPage, initialSetupAction, loginAction } from "@/app/auth-actions";
import { getAuthenticatedSession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAuthenticatedSession();

  if (session) {
    redirect("/");
  }

  const [hasUsers, params] = await Promise.all([hasUsersForLoginPage(), searchParams]);
  const error = typeof params?.error === "string" ? params.error : null;
  const setupError = typeof params?.setupError === "string" ? decodeURIComponent(params.setupError) : null;

  return (
    <Box
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "1.25rem",
        background: "var(--page-bg)",
      }}
    >
      <Card
        radius="xl"
        padding="xl"
        className="workspace-card"
        style={{ width: "100%", maxWidth: "30rem" }}
      >
        <Stack gap="lg">
          <Stack gap="sm" align="center">
            <ThemeIcon size={56} radius="xl" className="workspace-brand-icon">
              <IconBottle size={28} />
            </ThemeIcon>
            <Stack gap={4} align="center">
              <Title order={2}>{hasUsers ? "Aanmelden" : "Eerste account instellen"}</Title>
              <Text size="sm" className="muted-copy" ta="center">
                {hasUsers
                  ? "Log in om de limoncello workspace veilig te openen."
                  : "Maak eerst het eigenaaraccount aan. Gebruik hiervoor je geheime setup key."}
              </Text>
            </Stack>
          </Stack>

          {error ? (
            <Alert color="red" icon={<IconAlertTriangle size={16} />} radius="lg">
              Aanmelden mislukt. Controleer je gegevens en probeer opnieuw.
            </Alert>
          ) : null}

          {setupError ? (
            <Alert color="red" icon={<IconAlertTriangle size={16} />} radius="lg">
              {setupError}
            </Alert>
          ) : null}

          {hasUsers ? (
            <form action={loginAction}>
              <Stack gap="md">
                <TextInput
                  name="email"
                  type="email"
                  label="E-mail"
                  placeholder="jij@voorbeeld.be"
                  required
                  autoComplete="email"
                />
                <PasswordInput
                  name="password"
                  label="Wachtwoord"
                  placeholder="Je wachtwoord"
                  required
                  autoComplete="current-password"
                />
                <Button type="submit" size="md" radius="xl" className="batch-toolbar-button-primary">
                  Aanmelden
                </Button>
              </Stack>
            </form>
          ) : (
            <form action={initialSetupAction}>
              <Stack gap="md">
                <Alert color="blue" icon={<IconShieldLock size={16} />} radius="lg">
                  Deze stap is alleen bedoeld voor de eigenaar van de app.
                </Alert>
                <TextInput
                  name="email"
                  type="email"
                  label="Owner e-mail"
                  placeholder="jij@voorbeeld.be"
                  required
                  autoComplete="email"
                />
                <PasswordInput
                  name="password"
                  label="Wachtwoord"
                  placeholder="Minstens 15 tekens"
                  required
                  autoComplete="new-password"
                />
                <PasswordInput
                  name="setupKey"
                  label="Setup key"
                  placeholder="Geheime setup key uit .env.local"
                  required
                  autoComplete="off"
                />
                <Button type="submit" size="md" radius="xl" className="batch-toolbar-button-primary">
                  Account aanmaken
                </Button>
              </Stack>
            </form>
          )}
        </Stack>
      </Card>
    </Box>
  );
}
