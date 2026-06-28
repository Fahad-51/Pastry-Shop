import React, { useEffect, useState, useContext, useMemo, memo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import { CartContext } from "../context/CartContext";
import { toast } from "react-toastify";

// Memoized sub-component to prevent flickering on filter
const ProductCard = memo(({ product, userData, addToCart, navigate }) => {
  const hasDiscount = product.discount?.isActive;

  const discountedPrice = useMemo(() => {
    if (!hasDiscount) return product.price;
    return product.discount.type === "percentage"
      ? product.price * (1 - product.discount.value / 100)
      : product.price - product.discount.value;
  }, [product.price, product.discount, hasDiscount]);

  return (
    <div className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
      <div className="relative overflow-hidden aspect-square">
        <img
          src={
            product.image 
              ? (product.image.startsWith("http") ? product.image : `/images/${product.image}`) 
              : "/placeholder.png"
          }
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.target.src = "/placeholder.png" }} 
        />
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {product.discount.value}{product.discount.type === "percentage" ? "%" : "৳"} OFF
          </div>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-gray-800 text-white px-4 py-1 rounded-full text-xs font-bold uppercase">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow bg-indigo-50/50">
        <div className="mb-2">
          {/* STAR RATING ADDED HERE */}
<div className="flex items-center gap-1 mb-1">
  {product.numReviews > 0 ? (
    <>
      <span className="text-amber-400 text-xs">★</span>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
        {product.rating} ({product.numReviews} Reviews)
      </span>
    </>
  ) : (
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
      (0 Review)
    </span>
  )}
</div>
          
          <h2 className="text-gray-900 font-bold text-lg truncate group-hover:text-rose-600 transition-colors">
            {product.name}
          </h2>
          <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-xl font-extrabold text-gray-900">{discountedPrice.toFixed(0)}৳</span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through decoration-rose-500/50">
                {product.price.toFixed(0)}৳
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate(`/product/${product._id}`)}
              className="py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-300 transition-colors"
            >
              Details
            </button>
            
            {userData?.role === "admin" ? (
              <button
                onClick={() => navigate(`/admin/edit-product/${product._id}`)}
                className="py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-shadow shadow-sm"
              >
                Edit
              </button>
            ) : (
              <button
                disabled={product.stock <= 0}
                onClick={() => {
                  addToCart(product);
                  toast.success(`${product.name} added to cart!`);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  product.stock > 0
                    ? "bg-gray-900 text-white hover:bg-indigo-500 shadow-md active:scale-95"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const ProductList = () => {
  const navigate = useNavigate();
  const { backendUrl, userData, activeCategory, setActiveCategory } = useContext(AppContent);
  const { addToCart } = useContext(CartContext);
  
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    { name: "All", id: "All", icon: "✨" },
    { name: "Cakes", id: "cake", icon: "🍰" }, 
    { name: "Sweets", id: "sweets", icon: "🍧" },
    { name: "Coffee", id: "coffee", icon: "☕" },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${backendUrl}/api/products/home`);
        setProducts(res.data.products);
      } catch (error) {
        toast.error("Could not load products.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [backendUrl]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return products;
    return products.filter(product => product.productType === activeCategory);
  }, [products, activeCategory]);

  return (
    <section id="product-list" className="max-w-7xl mx-auto px-6 py-16 scroll-mt-20">
      <div className="flex flex-col items-center text-center mb-12">
        <span className="text-rose-600 font-bold uppercase tracking-widest text-xs">Our Collection</span>
        <h1 className="text-4xl font-black text-gray-900 mt-2">Featured Delights</h1>
      </div>

      <div className="flex justify-center mb-12">
        <div className="bg-slate-50 p-1.5 rounded-2xl flex items-center gap-2 border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeCategory === cat.id ? "bg-white text-gray-900 shadow-md scale-105" : "text-slate-500"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {isLoading ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl" />)
        ) : (
          <>
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product._id} 
                product={product} 
                userData={userData} 
                addToCart={addToCart} 
                navigate={navigate}
              />
            ))}
            
            {/* Admin Add Card integrated inside the grid */}
            {userData?.role === "admin" && (
              <div 
                onClick={() => navigate('/admin/add-product')}
                className="group cursor-pointer bg-white border-2 border-dashed border-indigo-200 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300 min-h-[350px]"
              >
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">+</div>
                <p className="mt-4 font-black text-indigo-600 uppercase tracking-widest text-xs text-center">
                  Add New {activeCategory === 'All' ? 'Product' : activeCategory}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {!isLoading && filteredProducts.length === 0 && userData?.role !== "admin" && (
        <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
          <p className="text-gray-400 font-medium">No {activeCategory} items available today.</p>
        </div>
      )}
    </section>
  );
};

export default ProductList;