import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Boxes,
  Plus,
  Sliders,
  History,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  X,
  Search,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'YARNS' | 'TRANSACTIONS' | 'BOM'>('YARNS');
  const [yarns, setYarns] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Yarn Modal
  const [showNewYarnModal, setShowNewYarnModal] = useState(false);
  const [yarnCode, setYarnCode] = useState('');
  const [yarnName, setYarnName] = useState('');
  const [yarnType, setYarnType] = useState('Cotton');
  const [count, setCount] = useState('40s');
  const [color, setColor] = useState('Natural White');
  const [initialStock, setInitialStock] = useState(500);
  const [alertThreshold, setAlertThreshold] = useState(200);
  const [costPerKg, setCostPerKg] = useState(260);
  const [storageLoc, setStorageLoc] = useState('WH-RAW-A1');

  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedYarnId, setSelectedYarnId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [adjustmentQty, setAdjustmentQty] = useState(50);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // New BOM Modal
  const [showBomModal, setShowBomModal] = useState(false);
  const [bomFabricId, setBomFabricId] = useState('');
  const [bomYarnId, setBomYarnId] = useState('');
  const [bomRate, setBomRate] = useState(0.18);
  const [bomWastage, setBomWastage] = useState(3.0);

  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [yarnsRes, txRes, bomsRes, fabricsRes] = await Promise.all([
        api.get<any[]>('/inventory/yarns'),
        api.get<any[]>('/inventory/transactions'),
        api.get<any[]>('/inventory/boms'),
        api.get<any[]>('/inventory/fabrics'),
      ]);
      setYarns(yarnsRes);
      setTransactions(txRes);
      setBoms(bomsRes);
      setFabrics(fabricsRes);
      if (yarnsRes.length > 0) setSelectedYarnId(yarnsRes[0].id);
      if (fabricsRes.length > 0) setBomFabricId(fabricsRes[0].id);
      if (yarnsRes.length > 0) setBomYarnId(yarnsRes[0].id);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateYarn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/yarns', {
        code: yarnCode,
        name: yarnName,
        yarnType,
        count,
        color,
        currentStock: Number(initialStock),
        minimumStockAlert: Number(alertThreshold),
        costPerUnit: Number(costPerKg),
        storageLocation: storageLoc,
      });
      setShowNewYarnModal(false);
      await loadData();
    } catch (err: any) {
      alert('Error creating yarn material: ' + err.message);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/adjust', {
        yarnMaterialId: selectedYarnId,
        adjustmentType,
        quantity: Number(adjustmentQty),
        reason: adjustmentReason,
      });
      setShowAdjustModal(false);
      setAdjustmentReason('');
      await loadData();
    } catch (err: any) {
      alert('Adjustment error: ' + err.message);
    }
  };

  const handleSaveBom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/boms', {
        fabricProductId: bomFabricId,
        yarnMaterialId: bomYarnId,
        yarnQuantityPerMeter: Number(bomRate),
        wastagePercentage: Number(bomWastage),
      });
      setShowBomModal(false);
      await loadData();
    } catch (err: any) {
      alert('BOM save error: ' + err.message);
    }
  };

  const filteredYarns = yarns.filter((y) =>
    y.name.toLowerCase().includes(search.toLowerCase()) ||
    y.code.toLowerCase().includes(search.toLowerCase()) ||
    y.yarnType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Raw Material & BOM Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage yarn stocks, lot adjustments, consumption tracking, and bill-of-materials rules.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdjustModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Stock Adjustment</span>
          </button>
          <button
            onClick={() => setShowNewYarnModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Yarn Type</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('YARNS')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'YARNS'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Yarn Stock Catalog ({yarns.length})
        </button>
        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'TRANSACTIONS'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Stock Ledger & History
        </button>
        <button
          onClick={() => setActiveTab('BOM')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'BOM'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Bill of Materials (BOM)
        </button>
      </div>

      {/* TAB 1: YARNS */}
      {activeTab === 'YARNS' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search yarn by name, count, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Code / Item</th>
                  <th className="py-3 px-4">Count & Color</th>
                  <th className="py-3 px-4">Total Stock</th>
                  <th className="py-3 px-4">Reserved Stock</th>
                  <th className="py-3 px-4">Available Stock</th>
                  <th className="py-3 px-4">Valuation Rate</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredYarns.map((yarn) => (
                  <tr key={yarn.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{yarn.code}</span>
                      <span className="text-slate-500 text-[11px] block">{yarn.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{yarn.count}</span>
                      <span className="text-slate-400 text-[11px] block">{yarn.color} ({yarn.yarnType})</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{yarn.currentStock.toLocaleString()} KG</td>
                    <td className="py-3 px-4 text-amber-700 font-semibold">{yarn.reservedStock.toLocaleString()} KG</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{yarn.availableStock.toLocaleString()} KG</td>
                    <td className="py-3 px-4 text-slate-600">₹{yarn.costPerUnit} / KG</td>
                    <td className="py-3 px-4">
                      {yarn.isLowStock ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1 w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Low Stock Alert</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Sufficient
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTIONS */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Yarn Item</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Qty Change</th>
                <th className="py-3 px-4">Balance After</th>
                <th className="py-3 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(tx.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{tx.yarnMaterial?.name}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.transactionType === 'RECEIPT'
                          ? 'bg-emerald-50 text-emerald-800'
                          : tx.transactionType === 'RESERVATION'
                          ? 'bg-amber-50 text-amber-800'
                          : tx.transactionType === 'CONSUMPTION'
                          ? 'bg-purple-50 text-purple-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {tx.transactionType}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-4 font-bold ${
                      tx.quantity > 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} KG
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">{tx.newStock} KG</td>
                  <td className="py-3 px-4 text-slate-600">{tx.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: BOM */}
      {activeTab === 'BOM' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">Configured Bill-of-Materials rules for automatic yarn calculation.</p>
            <button
              onClick={() => setShowBomModal(true)}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
            >
              + Define BOM Rule
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Fabric Product</th>
                  <th className="py-3 px-4">Weave & GSM</th>
                  <th className="py-3 px-4">Yarn Component</th>
                  <th className="py-3 px-4">Yarn Required / Meter</th>
                  <th className="py-3 px-4">Wastage Buffer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {boms.map((bom) => (
                  <tr key={bom.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{bom.fabricProduct?.name}</td>
                    <td className="py-3 px-4 text-slate-600">{bom.fabricProduct?.weaveType} ({bom.fabricProduct?.gsm} GSM)</td>
                    <td className="py-3 px-4 font-semibold text-emerald-800">{bom.yarnMaterial?.name} ({bom.yarnMaterial?.count})</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{bom.yarnQuantityPerMeter} KG / Meter</td>
                    <td className="py-3 px-4 text-slate-500">{bom.wastagePercentage}% buffer</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Record Stock Adjustment</span>
              </h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Select Yarn Item</label>
                <select
                  value={selectedYarnId}
                  onChange={(e) => setSelectedYarnId(e.target.value)}
                  className="w-full border p-2 rounded-lg bg-white"
                >
                  {yarns.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} (Current: {y.currentStock} KG)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Adjustment Type</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as any)}
                    className="w-full border p-2 rounded-lg bg-white"
                  >
                    <option value="INCREASE">Increase Stock (+)</option>
                    <option value="DECREASE">Decrease Stock (-)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Quantity (KG)</label>
                  <input
                    type="number"
                    value={adjustmentQty}
                    onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Mandatory Reason / Audit Note</label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  required
                  placeholder="e.g. Physical inventory count correction, spill loss, returned lot..."
                  className="w-full border p-2 rounded-lg"
                  rows={2}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW YARN MODAL */}
      {showNewYarnModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Add New Yarn Material</h3>
              <button onClick={() => setShowNewYarnModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateYarn} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Item Code</label>
                  <input
                    type="text"
                    value={yarnCode}
                    onChange={(e) => setYarnCode(e.target.value)}
                    required
                    placeholder="e.g. YRN-COT-60S"
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Name</label>
                  <input
                    type="text"
                    value={yarnName}
                    onChange={(e) => setYarnName(e.target.value)}
                    required
                    placeholder="60s Combed Cotton Cone"
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Yarn Type</label>
                  <input
                    type="text"
                    value={yarnType}
                    onChange={(e) => setYarnType(e.target.value)}
                    required
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Count</label>
                  <input
                    type="text"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    required
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    required
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Stock (KG)</label>
                  <input
                    type="number"
                    value={initialStock}
                    onChange={(e) => setInitialStock(Number(e.target.value))}
                    min={0}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Alert Below</label>
                  <input
                    type="number"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                    min={0}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Rate (₹/KG)</label>
                  <input
                    type="number"
                    value={costPerKg}
                    onChange={(e) => setCostPerKg(Number(e.target.value))}
                    min={0}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewYarnModal(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                >
                  Save Yarn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW BOM MODAL */}
      {showBomModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Define Bill of Materials Rule</h3>
              <button onClick={() => setShowBomModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBom} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Fabric Product</label>
                <select
                  value={bomFabricId}
                  onChange={(e) => setBomFabricId(e.target.value)}
                  className="w-full border p-2 rounded-lg bg-white"
                >
                  {fabrics.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.gsm} GSM)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Required Yarn Material</label>
                <select
                  value={bomYarnId}
                  onChange={(e) => setBomYarnId(e.target.value)}
                  className="w-full border p-2 rounded-lg bg-white"
                >
                  {yarns.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} ({y.count})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">KG Yarn / Meter Fabric</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bomRate}
                    onChange={(e) => setBomRate(Number(e.target.value))}
                    min={0.01}
                    required
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Wastage %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={bomWastage}
                    onChange={(e) => setBomWastage(Number(e.target.value))}
                    min={0}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowBomModal(false)} className="px-3 py-1.5 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700">
                  Save BOM Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
