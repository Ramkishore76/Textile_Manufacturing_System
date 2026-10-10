import { prisma } from '../db/prisma';

export async function logAudit(params: {
  action: string;
  entityType: string;
  entityId: string;
  performedById?: string;
  performedByName?: string;
  details: Record<string, any> | string;
  ipAddress?: string;
}) {
  try {
    const detailsString =
      typeof params.details === 'string' ? params.details : JSON.stringify(params.details);

    await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        performedById: params.performedById,
        performedByName: params.performedByName,
        details: detailsString,
        ipAddress: params.ipAddress,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
