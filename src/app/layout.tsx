import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Enterprise Reports Hub",
    template: "%s | Enterprise Reports Hub",
  },
  description:
    "Plataforma full-stack de reportería con autenticación JWT segura, dashboard de métricas, PDF dinámico, auditoría y cron jobs.",
  openGraph: {
    title: "Enterprise Reports Hub",
    description:
      "Módulo profesional de reportería construido con Next.js, Prisma, PostgreSQL y JWT con jose.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
