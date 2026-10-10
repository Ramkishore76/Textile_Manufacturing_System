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
      // Fetch rolls in finished goods stock
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 mb-1">
            <Layers className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Inventory & Warehouse</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Finished Goods Fabric Stock</h1>
          <p className="text-sm text-slate-500 mt-1">
            Certified quality-passed fabric rolls stored in finished warehouse awaiting shipment
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/app/dispatch')}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition"
          >
            <Send className="w-4 h-4" />
            <span>Go to Dispatch Planning</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Finished Rolls</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-slate-900">{filteredRolls.length}</span>
            <span className="text-xs font-medium text-slate-400">rolls in stock</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Available Fabric Length</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-indigo-600">{totalMeters.toLocaleString()}</span>
            <span className="text-xs font-medium text-slate-400">meters</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Fabric Weight</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-slate-900">{totalWeight.toFixed(1)}</span>
            <span className="text-xs font-medium text-slate-400">kg</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Inspection Compliance</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-emerald-600">100%</span>
            <span className="text-xs font-medium text-slate-400">Quality Passed</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Roll ID, Order #, Buyer, Bin location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase">Grade:</span>
          </div>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Grades</option>
            <option value="GRADE_A">Grade A (Premium)</option>
            <option value="GRADE_B">Grade B (Standard)</option>
            <option value="GRADE_C">Grade C</option>
          </select>
        </div>
      </div>

      {/* Rolls Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading finished goods stock...</div>
        ) : filteredRolls.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Finished Rolls Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Either all rolls have been dispatched, or quality inspection is pending.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Roll ID & Barcode</th>
                  <th className="py-3 px-4">Associated Order</th>
                  <th className="py-3 px-4">Buyer Company</th>
                  <th className="py-3 px-4">Length (m)</th>
                  <th className="py-3 px-4">Weight (kg)</th>
                  <th className="py-3 px-4">Quality Grade</th>
                  <th className="py-3 px-4">Warehouse Location</th>
                  <th className="py-3 px-4 text-right">Traceability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRolls.map((roll) => (
                  <tr key={roll.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <QrCode className="w-4 h-4 text-indigo-500" />
                        <span className="font-mono font-bold text-slate-900">{roll.rollId}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Created: {new Date(roll.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-indigo-600">{roll.order?.orderNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{roll.order?.buyer?.companyName}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {roll.lengthMeters} m
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {roll.weightKg ? `${roll.weightKg} kg` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          roll.qualityGrade === 'GRADE_A'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        {roll.qualityGrade?.replace('_', ' ') || 'PASSED'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {roll.location ? (
                        <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded inline-flex">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>Zone {roll.location.zone} - Rack {roll.location.rack} ({roll.location.bin})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">FG Staging Area</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openTraceabilityModal(roll.id)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                      >
                        <span>Inspect Trace</span>
                        <ChevronRight className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Roll Traceability Passport</h2>
                  <p className="text-xs text-slate-400 font-mono">Roll #{selectedRoll.rollId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRoll(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {/* Core Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Length</span>
                  <span className="font-black text-slate-800 text-sm">{selectedRoll.lengthMeters} m</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Weight</span>
                  <span className="font-black text-slate-800 text-sm">{selectedRoll.weightKg || 'N/A'} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Grade</span>
                  <span className="font-black text-emerald-600 text-sm">{selectedRoll.qualityGrade || 'PASSED'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Status</span>
                  <span className="font-black text-indigo-600 text-sm">{selectedRoll.inventoryStatus}</span>
                </div>
              </div>

              {/* Order & Buyer Trace */}
              <div className="border border-slate-200 p-4 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>Buyer & Order Association</span>
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Buyer Company:</span>
                    <span className="font-bold text-slate-800">{selectedRoll.order?.buyer?.companyName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Order Number:</span>
                    <span className="font-bold text-indigo-600">{selectedRoll.order?.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Fabric Product:</span>
                    <span className="font-bold text-slate-800">{selectedRoll.orderItem?.fabricProduct?.name || 'Cotton Fabric'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Color & Specs:</span>
                    <span className="font-bold text-slate-800">{selectedRoll.orderItem?.color || 'Bleached White'}</span>
                  </div>
                </div>
              </div>

              {/* Manufacturing & Machine Trace */}
              <div className="border border-slate-200 p-4 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-purple-500" />
                  <span>Production Job & Loom Origin</span>
                </h4>
                {selectedRoll.productionJob ? (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block">Job Number:</span>
                      <span className="font-mono font-bold text-slate-800">{selectedRoll.productionJob.jobNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Stage:</span>
                      <span className="font-bold text-slate-800">{selectedRoll.productionJob.stage}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Machine:</span>
                      <span className="font-bold text-indigo-600">{selectedRoll.productionJob.machine?.name} ({selectedRoll.productionJob.machine?.code})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Assigned Operator:</span>
                      <span className="font-bold text-slate-800">{selectedRoll.productionJob.assignedEmployee?.name || 'Plant Operator'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Direct production roll batch</p>
                )}
              </div>

              {/* Quality Inspection History */}
              <div className="border border-slate-200 p-4 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Quality Inspection Record</span>
                </h4>
                {selectedRoll.inspections && selectedRoll.inspections.length > 0 ? (
                  <div className="space-y-3">
                    {selectedRoll.inspections.map((insp: any) => (
                      <div key={insp.id} className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">Inspection #{insp.inspectionNumber}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {insp.overallResult}
                          </span>
                        </div>
                        <p className="text-slate-600">Points Total: {insp.pointsTotal} pts | Grade: {insp.assignedGrade}</p>
                        {insp.remarks && <p className="text-slate-500 italic">"{insp.remarks}"</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No formal inspection log attached.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedRoll(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
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
