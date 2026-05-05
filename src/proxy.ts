import type { NextRequest } from "next/server";

import { authMiddleware } from "@/server/middlewares/auth.middleware";

export async function proxy(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: ["/api/:path*"],
};
