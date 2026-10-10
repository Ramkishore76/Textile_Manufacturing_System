import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send,
  Calendar,
  X,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FinishedGoodsPage: React.FC = () => {
  const navigate = useNavigate();
  const [rolls, setRolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [selectedRoll, setSelectedRoll] = useState<any | null>(null);
  const [rollDetailsLoading, setRollDetailsLoading] = useState(false);

  useEffect(() => {
    loadFinishedStock();
  }, []);

  const loadFinishedStock = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/rolls/finished-stock');
      setRolls(data);
    } catch (err: any) {
      console.error('Failed to load finished stock:', err);
    } finally {
      setLoading(false);
    }
  };

  const openTraceabilityModal = async (rollId: string) => {
    setRollDetailsLoading(true);
    try {
      const data = await api.get<any>(`/rolls/${rollId}`);
      setSelectedRoll(data);
    } catch (err: any) {
      alert('Failed to load roll traceability: ' + err.message);
    } finally {
      setRollDetailsLoading(false);
    }
  };

  // Filter rolls
  const filteredRolls = rolls.filter((r) => {
    const matchesSearch =
      r.rollId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.order?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.order?.buyer?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.location?.bin?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'ALL' || r.qualityGrade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const totalMeters = filteredRolls.reduce((sum, r) => sum + r.lengthMeters, 0);
  const totalWeight = filteredRolls.reduce((sum, r) => sum + (r.weightKg || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Finished Goods Fabric Stock</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Certified fabric rolls stored in finished goods warehouse awaiting customer shipment.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/app/dispatch')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Go to Dispatch Planning</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Total Finished Rolls</p>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-bold tracking-tight text-zinc-900">{filteredRolls.length}</span>
            <span className="text-xs text-zinc-400">rolls in stock</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Available Fabric Length</p>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-bold tracking-tight text-zinc-900">{totalMeters.toLocaleString()}</span>
            <span className="text-xs text-zinc-400">meters</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Total Fabric Weight</p>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-bold tracking-tight text-zinc-900">{totalWeight.toFixed(1)}</span>
            <span className="text-xs text-zinc-400">kg</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Inspection Compliance</p>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-bold tracking-tight text-emerald-700">100%</span>
            <span className="text-xs text-zinc-400">Quality Passed</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative flex-1 w-full sm:w-auto max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Roll ID, Order #, Buyer, Bin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50/50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-zinc-500">Grade:</span>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-800 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          >
            <option value="ALL">All Grades</option>
            <option value="GRADE_A">Grade A (Premium)</option>
            <option value="GRADE_B">Grade B (Standard)</option>
            <option value="GRADE_C">Grade C</option>
          </select>
        </div>
      </div>

      {/* Rolls Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 font-medium text-xs">Loading finished goods stock...</div>
        ) : filteredRolls.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-zinc-700">No Finished Rolls Found</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Either all rolls have been dispatched, or quality inspection is pending.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Roll ID</th>
                  <th className="py-3 px-4">Associated Order</th>
                  <th className="py-3 px-4">Buyer Company</th>
                  <th className="py-3 px-4">Length</th>
                  <th className="py-3 px-4">Weight</th>
                  <th className="py-3 px-4">Quality Grade</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Traceability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {filteredRolls.map((roll) => (
                  <tr key={roll.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <QrCode className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="font-mono font-bold text-zinc-900">{roll.rollId}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">Created: {new Date(roll.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-zinc-900">
                      {roll.order?.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-700">
                      {roll.order?.buyer?.companyName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-zinc-900">
                      {roll.lengthMeters} m
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600">
                      {roll.weightKg ? `${roll.weightKg} kg` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          roll.qualityGrade === 'GRADE_A'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/70'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        {roll.qualityGrade?.replace('_', ' ') || 'PASSED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {roll.location ? (
                        <div className="flex items-center space-x-1 text-zinc-600 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Zone {roll.location.zone} · Rack {roll.location.rack} ({roll.location.bin})</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">FG Staging</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openTraceabilityModal(roll.id)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-600 text-zinc-700 font-semibold text-xs transition"
                      >
                        <span>Passport</span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Roll Traceability Modal */}
      {selectedRoll && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-zinc-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Roll Traceability Passport</h2>
                  <p className="text-[11px] text-zinc-500 font-mono">Roll #{selectedRoll.rollId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRoll(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Core Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
                <div>
                  <span className="text-zinc-500 block font-medium text-[10px] uppercase">Length</span>
                  <span className="font-bold text-zinc-900 text-xs">{selectedRoll.lengthMeters} m</span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-medium text-[10px] uppercase">Weight</span>
                  <span className="font-bold text-zinc-900 text-xs">{selectedRoll.weightKg || 'N/A'} kg</span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-medium text-[10px] uppercase">Grade</span>
                  <span className="font-bold text-emerald-700 text-xs">{selectedRoll.qualityGrade || 'PASSED'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-medium text-[10px] uppercase">Status</span>
                  <span className="font-bold text-zinc-800 text-xs">{selectedRoll.inventoryStatus}</span>
                </div>
              </div>

              {/* Order & Buyer Trace */}
              <div className="border border-zinc-200/80 p-4 rounded-xl">
                <h4 className="text-xs font-semibold text-zinc-900 mb-2.5 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Buyer & Order Association</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-zinc-500 block">Buyer Company:</span>
                    <span className="font-semibold text-zinc-900">{selectedRoll.order?.buyer?.companyName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Order Number:</span>
                    <span className="font-semibold text-zinc-900">{selectedRoll.order?.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Fabric Product:</span>
                    <span className="font-medium text-zinc-800">{selectedRoll.orderItem?.fabricProduct?.name || 'Cotton Fabric'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Color & Specs:</span>
                    <span className="font-medium text-zinc-800">{selectedRoll.orderItem?.color || 'Bleached White'}</span>
                  </div>
                </div>
              </div>

              {/* Manufacturing & Machine Trace */}
              <div className="border border-zinc-200/80 p-4 rounded-xl">
                <h4 className="text-xs font-semibold text-zinc-900 mb-2.5 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Production Job & Loom Origin</span>
                </h4>
                {selectedRoll.productionJob ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-zinc-500 block">Job Number:</span>
                      <span className="font-mono font-semibold text-zinc-900">{selectedRoll.productionJob.jobNumber}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Stage:</span>
                      <span className="font-medium text-zinc-800">{selectedRoll.productionJob.stage}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Machine:</span>
                      <span className="font-medium text-zinc-800">{selectedRoll.productionJob.machine?.name} ({selectedRoll.productionJob.machine?.code})</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Assigned Operator:</span>
                      <span className="font-medium text-zinc-800">{selectedRoll.productionJob.assignedEmployee?.name || 'Plant Operator'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">Direct production roll batch</p>
                )}
              </div>

              {/* Quality Inspection History */}
              <div className="border border-zinc-200/80 p-4 rounded-xl">
                <h4 className="text-xs font-semibold text-zinc-900 mb-2.5 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Quality Inspection Record</span>
                </h4>
                {selectedRoll.inspections && selectedRoll.inspections.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRoll.inspections.map((insp: any) => (
                      <div key={insp.id} className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/60 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-zinc-900">Inspection #{insp.inspectionNumber}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                            {insp.overallResult}
                          </span>
                        </div>
                        <p className="text-zinc-600">Points Total: {insp.pointsTotal} pts · Grade: {insp.assignedGrade}</p>
                        {insp.remarks && <p className="text-zinc-500 italic">"{insp.remarks}"</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No formal inspection log attached.</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedRoll(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition"
              >
                Close Passport
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
