import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AppContent } from '../context/AppContext';
import { toast } from "react-toastify";

// --- BEAUTIFUL MODAL COMPONENT ---
const ConfirmModal = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-rose-50 transform transition-all scale-100">
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6 mx-auto">
          <span className="text-4xl">⚠️</span>
        </div>

        <h3 className="text-2xl font-black text-center text-gray-900 mb-2">
          Are you sure?
        </h3>
        <p className="text-gray-500 text-center text-sm leading-relaxed mb-8">
          This action cannot be undone. This product will be removed from your bakery catalog forever.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-200 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Yes, Delete Product"}
          </button>
          
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
          >
            No, Keep It
          </button>
        </div>
      </div>
    </div>
  );
};

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContent);
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); 
  const [reviews, setReviews] = useState([]); // Added for review management
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    productType: "other",
    stock: 0,
    image: "",
    discount: {
      isActive: false,
      type: "percentage",
      value: 0
    }
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${backendUrl}/api/products/${id}`);
        const p = res.data.product;
        setFormData({
          name: p.name || "",
          price: p.price || 0,
          description: p.description || "",
          productType: p.productType || "other",
          stock: p.stock || 0,
          image: p.image || "",
          discount: {
            isActive: p.discount?.isActive || false,
            type: p.discount?.type || "percentage",
            value: p.discount?.value || 0
          }
        });
        setReviews(p.reviews || []); // Load reviews
      } catch (error) {
        toast.error("Error loading product data");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, backendUrl, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith("discount.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        discount: { ...prev.discount, [field]: type === "checkbox" ? checked : value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  };

  // --- DELETE REVIEW LOGIC ---
  const deleteReview = async (reviewId) => {
    try {
      const res = await axios.delete(`${backendUrl}/api/products/${id}/review/${reviewId}`);
      if (res.data.success) {
        toast.success("Review deleted");
        setReviews(prev => prev.filter(r => r._id !== reviewId));
      }
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await axios.delete(`${backendUrl}/api/products/delete/${id}`);
      if (res.data.success) {
        toast.warning("Product Deleted Successfully");
        navigate("/"); 
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const res = await axios.put(`${backendUrl}/api/products/update/${id}`, formData);
      if (res.data.success) {
        toast.success("Product updated successfully!");
        navigate(`/product/${id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  // Helper for price preview
  const getFinalPrice = () => {
    const p = Number(formData.price);
    const v = Number(formData.discount.value);
    if(!formData.discount.isActive) return p;
    return formData.discount.type === 'percentage' ? p - (p * v / 100) : p - v;
  };

  if (loading) return <div className="text-center py-20 font-bold">Loading Editor...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 lg:py-10"> 
      
      <ConfirmModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleDelete} 
        loading={deleting} 
      />

      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center mb-8">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-bold text-gray-400 hover:text-rose-600 transition-colors"
          >
            ← Cancel Editing
          </button>
          
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={updating}
              className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black hover:bg-emerald-700 transition-all shadow-lg disabled:bg-gray-400"
            >
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 xl:gap-20">
          {/* LEFT SIDE */}
          <div className="lg:w-1/2 flex flex-col space-y-4">
            <div className="relative rounded-[2.5rem] shadow-2xl bg-gray-50 overflow-hidden group">
              <img
                src={formData.image || "/placeholder.png"}
                alt="Preview"
                className="w-full h-[500px] lg:h-[600px] object-cover"
                onError={(e) => { e.target.src = "/placeholder.png" }}
              />
            </div>

            <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Image Source</label>
              <input
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="w-full mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-mono"
              />
            </div>

            {/* REVIEW LIST SECTION */}
            <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
              <h3 className="text-sm font-black uppercase mb-4 text-gray-400">Manage Reviews</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {reviews.length === 0 ? <p className="text-xs text-gray-300 italic">No reviews yet</p> : reviews.map((rev) => (
                  <div key={rev._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                    <div>
                      <p className="text-xs font-black">★ {rev.rating} — {rev.userName}</p>
                      <p className="text-[10px] text-gray-500 truncate w-40">{rev.comment}</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => deleteReview(rev._id)}
                      className="text-[10px] font-bold text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="lg:w-1/2 flex flex-col space-y-6">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-rose-600">Product Name</label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full text-4xl font-black border-b-2 border-gray-100 focus:border-rose-500 outline-none py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Category</label>
                <select
                  name="productType"
                  value={formData.productType}
                  onChange={handleChange}
                  className="w-full border-b border-gray-200 focus:border-rose-500 outline-none py-2 bg-transparent font-bold text-lg"
                >
                  <option value="cake">🍰 Cake</option>
                  <option value="sweets">🍧 Sweets</option>
                  <option value="coffee">☕ Coffee</option>
                  <option value="other">📦 Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Price (৳)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full border-b border-gray-200 focus:border-rose-500 outline-none py-1 font-black text-2xl text-rose-600"
                />
                {formData.discount.isActive && (
                  <p className="text-[10px] font-bold text-emerald-500 mt-1 italic">
                    Final Price: ৳{getFinalPrice()}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className="w-full border rounded-2xl p-4 mt-2 text-gray-600 italic outline-none bg-gray-50/50"
              />
            </div>

            {/* DISCOUNT BOX */}
            <div className={`p-6 rounded-3xl border transition-colors ${formData.discount.isActive ? 'bg-rose-50 border-rose-100' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-3 mb-4">
                <input 
                  type="checkbox" 
                  name="discount.isActive" 
                  checked={formData.discount.isActive} 
                  onChange={handleChange}
                  className="w-5 h-5 accent-rose-600"
                />
                <label className={`font-black uppercase tracking-wide ${formData.discount.isActive ? 'text-rose-900' : 'text-gray-400'}`}>
                  Enable Discount
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <select 
                  disabled={!formData.discount.isActive}
                  name="discount.type" 
                  value={formData.discount.type} 
                  onChange={handleChange}
                  className="bg-white border rounded-xl p-3 outline-none font-bold disabled:opacity-50"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (৳)</option>
                </select>
                <input
                  disabled={!formData.discount.isActive}
                  type="number"
                  name="discount.value"
                  value={formData.discount.value}
                  onChange={handleChange}
                  className="bg-white border rounded-xl p-3 outline-none font-black disabled:opacity-50"
                />
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventory</label>
              <div className="flex items-center gap-6 mt-2">
                 <input 
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="bg-transparent text-5xl font-black w-32 border-b border-slate-700 focus:border-rose-500 outline-none"
                 />
                 <span className="text-slate-400 font-bold text-lg">In Stock</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-4 border-2 border-red-100 text-red-500 rounded-2xl font-black hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest text-xs"
            >
              Delete Product
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;