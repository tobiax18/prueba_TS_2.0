import type { NextRequest } from "next/server";

import { requireAuthSession } from "@/server/middlewares/auth.middleware";
import { dashboardService } from "@/server/services/dashboard.service";
import { successResponse } from "@/server/utils/api-response";
import { errorToResponse } from "@/server/utils/error-handler";

export const dashboardController = {
  async getMetrics(request: NextRequest) {
    try {
      await requireAuthSession(request);
      const metrics = await dashboardService.getMetrics();

      return Response.json(
        successResponse(metrics, "Métricas del dashboard cargadas"),
      );
    } catch (error) {
      return errorToResponse(error);
    }
  },
};
