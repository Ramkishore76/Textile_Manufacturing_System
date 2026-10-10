import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  History,
  X,
  FileText,
  Camera,
  Upload,
  Download,
  Printer,
  Filter,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldAlert,
  Cpu,
  Layers,
  UserCheck,
  AlertCircle,
  Check,
  ChevronRight,
  Settings2,
  BarChart3,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Info,
  Sparkles,
  Video,
  FlipHorizontal,
  AlertOctagon,
  FileCheck,
  Zap,
  CheckSquare,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

export const QualityPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  // Navigation tab state: dashboard, inspect, issues, checkpoints, analytics
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inspect' | 'issues' | 'checkpoints' | 'analytics'>(
    user?.role === 'PRODUCTION' ? 'issues' : 'dashboard'
  );

  // Core data states
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [inspectionsList, setInspectionsList] = useState<any[]>([]);
  const [issuesList, setIssuesList] = useState<any[]>([]);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Aux dropdown data
  const [orders, setOrders] = useState<any[]>([]);
  const [rolls, setRolls] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);

  // Filter states
  const [stageFilter, setStageFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // Production Documentation Acceptance Modal
  const [showAcceptDocModal, setShowAcceptDocModal] = useState(false);
  const [acceptDocTargetIssue, setAcceptDocTargetIssue] = useState<any>(null);
  const [acceptanceNotes, setAcceptanceNotes] = useState('');
  const [assignedOperator, setAssignedOperator] = useState('');
  const [acceptDocConfirmed, setAcceptDocConfirmed] = useState(false);
  const [acceptingDoc, setAcceptingDoc] = useState(false);

  // Production Strategy Management State
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [strategyTargetIssue, setStrategyTargetIssue] = useState<any>(null);
  const [strategyType, setStrategyType] = useState('PARAMETER_ADJUSTMENT');
  const [strategySummary, setStrategySummary] = useState('');
  const [strategyDetails, setStrategyDetails] = useState('');
  const [parameterChanges, setParameterChanges] = useState('');
  const [preventiveMeasures, setPreventiveMeasures] = useState('');
  const [submittingStrategy, setSubmittingStrategy] = useState(false);

  const [correctionTargetIssue, setCorrectionTargetIssue] = useState<any>(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [correctionPhotos, setCorrectionPhotos] = useState<any[]>([]);

  const [reinspectTargetIssue, setReinspectTargetIssue] = useState<any>(null);
  const [showReinspectModal, setShowReinspectModal] = useState(false);
  const [reinspectResult, setReinspectResult] = useState<'PASSED' | 'FAILED' | 'REJECTED_OR_SCRAPPED'>('PASSED');
  const [reinspectNotes, setReinspectNotes] = useState('');

  const [traceRoll, setTraceRoll] = useState<any>(null);
  const [showTraceModal, setShowTraceModal] = useState(false);

  const [previewPhoto, setPreviewPhoto] = useState<any>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Inspection Form State
  const [formOrderNumber, setFormOrderNumber] = useState('');
  const [formOrderId, setFormOrderId] = useState('');
  const [formBatchOrRoll, setFormBatchOrRoll] = useState('');
  const [formFabricType, setFormFabricType] = useState('Cotton Denim Twill');
  const [formStage, setFormStage] = useState<'RAW_MATERIAL' | 'SPINNING_QC' | 'WEAVING_QC' | 'DYEING_QC' | 'FINAL_INSPECTION'>('FINAL_INSPECTION');
  const [formMachineId, setFormMachineId] = useState('');
  const [formMachineName, setFormMachineName] = useState('');
  const [formInspectorName, setFormInspectorName] = useState(user?.name || 'Quality Lead');
  const [formInspectionDate, setFormInspectionDate] = useState(new Date().toISOString().slice(0, 16));
  const [formResult, setFormResult] = useState<'PASSED' | 'FAILED' | 'REWORK_REQUIRED' | 'REJECTED'>('PASSED');
  const [formDefectCategory, setFormDefectCategory] = useState('NONE');
  const [formDefectDescription, setFormDefectDescription] = useState('');
  const [formDefectiveQuantity, setFormDefectiveQuantity] = useState(0);
  const [formAffectedQuantity, setFormAffectedQuantity] = useState(100);
  const [formUnit, setFormUnit] = useState<'METERS' | 'KG'>('METERS');
  const [formSeverity, setFormSeverity] = useState<'MINOR' | 'MAJOR' | 'CRITICAL'>('MAJOR');
  const [formCorrectiveAction, setFormCorrectiveAction] = useState('');
  const [formAssignedTeam, setFormAssignedTeam] = useState('QUALITY_LAB');
  const [formAssignedPerson, setFormAssignedPerson] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formInspectorComments, setFormInspectorComments] = useState('');
  const [attachedPhotos, setAttachedPhotos] = useState<any[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const correctionFileInputRef = useRef<HTMLInputElement>(null);

  // Live Camera capture states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraCaption, setCameraCaption] = useState('Hole in fabric roll - Weaving table');
  const [isShutterActive, setIsShutterActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Role permissions
  const isQualityStaff = user?.role === 'QUALITY' || user?.role === 'ADMIN';
  const isProductionStaff = user?.role === 'PRODUCTION' || user?.role === 'ADMIN';
  const isSupervisorOrAdmin = user?.role === 'ADMIN' || user?.role === 'QUALITY';
  const isProductionOnly = user?.role === 'PRODUCTION';

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [metricsRes, issuesRes, inspectionsRes, checkpointsRes, analyticsRes] = await Promise.all([
        api.get<any>('/quality/dashboard-metrics').catch(() => null),
        api.get<any[]>('/quality/issues').catch(() => []),
        api.get<any[]>('/quality/inspections').catch(() => []),
        api.get<any[]>('/quality/checkpoints').catch(() => []),
        api.get<any>('/quality/analytics').catch(() => null),
      ]);

      setDashboardData(metricsRes);
      setIssuesList(issuesRes);
      setInspectionsList(inspectionsRes);
      setCheckpoints(checkpointsRes);
      setAnalyticsData(analyticsRes);

      // Aux data (orders, rolls, machines)
      Promise.all([
        api.get<any[]>('/orders').catch(() => []),
        api.get<any[]>('/rolls').catch(() => []),
        api.get<any[]>('/machines').catch(() => []),
      ]).then(([ordRes, rollRes, machRes]) => {
        setOrders(ordRes || []);
        setRolls(rollRes || []);
        setMachines(machRes || []);
      });
    } catch (err: any) {
      console.error('Failed to load quality data:', err);
      toast.error('Failed to load quality data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (user?.role === 'PRODUCTION' && (activeTab === 'inspect' || activeTab === 'checkpoints')) {
      setActiveTab('issues');
    }
  }, [user?.role]);

  // Intelligent Client-Side Image Compressor & Thumbnail Generator
  // Compresses high-resolution device & camera photos down to crisp 1280px Web JPEG (~90-130KB)
  // and creates a lightweight 240px thumbnail (~8KB) for instant loading on shop floor mobile/tablet devices.
  const compressImage = async (
    imageSource: string | File,
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.76
  ): Promise<{
    base64: string;
    thumbnailBase64: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: string;
  }> => {
    return new Promise((resolve, reject) => {
      let originalSize = 0;
      const processImage = (src: string, origBytes: number) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to create canvas context'));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);

          // 240px thumbnail
          const thumbCanvas = document.createElement('canvas');
          const thumbScale = Math.min(240 / width, 240 / height, 1);
          thumbCanvas.width = Math.max(1, Math.round(width * thumbScale));
          thumbCanvas.height = Math.max(1, Math.round(height * thumbScale));
          const thumbCtx = thumbCanvas.getContext('2d');
          let thumbBase64 = compressedBase64;
          if (thumbCtx) {
            thumbCtx.imageSmoothingEnabled = true;
            thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
            thumbBase64 = thumbCanvas.toDataURL('image/jpeg', 0.65);
          }

          const cleanBase64 = compressedBase64.split(',')[1] || compressedBase64;
          const compressedBytes = Math.round((cleanBase64.length * 3) / 4);
          const actualOrigBytes = origBytes || compressedBytes * 2;
          const ratio =
            actualOrigBytes > compressedBytes
              ? `${Math.round(((actualOrigBytes - compressedBytes) / actualOrigBytes) * 100)}% compressed`
              : 'Optimized';

          resolve({
            base64: compressedBase64,
            thumbnailBase64: thumbBase64,
            originalSize: actualOrigBytes,
            compressedSize: compressedBytes,
            compressionRatio: ratio,
          });
        };
        img.onerror = (err) => reject(err);
        img.src = src;
      };

      if (imageSource instanceof File) {
        originalSize = imageSource.size;
        const reader = new FileReader();
        reader.onload = (e) => processImage(e.target?.result as string, originalSize);
        reader.onerror = reject;
        reader.readAsDataURL(imageSource);
      } else {
        const clean = imageSource.split(',')[1] || imageSource;
        originalSize = Math.round((clean.length * 3) / 4);
        processImage(imageSource, originalSize);
      }
    });
  };

  // Production Unit Documentation Acceptance Handlers
  const handleOpenAcceptDocModal = (issue: any) => {
    setAcceptDocTargetIssue(issue);
    setAssignedOperator(issue.assignedPerson || user?.name || 'Shift Operator');
    setAcceptanceNotes(
      'Quality defect documentation, severity, and photographic proof reviewed. Production Unit has accepted instructions and initiated shop-floor correction.'
    );
    setAcceptDocConfirmed(false);
    setShowAcceptDocModal(true);
  };

  const handleAcceptDocumentation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptDocTargetIssue) return;
    if (!acceptDocConfirmed) {
      toast.error('Please check the confirmation box to officially accept the documentation.');
      return;
    }

    setAcceptingDoc(true);
    try {
      await api.put(`/quality/issues/${acceptDocTargetIssue.id}/accept-documentation`, {
        acceptanceNotes,
        assignedOperator,
      });

      toast.success(
        `Quality Documentation formally accepted for ${acceptDocTargetIssue.issueNumber}! Work status moved to IN PROGRESS.`
      );
      setShowAcceptDocModal(false);
      await loadAllData();
    } catch (err: any) {
      toast.error('Failed to accept documentation: ' + err.message);
    } finally {
      setAcceptingDoc(false);
    }
  };

  // Production Strategy Management Handlers & Textile Shop-Floor Presets
  const STRATEGY_PRESETS = [
    {
      id: 'SPEED_TENSION',
      type: 'PARAMETER_ADJUSTMENT',
      label: '⚙️ Speed & Tension Reduction',
      summary: 'Reduced loom operating speed by 15% and recalibrated warp let-off tension to stop yarn friction breakage.',
      parameters: 'Loom Speed: 650 -> 520 RPM; Warp Tension: 36 cN -> 28 cN; Air Jet Pressure: 4.8 -> 4.2 bar',
      preventive: 'Inspect warp yarn tension sensor every 2 hours; verify air nozzle pressure stability across shifts.',
      details: 'Decreased machine RPM to lessen tensile stress on weak warp yarn. Fine-tuned electronic let-off and take-up mechanisms.',
    },
    {
      id: 'FLEET_REROUTE',
      type: 'MACHINE_REROUTE',
      label: '🛑 Fleet Diversion / Reroute',
      summary: 'Quarantined affected machine unit for technician overhaul; rerouted active order production to calibrated alternate line.',
      parameters: 'Halted: Loom #02; Diverted active production to: Loom #14 (Line B)',
      preventive: 'Complete comprehensive mechanical alignment, reed alignment, and gripper rapier timing before recommissioning.',
      details: 'Isolated root cause to mechanical wear on loom unit. Shifted manufacturing queue to prevent schedule slip and reject production.',
    },
    {
      id: 'YARN_SWAP',
      type: 'MATERIAL_SWAP',
      label: '🧵 Yarn Lot / Creel Swap',
      summary: 'Isolated defective yarn package lot; replaced creel with pre-tested virgin combed yarn cones from certified batch.',
      parameters: 'Removed: Yarn Lot #CT-8042; Mounted: Certified Lot #CT-8055 (Tenacity: 18.5 cN/tex)',
      preventive: 'Quarantine remaining cones of rejected lot; issue formal vendor non-conformance report to spinning supplier.',
      details: 'Identified uneven yarn count and low tensile strength in supplier lot. Replaced creel packages across all feeder stations.',
    },
    {
      id: 'REED_TOOLING',
      type: 'TOOLING_REPLACEMENT',
      label: '🔧 Reed Dent & Tooling Replace',
      summary: 'Replaced damaged reed dents and worn heald drop wires causing abrasion marks and pin holes in the woven fabric.',
      parameters: 'Installed new 40-dent stainless profile reed; Replaced 16 heald drop wires on harness frames 2 & 3',
      preventive: 'Implement tactile reed wire smoothness audit every 5,000 meters woven.',
      details: 'Bent reed dent was abrading warp threads during beat-up motion. Replaced section and validated clearance with gauge.',
    },
    {
      id: 'DYE_RECIPE',
      type: 'PROCESS_RECIPE_CHANGE',
      label: '🧪 Dyehouse Recipe & Temp Fix',
      summary: 'Adjusted dye bath liquor ratio, slowed heating ramp rate, and added leveling surfactant to eliminate shade variation.',
      parameters: 'Liquor ratio: 1:8 -> 1:10; Heating ramp: 1.5°C/min -> 1.0°C/min; Auxiliary leveling agent: +2.5 g/L',
      preventive: 'Mandatory bath pH and salinity check at 15-minute intervals during exhaust dyeing phase.',
      details: 'Modified thermal curve and chemical dosing to ensure uniform migration and fixation across high-density fiber bundles.',
    },
    {
      id: 'OPERATOR_SOP',
      type: 'OPERATOR_RETRAINING',
      label: '🧑‍🏭 Operator SOP Realignment',
      summary: 'Briefed shift operators on correct knotting, doffing, and fabric roll handling standards to prevent manual handling damage.',
      parameters: 'Enforced SOP Step 4 & 5; Mandatory double-check on cloth roll take-up tension',
      preventive: 'Shift supervisor pre-shift inspection checklist signed off every 4 hours.',
      details: 'Reviewed handling practices with current shift team to eradicate manual puncture/snag defects during cloth roll removal.',
    },
  ];

  const handleOpenStrategyModal = (issue: any) => {
    setStrategyTargetIssue(issue);
    setStrategyType(issue.strategyType || 'PARAMETER_ADJUSTMENT');
    setStrategySummary(issue.strategySummary || '');
    setStrategyDetails(issue.strategyDetails || '');
    setParameterChanges(issue.parameterChanges || '');
    setPreventiveMeasures(issue.preventiveMeasures || '');
    setAssignedOperator(issue.assignedPerson || user?.name || 'Production Incharge');
    setShowStrategyModal(true);
  };

  const handleApplyStrategyPreset = (preset: typeof STRATEGY_PRESETS[0]) => {
    setStrategyType(preset.type);
    setStrategySummary(preset.summary);
    setParameterChanges(preset.parameters);
    setPreventiveMeasures(preset.preventive);
    setStrategyDetails(preset.details);
  };

  const handleSubmitStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strategyTargetIssue) return;
    if (!strategySummary.trim()) {
      toast.error('Please enter a strategy summary or select a preset strategy.');
      return;
    }

    setSubmittingStrategy(true);
    try {
      const res = await api.put<{ message: string; issue: any }>(
        `/quality/issues/${strategyTargetIssue.id}/strategy`,
        {
          strategyType,
          strategySummary,
          strategyDetails,
          parameterChanges,
          preventiveMeasures,
          assignedOperator,
        }
      );

      toast.success(
        `Production Strategy updated for ${strategyTargetIssue.issueNumber}! Quality Manager notified for verification.`
      );
      setShowStrategyModal(false);
      await loadAllData();
      if (selectedIssue && selectedIssue.id === strategyTargetIssue.id) {
        setSelectedIssue(res.issue);
      }
    } catch (err: any) {
      toast.error('Failed to update production strategy: ' + err.message);
    } finally {
      setSubmittingStrategy(false);
    }
  };

  // Camera Management Handlers
  const openCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setShowCameraModal(true);
    setCapturedSnapshot(null);
    setCameraError(null);
    setCameraFacing(facing);

    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Camera access unavailable or permission denied. Please allow camera access in browser or choose photo from files.');
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
    setCapturedSnapshot(null);
    setCameraError(null);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    openCamera(nextFacing);
  };

  const snapPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 200);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedSnapshot(dataUrl);

    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
  };

  const retakePhoto = () => {
    setCapturedSnapshot(null);
    openCamera(cameraFacing);
  };

  const saveCapturedPhoto = async () => {
    if (!capturedSnapshot) return;
    setUploadingPhoto(true);
    try {
      const fileName = `camera_defect_${formDefectCategory.toLowerCase()}_${Date.now()}.jpg`;
      const compressed = await compressImage(capturedSnapshot, 1280, 1280, 0.76);
      const res = await api.post<any>('/quality/upload', {
        fileName,
        mimeType: 'image/jpeg',
        base64: compressed.base64,
        thumbnailBase64: compressed.thumbnailBase64,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        compressionRatio: compressed.compressionRatio,
        caption: cameraCaption || `Live camera capture of ${formDefectCategory}`,
      });

      setAttachedPhotos((prev) => [...prev, res]);
      toast.success(
        `Defect photograph compressed & attached! (${Math.round(compressed.compressedSize / 1024)} KB, ${compressed.compressionRatio}) Ready for Production Unit.`
      );
      closeCamera();
    } catch (err: any) {
      toast.error('Failed to save captured photo: ' + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Quick Defect Presets
  const applyDefectPreset = (preset: 'HOLE' | 'WARP' | 'SHADE' | 'STAIN' | 'YARN') => {
    setFormResult('FAILED');
    if (preset === 'HOLE') {
      setFormDefectCategory('HOLES_FABRIC_DAMAGE');
      setFormSeverity('CRITICAL');
      setFormDefectDescription('Fabric hole / pierce tear detected during stage inspection table scan.');
      setFormCorrectiveAction('Halt loom fleet immediately. Mark cut-out section and notify Weaving production unit for urgent repair.');
      setCameraCaption('Hole in fabric roll - Weaving stage');
      toast.info('Defect set to "Hole in Fabric". Click "Open Camera" to take a photo of the hole!');
    } else if (preset === 'WARP') {
      setFormDefectCategory('BROKEN_THREADS');
      setFormSeverity('MAJOR');
      setFormDefectDescription('Broken warp/weft threads causing visible horizontal/vertical line streaks.');
      setFormCorrectiveAction('Re-thread broken warp ends through harness eyelet and reed.');
      setCameraCaption('Broken thread defect on fabric');
      toast.info('Defect set to "Broken Threads".');
    } else if (preset === 'SHADE') {
      setFormDefectCategory('COLOR_MISMATCH_UNEVEN_DYEING');
      setFormSeverity('MAJOR');
      setFormDefectDescription('Color shade mismatch / uneven dyeing variation (Delta-E tolerance exceeded).');
      setFormCorrectiveAction('Dyehouse topping bath and re-wash required.');
      setCameraCaption('Uneven dyeing shade variation');
      toast.info('Defect set to "Uneven Dyeing".');
    } else if (preset === 'STAIN') {
      setFormDefectCategory('CONTAMINATION');
      setFormSeverity('MAJOR');
      setFormDefectDescription('Oil / lubricant grease stain spotted across fabric surface.');
      setFormCorrectiveAction('Spot chemical cleaning and loom oil seal inspection.');
      setCameraCaption('Loom oil stain contamination');
      toast.info('Defect set to "Oil Stains".');
    } else if (preset === 'YARN') {
      setFormDefectCategory('UNEVEN_YARN_THICKNESS');
      setFormSeverity('MAJOR');
      setFormDefectDescription('Yarn slub and uneven drafting thickness count variation.');
      setFormCorrectiveAction('Recalibrate drafting aprons on ring frame.');
      setCameraCaption('Uneven yarn thickness slub');
      toast.info('Defect set to "Uneven Yarn".');
    }
  };

  // Update default assigned team when stage changes in form
  useEffect(() => {
    const stageTeamMap: Record<string, string> = {
      RAW_MATERIAL: 'STORE',
      SPINNING_QC: 'SPINNING_DEPT',
      WEAVING_QC: 'WEAVING_DEPT',
      DYEING_QC: 'DYEING_DEPT',
      FINAL_INSPECTION: 'QUALITY_LAB',
    };
    setFormAssignedTeam(stageTeamMap[formStage] || 'QUALITY_LAB');
  }, [formStage]);

  // Handle image upload from file input (with automatic compression)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCorrection = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`File ${file.name} exceeds 20MB limit.`);
          continue;
        }

        const compressed = await compressImage(file, 1280, 1280, 0.76);
        const res = await api.post<any>('/quality/upload', {
          fileName: file.name,
          mimeType: 'image/jpeg',
          base64: compressed.base64,
          thumbnailBase64: compressed.thumbnailBase64,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
          compressionRatio: compressed.compressionRatio,
          caption: `${file.name.replace(/\.[^/.]+$/, '')} - Uploaded by ${user?.name || 'Inspector'}`,
        });

        if (isCorrection) {
          setCorrectionPhotos((prev) => [...prev, res]);
        } else {
          setAttachedPhotos((prev) => [...prev, res]);
        }
        toast.success(
          `Photo compressed & uploaded: ${file.name} (${Math.round(compressed.originalSize / 1024)} KB → ${Math.round(compressed.compressedSize / 1024)} KB, ${compressed.compressionRatio})`
        );
      }
    } catch (err: any) {
      toast.error('Failed to upload image: ' + err.message);
    } finally {
      setUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  // Submit new quality inspection
  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formBatchOrRoll) {
      toast.error('Please enter or select a Batch or Roll ID.');
      return;
    }

    if (formResult !== 'PASSED' && (!formDefectCategory || formDefectCategory === 'NONE')) {
      toast.error('Defect Category is required when inspection is Failed or Rework.');
      return;
    }

    try {
      const payload = {
        orderId: formOrderId || undefined,
        orderNumber: formOrderNumber || undefined,
        batchOrRollNumber: formBatchOrRoll,
        fabricType: formFabricType,
        stage: formStage,
        machineId: formMachineId || undefined,
        machineName: formMachineName || undefined,
        inspectorName: formInspectorName,
        inspectionDate: formInspectionDate,
        result: formResult,
        defectCategory: formResult === 'PASSED' ? 'NONE' : formDefectCategory,
        defectDescription: formDefectDescription || undefined,
        defectiveQuantity: Number(formDefectiveQuantity),
        affectedQuantity: Number(formAffectedQuantity),
        unit: formUnit,
        severity: formResult === 'PASSED' ? undefined : formSeverity,
        correctiveActionRequired: formCorrectiveAction || undefined,
        assignedTeam: formAssignedTeam,
        assignedPerson: formAssignedPerson || undefined,
        dueDate: formDueDate || undefined,
        remarks: formRemarks || undefined,
        inspectorComments: formInspectorComments || undefined,
        photos: attachedPhotos,
      };

      const res = await api.post<any>('/quality/inspect', payload);

      toast.success(
        formResult === 'PASSED'
          ? `Inspection ${res.inspectionNumber} PASSED! Material approved to proceed.`
          : `Inspection ${res.inspectionNumber} logged with photo evidence! Production team (${formAssignedTeam}) has been notified to review the defect proof.`
      );

      // Reset form
      setFormResult('PASSED');
      setFormDefectCategory('NONE');
      setFormDefectDescription('');
      setFormDefectiveQuantity(0);
      setFormCorrectiveAction('');
      setAttachedPhotos([]);

      await loadAllData();
      setActiveTab('dashboard');
    } catch (err: any) {
      toast.error('Inspection failed to submit: ' + err.message);
    }
  };

  // Submit correction notes (Production Staff)
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionNotes) {
      toast.error('Please enter correction completion notes.');
      return;
    }

    try {
      await api.put(`/quality/issues/${correctionTargetIssue.id}/correct`, {
        correctionNotes,
        rootCause: rootCause || undefined,
        completionEvidencePhotos: correctionPhotos,
      });

      toast.success(`Correction submitted for ${correctionTargetIssue.issueNumber}. Awaiting reinspection.`);
      setShowCorrectionModal(false);
      setCorrectionNotes('');
      setRootCause('');
      setCorrectionPhotos([]);
      await loadAllData();
    } catch (err: any) {
      toast.error('Failed to submit correction: ' + err.message);
    }
  };

  // Perform reinspection (Quality Inspector / Manager / Admin)
  const handlePerformReinspection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reinspectNotes) {
      toast.error('Please enter reinspection evaluation notes.');
      return;
    }

    try {
      const res = await api.post<any>(`/quality/issues/${reinspectTargetIssue.id}/reinspect`, {
        reinspectionResult: reinspectResult,
        reinspectionNotes: reinspectNotes,
      });

      if (reinspectResult === 'PASSED') {
        toast.success(`Reinspection PASSED! Hold released for ${reinspectTargetIssue.batchOrRollNumber}.`);
      } else if (reinspectResult === 'REJECTED_OR_SCRAPPED') {
        toast.error(`Material permanently rejected and scrapped: ${reinspectTargetIssue.batchOrRollNumber}.`);
      } else {
        toast.warning(`Reinspection failed. Material remains on hold: ${reinspectTargetIssue.batchOrRollNumber}.`);
      }

      setShowReinspectModal(false);
      setReinspectNotes('');
      await loadAllData();
    } catch (err: any) {
      toast.error('Reinspection failed: ' + err.message);
    }
  };

  // Update Checkpoint Configuration (Supervisor)
  const handleToggleCheckpoint = async (cp: any, field: 'isRequired' | 'mandatoryHold') => {
    try {
      const updated = await api.put<any>(`/quality/checkpoints/${cp.id}`, {
        [field]: !cp[field],
      });
      setCheckpoints((prev) => prev.map((item) => (item.id === cp.id ? updated : item)));
      toast.success(`${cp.stageName} updated: ${field} is now ${!cp[field] ? 'ENABLED' : 'DISABLED'}`);
    } catch (err: any) {
      toast.error('Failed to update checkpoint: ' + err.message);
    }
  };

  // View Roll Traceability
  const handleOpenTrace = async (rollId: string) => {
    try {
      const data = await api.get<any>(`/quality/history/${rollId}`);
      setTraceRoll(data);
      setShowTraceModal(true);
    } catch (err: any) {
      toast.error('Failed to fetch roll history: ' + err.message);
    }
  };

  // Printable Quality Issue Report Trigger
  const handlePrintReport = () => {
    window.print();
  };

  // Filtered lists
  const filteredIssues = issuesList.filter((issue) => {
    if (stageFilter !== 'ALL' && issue.stage !== stageFilter) return false;
    if (statusFilter !== 'ALL' && issue.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && issue.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNumber = issue.issueNumber?.toLowerCase().includes(q);
      const matchBatch = issue.batchOrRollNumber?.toLowerCase().includes(q);
      const matchOrder = issue.orderNumber?.toLowerCase().includes(q);
      const matchDefect = issue.defectCategory?.toLowerCase().includes(q);
      if (!matchNumber && !matchBatch && !matchOrder && !matchDefect) return false;
    }
    return true;
  });

  const filteredInspections = inspectionsList.filter((ins) => {
    if (stageFilter !== 'ALL' && ins.stage !== stageFilter) return false;
    if (statusFilter !== 'ALL' && ins.result !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNumber = ins.inspectionNumber?.toLowerCase().includes(q);
      const matchBatch = ins.batchOrRollNumber?.toLowerCase().includes(q);
      const matchInspector = ins.inspectorName?.toLowerCase().includes(q);
      if (!matchNumber && !matchBatch && !matchInspector) return false;
    }
    return true;
  });

  // Stage defect chart data for recharts
  const stageChartData = [
    { name: 'Raw Material', stage: 'RAW_MATERIAL', defects: dashboardData?.stageBreakdown?.RAW_MATERIAL?.failed || 0, passed: dashboardData?.stageBreakdown?.RAW_MATERIAL?.passed || 0 },
    { name: 'Spinning QC', stage: 'SPINNING_QC', defects: dashboardData?.stageBreakdown?.SPINNING_QC?.failed || 0, passed: dashboardData?.stageBreakdown?.SPINNING_QC?.passed || 0 },
    { name: 'Weaving QC', stage: 'WEAVING_QC', defects: dashboardData?.stageBreakdown?.WEAVING_QC?.failed || 0, passed: dashboardData?.stageBreakdown?.WEAVING_QC?.passed || 0 },
    { name: 'Dyeing QC', stage: 'DYEING_QC', defects: dashboardData?.stageBreakdown?.DYEING_QC?.failed || 0, passed: dashboardData?.stageBreakdown?.DYEING_QC?.passed || 0 },
    { name: 'Final Inspection', stage: 'FINAL_INSPECTION', defects: dashboardData?.stageBreakdown?.FINAL_INSPECTION?.failed || 0, passed: dashboardData?.stageBreakdown?.FINAL_INSPECTION?.passed || 0 },
  ];

  const pieColors = ['#0f766e', '#059669', '#d97706', '#dc2626', '#475569'];

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-2">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & WORKSPACE BANNER */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
              isProductionOnly
                ? 'bg-indigo-50 border border-indigo-200 text-indigo-900'
                : 'bg-teal-50 border border-teal-200/80 text-teal-800'
            }`}>
              {isProductionOnly ? <Zap className="w-5 h-5 text-indigo-700" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  {isProductionOnly ? 'Production Strategy & QA Directives Desk' : 'Stage-Wise Quality Control & Analysis'}
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isProductionOnly
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                    : 'bg-teal-100 text-teal-900 border border-teal-200'
                }`}>
                  {isProductionOnly ? 'PRODUCTION DESK' : 'AGT ASTM 4-POINT'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isProductionOnly
                  ? 'Refer to QA defect directives and photo evidence sent by Quality Management to enact production strategy changes.'
                  : 'Defect detection at Spinning, Weaving & Dyeing operations with mandatory holds and corrective action workflows.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              loadAllData();
              toast.success('Quality metrics refreshed from database.');
            }}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          {isQualityStaff && (
            <button
              onClick={() => setActiveTab('inspect')}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Quality Inspection</span>
            </button>
          )}

          {isProductionOnly && (
            <div className="px-3.5 py-2 bg-gradient-to-r from-indigo-50 to-indigo-100/80 border border-indigo-200 text-indigo-950 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Production Strategy Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. NAVIGATION TABS */}
      {/* ======================================================== */}
      <div className="flex border-b border-slate-200 text-xs font-semibold overflow-x-auto gap-1 print:hidden">
        {isProductionOnly ? (
          <>
            <button
              onClick={() => setActiveTab('issues')}
              className={`py-2.5 px-4 rounded-t-xl transition flex items-center space-x-2 ${
                activeTab === 'issues'
                  ? 'bg-white border-t border-x border-slate-200 text-indigo-900 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>QA Defect Directives & Strategy Desk ({issuesList.filter((i) => i.holdStatus === 'ON_HOLD').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2.5 px-4 rounded-t-xl transition flex items-center space-x-2 ${
                activeTab === 'dashboard'
                  ? 'bg-white border-t border-x border-slate-200 text-teal-800 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Production Holds & Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2.5 px-4 rounded-t-xl transition flex items-center space-x-2 ${
                activeTab === 'analytics'
                  ? 'bg-white border-t border-x border-slate-200 text-teal-800 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Defect Trends & Root Causes</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2.5 px-4 rounded-t-xl transition flex items-center space-x-2 ${
                activeTab === 'dashboard'
                  ? 'bg-white border-t border-x border-slate-200 text-teal-800 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dashboard & Holds</span>
            </button>
            <button
              onClick={() => setActiveTab('inspect')}
              className={`py-2.5 px-4 rounded-t-xl transition flex items-center space-x-2 ${
                activeTab === 'inspect'
                  ? 'bg-white border-t border-x border-slate-200 text-teal-800 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create Inspection Form</span>
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`py-2.5 px-4 rounded-t-xl transition flex items-center space-x-2 ${
                activeTab === 'issues'
                  ? 'bg-white border-t border-x border-slate-200 text-teal-800 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Quality Issues & Holds ({issuesList.filter((i) => i.holdStatus === 'ON_HOLD').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('checkpoints')}
              className={`py-2.5 px-4 rounded-t-xl transition flex items-center space-x-2 ${
                activeTab === 'checkpoints'
                  ? 'bg-white border-t border-x border-slate-200 text-teal-800 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Workflow Checkpoint Config</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2.5 px-4 rounded-t-xl transition flex items-center space-x-2 ${
                activeTab === 'analytics'
                  ? 'bg-white border-t border-x border-slate-200 text-teal-800 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Reports & Defect Analytics</span>
            </button>
          </>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. SIX DASHBOARD SUMMARY CARDS (DYNAMIC FROM REAL DATA) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 print:hidden">
        {/* Total Inspections */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Inspections</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
            {dashboardData?.summary?.totalInspections || 0}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Stage checks completed</span>
        </div>

        {/* Inspections Passed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Inspections Passed</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1 tracking-tight">
            {dashboardData?.summary?.inspectionsPassed || 0}
          </p>
          <span className="inline-flex items-center px-1.5 py-0.2 mt-1 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {dashboardData?.summary?.passPercentage || 100}% Pass Rate
          </span>
        </div>

        {/* Inspections Failed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Inspections Failed</span>
          <p className="text-2xl font-bold text-rose-700 mt-1 tracking-tight">
            {dashboardData?.summary?.inspectionsFailed || 0}
          </p>
          <span className="inline-flex items-center px-1.5 py-0.2 mt-1 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            Held from next step
          </span>
        </div>

        {/* Issues Awaiting Correction */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Awaiting Correction</span>
          <p className="text-2xl font-bold text-amber-700 mt-1 tracking-tight">
            {dashboardData?.summary?.issuesAwaitingCorrection || 0}
          </p>
          <span className="inline-flex items-center px-1.5 py-0.2 mt-1 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Assigned to production
          </span>
        </div>

        {/* Reinspections Pending */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Reinspections Pending</span>
          <p className="text-2xl font-bold text-teal-800 mt-1 tracking-tight">
            {dashboardData?.summary?.reinspectionsPending || 0}
          </p>
          <span className="inline-flex items-center px-1.5 py-0.2 mt-1 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            Ready for QA check
          </span>
        </div>

        {/* Average Defect Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Avg Defect Rate</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
            {dashboardData?.summary?.avgDefectRate || 0}%
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Plant defect threshold 3.5%</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. PRODUCTION HOLD SUMMARY BANNER */}
      {/* ======================================================== */}
      {dashboardData?.holdSummary?.activeHeldCount > 0 && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                ACTIVE PRODUCTION HOLD: {dashboardData.holdSummary.activeHeldCount} roll(s) / {dashboardData.holdSummary.totalHeldMeters} meters currently quarantined
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Affected fabric rolls are strictly barred from entering Finished Goods Stock or Dispatch until authorized quality reinspection sign-off.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setStatusFilter('ON_HOLD');
              setActiveTab('issues');
            }}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0 transition shadow-xs flex items-center space-x-1"
          >
            <span>Review Held Materials</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TAB VIEW 1: DASHBOARD & RECENT INSPECTIONS */}
      {/* ======================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Visual Charts & Hold Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stage-Wise Defect Distribution Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">Stage-Wise Defect & Pass Volume</h3>
                  <p className="text-[11px] text-slate-500">Breakdown across the 5 textile manufacturing checkpoints</p>
                </div>
                <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Real-time Data
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="passed" name="Inspections Passed" fill="#0f766e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="defects" name="Defects / Holds" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                {stageChartData.map((st) => (
                  <div key={st.stage} className="p-1.5 bg-slate-50 rounded-lg">
                    <span className="text-[9px] text-slate-500 block truncate">{st.name}</span>
                    <span className="text-xs font-bold text-slate-800 block">{st.defects + st.passed} tests</span>
                    <span className="text-[10px] text-rose-700 font-semibold">{st.defects} held</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Quality Issues Panel */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">Critical Quality Issues</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    High Priority
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Active stage defects requiring production maintenance and supervisor sign-off.
                </p>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {issuesList.filter((i) => i.status !== 'APPROVED_TO_CONTINUE' && i.status !== 'REJECTED_OR_SCRAPPED').length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
                      <span>No open critical quality issues!</span>
                    </div>
                  ) : (
                    issuesList
                      .filter((i) => i.status !== 'APPROVED_TO_CONTINUE' && i.status !== 'REJECTED_OR_SCRAPPED')
                      .slice(0, 5)
                      .map((issue) => (
                        <div
                          key={issue.id}
                          onClick={() => {
                            setSelectedIssue(issue);
                            setShowIssueModal(true);
                          }}
                          className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500/50 bg-slate-50/50 hover:bg-teal-50/20 cursor-pointer transition text-xs space-y-1"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono font-bold text-slate-900 text-[11px]">{issue.issueNumber}</span>
                            <span
                              className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                                issue.severity === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-800'
                                  : issue.severity === 'MAJOR'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-slate-800 font-semibold line-clamp-1">{issue.defectCategory.replace(/_/g, ' ')}</p>
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span>{issue.batchOrRollNumber}</span>
                            <span className="font-semibold text-teal-800">{issue.status.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('issues')}
                className="w-full mt-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold text-center transition"
              >
                View All Quality Issues ({issuesList.length})
              </button>
            </div>
          </div>

          {/* Recent Inspections Table with Filters */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Recent Stage-Wise Inspections</h3>
                <p className="text-[11px] text-slate-500">Real-time roll and batch inspection history with photo attachments</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Stage Filter */}
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl text-slate-700 text-xs focus:ring-1 focus:ring-teal-700"
                >
                  <option value="ALL">All Stages</option>
                  <option value="RAW_MATERIAL">Raw Material</option>
                  <option value="SPINNING_QC">Spinning QC</option>
                  <option value="WEAVING_QC">Weaving QC</option>
                  <option value="DYEING_QC">Dyeing QC</option>
                  <option value="FINAL_INSPECTION">Final Inspection</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl text-slate-700 text-xs focus:ring-1 focus:ring-teal-700"
                >
                  <option value="ALL">All Results</option>
                  <option value="PASSED">Passed</option>
                  <option value="FAILED">Failed</option>
                  <option value="REWORK_REQUIRED">Rework</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search roll, order..."
                    className="pl-7 pr-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 w-36 md:w-44 focus:ring-1 focus:ring-teal-700"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Inspection ID</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Batch / Roll</th>
                    <th className="py-3 px-4">Machine / Order</th>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4">Defect Details</th>
                    <th className="py-3 px-4">Inspector</th>
                    <th className="py-3 px-4">Evidence</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredInspections.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400 font-medium">
                        No inspections match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredInspections.map((ins) => (
                      <tr key={ins.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {ins.inspectionNumber || `INSP-${ins.id.slice(0, 6)}`}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                            {ins.stage ? ins.stage.replace(/_/g, ' ') : 'FINAL INSPECTION'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-teal-900">
                          {ins.batchOrRollNumber || ins.roll?.rollId || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block">{ins.orderNumber || ins.order?.orderNumber || 'Standard'}</span>
                          <span className="text-[10px] text-slate-400 block">{ins.machineName || ins.machine?.name || 'Manual Table'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              ins.result === 'PASSED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : ins.result === 'REWORK_REQUIRED'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {ins.result}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {ins.defectCategory && ins.defectCategory !== 'NONE' ? (
                            <div>
                              <span className="font-semibold text-rose-800 text-[11px] block">{ins.defectCategory.replace(/_/g, ' ')}</span>
                              <span className="text-[10px] text-slate-500 line-clamp-1">{ins.defectDescription}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No defects</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="block font-medium">{ins.inspectorName}</span>
                          <span className="text-[10px] text-slate-400">{new Date(ins.inspectionDate).toLocaleDateString()}</span>
                        </td>
                        <td className="py-3 px-4">
                          {ins.photos && ins.photos.length > 0 ? (
                            <button
                              onClick={() => {
                                setPreviewPhoto(ins.photos[0]);
                                setShowPhotoModal(true);
                              }}
                              className="inline-flex items-center space-x-1 text-teal-800 font-semibold hover:underline"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>{ins.photos.length} Photo(s)</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px]">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          {ins.rollId && (
                            <button
                              onClick={() => handleOpenTrace(ins.rollId)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition shadow-xs"
                            >
                              <History className="w-3 h-3 text-slate-400" />
                              <span>History</span>
                            </button>
                          )}
                          {ins.qualityIssue && (
                            <button
                              onClick={() => {
                                setSelectedIssue(ins.qualityIssue);
                                setShowIssueModal(true);
                              }}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition shadow-xs"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>Issue</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. TAB VIEW 2: CREATE STAGE-WISE INSPECTION FORM */}
      {/* ======================================================== */}
      {activeTab === 'inspect' &&
        (isProductionOnly ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl mx-auto space-y-4 shadow-xs animate-in fade-in duration-150">
            <div className="w-14 h-14 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Quality Manager Exclusive Area</h3>
              <p className="text-xs text-slate-500 mt-1">
                Only Quality Staff have authority to perform stage inspections and snap defect photos. As Production Manager, your workspace is reviewing QA defect notices and changing production strategies.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('issues')}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 shadow-xs"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Go to QA Defect Directives & Strategy Desk</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs max-w-4xl mx-auto animate-in fade-in duration-150">
          <div className="pb-4 border-b border-slate-100 mb-6">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Record Stage-Wise Quality Inspection</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspecting material immediately after each manufacturing operation. Defects trigger automated hold & corrective assignments.
            </p>
          </div>

          <form onSubmit={handleCreateInspection} className="space-y-5 text-xs">
            {/* Section 1: Identification & Stage */}
            <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                <Cpu className="w-4 h-4 text-teal-800" />
                <span>1. Manufacturing Operation & Checkpoint Selection</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Production Stage */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Production Stage Checkpoint <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={formStage}
                    onChange={(e: any) => setFormStage(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="RAW_MATERIAL">1. Raw Material Inspection (Yarn/Fiber)</option>
                    <option value="SPINNING_QC">2. Spinning Quality Check (Ring Frame)</option>
                    <option value="WEAVING_QC">3. Weaving Quality Check (Greige Loom)</option>
                    <option value="DYEING_QC">4. Dyeing & Finishing Check (Shade Matching)</option>
                    <option value="FINAL_INSPECTION">5. Final Quality Inspection (Fabric Roll)</option>
                  </select>
                </div>

                {/* Batch / Roll ID */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Batch / Roll / Lot ID <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formBatchOrRoll}
                      onChange={(e) => setFormBatchOrRoll(e.target.value)}
                      placeholder="e.g. ROLL-2026-0001 or SPIN-LOT-40"
                      required
                      className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-900 font-mono font-bold focus:ring-2 focus:ring-teal-700/20"
                    />
                    {rolls.length > 0 && (
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
                        <span>Quick pick:</span>
                        {rolls.slice(0, 3).map((r) => (
                          <button
                            type="button"
                            key={r.id}
                            onClick={() => {
                              setFormBatchOrRoll(r.rollId);
                              setFormFabricType(r.fabricType);
                              if (r.order) setFormOrderNumber(r.order.orderNumber);
                            }}
                            className="text-teal-800 font-semibold hover:underline"
                          >
                            {r.rollId}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Manufacturing Order # */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Manufacturing Order #</label>
                  <input
                    type="text"
                    value={formOrderNumber}
                    onChange={(e) => setFormOrderNumber(e.target.value)}
                    placeholder="e.g. ORD-2026-001"
                    className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Product / Fabric Type */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Product / Fabric Type</label>
                  <input
                    type="text"
                    value={formFabricType}
                    onChange={(e) => setFormFabricType(e.target.value)}
                    placeholder="e.g. 100% Combed Cotton 40s"
                    className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-800"
                  />
                </div>

                {/* Machine ID */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Machine / Loom Fleet ID</label>
                  <select
                    value={formMachineName}
                    onChange={(e) => {
                      setFormMachineName(e.target.value);
                      const m = machines.find((item) => item.name === e.target.value);
                      if (m) setFormMachineId(m.id);
                    }}
                    className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-800"
                  >
                    <option value="">Select or leave blank...</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.code} - {m.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Inspector Name & Date */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lead Inspector Name</label>
                  <input
                    type="text"
                    value={formInspectorName}
                    onChange={(e) => setFormInspectorName(e.target.value)}
                    required
                    className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-800 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Inspection Result (Pass / Fail / Rework) */}
            <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 space-y-3">
              <label className="font-bold text-slate-800 text-xs block">
                2. Inspection Decision <span className="text-rose-600">*</span>
              </label>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setFormResult('PASSED')}
                  className={`p-3 rounded-xl border text-center transition font-bold text-xs flex flex-col items-center justify-center space-y-1 ${
                    formResult === 'PASSED'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>PASS (Proceed)</span>
                  <span className="text-[10px] font-normal opacity-90">Advances to next stage</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormResult('FAILED')}
                  className={`p-3 rounded-xl border text-center transition font-bold text-xs flex flex-col items-center justify-center space-y-1 ${
                    formResult === 'FAILED'
                      ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                  <span>FAIL (Hold Material)</span>
                  <span className="text-[10px] font-normal opacity-90">Quarantines & logs issue</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormResult('REWORK_REQUIRED')}
                  className={`p-3 rounded-xl border text-center transition font-bold text-xs flex flex-col items-center justify-center space-y-1 ${
                    formResult === 'REWORK_REQUIRED'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>REWORK REQUIRED</span>
                  <span className="text-[10px] font-normal opacity-90">Route for corrective mending</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormResult('REJECTED')}
                  className={`p-3 rounded-xl border text-center transition font-bold text-xs flex flex-col items-center justify-center space-y-1 ${
                    formResult === 'REJECTED'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Trash2 className="w-5 h-5" />
                  <span>PERMANENT REJECT</span>
                  <span className="text-[10px] font-normal opacity-90">Scrap from saleable lot</span>
                </button>
              </div>
            </div>

            {/* Section 3: CONDITIONAL DEFECT DETAILS (Shown when Failed/Rework) */}
            {formResult !== 'PASSED' && (
              <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4" />
                  <span>3. Defect Classification, Corrective Action & Production Assignment</span>
                </div>

                {/* Quick Defect Presets including Hole in Fabric */}
                <div className="p-3 bg-white border border-rose-200 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Quick Defect Presets (One-click auto configuration):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyDefectPreset('HOLE')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        formDefectCategory === 'HOLES_FABRIC_DAMAGE'
                          ? 'bg-rose-700 text-white shadow-xs'
                          : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      <span>🕳️ Hole in Fabric (Critical)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDefectPreset('WARP')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        formDefectCategory === 'BROKEN_THREADS'
                          ? 'bg-amber-700 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <span>🧵 Broken Threads</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDefectPreset('SHADE')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        formDefectCategory === 'COLOR_MISMATCH_UNEVEN_DYEING'
                          ? 'bg-indigo-700 text-white shadow-xs'
                          : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
                      }`}
                    >
                      <span>🎨 Uneven Dyeing</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDefectPreset('STAIN')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        formDefectCategory === 'CONTAMINATION'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <span>🛢️ Oil Stains</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDefectPreset('YARN')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        formDefectCategory === 'UNEVEN_YARN_THICKNESS'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
                      }`}
                    >
                      <span>🧶 Uneven Yarn</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Defect Category */}
                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      Defect Category <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={formDefectCategory}
                      onChange={(e) => setFormDefectCategory(e.target.value)}
                      required
                      className="w-full border border-slate-300 p-2.5 rounded-xl bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-rose-500/20"
                    >
                      <option value="NONE">Select Defect...</option>
                      <option value="BROKEN_THREADS">Broken threads (Warp/Weft breakage)</option>
                      <option value="UNEVEN_YARN_THICKNESS">Uneven yarn thickness (Slub / Count CV)</option>
                      <option value="WEAVING_DEFECTS">Weaving defects (Reed marks, floats, mispicks)</option>
                      <option value="HOLES_FABRIC_DAMAGE">Holes or fabric damage (Tears, pin holes)</option>
                      <option value="COLOR_MISMATCH_UNEVEN_DYEING">Incorrect colour or uneven dyeing (Delta-E)</option>
                      <option value="CONTAMINATION">Contamination (Oil stains, grease, foreign fiber)</option>
                      <option value="DIMENSIONAL_SHRINKAGE">Dimensional or shrinkage issues (GSM / Width)</option>
                      <option value="OTHER">Other Defect</option>
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      Defect Severity <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={formSeverity}
                      onChange={(e: any) => setFormSeverity(e.target.value)}
                      className="w-full border border-slate-300 p-2.5 rounded-xl bg-white text-slate-900 font-semibold"
                    >
                      <option value="MINOR">Minor (Tolerable spot mending)</option>
                      <option value="MAJOR">Major (Re-processing mandatory)</option>
                      <option value="CRITICAL">Critical (Immediate loom hold)</option>
                    </select>
                  </div>

                  {/* Defective Quantity & Affected Material */}
                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">Affected Material Qty</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={formAffectedQuantity}
                        onChange={(e) => setFormAffectedQuantity(Number(e.target.value))}
                        min={0}
                        className="w-full border border-slate-300 p-2.5 rounded-xl bg-white text-slate-900"
                      />
                      <select
                        value={formUnit}
                        onChange={(e: any) => setFormUnit(e.target.value)}
                        className="border border-slate-300 p-2.5 rounded-xl bg-white text-slate-900"
                      >
                        <option value="METERS">Meters</option>
                        <option value="KG">KG</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Defect Description */}
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Defect Description & Precise Location <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    value={formDefectDescription}
                    onChange={(e) => setFormDefectDescription(e.target.value)}
                    required
                    placeholder="e.g. Warp streaks detected spanning 18 meters from the selvedge at 92m mark on Loom #4..."
                    className="w-full border border-slate-300 p-2.5 rounded-xl bg-white text-slate-900"
                    rows={2}
                  ></textarea>
                </div>

                {/* Corrective Action Required */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">
                      Corrective Action Required <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      value={formCorrectiveAction}
                      onChange={(e) => setFormCorrectiveAction(e.target.value)}
                      required
                      placeholder="e.g. Stop machine, re-draw harness eyelets, cut out damaged section and mend warp threads..."
                      className="w-full border border-slate-300 p-2.5 rounded-xl bg-white text-slate-900"
                      rows={2}
                    ></textarea>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-slate-800 block mb-1">Assigned Department</label>
                        <select
                          value={formAssignedTeam}
                          onChange={(e) => setFormAssignedTeam(e.target.value)}
                          className="w-full border border-slate-300 p-2 rounded-xl bg-white text-slate-900 font-semibold"
                        >
                          <option value="SPINNING_DEPT">Spinning Dept</option>
                          <option value="WEAVING_DEPT">Weaving Dept</option>
                          <option value="DYEING_DEPT">Dyeing Dept</option>
                          <option value="FINISHING_DEPT">Finishing Dept</option>
                          <option value="QUALITY_LAB">Quality Lab</option>
                          <option value="STORE">Yarn Store</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-800 block mb-1">Assigned Person</label>
                        <input
                          type="text"
                          value={formAssignedPerson}
                          onChange={(e) => setFormAssignedPerson(e.target.value)}
                          placeholder="e.g. Shift Incharge"
                          className="w-full border border-slate-300 p-2 rounded-xl bg-white text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-800 block mb-1">Correction Due Date</label>
                      <input
                        type="date"
                        value={formDueDate}
                        onChange={(e) => setFormDueDate(e.target.value)}
                        className="w-full border border-slate-300 p-2 rounded-xl bg-white text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: PHOTOGRAPHIC EVIDENCE UPLOADER - QUALITY MANAGER EXCLUSIVE */}
            <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1.5 font-bold text-slate-800 text-xs">
                  <Camera className="w-4 h-4 text-teal-800" />
                  <span>4. Photographic Evidence & Documentation</span>
                </div>
                <span className="text-[10px] text-teal-800 font-bold px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200">
                  Quality Manager Exclusive
                </span>
              </div>

              {isQualityStaff ? (
                <>
                  <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl text-teal-950 space-y-1">
                    <p className="font-semibold text-xs flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-800" />
                      <span>Quality Manager Defect Photo Capture Desk</span>
                    </p>
                    <p className="text-[11px] text-teal-800">
                      Pick or take defect photographs from your camera/device. Once submitted, the production team and plant supervisors will receive an automated notification with this visual proof to take immediate corrective action.
                    </p>
                  </div>

                  {/* Camera & Upload trigger buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Live Camera Button */}
                    <button
                      type="button"
                      onClick={() => openCamera('environment')}
                      disabled={uploadingPhoto}
                      className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold flex items-center space-x-2 transition shadow-xs text-xs"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Open Camera & Snap Defect (Live)</span>
                    </button>

                    {/* File Picker Fallback */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handlePhotoUpload(e, false)}
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold flex items-center space-x-1.5 transition text-xs shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Select from Files</span>
                    </button>

                    <span className="text-[11px] text-slate-500 font-medium">
                      {attachedPhotos.length} photograph(s) attached
                    </span>
                  </div>

                  {/* Photos Preview Grid */}
                  {attachedPhotos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {attachedPhotos.map((photo, index) => (
                        <div key={index} className="relative group bg-white border border-slate-200 rounded-xl p-2 shadow-xs space-y-1">
                          <div className="h-28 w-full rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                            <img src={photo.fileUrl} alt={photo.fileName} className="h-full w-full object-cover" />
                          </div>
                          <input
                            type="text"
                            value={photo.caption || ''}
                            onChange={(e) => {
                              const updated = [...attachedPhotos];
                              updated[index].caption = e.target.value;
                              setAttachedPhotos(updated);
                            }}
                            placeholder="Add photo caption..."
                            className="w-full text-[10px] p-1 border border-slate-200 rounded bg-slate-50 text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setAttachedPhotos((prev) => prev.filter((_, i) => i !== index));
                            }}
                            className="absolute top-3 right-3 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    <span>Quality Manager Authorization Required for Photo Capture</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Only authorized Quality Managers and QA Inspectors are permitted to pick and upload defect photographic evidence. Production staff and line supervisors receive immediate automated notifications with the photos once submitted.
                  </p>
                </div>
              )}
            </div>

            {/* Section 5: General Remarks */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Inspector Comments & Sign-off Notes</label>
              <textarea
                value={formInspectorComments}
                onChange={(e) => setFormInspectorComments(e.target.value)}
                placeholder="4-point test grading notes, ASTM ASTM D5430 evaluation, lighting table inspection comments..."
                className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-800"
                rows={2}
              ></textarea>
            </div>

            {/* Submission Actions */}
            <div className="flex justify-end items-center space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow-xs transition"
              >
                Submit Quality Inspection Result
              </button>
            </div>
          </form>
        </div>
      ))}

      {/* ======================================================== */}
      {/* 7. TAB VIEW 3: QUALITY ISSUES & CORRECTIVE ACTIONS */}
      {/* ======================================================== */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          {/* Production Strategy Guidance Banner */}
          {isProductionOnly && (
            <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-indigo-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 uppercase tracking-wider">
                    Production Unit Mode
                  </span>
                  <h3 className="font-bold text-sm tracking-tight text-white flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Shop-Floor Strategy & Defect Adaptation Desk</span>
                  </h3>
                </div>
                <p className="text-xs text-indigo-100/90 leading-relaxed">
                  Quality Management has detected defects and issued containment holds with photographic evidence.
                  Review the QA directive below, accept the documentation, and <strong>Change the Production Strategy</strong> (reduce loom speed, swap yarn lot, reroute machines, or replace reed dents) to eradicate root causes before requesting QA release.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/15 text-center">
                  <span className="text-[10px] uppercase font-bold text-indigo-200 block">Requiring Strategy</span>
                  <span className="text-lg font-black text-amber-300">
                    {issuesList.filter((i) => !i.strategyType && i.status !== 'APPROVED_TO_CONTINUE' && i.status !== 'REJECTED_OR_SCRAPPED').length}
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/15 text-center">
                  <span className="text-[10px] uppercase font-bold text-indigo-200 block">Strategies Deployed</span>
                  <span className="text-lg font-black text-emerald-300">
                    {issuesList.filter((i) => !!i.strategyType).length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Filters:</span>
              </span>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-xl text-slate-700 text-xs font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CORRECTION_ASSIGNED">Correction Assigned</option>
                <option value="CORRECTION_IN_PROGRESS">Correction In Progress</option>
                <option value="AWAITING_REINSPECTION">Awaiting Reinspection</option>
                <option value="APPROVED_TO_CONTINUE">Approved to Continue (Resolved)</option>
                <option value="REJECTED_OR_SCRAPPED">Rejected or Scrapped</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-xl text-slate-700 text-xs font-semibold"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="MAJOR">Major</option>
                <option value="MINOR">Minor</option>
              </select>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-xl text-slate-700 text-xs font-semibold"
              >
                <option value="ALL">All Stages</option>
                <option value="RAW_MATERIAL">Raw Material</option>
                <option value="SPINNING_QC">Spinning QC</option>
                <option value="WEAVING_QC">Weaving QC</option>
                <option value="DYEING_QC">Dyeing QC</option>
                <option value="FINAL_INSPECTION">Final Inspection</option>
              </select>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issue ID, batch..."
                className="pl-7 pr-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 w-48"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
            </div>
          </div>

          {/* Issues List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIssues.length === 0 ? (
              <div className="col-span-3 py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <p className="font-semibold text-slate-700">No quality issues found matching criteria!</p>
                <p className="text-xs text-slate-400 mt-1">All affected textile batches have been resolved or released.</p>
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-teal-700/40 transition"
                >
                  <div className="space-y-2">
                    {/* Top Row: Issue # & Severity Badge */}
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-slate-900 text-xs tracking-tight">{issue.issueNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          issue.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : issue.severity === 'MAJOR'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>

                    {/* Defect Category & Stage */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{issue.defectCategory.replace(/_/g, ' ')}</h4>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-teal-800">{issue.stage.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span className="font-mono">{issue.batchOrRollNumber}</span>
                      </div>
                    </div>

                    {/* Defect Description snippet */}
                    <p className="text-[11px] text-slate-600 line-clamp-2">{issue.defectDescription}</p>

                    {/* Status & Hold Status */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Status:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          issue.status === 'APPROVED_TO_CONTINUE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : issue.status === 'AWAITING_REINSPECTION'
                            ? 'bg-teal-100 text-teal-900'
                            : issue.status === 'ON_HOLD'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {issue.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Hold Status:</span>
                      <span
                        className={`font-semibold ${
                          issue.holdStatus === 'ON_HOLD' ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {issue.holdStatus === 'ON_HOLD' ? '⛔ Quarantined On Hold' : '✅ Hold Released'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Assigned:</span>
                      <span className="font-semibold text-slate-700">{issue.assignedTeam.replace(/_/g, ' ')}</span>
                    </div>

                    {/* Documentation Acceptance Status Badge */}
                    <div className="pt-1.5 border-t border-slate-100">
                      {issue.documentationAccepted ? (
                        <div className="flex items-center space-x-1.5 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">
                            QA Doc Accepted by <strong>{issue.documentationAcceptedBy || 'Production'}</strong>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-[10px] text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
                          <span className="font-semibold">Awaiting Production Acceptance</span>
                        </div>
                      )}
                    </div>

                    {/* Active Production Strategy Badge */}
                    {issue.strategyType && (
                      <div className="p-2.5 bg-indigo-50/90 rounded-xl border border-indigo-200/90 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center space-x-1 text-[10px] font-bold text-indigo-900">
                            <Zap className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span>Strategy: {issue.strategyType.replace(/_/g, ' ')}</span>
                          </span>
                          <span className="text-[9px] text-indigo-700 font-medium">
                            {issue.strategyImplementedBy || 'Production'}
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-950 font-medium line-clamp-2">
                          {issue.strategySummary}
                        </p>
                        {issue.parameterChanges && (
                          <p className="text-[10px] font-mono text-indigo-800 bg-white/80 px-1.5 py-0.5 rounded border border-indigo-100 truncate">
                            ⚙️ {issue.parameterChanges}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedIssue(issue);
                        setShowIssueModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1 transition shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details / Print</span>
                    </button>

                    {/* Production Unit Accepts Documentation */}
                    {!issue.documentationAccepted &&
                      issue.status !== 'APPROVED_TO_CONTINUE' &&
                      issue.status !== 'REJECTED_OR_SCRAPPED' &&
                      isProductionStaff && (
                        <button
                          onClick={() => handleOpenAcceptDocModal(issue)}
                          className="px-2.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Accept QA Doc</span>
                        </button>
                      )}

                    {/* Production Manager Changes / Adjusts Production Strategy */}
                    {isProductionStaff &&
                      issue.status !== 'APPROVED_TO_CONTINUE' &&
                      issue.status !== 'REJECTED_OR_SCRAPPED' && (
                        <button
                          onClick={() => handleOpenStrategyModal(issue)}
                          className="px-2.5 py-1.5 bg-gradient-to-r from-indigo-700 to-indigo-900 hover:from-indigo-800 hover:to-indigo-950 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>{issue.strategyType ? 'Adjust Strategy' : 'Change Strategy'}</span>
                        </button>
                      )}

                    {/* Production Staff submits correction notes */}
                    {['ON_HOLD', 'CORRECTION_ASSIGNED', 'CORRECTION_IN_PROGRESS', 'REINSPECTION_FAILED'].includes(
                      issue.status
                    ) &&
                      isProductionStaff && (
                        <button
                          onClick={() => {
                            setCorrectionTargetIssue(issue);
                            setCorrectionNotes(issue.correctionNotes || '');
                            setRootCause(issue.rootCause || '');
                            setShowCorrectionModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
                        >
                          Submit Correction
                        </button>
                      )}

                    {/* Quality Inspector / Manager performs reinspection */}
                    {issue.status === 'AWAITING_REINSPECTION' && isQualityStaff && (
                      <button
                        onClick={() => {
                          setReinspectTargetIssue(issue);
                          setReinspectResult('PASSED');
                          setReinspectNotes('');
                          setShowReinspectModal(true);
                        }}
                        className="px-2.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1 shadow-xs"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Reinspect & Release</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. TAB VIEW 4: CONFIGURABLE WORKFLOW CHECKPOINTS */}
      {/* ======================================================== */}
      {activeTab === 'checkpoints' &&
        (isProductionOnly ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl mx-auto space-y-4 shadow-xs animate-in fade-in duration-150">
            <div className="w-14 h-14 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Settings2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Quality Administration Exclusive Area</h3>
              <p className="text-xs text-slate-500 mt-1">
                Stage checkpoint definitions, defect tolerances, and inspection criteria are managed exclusively by Quality Leadership and Admins.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('issues')}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 shadow-xs"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Return to QA Defect Directives & Strategy Desk</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Configurable Textile Stage Workflow</h3>
            <p className="text-xs text-slate-500 mt-1">
              Supervisors can configure which stages require mandatory quality checks and automatic production hold enforcement.
            </p>

            {/* Pipeline Step Visualizer */}
            <div className="mt-6 flex items-center justify-between overflow-x-auto py-2">
              {[
                { title: '1. Raw Material', check: 'Raw Material QC' },
                { title: '2. Spinning', check: 'Spinning QC' },
                { title: '3. Weaving', check: 'Weaving QC' },
                { title: '4. Dyeing & Finishing', check: 'Dyeing QC' },
                { title: '5. Final Inspection', check: 'Final 4-Point' },
                { title: '6. Finished Stock', check: 'Warehouse' },
                { title: '7. Dispatch', check: 'Shipment' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center shrink-0">
                  <div className="flex flex-col items-center text-center px-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-300 text-teal-800 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 mt-1.5">{step.title}</span>
                    <span className="text-[10px] text-teal-800 font-semibold">{step.check}</span>
                  </div>
                  {idx < 6 && <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />}
                </div>
              ))}
            </div>
          </div>

          {/* Checkpoint Configuration Cards */}
          <div className="space-y-3">
            {checkpoints.map((cp) => (
              <div
                key={cp.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-slate-900 text-xs">{cp.stageName}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      Code: {cp.stageCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      Standard: {cp.inspectionType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{cp.description}</p>
                  <p className="text-[11px] text-slate-400">Responsible Dept: <strong>{cp.responsibleTeam}</strong></p>
                </div>

                <div className="flex items-center space-x-4 shrink-0">
                  {/* Toggle Required Checkpoint */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-600 font-medium">Quality Check:</span>
                    <button
                      type="button"
                      disabled={!isSupervisorOrAdmin}
                      onClick={() => handleToggleCheckpoint(cp, 'isRequired')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        cp.isRequired
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cp.isRequired ? 'Mandatory' : 'Optional'}
                    </button>
                  </div>

                  {/* Toggle Mandatory Hold */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-600 font-medium">Hold on Defect:</span>
                    <button
                      type="button"
                      disabled={!isSupervisorOrAdmin}
                      onClick={() => handleToggleCheckpoint(cp, 'mandatoryHold')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        cp.mandatoryHold
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cp.mandatoryHold ? 'Strict Hold' : 'Warning Only'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ======================================================== */}
      {/* 9. TAB VIEW 5: REPORTS & DEFECT ANALYTICS */}
      {/* ======================================================== */}
      {activeTab === 'analytics' && analyticsData && (
        <div className="space-y-6">
          {/* Top Analytics KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold block">Material Wastage (Meters)</span>
              <p className="text-2xl font-bold text-rose-700 mt-1">{analyticsData.totalWastageMeters} m</p>
              <span className="text-[10px] text-slate-400">Total defective material detected</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold block">Est. Financial Defect Cost</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">₹{analyticsData.estimatedWastageCost?.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400">Based on standard ₹120/m fabric cost</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold block">Avg Resolution Turnaround</span>
              <p className="text-2xl font-bold text-teal-800 mt-1">{analyticsData.avgResolutionTimeHours} hrs</p>
              <span className="text-[10px] text-slate-400">Issue logged to release from hold</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold block">Open & Overdue Issues</span>
              <p className="text-2xl font-bold text-amber-700 mt-1">
                {analyticsData.openIssuesCount} ({analyticsData.overdueIssuesCount} Overdue)
              </p>
              <span className="text-[10px] text-slate-400">Action required by production</span>
            </div>
          </div>

          {/* Breakdown Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Defect Categories Frequency */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 mb-3">Defect Frequency by Category</h4>
              <div className="space-y-2">
                {Object.entries(analyticsData.defectCategories || {}).length === 0 ? (
                  <p className="text-slate-400 text-xs">No defect occurrences recorded.</p>
                ) : (
                  Object.entries(analyticsData.defectCategories).map(([cat, count]: any) => (
                    <div key={cat} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-xl">
                      <span className="font-semibold text-slate-800">{cat.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-rose-700 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200">
                        {count} instances
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Defect Frequency by Machine */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 mb-3">Defect Frequency by Machine</h4>
              <div className="space-y-2">
                {Object.entries(analyticsData.defectsByMachine || {}).length === 0 ? (
                  <p className="text-slate-400 text-xs">No machine defect records.</p>
                ) : (
                  Object.entries(analyticsData.defectsByMachine).map(([mach, count]: any) => (
                    <div key={mach} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-xl">
                      <span className="font-semibold text-slate-800">{mach}</span>
                      <span className="font-bold text-amber-800 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                        {count} defect logs
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 10. MODAL: DETAILED QUALITY ISSUE REPORT & PRINTABLE VIEW */}
      {/* ======================================================== */}
      {showIssueModal && selectedIssue && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowIssueModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none animate-in zoom-in-95 duration-150">
            {/* Header with Print Button */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 mb-4 print:border-b-2 print:border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-base text-slate-900">
                    Quality Issue Report: {selectedIssue.issueNumber}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedIssue.holdStatus === 'ON_HOLD'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedIssue.holdStatus === 'ON_HOLD' ? '⛔ ON HOLD' : '✅ HOLD RELEASED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Production Stage: <strong>{selectedIssue.stage}</strong> | Batch / Roll: <strong>{selectedIssue.batchOrRollNumber}</strong>
                </p>
              </div>

              <div className="flex items-center space-x-2 print:hidden">
                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
                <button
                  onClick={() => setShowIssueModal(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Issue Report Body */}
            <div className="space-y-4 text-xs">
              {/* Defect Overview */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-slate-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Defect Category:</span>
                    <span className="font-bold text-rose-800">{selectedIssue.defectCategory}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Severity:</span>
                    <span className="font-bold text-slate-800">{selectedIssue.severity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Affected Material:</span>
                    <span className="font-bold text-slate-800">{selectedIssue.affectedQuantity} {selectedIssue.unit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Due Date:</span>
                    <span className="font-bold text-slate-800">{new Date(selectedIssue.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Defect Description:</span>
                  <p className="font-medium text-slate-800">{selectedIssue.defectDescription}</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Recommended Corrective Action:</span>
                  <p className="font-medium text-slate-800">{selectedIssue.recommendedAction}</p>
                </div>

                {selectedIssue.rootCause && (
                  <div>
                    <span className="text-[10px] text-slate-400 block">Identified Root Cause:</span>
                    <p className="font-semibold text-slate-900">{selectedIssue.rootCause}</p>
                  </div>
                )}
              </div>

              {/* Quality Documentation Acceptance Status Section */}
              <div className="p-3.5 rounded-xl border border-slate-200">
                {selectedIssue.documentationAccepted ? (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1 text-emerald-950">
                    <div className="flex items-center space-x-1.5 font-bold text-xs text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Quality Documentation Formally Accepted by Production Unit</span>
                    </div>
                    <p className="text-[11px] text-emerald-900">
                      Accepted by: <strong>{selectedIssue.documentationAcceptedBy || 'Production Incharge'}</strong> on{' '}
                      {selectedIssue.documentationAcceptedAt
                        ? new Date(selectedIssue.documentationAcceptedAt).toLocaleString()
                        : 'N/A'}
                    </p>
                    {selectedIssue.documentationAcceptanceNotes && (
                      <p className="text-[10px] text-emerald-800 bg-white/80 p-2 rounded-lg border border-emerald-200/60 mt-1">
                        <strong>Acknowledgment Notes:</strong> "{selectedIssue.documentationAcceptanceNotes}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 text-amber-950">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 font-bold text-xs text-amber-800">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                        <span>Awaiting Production Acceptance of Quality Documentation</span>
                      </div>
                      {isProductionStaff && selectedIssue.status !== 'APPROVED_TO_CONTINUE' && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowIssueModal(false);
                            handleOpenAcceptDocModal(selectedIssue);
                          }}
                          className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1 shrink-0"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Accept Documentation Now</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-amber-800">
                      Production shift supervisors must review defect photos and accept corrective action instructions before physical correction begins.
                    </p>
                  </div>
                )}
              </div>

              {/* Active Production Strategy (If Configured) */}
              {selectedIssue.strategyType ? (
                <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-indigo-100/60 border border-indigo-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-indigo-950 text-xs flex items-center space-x-1.5">
                      <Zap className="w-4 h-4 text-indigo-700" />
                      <span>Active Production Strategy: {selectedIssue.strategyType.replace(/_/g, ' ')}</span>
                    </span>
                    <span className="text-[10px] text-indigo-800 font-semibold bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                      STRATEGY DEPLOYED
                    </span>
                  </div>
                  <p className="text-indigo-950 font-medium text-xs">{selectedIssue.strategySummary}</p>
                  {selectedIssue.parameterChanges && (
                    <div className="text-[11px] font-mono text-indigo-900 bg-white p-2 rounded-lg border border-indigo-200">
                      ⚙️ <strong>Parameter Changes:</strong> {selectedIssue.parameterChanges}
                    </div>
                  )}
                  {selectedIssue.preventiveMeasures && (
                    <p className="text-[10px] text-indigo-800">
                      <strong>Preventive Controls:</strong> {selectedIssue.preventiveMeasures}
                    </p>
                  )}
                  <div className="flex justify-between items-center text-[10px] text-indigo-700 pt-1 border-t border-indigo-200/50">
                    <span>
                      Implemented by: <strong>{selectedIssue.strategyImplementedBy || 'Production Manager'}</strong>
                    </span>
                    <span>
                      {selectedIssue.strategyImplementedAt
                        ? new Date(selectedIssue.strategyImplementedAt).toLocaleString()
                        : ''}
                    </span>
                  </div>
                  {isProductionStaff && selectedIssue.status !== 'APPROVED_TO_CONTINUE' && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setShowIssueModal(false);
                          handleOpenStrategyModal(selectedIssue);
                        }}
                        className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Adjust Production Strategy</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                isProductionStaff &&
                selectedIssue.status !== 'APPROVED_TO_CONTINUE' &&
                selectedIssue.status !== 'REJECTED_OR_SCRAPPED' && (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-xs text-indigo-900 block">Production Strategy Required</span>
                      <p className="text-[10px] text-indigo-700">
                        Adapt machine speed, swap yarn lot, or reroute loom to halt defect recurrence.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowIssueModal(false);
                        handleOpenStrategyModal(selectedIssue);
                      }}
                      className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1 shrink-0"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Change Production Strategy</span>
                    </button>
                  </div>
                )
              )}

              {/* Photographic Evidence Gallery (Fast-Loading Compressed Images) */}
              {selectedIssue.photos && selectedIssue.photos.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Camera className="w-3.5 h-3.5 text-teal-800" />
                      <span>Attached Photographic Evidence ({selectedIssue.photos.length})</span>
                    </h4>
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      ⚡ Compressed for Fast Loading
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedIssue.photos.map((p: any) => (
                      <div key={p.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs p-2">
                        <div
                          onClick={() => {
                            setPreviewPhoto(p);
                            setShowPhotoModal(true);
                          }}
                          className="h-28 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 transition relative group"
                        >
                          <img
                            src={p.thumbnailUrl || p.fileUrl}
                            alt={p.fileName}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          {p.compressionRatio && (
                            <span className="absolute bottom-1 right-1 text-[8px] bg-slate-900/80 text-teal-300 px-1 py-0.5 rounded font-mono">
                              ⚡ {p.compressionRatio}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 font-medium truncate">{p.caption || p.fileName}</p>
                        <div className="flex justify-between items-center text-[9px] text-slate-400 mt-0.5">
                          <span>{p.uploaderName}</span>
                          <a href={p.fileUrl} download={p.fileName} className="text-teal-800 hover:underline">
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Correction Notes (If Submitted by Production) */}
              {selectedIssue.correctionNotes && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <h4 className="font-bold text-amber-900 text-xs">Production Correction Log:</h4>
                  <p className="text-amber-950 font-medium">{selectedIssue.correctionNotes}</p>
                  <p className="text-[10px] text-amber-800">
                    Submitted by: <strong>{selectedIssue.correctionSubmittedBy}</strong> on{' '}
                    {selectedIssue.correctionCompletedAt ? new Date(selectedIssue.correctionCompletedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              )}

              {/* Reinspection Evaluation Details */}
              {selectedIssue.reinspectionResult && (
                <div
                  className={`p-3.5 rounded-xl border space-y-1 ${
                    selectedIssue.reinspectionResult === 'PASSED'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <h4 className="font-bold text-xs">
                    Reinspection Verdict: {selectedIssue.reinspectionResult}
                  </h4>
                  <p className="text-xs font-medium">{selectedIssue.reinspectionNotes}</p>
                  <p className="text-[10px] opacity-80">
                    Reinspected by: <strong>{selectedIssue.reinspectedBy}</strong> on{' '}
                    {selectedIssue.reinspectedAt ? new Date(selectedIssue.reinspectedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              )}

              {/* Audit History Trail */}
              {selectedIssue.statusHistory && selectedIssue.statusHistory.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Audit History & Transition Log</h4>
                  <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                    {selectedIssue.statusHistory.map((log: any) => (
                      <div key={log.id} className="text-[11px] text-slate-600">
                        <span className="font-bold text-slate-800">{log.action.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-slate-400 ml-2">{new Date(log.createdAt).toLocaleString()}</span>
                        <p className="text-slate-500 mt-0.5">{log.comments}</p>
                        <span className="text-[10px] text-slate-400">By: {log.performedBy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 10b. MODAL: PRODUCTION UNIT ACCEPTS QUALITY DOCUMENTATION */}
      {/* ======================================================== */}
      {showAcceptDocModal && acceptDocTargetIssue && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAcceptDocModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-800">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Accept Quality Management Documentation
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Issue: {acceptDocTargetIssue.issueNumber} ({acceptDocTargetIssue.batchOrRollNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAcceptDocModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAcceptDocumentation} className="space-y-4 text-xs">
              {/* QA Documentation Summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">
                    {acceptDocTargetIssue.defectCategory?.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      acceptDocTargetIssue.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {acceptDocTargetIssue.severity} SEVERITY
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">{acceptDocTargetIssue.defectDescription}</p>

                <div className="pt-2 border-t border-slate-200 text-[11px]">
                  <span className="font-semibold text-teal-800 block mb-0.5">
                    Quality Manager Instructions:
                  </span>
                  <p className="text-slate-800 font-medium bg-white p-2 rounded-lg border border-slate-200">
                    {acceptDocTargetIssue.recommendedAction}
                  </p>
                </div>
              </div>

              {/* Compressed Defect Photos Proof */}
              {acceptDocTargetIssue.photos && acceptDocTargetIssue.photos.length > 0 && (
                <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-950 text-[11px] flex items-center space-x-1">
                      <Camera className="w-3.5 h-3.5 text-teal-800" />
                      <span>Quality Manager Photo Proof ({acceptDocTargetIssue.photos.length})</span>
                    </span>
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-full">
                      ⚡ Compressed for Fast Loading
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {acceptDocTargetIssue.photos.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setPreviewPhoto(p);
                          setShowPhotoModal(true);
                        }}
                        className="h-20 bg-white rounded-lg overflow-hidden border border-teal-200 cursor-pointer hover:opacity-90 transition relative group shadow-2xs"
                      >
                        <img
                          src={p.thumbnailUrl || p.fileUrl}
                          alt={p.fileName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Operator / Shift Mechanic */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Assigned Shift Operator / Lead Mechanic <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={assignedOperator}
                  onChange={(e) => setAssignedOperator(e.target.value)}
                  placeholder="e.g. Loom Operator Rajesh / Mechanic Mohan"
                  required
                  className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-900 font-medium"
                />
              </div>

              {/* Acceptance Notes */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Production Incharge Acceptance Notes
                </label>
                <textarea
                  value={acceptanceNotes}
                  onChange={(e) => setAcceptanceNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-900"
                  placeholder="Notes on planned corrective action, machine stop, or mending start..."
                ></textarea>
              </div>

              {/* Confirmation Checkbox */}
              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="confirmDocAccept"
                  checked={acceptDocConfirmed}
                  onChange={(e) => setAcceptDocConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-sky-700 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="confirmDocAccept" className="text-[11px] text-sky-950 font-medium cursor-pointer">
                  I confirm that the Production Unit has received and inspected the defect report & photographic evidence from Quality Management, and is authorizing shop-floor corrective action.
                </label>
              </div>

              <div className="flex justify-end items-center space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAcceptDocModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={acceptingDoc || !acceptDocConfirmed}
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center space-x-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{acceptingDoc ? 'Accepting...' : 'Accept Documentation & Begin Work'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 10c. MODAL: PRODUCTION MANAGER CHANGES PRODUCTION STRATEGY */}
      {/* ======================================================== */}
      {showStrategyModal && strategyTargetIssue && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowStrategyModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center text-white shadow-xs">
                  <Zap className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                    <span>Change Production Strategy</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-900">
                      QA DIRECTIVE RESPONSE
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Defect: <strong className="text-slate-800">{strategyTargetIssue.defectCategory?.replace(/_/g, ' ')}</strong> on{' '}
                    <strong className="text-slate-800">{strategyTargetIssue.batchOrRollNumber}</strong> ({strategyTargetIssue.stage?.replace(/_/g, ' ')})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStrategyModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitStrategy} className="space-y-4 text-xs">
              {/* Reference: Defect Directives Received from Quality Manager */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Referenced QA Defect Directive</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      strategyTargetIssue.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : strategyTargetIssue.severity === 'MAJOR'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {strategyTargetIssue.severity} SEVERITY
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-semibold">QA DEFECT SUMMARY</span>
                    <p className="text-slate-800 font-medium mt-0.5">{strategyTargetIssue.defectDescription}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-teal-700 block font-semibold">CORRECTIVE DIRECTIVE</span>
                    <p className="text-slate-800 font-medium mt-0.5">{strategyTargetIssue.recommendedAction}</p>
                  </div>
                </div>

                {/* Evidence Photos Thumbnail */}
                {strategyTargetIssue.photos && strategyTargetIssue.photos.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1.5">
                      Visual Evidence Attached by Quality Manager:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {strategyTargetIssue.photos.map((p: any) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setPreviewPhoto(p);
                            setShowPhotoModal(true);
                          }}
                          className="h-14 w-20 shrink-0 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 transition relative"
                        >
                          <img
                            src={p.thumbnailUrl || p.fileUrl}
                            alt={p.fileName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Strategy Presets Bar */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5 flex items-center justify-between">
                  <span>One-Click Textile Production Strategy Presets:</span>
                  <span className="text-[10px] font-normal text-slate-400">Click to auto-populate shop-floor strategy</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STRATEGY_PRESETS.map((preset) => {
                    const isSelected = strategyType === preset.type && strategySummary === preset.summary;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyStrategyPreset(preset)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-bold text-[11px] block">{preset.label}</span>
                        <span className="text-[10px] text-slate-500 line-clamp-1 mt-1">{preset.parameters}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Strategy Type Dropdown */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Strategy Classification <span className="text-rose-600">*</span>
                </label>
                <select
                  value={strategyType}
                  onChange={(e) => setStrategyType(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-900 font-semibold"
                  required
                >
                  <option value="PARAMETER_ADJUSTMENT">⚙️ Operational Parameter & Speed/Tension Adjustment</option>
                  <option value="MACHINE_REROUTE">🛑 Machine Fleet Reroute / Maintenance Hold</option>
                  <option value="MATERIAL_SWAP">🧵 Yarn Batch / Cone Creel Swap</option>
                  <option value="TOOLING_REPLACEMENT">🔧 Reed Dent / Heald Wire / Tooling Replacement</option>
                  <option value="PROCESS_RECIPE_CHANGE">🧪 Dyehouse Recipe & Temp Modification</option>
                  <option value="OPERATOR_RETRAINING">🧑‍🏭 Operator SOP & Handling Realignment</option>
                  <option value="OTHER">⚡ Custom Textile Floor Strategy</option>
                </select>
              </div>

              {/* Operational Parameter Changes */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Specific Parameter Changes (Speed, Tension, Pressure, Temp, Lot)
                </label>
                <input
                  type="text"
                  value={parameterChanges}
                  onChange={(e) => setParameterChanges(e.target.value)}
                  placeholder="e.g. Loom Speed: 650 -> 520 RPM; Warp Tension: 36 cN -> 28 cN"
                  className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-900 font-mono text-[11px]"
                />
              </div>

              {/* Strategy Summary & Action Plan */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Strategy Summary & Action Plan <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={strategySummary}
                  onChange={(e) => setStrategySummary(e.target.value)}
                  rows={2}
                  required
                  placeholder="Describe the concrete strategy change enacted on the shop floor to prevent defect recurrence..."
                  className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-900"
                ></textarea>
              </div>

              {/* Preventive Measures & Technical Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Preventive Measures (Ongoing Controls)
                  </label>
                  <textarea
                    value={preventiveMeasures}
                    onChange={(e) => setPreventiveMeasures(e.target.value)}
                    rows={2}
                    placeholder="e.g. Inspect air-jet nozzles every 2 hours; verify yarn package moisture..."
                    className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-900"
                  ></textarea>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Assigned Floor Incharge / Operator
                  </label>
                  <input
                    type="text"
                    value={assignedOperator}
                    onChange={(e) => setAssignedOperator(e.target.value)}
                    placeholder="e.g. Loom Supervisor Shankar"
                    className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Logged By: {user?.name || 'Production Manager'}
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end items-center space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStrategyModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStrategy}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-700 to-indigo-900 hover:from-indigo-800 hover:to-indigo-950 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center space-x-1.5"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>{submittingStrategy ? 'Updating Strategy...' : 'Implement Strategy & Notify QA Lead'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 11. MODAL: PRODUCTION STAFF SUBMIT CORRECTION */}
      {/* ======================================================== */}
      {showCorrectionModal && correctionTargetIssue && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCorrectionModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Submit Production Correction Notes
                </h3>
                <p className="text-[11px] text-slate-500">
                  Issue: {correctionTargetIssue.issueNumber} ({correctionTargetIssue.batchOrRollNumber})
                </p>
              </div>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Root Cause (Identified on Shopfloor)
                </label>
                <input
                  type="text"
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="e.g. Broken reed wire / improper tension on harness..."
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Correction Actions Performed <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={correctionNotes}
                  onChange={(e) => setCorrectionNotes(e.target.value)}
                  required
                  placeholder="Detail the mending, machine maintenance, or re-processing completed..."
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800"
                  rows={3}
                ></textarea>
              </div>

              {/* Defect Photographs Uploaded by Quality Manager (Production Review Desk) */}
              {correctionTargetIssue.photos && correctionTargetIssue.photos.length > 0 && (
                <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-teal-950 font-bold text-xs">
                    <Camera className="w-3.5 h-3.5 text-teal-800" />
                    <span>Quality Manager's Defect Photographs ({correctionTargetIssue.photos.length})</span>
                  </div>
                  <p className="text-[10px] text-teal-800">
                    Review the exact defect areas captured by the Quality Manager before executing shop floor mending:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {correctionTargetIssue.photos.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setPreviewPhoto(p);
                          setShowPhotoModal(true);
                        }}
                        className="h-20 bg-white rounded-lg overflow-hidden border border-teal-200 cursor-pointer hover:opacity-90 transition relative group shadow-2xs"
                      >
                        <img src={p.fileUrl} alt={p.fileName} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end items-center space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Submit & Request QA Reinspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 12. MODAL: QA REINSPECTION & RELEASE FROM HOLD */}
      {/* ======================================================== */}
      {showReinspectModal && reinspectTargetIssue && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowReinspectModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Authorized Quality Reinspection & Clearance
                </h3>
                <p className="text-[11px] text-slate-500">
                  Issue: {reinspectTargetIssue.issueNumber} ({reinspectTargetIssue.batchOrRollNumber})
                </p>
              </div>
              <button
                onClick={() => setShowReinspectModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePerformReinspection} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Reinspection Evaluation Result
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReinspectResult('PASSED')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs ${
                      reinspectResult === 'PASSED'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Pass & Release Hold
                  </button>
                  <button
                    type="button"
                    onClick={() => setReinspectResult('FAILED')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs ${
                      reinspectResult === 'FAILED'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Fail (Keep Hold)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReinspectResult('REJECTED_OR_SCRAPPED')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs ${
                      reinspectResult === 'REJECTED_OR_SCRAPPED'
                        ? 'bg-rose-700 text-white border-rose-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Permanent Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Reinspection Evaluation Notes <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={reinspectNotes}
                  onChange={(e) => setReinspectNotes(e.target.value)}
                  required
                  placeholder="Spectrophotometer Delta-E reading verified, fabric tensile strength tested, hand feel checked..."
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800"
                  rows={3}
                ></textarea>
              </div>

              <div className="flex justify-end items-center space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReinspectModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Sign & Authorize Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 13. MODAL: PHOTO LIGHTBOX VIEWER */}
      {/* ======================================================== */}
      {showPhotoModal && previewPhoto && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPhotoModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-xs text-slate-900">{previewPhoto.fileName}</h4>
                <p className="text-[10px] text-slate-500">{previewPhoto.caption}</p>
              </div>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center">
              <img src={previewPhoto.fileUrl} alt={previewPhoto.fileName} className="max-h-[60vh] max-w-full object-contain" />
            </div>

            <div className="flex justify-between items-center text-xs pt-2">
              <span className="text-[11px] text-slate-500">Uploaded by: {previewPhoto.uploaderName || 'QA Staff'}</span>
              <a
                href={previewPhoto.fileUrl}
                download={previewPhoto.fileName}
                className="px-3 py-1.5 bg-teal-800 text-white rounded-xl font-semibold flex items-center space-x-1 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Photo</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 14. MODAL: ROLL TRACEABILITY HISTORY */}
      {/* ======================================================== */}
      {showTraceModal && traceRoll && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTraceModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-mono">Traceability History: {traceRoll.rollId}</h3>
                <p className="text-[11px] text-slate-500">Order: {traceRoll.order?.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowTraceModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-slate-700">
                <p><strong>Fabric:</strong> {traceRoll.fabricType} ({traceRoll.color})</p>
                <p><strong>Length:</strong> {traceRoll.lengthMeters} Meters | <strong>Weight:</strong> {traceRoll.weightKg || 'N/A'} KG</p>
                <p><strong>Quality Status:</strong> {traceRoll.qualityStatus} | <strong>Stock:</strong> {traceRoll.inventoryStatus}</p>
                <p><strong>Machine:</strong> {traceRoll.productionJob?.machine?.name || 'Standard Loom'}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Stage Inspections Logged ({traceRoll.inspections?.length || 0})</h4>
                <div className="space-y-2">
                  {traceRoll.inspections?.map((ins: any) => (
                    <div key={ins.id} className="p-3 border border-slate-200 rounded-xl bg-white shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{ins.result}</span>
                        <span className="text-slate-400 text-[10px]">{new Date(ins.inspectionDate).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-600 mt-1">Inspector: {ins.inspectorName}</p>
                      {ins.defectCategory && ins.defectCategory !== 'NONE' && (
                        <p className="text-rose-700 font-medium">Defect: {ins.defectCategory} - {ins.defectDescription}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* 15. MODAL: LIVE CAMERA CAPTURE (INSPECTOR DEPLOYMENT) */}
      {/* ======================================================== */}
      {showCameraModal && (
        <div
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCamera();
          }}
        >
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Live Fabric Defect Camera</h3>
                  <p className="text-[11px] text-slate-400">Capture visual proof (e.g. Hole in Fabric) for Production Unit</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCamera}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error state if permission denied */}
            {cameraError ? (
              <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl text-rose-200 text-xs space-y-2 text-center">
                <AlertOctagon className="w-8 h-8 mx-auto text-rose-400" />
                <p className="font-semibold">{cameraError}</p>
                <div className="flex justify-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => openCamera(cameraFacing)}
                    className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold"
                  >
                    Retry Permission
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeCamera();
                      fileInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs"
                  >
                    Use File Upload Instead
                  </button>
                </div>
              </div>
            ) : capturedSnapshot ? (
              /* Still Snapshot Review */
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-slate-700">
                  <img src={capturedSnapshot} alt="Captured Defect" className="w-full h-full object-contain" />
                  <div className="absolute top-3 left-3 bg-teal-900/80 backdrop-blur-xs text-teal-200 px-2.5 py-1 rounded-full text-[10px] font-bold border border-teal-700">
                    Defect Photo Captured
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Photo Caption & Defect Tag
                  </label>
                  <input
                    type="text"
                    value={cameraCaption}
                    onChange={(e) => setCameraCaption(e.target.value)}
                    placeholder="e.g. Hole in fabric roll at 84m selvedge - Weaving table"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={saveCapturedPhoto}
                    disabled={uploadingPhoto}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-lg shadow-teal-900/40"
                  >
                    <Check className="w-4 h-4" />
                    <span>{uploadingPhoto ? 'Attaching...' : 'Attach & Notify Production Unit'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Live Viewfinder Stream */
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-slate-700 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Viewfinder Target Framing Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-40 border-2 border-teal-400/80 rounded-2xl border-dashed relative">
                      <div className="absolute -top-6 left-0 right-0 text-center text-[10px] text-teal-300 font-bold bg-black/70 px-2 py-0.5 rounded-full mx-auto w-max backdrop-blur-xs">
                        Target Defect (Hole / Tear)
                      </div>
                      {/* Crosshairs */}
                      <div className="absolute top-1/2 left-0 w-2 h-0.5 bg-teal-400"></div>
                      <div className="absolute top-1/2 right-0 w-2 h-0.5 bg-teal-400"></div>
                      <div className="absolute top-0 left-1/2 w-0.5 h-2 bg-teal-400"></div>
                      <div className="absolute bottom-0 left-1/2 w-0.5 h-2 bg-teal-400"></div>
                    </div>
                  </div>

                  {/* Shutter flash animation */}
                  {isShutterActive && (
                    <div className="absolute inset-0 bg-white opacity-80 pointer-events-none transition"></div>
                  )}

                  {/* Camera Switch button */}
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    title="Switch Camera (Front / Rear)"
                    className="absolute top-3 right-3 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full backdrop-blur-xs border border-slate-700 transition"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] text-slate-400">
                    Aim camera at fabric flaw and click Snap Photo
                  </span>
                  <button
                    type="button"
                    onClick={snapPhoto}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-bold flex items-center space-x-2 transition shadow-lg shadow-teal-900/40"
                  >
                    <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
                    <span>Snap Photo</span>
                  </button>
                </div>
              </div>
            )}

            {/* Hidden canvas for capturing bitmap */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityPage;
