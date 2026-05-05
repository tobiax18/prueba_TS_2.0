import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminPanel } from "@/components/dashboard/admin-panel";
import { getServerSession } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Panel Administrativo",
  description:
    "Control de cron jobs, trazabilidad y ejecución administrativa del módulo.",
};

export default async function AdminPanelPage() {
  const session = await getServerSession();

  if (!session) {
    return null;
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminPanel />;
}
