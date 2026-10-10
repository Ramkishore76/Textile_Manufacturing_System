import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Package,
  Search,
  Filter,
  Clock,
  Truck,
  FileCheck2,
  ChevronRight,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BuyerOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get<any[]>('/buyer-portal/orders');
      setOrders(res);
    } catch (err: any) {
      console.error('Failed to load buyer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.items?.some((it: any) => it.fabricProduct?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-1.5 text-zinc-500 mb-2">
            <Package className="w-4 h-4 text-indigo-600" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">Manufacturing Pipeline</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Purchase Orders</h1>
          <p className="text-xs text-zinc-500 mt-1">
            End-to-end visibility into loom production, quality grading, and certified roll dispatches
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Order # or fabric product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50/50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-zinc-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Stage:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          >
            <option value="ALL">All Stages</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="MATERIAL_ALLOCATED">Material Allocated</option>
            <option value="IN_PRODUCTION">In Production</option>
            <option value="QUALITY_INSPECTION">Quality Inspection</option>
            <option value="READY_TO_SHIP">Ready to Ship</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 font-medium text-xs">Loading purchase orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-800">No Orders Found</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Try resetting the stage filter or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Fabric Specifications</th>
                  <th className="py-3 px-4">Ordered Quantity</th>
                  <th className="py-3 px-4">Required Delivery</th>
                  <th className="py-3 px-4">Lifecycle Stage</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {filteredOrders.map((ord) => {
                  const totalQty = ord.items?.reduce((sum: number, it: any) => sum + it.requiredQuantity, 0) || 0;
                  return (
                    <tr
                      key={ord.id}
                      onClick={() => navigate(`/buyer/orders/${ord.id}`)}
                      className="hover:bg-zinc-50/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 text-xs">
                        {ord.orderNumber}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-500">
                        {new Date(ord.orderDate).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4">
                        {ord.items?.map((it: any, i: number) => (
                          <div key={i} className="font-semibold text-zinc-900">
                            {it.fabricProduct?.name} ({it.color})
                          </div>
                        ))}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-800">
                        {totalQty.toLocaleString()} meters
                      </td>

                      <td className="py-3.5 px-4 text-zinc-600">
                        {new Date(ord.requiredDeliveryDate).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            ord.status === 'READY_TO_SHIP'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                              : ord.status === 'IN_PRODUCTION'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/70'
                              : ord.status === 'DISPATCHED'
                              ? 'bg-zinc-100 text-zinc-800 border border-zinc-200/80'
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-200/80'
                          }`}
                        >
                          {ord.status?.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                        ₹{ord.totalAmount?.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/buyer/orders/${ord.id}`)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-600 text-zinc-700 font-semibold text-xs border border-zinc-200/70 transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Track</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
