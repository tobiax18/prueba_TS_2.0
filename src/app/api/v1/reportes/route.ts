import type { NextRequest } from "next/server";

import { reportController } from "@/server/controllers/report.controller";

export async function POST(request: NextRequest) {
  return reportController.create(request);
}

export async function GET(request: NextRequest) {
  return reportController.list(request);
}
