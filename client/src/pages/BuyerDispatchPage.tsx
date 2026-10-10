import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Truck,
  Package,
  Search,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const BuyerDispatchPage: React.FC = () => {
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBuyerDispatches();
  }, []);

  const loadBuyerDispatches = async () => {
    setLoading(true);
    try {
      const orders = await api.get<any[]>('/buyer-portal/orders');
      const allDispatches: any[] = [];
      for (const ord of orders) {
        if (ord.dispatches && ord.dispatches.length > 0) {
          for (const d of ord.dispatches) {
            allDispatches.push({
              ...d,
              orderNumber: ord.orderNumber,
              orderId: ord.id,
              products: ord.items?.map((it: any) => it.fabricProduct?.name).join(', '),
            });
          }
        }
      }
      setDispatches(allDispatches);
    } catch (err: any) {
      console.error('Failed to load dispatches:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = dispatches.filter(
    (d) =>
      d.dispatchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-1.5 text-indigo-600 mb-2">
            <Truck className="w-4 h-4 text-indigo-600" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Logistics & Fulfilment</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Shipment & Delivery Tracking</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Track certified roll consignments dispatched from Everest Textile Mills
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Dispatch #, Order #, or Consignment Tracking #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50/50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Dispatches List */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 font-medium text-xs">Loading shipments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-800">No Dispatches Found</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Consignments will appear here once factory quality verification is complete and cargo is in transit.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Dispatch Note #</th>
                  <th className="py-3 px-4">Associated Order</th>
                  <th className="py-3 px-4">Carrier & Tracking Details</th>
                  <th className="py-3 px-4">Dispatch Date</th>
                  <th className="py-3 px-4">Shipment Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {filtered.map((disp, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 text-xs">
                      {disp.dispatchNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-zinc-900 block">{disp.orderNumber}</span>
                      <span className="text-zinc-500 text-[11px]">{disp.products}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-800">Carrier: {disp.carrierName || 'Standard Express'}</div>
                      <div className="font-mono text-zinc-500 text-[11px]">
                        Tracking: {disp.trackingNumber}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-500">
                      {disp.dispatchDate ? new Date(disp.dispatchDate).toLocaleDateString() : 'In Transit'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 inline-flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{disp.status || 'DISPATCHED'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/buyer/orders/${disp.orderId}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-600 text-zinc-700 font-semibold text-xs border border-zinc-200/70 transition"
                      >
                        <span>View Order</span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                      </Link>
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
