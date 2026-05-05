import type { NextRequest } from "next/server";

import { reportController } from "@/server/controllers/report.controller";

export async function GET(request: NextRequest) {
  return reportController.search(request);
}
