const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Glassmorphism Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-rose-50 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <span className="text-3xl">⚠️</span>
        </div>

        <h3 className="text-2xl font-black text-center text-gray-900 mb-2">
          {title || "Are you sure?"}
        </h3>
        <p className="text-gray-500 text-center text-sm leading-relaxed mb-8">
          {message || "This action cannot be undone. This product will be removed from your bakery catalog forever."}
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