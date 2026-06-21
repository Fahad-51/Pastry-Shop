import React, { useContext, useEffect, useState } from 'react';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Inbox = () => {
  const { backendUrl, userData } = useContext(AppContent);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ 
    productId: '', 
    productName: '', 
    orderId: '', 
    rating: 5, 
    comment: '' 
  });

  const fetchUserOrders = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/order/userorders`, {
        headers: { token: userData.token }
      });
      if (data.success) {
        const sortedOrders = data.orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        setOrders(sortedOrders);
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not load your orders");
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!reviewData.comment.trim()) {
      return toast.warn("Please write a small comment!");
    }

    try {
      const { data } = await axios.post(`${backendUrl}/api/products/review`, {
        productId: reviewData.productId,
        orderId: reviewData.orderId,
        rating: Number(reviewData.rating),
        comment: reviewData.comment,
        userId: userData._id,
        userName: userData.name
      }, { headers: { token: userData.token } });

      if (data.success) {
        toast.success(`Review for ${reviewData.productName} submitted!`);
        
        setOrders(prevOrders => 
          prevOrders.map(order => ({
            ...order,
            items: order.items.map(item => 
              item.productId === reviewData.productId && order._id === reviewData.orderId
                ? { ...item, reviewed: true } 
                : item
            )
          }))
        );

        setShowReviewModal(false);
        setReviewData({ productId: '', productName: '', orderId: '', rating: 5, comment: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error submitting review");
    }
  };

  useEffect(() => {
    if (userData) fetchUserOrders();
  }, [userData]);

  if (loading) return (
    <div className="pt-16 text-center">
      <div className="animate-spin inline-block w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mb-4"></div>
      <p className="font-bold text-gray-500 text-sm italic">Updating your inbox...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 pt-10 pb-20">
      <div className="flex justify-start items-center mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
          <span className="text-lg">←</span> Back
        </button>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Inbox</h1>
        <span className="text-[10px] font-black bg-gray-900 px-3 py-1 rounded-full text-white uppercase">
          {orders.length} Messages
        </span>
      </div>

      <div className="space-y-4">
        {orders.map((order, index) => {
          const isDelivered = order.status === 'Delivered';
          const pendingReviews = order.items.filter(item => !item.reviewed);

          return (
            <div key={index} className={`bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm transition-all ${isDelivered && pendingReviews.length > 0 ? 'ring-1 ring-rose-500/30 shadow-md' : 'opacity-75'}`}>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(order.date).toLocaleDateString()}</span>
                  </div>

                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <p key={idx} className={`text-sm ${!item.reviewed && isDelivered ? 'text-gray-900 font-black' : 'text-gray-500 font-medium'}`}>
                        {item.name} <span className="text-rose-500 ml-1">x{item.quantity}</span>
                        {item.reviewed && <span className="ml-2 text-[8px] text-emerald-500 font-black uppercase tracking-tighter">✓ Reviewed</span>}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="text-left md:text-right flex flex-col justify-center">
                  <p className="text-xl font-black text-gray-900">৳{order.amount}</p>
                </div>
              </div>

              {isDelivered && pendingReviews.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-50 flex flex-wrap gap-2">
                  {pendingReviews.map((item, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        setReviewData({ ...reviewData, productId: item.productId, productName: item.name, orderId: order._id });
                        setShowReviewModal(true);
                      }}
                      className="text-[9px] font-black uppercase tracking-widest bg-rose-500 text-white px-5 py-2.5 rounded-xl hover:bg-black transition-all shadow-lg shadow-rose-100"
                    >
                      Rate {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- REIMAGINED REVIEW MODAL --- */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl transform transition-all">
            {/* Modal Header */}
            <div className="bg-rose-500 p-8 text-center">
               <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 text-white text-3xl">
                 🥐
               </div>
               <h2 className="text-2xl font-black text-white">How was it?</h2>
               <p className="text-[10px] font-bold text-rose-100 uppercase tracking-[0.2em] mt-1">{reviewData.productName}</p>
            </div>

            <div className="p-8">
              {/* Star Rating - Prettier Design */}
              <div className="mb-8 text-center">
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-4 tracking-widest text-center">Tap to Rate</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button 
                      key={num} 
                      onClick={() => setReviewData({...reviewData, rating: num})} 
                      className="transition-all transform active:scale-90"
                    >
                      <svg 
                        className={`w-10 h-10 ${reviewData.rating >= num ? 'text-amber-400' : 'text-gray-200 hover:text-gray-300'}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="mb-8">
                <textarea 
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] p-5 text-sm font-medium h-32 focus:border-rose-500/20 focus:bg-white focus:ring-0 outline-none transition-all placeholder:text-gray-300"
                  placeholder="Tell us about the flavor and texture..."
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button 
                  onClick={submitReview} 
                  className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-rose-500 transition-all active:scale-[0.98]"
                >
                  Submit Review
                </button>
                <button 
                  onClick={() => setShowReviewModal(false)} 
                  className="w-full py-2 font-bold text-gray-400 text-xs uppercase tracking-widest hover:text-gray-600 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbox;