import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: text };
  }
}

async function runTest() {
  console.log('========================================================================');
  console.log('  TEST: PRODUCTION MANAGER STRATEGY CHANGE & QA ACCESS CONTROL');
  console.log('========================================================================\n');

  // 1. Authenticate Quality Manager and Production Manager
  console.log('1. Authenticating Roles...');
  const qualLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'quality@agttextile.com', password: 'Quality@123', skipOtp: true }),
  });
  assert.strictEqual(qualLogin.status, 200, 'Quality Manager login failed');
  const qualityToken = qualLogin.data.token;
  console.log(`   [PASS] Quality Manager logged in: ${qualLogin.data.user.name} (${qualLogin.data.user.role})`);

  const prodLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'production@agttextile.com', password: 'Prod@123', skipOtp: true }),
  });
  assert.strictEqual(prodLogin.status, 200, 'Production Manager login failed');
  const prodToken = prodLogin.data.token;
  console.log(`   [PASS] Production Manager logged in: ${prodLogin.data.user.name} (${prodLogin.data.user.role})`);

  // 2. Strict Role Gating: Verify Production Manager CANNOT access Quality Manager exclusive endpoints
  console.log('\n2. Verifying Production Manager CANNOT perform Quality Manager operations...');
  
  // 2a. Attempting inspection creation as Production
  const prodInspectAttempt = await request('/quality/inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${prodToken}` },
    body: JSON.stringify({
      batchOrRollNumber: 'ROLL-UNAUTH-001',
      stage: 'WEAVING_QC',
      result: 'PASSED',
    }),
  });
  assert.strictEqual(prodInspectAttempt.status, 403, 'Production user should receive 403 Forbidden for POST /inspect');
  console.log(`   [PASS] POST /quality/inspect correctly blocked (403 Forbidden) for PRODUCTION role`);

  // 2b. Attempting photo upload as Production
  const prodUploadAttempt = await request('/quality/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${prodToken}` },
    body: JSON.stringify({
      fileName: 'unauthorized_photo.jpg',
      mimeType: 'image/jpeg',
      base64: 'sample',
    }),
  });
  assert.strictEqual(prodUploadAttempt.status, 403, 'Production user should receive 403 Forbidden for POST /upload');
  console.log(`   [PASS] POST /quality/upload correctly blocked (403 Forbidden) for PRODUCTION role`);

  // 2c. Attempting checkpoint update as Production
  const prodCheckpointAttempt = await request('/quality/checkpoints/some-checkpoint-id', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${prodToken}` },
    body: JSON.stringify({
      mandatoryHold: false,
    }),
  });
  assert.strictEqual(prodCheckpointAttempt.status, 403, 'Production user should receive 403 Forbidden for PUT /checkpoints/:id');
  console.log(`   [PASS] PUT /quality/checkpoints/:id correctly blocked (403 Forbidden) for PRODUCTION role`);

  // 3. Quality Manager captures defect photo and sends defect report to Production Manager
  console.log('\n3. Quality Manager uploads photo evidence and issues defect hold...');
  const sample1x1Jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const uploadRes = await request('/quality/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${qualityToken}` },
    body: JSON.stringify({
      fileName: 'warp_yarn_hole_defect.jpg',
      mimeType: 'image/jpeg',
      base64: sample1x1Jpeg,
      thumbnailBase64: sample1x1Jpeg,
      originalSize: 4200000,
      compressedSize: 98000,
      compressionRatio: '97% compressed',
      caption: '🕳️ Defect: Punctured hole and yarn slippage on Loom #02 at 45m',
    }),
  });
  assert.strictEqual(uploadRes.status, 201, 'Photo upload failed');
  const photoData = uploadRes.data;
  console.log(`   [PASS] QA Photo uploaded and compressed to ${Math.round(photoData.compressedSize / 1024)} KB`);

  // Quality Manager creates inspection logging defect
  const inspectRes = await request('/quality/inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${qualityToken}` },
    body: JSON.stringify({
      batchOrRollNumber: 'ROLL-STRATEGY-TEST-88',
      fabricType: 'Heavy Canvas 450 GSM',
      stage: 'WEAVING_QC',
      inspectorName: 'Quality Lead Priya',
      inspectionDate: new Date().toISOString(),
      result: 'FAILED',
      defectCategory: 'HOLES_FABRIC_DAMAGE',
      defectDescription: 'Repetitive punctured holes detected along fabric selvedge section B.',
      defectiveQuantity: 25,
      affectedQuantity: 150,
      unit: 'METERS',
      severity: 'CRITICAL',
      correctiveAction: 'MANDATORY HOLD: Immediate loom tension reduction and reed wire inspection required.',
      assignedTeam: 'WEAVING_DEPT',
      assignedPerson: 'Production Incharge Rajesh',
      dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      photos: [photoData],
    }),
  });
  assert.strictEqual(inspectRes.status, 201, 'QA defect submission failed');
  const defectIssue = inspectRes.data.qualityIssue;
  assert.ok(defectIssue, 'Missing qualityIssue in QA response');
  console.log(`   [PASS] QA Defect Issue ${defectIssue.issueNumber} dispatched to Production Manager with hold.`);

  // 4. Production Manager accesses issues desk and reviews QA defect directive
  console.log('\n4. Production Manager accesses QA defect directive and photos...');
  const issuesListRes = await request('/quality/issues', {
    headers: { Authorization: `Bearer ${prodToken}` },
  });
  assert.strictEqual(issuesListRes.status, 200, 'Production user failed to query issues');
  const foundIssue = issuesListRes.data.find((i) => i.id === defectIssue.id);
  assert.ok(foundIssue, 'Dispatched issue not found in Production issues list');
  assert.strictEqual(foundIssue.defectCategory, 'HOLES_FABRIC_DAMAGE');
  assert.ok(foundIssue.photos && foundIssue.photos.length > 0, 'QA photos not visible to Production');
  console.log(`   [PASS] Production Manager retrieved QA defect directive: ${foundIssue.defectDescription}`);
  console.log(`          Referenced QA Photo Evidence: ${foundIssue.photos[0].fileName}`);

  // 5. Production Manager enacts change of production strategy to eliminate root cause
  console.log('\n5. Production Manager changes production strategy (Speed & Tension Adjustment)...');
  const strategyRes = await request(`/quality/issues/${defectIssue.id}/strategy`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${prodToken}` },
    body: JSON.stringify({
      strategyType: 'PARAMETER_ADJUSTMENT',
      strategySummary: 'Reduced loom operating speed by 15% and recalibrated warp let-off tension to prevent yarn snapping & hole formation.',
      parameterChanges: 'Loom Speed: 650 -> 520 RPM; Warp Tension: 36 cN -> 28 cN; Air Jet Pressure: 4.8 -> 4.2 bar',
      preventiveMeasures: 'Inspect air-jet nozzles every 2 hours; verify yarn package moisture levels before mounting.',
      strategyDetails: 'Mechanical analysis isolated defect to excessive tension peaks during high-speed shed opening.',
      assignedOperator: 'Master Loom Technician Mohan',
    }),
  });
  assert.strictEqual(strategyRes.status, 200, 'Strategy update failed: ' + JSON.stringify(strategyRes.data));
  const updatedIssue = strategyRes.data.issue;
  assert.strictEqual(updatedIssue.strategyType, 'PARAMETER_ADJUSTMENT');
  assert.ok(updatedIssue.strategySummary.includes('Reduced loom operating speed'), 'Strategy summary mismatch');
  assert.ok(updatedIssue.parameterChanges.includes('Loom Speed: 650 -> 520 RPM'), 'Parameter changes mismatch');
  assert.strictEqual(updatedIssue.status, 'STRATEGY_IMPLEMENTED', 'Status should be STRATEGY_IMPLEMENTED');
  assert.strictEqual(updatedIssue.documentationAccepted, true, 'Documentation should be marked accepted');
  assert.ok(updatedIssue.strategyImplementedAt, 'Missing strategyImplementedAt timestamp');
  console.log(`   [PASS] Production Strategy Updated:`);
  console.log(`          Type:           ${updatedIssue.strategyType}`);
  console.log(`          Summary:        ${updatedIssue.strategySummary}`);
  console.log(`          Parameters:     ${updatedIssue.parameterChanges}`);
  console.log(`          Implemented By: ${updatedIssue.strategyImplementedBy}`);
  console.log(`          Status:         ${updatedIssue.status}`);

  // 6. Verify Production Manager CANNOT self-reinspect / self-release QA hold
  console.log('\n6. Verifying Production Manager CANNOT self-release QA hold...');
  const prodReinspectAttempt = await request(`/quality/issues/${defectIssue.id}/reinspect`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${prodToken}` },
    body: JSON.stringify({
      result: 'PASSED',
      notes: 'Production manager self-release attempt',
    }),
  });
  assert.strictEqual(prodReinspectAttempt.status, 403, 'Production user should receive 403 Forbidden on reinspect');
  console.log(`   [PASS] POST /quality/issues/:id/reinspect correctly blocked (403 Forbidden) for PRODUCTION role`);

  // 7. Verify Notification sent to Quality Management about the Strategy Change
  console.log('\n7. Verifying notification delivered to Quality Management...');
  const notifRes = await request('/notifications', {
    headers: { Authorization: `Bearer ${qualityToken}` },
  });
  assert.strictEqual(notifRes.status, 200, 'Failed to fetch notifications');
  const strategyNotif = notifRes.data.find((n) => n.title && n.title.includes('Production Strategy Updated'));
  assert.ok(strategyNotif, 'Quality management did not receive strategy update notification');
  console.log(`   [PASS] QA Notification found: "${strategyNotif.title}"`);
  console.log(`          Message: "${strategyNotif.message}"`);

  // 8. Quality Manager performs reinspection with the new strategy in place
  console.log('\n8. Quality Manager verifies new strategy and performs reinspection...');
  const reinspectRes = await request(`/quality/issues/${defectIssue.id}/reinspect`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${qualityToken}` },
    body: JSON.stringify({
      result: 'PASSED',
      notes: 'New production strategy verified on shop floor. 150 meters woven at 520 RPM with zero holes or yarn damage. Hold released.',
    }),
  });
  assert.strictEqual(reinspectRes.status, 200, 'Reinspection by Quality Manager failed');
  const finalIssue = reinspectRes.data.issue;
  assert.strictEqual(finalIssue.status, 'APPROVED_TO_CONTINUE');
  assert.strictEqual(finalIssue.holdStatus, 'RELEASED');
  console.log(`   [PASS] Reinspection Verdict: ${finalIssue.reinspectionResult} by ${finalIssue.reinspectedBy}`);
  console.log(`          Final Hold Status:    ${finalIssue.holdStatus}`);
  console.log(`          Final Issue Status:   ${finalIssue.status}`);

  console.log('\n========================================================================');
  console.log('  ALL PRODUCTION STRATEGY & QA ACCESS CONTROL TESTS PASSED SUCCESSFULLY!');
  console.log('========================================================================\n');
}

runTest().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
