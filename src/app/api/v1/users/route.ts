import type { NextRequest } from "next/server";

import { userController } from "@/server/controllers/user.controller";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  if (url.searchParams.get("mode") === "select") {
    return userController.listSelectableUsers(request);
  }

  return userController.listUsers(request);
}
