import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Send,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  FileText,
  Search,
  Plus,
  RefreshCw,
  QrCode,
  Package,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';

export const DispatchPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Dispatch Form State
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [eligibleRolls, setEligibleRolls] = useState<any[]>([]);
  const [selectedRollIds, setSelectedRollIds] = useState<string[]>([]);
  const [carrierName, setCarrierName] = useState<string>('BlueDart Logistics');
  const [vehicleNumber, setVehicleNumber] = useState<string>('TN-38-BZ-4412');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('Handle with care - Moisture barrier wrapped.');
  const [generateInvoice, setGenerateInvoice] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, historyRes] = await Promise.all([
        api.get<any[]>('/orders'),
        api.get<any[]>('/dispatch/history'),
      ]);
      setOrders(ordersRes);
      setHistory(historyRes);
    } catch (err: any) {
      console.error('Failed to load dispatch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setSelectedRollIds([]);
    setErrorMessage(null);
    if (!orderId) {
      setEligibleRolls([]);
      return;
    }

    try {
      const rolls = await api.get<any[]>(`/dispatch/eligible-rolls/${orderId}`);
      setEligibleRolls(rolls);
    } catch (err: any) {
      setErrorMessage('Failed to fetch eligible rolls: ' + err.message);
    }
  };

  const toggleRoll = (rollId: string) => {
    if (selectedRollIds.includes(rollId)) {
      setSelectedRollIds(selectedRollIds.filter((id) => id !== rollId));
    } else {
      setSelectedRollIds([...selectedRollIds, rollId]);
    }
  };

  const selectAllRolls = () => {
    if (selectedRollIds.length === eligibleRolls.length) {
      setSelectedRollIds([]);
    } else {
      setSelectedRollIds(eligibleRolls.map((r) => r.id));
    }
  };

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setErrorMessage('Please select an order to dispatch.');
      return;
    }
    if (selectedRollIds.length === 0) {
      setErrorMessage('Please select at least one roll for this dispatch.');
      return;
    }
    if (!carrierName.trim()) {
      setErrorMessage('Carrier/Logistics provider name is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.post<any>('/dispatch/create', {
        orderId: selectedOrderId,
        carrierName,
        vehicleNumber,
        trackingNumber: trackingNumber.trim() || undefined,
        rollIds: selectedRollIds,
        notes,
        generateInvoice,
      });

      setSuccessMessage(
        `Shipment ${res.dispatch.dispatchNumber} successfully created with ${res.dispatch.totalRolls} rolls (${res.dispatch.totalMeters}m)! ${
          res.invoice ? `Invoice ${res.invoice.invoiceNumber} generated.` : ''
        }`
      );

      // Reset selection
      setSelectedOrderId('');
      setEligibleRolls([]);
      setSelectedRollIds([]);
      setTrackingNumber('');

      // Refresh data
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Dispatch creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTotalMeters = eligibleRolls
    .filter((r) => selectedRollIds.includes(r.id))
    .reduce((sum, r) => sum + r.lengthMeters, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Dispatch & Shipment Management</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Roll shipments, consignment tracking, duplicate prevention, and invoice generation.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 font-semibold text-xs shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs flex items-center space-x-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/70 text-rose-800 text-xs flex items-center space-x-2.5 animate-in fade-in">
          <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Section 1: Create Dispatch Form */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-zinc-900 flex items-center space-x-2">
          <Send className="w-4 h-4 text-indigo-600" />
          <span>Prepare New Dispatch Shipment</span>
        </h2>

        <form onSubmit={handleCreateDispatch} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Order Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Select Buyer Order *
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => handleOrderChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-800 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                required
              >
                <option value="">-- Choose an active order --</option>
                {orders
                  .filter((o) => !['DISPATCHED', 'DELIVERED', 'CANCELLED'].includes(o.status))
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.buyer?.companyName} ({o.status})
                    </option>
                  ))}
              </select>
            </div>

            {/* Carrier Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Logistics Carrier *
              </label>
              <input
                type="text"
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                placeholder="e.g. BlueDart / VRL Logistics"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-800 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                required
              />
            </div>

            {/* Vehicle Number */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Transport Vehicle No.
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. TN-38-BZ-4412"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-800 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tracking Number */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Consignment / Tracking Number (Optional)
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Leave blank for auto-generated tracking"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-800 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Shipment Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Dispatch handling instructions"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-800 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Roll Selection Table */}
          {selectedOrderId && (
            <div className="border border-zinc-200/80 rounded-2xl overflow-hidden mt-3 shadow-xs">
              <div className="bg-zinc-50/80 p-3.5 border-b border-zinc-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-zinc-800">
                    Eligible Passed Rolls ({eligibleRolls.length} available)
                  </span>
                </div>
                {eligibleRolls.length > 0 && (
                  <button
                    type="button"
                    onClick={selectAllRolls}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    {selectedRollIds.length === eligibleRolls.length ? 'Deselect All' : 'Select All Rolls'}
                  </button>
                )}
              </div>

              {eligibleRolls.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-xs italic">
                  No eligible quality-passed rolls currently in finished stock for this order. Ensure production & quality inspection are passed.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-50/40 text-zinc-500 font-semibold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">Select</th>
                        <th className="py-2.5 px-3">Roll ID</th>
                        <th className="py-2.5 px-3">Fabric Item</th>
                        <th className="py-2.5 px-3">Length</th>
                        <th className="py-2.5 px-3">Quality Grade</th>
                        <th className="py-2.5 px-3">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-700">
                      {eligibleRolls.map((roll) => {
                        const isChecked = selectedRollIds.includes(roll.id);
                        return (
                          <tr
                            key={roll.id}
                            onClick={() => toggleRoll(roll.id)}
                            className={`cursor-pointer hover:bg-zinc-50/60 transition-colors ${
                              isChecked ? 'bg-indigo-50/40 font-medium' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleRoll(roll.id)}
                                className="rounded-md border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-zinc-900">{roll.rollId}</td>
                            <td className="py-2.5 px-3 text-zinc-700">{roll.orderItem?.fabricProduct?.name || 'Fabric Roll'}</td>
                            <td className="py-2.5 px-3 font-semibold text-zinc-900">{roll.lengthMeters} m</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                                {roll.qualityGrade || 'PASSED'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-zinc-500">
                              {roll.location ? `${roll.location.bin}` : 'FG Bay'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Selection Summary */}
              {selectedRollIds.length > 0 && (
                <div className="bg-zinc-50 p-3.5 border-t border-zinc-200/80 flex items-center justify-between text-xs text-zinc-900 font-semibold">
                  <span>
                    Selected for Dispatch: {selectedRollIds.length} rolls ({selectedTotalMeters.toLocaleString()} meters)
                  </span>
                  <span className="text-emerald-700 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verified Ready for Transit</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Invoice Generation Checkbox */}
          <div className="flex items-center space-x-2.5 pt-1">
            <input
              type="checkbox"
              id="genInvoice"
              checked={generateInvoice}
              onChange={(e) => setGenerateInvoice(e.target.checked)}
              className="rounded-md border-zinc-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <label htmlFor="genInvoice" className="text-xs font-medium text-zinc-700 cursor-pointer">
              Automatically generate Commercial Invoice (with 5% GST & 30-day net terms) for this shipment
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting || selectedRollIds.length === 0}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition ${
                submitting || selectedRollIds.length === 0
                  ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Confirming Dispatch...' : 'Confirm & Execute Dispatch'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Dispatch History */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-zinc-50/80 border-b border-zinc-200/80 flex items-center justify-between text-xs">
          <div>
            <h3 className="font-bold text-zinc-900">Shipment & Dispatch History</h3>
            <p className="text-[11px] text-zinc-500">Chronological record of all executed deliveries</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200/80">
            {history.length} Shipments
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs font-medium">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 text-xs italic">No shipments recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50/40 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Dispatch #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Buyer Company</th>
                  <th className="py-3 px-4">Carrier & Tracking</th>
                  <th className="py-3 px-4">Total Rolls & Meters</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {history.map((disp) => (
                  <tr key={disp.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                      {disp.dispatchNumber}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500">
                      {new Date(disp.dispatchDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-zinc-900">
                      {disp.order?.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-700">
                      {disp.buyer?.companyName}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900">{disp.carrierName}</div>
                      <div className="font-mono text-[10px] text-zinc-400">
                        Track: {disp.trackingNumber || 'N/A'} {disp.vehicleNumber ? `(${disp.vehicleNumber})` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-zinc-900">{disp.totalRolls} rolls</span>
                      <span className="text-zinc-500 text-[10px] block font-mono">
                        {disp.totalMeters.toLocaleString()} m
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200/80">
                        {disp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {disp.invoices && disp.invoices.length > 0 ? (
                        <div className="flex items-center space-x-1.5 text-zinc-900 font-mono font-semibold text-[11px]">
                          <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{disp.invoices[0].invoiceNumber}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic text-[10px]">No invoice</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
