import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const NOAKHALI_DATA = {
  "Noakhali Sadar (Sudharam)": ["Anderchar", "Ashwadia", "Binodpur", "Char Matua", "Dadpur", "Dharmapur", "Ewazbalia", "Kadir Hanif", "Kaladaraf", "Niazpur", "Noakhali", "Noannai", "Purba Char Matua"],
  "Begumganj": ["Amanullapur", "Gopalpur", "Jirtali", "Rajganj", "Alyearpur", "Durgapur", "Kutubpur", "Rasulpur", "Begumganj", "Eklashpur", "Mirwarishpur", "Sharifpur", "Chayani", "Hajipur", "Narottampur", "Gonipur"],
  "Chatkhil": ["Badalkut", "Hatpukuria Ghatlabag", "Khilpara", "Mohammadpur", "Noakhola", "Panchgaon", "Parkote", "Ramnarayanpur", "Shahapur"],
  "Companiganj": ["Char Elahi", "Char Fakira", "Char Hazari", "Char Kakra", "Char Parbati", "Musapur", "Rampur", "Sirajpur"],
  "Hatiya": ["Burir Char", "Char Ishwar", "Char King", "Chandandi", "Harni", "Jahajmara", "Nalchira", "Nijhum Dwip", "Sonadia", "Sukh Char", "Tamaruddin"],
  "Senbagh": ["Arjuntala", "Bijbagh", "Chatarpaya", "Dumuruya", "Kabilpur", "Kadra", "Kesharpar", "Mohammadpur", "Nabipur"],
  "Sonaimuri": ["Ambarnagar", "Amisha Para", "Baragaon", "Bazra", "Deoti", "Jayag", "Nadana", "Nateshwar", "Sonaimuri", "Sonapur"],
  "Subarnachar": ["Char Amanullah", "Char Bata", "Char Clerk", "Char Jabbar", "Char Jubaly", "Char Majid", "Char Sujan", "Char Wapda"],
  "Kabirhat": ["Batya", "Chaprashirhat", "Dhan Shalik", "Dhanshiri", "Ghoshbag", "Narottampur", "Sundalpur"]
};

const Checkout = () => {
  const { cartItems, clearCart, getDiscountedPrice } = useContext(CartContext);
  const { backendUrl, userData } = useContext(AppContent);
  const navigate = useNavigate();
  const location = useLocation();

  const selectedItemIds = location.state?.selectedItems || [];
  const passedSubtotal = location.state?.subtotal || 0;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    district: "Noakhali",
    upazila: "",
    union: "",
    streetAddress: "",
    deliveryDate: "",
    paymentMethod: "cod",
    transactionId: "",
    lastFourDigits: "",
    specialMessage: "",
  });

  useEffect(() => {
    if (selectedItemIds.length === 0) {
      toast.error("Please select items in your cart first");
      navigate("/cart");
    }
  }, [selectedItemIds, navigate]);

  const today = new Date().toISOString().split("T")[0];

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "upazila") {
      setDeliveryCharge(60); 
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return toast.info("Enter a coupon code");
    if (couponCode.toUpperCase() === "RUET50") {
        setCouponDiscount(50);
        setIsCouponApplied(true);
        toast.success("Promo Applied: ৳50 Off!");
    } else {
        toast.error("Invalid Coupon Code");
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const itemsToOrder = cartItems
        .filter(item => selectedItemIds.includes(item.productId || item.product?._id))
        .map(item => ({
          productId: item.productId || item.product?._id,
          name: item.product?.name,
          price: getDiscountedPrice ? getDiscountedPrice(item.product) : item.product?.price,
          quantity: item.quantity,
        }));

      const orderData = {
        items: itemsToOrder,
        subtotal: passedSubtotal,
        couponDiscount,
        amount: passedSubtotal + deliveryCharge - couponDiscount,
        deliveryDate: formData.deliveryDate,
        address: { ...formData },
        paymentMethod: formData.paymentMethod,
        paymentDetails: {
          transactionId: formData.transactionId,
          lastFourDigits: formData.lastFourDigits
        }
      };

      const { data } = await axios.post(`${backendUrl}/api/order/place`, orderData, {
        headers: { token: userData.token }
      });

      if (data.success) {
        toast.success("Order Placed Successfully!");
        clearCart();
        navigate('/inbox');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Order failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalAmount = passedSubtotal + deliveryCharge - couponDiscount;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-10 pb-20">
      <button onClick={() => navigate("/cart")} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-rose-600 mb-4">
        ← Back to Cart
      </button>

      <h1 className="text-3xl font-black text-gray-900 mb-8">Checkout Details</h1>

      <form onSubmit={onSubmitHandler} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required name="fullName" value={formData.fullName} onChange={onChangeHandler} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl" placeholder="Receiver Name" />
            <input required type="tel" name="phone" value={formData.phone} onChange={onChangeHandler} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl" placeholder="Phone Number" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select disabled className="p-4 bg-gray-100 border border-gray-200 rounded-2xl"><option>Noakhali</option></select>
            <select required name="upazila" onChange={onChangeHandler} value={formData.upazila} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
              <option value="">Upazilla</option>
              {Object.keys(NOAKHALI_DATA).map(upz => <option key={upz} value={upz}>{upz}</option>)}
            </select>
            <select required name="union" onChange={onChangeHandler} value={formData.union} disabled={!formData.upazila} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
              <option value="">Union</option>
              {formData.upazila && NOAKHALI_DATA[formData.upazila].map(un => <option key={un} value={un}>{un}</option>)}
            </select>
          </div>

          <textarea required name="streetAddress" value={formData.streetAddress} onChange={onChangeHandler} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl h-24" placeholder="Detailed Address..." />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required type="date" min={today} name="deliveryDate" value={formData.deliveryDate} onChange={onChangeHandler} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl" />
            <input name="specialMessage" value={formData.specialMessage} onChange={onChangeHandler} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl" placeholder="Special Note (Optional)" />
          </div>

          {/* FIXED: Re-added Transaction ID and Last 4 Digits inputs */}
          {formData.paymentMethod !== 'cod' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-rose-50 rounded-3xl border border-rose-100">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-rose-400 ml-2">Transaction ID</label>
                <input required name="transactionId" value={formData.transactionId} onChange={onChangeHandler} className="w-full p-4 bg-white border border-rose-200 rounded-2xl outline-none" placeholder="e.g. 8N7X6W" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-rose-400 ml-2">Last 4 Digits</label>
                <input required name="lastFourDigits" value={formData.lastFourDigits} onChange={onChangeHandler} className="w-full p-4 bg-white border border-rose-200 rounded-2xl outline-none" placeholder="e.g. 4455" />
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100">
            <h3 className="text-sm font-bold text-rose-600 uppercase mb-3">Have a Coupon?</h3>
            <div className="flex gap-2">
                <input type="text" placeholder="Enter Code" className="flex-grow p-3 rounded-xl outline-none text-sm" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} disabled={isCouponApplied} />
                <button type="button" onClick={handleApplyCoupon} disabled={isCouponApplied} className={`px-4 rounded-xl font-bold text-xs ${isCouponApplied ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'}`}>
                    {isCouponApplied ? "Applied" : "Apply"}
                </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Order Summary</h3>
            <div className="space-y-3 border-b pb-4 mb-4 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-bold">৳{passedSubtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="font-bold">৳{deliveryCharge}</span></div>
              {couponDiscount > 0 && <div className="flex justify-between text-emerald-600"><span>Coupon Discount</span><span className="font-bold">-৳{couponDiscount}</span></div>}
            </div>
            <div className="flex justify-between items-center"><span className="font-bold text-gray-900">Total</span><span className="text-2xl font-black text-rose-600">৳{finalAmount.toLocaleString()}</span></div>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white">
            <h3 className="text-lg font-bold mb-4 text-rose-400">Payment Method</h3>
            <div className="space-y-2">
              {['cod', 'bkash', 'nagad'].map((method) => (
                <label key={method} className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all ${formData.paymentMethod === method ? 'bg-white/10 border-rose-500' : 'border-white/5'}`}>
                  <input type="radio" name="paymentMethod" value={method} checked={formData.paymentMethod === method} onChange={onChangeHandler} className="accent-rose-500" />
                  <span className="capitalize text-sm font-bold">{method === 'cod' ? 'Cash on Delivery' : method}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className={`w-full py-5 text-white font-black rounded-full transition-all ${isSubmitting ? 'bg-gray-400' : 'bg-rose-600 hover:bg-rose-700'}`}>
            {isSubmitting ? "Placing Order..." : "Confirm Order"}
          </button>
        </aside>
      </form>
    </div>
  );
};

export default Checkout;