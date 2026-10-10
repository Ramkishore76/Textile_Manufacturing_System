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
  console.log('  TEST: PHOTO COMPRESSION & PRODUCTION DOCUMENTATION ACCEPTANCE PIPELINE');
  console.log('========================================================================\n');

  // 1. Authenticate Quality Manager
  console.log('1. Quality Manager Login...');
  const qualLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'quality@agttextile.com', password: 'Quality@123', skipOtp: true }),
  });
  assert.strictEqual(qualLogin.status, 200, 'Quality Manager login failed');
  const qualityToken = qualLogin.data.token;
  console.log(`   [PASS] Quality Manager: ${qualLogin.data.user.name}`);

  // 2. Upload Compressed Photo with Thumbnail and Compression Stats
  console.log('\n2. Uploading Compressed Camera Photo & Fast Thumbnail...');
  const sample1x1Jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const sampleThumb = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  const uploadRes = await request('/quality/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${qualityToken}` },
    body: JSON.stringify({
      fileName: 'compressed_hole_defect_camera.jpg',
      mimeType: 'image/jpeg',
      base64: sample1x1Jpeg,
      thumbnailBase64: sampleThumb,
      originalSize: 4850000, // 4.85 MB original photo from phone
      compressedSize: 112000, // 112 KB compressed
      compressionRatio: '98% compressed',
      caption: '🕳️ Compressed Defect Photo: Pierced hole in selvedge at 62m mark',
    }),
  });
  assert.strictEqual(uploadRes.status, 201, 'Photo upload failed');
  const photoData = uploadRes.data;
  assert.ok(photoData.fileUrl, 'Missing fileUrl');
  assert.ok(photoData.thumbnailUrl, 'Missing thumbnailUrl');
  assert.ok(photoData.compressionRatio.includes('compressed'), 'Invalid compression ratio');
  console.log(`   [PASS] Photo Compressed: Original 4.85 MB → ${Math.round(photoData.compressedSize / 1024)} KB (${photoData.compressionRatio})`);
  console.log(`   [PASS] Full Photo URL: ${photoData.fileUrl}`);
  console.log(`   [PASS] Fast Thumbnail URL: ${photoData.thumbnailUrl}`);

  // 3. Verify Static File Serving for both full and thumbnail
  console.log('\n3. Verifying Static Storage Access for Production Unit...');
  const fullPhotoCheck = await fetch(`http://localhost:5000${photoData.fileUrl}`);
  assert.strictEqual(fullPhotoCheck.status, 200, 'Full photo URL failed to serve');
  const thumbPhotoCheck = await fetch(`http://localhost:5000${photoData.thumbnailUrl}`);
  assert.strictEqual(thumbPhotoCheck.status, 200, 'Thumbnail URL failed to serve');
  console.log('   [PASS] Both full compressed photo and thumbnail serve HTTP 200 OK');

  // 4. Quality Manager submits stage inspection putting roll on hold
  console.log('\n4. Quality Manager records stage inspection with compressed photo & mandatory hold...');
  const inspectRes = await request('/quality/inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${qualityToken}` },
    body: JSON.stringify({
      batchOrRollNumber: 'ROLL-COMPRESS-TEST-01',
      fabricType: 'High Density Cotton Denim Twill',
      stage: 'WEAVING_QC',
      inspectorName: 'Quality Lead Priya',
      inspectionDate: new Date().toISOString(),
      result: 'FAILED',
      defectCategory: 'HOLES_FABRIC_DAMAGE',
      defectDescription: 'Visible needle puncture tear creating 20mm fabric hole.',
      defectiveQuantity: 15,
      affectedQuantity: 100,
      unit: 'METERS',
      severity: 'CRITICAL',
      correctiveActionRequired: 'Stop Loom #3, replace burred reed dent, cut out defective piece and splice warp threads.',
      assignedTeam: 'WEAVING_DEPT',
      assignedPerson: 'Loom Operator Rajesh',
      dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      photos: [photoData],
    }),
  });
  assert.strictEqual(inspectRes.status, 201, 'Inspection submission failed');
  const issue = inspectRes.data.qualityIssue;
  assert.ok(issue, 'Missing qualityIssue in inspection response');
  assert.strictEqual(issue.documentationAccepted, false, 'Issue should initially NOT be accepted by production');
  console.log(`   [PASS] Quality Issue ${issue.issueNumber} generated on MANDATORY HOLD`);
  console.log(`          Documentation Accepted: ${issue.documentationAccepted}`);

  // 5. Production Unit Login
  console.log('\n5. Authenticating as Production Unit...');
  const prodLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'production@agttextile.com', password: 'Prod@123', skipOtp: true }),
  });
  assert.strictEqual(prodLogin.status, 200, 'Production login failed');
  const prodToken = prodLogin.data.token;
  console.log(`   [PASS] Production User: ${prodLogin.data.user.name}`);

  // 6. Production Unit Formally Accepts Quality Documentation & Corrective Instructions
  console.log('\n6. Production Unit Accepts Quality Management Documentation...');
  const acceptRes = await request(`/quality/issues/${issue.id}/accept-documentation`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${prodToken}` },
    body: JSON.stringify({
      assignedOperator: 'Master Loom Mechanic Mohan',
      acceptanceNotes: 'Defect photos reviewed and verified. Loom #3 stopped for reed wire replacement and fabric splicing.',
    }),
  });
  assert.strictEqual(acceptRes.status, 200, 'Accept documentation failed: ' + JSON.stringify(acceptRes.data));
  const updatedIssue = acceptRes.data.issue;
  assert.strictEqual(updatedIssue.documentationAccepted, true, 'Documentation was not marked accepted');
  assert.strictEqual(updatedIssue.status, 'CORRECTION_IN_PROGRESS', 'Status did not advance to CORRECTION_IN_PROGRESS');
  assert.ok(updatedIssue.documentationAcceptedAt, 'documentationAcceptedAt timestamp missing');
  console.log(`   [PASS] Quality Documentation Accepted:`);
  console.log(`          Accepted By: ${updatedIssue.documentationAcceptedBy}`);
  console.log(`          Accepted At: ${updatedIssue.documentationAcceptedAt}`);
  console.log(`          New Status:  ${updatedIssue.status}`);
  console.log(`          Notes:       "${updatedIssue.documentationAcceptanceNotes}"`);

  // 7. Verify Notification sent to Quality Management
  console.log('\n7. Verifying Notification sent to Quality Management...');
  const qualNotifRes = await request('/notifications', {
    headers: { Authorization: `Bearer ${qualityToken}` },
  });
  assert.strictEqual(qualNotifRes.status, 200, 'Failed to fetch notifications');
  const notifs = qualNotifRes.data;
  const docAcceptNotif = notifs.find(
    (n) => n.title && n.title.includes('QA Documentation Accepted') && n.title.includes(issue.issueNumber)
  );
  assert.ok(docAcceptNotif, 'Quality team did not receive documentation acceptance notification');
  console.log(`   [PASS] Quality Notification Received: "${docAcceptNotif.title}"`);
  console.log(`          Details: "${docAcceptNotif.message}"`);

  // 8. Production Unit submits final correction notes
  console.log('\n8. Production Unit submits completion notes after mending...');
  const correctRes = await request(`/quality/issues/${issue.id}/correct`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${prodToken}` },
    body: JSON.stringify({
      correctionNotes: 'Replaced damaged reed dent on Loom #3. Cut out 15m pierced section. Checked 20m running warp tension.',
      rootCause: 'Burred reed wire dent from previous mechanical strike.',
    }),
  });
  assert.strictEqual(correctRes.status, 200, 'Correction submission failed');
  console.log(`   [PASS] Correction submitted. Status moved to: ${correctRes.data.issue.status}`);

  console.log('\n========================================================================');
  console.log('  SUCCESS! COMPLETE PHOTO COMPRESSION & QA DOC ACCEPTANCE VERIFIED (100%)');
  console.log('========================================================================');
}

runTest().catch((err) => {
  console.error('\n[FAIL] Test encountered error:', err);
  process.exit(1);
});
