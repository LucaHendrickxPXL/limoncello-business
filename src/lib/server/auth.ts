import "server-only";

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  AUTH_LOGIN_MAX_FAILURES_PER_EMAIL,
  AUTH_LOGIN_MAX_FAILURES_PER_IP,
  AUTH_LOGIN_WINDOW_MINUTES,
  AUTH_SESSION_ABSOLUTE_DAYS,
  AUTH_SESSION_COOKIE_NAME,
  AUTH_SESSION_IDLE_DAYS,
} from "@/lib/auth-constants";
import { queryOne, withTransaction } from "./db";

type AuthenticatedUser = {
  id: string;
  email: string;
};

type SessionValidationResult = {
  user: AuthenticatedUser;
  sessionId: string;
  sessionToken: string;
} | null;

const GENERIC_LOGIN_ERROR = "Aanmelden mislukt. Controleer je gegevens en probeer opnieuw.";

function getPasswordPepper() {
  const value = process.env.AUTH_PASSWORD_PEPPER?.trim();

  if (!value) {
    throw new Error("AUTH_PASSWORD_PEPPER ontbreekt. Voeg een lange geheime waarde toe in .env.local.");
  }

  return value;
}

function getSetupKey() {
  const value = process.env.AUTH_SETUP_KEY?.trim();

  if (!value) {
    throw new Error("AUTH_SETUP_KEY ontbreekt. Voeg een geheime setup key toe in .env.local.");
  }

  return value;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(`${password}${getPasswordPepper()}`, salt, 64).toString("base64url");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, expectedHash] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(`${password}${getPasswordPepper()}`, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, "base64url");

  if (actualHash.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualHash, expectedBuffer);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

function validatePasswordStrength(password: string) {
  if (password.length < 15) {
    throw new Error("Gebruik minstens 15 tekens voor het wachtwoord.");
  }
}

async function getRequestMetadata() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const userAgent = headerStore.get("user-agent") || "unknown";

  return {
    ipAddress,
    userAgent,
  };
}

async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function hasAnyAuthUsers() {
  const row = await queryOne<{ count: string }>(
    `select count(*)::text as count
     from app_users`,
  );

  return Number(row?.count ?? 0) > 0;
}

async function pruneAuthState() {
  await withTransaction(async (client) => {
    await client.query(
      `delete from app_sessions
       where revoked_at is not null
          or expires_at < now()
          or last_seen_at < now() - interval '${AUTH_SESSION_IDLE_DAYS} days'`,
    );

    await client.query(
      `delete from auth_login_attempts
       where attempted_at < now() - interval '7 days'`,
    );
  });
}

async function assertLoginAllowed(email: string, ipAddress: string) {
  const row = await queryOne<{
    email_failures: string;
    ip_failures: string;
  }>(
    `with email_failures as (
       select count(*)::int as count
       from auth_login_attempts
       where email_normalized = $1
         and was_successful = false
         and attempted_at > now() - interval '${AUTH_LOGIN_WINDOW_MINUTES} minutes'
     ),
     ip_failures as (
       select count(*)::int as count
       from auth_login_attempts
       where ip_address = $2
         and was_successful = false
         and attempted_at > now() - interval '${AUTH_LOGIN_WINDOW_MINUTES} minutes'
     )
     select
       (select count from email_failures)::text as email_failures,
       (select count from ip_failures)::text as ip_failures`,
    [email, ipAddress],
  );

  const emailFailures = Number(row?.email_failures ?? 0);
  const ipFailures = Number(row?.ip_failures ?? 0);

  if (
    emailFailures >= AUTH_LOGIN_MAX_FAILURES_PER_EMAIL ||
    ipFailures >= AUTH_LOGIN_MAX_FAILURES_PER_IP
  ) {
    throw new Error("Te veel mislukte pogingen. Wacht even en probeer opnieuw.");
  }
}

async function recordLoginAttempt(email: string, ipAddress: string, wasSuccessful: boolean) {
  await withTransaction(async (client) => {
    await client.query(
      `insert into auth_login_attempts (email_normalized, ip_address, was_successful)
       values ($1, $2, $3)`,
      [email, ipAddress, wasSuccessful],
    );
  });
}

export async function createInitialAuthUser(input: {
  email: string;
  password: string;
  setupKey: string;
}) {
  const normalizedEmail = normalizeEmail(input.email);

  if (input.setupKey.trim() !== getSetupKey()) {
    throw new Error("De setup key is ongeldig.");
  }

  validatePasswordStrength(input.password);

  const session = await withTransaction(async (client) => {
    const existingUsers = await client.query<{ count: string }>(
      `select count(*)::text as count from app_users`,
    );

    if (Number(existingUsers.rows[0]?.count ?? 0) > 0) {
      throw new Error("Er bestaat al een account. Gebruik de gewone login.");
    }

    const createdUser = await client.query<{ id: string; email: string }>(
      `insert into app_users (email, password_hash)
       values ($1, $2)
       returning id, email`,
      [normalizedEmail, hashPassword(input.password)],
    );

    const { ipAddress, userAgent } = await getRequestMetadata();
    const rawToken = createSessionToken();
    const expiresAt = new Date(Date.now() + AUTH_SESSION_ABSOLUTE_DAYS * 24 * 60 * 60 * 1000);

    await client.query(
      `insert into app_sessions (
         user_id,
         session_token_hash,
         expires_at,
         last_seen_at,
         ip_address,
         user_agent
       )
       values ($1, $2, $3, now(), $4, $5)`,
      [createdUser.rows[0].id, hashSessionToken(rawToken), expiresAt.toISOString(), ipAddress, userAgent],
    );

    return {
      token: rawToken,
      expiresAt,
    };
  });

  await setSessionCookie(session.token, session.expiresAt);
}

export async function loginWithPassword(input: { email: string; password: string }) {
  await pruneAuthState();

  const normalizedEmail = normalizeEmail(input.email);
  const { ipAddress, userAgent } = await getRequestMetadata();

  await assertLoginAllowed(normalizedEmail, ipAddress);

  const user = await queryOne<{
    id: string;
    email: string;
    password_hash: string;
  }>(
    `select id, email, password_hash
     from app_users
     where email = $1`,
    [normalizedEmail],
  );

  if (!user || !verifyPassword(input.password, user.password_hash)) {
    await recordLoginAttempt(normalizedEmail, ipAddress, false);
    throw new Error(GENERIC_LOGIN_ERROR);
  }

  const session = await withTransaction(async (client) => {
    const rawToken = createSessionToken();
    const expiresAt = new Date(Date.now() + AUTH_SESSION_ABSOLUTE_DAYS * 24 * 60 * 60 * 1000);

    await client.query(
      `insert into app_sessions (
         user_id,
         session_token_hash,
         expires_at,
         last_seen_at,
         ip_address,
         user_agent
       )
       values ($1, $2, $3, now(), $4, $5)`,
      [user.id, hashSessionToken(rawToken), expiresAt.toISOString(), ipAddress, userAgent],
    );

    return {
      token: rawToken,
      expiresAt,
    };
  });

  await recordLoginAttempt(normalizedEmail, ipAddress, true);
  await setSessionCookie(session.token, session.expiresAt);
}

export async function getAuthenticatedSession(): Promise<SessionValidationResult> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await queryOne<{
    session_id: string;
    user_id: string;
    email: string;
    expires_at: string;
    last_seen_at: string;
    created_at: string;
  }>(
    `select
       s.id as session_id,
       u.id as user_id,
       u.email,
       s.expires_at::text as expires_at,
       s.last_seen_at::text as last_seen_at,
       s.created_at::text as created_at
     from app_sessions s
     join app_users u on u.id = s.user_id
     where s.session_token_hash = $1
       and s.revoked_at is null`,
    [hashSessionToken(sessionToken)],
  );

  if (!session) {
    await clearSessionCookie();
    return null;
  }

  const now = Date.now();
  const expiresAt = new Date(session.expires_at).getTime();
  const lastSeenAt = new Date(session.last_seen_at).getTime();
  const createdAt = new Date(session.created_at).getTime();
  const absoluteMax = createdAt + AUTH_SESSION_ABSOLUTE_DAYS * 24 * 60 * 60 * 1000;
  const idleMax = lastSeenAt + AUTH_SESSION_IDLE_DAYS * 24 * 60 * 60 * 1000;

  if (now >= expiresAt || now >= absoluteMax || now >= idleMax) {
    await withTransaction(async (client) => {
      await client.query(
        `update app_sessions
         set revoked_at = now()
         where id = $1`,
        [session.session_id],
      );
    });
    await clearSessionCookie();
    return null;
  }

  if (now - lastSeenAt > 15 * 60 * 1000) {
    await withTransaction(async (client) => {
      await client.query(
        `update app_sessions
         set last_seen_at = now()
         where id = $1`,
        [session.session_id],
      );
    });
  }

  return {
    sessionId: session.session_id,
    sessionToken,
    user: {
      id: session.user_id,
      email: session.email,
    },
  };
}

export async function requireAuthenticatedUser() {
  const session = await getAuthenticatedSession();

  if (!session) {
    redirect("/login");
  }

  return session.user;
}

export async function logoutCurrentSession() {
  const session = await getAuthenticatedSession();

  if (session) {
    await withTransaction(async (client) => {
      await client.query(
        `update app_sessions
         set revoked_at = now()
         where id = $1`,
        [session.sessionId],
      );
    });
  }

  await clearSessionCookie();
}
