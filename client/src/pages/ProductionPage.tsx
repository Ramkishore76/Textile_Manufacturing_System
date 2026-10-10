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
} from 'lucide-react';

export const ProductionPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        shiftId: jobShiftId || undefined,
        assignedEmployeeId: jobEmpId || undefined,
        plannedQuantity: Number(plannedQty),
      });
      setShowJobModal(false);
      await loadData();
    } catch (err: any) {
      alert('Scheduling error: ' + err.message);
    }
  };

  const handleStartJob = async (id: string) => {
    try {
      await api.put(`/production/jobs/${id}/start`, {});
      await loadData();
    } catch (err: any) {
      alert('Error starting job: ' + err.message);
    }
  };

  const handleCompleteJob = async (id: string) => {
    try {
      await api.put(`/production/jobs/${id}/complete`, {});
      await loadData();
    } catch (err: any) {
      alert('Error completing job: ' + err.message);
    }
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/production/jobs/${activeJobId}/logs`, {
        quantityProduced: Number(logQty),
        wastageQuantity: Number(logWastage),
        downtimeDurationMinutes: Number(logDowntime),
        downtimeReason: logDowntimeReason || undefined,
        notes: logNotes || undefined,
      });
      setShowLogModal(false);
      await loadData();
    } catch (err: any) {
      alert('Error recording production log: ' + err.message);
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
      alert(`Successfully generated ${rollCount} unique roll IDs for quality inspection!`);
      await loadData();
    } catch (err: any) {
      alert('Error generating rolls: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Production Scheduling & Monitoring</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage stage-wise production jobs (Spinning, Weaving, Dyeing) and track operator outputs.
          </p>
        </div>
        <button
          onClick={() => setShowJobModal(true)}
          className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Production Job</span>
        </button>
      </div>

      {/* Machine Fleet Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {machines.map((m) => (
          <div
            key={m.id}
            className={`p-3 rounded-xl border text-xs transition ${
              m.status === 'RUNNING'
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                : m.status === 'MAINTENANCE'
                ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                : m.status === 'BREAKDOWN'
                ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-[11px] truncate">{m.code}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  m.status === 'RUNNING'
                    ? 'bg-emerald-500 animate-pulse'
                    : m.status === 'MAINTENANCE'
                    ? 'bg-amber-500'
                    : m.status === 'BREAKDOWN'
                    ? 'bg-rose-500'
                    : 'bg-slate-400'
                }`}
              ></span>
            </div>
            <p className="font-medium text-[11px] truncate text-slate-600">{m.name}</p>
            <span
              className={`mt-2 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                m.status === 'RUNNING'
                  ? 'bg-emerald-600 text-white'
                  : m.status === 'MAINTENANCE'
                  ? 'bg-amber-600 text-white'
                  : m.status === 'BREAKDOWN'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {m.status}
            </span>
          </div>
        ))}
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
          <span>Production Jobs Queue ({jobs.length})</span>
          <span className="text-[11px] text-slate-500 font-normal">Stages: Spinning → Weaving → Dyeing</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
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
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50/70 transition">
                <td className="py-3.5 px-4 font-bold text-slate-900">{job.jobNumber}</td>
                <td className="py-3.5 px-4">
                  <span className="font-bold text-slate-800 block">{job.order?.orderNumber}</span>
                  <span className="text-[10px] text-slate-400 block">{job.order?.buyer?.companyName}</span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {job.stage}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-800">
                  {job.machine?.code} - {job.machine?.name}
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-bold text-slate-900">{job.actualQuantity}</span>
                  <span className="text-slate-400"> / {job.plannedQuantity}</span>
                </td>
                <td className="py-3.5 px-4 text-slate-600">{job.assignedEmployee?.name || 'Unassigned'}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      job.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : job.status === 'IN_PROGRESS'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {job.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right space-x-1.5">
                  {job.status === 'PLANNED' && (
                    <button
                      onClick={() => handleStartJob(job.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold inline-flex items-center space-x-1"
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
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                      >
                        + Log Output
                      </button>
                      <button
                        onClick={() => handleCompleteJob(job.id)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold inline-flex items-center space-x-1"
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
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold inline-flex items-center space-x-1"
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

      {/* SCHEDULE JOB MODAL */}
      {showJobModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Schedule Production Job</h3>
              <button onClick={() => setShowJobModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleJob} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Target Order</label>
                <select
                  value={jobOrderId}
                  onChange={handleOrderChange}
                  className="w-full border p-2 rounded-lg bg-white"
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
                  <label className="font-semibold block mb-1">Production Stage</label>
                  <select
                    value={jobStage}
                    onChange={(e) => setJobStage(e.target.value as any)}
                    className="w-full border p-2 rounded-lg bg-white"
                  >
                    <option value="SPINNING">Spinning</option>
                    <option value="WEAVING">Weaving</option>
                    <option value="DYEING">Dyeing</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Machine Assignment</label>
                  <select
                    value={jobMachineId}
                    onChange={(e) => setJobMachineId(e.target.value)}
                    className="w-full border p-2 rounded-lg bg-white"
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
                  <label className="font-semibold block mb-1">Shift</label>
                  <select
                    value={jobShiftId}
                    onChange={(e) => setJobShiftId(e.target.value)}
                    className="w-full border p-2 rounded-lg bg-white"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Assigned Worker</label>
                  <select
                    value={jobEmpId}
                    onChange={(e) => setJobEmpId(e.target.value)}
                    className="w-full border p-2 rounded-lg bg-white"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Planned Target Quantity (Meters / KG)</label>
                <input
                  type="number"
                  value={plannedQty}
                  onChange={(e) => setPlannedQty(Number(e.target.value))}
                  min={50}
                  required
                  className="w-full border p-2 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowJobModal(false)} className="px-3 py-1.5 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700">
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OPERATOR LOG MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Record Shift Output & Downtime</h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Produced Qty (Meters)</label>
                  <input
                    type="number"
                    value={logQty}
                    onChange={(e) => setLogQty(Number(e.target.value))}
                    min={0}
                    required
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Wastage (Meters)</label>
                  <input
                    type="number"
                    value={logWastage}
                    onChange={(e) => setLogWastage(Number(e.target.value))}
                    min={0}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Downtime (Minutes)</label>
                  <input
                    type="number"
                    value={logDowntime}
                    onChange={(e) => setLogDowntime(Number(e.target.value))}
                    min={0}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Downtime Reason</label>
                  <input
                    type="text"
                    value={logDowntimeReason}
                    onChange={(e) => setLogDowntimeReason(e.target.value)}
                    placeholder="Warp break, power flicker..."
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Operator Notes</label>
                <input
                  type="text"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Loom speed steady, tension verified..."
                  className="w-full border p-2 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowLogModal(false)} className="px-3 py-1.5 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700">
                  Save Shift Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE ROLLS MODAL */}
      {showRollModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Generate Unique Roll IDs</span>
              </h3>
              <button onClick={() => setShowRollModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateRolls} className="space-y-3 text-xs">
              <p className="text-slate-500 text-[11px]">
                Produces unique, non-reusable roll IDs (e.g. ROLL-2026-XXXX) linked to this order for quality inspection.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Number of Rolls</label>
                  <input
                    type="number"
                    value={rollCount}
                    onChange={(e) => setRollCount(Number(e.target.value))}
                    min={1}
                    max={20}
                    required
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Meters per Roll</label>
                  <input
                    type="number"
                    value={rollMeters}
                    onChange={(e) => setRollMeters(Number(e.target.value))}
                    min={50}
                    required
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowRollModal(false)} className="px-3 py-1.5 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">
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
