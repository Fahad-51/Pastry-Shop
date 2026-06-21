import React, { useEffect, useState, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AppContent } from '../context/AppContext';
import { CartContext } from '../context/CartContext';
import { toast } from "react-toastify";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { backendUrl } = useContext(AppContent);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${backendUrl}/api/products/${id}`);
        
        // DEBUG: Check your console to see if "reviews" exists in the response
        console.log("Product Data fetched:", res.data.product);
        
        setProduct(res.data.product);
      } catch (error) {
        toast.error(error.response?.data?.message || "Product not found");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id, backendUrl, navigate]);

  const finalPrice = useMemo(() => {
    if (!product) return 0;
    let price = product.price;
    if (product.discount?.isActive) {
      price = product.discount.type === "percentage" 
        ? price * (1 - product.discount.value / 100) 
        : price - product.discount.value;
    }
    return price;
  }, [product]);

  const renderStars = (rating) => {
    return (
      <div className="flex text-amber-400">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-lg">
            {i < Math.floor(rating || 0) ? "★" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-pulse flex flex-col lg:flex-row gap-12">
      <div className="lg:w-1/2 aspect-square bg-gray-100 rounded-[2.5rem]" />
      <div className="lg:w-1/2 space-y-6 py-4">
        <div className="h-4 bg-gray-100 w-24 rounded" />
        <div className="h-12 bg-gray-100 w-3/4 rounded-xl" />
        <div className="h-8 bg-gray-100 w-1/4 rounded" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );

  if (!product) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-6 pb-16 lg:pt-10 lg:pb-24">
      
      {/* Navigation */}
      <button 
        onClick={() => navigate(-1)}
        className="group flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-rose-600 transition-colors mb-8"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Menu
      </button>

      <div className="flex flex-col lg:flex-row gap-12 xl:gap-20">
        {/* Left: Image Block */}
        <div className="lg:w-1/2">
          <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl bg-gray-50 aspect-square">
            <img
              src={product.image ? (product.image.startsWith("http") ? product.image : `/images/${product.image}`) : "/placeholder.png"}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => { e.target.src = "/placeholder.png" }} 
            />
          </div>
        </div>

        {/* Right: Info Block */}
        <div className="lg:w-1/2 flex flex-col justify-center">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-rose-600 font-bold uppercase tracking-[0.2em] text-[10px] px-3 py-1 bg-rose-50 rounded-full">
                {product.productType || "Freshly Baked"}
              </span>
              <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
                {renderStars(product.rating)}
                <span className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  ({product.numReviews || 0} Reviews)
                </span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mt-4 mb-4 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-black text-gray-900">{finalPrice.toFixed(0)}৳</span>
              {product.discount?.isActive && (
                <span className="text-xl text-gray-300 line-through decoration-rose-500/40">
                  {product.price.toFixed(0)}৳
                </span>
              )}
            </div>
            
            <p className="text-gray-500 leading-relaxed text-lg mb-8 italic border-l-4 border-rose-100 pl-4">
              "{product.description || "Indulge in our artisanal masterpiece."}"
            </p>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
            <div className="flex flex-wrap items-center gap-6 mb-8">
              <div className="flex items-center bg-white rounded-full p-1.5 shadow-sm border border-slate-200">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center rounded-full font-bold text-gray-400 hover:text-rose-600">—</button>
                <span className="w-12 text-center font-black text-xl text-gray-900">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center rounded-full font-bold text-gray-400 hover:text-rose-600">+</button>
              </div>
            </div>

            <button
              disabled={product.stock <= 0}
              onClick={() => {
                addToCart(product, quantity);
                toast.success(`Added ${quantity}x ${product.name}!`);
              }}
              className={`w-full py-6 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-[0.98] ${
                product.stock > 0 ? "bg-gray-900 text-white hover:bg-rose-600 shadow-gray-200" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {product.stock > 0 ? "Add to Shopping Bag" : "Out of Stock"}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-20 border-t border-gray-100 pt-16">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Guest Reviews</h3>
          <div className="bg-gray-900 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase">
            {product.reviews?.length || 0} Total
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map((rev, index) => (
              <div key={index} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    {/* Note: Check if your backend sends 'name' or 'userName' */}
                    <p className="font-black text-gray-900 text-sm uppercase tracking-wider">{rev.name || rev.userName || "Guest User"}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">
                      {new Date(rev.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {renderStars(rev.rating)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 text-center">
              <p className="text-gray-400 font-bold text-sm">No reviews yet for this masterpiece.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;