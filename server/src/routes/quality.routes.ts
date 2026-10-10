import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();

// GET all rolls pending quality inspection
router.get(
  '/pending',
  authenticateToken,
  requireRole(['ADMIN', 'QUALITY', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const pendingRolls = await prisma.roll.findMany({
        where: {
          qualityStatus: { in: ['PENDING_INSPECTION', 'REWORK_REQUIRED'] },
        },
        include: {
          order: { select: { id: true, orderNumber: true, buyer: { select: { companyName: true } } } },
          orderItem: true,
          productionJob: {
            include: { machine: true, assignedEmployee: true },
          },
          inspections: { orderBy: { inspectionDate: 'desc' } },
          reworks: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(pendingRolls);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch pending inspections', details: err.message });
    }
  }
);

// GET full history of a roll
router.get(
  '/history/:rollId',
  authenticateToken,
  requireRole(['ADMIN', 'QUALITY', 'PRODUCTION', 'DISPATCH']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const roll = await prisma.roll.findFirst({
        where: {
          OR: [{ id: req.params.rollId }, { rollId: req.params.rollId }],
        },
        include: {
          order: { include: { buyer: true } },
          orderItem: { include: { fabricProduct: true } },
          productionJob: {
            include: {
              machine: true,
              shift: true,
              assignedEmployee: true,
              logs: true,
            },
          },
          inspections: { orderBy: { inspectionDate: 'desc' } },
          reworks: { orderBy: { createdAt: 'desc' } },
          location: true,
        },
      });

      if (!roll) {
        res.status(404).json({ error: 'Roll not found' });
        return;
      }

      res.json(roll);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch roll history', details: err.message });
    }
  }
);

// PERFORM Quality Inspection (PASS, REWORK_REQUIRED, REJECT)
router.post(
  '/inspect',
  authenticateToken,
  requireRole(['ADMIN', 'QUALITY']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        rollId: z.string(), // can be internal ID or roll code like ROLL-2026-0001
        result: z.enum(['PASSED', 'REWORK_REQUIRED', 'REJECTED']),
        defectCategory: z.enum(['HOLES', 'COLOR_MISMATCH', 'UNEVEN_WEAVING', 'STAINS', 'OTHER', 'NONE']).default('NONE'),
        defectDescription: z.string().optional(),
        defectiveQuantity: z.number().min(0).default(0),
        severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL']).optional(),
        remarks: z.string().optional(),
        targetLocationId: z.string().optional(), // if passed, store in finished goods location
        reworkStage: z.enum(['DYEING', 'RE_WEAVING', 'FINISHING']).optional(),
        reworkAction: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const {
        rollId,
        result,
        defectCategory,
        defectDescription,
        defectiveQuantity,
        severity,
        remarks,
        targetLocationId,
        reworkStage,
        reworkAction,
      } = parsed.data;

      const roll = await prisma.roll.findFirst({
        where: {
          OR: [{ id: rollId }, { rollId }],
        },
        include: {
          orderItem: true,
          order: true,
        },
      });

      if (!roll) {
        res.status(404).json({ error: 'Roll not found' });
        return;
      }

      const inspection = await prisma.$transaction(async (tx) => {
        // 1. Record Inspection Result (Always preserves history!)
        const newInsp = await tx.qualityInspection.create({
          data: {
            rollId: roll.id,
            inspectorId: req.user?.id,
            inspectorName: req.user?.name || 'Lead Inspector',
            result,
            defectCategory,
            defectDescription,
            defectiveQuantity,
            severity,
            remarks,
          },
        });

        // 2. Handle Outcome
        if (result === 'PASSED') {
          // If passed, find or assign location
          let locId = targetLocationId || roll.locationId;
          if (!locId) {
            const defaultLoc = await tx.finishedGoodsLocation.findFirst();
            locId = defaultLoc?.id;
          }

          // Move to Finished Goods Stock
          await tx.roll.update({
            where: { id: roll.id },
            data: {
              qualityStatus: 'PASSED',
              inventoryStatus: 'IN_FINISHED_STOCK',
              locationId: locId,
            },
          });

          // Update order item passed quantity
          await tx.orderItem.update({
            where: { id: roll.orderItemId },
            data: {
              passedQuantity: { increment: roll.lengthMeters },
            },
          });

          // Check if order has reached ready to ship
          const orderItems = await tx.orderItem.findMany({ where: { orderId: roll.orderId } });
          const allItemsReady = orderItems.every((it) => it.passedQuantity >= it.requiredQuantity);
          if (allItemsReady) {
            await tx.order.update({
              where: { id: roll.orderId },
              data: { status: 'READY_TO_SHIP' },
            });
          }
        } else if (result === 'REWORK_REQUIRED') {
          // Cannot enter saleable stock! Keep in process
          await tx.roll.update({
            where: { id: roll.id },
            data: {
              qualityStatus: 'REWORK_REQUIRED',
              inventoryStatus: 'IN_PROCESS',
            },
          });

          // Record rework entry
          await tx.reworkRecord.create({
            data: {
              rollId: roll.id,
              reworkStage: reworkStage || 'FINISHING',
              reason: defectDescription || `Defect detected: ${defectCategory}`,
              actionTaken: reworkAction || 'Sent for reprocessing & inspection re-evaluation',
              status: 'IN_PROGRESS',
              startedAt: new Date(),
            },
          });

          await tx.orderItem.update({
            where: { id: roll.orderItemId },
            data: {
              reworkQuantity: { increment: roll.lengthMeters },
            },
          });
        } else if (result === 'REJECTED') {
          // Permanently rejected from saleable stock
          await tx.roll.update({
            where: { id: roll.id },
            data: {
              qualityStatus: 'REJECTED',
              inventoryStatus: 'IN_PROCESS', // Discard / scrap
            },
          });

          await tx.orderItem.update({
            where: { id: roll.orderItemId },
            data: {
              rejectedQuantity: { increment: roll.lengthMeters },
            },
          });
        }

        return newInsp;
      });

      await logAudit({
        action: 'ROLL_QUALITY_INSPECTED',
        entityType: 'Roll',
        entityId: roll.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: { rollId: roll.rollId, result, defectCategory, severity },
      });

      res.status(201).json({ message: 'Quality inspection recorded successfully', inspection });
    } catch (err: any) {
      console.error('Inspection error:', err);
      res.status(500).json({ error: 'Failed to record inspection', details: err.message });
    }
  }
);

// Defect trends & quality metrics
router.get(
  '/defects-summary',
  authenticateToken,
  requireRole(['ADMIN', 'QUALITY', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const inspections = await prisma.qualityInspection.findMany({
        include: {
          roll: {
            include: {
              productionJob: { include: { machine: true } },
              order: { select: { orderNumber: true } },
            },
          },
        },
      });

      const totalInspected = inspections.length;
      const passedCount = inspections.filter((i) => i.result === 'PASSED').length;
      const reworkCount = inspections.filter((i) => i.result === 'REWORK_REQUIRED').length;
      const rejectedCount = inspections.filter((i) => i.result === 'REJECTED').length;

      // Category breakdown
      const categoryCounts: Record<string, number> = {};
      inspections
        .filter((i) => i.defectCategory && i.defectCategory !== 'NONE')
        .forEach((i) => {
          categoryCounts[i.defectCategory!] = (categoryCounts[i.defectCategory!] || 0) + 1;
        });

      res.json({
        totalInspected,
        passedCount,
        reworkCount,
        rejectedCount,
        passPercentage: totalInspected > 0 ? ((passedCount / totalInspected) * 100).toFixed(1) : 100,
        defectCategories: categoryCounts,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch defect summary', details: err.message });
    }
  }
);

export default router;
