import { prisma } from "../lib/prisma";

export async function logActivity(params: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: string | null;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // We don't throw here because we don't want a logging failure to crash the main app action
  }
}
