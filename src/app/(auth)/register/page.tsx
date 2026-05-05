import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Registro",
  description:
    "Alta de usuarios estándar con validaciones seguras para reportería.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
