import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { UsersWorkspace } from "@/components/dashboard/users-workspace";
import { getServerSession } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Usuarios",
  description: "Consulta administrativa de usuarios registrados y su estado.",
};

export default async function UsersPage() {
  const session = await getServerSession();

  if (!session) {
    return null;
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <UsersWorkspace />;
}
