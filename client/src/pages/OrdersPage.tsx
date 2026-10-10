import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Eye,
  X,
  FileText,
  Calendar,
  Layers,
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New Order Modal
  const [showModal, setShowModal] = useState(false);
  const [buyerId, setBuyerId] = useState('');
  const [fabricProductId, setFabricProductId] = useState('');
  const [color, setColor] = useState('Optical White');
  const [quantity, setQuantity] = useState(1000);
  const [unitPrice, setUnitPrice] = useState(150);
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState('NORMAL');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<any>(null);

  // Selected Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, buyersData, fabricsData] = await Promise.all([
        api.get<any[]>('/orders'),
        api.get<any[]>('/buyers'),
        api.get<any[]>('/inventory/fabrics'),
      ]);
      setOrders(ordersData);
      setBuyers(buyersData);
      setFabrics(fabricsData);
      if (buyersData.length > 0) setBuyerId(buyersData[0].id);
      if (fabricsData.length > 0) {
        setFabricProductId(fabricsData[0].id);
        setUnitPrice(fabricsData[0].unitPricePerMeter || 150);
      }
    } catch (err) {
      console.error('Failed to load orders data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFabricChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fabId = e.target.value;
    setFabricProductId(fabId);
    const fab = fabrics.find((f) => f.id === fabId);
    if (fab) {
      setUnitPrice(fab.unitPricePerMeter || 150);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalFeedback(null);

    try {
      const payload = {
        buyerId,
        requiredDeliveryDate: new Date(deliveryDate).toISOString(),
        priority,
        notes,
        items: [
          {
            fabricProductId,
            color,
            requiredQuantity: Number(quantity),
            unit: 'METERS',
            unitPrice: Number(unitPrice),
          },
        ],
      };

      const result: any = await api.post('/orders', payload);
      setModalFeedback(result);
      await loadData();
    } catch (err: any) {
      alert('Error creating order: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualReserve = async (orderId: string) => {
    try {
      const res: any = await api.post(`/orders/${orderId}/reserve-yarn`, {});
      alert(res.message);
      await loadData();
      if (selectedOrder) {
        const updated = await api.get(`/orders/${orderId}`);
        setSelectedOrder(updated);
      }
    } catch (err: any) {
      alert('Reservation error: ' + err.message);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.buyer?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/70">
            Confirmed
          </span>
        );
      case 'MATERIAL_ALLOCATED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/70">
            Yarn Allocated
          </span>
        );
      case 'IN_PRODUCTION':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/70">
            In Production
          </span>
        );
      case 'QUALITY_INSPECTION':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/70">
            Quality Check
          </span>
        );
      case 'READY_TO_SHIP':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            Ready to Ship
          </span>
        );
      case 'PARTIALLY_DISPATCHED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/80">
            Partially Shipped
          </span>
        );
      case 'DISPATCHED':
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/80">
            Dispatched
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/80">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Buyer Orders & Planning</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage buyer contracts, calculate BOM yarn requirements, and allocate materials.
          </p>
        </div>
        <button
          onClick={() => {
            setModalFeedback(null);
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Buyer Order</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Order # or Buyer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 border border-zinc-200 rounded-xl bg-zinc-50/50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="MATERIAL_ALLOCATED">Material Allocated</option>
            <option value="IN_PRODUCTION">In Production</option>
            <option value="QUALITY_INSPECTION">Quality Inspection</option>
            <option value="READY_TO_SHIP">Ready to Ship</option>
            <option value="PARTIALLY_DISPATCHED">Partially Dispatched</option>
            <option value="DISPATCHED">Dispatched</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Buyer Company</th>
                <th className="py-3.5 px-4">Fabric Spec</th>
                <th className="py-3.5 px-4">Order Qty</th>
                <th className="py-3.5 px-4">Produced / Passed</th>
                <th className="py-3.5 px-4">Delivery Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400 font-medium">
                    No orders match the current criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const item = order.items?.[0];
                  return (
                    <tr key={order.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900">{order.orderNumber}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-zinc-800 block">{order.buyer?.companyName}</span>
                        <span className="text-[10px] text-zinc-400 block">{order.buyer?.name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-zinc-800 block">{item?.fabricProduct?.name || 'Fabric'}</span>
                        <span className="text-[10px] text-zinc-500 block">Color: {item?.color}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-900">
                        {item?.requiredQuantity?.toLocaleString()} M
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col space-y-1">
                          <span className="text-[11px] font-medium text-zinc-700">
                            Prod: {item?.producedQuantity || 0} M | Passed: {item?.passedQuantity || 0} M
                          </span>
                          <div className="w-24 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((item?.passedQuantity || 0) / (item?.requiredQuantity || 1)) * 100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600">
                        {new Date(order.requiredDeliveryDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-600 text-zinc-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ORDER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-zinc-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 mb-4">
              <h2 className="text-base font-bold text-zinc-900 flex items-center space-x-2 tracking-tight">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <span>Create New Buyer Order</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalFeedback ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border ${
                    modalFeedback.hasShortage
                      ? 'bg-amber-50 border-amber-200/70 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200/70 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {modalFeedback.hasShortage ? (
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                    )}
                    <h3 className="font-semibold text-sm">
                      {modalFeedback.hasShortage
                        ? 'Material Shortage Detected — Purchase Request Raised!'
                        : 'Yarn Available — Materials Successfully Allocated!'}
                    </h3>
                  </div>

                  <p className="text-xs mt-2">
                    Order <strong>{modalFeedback.order.orderNumber}</strong> saved successfully.
                  </p>

                  <div className="mt-3 bg-white p-3 rounded-lg border border-zinc-200/80 space-y-2 text-xs">
                    <p className="font-semibold text-zinc-800">BOM Material Breakdown:</p>
                    {modalFeedback.materialRequirements?.map((m: any) => (
                      <div key={m.yarnMaterialId} className="flex justify-between border-b border-zinc-100 pb-1">
                        <span>{m.yarnName} ({m.yarnCode}):</span>
                        <span className="font-mono">
                          Need: {m.requiredKg.toFixed(1)} KG | Avail: {m.availableKg.toFixed(1)} KG
                          {m.hasShortage && <strong className="text-rose-600 ml-1">(-{m.shortageKg.toFixed(1)} KG)</strong>}
                        </span>
                      </div>
                    ))}
                  </div>

                  {modalFeedback.generatedPurchaseRequests?.length > 0 && (
                    <div className="mt-3 p-2 bg-zinc-100 rounded-lg text-[11px] text-zinc-800 font-medium border border-zinc-200">
                      ✓ Created Purchase Request(s):{' '}
                      {modalFeedback.generatedPurchaseRequests.map((pr: any) => pr.requestNumber).join(', ')}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setModalFeedback(null);
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateOrder} className="space-y-4">
                {/* Buyer selection */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Select Buyer</label>
                  <select
                    value={buyerId}
                    onChange={(e) => setBuyerId(e.target.value)}
                    required
                    className="w-full border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-800 bg-zinc-50/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition"
                  >
                    {buyers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.companyName} ({b.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fabric Product selection */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Fabric Product</label>
                  <select
                    value={fabricProductId}
                    onChange={handleFabricChange}
                    required
                    className="w-full border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-800 bg-zinc-50/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition"
                  >
                    {fabrics.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code} - {f.name} ({f.fabricType}, {f.gsm} GSM)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Color / Shade</label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      required
                      placeholder="e.g. Navy Blue 19-4010"
                      className="w-full border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-800 bg-zinc-50/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Quantity (Meters)</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      required
                      min={100}
                      step={50}
                      className="w-full border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-800 bg-zinc-50/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Unit Price (₹/Meter)</label>
                    <input
                      type="number"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      required
                      min={10}
                      step={5}
                      className="w-full border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-800 bg-zinc-50/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Required Delivery Date</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      required
                      className="w-full border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-800 bg-zinc-50/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-800 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition"
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Estimated Total</label>
                    <div className="p-2.5 border border-zinc-200 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-900">
                      ₹{(quantity * unitPrice).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Special Specifications / Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Warp/weft specs, finish requirements..."
                    className="w-full border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-800 bg-zinc-50/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition"
                  ></textarea>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
                  >
                    {submitting ? 'Calculating BOM & Saving...' : 'Save Order & Check Yarn'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VIEW ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-zinc-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 mb-4">
              <div>
                <span className="text-base font-bold text-zinc-900 tracking-tight">Order: {selectedOrder.orderNumber}</span>
                <span className="ml-2.5">{getStatusBadge(selectedOrder.status)}</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80">
                <div>
                  <span className="text-zinc-500 block text-[11px] font-medium">Buyer:</span>
                  <span className="font-semibold text-zinc-900 text-xs">{selectedOrder.buyer?.companyName}</span>
                  <span className="text-zinc-500 block text-[11px]">{selectedOrder.buyer?.email}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px] font-medium">Delivery Due:</span>
                  <span className="font-semibold text-zinc-900 text-xs">
                    {new Date(selectedOrder.requiredDeliveryDate).toLocaleDateString()}
                  </span>
                  <span className="text-zinc-700 font-medium block">Total: ₹{selectedOrder.totalAmount?.toLocaleString()}</span>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-zinc-900 mb-2">Order Line Items & Progress</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="p-3.5 border border-zinc-200/80 rounded-xl space-y-2 bg-zinc-50/40">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-zinc-900">{item.fabricProduct?.name || 'Fabric'}</span>
                        <span className="font-medium text-zinc-700">{item.requiredQuantity} Meters ({item.color})</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                        <div className="p-2 bg-white rounded-lg border border-zinc-200 text-zinc-800">
                          Produced: <strong className="font-semibold">{item.producedQuantity || 0}m</strong>
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-200/50 rounded-lg">
                          Passed: <strong className="font-semibold">{item.passedQuantity || 0}m</strong>
                        </div>
                        <div className="p-2 bg-amber-50 text-amber-800 border border-amber-200/50 rounded-lg">
                          Rework: <strong className="font-semibold">{item.reworkQuantity || 0}m</strong>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-800 border border-blue-200/50 rounded-lg">
                          Dispatched: <strong className="font-semibold">{item.dispatchedQuantity || 0}m</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedOrder.status === 'CONFIRMED' && (
                <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between">
                  <span className="text-zinc-700 font-medium text-xs">Yarn stock available for reservation?</span>
                  <button
                    onClick={() => handleManualReserve(selectedOrder.id)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    Allocate & Reserve Yarn
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
