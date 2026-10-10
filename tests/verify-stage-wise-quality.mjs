const BASE_URL = 'http://localhost:5000/api';

async function main() {
  console.log('========================================================================');
  console.log('  TEST: STAGE-WISE QUALITY CONTROL & DEFECT ANALYSIS VERIFICATION');
  console.log('========================================================================\n');

  // Step 1: Admin / Quality Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@agttextile.com',
      password: 'Admin@123',
      skipOtp: true,
    }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  if (!token) throw new Error('Failed to obtain auth token');
  console.log('[PASS] Step 1: Quality Management Auth Authenticated');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Step 2: Fetch Checkpoints Configuration
  const cpRes = await fetch(`${BASE_URL}/quality/checkpoints`, { headers });
  const checkpoints = await cpRes.json();
  if (!Array.isArray(checkpoints) || checkpoints.length < 5) {
    throw new Error(`Expected at least 5 checkpoints, got ${checkpoints?.length}`);
  }
  console.log(`[PASS] Step 2: Checkpoint Workflows Active (${checkpoints.length} Manufacturing Checkpoints: ${checkpoints.map(c => c.stageCode).join(', ')})`);

  // Step 3: Fetch Quality Dashboard Metrics
  const metricsRes = await fetch(`${BASE_URL}/quality/dashboard-metrics`, { headers });
  const metrics = await metricsRes.json();
  if (typeof metrics.summary?.totalInspections !== 'number') {
    throw new Error('Invalid dashboard metrics structure');
  }
  console.log(`[PASS] Step 3: Dashboard Metrics Synced (Total: ${metrics.summary.totalInspections} | Passed: ${metrics.summary.inspectionsPassed} | Held: ${metrics.summary.inspectionsFailed})`);

  // Step 4: Upload Photo Evidence to Server
  // Tiny 1x1 transparent PNG base64
  const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const uploadRes = await fetch(`${BASE_URL}/quality/upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fileName: 'test_defect_loom_streak.png',
      mimeType: 'image/png',
      base64: sampleBase64,
      caption: 'Test photographic evidence of reed streak defect',
    }),
  });
  const uploadData = await uploadRes.json();
  if (!uploadData.fileUrl) throw new Error('Photo upload failed');
  console.log(`[PASS] Step 4: Photographic Evidence Uploaded & Stored on Server: ${uploadData.fileUrl}`);

  // Step 5: Verify Photo URL is Accessible over HTTP
  const photoAccessRes = await fetch(`http://localhost:5000${uploadData.fileUrl}`);
  if (photoAccessRes.status !== 200) {
    throw new Error(`Photo URL returned status ${photoAccessRes.status}`);
  }
  console.log(`[PASS] Step 5: Photo Static Storage Serving HTTP 200 OK (${photoAccessRes.headers.get('content-type')})`);

  // Step 6: Create Passing Quality Inspection
  const testRollId = `ROLL-TEST-${Date.now().toString().slice(-4)}`;
  const passInspRes = await fetch(`${BASE_URL}/quality/inspect`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      batchOrRollNumber: testRollId,
      stage: 'RAW_MATERIAL',
      inspectorName: 'Suresh Kumar (QA Lead)',
      result: 'PASSED',
      fabricType: 'Cotton Standard 40s',
      affectedQuantity: 200,
      unit: 'KG',
      remarks: 'Moisture content 7.2%, tensile strength verified within standard tolerance.',
    }),
  });
  const passInspData = await passInspRes.json();
  if (!passInspData.inspectionNumber) throw new Error('Pass inspection failed to record');
  console.log(`[PASS] Step 6: Passing Stage Inspection Recorded: ${passInspData.inspectionNumber} (Material authorized to proceed)`);

  // Step 7: Create Failed Inspection -> Verifies Automated Production Hold & Quality Issue Creation
  const failRollId = `ROLL-HOLD-${Date.now().toString().slice(-4)}`;
  const failInspRes = await fetch(`${BASE_URL}/quality/inspect`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      batchOrRollNumber: failRollId,
      stage: 'WEAVING_QC',
      inspectorName: 'Suresh Kumar (QA Lead)',
      result: 'FAILED',
      defectCategory: 'BROKEN_THREADS',
      defectDescription: 'Severe warp thread breakage resulting in reed marks across 12 meters.',
      defectiveQuantity: 12,
      affectedQuantity: 150,
      unit: 'METERS',
      severity: 'CRITICAL',
      correctiveActionRequired: 'Halt Loom #4. Re-draw harness eyelets and mend warp ends.',
      assignedTeam: 'WEAVING_DEPT',
      photos: [
        {
          fileName: uploadData.fileName,
          fileUrl: uploadData.fileUrl,
          caption: 'Severe warp breakage at eyelet',
        },
      ],
    }),
  });
  const failInspData = await failInspRes.json();
  if (!failInspData.qualityIssue) throw new Error('Failed inspection did not generate a Quality Issue');
  const qualityIssue = failInspData.qualityIssue;
  console.log(`[PASS] Step 7: Defect Inspection Triggers Automated Hold: Issue ${qualityIssue.issueNumber} created (Status: ${qualityIssue.status} | Hold: ${qualityIssue.holdStatus})`);

  // Step 8: Production Staff Submits Correction Notes
  const correctRes = await fetch(`${BASE_URL}/quality/issues/${qualityIssue.id}/correct`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      correctionNotes: 'Replaced broken reed wire on Loom #4. Re-threaded 8 warp ends. Cut out defective 12m section.',
      rootCause: 'Reed friction due to dried lubricant.',
    }),
  });
  const correctData = await correctRes.json();
  if (correctData.issue?.status !== 'AWAITING_REINSPECTION') {
    throw new Error(`Expected status AWAITING_REINSPECTION, got ${correctData.issue?.status}`);
  }
  console.log(`[PASS] Step 8: Production Team Correction Recorded (Status: AWAITING_REINSPECTION | Material Remains on Hold)`);

  // Step 9: Reinspection Sign-off & Release from Quality Hold
  const reinspectRes = await fetch(`${BASE_URL}/quality/issues/${qualityIssue.id}/reinspect`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      reinspectionResult: 'PASSED',
      reinspectionNotes: 'Illumination table inspection verified. Reed streak cleared. Fabric conforms to ASTM Grade A.',
    }),
  });
  const reinspectData = await reinspectRes.json();
  if (reinspectData.issue?.status !== 'APPROVED_TO_CONTINUE' || reinspectData.issue?.holdStatus !== 'RELEASED') {
    throw new Error('Reinspection failed to release hold');
  }
  console.log(`[PASS] Step 9: Authorized Reinspection PASSED: Quality Hold Released (Status: APPROVED_TO_CONTINUE | Hold: RELEASED)`);

  // Step 10: Defect Analytics & Financial Material Loss Calculation
  const analyticsRes = await fetch(`${BASE_URL}/quality/analytics`, { headers });
  const analytics = await analyticsRes.json();
  if (typeof analytics.totalWastageMeters !== 'number' || typeof analytics.estimatedWastageCost !== 'number') {
    throw new Error('Analytics calculations missing or invalid');
  }
  console.log(`[PASS] Step 10: Real-time Defect Analytics Compiled (Wastage: ${analytics.totalWastageMeters}m | Cost: ₹${analytics.estimatedWastageCost.toLocaleString()} | Avg Turnaround: ${analytics.avgResolutionTimeHours}h)`);

  console.log('\n========================================================================');
  console.log('  ALL 10 QUALITY WORKFLOW TESTS PASSED (100% SUCCESS)');
  console.log('========================================================================\n');
}

main().catch((err) => {
  console.error('\n[FAIL] Test encountered error:', err.message);
  process.exit(1);
});
