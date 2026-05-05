import type { NextRequest } from "next/server";

import { dashboardController } from "@/server/controllers/dashboard.controller";

export async function GET(request: NextRequest) {
  return dashboardController.getMetrics(request);
}
