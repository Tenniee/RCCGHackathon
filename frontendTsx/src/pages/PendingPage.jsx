import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
 
const STEPS = [
  { icon: "✅", title: "Documents submitted",  sub: "Received by admin",          done: true  },
  { icon: "🔍", title: "Admin review",          sub: "In progress (2–6 hours)",    done: false },
  { icon: "🎉", title: "Account activated",     sub: "Pending admin approval",     done: false },
];
 
export default function PendingPage() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
 
  // If already verified, redirect
  if (user?.is_verified) {
    navigate("/home", { replace: true });
    return null;
  }
 
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Green top section */}
      <div className="bg-green-700 px-5 pt-12 pb-8 text-center">
        <div className="text-5xl mb-3">⏳</div>
        <h1 className="text-white font-black text-[22px] mb-2">Under review</h1>
        <p className="text-white/75 text-[13px] leading-relaxed max-w-[280px] mx-auto">
          Your documents are with the RCCG community admin.
          You'll be notified in-app once approved.
        </p>
      </div>
 
      <div className="flex-1 px-5 py-7">
        {/* Verification steps */}
        <p className="section-label mb-4">Verification progress</p>
        <div className="card p-4 mb-6">
          {STEPS.map((step, i) => (
            <div key={step.title}
              className={`flex items-center gap-3 py-3 ${i < STEPS.length - 1 ? "border-b border-green-50" : ""}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                ${step.done ? "bg-green-700" : "bg-green-100"}`}>
                {step.icon}
              </div>
              <div>
                <p className={`font-bold text-[14px] ${step.done ? "text-green-700" : "text-gray-700"}`}>
                  {step.title}
                </p>
                <p className="text-[12px] text-gray-400">{step.sub}</p>
              </div>
              {step.done && (
                <span className="ml-auto badge badge-green text-[10px]">Done</span>
              )}
            </div>
          ))}
        </div>
 
        {/* What can you do while waiting */}
        <p className="section-label mb-3">While you wait</p>
        <div className="card p-4 mb-6 space-y-3">
          {user?.role === "driver" && (
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-3 w-full text-left"
            >
              <span className="text-2xl">🚗</span>
              <div>
                <p className="font-bold text-[14px] text-gray-800">Add your car details</p>
                <p className="text-[12px] text-gray-400">Make, model, colour, plate number</p>
              </div>
              <span className="ml-auto text-green-700">→</span>
            </button>
          )}
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-3 w-full text-left"
          >
            <span className="text-2xl">🆘</span>
            <div>
              <p className="font-bold text-[14px] text-gray-800">Set emergency contact</p>
              <p className="text-[12px] text-gray-400">Used for the silent SOS alert</p>
            </div>
            <span className="ml-auto text-green-700">→</span>
          </button>
        </div>
 
        <button
          onClick={logout}
          className="btn-secondary text-[14px]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
