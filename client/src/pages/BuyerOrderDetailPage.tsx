import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  Truck,
  FileCheck2,
  Package,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  QrCode,
  ExternalLink
} from 'lucide-react';

export const BuyerOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [orderData, setOrderData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadOrderDetail(id);
    }
  }, [id]);

  const loadOrderDetail = async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<any>(`/buyer-portal/orders/${orderId}`);
      setOrderData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-medium">
        Loading order lifecycle timeline...
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-rose-600 font-bold">{error || 'Order record could not be loaded.'}</p>
        <button
          onClick={() => navigate('/buyer/orders')}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
        >
          Return to Orders
        </button>
      </div>
    );
  }

  const { order, stages } = orderData;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/buyer/orders')}
            className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Order #{order.orderNumber}</h1>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  order.status === 'READY_TO_SHIP'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                    : order.status === 'IN_PRODUCTION'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200/60'
                    : order.status === 'DISPATCHED'
                    ? 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                    : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                }`}
              >
                {order.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Booked: {new Date(order.orderDate).toLocaleDateString()} | Delivery Target: {new Date(order.requiredDeliveryDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="text-left md:text-right">
          <span className="text-xs text-neutral-500 block font-medium uppercase tracking-wide">Total Order Value</span>
          <span className="text-2xl font-bold tracking-tight text-neutral-900 font-mono">
            ₹{order.totalAmount?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 7-Step Visual Stage Progress Bar */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs overflow-x-auto">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-6">
          End-to-End Production & Delivery Pipeline
        </h3>

        <div className="flex items-center justify-between min-w-[750px] relative px-4">
          {/* Background Connecting Line */}
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-neutral-200 z-0"></div>

          {stages.map((st: any, idx: number) => {
            const isCompleted = st.completed;
            const isCurrent = st.current;

            return (
              <div key={st.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-medium text-xs transition ${
                    isCompleted
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-neutral-800 text-white ring-4 ring-neutral-200'
                      : 'bg-white text-neutral-400 border border-neutral-300'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>

                <span
                  className={`text-[11px] font-medium mt-2 text-center max-w-[90px] ${
                    isCompleted || isCurrent ? 'text-neutral-900' : 'text-neutral-400'
                  }`}
                >
                  {st.label}
                </span>

                {isCurrent && (
                  <span className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-800 border border-neutral-200">
                    Active
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fabric Product Specification */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 tracking-tight flex items-center space-x-2">
            <Layers className="w-4 h-4 text-neutral-500" />
            <span>Fabric Item Specifications</span>
          </h3>

          <div className="space-y-3 pt-1">
            {order.items?.map((item: any, i: number) => (
              <div key={i} className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-neutral-900 text-sm">{item.fabricProduct?.name}</h4>
                    <p className="text-xs text-neutral-500">Fabric Type: {item.fabricProduct?.fabricType}</p>
                  </div>
                  <span className="font-mono font-bold text-neutral-900 text-sm">
                    {item.requiredQuantity} meters
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-neutral-200">
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-medium">GSM Weight</span>
                    <span className="font-medium text-neutral-800">{item.fabricProduct?.gsm || '140'} GSM</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-medium">Loom Width</span>
                    <span className="font-medium text-neutral-800">{item.fabricProduct?.widthInches || '58'}"</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-medium">Weave Style</span>
                    <span className="font-medium text-neutral-800">{item.fabricProduct?.weaveType || 'Plain Weave'}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-neutral-500">Color / Shade: <strong className="text-neutral-800 font-medium">{item.color}</strong></span>
                  <span className="text-neutral-700 font-medium">
                    Dispatched: {item.dispatchedQuantity || 0} / {item.requiredQuantity} m
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Produced Rolls Certified */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 tracking-tight flex items-center space-x-2">
              <QrCode className="w-4 h-4 text-neutral-500" />
              <span>Certified Fabric Rolls ({order.rolls?.length || 0})</span>
            </h3>
            <span className="text-xs font-medium text-neutral-400">Inspected by Everest QC</span>
          </div>

          {order.rolls && order.rolls.length > 0 ? (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {order.rolls.map((r: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-neutral-900">{r.rollId}</span>
                    <span className="text-neutral-400 text-[10px] block">
                      Manufactured: {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="font-mono font-bold text-neutral-900 text-sm block">
                      {r.lengthMeters} m
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                        r.qualityStatus === 'PASSED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                          : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                      }`}
                    >
                      {r.qualityStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-neutral-400 text-xs italic">
              Rolls are currently being produced on the weaving looms. QC records will appear automatically as rolls are certified.
            </div>
          )}
        </div>
      </div>

      {/* Shipments & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dispatches */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 tracking-tight flex items-center space-x-2">
            <Truck className="w-4 h-4 text-neutral-500" />
            <span>Shipments & Logistics</span>
          </h3>

          {order.dispatches && order.dispatches.length > 0 ? (
            <div className="space-y-2.5">
              {order.dispatches.map((disp: any) => (
                <div key={disp.id} className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-neutral-900 text-xs">{disp.dispatchNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                      {disp.status}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-600">
                    Carrier: <strong>{disp.carrierName}</strong> | Tracking: <strong className="font-mono">{disp.trackingNumber}</strong>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Dispatched Date: {new Date(disp.dispatchDate).toLocaleDateString()} ({disp.totalRolls} rolls - {disp.totalMeters}m)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-neutral-400 text-xs italic">
              No shipments dispatched yet for this order.
            </div>
          )}
        </div>

        {/* Commercial Invoices */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 tracking-tight flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-neutral-500" />
            <span>Commercial Invoices</span>
          </h3>

          {order.invoices && order.invoices.length > 0 ? (
            <div className="space-y-2.5">
              {order.invoices.map((inv: any) => (
                <div key={inv.id} className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-neutral-900 text-xs">{inv.invoiceNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                          : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500">Total Invoice (incl 5% GST):</span>
                    <span className="font-mono font-semibold text-neutral-900">₹{inv.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500">Paid / Balance:</span>
                    <span className="font-mono text-neutral-800 font-medium">
                      ₹{inv.paidAmount?.toLocaleString()} / <span className="text-neutral-600">₹{inv.balanceAmount?.toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-neutral-400 text-xs italic">
              Commercial invoice will be generated upon roll dispatch.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
