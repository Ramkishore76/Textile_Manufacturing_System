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
      // In buyer portal, orders include all associated dispatches
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 mb-1">
            <Truck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Logistics & Fulfilment</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shipment & Delivery Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track certified roll consignments dispatched from Everest Textile Mills
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Dispatch #, Order #, or Consignment Tracking #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Dispatches List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading shipments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Dispatches Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Consignments will appear here once factory quality verification is complete and cargo is in transit.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Dispatch Note #</th>
                  <th className="py-3 px-4">Associated Order</th>
                  <th className="py-3 px-4">Carrier & Tracking Details</th>
                  <th className="py-3 px-4">Dispatch Date</th>
                  <th className="py-3 px-4">Shipment Status</th>
                  <th className="py-3 px-4 text-right">Order View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((disp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700 text-sm">
                      {disp.dispatchNumber}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{disp.orderNumber}</span>
                      <span className="text-slate-400 text-[10px]">{disp.products}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">Carrier Assigned</div>
                      <div className="font-mono text-teal-600 font-bold text-[11px]">
                        Tracking: {disp.trackingNumber}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {disp.dispatchDate ? new Date(disp.dispatchDate).toLocaleDateString() : 'In Transit'}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1 w-max">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{disp.status || 'DISPATCHED'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/buyer/orders/${disp.orderId}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs transition"
                      >
                        <span>View Order</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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
