import { useNavigate } from "react-router-dom";
 
export default function TopBar({ title, subtitle, onBack, action, transparent = false }) {
  const navigate = useNavigate();
 
  return (
    <div className={`${transparent ? "bg-transparent" : "bg-green-700"} px-4 pt-3 pb-4 flex items-center gap-3`}>
      {(onBack !== false) && (
        <button
          onClick={onBack || (() => navigate(-1))}
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center
                     bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
        >
          ←
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-white font-bold text-[16px] leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-white/70 text-[12px] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
 