import { createContext, useContext, useState, useCallback } from "react";
 
const ToastContext = createContext(null);
 
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
 
  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);
 
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-24 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-[14px] font-medium
              animate-in slide-in-from-bottom-4 duration-300
              ${t.type === "error"   ? "bg-red-600"    : ""}
              ${t.type === "success" ? "bg-green-700"  : ""}
              ${t.type === "info"    ? "bg-gold-500"   : ""}
            `}
          >
            <span>
              {t.type === "success" && "✓ "}
              {t.type === "error"   && "✕ "}
              {t.type === "info"    && "ℹ "}
              {t.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
 
export function useToast() {
  return useContext(ToastContext);
}