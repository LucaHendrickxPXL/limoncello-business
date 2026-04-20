import { LimoncelloWorkspace } from "@/components/limoncello-workspace";
import { AppView } from "@/lib/types";
import { getWorkspaceData } from "@/lib/server/workspace-data";

export const dynamic = "force-dynamic";

function resolveView(value: string | string[] | undefined): AppView {
  const candidate = Array.isArray(value) ? value[0] : value;
  const allowed: AppView[] = [
    "home",
    "batches",
    "orders",
    "expenses",
    "revenue",
    "customers",
    "ratios",
    "articles",
    "dashboard",
  ];

  return allowed.includes(candidate as AppView) ? (candidate as AppView) : "home";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialView = resolveView(params?.view);
  const data = await getWorkspaceData();

  return <LimoncelloWorkspace initialView={initialView} data={data} />;
}
