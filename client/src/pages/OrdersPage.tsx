import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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
  Building2,
  Phone,
  Mail,
  MapPin,
  Edit3,
  Package,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isOwner = user?.role === 'ADMIN';

  // Active Tab: 'ORDERS' or 'PRODUCTS' (Products adding and editing for Plant Owner)
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'PRODUCTS'>('ORDERS');

  const [orders, setOrders] = useState<any[]>([]);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [yarns, setYarns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [reserving, setReserving] = useState(false);

  // Plant Owner: Buyer Details Inspection Modal
  const [inspectedBuyer, setInspectedBuyer] = useState<any | null>(null);

  // Plant Owner: Product Create Modal
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [createCode, setCreateCode] = useState('');
  const [createName, setCreateName] = useState('');
  const [createFabricType, setCreateFabricType] = useState('Cotton Poplin');
  const [createGsm, setCreateGsm] = useState<number>(140);
  const [createWidth, setCreateWidth] = useState<number>(58);
  const [createWeave, setCreateWeave] = useState('Plain 1x1');
  const [createPrice, setCreatePrice] = useState<number>(165);
  const [createRequiresSpinning, setCreateRequiresSpinning] = useState(true);
  const [createDescription, setCreateDescription] = useState('');
  const [includeBom, setIncludeBom] = useState(true);
  const [createYarnId, setCreateYarnId] = useState('');
  const [createYarnRate, setCreateYarnRate] = useState<number>(0.18);
  const [createWastagePct, setCreateWastagePct] = useState<number>(3.0);
  const [submittingCreateProduct, setSubmittingCreateProduct] = useState(false);

  // Plant Owner: Product Edit Modal
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState<number>(165);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editFabricType, setEditFabricType] = useState('');
  const [editGsm, setEditGsm] = useState<number>(140);
  const [editWidth, setEditWidth] = useState<number>(58);
  const [editWeave, setEditWeave] = useState('Plain 1x1');
  const [editRequiresSpinning, setEditRequiresSpinning] = useState(true);
  const [editDescription, setEditDescription] = useState('');
  const [submittingEditProduct, setSubmittingEditProduct] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, fabricsData, yarnsData] = await Promise.all([
        api.get<any[]>('/orders'),
        api.get<any[]>('/buyer-portal/products'),
        isOwner ? api.get<any[]>('/buyer-portal/yarns').catch(() => []) : Promise.resolve([]),
      ]);
      setOrders(ordersData);
      setFabrics(fabricsData);
      setYarns(yarnsData);
      if (yarnsData.length > 0 && !createYarnId) {
        setCreateYarnId(yarnsData[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load order list data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateProductModal = () => {
    let maxNum = 0;
    for (const f of fabrics) {
      const match = f.code?.match(/FAB-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    setCreateCode(`FAB-${String(maxNum + 1).padStart(3, '0')}`);
    setCreateName('');
    setCreateFabricType('Cotton Poplin');
    setCreateGsm(140);
    setCreateWidth(58);
    setCreateWeave('Plain 1x1');
    setCreatePrice(165);
    setCreateRequiresSpinning(true);
    setCreateDescription('');
    setIncludeBom(yarns.length > 0);
    if (yarns.length > 0) {
      setCreateYarnId(yarns[0].id);
      setCreateYarnRate(0.18);
      setCreateWastagePct(3.0);
    }
    setShowCreateProductModal(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createCode.trim() || createPrice <= 0) {
      toast.error('Product title, code, and valid wholesale price are required.');
      return;
    }

    setSubmittingCreateProduct(true);
    try {
      const payload: any = {
        code: createCode.trim().toUpperCase(),
        name: createName.trim(),
        fabricType: createFabricType.trim(),
        gsm: Number(createGsm),
        widthInches: Number(createWidth),
        weaveType: createWeave.trim(),
        unitPricePerMeter: Number(createPrice),
        requiresSpinning: Boolean(createRequiresSpinning),
        description: createDescription.trim() || undefined,
      };

      if (includeBom && createYarnId && createYarnRate > 0) {
        payload.yarnMaterialId = createYarnId;
        payload.yarnQuantityPerMeter = Number(createYarnRate);
        payload.wastagePercentage = Number(createWastagePct || 0);
      }

      await api.post('/buyer-portal/products', payload);
      toast.success(`Product ${createCode} created successfully! Available for buyer ordering.`);
      setShowCreateProductModal(false);
      await loadData();
    } catch (err: any) {
      toast.error('Failed to create product: ' + err.message);
    } finally {
      setSubmittingCreateProduct(false);
    }
  };

  const openEditProductModal = (product: any) => {
    setEditingProduct(product);
    setEditPrice(product.unitPricePerMeter);
    setEditName(product.name);
    setEditCode(product.code);
    setEditFabricType(product.fabricType);
    setEditGsm(product.gsm);
    setEditWidth(product.widthInches);
    setEditWeave(product.weaveType);
    setEditRequiresSpinning(product.requiresSpinning ?? true);
    setEditDescription(product.description || '');
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (Number(editPrice) <= 0) {
      toast.error('Wholesale price must be greater than zero.');
      return;
    }

    setSubmittingEditProduct(true);
    try {
      await api.put(`/buyer-portal/products/${editingProduct.id}`, {
        unitPricePerMeter: Number(editPrice),
        name: editName.trim(),
        code: editCode.trim().toUpperCase(),
        fabricType: editFabricType.trim(),
        gsm: Number(editGsm),
        widthInches: Number(editWidth),
        weaveType: editWeave.trim(),
        requiresSpinning: editRequiresSpinning,
        description: editDescription.trim(),
      });

      toast.success(`Product ${editCode} updated successfully.`);
      setEditingProduct(null);
      await loadData();
    } catch (err: any) {
      toast.error('Failed to update product: ' + err.message);
    } finally {
      setSubmittingEditProduct(false);
    }
  };

  const handleManualReserve = async (orderId: string) => {
    setReserving(true);
    try {
      const res: any = await api.post(`/orders/${orderId}/reserve-yarn`, {});
      toast.success(res.message || 'Yarn allocation updated successfully');
      await loadData();
      if (selectedOrder) {
        const updated = await api.get(`/orders/${orderId}`);
        setSelectedOrder(updated);
      }
    } catch (err: any) {
      toast.error('Reservation error: ' + err.message);
    } finally {
      setReserving(false);
    }
  };

  // Safe search filtering
  const term = searchTerm.toLowerCase().trim();
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !term ||
      o.orderNumber?.toLowerCase().includes(term) ||
      (isOwner && o.buyer?.companyName?.toLowerCase().includes(term)) ||
      (isOwner && o.buyer?.name?.toLowerCase().includes(term)) ||
      o.items?.some((it: any) =>
        (it.fabricProduct?.name || it.specifications || it.color || '')
          .toLowerCase()
          .includes(term)
      );
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredFabrics = fabrics.filter((f) => {
    return (
      !term ||
      f.name?.toLowerCase().includes(term) ||
      f.code?.toLowerCase().includes(term) ||
      f.fabricType?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
            Confirmed
          </span>
        );
      case 'MATERIAL_ALLOCATED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
            BOM Allocated
          </span>
        );
      case 'IN_PRODUCTION':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
            In Loom Production
          </span>
        );
      case 'QUALITY_INSPECTION':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/70">
            Quality Inspection
          </span>
        );
      case 'READY_TO_SHIP':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            Ready to Ship
          </span>
        );
      case 'PARTIALLY_DISPATCHED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/70">
            Partially Dispatched
          </span>
        );
      case 'DISPATCHED':
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
            Dispatched
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
            {status?.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isOwner ? 'Plant Owner Desk' : 'Factory Manufacturing Vault'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Order List</h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isOwner
              ? 'Comprehensive customer purchase orders and product catalog management (Add & Edit products).'
              : 'Factory production queue, fabric roll completion status, and delivery schedules.'}
          </p>
        </div>

        {/* Plant Owner Exclusive Actions: Product Adding */}
        {isOwner && (
          <div className="flex items-center space-x-2.5">
            <button
              onClick={openCreateProductModal}
              className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Fabric Product</span>
            </button>
          </div>
        )}
      </div>

      {/* Owner Navigation Tabs: Orders vs Products */}
      {isOwner && (
        <div className="flex border-b border-zinc-200 bg-white px-2 pt-2 rounded-2xl shadow-xs">
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'ORDERS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Customer Purchase Orders ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('PRODUCTS')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'PRODUCTS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Fabric Products Catalog (Add & Edit) ({fabrics.length})</span>
          </button>
        </div>
      )}

      {/* TAB 1: CUSTOMER ORDERS LIST */}
      {activeTab === 'ORDERS' && (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={isOwner ? "Search Order #, Buyer, or Fabric..." : "Search Order # or Fabric..."}
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
            {loading ? (
              <div className="p-12 text-center text-zinc-400 text-xs font-medium">
                Loading orders list...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 text-xs font-medium">
                No orders match the current criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">Order #</th>
                      {/* Owner can view Buyer Name, hidden for all other portals */}
                      <th className="py-3.5 px-4">
                        {isOwner ? 'Buyer Company & Name' : 'Client Identity'}
                      </th>
                      <th className="py-3.5 px-4">Ordered Products</th>
                      <th className="py-3.5 px-4">Total Meters</th>
                      <th className="py-3.5 px-4">Delivery Due</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {filteredOrders.map((order) => {
                      const totalMeters = order.items?.reduce(
                        (sum: number, it: any) => sum + (it.requiredQuantity || 0),
                        0
                      ) || 0;
                      const itemCount = order.items?.length || 0;

                      return (
                        <tr key={order.id} className="hover:bg-zinc-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                            {order.orderNumber}
                          </td>

                          {/* Buyer Name Column: Visible only to Plant Owner */}
                          <td className="py-3.5 px-4">
                            {isOwner ? (
                              <button
                                type="button"
                                onClick={() => setInspectedBuyer(order.buyer)}
                                className="text-left group cursor-pointer"
                                title="Click to view full buyer contact details"
                              >
                                <span className="font-bold text-indigo-700 group-hover:underline block">
                                  {order.buyer?.companyName || '—'}
                                </span>
                                {order.buyer?.name && (
                                  <span className="text-[11px] text-zinc-500 block">
                                    Contact: {order.buyer.name}
                                  </span>
                                )}
                              </button>
                            ) : (
                              <div>
                                <span className="font-semibold text-zinc-500 block">
                                  Client Confidential
                                </span>
                                <span className="text-[10px] text-zinc-400 block font-mono">
                                  [Owner Restricted]
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Multi-Product List */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              {itemCount > 1 && (
                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 mb-1">
                                  {itemCount} Fabric Products
                                </span>
                              )}
                              {order.items?.map((it: any, i: number) => (
                                <div key={i} className="flex items-center space-x-1.5 text-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                                  <span className="font-semibold text-zinc-900">
                                    {it.fabricProduct?.name || it.specifications?.split('|')?.[0] || 'Fabric Product'}
                                  </span>
                                  <span className="text-[11px] text-zinc-500">
                                    ({it.color} • {it.requiredQuantity?.toLocaleString()}m)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                            {totalMeters.toLocaleString()} M
                          </td>

                          <td className="py-3.5 px-4 text-zinc-600">
                            {new Date(order.requiredDeliveryDate).toLocaleDateString()}
                          </td>

                          <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-3 py-1.5 bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-600 text-zinc-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-zinc-500" />
                              <span>View Order</span>
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
        </>
      )}

      {/* TAB 2: FABRIC PRODUCTS CATALOG (ADD & EDIT FOR PLANT OWNER) */}
      {isOwner && activeTab === 'PRODUCTS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Fabric Products & Wholesale Pricing</h2>
              <p className="text-xs text-zinc-500">
                Add new fabric weaves or edit cost prices per meter. Changes immediately reflect in the buyer procurement catalog.
              </p>
            </div>
            <button
              onClick={openCreateProductModal}
              className="flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Product Name</th>
                    <th className="py-3.5 px-4">Classification</th>
                    <th className="py-3.5 px-4">Density / Width</th>
                    <th className="py-3.5 px-4">Weave Style</th>
                    <th className="py-3.5 px-4">Unit Rate (₹ / m)</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {filteredFabrics.map((f) => (
                    <tr key={f.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                        {f.code}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-zinc-900">
                        {f.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          {f.fabricType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600">
                        {f.gsm} GSM • {f.widthInches}"
                      </td>
                      <td className="py-3.5 px-4 text-zinc-700 font-medium">
                        {f.weaveType}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-indigo-700 text-sm">
                        ₹{f.unitPricePerMeter?.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openEditProductModal(f)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-amber-700" />
                          <span>Edit Product</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Plant Owner Inspects Buyer Details */}
      {inspectedBuyer && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectedBuyer(null);
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Buyer Company Profile</h3>
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                    Plant Owner Verification
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectedBuyer(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Company Name</span>
                  <p className="text-sm font-bold text-zinc-900">{inspectedBuyer.companyName}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Authorized Contact</span>
                  <p className="font-semibold text-zinc-800">{inspectedBuyer.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
                  <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Email Address</span>
                  <p className="font-medium text-zinc-800 truncate" title={inspectedBuyer.email}>
                    {inspectedBuyer.email}
                  </p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
                  <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Phone Number</span>
                  <p className="font-medium text-zinc-800">{inspectedBuyer.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
                <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Consignment Address</span>
                <p className="font-medium text-zinc-800">{inspectedBuyer.address || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
                  <span className="text-[10px] font-semibold uppercase text-zinc-400 block">GSTIN / Tax ID</span>
                  <p className="font-mono font-medium text-zinc-800">{inspectedBuyer.taxNumber || 'Unregistered'}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
                  <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Credit Limit</span>
                  <p className="font-mono font-bold text-emerald-700">{inspectedBuyer.creditLimit != null ? `₹${inspectedBuyer.creditLimit.toLocaleString()}` : 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setInspectedBuyer(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrder(null);
          }}
        >
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
                  {isOwner ? (
                    <>
                      <span className="font-bold text-indigo-700 text-xs block">{selectedOrder.buyer?.companyName}</span>
                      <span className="text-zinc-500 block text-[11px]">{selectedOrder.buyer?.email}</span>
                    </>
                  ) : (
                    <span className="font-semibold text-zinc-500 text-xs block">Client Confidential</span>
                  )}
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
                <h4 className="font-semibold text-zinc-900 mb-2">Order Line Items ({selectedOrder.items?.length || 0})</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="p-3.5 border border-zinc-200/80 rounded-xl space-y-2 bg-zinc-50/40">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-zinc-900">
                          {item.fabricProduct?.name || item.specifications?.split('|')?.[0] || 'Fabric'}
                        </span>
                        <span className="font-medium text-zinc-700">
                          {item.requiredQuantity?.toLocaleString()} Meters ({item.color})
                        </span>
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
                    disabled={reserving}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {reserving ? 'Allocating Yarn...' : 'Allocate & Reserve Yarn'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Plant Owner Add Fabric Product */}
      {showCreateProductModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateProductModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Add New Fabric Product</h3>
                  <p className="text-xs text-zinc-500">Configure new fabric grade for buyer ordering</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateProductModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Fabric Code *</label>
                  <input
                    type="text"
                    required
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 font-mono font-bold text-zinc-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Wholesale Rate (₹ / m) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={createPrice}
                    onChange={(e) => setCreatePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border-2 border-indigo-300 font-bold text-indigo-700 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oxford Poplin 60s"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Classification *</label>
                  <input
                    type="text"
                    required
                    value={createFabricType}
                    onChange={(e) => setCreateFabricType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">GSM *</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={createGsm}
                    onChange={(e) => setCreateGsm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Width (Inches) *</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={createWidth}
                    onChange={(e) => setCreateWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Weave Style *</label>
                <input
                  type="text"
                  required
                  value={createWeave}
                  onChange={(e) => setCreateWeave(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Application specifications, hand-feel, finish details..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowCreateProductModal(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreateProduct}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  {submittingCreateProduct ? 'Saving Product...' : 'Add Fabric Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Plant Owner Edit Fabric Product */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingProduct(null);
          }}
        >
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Edit Product Specifications</h3>
                  <p className="text-xs text-zinc-500 font-mono font-bold">{editCode}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-4 text-xs">
              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80">
                <label className="block text-xs font-bold text-amber-950 mb-1">
                  Wholesale Cost Price (₹ / Meter) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border-2 border-amber-300 font-extrabold text-zinc-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Classification *</label>
                  <input
                    type="text"
                    required
                    value={editFabricType}
                    onChange={(e) => setEditFabricType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">GSM *</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={editGsm}
                    onChange={(e) => setEditGsm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Width (Inches) *</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={editWidth}
                    onChange={(e) => setEditWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Weave Style *</label>
                <input
                  type="text"
                  required
                  value={editWeave}
                  onChange={(e) => setEditWeave(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEditProduct}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  {submittingEditProduct ? 'Saving Changes...' : 'Save Product Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
