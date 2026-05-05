import type { Metadata } from "next";

import { ReportsWorkspace } from "@/components/reports/reports-workspace";
import { getServerSession } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Reportes",
  description:
    "CRUD completo del módulo de reportes con filtros, búsqueda y soft delete.",
};

export default async function ReportsPage() {
  const session = await getServerSession();

  if (!session) {
    return null;
  }

  return <ReportsWorkspace session={session} />;
}
