import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ridesAPI } from "../api";
import { useToast } from "../context/ToastContext";
import { apiError } from "../utils/helpers";
import TopBar from "../components/layout/TopBar";
 
export default function PostRidePage() {
  const navigate      = useNavigate();
  const { showToast } = useToast();
 
  const [form, setForm] = useState({
    origin:            "RCCG Redemption Camp, Km 46",
    destination:       "",
    route_description: "",
    departure_time:    "",
    total_seats:       3,
    cost_per_rider:    0,
    driver_note:       "",
  });
  const [loading, setLoading] = useState(false);
 
  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }
 
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await ridesAPI.postRide({ ...form, total_seats: Number(form.total_seats), cost_per_rider: Number(form.cost_per_rider) });
      showToast("Ride posted! Riders can now see it.");
      navigate("/home");
    } catch (err) {
      showToast(apiError(err), "error");
    } finally {
      setLoading(false);
    }
  }
 
  return (
    <div className="min-h-screen bg-cream">
      <TopBar title="Post a ride" subtitle="Let riders know you have seats available" />
 
      <div className="px-4 pt-5 pb-28 overflow-y-auto">
        {/* Car reveal notice */}
        <div className="bg-gold-50 border border-gold-200 rounded-xl p-3 flex gap-2 mb-5">
          <span className="text-xl flex-shrink-0">🔒</span>
          <p className="text-[12px] text-gold-700 leading-relaxed">
            Your car make, colour, and plate number are <strong>hidden from riders</strong> until
            you personally accept their request. This is by design.
          </p>
        </div>
 
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Leaving from</label>
            <input className="input" value={form.origin} onChange={set("origin")} required />
          </div>
 
          <div>
            <label className="label">Going to (destination)</label>
            <input className="input" placeholder="e.g. Ikeja, Allen Avenue"
              value={form.destination} onChange={set("destination")} required />
          </div>
 
          <div>
            <label className="label">Route you'll pass through <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
            <input className="input" placeholder="e.g. Ojodu, Ogba, Berger"
              value={form.route_description} onChange={set("route_description")} />
          </div>
 
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Available seats</label>
              <select className="input" value={form.total_seats} onChange={set("total_seats")}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n} seat{n > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Leaving at</label>
              <input className="input" placeholder="e.g. ~1:00 PM"
                value={form.departure_time} onChange={set("departure_time")} required />
            </div>
          </div>
 
          <div>
            <label className="label">Cost per rider (₦) — enter 0 for free</label>
            <input className="input" type="number" min="0" placeholder="0"
              value={form.cost_per_rider} onChange={set("cost_per_rider")} />
          </div>
 
          <div>
            <label className="label">A note for riders <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
            <textarea className="input resize-none" rows={3}
              placeholder="e.g. Family-friendly, no smoking please 🙏"
              value={form.driver_note} onChange={set("driver_note")} />
          </div>
 
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-[11px] font-bold text-green-700 mb-1">👤 Your profile</p>
            <p className="text-[11px] text-green-700/80">
              Riders will see your name, photo, parish, star rating, and verified badge.
              They will NOT see your car until you accept their request.
            </p>
          </div>
 
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Posting…" : "Post ride ✓"}
          </button>
        </form>
      </div>
    </div>
  );
}
