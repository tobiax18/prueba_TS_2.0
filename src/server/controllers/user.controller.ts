import type { NextRequest } from "next/server";

import { requireAuthSession } from "@/server/middlewares/auth.middleware";
import { userService } from "@/server/services/user.service";
import { successResponse } from "@/server/utils/api-response";
import { errorToResponse } from "@/server/utils/error-handler";
import { validateUserListQuery } from "@/server/validators/user.validator";

export const userController = {
  async listUsers(request: NextRequest) {
    try {
      const session = await requireAuthSession(request);
      const query = validateUserListQuery(new URL(request.url).searchParams);
      const result = await userService.listUsers(query, session);

      return Response.json(successResponse(result, "Usuarios cargados"));
    } catch (error) {
      return errorToResponse(error);
    }
  },

  async listSelectableUsers(request: NextRequest) {
    try {
      const session = await requireAuthSession(request);
      const result = await userService.getSelectableUsers(session);

      return Response.json(
        successResponse(result, "Usuarios disponibles cargados"),
      );
    } catch (error) {
      return errorToResponse(error);
    }
  },
};
