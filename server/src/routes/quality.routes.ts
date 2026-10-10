import { Router, Response } from 'express';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

const router = Router();

// ==========================================
// 1. STAGE CHECKPOINT CONFIGURATION
// ==========================================

const DEFAULT_CHECKPOINTS = [
  {
    stageCode: 'RAW_MATERIAL',
    stageName: 'Raw Material Inspection',
    sequenceOrder: 1,
    isRequired: true,
    mandatoryHold: true,
    inspectionType: '4_POINT_RAW_YARN',
    responsibleTeam: 'STORE',
    description: 'Yarn lot count, moisture, tensile strength, and cone shade uniformity before spinning.',
  },
  {
    stageCode: 'SPINNING_QC',
    stageName: 'Spinning Quality Check',
    sequenceOrder: 3,
    isRequired: true,
    mandatoryHold: true,
    inspectionType: 'RING_FRAME_QC',
    responsibleTeam: 'PRODUCTION',
    description: 'Slub detection, yarn thickness (CV%), twist per inch (TPI), and spindle speed checks.',
  },
  {
    stageCode: 'WEAVING_QC',
    stageName: 'Weaving Quality Check',
    sequenceOrder: 5,
    isRequired: true,
    mandatoryHold: true,
    inspectionType: 'GREIGE_LOOM_QC',
    responsibleTeam: 'PRODUCTION',
    description: 'Loom shuttle/air-jet inspection: broken warp/weft, reed marks, picks per inch (PPI).',
  },
  {
    stageCode: 'DYEING_QC',
    stageName: 'Dyeing & Finishing Check',
    sequenceOrder: 7,
    isRequired: true,
    mandatoryHold: true,
    inspectionType: 'SHADE_SPECTRO_QC',
    responsibleTeam: 'PRODUCTION',
    description: 'Spectrophotometer Delta-E shade matching, wash fastness, shrinkage, and hand-feel.',
  },
  {
    stageCode: 'FINAL_INSPECTION',
    stageName: 'Final Quality Inspection',
    sequenceOrder: 8,
    isRequired: true,
    mandatoryHold: true,
    inspectionType: '4_POINT_FABRIC_AUDIT',
    responsibleTeam: 'QUALITY',
    description: 'Full fabric roll grading on 4-point ASTM D5430 scale prior to finished stock clearance.',
  },
];

// GET all configured checkpoints (auto-seeds defaults if empty)
router.get(
  '/checkpoints',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      let configs = await prisma.qualityCheckpointConfig.findMany({
        orderBy: { sequenceOrder: 'asc' },
      });

      if (configs.length === 0) {
        for (const def of DEFAULT_CHECKPOINTS) {
          await prisma.qualityCheckpointConfig.upsert({
            where: { stageCode: def.stageCode },
            update: {},
            create: def,
          });
        }
        configs = await prisma.qualityCheckpointConfig.findMany({
          orderBy: { sequenceOrder: 'asc' },
        });
      }

      res.json(configs);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch checkpoints', details: err.message });
    }
  }
);

// UPDATE checkpoint configuration (Supervisor/Quality Mgr/Admin)
router.put(
  '/checkpoints/:id',
  authenticateToken,
  requireRole(['ADMIN', 'QUALITY']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { isRequired, mandatoryHold, responsibleTeam, description } = req.body;
      const updated = await prisma.qualityCheckpointConfig.update({
        where: { id: req.params.id },
        data: {
          ...(isRequired !== undefined && { isRequired: Boolean(isRequired) }),
          ...(mandatoryHold !== undefined && { mandatoryHold: Boolean(mandatoryHold) }),
          ...(responsibleTeam && { responsibleTeam: String(responsibleTeam) }),
          ...(description !== undefined && { description: String(description) }),
        },
      });

      await logAudit({
        action: 'QUALITY_CHECKPOINT_UPDATED',
        entityType: 'QualityCheckpointConfig',
        entityId: updated.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: { stageCode: updated.stageCode, isRequired, mandatoryHold },
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update checkpoint', details: err.message });
    }
  }
);

// ==========================================
// 2. FILE UPLOADS (PHOTO EVIDENCE & DOCS)
// ==========================================

router.post(
  '/upload',
  authenticateToken,
  requireRole(['ADMIN', 'QUALITY']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { fileName, mimeType, base64, thumbnailBase64, originalSize, caption } = req.body;

      if (!base64 || !fileName) {
        res.status(400).json({ error: 'Missing base64 data or fileName' });
        return;
      }

      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      const effectiveMime = (mimeType || 'image/jpeg').toLowerCase();
      if (!allowedMimes.includes(effectiveMime)) {
        res.status(400).json({
          error: 'Unsupported file format. Supported formats: JPG, JPEG, PNG, WEBP.',
        });
        return;
      }

      // Strip potential data URL prefix
      const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      // Max size: 10MB
      const maxSizeBytes = 10 * 1024 * 1024;
      if (buffer.length > maxSizeBytes) {
        res.status(400).json({ error: 'File size exceeds 10MB maximum limit.' });
        return;
      }

      const ext = effectiveMime === 'image/png' ? 'png' : effectiveMime === 'image/webp' ? 'webp' : 'jpg';
      const safeBase = path.basename(fileName, path.extname(fileName)).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueFilename = `qc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeBase}.${ext}`;

      const uploadsDir = path.join(__dirname, '../../uploads/quality');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fullPath = path.join(uploadsDir, uniqueFilename);
      fs.writeFileSync(fullPath, buffer);

      const fileUrl = `/uploads/quality/${uniqueFilename}`;

      // Handle thumbnail if provided
      let thumbnailUrl = fileUrl;
      if (thumbnailBase64 && typeof thumbnailBase64 === 'string') {
        const cleanThumb = thumbnailBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        const thumbBuffer = Buffer.from(cleanThumb, 'base64');
        const thumbFilename = `qc_thumb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeBase}.${ext}`;
        const thumbFullPath = path.join(uploadsDir, thumbFilename);
        fs.writeFileSync(thumbFullPath, thumbBuffer);
        thumbnailUrl = `/uploads/quality/${thumbFilename}`;
      }

      const compressedSize = buffer.length;
      const origSize = Number(originalSize) || buffer.length;
      const compressionRatio =
        origSize > compressedSize
          ? `${Math.round(((origSize - compressedSize) / origSize) * 100)}% compressed`
          : 'Optimized';

      res.status(201).json({
        fileUrl,
        thumbnailUrl,
        fileName: uniqueFilename,
        fileSize: buffer.length,
        originalSize: origSize,
        compressedSize,
        compressionRatio,
        mimeType: effectiveMime,
        caption: caption || '',
        uploaderName: req.user?.name || 'Inspector',
        uploaderId: req.user?.id,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Photo upload error:', err);
      res.status(500).json({ error: 'Photo upload failed', details: err.message });
    }
  }
);

// ==========================================
// 3. DASHBOARD METRICS & RECENT ACTIVITIES
// ==========================================

router.get(
  '/dashboard-metrics',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const [
        inspections,
        issues,
        rollsOnHold,
        recentInspections,
        criticalIssues,
      ] = await Promise.all([
        prisma.qualityInspection.findMany({
          select: {
            id: true,
            result: true,
            stage: true,
            defectCategory: true,
            defectiveQuantity: true,
            inspectionDate: true,
            machineName: true,
            fabricType: true,
          },
        }),
        prisma.qualityIssue.findMany({
          select: {
            id: true,
            status: true,
            severity: true,
            holdStatus: true,
            affectedQuantity: true,
            createdAt: true,
            dueDate: true,
          },
        }),
        prisma.roll.findMany({
          where: {
            OR: [
              { qualityStatus: 'REWORK_REQUIRED' },
              { qualityStatus: 'ON_HOLD' },
              { qualityStatus: 'PENDING_INSPECTION' },
            ],
          },
          select: {
            id: true,
            rollId: true,
            qualityStatus: true,
            lengthMeters: true,
            fabricType: true,
            color: true,
          },
        }),
        prisma.qualityInspection.findMany({
          take: 10,
          orderBy: { inspectionDate: 'desc' },
          include: {
            photos: true,
            qualityIssue: true,
            roll: true,
          },
        }),
        prisma.qualityIssue.findMany({
          where: {
            status: { in: ['ON_HOLD', 'CORRECTION_ASSIGNED', 'CORRECTION_IN_PROGRESS', 'AWAITING_REINSPECTION', 'REINSPECTION_FAILED'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: {
            photos: true,
            inspection: true,
          },
        }),
      ]);

      const totalInspections = inspections.length;
      const inspectionsPassed = inspections.filter(
        (i) => i.result === 'PASSED'
      ).length;
      const inspectionsFailed = inspections.filter(
        (i) => i.result === 'FAILED' || i.result === 'REWORK_REQUIRED' || i.result === 'REJECTED'
      ).length;

      const issuesAwaitingCorrection = issues.filter((i) =>
        ['ON_HOLD', 'CORRECTION_ASSIGNED', 'CORRECTION_IN_PROGRESS'].includes(i.status)
      ).length;

      const reinspectionsPending = issues.filter(
        (i) => i.status === 'AWAITING_REINSPECTION'
      ).length;

      const avgDefectRate =
        totalInspections > 0
          ? ((inspectionsFailed / totalInspections) * 100).toFixed(1)
          : '0.0';

      // Stage-wise defect breakdown
      const stageBreakdown: Record<string, { total: number; passed: number; failed: number }> = {
        RAW_MATERIAL: { total: 0, passed: 0, failed: 0 },
        SPINNING_QC: { total: 0, passed: 0, failed: 0 },
        WEAVING_QC: { total: 0, passed: 0, failed: 0 },
        DYEING_QC: { total: 0, passed: 0, failed: 0 },
        FINAL_INSPECTION: { total: 0, passed: 0, failed: 0 },
      };

      for (const ins of inspections) {
        const stage = ins.stage || 'FINAL_INSPECTION';
        if (!stageBreakdown[stage]) {
          stageBreakdown[stage] = { total: 0, passed: 0, failed: 0 };
        }
        stageBreakdown[stage].total += 1;
        if (ins.result === 'PASSED') {
          stageBreakdown[stage].passed += 1;
        } else {
          stageBreakdown[stage].failed += 1;
        }
      }

      // Production hold summary
      const totalHeldMeters = rollsOnHold.reduce(
        (acc, r) => acc + (r.qualityStatus !== 'PENDING_INSPECTION' ? r.lengthMeters : 0),
        0
      );

      res.json({
        summary: {
          totalInspections,
          inspectionsPassed,
          inspectionsFailed,
          issuesAwaitingCorrection,
          reinspectionsPending,
          avgDefectRate: Number(avgDefectRate),
          passPercentage: totalInspections > 0 ? ((inspectionsPassed / totalInspections) * 100).toFixed(1) : '100.0',
        },
        holdSummary: {
          activeHeldCount: rollsOnHold.filter((r) => r.qualityStatus !== 'PENDING_INSPECTION').length,
          totalHeldMeters,
          pendingInitialInspectionCount: rollsOnHold.filter((r) => r.qualityStatus === 'PENDING_INSPECTION').length,
          heldRolls: rollsOnHold.slice(0, 8),
        },
        stageBreakdown,
        recentInspections,
        criticalIssues,
      });
    } catch (err: any) {
      console.error('Failed to fetch quality dashboard metrics:', err);
      res.status(500).json({ error: 'Failed to fetch dashboard metrics', details: err.message });
    }
  }
);

// ==========================================
// 4. INSPECTIONS LIST & CREATE
// ==========================================

// GET all inspections with filters
router.get(
  '/inspections',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { stage, result, severity, startDate, endDate, search } = req.query;

      const where: any = {};
      if (stage && stage !== 'ALL') where.stage = String(stage);
      if (result && result !== 'ALL') where.result = String(result);
      if (severity && severity !== 'ALL') where.severity = String(severity);

      if (startDate || endDate) {
        where.inspectionDate = {};
        if (startDate) where.inspectionDate.gte = new Date(String(startDate));
        if (endDate) where.inspectionDate.lte = new Date(String(endDate));
      }

      if (search) {
        const q = String(search);
        where.OR = [
          { inspectionNumber: { contains: q, mode: 'insensitive' } },
          { orderNumber: { contains: q, mode: 'insensitive' } },
          { batchOrRollNumber: { contains: q, mode: 'insensitive' } },
          { defectDescription: { contains: q, mode: 'insensitive' } },
        ];
      }

      const list = await prisma.qualityInspection.findMany({
        where,
        orderBy: { inspectionDate: 'desc' },
        include: {
          photos: true,
          qualityIssue: true,
          roll: { select: { rollId: true, fabricType: true, color: true, lengthMeters: true } },
          order: { select: { orderNumber: true, buyer: { select: { companyName: true } } } },
          machine: { select: { code: true, name: true } },
        },
      });

      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to query inspections', details: err.message });
    }
  }
);

// CREATE Quality Inspection (Pass or Fail + Hold + Linked Quality Issue)
// Only Quality Manager / Quality Inspector is authorized to inspect and upload defect photos!
router.post(
  '/inspect',
  authenticateToken,
  requireRole(['ADMIN', 'QUALITY']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        rollId: z.string().optional(),
        orderId: z.string().optional(),
        orderNumber: z.string().optional(),
        batchOrRollNumber: z.string().min(1, 'Batch or Roll ID is required'),
        fabricType: z.string().optional(),
        stage: z.enum([
          'RAW_MATERIAL',
          'SPINNING_QC',
          'WEAVING_QC',
          'DYEING_QC',
          'FINAL_INSPECTION',
        ]),
        machineId: z.string().optional(),
        machineName: z.string().optional(),
        inspectorName: z.string().min(1, 'Inspector name is required'),
        inspectionDate: z.string().optional(),
        result: z.enum(['PASSED', 'FAILED', 'REWORK_REQUIRED', 'REJECTED']),
        defectCategory: z.string().optional(),
        defectDescription: z.string().optional(),
        defectiveQuantity: z.number().min(0).default(0),
        affectedQuantity: z.number().min(0).default(0),
        unit: z.enum(['METERS', 'KG']).default('METERS'),
        severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL']).optional(),
        correctiveActionRequired: z.string().optional(),
        assignedTeam: z.enum([
          'SPINNING_DEPT',
          'WEAVING_DEPT',
          'DYEING_DEPT',
          'FINISHING_DEPT',
          'QUALITY_LAB',
          'STORE',
        ]).optional(),
        assignedPerson: z.string().optional(),
        dueDate: z.string().optional(),
        inspectorComments: z.string().optional(),
        remarks: z.string().optional(),
        photos: z.array(
          z.object({
            fileName: z.string(),
            fileUrl: z.string(),
            thumbnailUrl: z.string().optional(),
            fileSize: z.number().optional().default(0),
            originalSize: z.number().optional(),
            compressedSize: z.number().optional(),
            compressionRatio: z.string().optional(),
            mimeType: z.string().optional().default('image/jpeg'),
            caption: z.string().optional().default(''),
          })
        ).optional().default([]),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
        return;
      }

      const data = parsed.data;

      // Conditional validation: If result is failed, defect details are required
      const isFailed = data.result !== 'PASSED';
      if (isFailed && (!data.defectCategory || data.defectCategory === 'NONE')) {
        res.status(400).json({ error: 'Defect category is required for failed inspections.' });
        return;
      }

      // Generate unique Inspection Number: INSP-2026-XXXX
      const currentYear = new Date().getFullYear();
      const count = await prisma.qualityInspection.count();
      const seqStr = String(count + 1).padStart(4, '0');
      const inspectionNumber = `INSP-${currentYear}-${seqStr}`;

      // Find matching roll if batchOrRollNumber looks like a roll ID
      let matchedRoll = null;
      if (data.rollId) {
        matchedRoll = await prisma.roll.findUnique({ where: { id: data.rollId } });
      }
      if (!matchedRoll && data.batchOrRollNumber) {
        matchedRoll = await prisma.roll.findFirst({
          where: {
            OR: [
              { id: data.batchOrRollNumber },
              { rollId: data.batchOrRollNumber },
            ],
          },
        });
      }

      // Find order if orderNumber or orderId given
      let matchedOrder = null;
      if (data.orderId) {
        matchedOrder = await prisma.order.findUnique({ where: { id: data.orderId } });
      } else if (data.orderNumber) {
        matchedOrder = await prisma.order.findUnique({ where: { orderNumber: data.orderNumber } });
      } else if (matchedRoll) {
        matchedOrder = await prisma.order.findUnique({ where: { id: matchedRoll.orderId } });
      }

      // Check checkpoint config to see if mandatory hold applies
      const checkpoint = await prisma.qualityCheckpointConfig.findUnique({
        where: { stageCode: data.stage },
      });
      const mandatoryHold = checkpoint ? checkpoint.mandatoryHold : true;

      // Determine assigned team based on stage if not explicitly selected
      const defaultTeamMap: Record<string, string> = {
        RAW_MATERIAL: 'STORE',
        SPINNING_QC: 'SPINNING_DEPT',
        WEAVING_QC: 'WEAVING_DEPT',
        DYEING_QC: 'DYEING_DEPT',
        FINAL_INSPECTION: 'QUALITY_LAB',
      };
      const assignedTeam = data.assignedTeam || defaultTeamMap[data.stage] || 'QUALITY_LAB';

      // Perform atomic database transaction
      const created = await prisma.$transaction(async (tx) => {
        // 1. Create Quality Inspection record
        const inspection = await tx.qualityInspection.create({
          data: {
            inspectionNumber,
            rollId: matchedRoll ? matchedRoll.id : undefined,
            orderId: matchedOrder ? matchedOrder.id : undefined,
            orderNumber: matchedOrder?.orderNumber || data.orderNumber || (matchedRoll ? 'ORD-FAB' : undefined),
            batchOrRollNumber: data.batchOrRollNumber,
            fabricType: data.fabricType || matchedRoll?.fabricType,
            stage: data.stage,
            machineId: data.machineId,
            machineName: data.machineName,
            inspectorId: req.user?.id,
            inspectorName: data.inspectorName,
            inspectionDate: data.inspectionDate ? new Date(data.inspectionDate) : new Date(),
            result: data.result,
            defectCategory: data.defectCategory || 'NONE',
            defectDescription: data.defectDescription,
            defectiveQuantity: data.defectiveQuantity,
            affectedQuantity: data.affectedQuantity,
            unit: data.unit,
            severity: data.severity,
            correctiveActionReq: data.correctiveActionRequired,
            remarks: data.remarks,
            inspectorComments: data.inspectorComments,
          },
        });

        // 2. Attach photographic evidence
        if (data.photos && data.photos.length > 0) {
          for (const photo of data.photos) {
            await tx.qualityAttachment.create({
              data: {
                fileName: photo.fileName,
                fileUrl: photo.fileUrl,
                thumbnailUrl: photo.thumbnailUrl || photo.fileUrl,
                fileSize: photo.fileSize || 0,
                originalSize: photo.originalSize || photo.fileSize || 0,
                compressedSize: photo.compressedSize || photo.fileSize || 0,
                compressionRatio: photo.compressionRatio || 'Optimized',
                mimeType: photo.mimeType || 'image/jpeg',
                caption: photo.caption || '',
                uploaderName: req.user?.name || data.inspectorName,
                uploaderId: req.user?.id,
                inspectionId: inspection.id,
              },
            });
          }
        }

        // 3. Handle Failed Inspection: Place on Hold & Automatically Create Quality Issue
        let createdIssue = null;
        if (isFailed) {
          const issueCount = await tx.qualityIssue.count();
          const issueSeq = String(issueCount + 1).padStart(4, '0');
          const issueNumber = `QI-${currentYear}-${issueSeq}`;

          const calcDueDate = data.dueDate
            ? new Date(data.dueDate)
            : new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h default

          createdIssue = await tx.qualityIssue.create({
            data: {
              issueNumber,
              inspectionId: inspection.id,
              orderId: matchedOrder ? matchedOrder.id : undefined,
              orderNumber: matchedOrder?.orderNumber || data.orderNumber,
              batchOrRollNumber: data.batchOrRollNumber,
              stage: data.stage,
              defectCategory: data.defectCategory || 'OTHER',
              defectDescription: data.defectDescription || 'Inspection failed defect detected',
              severity: data.severity || 'MAJOR',
              affectedQuantity: data.affectedQuantity || data.defectiveQuantity || 0,
              unit: data.unit,
              recommendedAction: data.correctiveActionRequired || 'Correct defect and request reinspection',
              assignedTeam,
              assignedPerson: data.assignedPerson,
              dueDate: calcDueDate,
              status: mandatoryHold ? 'ON_HOLD' : 'CORRECTION_ASSIGNED',
              holdStatus: mandatoryHold ? 'ON_HOLD' : 'RELEASED',
            },
          });

          // Link photos to issue as well
          if (data.photos && data.photos.length > 0) {
            for (const photo of data.photos) {
              await tx.qualityAttachment.create({
                data: {
                  fileName: photo.fileName,
                  fileUrl: photo.fileUrl,
                  thumbnailUrl: photo.thumbnailUrl || photo.fileUrl,
                  fileSize: photo.fileSize || 0,
                  originalSize: photo.originalSize || photo.fileSize || 0,
                  compressedSize: photo.compressedSize || photo.fileSize || 0,
                  compressionRatio: photo.compressionRatio || 'Optimized',
                  mimeType: photo.mimeType || 'image/jpeg',
                  caption: photo.caption || '',
                  uploaderName: req.user?.name || data.inspectorName,
                  uploaderId: req.user?.id,
                  qualityIssueId: createdIssue.id,
                },
              });
            }
          }

          // Initial status audit log
          await tx.qualityStatusLog.create({
            data: {
              qualityIssueId: createdIssue.id,
              fromStatus: 'INSPECTION_PENDING',
              toStatus: mandatoryHold ? 'ON_HOLD' : 'CORRECTION_ASSIGNED',
              action: 'INSPECTION_FAILED_HOLD_INITIATED',
              comments: `Material placed on hold at ${data.stage}. Corrective action assigned to ${assignedTeam}.`,
              performedBy: req.user?.name || data.inspectorName,
              performedById: req.user?.id,
            },
          });

          // If roll exists, put on hold to prevent proceeding to next stage or stock!
          if (matchedRoll) {
            await tx.roll.update({
              where: { id: matchedRoll.id },
              data: {
                qualityStatus: data.result === 'REJECTED' ? 'REJECTED' : 'REWORK_REQUIRED',
                inventoryStatus: 'IN_PROCESS', // blocked from finished stock
              },
            });
          }

          // In-app alert notification to Production Unit
          const photoNote = data.photos && data.photos.length > 0 ? ` (${data.photos.length} defect photograph(s) captured via camera)` : '';
          const isHole = data.defectCategory === 'HOLES_FABRIC_DAMAGE';
          const defectCatLabel = (data.defectCategory || 'DEFECT').replace(/_/g, ' ');
          await tx.notification.create({
            data: {
              title: isHole
                ? `🚨 CRITICAL DEFECT: Hole in Fabric on ${data.batchOrRollNumber}`
                : `🚨 Quality Alert: ${defectCatLabel} on ${data.batchOrRollNumber}`,
              message: `Quality Manager ${data.inspectorName} flagged a ${data.severity || 'CRITICAL'} defect (${data.defectCategory || 'DEFECT'}) at ${data.stage}${photoNote}. Material is on MANDATORY HOLD. Production Unit (${assignedTeam}) has been alerted to review defect photographs and initiate immediate corrective action.`,
              type: 'ALERT',
              link: '/app/quality',
            },
          });
        } else {
          // PASSED: Authorize material to proceed
          if (matchedRoll) {
            if (data.stage === 'FINAL_INSPECTION') {
              // Final inspection passed -> Enter Finished Goods Stock
              let locId = matchedRoll.locationId;
              if (!locId) {
                const defLoc = await tx.finishedGoodsLocation.findFirst();
                locId = defLoc ? defLoc.id : null;
              }

              await tx.roll.update({
                where: { id: matchedRoll.id },
                data: {
                  qualityStatus: 'PASSED',
                  inventoryStatus: 'IN_FINISHED_STOCK',
                  locationId: locId,
                },
              });

              await tx.orderItem.update({
                where: { id: matchedRoll.orderItemId },
                data: {
                  passedQuantity: { increment: matchedRoll.lengthMeters },
                },
              });

              // Check if entire order is ready to ship
              const items = await tx.orderItem.findMany({ where: { orderId: matchedRoll.orderId } });
              const allPassed = items.every((it) => it.passedQuantity >= it.requiredQuantity);
              if (allPassed) {
                await tx.order.update({
                  where: { id: matchedRoll.orderId },
                  data: { status: 'READY_TO_SHIP' },
                });
              }
            } else {
              // Intermediate checkpoint passed -> clear hold flag
              await tx.roll.update({
                where: { id: matchedRoll.id },
                data: {
                  qualityStatus: 'PASSED',
                },
              });
            }
          }
        }

        return { inspection, qualityIssue: createdIssue };
      });

      await logAudit({
        action: 'QUALITY_INSPECTION_RECORDED',
        entityType: 'QualityInspection',
        entityId: created.inspection.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: {
          inspectionNumber,
          stage: data.stage,
          result: data.result,
          defectCategory: data.defectCategory,
          batchOrRollNumber: data.batchOrRollNumber,
        },
      });

      res.status(201).json({
        message: 'Quality inspection recorded successfully',
        inspectionNumber,
        inspection: created.inspection,
        qualityIssue: created.qualityIssue,
      });
    } catch (err: any) {
      console.error('Inspection recording error:', err);
      res.status(500).json({ error: 'Failed to record inspection', details: err.message });
    }
  }
);

// ==========================================
// 5. QUALITY ISSUES & CORRECTIVE ACTIONS
// ==========================================

// GET all quality issues
router.get(
  '/issues',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { status, severity, stage, assignedTeam, search } = req.query;

      const where: any = {};
      if (status && status !== 'ALL') where.status = String(status);
      if (severity && severity !== 'ALL') where.severity = String(severity);
      if (stage && stage !== 'ALL') where.stage = String(stage);
      if (assignedTeam && assignedTeam !== 'ALL') where.assignedTeam = String(assignedTeam);

      if (search) {
        const q = String(search);
        where.OR = [
          { issueNumber: { contains: q, mode: 'insensitive' } },
          { batchOrRollNumber: { contains: q, mode: 'insensitive' } },
          { orderNumber: { contains: q, mode: 'insensitive' } },
          { defectDescription: { contains: q, mode: 'insensitive' } },
        ];
      }

      const issues = await prisma.qualityIssue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          inspection: true,
          photos: true,
          statusHistory: { orderBy: { createdAt: 'desc' } },
          order: { select: { orderNumber: true, buyer: { select: { companyName: true } } } },
        },
      });

      res.json(issues);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch quality issues', details: err.message });
    }
  }
);

// GET specific quality issue report
router.get(
  '/issues/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const issue = await prisma.qualityIssue.findFirst({
        where: {
          OR: [{ id: req.params.id }, { issueNumber: req.params.id }],
        },
        include: {
          inspection: {
            include: {
              roll: {
                include: {
                  productionJob: { include: { machine: true, assignedEmployee: true } },
                },
              },
            },
          },
          photos: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
          order: { include: { buyer: true } },
        },
      });

      if (!issue) {
        res.status(404).json({ error: 'Quality issue not found' });
        return;
      }

      res.json(issue);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch quality issue', details: err.message });
    }
  }
);

// PRODUCTION UNIT ACCEPTS QUALITY MANAGEMENT DOCUMENTATION & DEFECT DOSSIER
router.put(
  '/issues/:id/accept-documentation',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { acceptanceNotes, assignedOperator } = req.body;

      const issue = await prisma.qualityIssue.findFirst({
        where: { OR: [{ id: req.params.id }, { issueNumber: req.params.id }] },
        include: {
          inspection: true,
          photos: true,
        },
      });

      if (!issue) {
        res.status(404).json({ error: 'Quality issue not found' });
        return;
      }

      if (issue.status === 'APPROVED_TO_CONTINUE') {
        res.status(400).json({ error: 'This quality issue has already been resolved and released.' });
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const resIssue = await tx.qualityIssue.update({
          where: { id: issue.id },
          data: {
            documentationAccepted: true,
            documentationAcceptedBy: req.user?.name || 'Production Incharge',
            documentationAcceptedAt: new Date(),
            documentationAcceptanceNotes:
              acceptanceNotes || 'Quality documentation and photographic evidence reviewed and accepted by Production Unit.',
            assignedPerson: assignedOperator || issue.assignedPerson,
            status: 'CORRECTION_IN_PROGRESS',
          },
        });

        // Status history audit log
        await tx.qualityStatusLog.create({
          data: {
            qualityIssueId: issue.id,
            fromStatus: issue.status,
            toStatus: 'CORRECTION_IN_PROGRESS',
            action: 'QA_DOCUMENTATION_ACCEPTED_BY_PRODUCTION',
            comments: `Production Unit formally accepted QA documentation & defect photos. ${acceptanceNotes || ''}`,
            performedBy: req.user?.name || 'Production Staff',
            performedById: req.user?.id,
          },
        });

        // Notify Quality Assurance Team
        await tx.notification.create({
          data: {
            title: `📋 QA Documentation Accepted: ${issue.issueNumber}`,
            message: `Production Unit (${req.user?.name || 'Production Incharge'}) has reviewed and accepted the Quality Documentation and photographic evidence for ${issue.batchOrRollNumber} (${(issue.defectCategory || 'DEFECT').replace(/_/g, ' ')}). Shop floor correction is now IN PROGRESS.`,
            type: 'INFO',
            link: '/app/quality',
          },
        });

        return resIssue;
      });

      await logAudit({
        action: 'QA_DOCUMENTATION_ACCEPTED',
        entityType: 'QualityIssue',
        entityId: issue.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: { issueNumber: issue.issueNumber, acceptanceNotes },
      });

      res.json({
        message: 'Quality documentation and photographic evidence accepted by Production Unit. Correction in progress.',
        issue: updated,
      });
    } catch (err: any) {
      console.error('Accept documentation error:', err);
      res.status(500).json({ error: 'Failed to accept quality documentation', details: err.message });
    }
  }
);

// PRODUCTION MANAGER UPDATES PRODUCTION STRATEGY IN RESPONSE TO QA DEFECT DIRECTIVE
router.put(
  '/issues/:id/strategy',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        strategyType,
        strategySummary,
        strategyDetails,
        parameterChanges,
        preventiveMeasures,
        assignedOperator,
      } = req.body;

      if (!strategyType || !strategySummary) {
        res.status(400).json({ error: 'Strategy type and strategy summary are required.' });
        return;
      }

      const issue = await prisma.qualityIssue.findFirst({
        where: { OR: [{ id: req.params.id }, { issueNumber: req.params.id }] },
        include: { inspection: true, photos: true },
      });

      if (!issue) {
        res.status(404).json({ error: 'Quality issue not found' });
        return;
      }

      if (['APPROVED_TO_CONTINUE', 'REJECTED_OR_SCRAPPED'].includes(issue.status)) {
        res.status(400).json({
          error: `Cannot update strategy for issue already closed with status: ${issue.status}`,
        });
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const resIssue = await tx.qualityIssue.update({
          where: { id: issue.id },
          data: {
            strategyType: String(strategyType),
            strategySummary: String(strategySummary),
            strategyDetails: strategyDetails ? String(strategyDetails) : undefined,
            parameterChanges: parameterChanges ? String(parameterChanges) : undefined,
            preventiveMeasures: preventiveMeasures ? String(preventiveMeasures) : undefined,
            strategyImplementedBy: req.user?.name || 'Production Manager',
            strategyImplementedAt: new Date(),
            assignedPerson: assignedOperator || issue.assignedPerson,
            documentationAccepted: true,
            documentationAcceptedBy: issue.documentationAcceptedBy || req.user?.name,
            documentationAcceptedAt: issue.documentationAcceptedAt || new Date(),
            status: 'STRATEGY_IMPLEMENTED',
          },
        });

        // Status history audit log
        await tx.qualityStatusLog.create({
          data: {
            qualityIssueId: issue.id,
            fromStatus: issue.status,
            toStatus: 'STRATEGY_IMPLEMENTED',
            action: 'PRODUCTION_STRATEGY_UPDATED',
            comments: `Production Manager updated strategy: [${strategyType}] ${strategySummary}. Parameters: ${parameterChanges || 'None specified'}.`,
            performedBy: req.user?.name || 'Production Manager',
            performedById: req.user?.id,
          },
        });

        // Notify Quality Team of the strategy change
        await tx.notification.create({
          data: {
            title: `🛠️ Production Strategy Updated: ${issue.issueNumber}`,
            message: `Production Manager (${req.user?.name || 'Production Mgr'}) adjusted production strategy [${strategyType.replace(/_/g, ' ')}] on ${issue.batchOrRollNumber} to eliminate root causes of ${(issue.defectCategory || 'DEFECT').replace(/_/g, ' ')}. Action: "${strategySummary}".`,
            type: 'INFO',
            link: '/app/quality',
          },
        });

        return resIssue;
      });

      await logAudit({
        action: 'PRODUCTION_STRATEGY_UPDATED',
        entityType: 'QualityIssue',
        entityId: issue.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: { issueNumber: issue.issueNumber, strategyType, strategySummary },
      });

      res.json({
        message: 'Production strategy successfully updated and recorded.',
        issue: updated,
      });
    } catch (err: any) {
      console.error('Update strategy error:', err);
      res.status(500).json({ error: 'Failed to update production strategy', details: err.message });
    }
  }
);

// PRODUCTION TEAM SUBMITS CORRECTION (Moves to AWAITING_REINSPECTION)
router.put(
  '/issues/:id/correct',
  authenticateToken,
  requireRole(['ADMIN', 'PRODUCTION', 'QUALITY']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { correctionNotes, rootCause, completionEvidencePhotos } = req.body;

      if (!correctionNotes) {
        res.status(400).json({ error: 'Correction completion notes are required.' });
        return;
      }

      const issue = await prisma.qualityIssue.findFirst({
        where: { OR: [{ id: req.params.id }, { issueNumber: req.params.id }] },
      });

      if (!issue) {
        res.status(404).json({ error: 'Quality issue not found' });
        return;
      }

      // Valid state check
      if (['APPROVED_TO_CONTINUE', 'REJECTED_OR_SCRAPPED'].includes(issue.status)) {
        res.status(400).json({
          error: `Cannot update correction for issue already closed with status: ${issue.status}`,
        });
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const resIssue = await tx.qualityIssue.update({
          where: { id: issue.id },
          data: {
            status: 'AWAITING_REINSPECTION',
            correctionNotes: String(correctionNotes),
            rootCause: rootCause ? String(rootCause) : issue.rootCause,
            correctionCompletedAt: new Date(),
            correctionSubmittedBy: req.user?.name,
          },
        });

        // Add any attached correction evidence photos
        if (completionEvidencePhotos && Array.isArray(completionEvidencePhotos)) {
          for (const p of completionEvidencePhotos) {
            await tx.qualityAttachment.create({
              data: {
                fileName: p.fileName,
                fileUrl: p.fileUrl,
                fileSize: p.fileSize || 0,
                mimeType: p.mimeType || 'image/jpeg',
                caption: p.caption || 'Correction completion evidence',
                uploaderName: req.user?.name || 'Production Staff',
                uploaderId: req.user?.id,
                qualityIssueId: issue.id,
              },
            });
          }
        }

        // Status history audit
        await tx.qualityStatusLog.create({
          data: {
            qualityIssueId: issue.id,
            fromStatus: issue.status,
            toStatus: 'AWAITING_REINSPECTION',
            action: 'CORRECTION_COMPLETED_AWAITING_REINSPECTION',
            comments: `Correction performed: ${correctionNotes}`,
            performedBy: req.user?.name || 'Production Staff',
            performedById: req.user?.id,
          },
        });

        // Notify Quality Assurance
        await tx.notification.create({
          data: {
            title: `Reinspection Requested: ${issue.issueNumber}`,
            message: `Production has completed corrections for ${issue.batchOrRollNumber}. Reinspection required.`,
            type: 'REINSPECTION_REQUESTED',
            link: '/app/quality',
          },
        });

        return resIssue;
      });

      await logAudit({
        action: 'QUALITY_CORRECTION_SUBMITTED',
        entityType: 'QualityIssue',
        entityId: issue.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: { issueNumber: issue.issueNumber, correctionNotes },
      });

      res.json({
        message: 'Correction notes submitted. Awaiting authorized quality reinspection.',
        issue: updated,
      });
    } catch (err: any) {
      console.error('Correction submit error:', err);
      res.status(500).json({ error: 'Failed to record correction', details: err.message });
    }
  }
);

// REINSPECTION & RELEASE FROM HOLD (Only Quality Inspector / Manager / Admin)
// Production staff cannot self-approve their own corrections!
router.post(
  '/issues/:id/reinspect',
  authenticateToken,
  requireRole(['ADMIN', 'QUALITY']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const reinspectionResult = req.body.reinspectionResult || req.body.result;
      const reinspectionNotes = req.body.reinspectionNotes || req.body.notes || '';

      if (!['PASSED', 'FAILED', 'REJECTED_OR_SCRAPPED'].includes(reinspectionResult)) {
        res.status(400).json({
          error: "Invalid reinspectionResult. Must be 'PASSED', 'FAILED', or 'REJECTED_OR_SCRAPPED'.",
        });
        return;
      }

      const issue = await prisma.qualityIssue.findFirst({
        where: { OR: [{ id: req.params.id }, { issueNumber: req.params.id }] },
        include: { inspection: true },
      });

      if (!issue) {
        res.status(404).json({ error: 'Quality issue not found' });
        return;
      }

      const isPassed = reinspectionResult === 'PASSED';
      const isScrapped = reinspectionResult === 'REJECTED_OR_SCRAPPED';
      const nextStatus = isPassed
        ? 'APPROVED_TO_CONTINUE'
        : isScrapped
        ? 'REJECTED_OR_SCRAPPED'
        : 'REINSPECTION_FAILED';

      const nextHoldStatus = isPassed ? 'RELEASED' : 'ON_HOLD';

      // Find roll if batchOrRollNumber relates to one
      const matchedRoll = await prisma.roll.findFirst({
        where: {
          OR: [
            { id: issue.batchOrRollNumber },
            { rollId: issue.batchOrRollNumber },
          ],
        },
      });

      const updated = await prisma.$transaction(async (tx) => {
        // 1. Update Quality Issue
        const updatedIssue = await tx.qualityIssue.update({
          where: { id: issue.id },
          data: {
            status: nextStatus,
            holdStatus: nextHoldStatus,
            reinspectionResult,
            reinspectionNotes: reinspectionNotes || '',
            reinspectedBy: req.user?.name,
            reinspectedAt: new Date(),
            ...(isPassed && {
              approvedBy: req.user?.name,
              approvedAt: new Date(),
            }),
          },
        });

        // 2. Add Status Audit Log
        await tx.qualityStatusLog.create({
          data: {
            qualityIssueId: issue.id,
            fromStatus: issue.status,
            toStatus: nextStatus,
            action: isPassed
              ? 'REINSPECTION_PASSED_HOLD_RELEASED'
              : isScrapped
              ? 'REINSPECTION_SCRAPPED_PERMANENT'
              : 'REINSPECTION_FAILED_HOLD_CONTINUES',
            comments: reinspectionNotes || `Reinspection ${reinspectionResult} by ${req.user?.name}`,
            performedBy: req.user?.name || 'Quality Inspector',
            performedById: req.user?.id,
          },
        });

        // 3. Create linked Reinspection Record in QualityInspection table
        const currentYear = new Date().getFullYear();
        const inspCount = await tx.qualityInspection.count();
        const reinspNumber = `REINSP-${currentYear}-${String(inspCount + 1).padStart(4, '0')}`;

        await tx.qualityInspection.create({
          data: {
            inspectionNumber: reinspNumber,
            rollId: matchedRoll ? matchedRoll.id : undefined,
            orderId: issue.orderId,
            orderNumber: issue.orderNumber,
            batchOrRollNumber: issue.batchOrRollNumber,
            fabricType: issue.inspection?.fabricType,
            stage: issue.stage,
            inspectorId: req.user?.id,
            inspectorName: req.user?.name || 'Lead Inspector',
            result: isPassed ? 'PASSED' : isScrapped ? 'REJECTED' : 'FAILED',
            defectCategory: issue.defectCategory,
            defectDescription: `Reinspection of ${issue.issueNumber}: ${reinspectionNotes || ''}`,
            defectiveQuantity: isPassed ? 0 : issue.affectedQuantity,
            affectedQuantity: issue.affectedQuantity,
            unit: issue.unit,
            severity: issue.severity,
            isReinspection: true,
            originalInspectionId: issue.inspectionId,
            inspectorComments: reinspectionNotes,
          },
        });

        // 4. Update Roll and stock permissions
        if (matchedRoll) {
          if (isPassed) {
            if (issue.stage === 'FINAL_INSPECTION') {
              let locId = matchedRoll.locationId;
              if (!locId) {
                const defLoc = await tx.finishedGoodsLocation.findFirst();
                locId = defLoc ? defLoc.id : null;
              }

              await tx.roll.update({
                where: { id: matchedRoll.id },
                data: {
                  qualityStatus: 'PASSED',
                  inventoryStatus: 'IN_FINISHED_STOCK',
                  locationId: locId,
                },
              });

              await tx.orderItem.update({
                where: { id: matchedRoll.orderItemId },
                data: {
                  passedQuantity: { increment: matchedRoll.lengthMeters },
                },
              });
            } else {
              // Intermediate stage release
              await tx.roll.update({
                where: { id: matchedRoll.id },
                data: {
                  qualityStatus: 'PASSED',
                },
              });
            }
          } else if (isScrapped) {
            await tx.roll.update({
              where: { id: matchedRoll.id },
              data: {
                qualityStatus: 'REJECTED',
                inventoryStatus: 'IN_PROCESS',
              },
            });
          }
        }

        // Notify production team of resolution
        await tx.notification.create({
          data: {
            title: isPassed
              ? `Quality Hold Released: ${issue.batchOrRollNumber}`
              : `Reinspection ${reinspectionResult}: ${issue.batchOrRollNumber}`,
            message: isPassed
              ? `Material ${issue.batchOrRollNumber} approved to continue by ${req.user?.name}. Hold is released.`
              : `Material ${issue.batchOrRollNumber} remains on hold after reinspection failure.`,
            type: 'QUALITY_ALERT',
            link: '/app/quality',
          },
        });

        return updatedIssue;
      });

      await logAudit({
        action: 'QUALITY_REINSPECTION_RECORDED',
        entityType: 'QualityIssue',
        entityId: issue.id,
        performedById: req.user?.id,
        performedByName: req.user?.name,
        details: {
          issueNumber: issue.issueNumber,
          reinspectionResult,
          nextStatus,
          reinspectionNotes,
        },
      });

      res.json({
        message: isPassed
          ? `Reinspection passed. Hold released for ${issue.batchOrRollNumber}.`
          : `Reinspection recorded (${reinspectionResult}). Material remains on hold.`,
        issue: updated,
      });
    } catch (err: any) {
      console.error('Reinspection error:', err);
      res.status(500).json({ error: 'Failed to record reinspection', details: err.message });
    }
  }
);

// ==========================================
// 6. REPORTS & ANALYTICS
// ==========================================

router.get(
  '/analytics',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const [inspections, issues, machines] = await Promise.all([
        prisma.qualityInspection.findMany({
          include: {
            machine: true,
            roll: true,
          },
        }),
        prisma.qualityIssue.findMany({
          include: {
            inspection: true,
          },
        }),
        prisma.machine.findMany({ select: { id: true, code: true, name: true, type: true } }),
      ]);

      const totalInspections = inspections.length;
      const totalPassed = inspections.filter((i) => i.result === 'PASSED').length;
      const totalFailed = inspections.filter((i) => i.result !== 'PASSED').length;

      // 1. Defect frequency by stage
      const defectsByStage: Record<string, number> = {
        RAW_MATERIAL: 0,
        SPINNING_QC: 0,
        WEAVING_QC: 0,
        DYEING_QC: 0,
        FINAL_INSPECTION: 0,
      };

      // 2. Defect frequency by category
      const defectCategories: Record<string, number> = {};

      // 3. Defect frequency by machine
      const defectsByMachine: Record<string, number> = {};

      // 4. Defects by fabric type
      const defectsByFabric: Record<string, number> = {};

      // 5. Total material wastage (Meters & Cost estimation)
      let totalWastageMeters = 0;

      for (const ins of inspections) {
        if (ins.result !== 'PASSED') {
          const st = ins.stage || 'FINAL_INSPECTION';
          defectsByStage[st] = (defectsByStage[st] || 0) + 1;

          if (ins.defectCategory && ins.defectCategory !== 'NONE') {
            defectCategories[ins.defectCategory] = (defectCategories[ins.defectCategory] || 0) + 1;
          }

          const machKey = ins.machine?.name || ins.machineName || 'Unassigned Machine';
          defectsByMachine[machKey] = (defectsByMachine[machKey] || 0) + 1;

          const fabKey = ins.fabricType || ins.roll?.fabricType || 'Cotton Standard';
          defectsByFabric[fabKey] = (defectsByFabric[fabKey] || 0) + 1;

          totalWastageMeters += ins.defectiveQuantity || ins.affectedQuantity || 0;
        }
      }

      // Average resolution time for closed issues
      const closedIssues = issues.filter((i) => i.approvedAt && i.createdAt);
      let totalResolutionHours = 0;
      for (const iss of closedIssues) {
        const diffMs = new Date(iss.approvedAt!).getTime() - new Date(iss.createdAt).getTime();
        totalResolutionHours += diffMs / (1000 * 60 * 60);
      }
      const avgResolutionTimeHours =
        closedIssues.length > 0 ? (totalResolutionHours / closedIssues.length).toFixed(1) : '24.0';

      // Open and overdue issues count
      const now = new Date();
      const openIssues = issues.filter((i) =>
        ['ON_HOLD', 'CORRECTION_ASSIGNED', 'CORRECTION_IN_PROGRESS', 'AWAITING_REINSPECTION', 'REINSPECTION_FAILED'].includes(
          i.status
        )
      );
      const overdueIssues = openIssues.filter((i) => new Date(i.dueDate) < now);

      // Estimated financial wastage: average textile fabric cost ₹120/meter
      const estimatedWastageCost = totalWastageMeters * 120;

      res.json({
        totalInspections,
        totalPassed,
        totalFailed,
        passRate: totalInspections > 0 ? ((totalPassed / totalInspections) * 100).toFixed(1) : '100.0',
        failureRate: totalInspections > 0 ? ((totalFailed / totalInspections) * 100).toFixed(1) : '0.0',
        defectsByStage,
        defectCategories,
        defectsByMachine,
        defectsByFabric,
        totalWastageMeters,
        estimatedWastageCost,
        avgResolutionTimeHours: Number(avgResolutionTimeHours),
        openIssuesCount: openIssues.length,
        overdueIssuesCount: overdueIssues.length,
      });
    } catch (err: any) {
      console.error('Analytics error:', err);
      res.status(500).json({ error: 'Failed to compile quality analytics', details: err.message });
    }
  }
);

// ==========================================
// 7. BACKWARD COMPATIBILITY ENDPOINTS
// ==========================================

// GET all rolls pending quality inspection (used by other modules)
router.get(
  '/pending',
  authenticateToken,
  requireRole(['ADMIN', 'QUALITY', 'PRODUCTION']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const pendingRolls = await prisma.roll.findMany({
        where: {
          qualityStatus: { in: ['PENDING_INSPECTION', 'REWORK_REQUIRED', 'ON_HOLD'] },
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
          inspections: {
            orderBy: { inspectionDate: 'desc' },
            include: { photos: true, qualityIssue: true },
          },
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

// Defect trends summary
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
      const reworkCount = inspections.filter((i) => i.result === 'REWORK_REQUIRED' || i.result === 'FAILED').length;
      const rejectedCount = inspections.filter((i) => i.result === 'REJECTED').length;

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
        passPercentage: totalInspected > 0 ? ((passedCount / totalInspected) * 100).toFixed(1) : '100.0',
        defectCategories: categoryCounts,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch defect summary', details: err.message });
    }
  }
);

export default router;
