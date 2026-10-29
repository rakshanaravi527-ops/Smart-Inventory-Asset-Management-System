import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { get, post, patch } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AssetForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const initialBarcode = routeLocation.state?.barcode || '';

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  // Dropdowns
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    departmentId: '',
    locationId: '',
    serialNumber: initialBarcode,
    purchaseDate: '',
    vendor: '',
    cost: '',
    warrantyExpiry: '',
    condition: 'Good',
    quantity: '',
    minThreshold: '',
    maxLevel: '',
  });

  const selectedCategory = categories.find((c) => c.id === formData.categoryId);
  const isConsumable = selectedCategory?.type === 'consumable';

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [catRes, deptRes, locRes] = await Promise.all([
          get('/categories'),
          get('/departments'),
          get('/locations'),
        ]);

        setCategories(catRes.data?.data || []);
        setDepartments(deptRes.data?.data || []);
        setLocations(locRes.data?.data || []);

        if (isEdit) {
          const assetRes = await get(`/assets/${id}`);
          const a = assetRes.data?.data;
          if (a) {
            setFormData({
              name: a.name || '',
              categoryId: a.categoryId || '',
              departmentId: a.departmentId || '',
              locationId: a.locationId || '',
              serialNumber: a.serialNumber || '',
              purchaseDate: a.purchaseDate ? a.purchaseDate.split('T')[0] : '',
              vendor: a.vendor || '',
              cost: a.cost !== null ? String(a.cost) : '',
              warrantyExpiry: a.warrantyExpiry ? a.warrantyExpiry.split('T')[0] : '',
              condition: a.condition || 'Good',
              quantity: a.quantity !== null && a.quantity !== undefined ? String(a.quantity) : '',
              minThreshold: a.minThreshold !== null && a.minThreshold !== undefined ? String(a.minThreshold) : '',
              maxLevel: a.maxLevel !== null && a.maxLevel !== undefined ? String(a.maxLevel) : '',
            });
          }
        }
      } catch (err) {
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        categoryId: formData.categoryId,
        departmentId: formData.departmentId,
        locationId: formData.locationId || null,
        serialNumber: formData.serialNumber || null,
        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : null,
        vendor: formData.vendor || null,
        cost: formData.cost ? Number(formData.cost) : null,
        warrantyExpiry: formData.warrantyExpiry ? new Date(formData.warrantyExpiry).toISOString() : null,
        condition: formData.condition,
        quantity: isConsumable && formData.quantity ? Number(formData.quantity) : null,
        minThreshold: isConsumable && formData.minThreshold ? Number(formData.minThreshold) : null,
        maxLevel: isConsumable && formData.maxLevel ? Number(formData.maxLevel) : null,
      };

      if (isEdit) {
        await patch(`/assets/${id}`, payload);
        toast.success('Asset updated successfully');
        navigate(`/assets/${id}`);
      } else {
        const res = await post('/assets', payload);
        toast.success('Asset created successfully');
        navigate(`/assets/${res.data?.data?.id || ''}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save asset');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading asset form..." />;

  const filteredLocations = locations.filter(
    (loc) => !formData.departmentId || loc.departmentId === formData.departmentId
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isEdit ? 'Edit Asset Record' : 'Register New Asset'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Fill in the specifications, assignment department, and initial stock/condition
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-6"
      >
        {/* Core fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Asset Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Tektronix Digital Oscilloscope 100MHz"
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Category *
            </label>
            <select
              name="categoryId"
              required
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Department *
            </label>
            <select
              name="departmentId"
              required
              value={formData.departmentId}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Physical Location / Lab
            </label>
            <select
              name="locationId"
              value={formData.locationId}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Unassigned</option>
              {filteredLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.room ? `(${loc.room})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Serial Number / Tag ID
            </label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              placeholder="e.g. SN-99482-A"
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Initial Condition
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500"
            >
              <option value="Good">Good (New / Fully Operational)</option>
              <option value="Fair">Fair (Operational with wear)</option>
              <option value="Poor">Poor (Degraded performance)</option>
              <option value="Damaged">Damaged (Requires repair)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Purchase Cost ($)
            </label>
            <input
              type="number"
              step="0.01"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Vendor / Supplier
            </label>
            <input
              type="text"
              name="vendor"
              value={formData.vendor}
              onChange={handleChange}
              placeholder="e.g. Agilent Technologies, Dell"
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Purchase Date
            </label>
            <input
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Warranty Expiration
            </label>
            <input
              type="date"
              name="warrantyExpiry"
              value={formData.warrantyExpiry}
              onChange={handleChange}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Consumable Fields (conditionally revealed) */}
        {isConsumable && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-bold uppercase text-primary-600 dark:text-primary-400 mb-3">
              Stock Quantity & Reorder Thresholds (Consumable)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Current Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Min Alert Threshold
                </label>
                <input
                  type="number"
                  name="minThreshold"
                  value={formData.minThreshold}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Max Stock Level
                </label>
                <input
                  type="number"
                  name="maxLevel"
                  value={formData.maxLevel}
                  onChange={handleChange}
                  placeholder="e.g. 50"
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-xs font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-500 shadow-md shadow-primary-600/30 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : isEdit ? 'Update Asset' : 'Register Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}

