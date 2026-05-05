import type { Metadata } from "next";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Métricas clave, gráficas profesionales y actividad del sistema.",
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
