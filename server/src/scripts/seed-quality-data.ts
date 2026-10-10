import { prisma } from '../db/prisma';

async function seedQualityData() {
  console.log('Seeding stage-wise quality control records...');

  const orders = await prisma.order.findMany({ take: 5, include: { items: true } });
  const rolls = await prisma.roll.findMany({ take: 8 });
  const machines = await prisma.machine.findMany();

  const loom = machines.find((m) => m.type === 'WEAVING') || machines[0];
  const ringFrame = machines.find((m) => m.type === 'SPINNING') || machines[0];
  const dyeMachine = machines.find((m) => m.type === 'DYEING') || machines[0];

  const roll1 = rolls[0];
  const roll2 = rolls[1] || rolls[0];
  const roll3 = rolls[2] || rolls[0];

  // 1. Weaving Quality Check Issue (Status: ON_HOLD)
  const insp1 = await prisma.qualityInspection.upsert({
    where: { inspectionNumber: 'INSP-2026-0101' },
    update: {},
    create: {
      inspectionNumber: 'INSP-2026-0101',
      rollId: roll1?.id,
      orderId: roll1?.orderId,
      orderNumber: orders[0]?.orderNumber || 'ORD-2026-001',
      batchOrRollNumber: roll1?.rollId || 'ROLL-2026-0001',
      fabricType: roll1?.fabricType || 'Cotton Denim Twill',
      stage: 'WEAVING_QC',
      machineId: loom?.id,
      machineName: loom ? `${loom.name} (${loom.code})` : 'Picanol Air-Jet Loom #4',
      inspectorName: 'Suresh Kumar (QA Lead)',
      result: 'FAILED',
      defectCategory: 'BROKEN_THREADS',
      defectDescription: 'Multiple broken warp threads identified at the 140-meter mark resulting in visible streak lines across 15 meters.',
      defectiveQuantity: 15,
      affectedQuantity: roll1 ? roll1.lengthMeters : 120,
      unit: 'METERS',
      severity: 'CRITICAL',
      correctiveActionReq: 'Stop loom #4 immediately. Re-thread broken warp ends through harness and reed. Mark cut-out zone and request supervisor reinspection.',
      remarks: 'Loom shuttle tension sensor flagged irregular warp tension prior to stoppage.',
      photos: {
        create: [
          {
            fileName: 'qc_broken_warp_loom.svg',
            fileUrl: '/uploads/quality/qc_broken_warp_loom.svg',
            fileSize: 2450,
            mimeType: 'image/svg+xml',
            caption: 'Close-up of reed line misalignment and severed warp ends at harness eyelet #142.',
            uploaderName: 'Suresh Kumar (QA Lead)',
          },
        ],
      },
    },
  });

  const issue1 = await prisma.qualityIssue.upsert({
    where: { issueNumber: 'QI-2026-0101' },
    update: {},
    create: {
      issueNumber: 'QI-2026-0101',
      inspectionId: insp1.id,
      orderId: roll1?.orderId,
      orderNumber: orders[0]?.orderNumber || 'ORD-2026-001',
      batchOrRollNumber: roll1?.rollId || 'ROLL-2026-0001',
      stage: 'WEAVING_QC',
      defectCategory: 'BROKEN_THREADS',
      defectDescription: 'Multiple broken warp threads identified at 140m mark.',
      severity: 'CRITICAL',
      affectedQuantity: roll1 ? roll1.lengthMeters : 120,
      unit: 'METERS',
      rootCause: 'Reed friction and excessive warp beam let-off tension on Loom #4.',
      recommendedAction: 'Re-beam warp threads, mend broken picks, and verify reed alignment before restarting.',
      assignedTeam: 'WEAVING_DEPT',
      assignedPerson: 'Ramesh Weaving Master',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'ON_HOLD',
      holdStatus: 'ON_HOLD',
      photos: {
        create: [
          {
            fileName: 'qc_broken_warp_loom.svg',
            fileUrl: '/uploads/quality/qc_broken_warp_loom.svg',
            fileSize: 2450,
            mimeType: 'image/svg+xml',
            caption: 'Warp thread fault on Loom #4',
            uploaderName: 'Suresh Kumar',
          },
        ],
      },
      statusHistory: {
        create: [
          {
            fromStatus: 'INSPECTION_PENDING',
            toStatus: 'ON_HOLD',
            action: 'INSPECTION_FAILED_HOLD_INITIATED',
            comments: 'Material placed on strict production hold. Loom #4 stopped for corrective maintenance.',
            performedBy: 'Suresh Kumar (QA Lead)',
          },
        ],
      },
    },
  });

  // 2. Spinning QC Issue (Status: AWAITING_REINSPECTION)
  const insp2 = await prisma.qualityInspection.upsert({
    where: { inspectionNumber: 'INSP-2026-0102' },
    update: {},
    create: {
      inspectionNumber: 'INSP-2026-0102',
      orderNumber: orders[1]?.orderNumber || 'ORD-2026-002',
      batchOrRollNumber: 'SPIN-LOT-40S-B8',
      fabricType: '40s Combed Cotton Yarn',
      stage: 'SPINNING_QC',
      machineId: ringFrame?.id,
      machineName: ringFrame ? `${ringFrame.name} (${ringFrame.code})` : 'Rieter Ring Frame RF-01',
      inspectorName: 'Anitha Rajan (Spinning QA)',
      result: 'FAILED',
      defectCategory: 'UNEVEN_YARN_THICKNESS',
      defectDescription: 'Yarn count unevenness (CV% exceeded 18.5%) detected across spindle bank #4.',
      defectiveQuantity: 45,
      affectedQuantity: 250,
      unit: 'KG',
      severity: 'MAJOR',
      correctiveActionReq: 'Replace worn drafting aprons on spindle row #4. Recalibrate draft gear ratio.',
      photos: {
        create: [
          {
            fileName: 'qc_uneven_yarn_slub.svg',
            fileUrl: '/uploads/quality/qc_uneven_yarn_slub.svg',
            fileSize: 2450,
            mimeType: 'image/svg+xml',
            caption: 'Uster tester reading showing thick and thin places exceeding tolerance limits.',
            uploaderName: 'Anitha Rajan (Spinning QA)',
          },
        ],
      },
    },
  });

  const issue2 = await prisma.qualityIssue.upsert({
    where: { issueNumber: 'QI-2026-0102' },
    update: {},
    create: {
      issueNumber: 'QI-2026-0102',
      inspectionId: insp2.id,
      orderNumber: orders[1]?.orderNumber || 'ORD-2026-002',
      batchOrRollNumber: 'SPIN-LOT-40S-B8',
      stage: 'SPINNING_QC',
      defectCategory: 'UNEVEN_YARN_THICKNESS',
      defectDescription: 'Yarn count unevenness (CV% exceeded 18.5%).',
      severity: 'MAJOR',
      affectedQuantity: 250,
      unit: 'KG',
      rootCause: 'Drafting apron wear causing sliver slippage.',
      recommendedAction: 'Replace drafting aprons and test sample cops on Uster machine.',
      assignedTeam: 'SPINNING_DEPT',
      assignedPerson: 'Murugan (Spinning Supervisor)',
      dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
      status: 'AWAITING_REINSPECTION',
      holdStatus: 'ON_HOLD',
      correctionNotes: 'Replaced 24 drafting aprons on Spindle Row #4. Tested 5 sample cops; CV% brought down to 12.2% (within 13.0% standard limit). Ready for QA sign-off.',
      correctionCompletedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      correctionSubmittedBy: 'Murugan (Spinning Supervisor)',
      photos: {
        create: [
          {
            fileName: 'qc_uneven_yarn_slub.svg',
            fileUrl: '/uploads/quality/qc_uneven_yarn_slub.svg',
            fileSize: 2450,
            mimeType: 'image/svg+xml',
            caption: 'Defect sample before correction',
            uploaderName: 'Anitha Rajan',
          },
        ],
      },
      statusHistory: {
        create: [
          {
            fromStatus: 'ON_HOLD',
            toStatus: 'CORRECTION_IN_PROGRESS',
            action: 'MAINTENANCE_COMMENCED',
            comments: 'Maintenance crew dismantled drafting cradle on Ring Frame RF-01.',
            performedBy: 'Murugan (Spinning Supervisor)',
          },
          {
            fromStatus: 'CORRECTION_IN_PROGRESS',
            toStatus: 'AWAITING_REINSPECTION',
            action: 'CORRECTION_COMPLETED',
            comments: 'Aprons replaced and initial Uster test passed. Reinspection requested from QA.',
            performedBy: 'Murugan (Spinning Supervisor)',
          },
        ],
      },
    },
  });

  // 3. Dyeing & Finishing QC Issue (Status: APPROVED_TO_CONTINUE - Resolved)
  const insp3 = await prisma.qualityInspection.upsert({
    where: { inspectionNumber: 'INSP-2026-0103' },
    update: {},
    create: {
      inspectionNumber: 'INSP-2026-0103',
      rollId: roll2?.id,
      orderNumber: orders[2]?.orderNumber || 'ORD-2026-003',
      batchOrRollNumber: roll2?.rollId || 'ROLL-2026-0002',
      fabricType: 'Navy Blue Poly-Cotton Twill',
      stage: 'DYEING_QC',
      machineId: dyeMachine?.id,
      machineName: dyeMachine ? `${dyeMachine.name} (${dyeMachine.code})` : 'Fongs Jigger Dyeing Machine #2',
      inspectorName: 'Dr. Meenakshi (Dye Chemist)',
      result: 'FAILED',
      defectCategory: 'COLOR_MISMATCH_UNEVEN_DYEING',
      defectDescription: 'Delta-E color difference was 2.8 against approved lab dip standard standard swatch.',
      defectiveQuantity: roll2 ? roll2.lengthMeters : 150,
      affectedQuantity: roll2 ? roll2.lengthMeters : 150,
      unit: 'METERS',
      severity: 'MAJOR',
      correctiveActionReq: 'Formulate color top-up bath with reactive blue 198 and run additional 30min wash-off cycle.',
      photos: {
        create: [
          {
            fileName: 'qc_dyeing_shade_mismatch.svg',
            fileUrl: '/uploads/quality/qc_dyeing_shade_mismatch.svg',
            fileSize: 2450,
            mimeType: 'image/svg+xml',
            caption: 'Spectrophotometer reading graph confirming Delta-E shade divergence.',
            uploaderName: 'Dr. Meenakshi',
          },
        ],
      },
    },
  });

  const issue3 = await prisma.qualityIssue.upsert({
    where: { issueNumber: 'QI-2026-0103' },
    update: {},
    create: {
      issueNumber: 'QI-2026-0103',
      inspectionId: insp3.id,
      orderNumber: orders[2]?.orderNumber || 'ORD-2026-003',
      batchOrRollNumber: roll2?.rollId || 'ROLL-2026-0002',
      stage: 'DYEING_QC',
      defectCategory: 'COLOR_MISMATCH_UNEVEN_DYEING',
      defectDescription: 'Delta-E color deviation (2.8).',
      severity: 'MAJOR',
      affectedQuantity: roll2 ? roll2.lengthMeters : 150,
      unit: 'METERS',
      rootCause: 'Dye liquor exhaustion temperature dropped 4°C during fixation cycle.',
      recommendedAction: 'Topping bath run and heat recalibration.',
      assignedTeam: 'DYEING_DEPT',
      assignedPerson: 'Karthik (Dyehouse Master)',
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'APPROVED_TO_CONTINUE',
      holdStatus: 'RELEASED',
      correctionNotes: 'Ran color topping formulation with 0.12% shade adjustment. Wash-off at 95°C completed. Delta-E brought down to 0.42 (Pass).',
      correctionCompletedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      correctionSubmittedBy: 'Karthik (Dyehouse Master)',
      reinspectionResult: 'PASSED',
      reinspectionNotes: 'Spectrophotometer verified Delta-E is 0.42 (Tolerance is <= 0.8). Shade matches approved swatch under D65 daylight illuminant. Roll cleared for finishing.',
      reinspectedBy: 'Dr. Meenakshi (Dye Chemist)',
      reinspectedAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
      approvedBy: 'Dr. Meenakshi (Dye Chemist)',
      approvedAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
      photos: {
        create: [
          {
            fileName: 'qc_dyeing_shade_mismatch.svg',
            fileUrl: '/uploads/quality/qc_dyeing_shade_mismatch.svg',
            fileSize: 2450,
            mimeType: 'image/svg+xml',
            caption: 'Dyeing shade deviation test report',
            uploaderName: 'Dr. Meenakshi',
          },
        ],
      },
      statusHistory: {
        create: [
          {
            fromStatus: 'ON_HOLD',
            toStatus: 'CORRECTION_IN_PROGRESS',
            action: 'TOPPING_BATH_STARTED',
            comments: 'Chemical addition for shade correction started in Jigger machine #2.',
            performedBy: 'Karthik',
          },
          {
            fromStatus: 'CORRECTION_IN_PROGRESS',
            toStatus: 'AWAITING_REINSPECTION',
            action: 'CORRECTION_COMPLETED',
            comments: 'Drying and stenter sample swatches cut for spectrophotometer test.',
            performedBy: 'Karthik',
          },
          {
            fromStatus: 'AWAITING_REINSPECTION',
            toStatus: 'APPROVED_TO_CONTINUE',
            action: 'REINSPECTION_PASSED_HOLD_RELEASED',
            comments: 'Delta-E 0.42 verified. Approved to proceed to finished stock.',
            performedBy: 'Dr. Meenakshi',
          },
        ],
      },
    },
  });

  // 4. Final Quality Inspection Check (Passed)
  await prisma.qualityInspection.upsert({
    where: { inspectionNumber: 'INSP-2026-0104' },
    update: {},
    create: {
      inspectionNumber: 'INSP-2026-0104',
      rollId: roll3?.id,
      orderNumber: orders[3]?.orderNumber || 'ORD-2026-004',
      batchOrRollNumber: roll3?.rollId || 'ROLL-2026-0003',
      fabricType: roll3?.fabricType || 'White Oxford Cotton',
      stage: 'FINAL_INSPECTION',
      inspectorName: 'Suresh Kumar (QA Lead)',
      result: 'PASSED',
      defectCategory: 'NONE',
      defectDescription: 'Fabric roll 100% inspected on illumination table. No major defects found.',
      defectiveQuantity: 0,
      affectedQuantity: roll3 ? roll3.lengthMeters : 140,
      unit: 'METERS',
      severity: 'MINOR',
      remarks: 'ASTM D5430 4-point score: 8.5 points per 100 sq meters (Export Grade A).',
      inspectorComments: 'Fabric roll cleared for finished stock warehouse.',
    },
  });

  console.log('Stage-wise quality control records seeded successfully!');
}

seedQualityData()
  .catch((e) => {
    console.error('Error seeding quality data:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
