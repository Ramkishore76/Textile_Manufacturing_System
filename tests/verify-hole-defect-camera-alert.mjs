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
  console.log('  TEST: HOLE IN FABRIC DEFECT CAMERA CAPTURE & PRODUCTION UNIT ALERT');
  console.log('========================================================================\n');

  // 1. Authenticate as Quality Manager
  console.log('1. Authenticating as Quality Manager...');
  const qualLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'quality@agttextile.com', password: 'Quality@123', skipOtp: true }),
  });
  assert.strictEqual(qualLogin.status, 200, 'Quality Manager login failed');
  const qualityToken = qualLogin.data.token;
  console.log('   [PASS] Quality Manager logged in: ' + qualLogin.data.user?.name);

  // 2. Simulate camera snapshot upload (1x1 red pixel JPEG base64)
  console.log('\n2. Quality Manager captures and uploads defect photo of "Hole in Fabric"...');
  const sampleDefectBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const uploadRes = await request('/quality/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${qualityToken}` },
    body: JSON.stringify({
      fileName: 'camera_defect_hole_in_fabric.jpg',
      mimeType: 'image/jpeg',
      base64: sampleDefectBase64,
      caption: '🕳️ Live Camera: Hole in fabric roll at 45m selvedge on Loom #2',
    }),
  });
  assert.strictEqual(uploadRes.status, 201, 'Photo upload failed');
  console.log('   [PASS] Camera photo uploaded & stored at: ' + uploadRes.data.fileUrl);

  // 3. Submit Weaving QC Stage Inspection with Hole in Fabric Defect
  console.log('\n3. Quality Manager logs Weaving QC stage inspection with "Hole in Fabric" defect...');
  const inspectRes = await request('/quality/inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${qualityToken}` },
    body: JSON.stringify({
      batchOrRollNumber: 'ROLL-HOLE-TEST-99',
      fabricType: 'Cotton Denim Twill 380 GSM',
      stage: 'WEAVING_QC',
      inspectorName: 'Quality Lead Priya',
      inspectionDate: new Date().toISOString(),
      result: 'FAILED',
      defectCategory: 'HOLES_FABRIC_DAMAGE',
      defectDescription: 'Pierced yarn tear creating 15mm visible hole on fabric body near selvedge.',
      defectiveQuantity: 12,
      affectedQuantity: 80,
      unit: 'METERS',
      severity: 'CRITICAL',
      correctiveActionRequired: 'Halt Loom #2 immediately. Cut out damaged section and re-thread broken ends.',
      assignedTeam: 'WEAVING_DEPT',
      assignedPerson: 'Loom Operator Rajesh',
      dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      photos: [uploadRes.data],
    }),
  });
  assert.strictEqual(inspectRes.status, 201, 'Stage inspection failed');
  const inspectionNumber = inspectRes.data.inspectionNumber;
  const issueNumber = inspectRes.data.qualityIssue?.issueNumber;
  console.log(`   [PASS] Inspection ${inspectionNumber} logged with Issue ${issueNumber} (Material on MANDATORY HOLD)`);

  // 4. Authenticate as Production Unit
  console.log('\n4. Authenticating as Production Unit...');
  const prodLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'production@agttextile.com', password: 'Prod@123', skipOtp: true }),
  });
  assert.strictEqual(prodLogin.status, 200, 'Production login failed');
  const prodToken = prodLogin.data.token;
  console.log('   [PASS] Production Manager logged in: ' + prodLogin.data.user?.name);

  // 5. Check Production Unit notifications
  console.log('\n5. Fetching Production Unit notification alerts...');
  const notifRes = await request('/notifications', {
    headers: { Authorization: `Bearer ${prodToken}` },
  });
  assert.strictEqual(notifRes.status, 200, 'Failed to fetch notifications');
  const notifications = notifRes.data;
  const holeAlert = notifications.find(
    (n) => n.title && n.title.includes('Hole in Fabric') && n.title.includes('ROLL-HOLE-TEST-99')
  );

  assert.ok(holeAlert, 'Production Unit did not receive the Hole in Fabric defect notification!');
  console.log('   [PASS] Production Unit successfully received defect alert:');
  console.log(`          Title: "${holeAlert.title}"`);
  console.log(`          Message: "${holeAlert.message}"`);
  console.log(`          Route Link: "${holeAlert.link}"`);

  // 6. Production reviews the issue and quality manager's photo proof
  console.log('\n6. Production Unit verifies the quality issue and defect photo proof...');
  const issueDetailsRes = await request(`/quality/issues/${inspectRes.data.qualityIssue.id}`, {
    headers: { Authorization: `Bearer ${prodToken}` },
  });
  assert.strictEqual(issueDetailsRes.status, 200, 'Production could not read issue details');
  const issue = issueDetailsRes.data;
  assert.strictEqual(issue.holdStatus, 'ON_HOLD', 'Material should be ON_HOLD');
  assert.ok(issue.photos && issue.photos.length > 0, 'Defect photo not attached to issue');
  console.log(`   [PASS] Issue verified on hold with ${issue.photos.length} photo proof: ${issue.photos[0].caption}`);

  console.log('\n========================================================================');
  console.log('  SUCCESS! COMPLETE STAGE QUALITY, CAMERA & NOTIFICATION PIPELINE VERIFIED');
  console.log('========================================================================');
}

runTest().catch((err) => {
  console.error('\n[FAIL] Test encountered an error:', err);
  process.exit(1);
});
