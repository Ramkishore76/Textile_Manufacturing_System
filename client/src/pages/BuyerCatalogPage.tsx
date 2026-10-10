import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  PackagePlus,
  Trash2,
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
  const location = useLocation();
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

  // Create Product Modal State (for Plant Owner & Store Manager)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createCode, setCreateCode] = useState<string>('');
  const [createName, setCreateName] = useState<string>('');
  const [createFabricType, setCreateFabricType] = useState<string>('Cotton Poplin');
  const [createGsm, setCreateGsm] = useState<number | ''>(140);
  const [createWidthInches, setCreateWidthInches] = useState<number | ''>(58);
  const [createWeaveType, setCreateWeaveType] = useState<string>('Plain 1x1');
  const [createUnitPrice, setCreateUnitPrice] = useState<number | ''>(165);
  const [createRequiresSpinning, setCreateRequiresSpinning] = useState<boolean>(true);
  const [createDescription, setCreateDescription] = useState<string>('');
  const [includeBom, setIncludeBom] = useState<boolean>(true);
  const [createYarnId, setCreateYarnId] = useState<string>('');
  const [createYarnRate, setCreateYarnRate] = useState<number | ''>(0.18);
  const [createWastagePct, setCreateWastagePct] = useState<number | ''>(3.0);
  const [yarnsList, setYarnsList] = useState<any[]>([]);
  const [submittingCreate, setSubmittingCreate] = useState<boolean>(false);

  // Multi-Product Order Placement State (Supports selecting multiple products in single order)
  interface OrderItemEntry {
    id: string;
    fabricProductId: string;
    quantityMeters: number;
    color: string;
  }
  const [orderItems, setOrderItems] = useState<OrderItemEntry[]>([]);
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
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

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<FabricProduct[]>('/buyer-portal/products');
      setProducts(data);
    } catch (err: any) {
      toast.error('Failed to load fabric catalog: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Load yarns for BOM linking when staff is logged in
  useEffect(() => {
    if (isStaff) {
      api.get<any[]>('/buyer-portal/yarns')
        .then((yarns) => {
          setYarnsList(yarns);
          if (yarns.length > 0 && !createYarnId) {
            setCreateYarnId(yarns[0].id);
          }
        })
        .catch((err) => {
          console.error('Failed to load yarns for BOM configuration:', err);
        });
    }
  }, [isStaff]);

  const openCreateModal = useCallback(() => {
    // Generate next product code e.g. FAB-005
    let maxNum = 0;
    for (const p of products) {
      const match = p.code.match(/FAB-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextCode = `FAB-${String(maxNum + 1).padStart(3, '0')}`;
    setCreateCode(nextCode);
    setCreateName('');
    setCreateFabricType('Cotton Poplin');
    setCreateGsm(140);
    setCreateWidthInches(58);
    setCreateWeaveType('Plain 1x1');
    setCreateUnitPrice(165);
    setCreateRequiresSpinning(true);
    setCreateDescription('');
    setIncludeBom(yarnsList.length > 0);
    if (yarnsList.length > 0) {
      setCreateYarnId(yarnsList[0].id);
      setCreateYarnRate(0.18);
      setCreateWastagePct(3.0);
    }
    setShowCreateModal(true);
  }, [products, yarnsList]);

  // Handle URL query trigger e.g. /buyer/catalog?new=1
  useEffect(() => {
    if (isStaff && !loading && (location.search.includes('new=1') || location.search.includes('action=new-product'))) {
      openCreateModal();
    }
  }, [isStaff, loading, location.search, openCreateModal]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      toast.error('Product name is required.');
      return;
    }
    if (!createCode.trim()) {
      toast.error('Product code is required.');
      return;
    }
    if (Number(createUnitPrice) <= 0) {
      toast.error('Wholesale unit price must be greater than zero.');
      return;
    }
    if (Number(createGsm) <= 0) {
      toast.error('GSM density must be greater than zero.');
      return;
    }
    if (Number(createWidthInches) <= 0) {
      toast.error('Fabric width in inches must be greater than zero.');
      return;
    }

    setSubmittingCreate(true);
    try {
      const payload: any = {
        code: createCode.trim().toUpperCase(),
        name: createName.trim(),
        fabricType: createFabricType.trim(),
        gsm: Number(createGsm),
        widthInches: Number(createWidthInches),
        weaveType: createWeaveType.trim(),
        unitPricePerMeter: Number(createUnitPrice),
        requiresSpinning: createRequiresSpinning,
        description: createDescription.trim() || undefined,
      };

      if (includeBom && createYarnId && Number(createYarnRate) > 0) {
        payload.yarnMaterialId = createYarnId;
        payload.yarnQuantityPerMeter = Number(createYarnRate);
        payload.wastagePercentage = Number(createWastagePct) || 3.0;
      }

      const res = await api.post<{ product: FabricProduct; message: string }>('/buyer-portal/products', payload);
      toast.success(res.message || `New fabric product "${createName}" published successfully!`);
      setShowCreateModal(false);
      await loadProducts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create new fabric product');
    } finally {
      setSubmittingCreate(false);
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

  const handleAddProductToOrder = (p: FabricProduct) => {
    setOrderItems((prev) => {
      const exists = prev.some((it) => it.fabricProductId === p.id);
      if (exists) return prev;
      return [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          fabricProductId: p.id,
          quantityMeters: 1000,
          color: 'Pure White',
        },
      ];
    });
    setShowOrderModal(true);
  };

  const handleUpdateItemQuantity = (id: string, qty: number) => {
    setOrderItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, quantityMeters: Math.max(1, qty) } : it))
    );
  };

  const handleUpdateItemColor = (id: string, color: string) => {
    setOrderItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, color } : it))
    );
  };

  const handleRemoveOrderItem = (id: string) => {
    setOrderItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAddExtraProductToOrder = (fabricProductId: string) => {
    if (!fabricProductId) return;
    setOrderItems((prev) => {
      if (prev.some((it) => it.fabricProductId === fabricProductId)) return prev;
      return [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          fabricProductId,
          quantityMeters: 1000,
          color: 'Pure White',
        },
      ];
    });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      toast.error('Please select at least one fabric product for your order.');
      return;
    }

    setSubmittingOrder(true);
    try {
      const res = await api.post<any>('/buyer-portal/orders', {
        items: orderItems.map((it) => ({
          fabricProductId: it.fabricProductId,
          requiredQuantity: it.quantityMeters,
          color: it.color,
        })),
        requiredDeliveryDate: orderDeliveryDate,
        priority: orderPriority,
        notes: orderNotes,
      });

      toast.success(
        `Purchase Order #${res.orderNumber} successfully booked (${res.itemsCount} products)! Total: ₹${res.totalAmount?.toLocaleString()}`
      );
      setOrderItems([]);
      setShowOrderModal(false);
      navigate(`/buyer/orders/${res.orderId}`);
    } catch (err: any) {
      toast.error('Failed to book purchase order: ' + err.message);
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Live order calculations across all products in current single order
  const totalOrderMeters = orderItems.reduce((acc, it) => acc + (it.quantityMeters || 0), 0);
  const totalOrderSubtotal = orderItems.reduce((acc, it) => {
    const p = products.find((prod) => prod.id === it.fabricProductId);
    return acc + (it.quantityMeters || 0) * (p?.unitPricePerMeter || 0);
  }, 0);
  const totalOrderTax = totalOrderSubtotal * 0.05;
  const totalOrderGrand = totalOrderSubtotal + totalOrderTax;

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

          <div className="flex items-center space-x-2.5">
            {isStaff && !staffPreviewBuyerMode && (
              <button
                id="btn-admin-add-product"
                onClick={openCreateModal}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Product</span>
              </button>
            )}

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
          {isStaff && !staffPreviewBuyerMode && (
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Product Now</span>
            </button>
          )}
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
                      onClick={() => handleAddProductToOrder(p)}
                      className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer ${
                        orderItems.some((it) => it.fabricProductId === p.id)
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>
                        {orderItems.some((it) => it.fabricProductId === p.id)
                          ? '✓ In Order Sheet'
                          : '+ Add to Order'}
                      </span>
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

      {/* MODAL 2: Actual Buyer Purchase Order Placement (Multi-Product Order Support) */}
      {showOrderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowOrderModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Book Purchase Order
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">
                    {orderItems.length} Fabric Product{orderItems.length !== 1 ? 's' : ''} in this single order • Total: {totalOrderMeters.toLocaleString()}m
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-5 text-xs">
              {/* Product items in this order */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-800 text-xs">
                    Selected Fabric Products ({orderItems.length})
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Add custom meters and dye shades for each item
                  </span>
                </div>

                {orderItems.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-300">
                    <p className="text-xs text-zinc-500 font-medium">No fabric products added yet.</p>
                    <p className="text-[11px] text-zinc-400 mt-1">Select an available fabric below to start your order.</p>
                  </div>
                ) : (
                  orderItems.map((item, idx) => {
                    const prod = products.find((p) => p.id === item.fabricProductId);
                    const unitPrice = prod?.unitPricePerMeter || 0;
                    const lineTotal = item.quantityMeters * unitPrice;

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3"
                      >
                        {/* Item Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <h4 className="font-bold text-zinc-900 text-sm">
                                {prod?.name || 'Fabric Product'}
                              </h4>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white border border-zinc-200 text-zinc-600">
                                {prod?.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5 ml-7">
                              {prod?.gsm} GSM • {prod?.widthInches}" Width • {prod?.weaveType}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 text-right">
                            <div>
                              <span className="text-[11px] text-zinc-400 block">Line Total</span>
                              <span className="font-extrabold text-indigo-700 text-xs sm:text-sm">
                                ₹{lineTotal.toLocaleString()}
                              </span>
                            </div>
                            {orderItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOrderItem(item.id)}
                                className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-2 cursor-pointer"
                                title="Remove product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Quantity and Color inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-200/70">
                          {/* Quantity */}
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                              Ordered Meters (₹{unitPrice}/m) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantityMeters}
                              onChange={(e) =>
                                handleUpdateItemQuantity(item.id, Number(e.target.value))
                              }
                              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                              required
                            />
                            <div className="flex items-center gap-1 mt-1.5">
                              {[500, 1000, 2500, 5000].map((q) => (
                                <button
                                  key={q}
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(item.id, q)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition cursor-pointer ${
                                    item.quantityMeters === q
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      : 'bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                                  }`}
                                >
                                  {q.toLocaleString()}m
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Color */}
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                              Color / Shade Specification *
                            </label>
                            <input
                              type="text"
                              value={item.color}
                              onChange={(e) => handleUpdateItemColor(item.id, e.target.value)}
                              placeholder="e.g. Pure White, Royal Navy, Pantone 19-4052"
                              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                              required
                            />
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {colorPresets.slice(0, 4).map((c) => (
                                <button
                                  key={c.name}
                                  type="button"
                                  onClick={() => handleUpdateItemColor(item.id, c.name)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition cursor-pointer ${
                                    item.color === c.name
                                      ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-bold'
                                      : 'bg-white text-zinc-600 border-zinc-200'
                                  }`}
                                >
                                  {c.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Add Another Product Selector */}
                {products.some((p) => !orderItems.some((it) => it.fabricProductId === p.id)) && (
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-dashed border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <Plus className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="text-xs font-semibold text-indigo-950">
                        Add Another Fabric Product to this Order:
                      </span>
                    </div>
                    <select
                      value=""
                      onChange={(e) => {
                        handleAddExtraProductToOrder(e.target.value);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-indigo-200 text-xs font-semibold text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">+ Select Additional Fabric...</option>
                      {products
                        .filter((p) => !orderItems.some((it) => it.fabricProductId === p.id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.code}) — ₹{p.unitPricePerMeter}/m
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Delivery Date & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
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
                  placeholder="e.g. Export grade shrink wrap, maximum 100m roll continuous length, pallet shipment..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-zinc-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Combined Financial Summary Card */}
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 space-y-1.5">
                <div className="flex justify-between text-zinc-600 font-medium">
                  <span>
                    Combined Subtotal ({totalOrderMeters.toLocaleString()} total meters across {orderItems.length} products):
                  </span>
                  <span className="font-semibold text-zinc-900">₹{totalOrderSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-600 font-medium">
                  <span>Goods & Services Tax (5% GST):</span>
                  <span className="font-semibold text-zinc-900">₹{totalOrderTax.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-indigo-200 flex justify-between items-baseline">
                  <span className="font-bold text-zinc-900 text-xs">Total Single Order Value:</span>
                  <span className="text-xl font-extrabold text-indigo-700">
                    ₹{totalOrderGrand.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium text-xs transition cursor-pointer"
                >
                  Continue Browsing
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder || orderItems.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingOrder ? 'Submitting Purchase Order...' : `Confirm & Place Order (${orderItems.length} Products)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bottom Order Bar (Active when products are selected and modal is minimized) */}
      {orderItems.length > 0 && !showOrderModal && (
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none animate-in slide-in-from-bottom-4">
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex items-center justify-between gap-6 pointer-events-auto max-w-2xl w-full">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                {orderItems.length}
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {orderItems.length} Fabric Product{orderItems.length > 1 ? 's' : ''} in Current Order
                </p>
                <p className="text-[11px] text-slate-300">
                  {totalOrderMeters.toLocaleString()} total meters • Total Value: ₹{totalOrderGrand.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setOrderItems([])}
                className="px-3 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => setShowOrderModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Review & Place Order →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Add New Fabric Product (Strictly Plant Owner & Store Manager) */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-zinc-900">
                      Add New Fabric Product
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">
                      {roleTitle}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">
                    Publish export-grade fabric specifications to visual catalog and factory ERP
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              {/* Row 1: Code and Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Product Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FAB-005"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 font-mono font-bold bg-zinc-50/50 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">Unique SKU code</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Fabric Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. 100% Combed Cotton Poplin 60s"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 font-semibold bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">Commercial descriptive title</p>
                </div>
              </div>

              {/* Row 2: Category and Quick Presets */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Fabric Category / Fiber Classification *
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Cotton Poplin',
                    'Cotton Twill',
                    'Denim Indigo',
                    'Linen Blend',
                    'Rayon Viscose',
                    'Polyester Blend',
                    'Canvas Duck',
                    'Oxford Cotton',
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCreateFabricType(cat)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                        createFabricType === cat
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={createFabricType}
                  onChange={(e) => setCreateFabricType(e.target.value)}
                  placeholder="Or enter custom category name..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-zinc-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Row 3: Weave Type and Quick Presets */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Weave Construction / Pattern *
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Plain 1x1',
                    'Twill 2/1',
                    'Twill 3/1',
                    'Satin / Sateen',
                    'Oxford Weave',
                    'Dobby Texture',
                    'Herringbone',
                  ].map((wv) => (
                    <button
                      key={wv}
                      type="button"
                      onClick={() => setCreateWeaveType(wv)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                        createWeaveType === wv
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {wv}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={createWeaveType}
                  onChange={(e) => setCreateWeaveType(e.target.value)}
                  placeholder="Or enter custom weave..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-zinc-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Row 4: Metrics and Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-zinc-50/80 p-3 rounded-xl border border-zinc-200/80">
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Fabric Density (GSM) *
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={createGsm}
                      onChange={(e) => setCreateGsm(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-900 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <span className="text-[11px] text-zinc-500 font-semibold">g/m²</span>
                  </div>
                </div>

                <div className="bg-zinc-50/80 p-3 rounded-xl border border-zinc-200/80">
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Usable Width *
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.5"
                      value={createWidthInches}
                      onChange={(e) => setCreateWidthInches(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-900 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <span className="text-[11px] text-zinc-500 font-semibold">Inches</span>
                  </div>
                </div>

                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80">
                  <label className="block font-bold text-emerald-950 mb-1">
                    Wholesale Price (₹/m) *
                  </label>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-bold text-emerald-800">₹</span>
                    <input
                      type="number"
                      required
                      min="0.1"
                      step="0.5"
                      value={createUnitPrice}
                      onChange={(e) => setCreateUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 text-emerald-950 font-extrabold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                    <span className="text-[10px] text-emerald-700 font-medium">/m</span>
                  </div>
                </div>
              </div>

              {/* Spinning Toggle */}
              <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <input
                  type="checkbox"
                  id="createReqSpinning"
                  checked={createRequiresSpinning}
                  onChange={(e) => setCreateRequiresSpinning(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 cursor-pointer"
                />
                <div>
                  <label htmlFor="createReqSpinning" className="font-bold text-zinc-900 text-xs cursor-pointer block">
                    Requires In-House Spinning Stage
                  </label>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    When enabled, factory production jobs will first route through yarn ring spinning frames before warp beam sizing and loom weaving.
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Product Description & Technical Specifications
                </label>
                <textarea
                  rows={2}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="e.g. Export-grade combed cotton fabric suitable for luxury shirting. Pre-shrunk, OEKO-TEX Standard 100 certified..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-zinc-50/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Optional BOM Formula Section */}
              <div className="border border-zinc-200 rounded-xl p-3.5 bg-zinc-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="toggleBOM"
                      checked={includeBom}
                      onChange={(e) => setIncludeBom(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 cursor-pointer"
                    />
                    <label htmlFor="toggleBOM" className="font-bold text-zinc-900 text-xs cursor-pointer">
                      Link Initial Bill of Materials (BOM) Formula
                    </label>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    Auto-Calculation
                  </span>
                </div>

                {includeBom && (
                  <div className="space-y-3 pt-2 border-t border-zinc-200/80 animate-in fade-in">
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        Select Yarn Raw Material
                      </label>
                      <select
                        value={createYarnId}
                        onChange={(e) => setCreateYarnId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        {yarnsList.map((y) => (
                          <option key={y.id} value={y.id}>
                            {y.name} ({y.code}) — {y.count} {y.color} ({y.yarnType})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">
                          Yarn Rate per Meter (KG/m)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={createYarnRate}
                          onChange={(e) => setCreateYarnRate(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-zinc-700 mb-1">
                          Loom Wastage Buffer (%)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={createWastagePct}
                          onChange={(e) => setCreateWastagePct(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-zinc-900 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-indigo-700 bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
                      💡 <strong>BOM Rule Preview:</strong> For every 1,000 meters produced, system will reserve ~
                      {(
                        Number(createYarnRate || 0.18) *
                        1000 *
                        (1 + Number(createWastagePct || 3) / 100)
                      ).toFixed(1)}{' '}
                      KG of selected yarn stock.
                    </p>
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {submittingCreate ? 'Publishing Product...' : 'Publish & Add to Catalog'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
