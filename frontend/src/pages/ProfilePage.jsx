import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usersAPI } from "../api";
import { apiError } from "../utils/helpers";
import Avatar from "../components/common/avatar";
import { Stars } from "../components/common/stars";
import TopBar from "../components/layout/topbar";
import BottomNav from "../components/layout/bottomNav";
 
export default function ProfilePage() {
  const navigate                     = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const { showToast }                = useToast();
 
  const [editingCar, setEditingCar] = useState(false);
  const [editingSOS, setEditingSOS] = useState(false);
  const [saving, setSaving]         = useState(false);
 
  // Car form — always seeds from live user context so it stays in sync
  const [carForm, setCarForm] = useState({
    car_make:   user?.car_make   || "",
    car_model:  user?.car_model  || "",
    car_year:   user?.car_year   || "",
    car_colour: user?.car_colour || "",
    car_plate:  user?.car_plate  || "",
  });
 
  const [sosForm, setSosForm] = useState({
    name:  user?.emergency_contact_name  || "",
    phone: user?.emergency_contact_phone || "",
  });
 
  function setCar(field) { return (e) => setCarForm((f) => ({ ...f, [field]: e.target.value })); }
  function setSOS(field) { return (e) => setSosForm((f) => ({ ...f, [field]: e.target.value })); }
 
  async function saveCar() {
    setSaving(true);
    try {
      const res = await usersAPI.updateCarDetails({
        ...carForm,
        car_year: carForm.car_year ? Number(carForm.car_year) : null,
      });
      // Update both the global auth context AND local form state
      updateUser(res.data);
      setCarForm({
        car_make:   res.data.car_make   || "",
        car_model:  res.data.car_model  || "",
        car_year:   res.data.car_year   || "",
        car_colour: res.data.car_colour || "",
        car_plate:  res.data.car_plate  || "",
      });
      setEditingCar(false);
      showToast("Car details saved ✓");
    } catch (err) {
      showToast(apiError(err), "error");
    } finally {
      setSaving(false);
    }
  }
 
  async function saveSOS() {
    setSaving(true);
    try {
      const res = await usersAPI.updateEmergencyContact(sosForm);
      updateUser(res.data);
      setSosForm({
        name:  res.data.emergency_contact_name  || "",
        phone: res.data.emergency_contact_phone || "",
      });
      setEditingSOS(false);
      showToast("Emergency contact saved ✓");
    } catch (err) {
      showToast(apiError(err), "error");
    } finally {
      setSaving(false);
    }
  }
 
  const hasCarDetails = user?.car_make && user?.car_plate;
 
  return (
    <>
      <div className="page">
        {/* Green header */}
        <div className="bg-green-700 px-4 pt-5 pb-8 text-center">
          <Avatar user={user} size="xl" showVerified className="mx-auto mb-3" />
          <h1 className="text-white font-black text-[20px]">{user?.full_name}</h1>
          {user?.parish && <p className="text-white/70 text-[13px] mt-0.5">{user.parish}</p>}
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="badge bg-white/20 text-white border-0">
              {user?.role === "driver" ? "🚗 Driver" : "🙋 Rider"}
            </span>
          </div>
          {/* Stats */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="text-center">
              <p className="text-white font-black text-[20px]">{user?.total_rides || 0}</p>
              <p className="text-white/60 text-[10px] uppercase tracking-wide font-bold">Rides</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <Stars score={user?.average_rating || 0} />
              <p className="text-white/60 text-[10px] uppercase tracking-wide font-bold mt-0.5">
                {(user?.average_rating || 0).toFixed(1)} rating
              </p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-white font-black text-[20px]">{user?.total_ratings || 0}</p>
              <p className="text-white/60 text-[10px] uppercase tracking-wide font-bold">Reviews</p>
            </div>
          </div>
        </div>
 
        <div className="px-4 -mt-3">
 
          {/* Car details — driver only */}
          {user?.role === "driver" && (
            <div className="card p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="section-label mb-0">🚗 Car details</p>
                  {!hasCarDetails && (
                    <p className="text-[11px] text-red-500 font-semibold mt-0.5">
                      Required before posting rides
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setEditingCar(!editingCar);
                    // Re-seed form from latest user data when opening
                    if (!editingCar) {
                      setCarForm({
                        car_make:   user?.car_make   || "",
                        car_model:  user?.car_model  || "",
                        car_year:   user?.car_year   || "",
                        car_colour: user?.car_colour || "",
                        car_plate:  user?.car_plate  || "",
                      });
                    }
                  }}
                  className="text-green-700 text-[12px] font-bold"
                >
                  {editingCar ? "Cancel" : hasCarDetails ? "Edit" : "Add ✚"}
                </button>
              </div>
 
              {editingCar ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Make</label>
                      <input className="input" placeholder="Toyota" value={carForm.car_make} onChange={setCar("car_make")} />
                    </div>
                    <div>
                      <label className="label">Model</label>
                      <input className="input" placeholder="Camry" value={carForm.car_model} onChange={setCar("car_model")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Year</label>
                      <input className="input" type="number" placeholder="2019" value={carForm.car_year} onChange={setCar("car_year")} />
                    </div>
                    <div>
                      <label className="label">Colour</label>
                      <input className="input" placeholder="Silver" value={carForm.car_colour} onChange={setCar("car_colour")} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Plate number</label>
                    <input className="input" placeholder="LND 423 GH" value={carForm.car_plate} onChange={setCar("car_plate")} />
                  </div>
                  <div className="bg-gold-50 border border-gold-200 rounded-xl p-2.5">
                    <p className="text-[11px] text-gold-700">
                      🔒 Car details stay hidden from riders until you accept their request.
                    </p>
                  </div>
                  <button onClick={saveCar} disabled={saving} className="btn-primary">
                    {saving ? "Saving…" : "Save car details"}
                  </button>
                </div>
              ) : hasCarDetails ? (
                /* Display saved car details */
                <div className="bg-green-700 rounded-xl p-4 text-white">
                  <p className="font-black text-[17px]">
                    {user.car_make} {user.car_model} {user.car_year}
                  </p>
                  <p className="text-white/70 text-[13px] mt-0.5 capitalize">{user.car_colour}</p>
                  <div className="bg-white/15 rounded-lg mt-2 py-1.5 px-3 inline-block">
                    <p className="font-black text-[16px] tracking-[0.12em]">{user.car_plate}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-gray-400">
                  No car details yet. Add them above — you won't be able to post rides without them.
                </p>
              )}
            </div>
          )}
 
          {/* Emergency contact */}
          <div className="card p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="section-label mb-0">🆘 Emergency contact</p>
              <button
                onClick={() => setEditingSOS(!editingSOS)}
                className="text-green-700 text-[12px] font-bold"
              >
                {editingSOS ? "Cancel" : user?.emergency_contact_name ? "Edit" : "Add ✚"}
              </button>
            </div>
            {editingSOS ? (
              <div className="space-y-3">
                <div>
                  <label className="label">Contact name</label>
                  <input className="input" placeholder="e.g. Mum" value={sosForm.name} onChange={setSOS("name")} />
                </div>
                <div>
                  <label className="label">Phone number</label>
                  <input className="input" type="tel" placeholder="08023456789" value={sosForm.phone} onChange={setSOS("phone")} />
                </div>
                <button onClick={saveSOS} disabled={saving} className="btn-primary">
                  {saving ? "Saving…" : "Save contact"}
                </button>
              </div>
            ) : user?.emergency_contact_name ? (
              <div>
                <p className="font-bold text-[14px]">{user.emergency_contact_name}</p>
                <p className="text-[13px] text-gray-500">{user.emergency_contact_phone}</p>
              </div>
            ) : (
              <p className="text-[13px] text-gray-400">
                No emergency contact set. Used for the silent SOS alert during rides.
              </p>
            )}
          </div>
 
          {/* Account info */}
          <div className="card p-4 mb-4">
            <p className="section-label mb-3">Account</p>
            <div className="info-row">
              <span className="text-gray-400 text-[13px]">Phone</span>
              <span className="font-semibold text-[13px]">{user?.phone}</span>
            </div>
            <div className="info-row">
              <span className="text-gray-400 text-[13px]">Role</span>
              <span className="font-semibold text-[13px] capitalize">{user?.role}</span>
            </div>
            <div className="info-row">
              <span className="text-gray-400 text-[13px]">Member since</span>
              <span className="font-semibold text-[13px]">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-NG", { month: "short", year: "numeric" }) : "—"}
              </span>
            </div>
            <div className="info-row">
              <span className="text-gray-400 text-[13px]">Phone verified</span>
              <span className="text-[11px] font-bold text-gray-400">
                Added later via Termii OTP
              </span>
            </div>
          </div>
 
          <button onClick={logout} className="btn-secondary mb-4" style={{ color: "#dc2626", borderColor: "#fca5a5" }}>
            Sign out
          </button>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
