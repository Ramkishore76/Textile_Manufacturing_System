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
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-1.5 text-neutral-500 mb-1">
            <Truck className="w-4 h-4 text-neutral-500" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Logistics & Fulfilment</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Shipment & Delivery Tracking</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Track certified roll consignments dispatched from Everest Textile Mills
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Dispatch #, Order #, or Consignment Tracking #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
          />
        </div>
      </div>

      {/* Dispatches List */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-neutral-400 font-medium text-xs">Loading shipments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-neutral-800">No Dispatches Found</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Consignments will appear here once factory quality verification is complete and cargo is in transit.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Dispatch Note #</th>
                  <th className="py-2.5 px-4">Associated Order</th>
                  <th className="py-2.5 px-4">Carrier & Tracking Details</th>
                  <th className="py-2.5 px-4">Dispatch Date</th>
                  <th className="py-2.5 px-4">Shipment Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {filtered.map((disp, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-neutral-900 text-xs">
                      {disp.dispatchNumber}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-neutral-900 block">{disp.orderNumber}</span>
                      <span className="text-neutral-500 text-[11px]">{disp.products}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-800">Carrier: {disp.carrierName || 'Standard Express'}</div>
                      <div className="font-mono text-neutral-600 text-[11px]">
                        Tracking: {disp.trackingNumber}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-neutral-500">
                      {disp.dispatchDate ? new Date(disp.dispatchDate).toLocaleDateString() : 'In Transit'}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60 inline-flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>{disp.status || 'DISPATCHED'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/buyer/orders/${disp.orderId}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium text-xs border border-neutral-200 transition"
                      >
                        <span>View Order</span>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-600" />
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
