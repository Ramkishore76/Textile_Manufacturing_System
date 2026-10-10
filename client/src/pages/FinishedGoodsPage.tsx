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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">Finished Goods Fabric Stock</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Certified fabric rolls stored in finished goods warehouse awaiting customer shipment.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/app/dispatch')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Go to Dispatch Planning</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-neutral-200/80">
          <p className="text-xs font-medium text-neutral-500">Total Finished Rolls</p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-semibold text-neutral-900">{filteredRolls.length}</span>
            <span className="text-xs text-neutral-400">rolls in stock</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-neutral-200/80">
          <p className="text-xs font-medium text-neutral-500">Available Fabric Length</p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-semibold text-neutral-900">{totalMeters.toLocaleString()}</span>
            <span className="text-xs text-neutral-400">meters</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-neutral-200/80">
          <p className="text-xs font-medium text-neutral-500">Total Fabric Weight</p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-semibold text-neutral-900">{totalWeight.toFixed(1)}</span>
            <span className="text-xs text-neutral-400">kg</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-neutral-200/80">
          <p className="text-xs font-medium text-neutral-500">Inspection Compliance</p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-semibold text-emerald-700">100%</span>
            <span className="text-xs text-neutral-400">Quality Passed</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter */}
      <div className="bg-white p-3 rounded-lg border border-neutral-200/80 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Roll ID, Order #, Buyer, Bin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-neutral-500">Grade:</span>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-800 bg-white focus:outline-none focus:border-neutral-900"
          >
            <option value="ALL">All Grades</option>
            <option value="GRADE_A">Grade A (Premium)</option>
            <option value="GRADE_B">Grade B (Standard)</option>
            <option value="GRADE_C">Grade C</option>
          </select>
        </div>
      </div>

      {/* Rolls Table */}
      <div className="bg-white rounded-lg border border-neutral-200/80 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-400 font-normal text-xs">Loading finished goods stock...</div>
        ) : filteredRolls.length === 0 ? (
          <div className="p-10 text-center">
            <Layers className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-neutral-700">No Finished Rolls Found</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Either all rolls have been dispatched, or quality inspection is pending.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/40 border-b border-neutral-200/80 text-neutral-500 font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Roll ID</th>
                  <th className="py-2.5 px-4">Associated Order</th>
                  <th className="py-2.5 px-4">Buyer Company</th>
                  <th className="py-2.5 px-4">Length</th>
                  <th className="py-2.5 px-4">Weight</th>
                  <th className="py-2.5 px-4">Quality Grade</th>
                  <th className="py-2.5 px-4">Location</th>
                  <th className="py-2.5 px-4 text-right">Traceability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {filteredRolls.map((roll) => (
                  <tr key={roll.id} className="hover:bg-neutral-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <QrCode className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="font-mono font-medium text-neutral-900">{roll.rollId}</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">Created: {new Date(roll.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-neutral-800">{roll.order?.orderNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-neutral-700">
                      {roll.order?.buyer?.companyName}
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      {roll.lengthMeters} m
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {roll.weightKg ? `${roll.weightKg} kg` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                          roll.qualityGrade === 'GRADE_A'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        {roll.qualityGrade?.replace('_', ' ') || 'PASSED'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {roll.location ? (
                        <div className="flex items-center space-x-1 text-neutral-600 text-xs">
                          <MapPin className="w-3 h-3 text-neutral-400" />
                          <span>Zone {roll.location.zone} · Rack {roll.location.rack} ({roll.location.bin})</span>
                        </div>
                      ) : (
                        <span className="text-neutral-400 italic">FG Staging</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openTraceabilityModal(roll.id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 font-medium text-xs transition"
                      >
                        <span>Passport</span>
                        <ChevronRight className="w-3 h-3 text-neutral-400" />
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
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">Roll Traceability Passport</h2>
                  <p className="text-[11px] text-neutral-500 font-mono">Roll #{selectedRoll.rollId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRoll(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Core Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-neutral-50/70 p-3.5 rounded-lg border border-neutral-200/60">
                <div>
                  <span className="text-neutral-400 block font-medium text-[10px] uppercase">Length</span>
                  <span className="font-semibold text-neutral-900 text-xs">{selectedRoll.lengthMeters} m</span>
                </div>
                <div>
                  <span className="text-neutral-400 block font-medium text-[10px] uppercase">Weight</span>
                  <span className="font-semibold text-neutral-900 text-xs">{selectedRoll.weightKg || 'N/A'} kg</span>
                </div>
                <div>
                  <span className="text-neutral-400 block font-medium text-[10px] uppercase">Grade</span>
                  <span className="font-semibold text-emerald-800 text-xs">{selectedRoll.qualityGrade || 'PASSED'}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block font-medium text-[10px] uppercase">Status</span>
                  <span className="font-semibold text-neutral-800 text-xs">{selectedRoll.inventoryStatus}</span>
                </div>
              </div>

              {/* Order & Buyer Trace */}
              <div className="border border-neutral-200/80 p-3.5 rounded-lg">
                <h4 className="text-xs font-semibold text-neutral-900 mb-2.5 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Buyer & Order Association</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-neutral-400 block">Buyer Company:</span>
                    <span className="font-medium text-neutral-800">{selectedRoll.order?.buyer?.companyName}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Order Number:</span>
                    <span className="font-medium text-neutral-900">{selectedRoll.order?.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Fabric Product:</span>
                    <span className="font-medium text-neutral-800">{selectedRoll.orderItem?.fabricProduct?.name || 'Cotton Fabric'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Color & Specs:</span>
                    <span className="font-medium text-neutral-800">{selectedRoll.orderItem?.color || 'Bleached White'}</span>
                  </div>
                </div>
              </div>

              {/* Manufacturing & Machine Trace */}
              <div className="border border-neutral-200/80 p-3.5 rounded-lg">
                <h4 className="text-xs font-semibold text-neutral-900 mb-2.5 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Production Job & Loom Origin</span>
                </h4>
                {selectedRoll.productionJob ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-neutral-400 block">Job Number:</span>
                      <span className="font-mono font-medium text-neutral-900">{selectedRoll.productionJob.jobNumber}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Stage:</span>
                      <span className="font-medium text-neutral-800">{selectedRoll.productionJob.stage}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Machine:</span>
                      <span className="font-medium text-neutral-800">{selectedRoll.productionJob.machine?.name} ({selectedRoll.productionJob.machine?.code})</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Assigned Operator:</span>
                      <span className="font-medium text-neutral-800">{selectedRoll.productionJob.assignedEmployee?.name || 'Plant Operator'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic">Direct production roll batch</p>
                )}
              </div>

              {/* Quality Inspection History */}
              <div className="border border-neutral-200/80 p-3.5 rounded-lg">
                <h4 className="text-xs font-semibold text-neutral-900 mb-2.5 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Quality Inspection Record</span>
                </h4>
                {selectedRoll.inspections && selectedRoll.inspections.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRoll.inspections.map((insp: any) => (
                      <div key={insp.id} className="bg-neutral-50/70 p-2.5 rounded-md text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-neutral-800">Inspection #{insp.inspectionNumber}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                            {insp.overallResult}
                          </span>
                        </div>
                        <p className="text-neutral-600">Points Total: {insp.pointsTotal} pts · Grade: {insp.assignedGrade}</p>
                        {insp.remarks && <p className="text-neutral-500 italic">"{insp.remarks}"</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic">No formal inspection log attached.</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedRoll(null)}
                className="px-4 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs"
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
