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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 mb-1">
            <Package className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Manufacturing Pipeline</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Purchase Orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            Live visibility into loom production, quality grading, and finished roll dispatches
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Order # or fabric product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase">Stage:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading your orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Orders Match Filter</h3>
            <p className="text-xs text-slate-400 mt-1">Try resetting the stage filter or search keyword.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.map((ord) => {
                  const totalQty = ord.items?.reduce((sum: number, it: any) => sum + it.requiredQuantity, 0) || 0;
                  return (
                    <tr
                      key={ord.id}
                      onClick={() => navigate(`/buyer/orders/${ord.id}`)}
                      className="hover:bg-teal-50/30 transition cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-teal-700 text-sm">
                        {ord.orderNumber}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {new Date(ord.orderDate).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4">
                        {ord.items?.map((it: any, i: number) => (
                          <div key={i} className="font-semibold text-slate-800">
                            {it.fabricProduct?.name} ({it.color})
                          </div>
                        ))}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {totalQty.toLocaleString()} meters
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {new Date(ord.requiredDeliveryDate).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.status === 'READY_TO_SHIP'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'IN_PRODUCTION'
                              ? 'bg-blue-100 text-blue-800'
                              : ord.status === 'DISPATCHED'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {ord.status?.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                        ₹{ord.totalAmount?.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/buyer/orders/${ord.id}`)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Track Progress</span>
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
