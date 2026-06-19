import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../api";
import { useToast } from "../context/ToastContext";
import { apiError } from "../utils/helpers";
 
export default function SignupPage() {
  const navigate      = useNavigate();
  const { showToast } = useToast();
 
  const [form, setForm] = useState({
    full_name: "", phone: "", password: "", parish: "", role: "",
  });
  const [loading, setLoading] = useState(false);
 
  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }
 
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.role) return showToast("Please choose Rider or Driver", "error");
 
    setLoading(true);
    try {
      await authAPI.signup(form);
      // Store phone+role so the verify page knows who we are
      sessionStorage.setItem("signup_phone", form.phone);
      sessionStorage.setItem("signup_password", form.password);
      sessionStorage.setItem("signup_role", form.role);
      navigate("/verify");
    } catch (err) {
      showToast(apiError(err), "error");
    } finally {
      setLoading(false);
    }
  }
 
  return (
    <div className="min-h-screen bg-green-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-6">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center text-white"
        >
          ←
        </button>
        <h1 className="text-white font-black text-[20px]">Create account</h1>
      </div>
 
      {/* Card */}
      <div className="flex-1 bg-cream rounded-t-3xl px-5 pt-7 pb-12 overflow-y-auto">
        {/* Role picker */}
        <p className="section-label mb-3">I am joining as…</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { value: "rider",  emoji: "🙋", label: "Rider",  sub: "I need a ride" },
            { value: "driver", emoji: "🚗", label: "Driver", sub: "I offer rides" },
          ].map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, role: r.value }))}
              className={`rounded-2xl border-2 p-4 text-left transition-all
                ${form.role === r.value
                  ? "border-green-700 bg-green-50 shadow-md"
                  : "border-green-100 bg-white"}`}
            >
              <span className="text-3xl block mb-2">{r.emoji}</span>
              <p className="font-bold text-[14px] text-gray-800">{r.label}</p>
              <p className="text-[12px] text-gray-500">{r.sub}</p>
            </button>
          ))}
        </div>
 
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" placeholder="e.g. Adaeze Okonkwo"
              value={form.full_name} onChange={set("full_name")} required />
          </div>
          <div>
            <label className="label">Phone number</label>
            <input className="input" type="tel" placeholder="08012345678"
              value={form.phone} onChange={set("phone")} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Min 8 characters"
              value={form.password} onChange={set("password")} minLength={8} required />
          </div>
          <div>
            <label className="label">RCCG Parish / Branch</label>
            <input className="input" placeholder="e.g. House of Mercy Parish, Lagos"
              value={form.parish} onChange={set("parish")} />
          </div>
 
          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "Creating account…" : "Continue to verification →"}
          </button>
        </form>
 
        <p className="text-center text-[14px] text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-green-700 font-bold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}