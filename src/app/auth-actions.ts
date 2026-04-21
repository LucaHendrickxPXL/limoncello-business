"use server";

import { redirect } from "next/navigation";

import {
  createInitialAuthUser,
  hasAnyAuthUsers,
  loginWithPassword,
  logoutCurrentSession,
} from "@/lib/server/auth";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function loginAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  try {
    await loginWithPassword({ email, password });
  } catch {
    redirect("/login?error=login");
  }

  redirect("/");
}

export async function initialSetupAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const setupKey = getString(formData, "setupKey");

  try {
    await createInitialAuthUser({ email, password, setupKey });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? encodeURIComponent(error.message)
        : "setup";
    redirect(`/login?setupError=${message}`);
  }

  redirect("/");
}

export async function logoutAction() {
  await logoutCurrentSession();
  redirect("/login");
}

export async function hasUsersForLoginPage() {
  return hasAnyAuthUsers();
}
