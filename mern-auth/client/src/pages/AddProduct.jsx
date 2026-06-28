import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AppContent } from '../context/AppContext';
import { toast } from "react-toastify";

const AddProduct = () => {
  const navigate = useNavigate();
  const { backendUrl, userData } = useContext(AppContent);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    productType: "cake", 
    stock: 10,
    image: "", 
    discount: {
      isActive: false,
      type: "percentage",
      value: 0
    }
  });

  // Security check
  if (userData && userData.role !== "admin") {
    navigate("/");
    return null;
  }

  // --- NEW: GOOGLE DRIVE LINK CONVERTER ---
  const convertDriveLink = (url) => {
    if (url.includes("drive.google.com")) {
      // Extracts the ID from the URL
      const regex = /\/d\/([^/]+)/;
      const match = url.match(regex);
      if (match && match[1]) {
        return `https://lh3.googleusercontent.com/u/0/d/${match[1]}`;
      }
    }
    return url; // Return original if not a Drive link or conversion fails
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
        return toast.error("Please fill in required fields");
    }

    try {
      setLoading(true);
      
      // Convert image link if it's from Google Drive before sending to backend
      const processedImage = convertDriveLink(formData.image);

      const finalData = { 
        ...formData, 
        image: processedImage,
        price: Number(formData.price), 
        stock: Number(formData.stock) 
      };
      
      const res = await axios.post(`${backendUrl}/api/products/add`, finalData);
      if (res.data.success) {
        toast.success("New product added successfully!");
        navigate('/');
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const getPreviewImage = () => {
    if (!formData.image) return "/placeholder.png";
    // Preview converts link on the fly so you can see if it works
    const previewUrl = convertDriveLink(formData.image);
    if (previewUrl.startsWith("http")) return previewUrl;
    return `/images/${previewUrl}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
        <div className="p-8 lg:p-12">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">New Bakery Entry</h1>
              <p className="text-gray-500 text-sm">Fill in the details to list a new product</p>
            </div>
            <button type="button" onClick={() => navigate(-1)} className="text-gray-400 hover:text-rose-500 font-bold transition-colors">
              Cancel
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-black uppercase text-indigo-600 tracking-widest">Product Name*</label>
                <input required name="name" value={formData.name} onChange={handleChange}
                  className="w-full border-b-2 border-gray-100 py-3 text-xl font-bold focus:border-indigo-500 outline-none transition-all bg-transparent"
                  placeholder="e.g. Vanilla Glazed Donut" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Category</label>
                  <select name="productType" value={formData.productType} onChange={handleChange}
                    className="w-full border-b-2 border-gray-100 py-3 font-bold outline-none focus:border-indigo-500 bg-transparent">
                    <option value="cake">🍰 Cake</option>
                    <option value="sweets">🍧 Sweets</option>
                    <option value="coffee">☕ Coffee</option>
                    <option value="other">📦 Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Price (৳)*</label>
                  <input required type="number" name="price" value={formData.price} onChange={handleChange}
                    className="w-full border-b-2 border-gray-100 py-3 font-bold outline-none focus:border-indigo-500 bg-transparent" placeholder="0" />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="3" 
                  className="w-full border-2 border-gray-50 rounded-2xl p-4 mt-2 outline-none focus:border-indigo-500 bg-gray-50/30 text-sm italic" 
                  placeholder="Describe the taste and ingredients..." />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-indigo-600 tracking-widest">Google Drive Link or Filename</label>
                <div className="flex items-center gap-4 mt-2">
                    <input name="image" value={formData.image} onChange={handleChange}
                        className="flex-grow border-2 border-gray-50 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 bg-gray-50/30"
                        placeholder="Paste Drive Share Link here" />
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0">
                        <img 
                          src={getPreviewImage()} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = "/placeholder.png" }}
                        />
                    </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Initial Inventory</label>
                  <div className="flex items-center gap-4 mt-2">
                    <input type="number" name="stock" value={formData.stock} onChange={handleChange}
                        className="bg-transparent border-b-2 border-slate-700 py-2 text-4xl font-black outline-none focus:border-indigo-400 w-32" />
                    <span className="text-slate-500 font-bold">Units Available</span>
                  </div>
               </div>

               <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100">
                  <div className="flex items-center gap-3 mb-4">
                    <input type="checkbox" name="discount.isActive" checked={formData.discount.isActive} onChange={handleChange}
                      className="w-6 h-6 accent-rose-600 cursor-pointer" id="discountCheck" />
                    <label htmlFor="discountCheck" className="font-black text-rose-900 cursor-pointer">Apply Launch Discount</label>
                  </div>
                  
                  {formData.discount.isActive && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-300">
                      <select name="discount.type" value={formData.discount.type} onChange={handleChange} 
                        className="p-3 rounded-xl border-none shadow-sm font-bold text-sm bg-white outline-none">
                        <option value="percentage">Percentage (%)</option>
                        <option value="flat">Fixed (৳)</option>
                      </select>
                      <input type="number" name="discount.value" value={formData.discount.value} onChange={handleChange}
                        className="p-3 rounded-xl border-none shadow-sm font-bold text-sm bg-white outline-none" placeholder="Value" />
                    </div>
                  )}
               </div>

               <button 
                disabled={loading} 
                className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-200 transition-all active:scale-95 disabled:bg-gray-300 disabled:shadow-none"
               >
                 {loading ? "Processing..." : "Submit"}
               </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;