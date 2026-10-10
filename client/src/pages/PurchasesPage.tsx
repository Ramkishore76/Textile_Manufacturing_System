import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Truck,
  Plus,
  PackageCheck,
  FileText,
  Building,
  CheckCircle,
  X,
  AlertCircle,
} from 'lucide-react';

export const PurchasesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'POS' | 'GRN' | 'SUPPLIERS'>('REQUESTS');
  const [requests, setRequests] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [yarns, setYarns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New PO Modal
  const [showPoModal, setShowPoModal] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poYarnId, setPoYarnId] = useState('');
  const [poQty, setPoQty] = useState(500);
  const [poPrice, setPoPrice] = useState(250);
  const [poExpectedDate, setPoExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [poRequestId, setPoRequestId] = useState<string | undefined>(undefined);

  // New GRN Modal
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [grnSupplierId, setGrnSupplierId] = useState('');
  const [grnYarnId, setGrnYarnId] = useState('');
  const [grnPoId, setGrnPoId] = useState<string | undefined>(undefined);
  const [batchNumber, setBatchNumber] = useState('');
  const [quantityReceived, setQuantityReceived] = useState(500);
  const [unitCost, setUnitCost] = useState(250);
  const [inspectionStatus, setInspectionStatus] = useState('ACCEPTED');
  const [grnRemarks, setGrnRemarks] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqs, pos, grns, sups, yrns] = await Promise.all([
        api.get<any[]>('/purchases/requests'),
        api.get<any[]>('/purchases/orders'),
        api.get<any[]>('/purchases/receipts'),
        api.get<any[]>('/purchases/suppliers'),
        api.get<any[]>('/inventory/yarns'),
      ]);
      setRequests(reqs);
      setPurchaseOrders(pos);
      setReceipts(grns);
      setSuppliers(sups);
      setYarns(yrns);
      if (sups.length > 0) {
        setPoSupplierId(sups[0].id);
        setGrnSupplierId(sups[0].id);
      }
      if (yrns.length > 0) {
        setPoYarnId(yrns[0].id);
        setGrnYarnId(yrns[0].id);
        setPoPrice(yrns[0].costPerUnit || 250);
        setUnitCost(yrns[0].costPerUnit || 250);
      }
    } catch (err) {
      console.error('Failed to load purchases data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/purchases/orders', {
        supplierId: poSupplierId,
        yarnMaterialId: poYarnId,
        orderedQuantity: Number(poQty),
        unitPrice: Number(poPrice),
        expectedDeliveryDate: new Date(poExpectedDate).toISOString(),
        purchaseRequestId: poRequestId,
      });
      setShowPoModal(false);
      await loadData();
    } catch (err: any) {
      alert('Error creating Purchase Order: ' + err.message);
    }
  };

  const handleRecordGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/purchases/receipts', {
        supplierId: grnSupplierId,
        yarnMaterialId: grnYarnId,
        purchaseOrderId: grnPoId,
        batchNumber,
        quantityReceived: Number(quantityReceived),
        unitCost: Number(unitCost),
        inspectionStatus,
        remarks: grnRemarks,
      });
      setShowGrnModal(false);
      alert('Goods Receipt confirmed! Inventory stock increased successfully.');
      await loadData();
    } catch (err: any) {
      alert('Error recording goods receipt: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Procurement & Supplier Inward</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage purchase requisitions, supplier POs, and goods inward receipt (GRN).
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setBatchNumber(`LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
              setShowGrnModal(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Record Goods Receipt (GRN)</span>
          </button>
          <button
            onClick={() => {
              setPoRequestId(undefined);
              setShowPoModal(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'REQUESTS'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Purchase Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('POS')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'POS'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Purchase Orders ({purchaseOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('GRN')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'GRN'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Goods Receipt Notes ({receipts.length})
        </button>
        <button
          onClick={() => setActiveTab('SUPPLIERS')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'SUPPLIERS'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Suppliers Directory ({suppliers.length})
        </button>
      </div>

      {/* TAB 1: PURCHASE REQUESTS */}
      {activeTab === 'REQUESTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Request #</th>
                <th className="py-3 px-4">Required Yarn Material</th>
                <th className="py-3 px-4">Requested Qty</th>
                <th className="py-3 px-4">Needed By</th>
                <th className="py-3 px-4">Reason / Linked Order</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {requests.map((pr) => (
                <tr key={pr.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{pr.requestNumber}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 block">{pr.yarnMaterial?.name}</span>
                    <span className="text-[11px] text-slate-500 block">{pr.yarnMaterial?.count} ({pr.yarnMaterial?.color})</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{pr.requestedQuantity.toLocaleString()} KG</td>
                  <td className="py-3.5 px-4 text-slate-600">{new Date(pr.requiredByDate).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs">{pr.reason}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pr.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : pr.status === 'ORDERED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {pr.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {pr.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          setPoRequestId(pr.id);
                          setPoYarnId(pr.yarnMaterialId);
                          setPoQty(pr.requestedQuantity);
                          setShowPoModal(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 transition"
                      >
                        Create PO
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: PURCHASE ORDERS */}
      {activeTab === 'POS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">PO #</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Yarn Item</th>
                <th className="py-3 px-4">Ordered Qty</th>
                <th className="py-3 px-4">Unit Rate</th>
                <th className="py-3 px-4">Total Cost</th>
                <th className="py-3 px-4">Expected Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{po.poNumber}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{po.supplier?.name}</td>
                  <td className="py-3.5 px-4">{po.yarnMaterial?.name}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{po.orderedQuantity.toLocaleString()} KG</td>
                  <td className="py-3.5 px-4 text-slate-600">₹{po.unitPrice}</td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-800">₹{po.totalCost?.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-slate-600">{new Date(po.expectedDeliveryDate).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        po.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {po.status !== 'COMPLETED' && (
                      <button
                        onClick={() => {
                          setGrnPoId(po.id);
                          setGrnSupplierId(po.supplierId);
                          setGrnYarnId(po.yarnMaterialId);
                          setQuantityReceived(po.orderedQuantity);
                          setUnitCost(po.unitPrice);
                          setBatchNumber(`LOT-${po.poNumber}`);
                          setShowGrnModal(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700"
                      >
                        Receive Yarn
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: GOODS RECEIPTS (GRN) */}
      {activeTab === 'GRN' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">GRN #</th>
                <th className="py-3 px-4">Batch / Lot</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Yarn Material</th>
                <th className="py-3 px-4">Qty Received</th>
                <th className="py-3 px-4">Valuation Rate</th>
                <th className="py-3 px-4">Inspection Result</th>
                <th className="py-3 px-4">Receipt Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {receipts.map((grn) => (
                <tr key={grn.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{grn.receiptNumber}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-800">{grn.batchNumber}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{grn.supplier?.name}</td>
                  <td className="py-3.5 px-4">{grn.yarnMaterial?.name}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700">+{grn.quantityReceived.toLocaleString()} KG</td>
                  <td className="py-3.5 px-4 text-slate-600">₹{grn.unitCost} / KG</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        grn.inspectionStatus === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {grn.inspectionStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(grn.receiptDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: SUPPLIERS */}
      {activeTab === 'SUPPLIERS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div key={sup.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">{sup.name}</h3>
              </div>
              <p className="text-slate-600">Contact: <strong className="text-slate-800">{sup.contactPerson}</strong></p>
              <p className="text-slate-600">Email: {sup.email}</p>
              <p className="text-slate-600">Phone: {sup.phone}</p>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
                <span className="font-semibold text-slate-700 block">Yarn Types:</span>
                <span className="text-slate-500">{sup.yarnTypesSupplied}</span>
              </div>
              <p className="text-slate-500 text-[11px]">Payment Terms: {sup.paymentTerms || '30 Days Net'}</p>
            </div>
          ))}
        </div>
      )}

      {/* RECORD GRN MODAL */}
      {showGrnModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <PackageCheck className="w-5 h-5 text-emerald-600" />
                <span>Confirm Goods Inward Receipt (GRN)</span>
              </h3>
              <button onClick={() => setShowGrnModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordGrn} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Supplier</label>
                <select
                  value={grnSupplierId}
                  onChange={(e) => setGrnSupplierId(e.target.value)}
                  className="w-full border p-2 rounded-lg bg-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Yarn Material Received</label>
                <select
                  value={grnYarnId}
                  onChange={(e) => setGrnYarnId(e.target.value)}
                  className="w-full border p-2 rounded-lg bg-white"
                >
                  {yarns.map((y) => (
                    <option key={y.id} value={y.id}>{y.name} ({y.count})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Batch / Lot Number</label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    required
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Quantity (KG)</label>
                  <input
                    type="number"
                    value={quantityReceived}
                    onChange={(e) => setQuantityReceived(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Unit Cost (₹/KG)</label>
                  <input
                    type="number"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Inspection Status</label>
                  <select
                    value={inspectionStatus}
                    onChange={(e) => setInspectionStatus(e.target.value)}
                    className="w-full border p-2 rounded-lg bg-white"
                  >
                    <option value="ACCEPTED">Accepted (Add to Stock)</option>
                    <option value="REJECTED">Rejected (Quarantined)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Remarks</label>
                <input
                  type="text"
                  value={grnRemarks}
                  onChange={(e) => setGrnRemarks(e.target.value)}
                  placeholder="Moisture content OK, cones intact..."
                  className="w-full border p-2 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowGrnModal(false)} className="px-3 py-1.5 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700">
                  Confirm Inward & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PO MODAL */}
      {showPoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Issue Purchase Order</h3>
              <button onClick={() => setShowPoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Supplier</label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full border p-2 rounded-lg bg-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Yarn Material</label>
                <select
                  value={poYarnId}
                  onChange={(e) => setPoYarnId(e.target.value)}
                  className="w-full border p-2 rounded-lg bg-white"
                >
                  {yarns.map((y) => (
                    <option key={y.id} value={y.id}>{y.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Quantity (KG)</label>
                  <input
                    type="number"
                    value={poQty}
                    onChange={(e) => setPoQty(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Price per KG (₹)</label>
                  <input
                    type="number"
                    value={poPrice}
                    onChange={(e) => setPoPrice(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Expected Delivery Date</label>
                <input
                  type="date"
                  value={poExpectedDate}
                  onChange={(e) => setPoExpectedDate(e.target.value)}
                  required
                  className="w-full border p-2 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowPoModal(false)} className="px-3 py-1.5 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800">
                  Issue PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
