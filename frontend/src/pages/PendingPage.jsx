import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
 
// For the prototype, all steps show as complete — no waiting for admin.
// In production, restore the real pending state and remove the auto-redirect.
const STEPS = [
  { icon: "✅", title: "Documents submitted",   sub: "Received by admin"          },
  { icon: "✅", title: "Admin review complete",  sub: "Verified by RCCG community" },
  { icon: "🎉", title: "Account activated",      sub: "You're good to go!"         },
];
 
export default function PendingPage() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
 
  // Prototype: auto-redirect to home after 2.5s so the user
  // sees the "verified" state briefly before moving on.
  // In production: remove this useEffect and wait for real admin approval.
  useEffect(() => {
    const id = setTimeout(() => navigate("/home", { replace: true }), 2500);
    return () => clearTimeout(id);
  }, [navigate]);
 
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Green top section */}
      <div className="bg-green-700 px-5 pt-12 pb-8 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-white font-black text-[22px] mb-2">Account verified!</h1>
        <p className="text-white/75 text-[13px] leading-relaxed max-w-[280px] mx-auto">
          Your account has been verified by an admin.
          Welcome to RCCG Ride Connect 🙏
        </p>
      </div>
 
      <div className="flex-1 px-5 py-7">
        {/* Verification steps — all done */}
        <p className="section-label mb-4">Verification progress</p>
        <div className="card p-4 mb-6">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className={`flex items-center gap-3 py-3 ${i < STEPS.length - 1 ? "border-b border-green-50" : ""}`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-green-700">
                {step.icon}
              </div>
              <div>
                <p className="font-bold text-[14px] text-green-700">{step.title}</p>
                <p className="text-[12px] text-gray-400">{step.sub}</p>
              </div>
              <span className="ml-auto badge badge-green text-[10px]">Done</span>
            </div>
          ))}
        </div>
 
        <p className="text-center text-[12px] text-gray-400 mb-5">
          Taking you to the app in a moment…
        </p>
 
        <button
          onClick={() => navigate("/home", { replace: true })}
          className="btn-primary mb-3"
        >
          Continue to app →
        </button>
 
        <button onClick={logout} className="btn-secondary text-[14px]">
          Sign out
        </button>
      </div>
    </div>
  );
}
