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
        <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">Quality Inspection & Roll Traceability</h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Roll fabric inspection, 4-point defect classification, and finished goods clearance.
        </p>
      </div>

      {/* Defect Trends Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-neutral-200/80">
          <span className="text-xs text-neutral-500 font-medium">Total Inspected</span>
          <p className="text-2xl font-semibold text-neutral-900 mt-1">{defectsSummary?.totalInspected || 0}</p>
          <span className="text-[11px] text-emerald-700 font-medium">{defectsSummary?.passPercentage || 100}% Pass Rate</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-neutral-200/80">
          <span className="text-xs text-neutral-500 font-medium">Pending Inspection</span>
          <p className="text-2xl font-semibold text-neutral-900 mt-1">{pendingRolls.length}</p>
          <span className="text-[11px] text-neutral-500">Awaiting clearance</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-neutral-200/80">
          <span className="text-xs text-neutral-500 font-medium">Rework Assigned</span>
          <p className="text-2xl font-semibold text-neutral-900 mt-1">{defectsSummary?.reworkCount || 0}</p>
          <span className="text-[11px] text-amber-700 font-medium">In re-processing</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-neutral-200/80">
          <span className="text-xs text-neutral-500 font-medium">Scrapped / Rejected</span>
          <p className="text-2xl font-semibold text-neutral-900 mt-1">{defectsSummary?.rejectedCount || 0}</p>
          <span className="text-[11px] text-rose-700 font-medium">Blocked from stock</span>
        </div>
      </div>

      {/* Pending Table */}
      <div className="bg-white rounded-lg border border-neutral-200/80 overflow-hidden">
        <div className="p-3 bg-neutral-50/60 border-b border-neutral-200/80 flex justify-between items-center text-xs font-medium text-neutral-700">
          <span>Rolls Requiring Inspection / Re-evaluation ({pendingRolls.length})</span>
          <span className="text-[11px] text-neutral-500 font-normal">Passed rolls automatically enter finished goods stock</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-neutral-50/40 border-b border-neutral-200/80 text-neutral-500 font-medium text-[11px]">
              <th className="py-2.5 px-4">Roll ID</th>
              <th className="py-2.5 px-4">Order / Buyer</th>
              <th className="py-2.5 px-4">Fabric Spec</th>
              <th className="py-2.5 px-4">Roll Length</th>
              <th className="py-2.5 px-4">Current Status</th>
              <th className="py-2.5 px-4">Past Inspections</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {pendingRolls.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-neutral-400">
                  All rolls have been inspected! No pending inspections right now.
                </td>
              </tr>
            ) : (
              pendingRolls.map((roll) => (
                <tr key={roll.id} className="hover:bg-neutral-50/60 transition">
                  <td className="py-3 px-4 font-mono font-medium text-neutral-900">{roll.rollId}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-neutral-800 block">{roll.order?.orderNumber}</span>
                    <span className="text-[10px] text-neutral-400 block">{roll.order?.buyer?.companyName}</span>
                  </td>
                  <td className="py-3 px-4 text-neutral-700">{roll.fabricType} ({roll.color})</td>
                  <td className="py-3 px-4 font-semibold text-neutral-900">{roll.lengthMeters} Meters</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        roll.qualityStatus === 'REWORK_REQUIRED'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                          : 'bg-blue-50 text-blue-800 border border-blue-200/60'
                      }`}
                    >
                      {roll.qualityStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-500">
                    {roll.inspections?.length || 0} inspection(s) logged
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    <button
                      onClick={() => handleOpenTrace(roll.id)}
                      className="px-2.5 py-1 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded text-xs font-medium inline-flex items-center space-x-1 transition"
                    >
                      <History className="w-3.5 h-3.5 text-neutral-500" />
                      <span>History</span>
                    </button>
                    <button
                      onClick={() => handleOpenInspect(roll)}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-medium inline-flex items-center space-x-1 transition"
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

      {/* INSPECTION MODAL */}
      {showInspectModal && selectedRoll && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-4">
              <div>
                <h3 className="font-semibold text-sm text-neutral-900">Inspect Roll: {selectedRoll.rollId}</h3>
                <p className="text-[11px] text-neutral-500">{selectedRoll.fabricType} - {selectedRoll.lengthMeters} Meters</p>
              </div>
              <button onClick={() => setShowInspectModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitInspection} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-neutral-700 block mb-1">Quality Inspection Result</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectionResult('PASSED')}
                    className={`p-2 rounded-md border text-center transition font-medium ${
                      inspectionResult === 'PASSED'
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Pass (Stock)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectionResult('REWORK_REQUIRED')}
                    className={`p-2 rounded-md border text-center transition font-medium ${
                      inspectionResult === 'REWORK_REQUIRED'
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Rework
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectionResult('REJECTED')}
                    className={`p-2 rounded-md border text-center transition font-medium ${
                      inspectionResult === 'REJECTED'
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
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
                      <label className="font-medium text-neutral-700 block mb-1">Defect Category</label>
                      <select
                        value={defectCategory}
                        onChange={(e) => setDefectCategory(e.target.value)}
                        className="w-full border border-neutral-300 p-2 rounded-md bg-white text-neutral-800 focus:outline-none focus:border-neutral-900"
                      >
                        <option value="HOLES">Holes</option>
                        <option value="COLOR_MISMATCH">Color Mismatch</option>
                        <option value="UNEVEN_WEAVING">Uneven Weaving</option>
                        <option value="STAINS">Stains / Oil Spots</option>
                        <option value="OTHER">Other Defect</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-medium text-neutral-700 block mb-1">Defective Qty (Meters)</label>
                      <input
                        type="number"
                        value={defectiveQty}
                        onChange={(e) => setDefectiveQty(Number(e.target.value))}
                        min={0}
                        className="w-full border border-neutral-300 p-2 rounded-md text-neutral-800 focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                  </div>

                  {inspectionResult === 'REWORK_REQUIRED' && (
                    <div>
                      <label className="font-medium text-neutral-700 block mb-1">Rework Department</label>
                      <select
                        value={reworkStage}
                        onChange={(e) => setReworkStage(e.target.value)}
                        className="w-full border border-neutral-300 p-2 rounded-md bg-white text-neutral-800 focus:outline-none focus:border-neutral-900"
                      >
                        <option value="DYEING">Dye House (Re-dye / Strip)</option>
                        <option value="FINISHING">Finishing (Stenter / Washing)</option>
                        <option value="RE_WEAVING">Mending / Re-weaving</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="font-medium text-neutral-700 block mb-1">Defect Description</label>
                    <input
                      type="text"
                      value={defectDesc}
                      onChange={(e) => setDefectDesc(e.target.value)}
                      placeholder="e.g. Warp slack detected at 120m mark..."
                      className="w-full border border-neutral-300 p-2 rounded-md text-neutral-800 focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="font-medium text-neutral-700 block mb-1">Inspector Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Surface visual inspection verified, GSM checked..."
                  className="w-full border border-neutral-300 p-2 rounded-md text-neutral-800 focus:outline-none focus:border-neutral-900"
                  rows={2}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInspectModal(false)}
                  className="px-3 py-1.5 border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md text-white font-medium bg-neutral-900 hover:bg-neutral-800"
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
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-neutral-200 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-4">
              <div>
                <h3 className="font-semibold text-sm text-neutral-900 font-mono">Traceability: {traceRoll.rollId}</h3>
                <p className="text-[11px] text-neutral-500">Order: {traceRoll.order?.orderNumber}</p>
              </div>
              <button onClick={() => setShowTraceModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-neutral-50/70 rounded-lg border border-neutral-200/60 space-y-1 text-neutral-700">
                <p><strong>Fabric:</strong> {traceRoll.fabricType} ({traceRoll.color})</p>
                <p><strong>Length:</strong> {traceRoll.lengthMeters} Meters | <strong>Weight:</strong> {traceRoll.weightKg || 'N/A'} KG</p>
                <p><strong>Machine:</strong> {traceRoll.productionJob?.machine?.name} ({traceRoll.productionJob?.machine?.code})</p>
                <p><strong>Shift / Worker:</strong> {traceRoll.productionJob?.assignedEmployee?.name || 'Standard operator'}</p>
                <p><strong>Location:</strong> {traceRoll.location?.locationCode || 'In Processing'}</p>
              </div>

              <div>
                <h4 className="font-semibold text-neutral-900 mb-2">Inspection History ({traceRoll.inspections?.length})</h4>
                <div className="space-y-2">
                  {traceRoll.inspections?.map((ins: any) => (
                    <div key={ins.id} className="p-2.5 border border-neutral-200/80 rounded-md bg-white">
                      <div className="flex justify-between">
                        <span className="font-medium text-neutral-900">{ins.result}</span>
                        <span className="text-neutral-400 text-[10px]">
                          {new Date(ins.inspectionDate).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-neutral-600 mt-1">Inspector: {ins.inspectorName}</p>
                      {ins.defectCategory !== 'NONE' && (
                        <p className="text-rose-700 mt-0.5">Defect: {ins.defectCategory} - {ins.defectDescription}</p>
                      )}
                      {ins.remarks && <p className="text-neutral-500 italic mt-0.5">"{ins.remarks}"</p>}
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
