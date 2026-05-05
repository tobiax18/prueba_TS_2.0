import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getServerSession } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Área privada con métricas, reportes, exportación PDF y administración.",
};

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return <AppShell session={session}>{children}</AppShell>;
}
