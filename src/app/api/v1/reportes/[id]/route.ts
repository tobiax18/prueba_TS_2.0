import type { NextRequest } from "next/server";

import { reportController } from "@/server/controllers/report.controller";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return reportController.getById(request, id);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return reportController.update(request, id);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return reportController.remove(request, id);
}
