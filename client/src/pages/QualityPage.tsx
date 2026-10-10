import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  History,
  X,
  FileText,
} from 'lucide-react';

export const QualityPage: React.FC = () => {
  const [pendingRolls, setPendingRolls] = useState<any[]>([]);
  const [defectsSummary, setDefectsSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Inspect Modal
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [selectedRoll, setSelectedRoll] = useState<any>(null);
  const [inspectionResult, setInspectionResult] = useState<'PASSED' | 'REWORK_REQUIRED' | 'REJECTED'>('PASSED');
  const [defectCategory, setDefectCategory] = useState('NONE');
  const [defectDesc, setDefectDesc] = useState('');
  const [defectiveQty, setDefectiveQty] = useState(0);
  const [reworkStage, setReworkStage] = useState('FINISHING');
  const [remarks, setRemarks] = useState('');

  // Traceability Modal
  const [traceRoll, setTraceRoll] = useState<any>(null);
  const [showTraceModal, setShowTraceModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingRes, summaryRes] = await Promise.all([
        api.get<any[]>('/quality/pending'),
        api.get<any>('/quality/defects-summary'),
      ]);
      setPendingRolls(pendingRes);
      setDefectsSummary(summaryRes);
    } catch (err) {
      console.error('Failed to load quality data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenInspect = (roll: any) => {
    setSelectedRoll(roll);
    setInspectionResult('PASSED');
    setDefectCategory('NONE');
    setDefectDesc('');
    setDefectiveQty(0);
    setRemarks('');
    setShowInspectModal(true);
  };

  const handleOpenTrace = async (rollId: string) => {
    try {
      const data = await api.get<any>(`/quality/history/${rollId}`);
      setTraceRoll(data);
      setShowTraceModal(true);
    } catch (err: any) {
      alert('Error fetching roll traceability: ' + err.message);
    }
  };

  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/quality/inspect', {
        rollId: selectedRoll.id,
        result: inspectionResult,
        defectCategory,
        defectDescription: defectDesc || undefined,
        defectiveQuantity: Number(defectiveQty),
        reworkStage: inspectionResult === 'REWORK_REQUIRED' ? reworkStage : undefined,
        remarks: remarks || undefined,
      });

      setShowInspectModal(false);
      alert(`Inspection saved: Roll ${selectedRoll.rollId} marked as ${inspectionResult}!`);
      await loadData();
    } catch (err: any) {
      alert('Error saving inspection: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Quality Inspection & Roll Traceability</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Roll fabric inspection, 4-point defect classification, and finished goods clearance.
        </p>
      </div>

      {/* Defect Trends Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <span className="text-xs text-zinc-500 font-medium">Total Inspected</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 mt-1.5">{defectsSummary?.totalInspected || 0}</p>
          <span className="inline-flex items-center px-2 py-0.5 mt-2 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            {defectsSummary?.passPercentage || 100}% Pass Rate
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <span className="text-xs text-zinc-500 font-medium">Pending Inspection</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 mt-1.5">{pendingRolls.length}</p>
          <span className="inline-flex items-center px-2 py-0.5 mt-2 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200/80">
            Awaiting clearance
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <span className="text-xs text-zinc-500 font-medium">Rework Assigned</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 mt-1.5">{defectsSummary?.reworkCount || 0}</p>
          <span className="inline-flex items-center px-2 py-0.5 mt-2 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/70">
            In re-processing
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <span className="text-xs text-zinc-500 font-medium">Scrapped / Rejected</span>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 mt-1.5">{defectsSummary?.rejectedCount || 0}</p>
          <span className="inline-flex items-center px-2 py-0.5 mt-2 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/70">
            Blocked from stock
          </span>
        </div>
      </div>

      {/* Pending Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-zinc-50/80 border-b border-zinc-200/80 flex justify-between items-center text-xs font-semibold text-zinc-700">
          <span>Rolls Requiring Inspection / Re-evaluation ({pendingRolls.length})</span>
          <span className="text-[11px] text-zinc-500 font-normal">Passed rolls automatically enter finished goods stock</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/40 border-b border-zinc-200/80 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Roll ID</th>
                <th className="py-3 px-4">Order / Buyer</th>
                <th className="py-3 px-4">Fabric Spec</th>
                <th className="py-3 px-4">Roll Length</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Past Inspections</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {pendingRolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 font-medium">
                    All rolls have been inspected! No pending inspections right now.
                  </td>
                </tr>
              ) : (
                pendingRolls.map((roll) => (
                  <tr key={roll.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900">{roll.rollId}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-zinc-800 block">{roll.order?.orderNumber}</span>
                      <span className="text-[10px] text-zinc-400 block">{roll.order?.buyer?.companyName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-700">{roll.fabricType} ({roll.color})</td>
                    <td className="py-3.5 px-4 font-bold text-zinc-900">{roll.lengthMeters} Meters</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          roll.qualityStatus === 'REWORK_REQUIRED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                            : 'bg-blue-50 text-blue-700 border border-blue-200/70'
                        }`}
                      >
                        {roll.qualityStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500">
                      {roll.inspections?.length || 0} inspection(s) logged
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenTrace(roll.id)}
                        className="px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition shadow-xs"
                      >
                        <History className="w-3.5 h-3.5 text-zinc-500" />
                        <span>History</span>
                      </button>
                      <button
                        onClick={() => handleOpenInspect(roll)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECTION MODAL */}
      {showInspectModal && selectedRoll && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3.5 border-b border-zinc-100 mb-4">
              <div>
                <h3 className="font-bold text-sm text-zinc-900">Inspect Roll: {selectedRoll.rollId}</h3>
                <p className="text-[11px] text-zinc-500">{selectedRoll.fabricType} - {selectedRoll.lengthMeters} Meters</p>
              </div>
              <button
                onClick={() => setShowInspectModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitInspection} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 block mb-1.5">Quality Inspection Result</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectionResult('PASSED')}
                    className={`p-2.5 rounded-xl border text-center transition font-semibold text-xs ${
                      inspectionResult === 'PASSED'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    Pass (Stock)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectionResult('REWORK_REQUIRED')}
                    className={`p-2.5 rounded-xl border text-center transition font-semibold text-xs ${
                      inspectionResult === 'REWORK_REQUIRED'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    Rework
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectionResult('REJECTED')}
                    className={`p-2.5 rounded-xl border text-center transition font-semibold text-xs ${
                      inspectionResult === 'REJECTED'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              {inspectionResult !== 'PASSED' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1.5">Defect Category</label>
                      <select
                        value={defectCategory}
                        onChange={(e) => setDefectCategory(e.target.value)}
                        className="w-full border border-zinc-200 p-2.5 rounded-xl bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                      >
                        <option value="HOLES">Holes</option>
                        <option value="COLOR_MISMATCH">Color Mismatch</option>
                        <option value="UNEVEN_WEAVING">Uneven Weaving</option>
                        <option value="STAINS">Stains / Oil Spots</option>
                        <option value="OTHER">Other Defect</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1.5">Defective Qty (Meters)</label>
                      <input
                        type="number"
                        value={defectiveQty}
                        onChange={(e) => setDefectiveQty(Number(e.target.value))}
                        min={0}
                        className="w-full border border-zinc-200 p-2.5 rounded-xl text-zinc-800 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  {inspectionResult === 'REWORK_REQUIRED' && (
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1.5">Rework Department</label>
                      <select
                        value={reworkStage}
                        onChange={(e) => setReworkStage(e.target.value)}
                        className="w-full border border-zinc-200 p-2.5 rounded-xl bg-zinc-50/50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                      >
                        <option value="DYEING">Dye House (Re-dye / Strip)</option>
                        <option value="FINISHING">Finishing (Stenter / Washing)</option>
                        <option value="RE_WEAVING">Mending / Re-weaving</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="font-semibold text-zinc-700 block mb-1.5">Defect Description</label>
                    <input
                      type="text"
                      value={defectDesc}
                      onChange={(e) => setDefectDesc(e.target.value)}
                      placeholder="e.g. Warp slack detected at 120m mark..."
                      className="w-full border border-zinc-200 p-2.5 rounded-xl text-zinc-800 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="font-semibold text-zinc-700 block mb-1.5">Inspector Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Surface visual inspection verified, GSM checked..."
                  className="w-full border border-zinc-200 p-2.5 rounded-xl text-zinc-800 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  rows={2}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInspectModal(false)}
                  className="px-4 py-2 border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
                >
                  Submit Inspection Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRACEABILITY MODAL */}
      {showTraceModal && traceRoll && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-zinc-200 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3.5 border-b border-zinc-100 mb-4">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 font-mono">Traceability: {traceRoll.rollId}</h3>
                <p className="text-[11px] text-zinc-500">Order: {traceRoll.order?.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowTraceModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1.5 text-zinc-700">
                <p><strong>Fabric:</strong> {traceRoll.fabricType} ({traceRoll.color})</p>
                <p><strong>Length:</strong> {traceRoll.lengthMeters} Meters | <strong>Weight:</strong> {traceRoll.weightKg || 'N/A'} KG</p>
                <p><strong>Machine:</strong> {traceRoll.productionJob?.machine?.name} ({traceRoll.productionJob?.machine?.code})</p>
                <p><strong>Shift / Worker:</strong> {traceRoll.productionJob?.assignedEmployee?.name || 'Standard operator'}</p>
                <p><strong>Location:</strong> {traceRoll.location?.locationCode || 'In Processing'}</p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 mb-2">Inspection History ({traceRoll.inspections?.length})</h4>
                <div className="space-y-2">
                  {traceRoll.inspections?.map((ins: any) => (
                    <div key={ins.id} className="p-3 border border-zinc-200/80 rounded-xl bg-white shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-zinc-900">{ins.result}</span>
                        <span className="text-zinc-400 text-[10px]">
                          {new Date(ins.inspectionDate).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-zinc-600 mt-1">Inspector: {ins.inspectorName}</p>
                      {ins.defectCategory !== 'NONE' && (
                        <p className="text-rose-700 mt-0.5 font-medium">Defect: {ins.defectCategory} - {ins.defectDescription}</p>
                      )}
                      {ins.remarks && <p className="text-zinc-500 italic mt-0.5">"{ins.remarks}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
