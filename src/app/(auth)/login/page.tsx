import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Inicio de sesión seguro para el módulo profesional de reportería.",
};

export default function LoginPage() {
  return <LoginForm />;
}
