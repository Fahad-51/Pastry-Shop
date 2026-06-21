import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AppContent } from '../context/AppContext';
import { toast } from 'react-toastify';

const AdminOrders = () => {
  const { backendUrl, userData } = useContext(AppContent);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all orders and sort by priority
  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/order/list`, {
        headers: { token: userData.token }
      });
      if (data.success) {
        // SORTING LOGIC:
        // 1. Newest date first
        // 2. Active status (Pending/Accepted) stays above finished ones
        const sorted = data.orders.sort((a, b) => {
          const isAPast = a.status === 'Delivered' || a.status === 'Cancelled';
          const isBPast = b.status === 'Delivered' || b.status === 'Cancelled';
          
          if (isAPast && !isBPast) return 1;
          if (!isAPast && isBPast) return -1;
          return b.date - a.date;
        });
        setOrders(sorted);
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not load orders from server");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    let rejectionReason = "";
    if (newStatus === 'Cancelled') {
      rejectionReason = window.prompt("Reason for rejection?");
      if (rejectionReason === null) return;
    }

    try {
      const { data } = await axios.post(`${backendUrl}/api/order/status`, 
        { orderId, status: newStatus, rejectionReason },
        { headers: { token: userData.token }}
      );
      
      if (data.success) {
        toast.success(`Order marked as ${newStatus}`);
        fetchOrders(); // Refresh to re-sort and apply opacity
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  useEffect(() => { 
    if (userData && userData.role === 'admin') fetchOrders(); 
  }, [userData]);

  if (loading) return (
    <div className="pt-32 text-center">
      <div className="animate-spin inline-block w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mb-4"></div>
      <p className="font-bold text-gray-500 tracking-tighter uppercase text-xs">Accessing Kitchen Database...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 pt-10 pb-20">
      <div className="flex items-center justify-between mb-10">
        <div>
           <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Kitchen Control</h1>
           <p className="text-gray-400 text-sm font-bold uppercase mt-1">Real-time Order Management</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-emerald-500 text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase">
            {orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length} Active
          </div>
          <div className="bg-slate-200 text-slate-600 px-6 py-2 rounded-2xl text-[10px] font-black uppercase">
            {orders.length} Total
          </div>
        </div>
      </div>
      
      <div className="grid gap-8">
        {orders.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
             <p className="text-gray-400 text-xl font-bold italic">No orders found in history.</p>
          </div>
        ) : (
          orders.map((order) => {
            const isPast = order.status === 'Delivered' || order.status === 'Cancelled';

            return (
              <div 
                key={order._id} 
                className={`bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm transition-all duration-500 ${
                  isPast ? 'opacity-60 grayscale-[0.3] scale-[0.99]' : 'hover:shadow-xl hover:scale-[1.01]'
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                  
                  {/* 1. Customer Info */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">Receiver</p>
                      <h3 className="font-black text-2xl text-gray-900 leading-tight">{order.address.fullName}</h3>
                      <p className="font-bold text-gray-600">📞 {order.address.phone}</p>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Location</p>
                      <p className="text-sm font-black text-slate-700">{order.address.upazila}, {order.address.union}</p>
                      <p className="text-xs text-slate-500 mt-1 italic">"{order.address.streetAddress}"</p>
                    </div>
                  </div>

                  {/* 2. Order Summary */}
                  <div className="lg:border-x border-gray-100 lg:px-10">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Items</p>
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm items-center">
                          <span className="font-bold text-gray-800">{item.name} <span className="text-rose-500">x{item.quantity}</span></span>
                          <span className="font-medium text-gray-400">৳{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-5 border-t border-dashed border-gray-200 flex justify-between items-center text-indigo-600 font-black">
                      <span className="text-xs uppercase">Total</span>
                      <span className="text-2xl tracking-tighter">৳{order.amount}</span>
                    </div>
                  </div>

                  {/* 3. Payment */}
                  <div className="lg:pr-10">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Verification</p>
                    <div className={`rounded-2xl p-5 text-white shadow-lg ${isPast ? 'bg-slate-400' : 'bg-slate-900'}`}>
                       <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Method</span>
                          <span className="text-xs font-black bg-rose-500 px-2 py-0.5 rounded uppercase">{order.paymentMethod}</span>
                       </div>
                       {order.paymentMethod !== 'cod' ? (
                         <div className="space-y-2">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">TrxID</p>
                            <p className="text-xs font-mono font-bold text-emerald-400 break-all">{order.paymentDetails?.transactionId || 'N/A'}</p>
                         </div>
                       ) : (
                         <p className="text-[10px] font-bold text-slate-500 text-center py-2 uppercase">Cash on Delivery</p>
                       )}
                    </div>
                  </div>

                  {/* 4. Timeline & Control */}
                  <div className="flex flex-col justify-between items-end gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Target Date</p>
                      <p className="font-black text-slate-900 text-2xl">{order.deliveryDate || 'ASAP'}</p>
                      <div className="mt-2">
                         <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                           order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                           order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                           'bg-amber-50 text-amber-600 border-amber-100'
                         }`}>
                           {order.status.toUpperCase()}
                         </span>
                      </div>
                    </div>

                    {!isPast && (
                      <div className="w-full space-y-2">
                        {order.status === 'Pending' && (
                          <button 
                            onClick={() => updateStatus(order._id, 'Accepted')}
                            className="w-full py-2 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 text-[10px] uppercase tracking-widest transition-all"
                          >
                            ✓ Accept Order
                          </button>
                        )}
                        <button 
                          onClick={() => updateStatus(order._id, 'Delivered')}
                          className="w-full py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-emerald-600 transition-all text-xs"
                        >
                          MARK DELIVERED
                        </button>
                        <button 
                          onClick={() => updateStatus(order._id, 'Cancelled')}
                          className="w-full py-1 text-rose-500 font-bold text-[9px] uppercase tracking-tighter"
                        >
                          ✕ Reject Order
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {order.address.specialMessage && (
                  <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start">
                    <div className="bg-amber-500 text-white px-2 py-1 rounded text-[7px] font-black uppercase mt-0.5">Note</div>
                    <p className="text-xs text-amber-900 font-bold leading-relaxed">{order.address.specialMessage}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminOrders;