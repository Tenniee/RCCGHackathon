import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
 
export default function SplashPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
 
  useEffect(() => {
    if (user) navigate("/home", { replace: true });
  }, [user, navigate]);
 
  return (
    <div className="min-h-screen bg-green-700 flex flex-col items-center justify-between px-6 py-16">
      {/* Logo section */}
      <div />
      <div className="text-center">
        <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-5xl">
          🚗
        </div>
        <h1 className="text-white text-4xl font-black tracking-tight leading-tight">
          Ride<br />Connect
        </h1>
        <div className="flex items-center gap-2 justify-center mt-3 mb-4">
          <div className="h-px w-10 bg-gold-400" />
          <p className="text-gold-200 text-[13px] font-bold tracking-widest uppercase">
            RCCG Community
          </p>
          <div className="h-px w-10 bg-gold-400" />
        </div>
        <p className="text-white/70 text-[14px] leading-relaxed max-w-[260px] mx-auto">
          Safe, trusted rides between church members. No more hitchhiking after service.
        </p>
      </div>
 
      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => navigate("/signup")}
          className="w-full bg-gold-500 text-white font-bold py-4 rounded-xl text-[15px]
                     active:opacity-90 transition-opacity"
        >
          Create account
        </button>
        <button
          onClick={() => navigate("/login")}
          className="w-full bg-white/15 text-white font-bold py-4 rounded-xl text-[15px]
                     border border-white/30 active:opacity-90 transition-opacity"
        >
          Sign in
        </button>
        <p className="text-white/40 text-[11px] text-center pt-2">
          RCCG Ride Connect · Prototype v1
        </p>
      </div>
    </div>
  );
}