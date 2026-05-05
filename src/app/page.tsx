import { redirect } from "next/navigation";

import { getServerSession } from "@/server/auth/session";

export default async function HomePage() {
  const session = await getServerSession();

  redirect(session ? "/dashboard" : "/login");
}
