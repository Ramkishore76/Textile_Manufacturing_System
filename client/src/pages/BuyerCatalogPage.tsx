import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShoppingBag,
  ShoppingCart,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Plus,
  X,
  DollarSign,
  ShieldCheck,
  Tag,
  PackageCheck,
  Info,
} from 'lucide-react';

interface FabricProduct {
  id: string;
  code: string;
  name: string;
  fabricType: string;
  gsm: number;
  widthInches: number;
  weaveType: string;
  unitPricePerMeter: number;
  requiresSpinning: boolean;
  description: string | null;
  inStockMeters?: number;
  materials?: any[];
}

export const BuyerCatalogPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const isStaff = user?.role === 'ADMIN' || user?.role === 'STORE';
  const roleTitle = user?.role === 'ADMIN' ? 'Plant Owner' : user?.role === 'STORE' ? 'Store Manager' : 'Buyer';

  const [products, setProducts] = useState<FabricProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Edit Product Modal State (for Plant Owner & Store Manager)
  const [editingProduct, setEditingProduct] = useState<FabricProduct | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editName, setEditName] = useState<string>('');
  const [editCode, setEditCode] = useState<string>('');
  const [editFabricType, setEditFabricType] = useState<string>('');
  const [editGsm, setEditGsm] = useState<number>(0);
  const [editWidth, setEditWidth] = useState<number>(0);
  const [editWeave, setEditWeave] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editRequiresSpinning, setEditRequiresSpinning] = useState<boolean>(true);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Order Placement Modal State (for Actual Buyer & Order Placing Flow)
  const [orderingProduct, setOrderingProduct] = useState<FabricProduct | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(1000);
  const [orderColor, setOrderColor] = useState<string>('Pure White');
  const [orderDeliveryDate, setOrderDeliveryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21); // 3 weeks standard lead time
    return d.toISOString().split('T')[0];
  });
  const [orderPriority, setOrderPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);

  // Preview Mode Toggle for Staff
  const [staffPreviewBuyerMode, setStaffPreviewBuyerMode] = useState<boolean>(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.get<FabricProduct[]>('/buyer-portal/products');
      setProducts(data);
    } catch (err: any) {
      toast.error('Failed to load fabric catalog: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (p: FabricProduct) => {
    setEditingProduct(p);
    setEditPrice(p.unitPricePerMeter);
    setEditName(p.name);
    setEditCode(p.code);
    setEditFabricType(p.fabricType);
    setEditGsm(p.gsm);
    setEditWidth(p.widthInches);
    setEditWeave(p.weaveType);
    setEditDescription(p.description || '');
    setEditRequiresSpinning(p.requiresSpinning);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (editPrice <= 0) {
      toast.error('Unit price must be greater than zero.');
      return;
    }

    setSavingEdit(true);
    try {
      await api.put(`/buyer-portal/products/${editingProduct.id}`, {
        name: editName,
        code: editCode,
        fabricType: editFabricType,
        gsm: Number(editGsm),
        widthInches: Number(editWidth),
        weaveType: editWeave,
        unitPricePerMeter: Number(editPrice),
        description: editDescription,
        requiresSpinning: editRequiresSpinning,
      });

      toast.success(`${editName} details and cost price updated to ₹${editPrice}/m!`);
      setEditingProduct(null);
      await loadProducts();
    } catch (err: any) {
      toast.error('Failed to update product: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const openOrderModal = (p: FabricProduct) => {
    setOrderingProduct(p);
    setOrderQuantity(1000);
    setOrderColor('Pure White');
    setOrderPriority('NORMAL');
    setOrderNotes('');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderingProduct) return;
    if (orderQuantity < 10) {
      toast.error('Minimum order quantity is 10 meters.');
      return;
    }

    setSubmittingOrder(true);
    try {
      const res = await api.post<any>('/buyer-portal/orders', {
        fabricProductId: orderingProduct.id,
        requiredQuantity: Number(orderQuantity),
        color: orderColor,
        requiredDeliveryDate: orderDeliveryDate,
        priority: orderPriority,
        notes: orderNotes,
      });

      toast.success(`Purchase Order #${res.orderNumber} successfully booked! Total: ₹${res.totalAmount?.toLocaleString()}`);
      setOrderingProduct(null);
      navigate(`/buyer/orders/${res.orderId}`);
    } catch (err: any) {
      toast.error('Failed to book purchase order: ' + err.message);
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Color Swatches
  const colorPresets = [
    { name: 'Pure White', bg: '#ffffff', border: '#e4e4e7' },
    { name: 'Optical White', bg: '#f8fafc', border: '#cbd5e1' },
    { name: 'Khaki Sand', bg: '#e2d9c8', border: '#c7bca9' },
    { name: 'Royal Navy', bg: '#1e3a8a', border: '#172554' },
    { name: 'Indigo Blue', bg: '#1d4ed8', border: '#1e40af' },
    { name: 'Sky Blue Melange', bg: '#bae6fd', border: '#7dd3fc' },
    { name: 'Carbon Black', bg: '#18181b', border: '#09090b' },
    { name: 'Olive Army', bg: '#4d5d3e', border: '#3f4e32' },
  ];

  // Filtering
  const fabricTypes = ['ALL', ...Array.from(new Set(products.map((p) => p.fabricType)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fabricType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.weaveType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || p.fabricType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Role Management Indicator Banner (for Store Manager & Plant Owner) */}
      {isStaff && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-indigo-700/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-bold tracking-tight text-white uppercase">
                    {roleTitle} Administrative Portal Control
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 uppercase">
                    Authorized
                  </span>
                </div>
                <p className="text-xs text-indigo-200 mt-0.5">
                  You are authorized to modify fabric product specifications, minimum order parameters, and wholesale unit cost prices.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => setStaffPreviewBuyerMode(!staffPreviewBuyerMode)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  staffPreviewBuyerMode
                    ? 'bg-amber-400 text-amber-950 border-amber-300 font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                {staffPreviewBuyerMode ? 'Exit Buyer Order Preview' : '👁️ Preview Customer Order View'}
              </button>

              <button
                onClick={() => navigate('/app/dashboard')}
                className="px-3.5 py-1.5 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold shadow-xs transition"
              >
                Factory ERP (/app) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 mb-2">
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Direct B2B Fabric Sourcing & Order Desk</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              {isStaff && !staffPreviewBuyerMode
                ? 'Fabric Product Catalog & Cost Price Management'
                : 'Fabric Products & Purchase Order Placement'}
            </h1>
            <p className="text-xs text-zinc-500 mt-1 max-w-2xl font-medium">
              {isStaff && !staffPreviewBuyerMode
                ? 'Manage client-facing product listings, weave specifications, GSM densities, and wholesale unit rates per meter.'
                : 'Select verified export-grade fabrics, configure custom roll meters and dye shades, review instant pricing, and submit confirmed purchase orders.'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/buyer/orders')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition"
            >
              <span>Track My Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search fabrics by name, code, weave, or fiber type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50/50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {fabricTypes.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedType === t
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-zinc-100/80 hover:bg-zinc-200/80 text-zinc-700'
              }`}
            >
              {t === 'ALL' ? 'All Fabrics' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Product Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-zinc-100 shimmer-block border border-zinc-200"></div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center shadow-xs">
          <ShoppingBag className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-800">No fabric products match your search</h3>
          <p className="text-xs text-zinc-500 mt-1">Try clearing your search filters or browse all fabrics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => {
            const canEdit = isStaff && !staffPreviewBuyerMode;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-zinc-200/80 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Product Card Top */}
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {p.code}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      {p.fabricType}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {p.name}
                  </h3>

                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2 min-h-[32px]">
                    {p.description || 'Premium commercial fabric manufactured on computerized rapier looms.'}
                  </p>

                  {/* Specifications Badge Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-zinc-100 text-center">
                    <div className="bg-zinc-50/80 rounded-xl p-2 border border-zinc-100">
                      <p className="text-[10px] uppercase font-semibold text-zinc-400">Density</p>
                      <p className="text-xs font-bold text-zinc-800 mt-0.5">{p.gsm} GSM</p>
                    </div>
                    <div className="bg-zinc-50/80 rounded-xl p-2 border border-zinc-100">
                      <p className="text-[10px] uppercase font-semibold text-zinc-400">Width</p>
                      <p className="text-xs font-bold text-zinc-800 mt-0.5">{p.widthInches}"</p>
                    </div>
                    <div className="bg-zinc-50/80 rounded-xl p-2 border border-zinc-100">
                      <p className="text-[10px] uppercase font-semibold text-zinc-400">Weave</p>
                      <p className="text-xs font-bold text-zinc-800 mt-0.5">{p.weaveType}</p>
                    </div>
                  </div>
                </div>

                {/* Product Card Bottom / Pricing & Action */}
                <div className="p-5 pt-3 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
                      Cost Price
                    </span>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-xl font-extrabold text-zinc-900">
                        ₹{p.unitPricePerMeter.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-medium">/ meter</span>
                    </div>
                  </div>

                  {canEdit ? (
                    /* Plant Owner & Store Manager Edit Button */
                    <button
                      onClick={() => openEditModal(p)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Details & Price</span>
                    </button>
                  ) : (
                    /* Actual Buyer Order Placing Button */
                    <button
                      onClick={() => openOrderModal(p)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Place Order</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Edit Details & Cost Price (Strictly Plant Owner & Store Manager) */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingProduct(null);
          }}
        >
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Edit Product Specifications & Cost Price
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">
                    {roleTitle} Authorization ({editingProduct.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Cost Price Field - Prominently Highlighted */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80">
                <label className="block text-xs font-bold text-amber-950 mb-1 flex items-center justify-between">
                  <span>Unit Cost Price Per Meter (₹ / m) *</span>
                  <span className="text-[10px] text-amber-700 font-semibold uppercase">Client-Facing Rate</span>
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-amber-700">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border-2 border-amber-300 text-sm font-extrabold text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 shadow-2xs"
                    required
                  />
                </div>
                <p className="text-[11px] text-amber-800 mt-1 font-medium">
                  This unit rate directly dictates billing invoices, GST calculations, and order quotations for buyers.
                </p>
              </div>

              {/* Product Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-zinc-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Fabric Code *</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-zinc-50/50 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Fabric Type & Weave Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Fabric Classification *</label>
                  <input
                    type="text"
                    value={editFabricType}
                    onChange={(e) => setEditFabricType(e.target.value)}
                    placeholder="e.g. Cotton, Denim, Poly-Cotton"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-zinc-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Weave Pattern *</label>
                  <select
                    value={editWeave}
                    onChange={(e) => setEditWeave(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Plain">Plain Weave 1/1</option>
                    <option value="Twill">Twill 3/1</option>
                    <option value="Satin">Satin / Sateen</option>
                    <option value="Dobby">Dobby Structured</option>
                    <option value="Jacquard">Jacquard Pattern</option>
                  </select>
                </div>
              </div>

              {/* GSM & Width */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Density (GSM) *</label>
                  <input
                    type="number"
                    step="1"
                    min="10"
                    value={editGsm}
                    onChange={(e) => setEditGsm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-zinc-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Width (Inches) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="10"
                    value={editWidth}
                    onChange={(e) => setEditWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-zinc-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Spinning toggle */}
              <div className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  id="reqSpinning"
                  checked={editRequiresSpinning}
                  onChange={(e) => setEditRequiresSpinning(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300"
                />
                <label htmlFor="reqSpinning" className="font-semibold text-zinc-800 text-xs cursor-pointer">
                  Requires In-House Spinning Stage (Loom Weaving starts after spinning yarn)
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Application specifications, hand-feel, export grade certifications..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-zinc-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
                >
                  {savingEdit ? 'Updating Specifications...' : 'Save Product & Cost Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Actual Buyer Purchase Order Placement */}
      {orderingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOrderingProduct(null);
          }}
        >
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Place Purchase Order
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">
                    {orderingProduct.name} ({orderingProduct.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOrderingProduct(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
              {/* Fabric Specs Summary */}
              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-900">{orderingProduct.name}</p>
                  <p className="text-[11px] text-zinc-500">
                    {orderingProduct.gsm} GSM • {orderingProduct.widthInches}" Width • {orderingProduct.weaveType}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-400 block font-medium">Rate per Meter</span>
                  <span className="text-base font-extrabold text-indigo-600">
                    ₹{orderingProduct.unitPricePerMeter.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Quantity in Meters */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Required Quantity (Meters) *
                </label>
                <input
                  type="number"
                  min="10"
                  step="50"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  required
                />
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-zinc-400 mr-1 font-medium">Quick Select:</span>
                  {[500, 1000, 2500, 5000].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setOrderQuantity(q)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                        orderQuantity === q
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-zinc-100/70 hover:bg-zinc-200/70 text-zinc-700 border-zinc-200/60'
                      }`}
                    >
                      {q.toLocaleString()}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Shade Selection */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Dye Color / Shade Specification *
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {colorPresets.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setOrderColor(c.name)}
                      className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition ${
                        orderColor === c.name
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-500/20'
                          : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border shrink-0"
                        style={{ backgroundColor: c.bg, borderColor: c.border }}
                      ></span>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={orderColor}
                  onChange={(e) => setOrderColor(e.target.value)}
                  placeholder="Or enter custom color name / Pantone code..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-zinc-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Delivery Date & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Target Delivery Date *
                  </label>
                  <input
                    type="date"
                    value={orderDeliveryDate}
                    onChange={(e) => setOrderDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-zinc-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Order Priority</label>
                  <select
                    value={orderPriority}
                    onChange={(e) => setOrderPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="NORMAL">Standard Delivery</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Production Run</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Packaging / Special Finishing Instructions
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Export grade shrink wrap, maximum 100m roll continuous length..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-zinc-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Live Quotation Summary Card */}
              {(() => {
                const subtotal = orderQuantity * orderingProduct.unitPricePerMeter;
                const gst = subtotal * 0.05;
                const total = subtotal + gst;
                return (
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 space-y-1.5">
                    <div className="flex justify-between text-zinc-600 font-medium">
                      <span>Order Subtotal ({orderQuantity.toLocaleString()} meters @ ₹{orderingProduct.unitPricePerMeter}/m):</span>
                      <span className="font-semibold text-zinc-900">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600 font-medium">
                      <span>Goods & Services Tax (5% GST):</span>
                      <span className="font-semibold text-zinc-900">₹{gst.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-indigo-200 flex justify-between items-baseline">
                      <span className="font-bold text-zinc-900 text-xs">Total Order Value:</span>
                      <span className="text-lg font-extrabold text-indigo-700">
                        ₹{total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setOrderingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
                >
                  {submittingOrder ? 'Submitting Order...' : 'Confirm & Place Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
