import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();

// GET all production jobs
router.get(
  '/jobs',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION', 'QUALITY', 'STORE']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const jobs = await prisma.productionJob.findMany({
        include: {
          order: { select: { id: true, orderNumber: true, status: true, buyer: { select: { companyName: true } } } },
          orderItem: { include: { fabricProduct: true } },
          machine: true,
          shift: true,
          assignedEmployee: true,
          logs: { orderBy: { logDate: 'desc' } },
          rolls: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(jobs);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch production jobs', details: err.message });
    }
  }
);

// CREATE production job (with machine conflict & status validation!)
router.post(
  '/jobs',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        orderId: z.string(),
        orderItemId: z.string(),
        stage: z.enum(['SPINNING', 'WEAVING', 'DYEING']),
        machineId: z.string(),
        shiftId: z.string().optional(),
        assignedEmployeeId: z.string().optional(),
        plannedQuantity: z.number().positive(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const { orderId, orderItemId, stage, machineId, shiftId, assignedEmployeeId, plannedQuantity } = parsed.data;

      // 1. Verify machine status and ensure no conflict
      const machine = await prisma.machine.findUnique({
        where: { id: machineId },
      });

      if (!machine) {
        res.status(404).json({ error: 'Machine not found' });
        return;
      }

      if (machine.status === 'MAINTENANCE' || machine.status === 'BREAKDOWN') {
        res.status(400).json({
          error: `Cannot assign machine ${machine.name} (${machine.code}). Current status is ${machine.status}.`,
        });
        return;
      }

      // Check if machine already has an active IN_PROGRESS job
      const activeJob = await prisma.productionJob.findFirst({
        where: {
          machineId,
          status: 'IN_PROGRESS',
        },
        include: {
          order: { select: { orderNumber: true } },
        },
      });

      if (activeJob) {
        res.status(400).json({
          error: `Conflicting assignment: Machine ${machine.code} is currently occupied by active Job ${activeJob.jobNumber} (Order ${activeJob.order.orderNumber}).`,
        });
        return;
      }

      const count = await prisma.productionJob.count();
      const jobNumber = `JOB-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

      const job = await prisma.$transaction(async (tx) => {
        const newJob = await tx.productionJob.create({
          data: {
            jobNumber,
            orderId,
            orderItemId,
            stage,
            machineId,
            shiftId,
            assignedEmployeeId,
            plannedQuantity,
            status: 'PLANNED',
          },
          include: {
            order: true,
            orderItem: true,
            machine: true,
          },
        });

        // Update order status to IN_PRODUCTION if confirmed/material allocated
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'IN_PRODUCTION' },
        });

        return newJob;
      });

      await logAudit({
        action: 'PRODUCTION_JOB_PLANNED',
        entityType: 'ProductionJob',
        entityId: job.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: { jobNumber, stage, machine: machine.name, plannedQuantity },
      });

      res.status(201).json(job);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create production job', details: err.message });
    }
  }
);

// START production job
router.put(
  '/jobs/:id/start',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const job = await prisma.productionJob.findUnique({
        where: { id: req.params.id },
      });

      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const j = await tx.productionJob.update({
          where: { id: job.id },
          data: {
            status: 'IN_PROGRESS',
            startTime: new Date(),
          },
        });

        await tx.machine.update({
          where: { id: job.machineId },
          data: { status: 'RUNNING' },
        });

        return j;
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to start job', details: err.message });
    }
  }
);

// RECORD operator-reported production logs and downtime
router.post(
  '/jobs/:id/logs',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        quantityProduced: z.number().min(0),
        wastageQuantity: z.number().min(0).default(0),
        downtimeDurationMinutes: z.number().min(0).default(0),
        downtimeReason: z.string().optional(),
        operatorName: z.string().optional(),
        machineStatus: z.string().optional(),
        notes: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const {
        quantityProduced,
        wastageQuantity,
        downtimeDurationMinutes,
        downtimeReason,
        operatorName,
        machineStatus,
        notes,
      } = parsed.data;

      const job = await prisma.productionJob.findUnique({
        where: { id: req.params.id },
      });

      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }

      const result = await prisma.$transaction(async (tx) => {
        const log = await tx.productionLog.create({
          data: {
            productionJobId: job.id,
            quantityProduced,
            operatorName: operatorName || req.user?.name,
            machineStatus: machineStatus || 'RUNNING',
            notes: notes ? `[Operator-Reported] ${notes}` : '[Operator-Reported Log]',
          },
        });

        const newActual = job.actualQuantity + quantityProduced;
        const newWastage = job.wastageQuantity + wastageQuantity;
        const newDowntime = job.downtimeDurationMinutes + downtimeDurationMinutes;

        const updatedJob = await tx.productionJob.update({
          where: { id: job.id },
          data: {
            actualQuantity: newActual,
            wastageQuantity: newWastage,
            downtimeDurationMinutes: newDowntime,
            downtimeReason: downtimeReason || job.downtimeReason,
          },
        });

        // Also update order item produced quantity
        await tx.orderItem.update({
          where: { id: job.orderItemId },
          data: { producedQuantity: { increment: quantityProduced } },
        });

        return { log, updatedJob };
      });

      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record production log', details: err.message });
    }
  }
);

// COMPLETE production job and optionally release machine to IDLE
router.put(
  '/jobs/:id/complete',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const job = await prisma.productionJob.findUnique({
        where: { id: req.params.id },
      });

      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const j = await tx.productionJob.update({
          where: { id: job.id },
          data: {
            status: 'COMPLETED',
            completionTime: new Date(),
          },
        });

        await tx.machine.update({
          where: { id: job.machineId },
          data: { status: 'IDLE' },
        });

        return j;
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to complete job', details: err.message });
    }
  }
);

// GENERATE UNIQUE ROLL IDs (Section 4 and 10)
// Format: ROLL-YYYY-XXXX (Unique, non-reusable)
router.post(
  '/jobs/:id/generate-rolls',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        rolls: z.array(
          z.object({
            lengthMeters: z.number().positive(),
            weightKg: z.number().positive().optional(),
          })
        ).min(1, 'At least one roll must be specified'),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const job = await prisma.productionJob.findUnique({
        where: { id: req.params.id },
        include: {
          order: true,
          orderItem: { include: { fabricProduct: true } },
        },
      });

      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }

      const createdRolls = await prisma.$transaction(async (tx) => {
        const results = [];
        const year = new Date().getFullYear();

        for (const r of parsed.data.rolls) {
          const totalRollCount = await tx.roll.count();
          const rollId = `ROLL-${year}-${String(totalRollCount + 1).padStart(4, '0')}`;

          const newRoll = await tx.roll.create({
            data: {
              rollId,
              orderId: job.orderId,
              orderItemId: job.orderItemId,
              productionJobId: job.id,
              fabricType: job.orderItem.fabricProduct.name,
              color: job.orderItem.color,
              lengthMeters: r.lengthMeters,
              weightKg: r.weightKg,
              qualityStatus: 'PENDING_INSPECTION',
              inventoryStatus: 'IN_PROCESS',
            },
          });
          results.push(newRoll);
        }

        // Update order status to QUALITY_INSPECTION
        await tx.order.update({
          where: { id: job.orderId },
          data: { status: 'QUALITY_INSPECTION' },
        });

        return results;
      });

      await logAudit({
        action: 'ROLLS_GENERATED',
        entityType: 'ProductionJob',
        entityId: job.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: { count: createdRolls.length, rollIds: createdRolls.map((r) => r.rollId) },
      });

      res.status(201).json(createdRolls);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate rolls', details: err.message });
    }
  }
);

export default router;
