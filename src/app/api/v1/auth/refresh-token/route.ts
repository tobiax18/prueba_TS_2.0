import type { NextRequest } from "next/server";

import { authController } from "@/server/controllers/auth.controller";

export async function POST(request: NextRequest) {
  return authController.refresh(request);
}
