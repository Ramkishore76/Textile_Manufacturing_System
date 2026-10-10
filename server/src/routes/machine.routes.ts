import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();

// GET all machines
router.get(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION', 'MAINTENANCE', 'STORE']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const machines = await prisma.machine.findMany({
        include: {
          productionJobs: {
            where: { status: 'IN_PROGRESS' },
            include: {
              order: { select: { id: true, orderNumber: true } },
              assignedEmployee: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { code: 'asc' },
      });
      res.json(machines);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch machines', details: err.message });
    }
  }
);

// CREATE machine
router.post(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        code: z.string().min(2),
        name: z.string().min(2),
        type: z.enum(['SPINNING', 'WEAVING', 'DYEING']),
        model: z.string().optional(),
        capacityPerHour: z.number().positive(),
        hourlyOperatingCost: z.number().default(150),
        location: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const machine = await prisma.machine.create({
        data: {
          ...parsed.data,
          status: 'IDLE',
        },
      });

      res.status(201).json(machine);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create machine', details: err.message });
    }
  }
);

// UPDATE machine status (IDLE, RUNNING, MAINTENANCE, BREAKDOWN)
router.put(
  '/:id/status',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        status: z.enum(['IDLE', 'RUNNING', 'MAINTENANCE', 'BREAKDOWN']),
        reason: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const machine = await prisma.machine.update({
        where: { id: req.params.id },
        data: {
          status: parsed.data.status,
          lastMaintenanceDate: parsed.data.status === 'MAINTENANCE' ? new Date() : undefined,
        },
      });

      await logAudit({
        action: 'MACHINE_STATUS_UPDATED',
        entityType: 'Machine',
        entityId: machine.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: { code: machine.code, status: parsed.data.status, reason: parsed.data.reason },
      });

      res.json(machine);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update machine status', details: err.message });
    }
  }
);

// GET shifts
router.get(
  '/shifts',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION', 'HR']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const shifts = await prisma.shift.findMany({
        where: { isActive: true },
        orderBy: { startTime: 'asc' },
      });
      res.json(shifts);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch shifts', details: err.message });
    }
  }
);

export default router;
