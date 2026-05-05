import { redirect } from "next/navigation";

import { getServerSession } from "@/server/auth/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(194,65,12,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,118,110,0.12),_transparent_40%),linear-gradient(180deg,_#f5f7f3_0%,_#edf2eb_100%)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="px-2">
          <p className="text-xs uppercase tracking-[0.24em] text-[#0f766e]">
            Prueba de desempeño
          </p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-[1.05] text-slate-950">
            Módulo de reportería con nivel de empresa real.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Autenticación segura con `jose`, refresh tokens persistidos,
            arquitectura por capas, dashboard operativo, exportación PDF y
            auditoría lista para producción.
          </p>
        </section>
        <section>{children}</section>
      </div>
    </div>
  );
}
