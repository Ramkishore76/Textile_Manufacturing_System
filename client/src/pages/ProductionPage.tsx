import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Cpu,
  Plus,
  Play,
  CheckCircle,
  Clock,
  Layers,
  AlertTriangle,
  Wrench,
  X,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const ProductionPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toast = useToast();

  // New Job Modal
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobOrderId, setJobOrderId] = useState('');
  const [jobOrderItemId, setJobOrderItemId] = useState('');
  const [jobStage, setJobStage] = useState<'SPINNING' | 'WEAVING' | 'DYEING'>('WEAVING');
  const [jobMachineId, setJobMachineId] = useState('');
  const [jobShiftId, setJobShiftId] = useState('');
  const [jobEmpId, setJobEmpId] = useState('');
  const [plannedQty, setPlannedQty] = useState(1000);

  // Operator Log Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeJobId, setActiveJobId] = useState('');
  const [logQty, setLogQty] = useState(500);
  const [logWastage, setLogWastage] = useState(10);
  const [logDowntime, setLogDowntime] = useState(0);
  const [logDowntimeReason, setLogDowntimeReason] = useState('');
  const [logNotes, setLogNotes] = useState('');

  // Generate Rolls Modal
  const [showRollModal, setShowRollModal] = useState(false);
  const [rollCount, setRollCount] = useState(2);
  const [rollMeters, setRollMeters] = useState(500);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsRes, machinesRes, ordersRes, shiftsRes, empsRes] = await Promise.all([
        api.get<any[]>('/production/jobs'),
        api.get<any[]>('/machines'),
        api.get<any[]>('/orders'),
        api.get<any[]>('/machines/shifts'),
        api.get<any[]>('/employees'),
      ]);
      setJobs(jobsRes);
      setMachines(machinesRes);
      setOrders(ordersRes);
      setShifts(shiftsRes);
      setEmployees(empsRes);

      if (ordersRes.length > 0) {
        setJobOrderId(ordersRes[0].id);
        if (ordersRes[0].items?.length > 0) {
          setJobOrderItemId(ordersRes[0].items[0].id);
        }
      }
      if (machinesRes.length > 0) {
        const idleMachine = machinesRes.find((m) => m.status === 'IDLE') || machinesRes[0];
        setJobMachineId(idleMachine.id);
      }
      if (shiftsRes.length > 0) setJobShiftId(shiftsRes[0].id);
      if (empsRes.length > 0) setJobEmpId(empsRes[0].id);
    } catch (err) {
      console.error('Failed to load production data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const oId = e.target.value;
    setJobOrderId(oId);
    const ord = orders.find((o) => o.id === oId);
    if (ord && ord.items?.length > 0) {
      setJobOrderItemId(ord.items[0].id);
      setPlannedQty(ord.items[0].requiredQuantity || 1000);
    }
  };

  const handleScheduleJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/production/jobs', {
        orderId: jobOrderId,
        orderItemId: jobOrderItemId,
        stage: jobStage,
        machineId: jobMachineId,
        shiftId: jobShiftId,
        assignedEmployeeId: jobEmpId,
        plannedQuantity: Number(plannedQty),
      });
      setShowJobModal(false);
      toast.success('Production job scheduled successfully!');
      setBanner({ message: 'Production job scheduled successfully!', type: 'success' });
      await loadData();
    } catch (err: any) {
      toast.error('Error scheduling job: ' + err.message);
      setBanner({ message: 'Error scheduling job: ' + err.message, type: 'error' });
    }
  };

  const handleStartJob = async (jobId: string) => {
    try {
      await api.post(`/production/jobs/${jobId}/start`, {});
      toast.success('Job started! Machine status updated to RUNNING.');
      setBanner({ message: 'Job started! Machine status updated to RUNNING.', type: 'success' });
      await loadData();
    } catch (err: any) {
      toast.error('Error starting job: ' + err.message);
      setBanner({ message: 'Error starting job: ' + err.message, type: 'error' });
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    try {
      await api.post(`/production/jobs/${jobId}/complete`, {});
      toast.success('Job finished! Status set to COMPLETED.');
      setBanner({ message: 'Job finished! Status set to COMPLETED. You can now generate fabric rolls.', type: 'success' });
      await loadData();
    } catch (err: any) {
      toast.error('Error completing job: ' + err.message);
      setBanner({ message: 'Error completing job: ' + err.message, type: 'error' });
    }
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/production/jobs/${activeJobId}/log`, {
        quantityProduced: Number(logQty),
        producedQuantity: Number(logQty),
        wastageQuantity: Number(logWastage),
        downtimeDurationMinutes: Number(logDowntime),
        downtimeMinutes: Number(logDowntime),
        downtimeReason: logDowntimeReason || undefined,
        notes: logNotes || undefined,
      });
      setShowLogModal(false);
      setLogDowntimeReason('');
      setLogNotes('');
      toast.success('Shift output log saved successfully!');
      setBanner({ message: 'Shift output log saved successfully!', type: 'success' });
      await loadData();
    } catch (err: any) {
      toast.error('Error recording log: ' + err.message);
      setBanner({ message: 'Error recording log: ' + err.message, type: 'error' });
    }
  };

  const handleGenerateRolls = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rollsArray = Array.from({ length: rollCount }, () => ({
        lengthMeters: Number(rollMeters),
      }));

      await api.post(`/production/jobs/${activeJobId}/generate-rolls`, {
        rolls: rollsArray,
      });
      setShowRollModal(false);
      toast.success(`Successfully generated ${rollCount} unique roll IDs for quality inspection!`);
      setBanner({ message: `Successfully generated ${rollCount} unique roll IDs for quality inspection!`, type: 'success' });
      await loadData();
    } catch (err: any) {
      toast.error('Error generating rolls: ' + err.message);
      setBanner({ message: 'Error generating rolls: ' + err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Production Scheduling & Monitoring</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Stage-wise production jobs (Spinning, Weaving, Dyeing) and live operator outputs.
          </p>
        </div>
        <button
          onClick={() => setShowJobModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Production Job</span>
        </button>
      </div>

      {/* In-page Notification Banner */}
      {banner && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in transition-all ${
            banner.type === 'success'
              ? 'bg-emerald-50/90 border-emerald-200/80 text-emerald-900'
              : 'bg-rose-50/90 border-rose-200/80 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{banner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Machine Fleet Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {machines.map((m) => (
          <div
            key={m.id}
            className="p-3.5 rounded-2xl border border-zinc-200/80 bg-white text-xs hover:border-zinc-300 transition-colors shadow-xs"
          >
            <div className="flex justify-between items-start mb-1.5">
              <span className="font-bold text-zinc-900 text-[11px] truncate">{m.code}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  m.status === 'RUNNING'
                    ? 'bg-emerald-500'
                    : m.status === 'MAINTENANCE'
                    ? 'bg-amber-500'
                    : m.status === 'BREAKDOWN'
                    ? 'bg-rose-500'
                    : 'bg-zinc-300'
                }`}
              ></span>
            </div>
            <p className="text-[11px] truncate text-zinc-500">{m.name}</p>
            <span
              className={`mt-2.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                m.status === 'RUNNING'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                  : m.status === 'MAINTENANCE'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                  : m.status === 'BREAKDOWN'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/70'
                  : 'bg-zinc-100 text-zinc-600 border border-zinc-200/80'
              }`}
            >
              {m.status}
            </span>
          </div>
        ))}
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-zinc-50/80 border-b border-zinc-200/80 flex justify-between items-center text-xs font-semibold text-zinc-700">
          <span>Production Jobs Queue ({jobs.length})</span>
          <span className="text-[11px] text-zinc-500 font-normal">Stages: Spinning → Weaving → Dyeing</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/40 border-b border-zinc-200/80 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Job #</th>
                <th className="py-3 px-4">Order / Buyer</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Machine Assigned</th>
                <th className="py-3 px-4">Planned vs Actual</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Job Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-zinc-900">{job.jobNumber}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-zinc-800 block">{job.order?.orderNumber}</span>
                    <span className="text-[10px] text-zinc-400 block">{job.order?.buyer?.companyName}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                      {job.stage}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-800 font-medium">
                    {job.machine?.code} - {job.machine?.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-zinc-900">{job.actualQuantity}</span>
                    <span className="text-zinc-400"> / {job.plannedQuantity} M</span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-500">{job.assignedEmployee?.name || 'Unassigned'}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        job.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                          : job.status === 'IN_PROGRESS'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/70'
                          : 'bg-zinc-100 text-zinc-700 border border-zinc-200/80'
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    {job.status === 'PLANNED' && (
                      <button
                        onClick={() => handleStartJob(job.id)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition inline-flex items-center space-x-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>Start</span>
                      </button>
                    )}

                    {job.status === 'IN_PROGRESS' && (
                      <>
                        <button
                          onClick={() => {
                            setActiveJobId(job.id);
                            setShowLogModal(true);
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-semibold transition"
                        >
                          + Log Output
                        </button>
                        <button
                          onClick={() => handleCompleteJob(job.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition inline-flex items-center space-x-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Finish</span>
                        </button>
                      </>
                    )}

                    {job.status === 'COMPLETED' && (
                      <button
                        onClick={() => {
                          setActiveJobId(job.id);
                          setShowRollModal(true);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition inline-flex items-center space-x-1"
                      >
                        <Layers className="w-3 h-3" />
                        <span>Gen Rolls</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCHEDULE JOB MODAL */}
      {showJobModal && (
        <div
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowJobModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3.5 border-b border-zinc-100 mb-4">
              <h3 className="font-bold text-sm text-zinc-900">Schedule Production Job</h3>
              <button
                onClick={() => setShowJobModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleJob} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 block mb-1.5">Target Order</label>
                <select
                  value={jobOrderId}
                  onChange={handleOrderChange}
                  className="w-full border border-zinc-200 p-2.5 rounded-xl bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.buyer?.companyName} ({o.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1.5">Production Stage</label>
                  <select
                    value={jobStage}
                    onChange={(e) => setJobStage(e.target.value as any)}
                    className="w-full border border-zinc-200 p-2.5 rounded-xl bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  >
                    <option value="SPINNING">Spinning</option>
                    <option value="WEAVING">Weaving</option>
                    <option value="DYEING">Dyeing</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1.5">Machine Assignment</label>
                  <select
                    value={jobMachineId}
                    onChange={(e) => setJobMachineId(e.target.value)}
                    className="w-full border border-zinc-200 p-2.5 rounded-xl bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  >
                    {machines.map((m) => (
                      <option
                        key={m.id}
                        value={m.id}
                        disabled={m.status === 'MAINTENANCE' || m.status === 'BREAKDOWN'}
                      >
                        {m.code} ({m.name}) [{m.status}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1.5">Shift</label>
                  <select
                    value={jobShiftId}
                    onChange={(e) => setJobShiftId(e.target.value)}
                    className="w-full border border-zinc-200 p-2.5 rounded-xl bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1.5">Assigned Worker</label>
                  <select
                    value={jobEmpId}
                    onChange={(e) => setJobEmpId(e.target.value)}
                    className="w-full border border-zinc-200 p-2.5 rounded-xl bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 block mb-1.5">Planned Target Quantity (Meters / KG)</label>
                <input
                  type="number"
                  value={plannedQty}
                  onChange={(e) => setPlannedQty(Number(e.target.value))}
                  min={50}
                  required
                  className="w-full border border-zinc-200 p-2.5 rounded-xl bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OPERATOR LOG MODAL */}
      {showLogModal && (
        <div
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLogModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3.5 border-b border-zinc-100 mb-4">
              <h3 className="font-bold text-sm text-zinc-900">Record Shift Output & Downtime</h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1.5">Produced Qty (Meters)</label>
                  <input
                    type="number"
                    value={logQty}
                    onChange={(e) => setLogQty(Number(e.target.value))}
                    min={0}
                    required
                    className="w-full border border-zinc-200 p-2.5 rounded-xl bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1.5">Wastage (Meters)</label>
                  <input
                    type="number"
                    value={logWastage}
                    onChange={(e) => setLogWastage(Number(e.target.value))}
                    min={0}
                    className="w-full border border-zinc-200 p-2.5 rounded-xl bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1.5">Downtime (Minutes)</label>
                  <input
                    type="number"
                    value={logDowntime}
                    onChange={(e) => setLogDowntime(Number(e.target.value))}
                    min={0}
                    className="w-full border border-zinc-200 p-2.5 rounded-xl bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1.5">Downtime Reason</label>
                  <input
                    type="text"
                    value={logDowntimeReason}
                    onChange={(e) => setLogDowntimeReason(e.target.value)}
                    placeholder="Warp break, power flicker..."
                    className="w-full border border-zinc-200 p-2.5 rounded-xl bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 block mb-1.5">Operator Notes</label>
                <input
                  type="text"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Loom speed steady, tension verified..."
                  className="w-full border border-zinc-200 p-2.5 rounded-xl bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition"
                >
                  Save Shift Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE ROLLS MODAL */}
      {showRollModal && (
        <div
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRollModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3.5 border-b border-zinc-100 mb-4">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Generate Unique Roll IDs</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRollModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateRolls} className="space-y-3.5 text-xs">
              <p className="text-zinc-500 text-[11px]">
                Produces unique, non-reusable roll IDs (e.g. ROLL-2026-XXXX) linked to this order for quality inspection.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1.5">Number of Rolls</label>
                  <input
                    type="number"
                    value={rollCount}
                    onChange={(e) => setRollCount(Number(e.target.value))}
                    min={1}
                    max={20}
                    required
                    className="w-full border border-zinc-200 p-2.5 rounded-xl bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1.5">Meters per Roll</label>
                  <input
                    type="number"
                    value={rollMeters}
                    onChange={(e) => setRollMeters(Number(e.target.value))}
                    min={50}
                    required
                    className="w-full border border-zinc-200 p-2.5 rounded-xl bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowRollModal(false)}
                  className="px-4 py-2 border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition"
                >
                  Generate Unique Rolls
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
