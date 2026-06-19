import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiError } from "../utils/helpers";
 
export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const { showToast }      = useToast();
 
  const [form, setForm] = useState({ phone: "", password: "" });
 
  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }
 
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const user = await login(form.phone, form.password);
      navigate(user.role === "driver" ? "/home" : "/home", { replace: true });
    } catch (err) {
      showToast(apiError(err), "error");
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
        <h1 className="text-white font-black text-[20px]">Sign in</h1>
      </div>
 
      {/* Card */}
      <div className="flex-1 bg-cream rounded-t-3xl px-5 pt-7 pb-10">
        <p className="text-[14px] text-gray-500 mb-7">
          Welcome back 🙏 Sign in to your RCCG Ride Connect account.
        </p>
 
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Phone number</label>
            <input
              className="input"
              type="tel"
              placeholder="08012345678"
              value={form.phone}
              onChange={set("phone")}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={set("password")}
              required
            />
          </div>
 
          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
 
        <p className="text-center text-[14px] text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-green-700 font-bold">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
