import type { Prisma } from "@prisma/client";

import { auditRepository } from "@/server/repositories/audit.repository";

export const auditService = {
  logAction(params: {
    action: string;
    entity: string;
    entityId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return auditRepository.create({
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      userId: params.userId,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    });
  },
};
