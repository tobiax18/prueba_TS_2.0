import type { Metadata } from "next";

import { PdfCenter } from "@/components/reports/pdf-center";
import { getServerSession } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Centro PDF",
  description:
    "Descarga de reportes dinámicos en PDF para operaciones y administración.",
};

export default async function PdfPage() {
  const session = await getServerSession();

  if (!session) {
    return null;
  }

  return <PdfCenter session={session} />;
}
