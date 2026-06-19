import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ridesAPI } from "../api";
import { useToast } from "../context/ToastContext";
import { apiError } from "../utils/helpers";
import RideCard from "../components/rides/ridecard";
import BottomNav from "../components/layout/bottomNav";
import Avatar from "../components/common/avatar";
 
// ─── Rider home ───────────────────────────────────────────────────────────────
function RiderHome() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ destination: "", route_keyword: "" });
 
  useEffect(() => { fetchFeed(); }, []); // eslint-disable-line
 
  async function fetchFeed() {
    setLoading(true);
    try {
      const params = {};
      if (filters.destination)   params.destination   = filters.destination;
      if (filters.route_keyword) params.route_keyword = filters.route_keyword;
      const res = await ridesAPI.getFeed(params);
      setRides(res.data);
    } catch {
      setRides([]);
    } finally {
      setLoading(false);
    }
  }
 
  return (
    <div className="page">
      <div className="bg-green-700 px-4 pt-4 pb-5">
        <p className="text-white/70 text-[12px] font-bold tracking-widest uppercase">Welcome back 🙏</p>
        <h1 className="text-white font-black text-[22px] mt-0.5">Find a ride</h1>
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 bg-white/15 text-white placeholder-white/50 rounded-xl px-4 py-2.5
                       text-[14px] outline-none border border-white/20 focus:border-white/50"
            placeholder="Where are you going?"
            value={filters.destination}
            onChange={(e) => setFilters((f) => ({ ...f, destination: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && fetchFeed()}
          />
          <button onClick={fetchFeed} className="bg-gold-500 text-white px-4 rounded-xl font-bold text-[14px]">
            Search
          </button>
        </div>
        <input
          className="mt-2 w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-2
                     text-[13px] outline-none border border-white/15"
          placeholder="Filter by route passing through…"
          value={filters.route_keyword}
          onChange={(e) => setFilters((f) => ({ ...f, route_keyword: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && fetchFeed()}
        />
      </div>
 
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label mb-0">
            {loading ? "Loading…" : `${rides.length} ride${rides.length === 1 ? "" : "s"} available`}
          </p>
          <button onClick={fetchFeed} className="text-green-700 text-[12px] font-bold">↻ Refresh</button>
        </div>
 
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="card p-4 h-32 animate-pulse bg-gray-100" />)}
          </div>
        ) : rides.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🚗</p>
            <p className="font-bold text-gray-600">No rides posted yet</p>
            <p className="text-[13px] text-gray-400 mt-1">Check back after service.</p>
          </div>
        ) : (
          rides.map((ride) => <RideCard key={ride.id} ride={ride} />)
        )}
      </div>
    </div>
  );
}
 
// ─── Driver home ──────────────────────────────────────────────────────────────
function DriverHome() {
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const { showToast } = useToast();
  const [myRides, setMyRides]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [working, setWorking]   = useState(null); // ride id being acted on
 
  const hasCarDetails = user?.car_make && user?.car_plate;
 
  useEffect(() => { fetchMyRides(); }, []); // eslint-disable-line
 
  async function fetchMyRides() {
    setLoading(true);
    try {
      const res = await ridesAPI.myPosted();
      setMyRides(res.data);
    } catch {
      setMyRides([]);
    } finally {
      setLoading(false);
    }
  }
 
  async function handleStart(rideId) {
    setWorking(rideId);
    try {
      await ridesAPI.startRide(rideId);
      showToast("Ride started! Riders have been notified.");
      fetchMyRides();
    } catch (err) {
      showToast(apiError(err), "error");
    } finally {
      setWorking(null);
    }
  }
 
  async function handleComplete(rideId) {
    setWorking(rideId);
    try {
      await ridesAPI.completeRide(rideId);
      showToast("Ride completed! 🎉");
      fetchMyRides();
    } catch (err) {
      showToast(apiError(err), "error");
    } finally {
      setWorking(null);
    }
  }
 
  async function handleCancel(rideId) {
    setWorking(rideId);
    try {
      await ridesAPI.cancelRide(rideId);
      showToast("Ride cancelled. Pending requests declined.");
      fetchMyRides();
    } catch (err) {
      showToast(apiError(err), "error");
    } finally {
      setWorking(null);
    }
  }
 
  const activeRides    = myRides.filter((r) => ["open", "full", "in_progress"].includes(r.status));
  const completedRides = myRides.filter((r) => ["completed", "cancelled"].includes(r.status));
 
  const STATUS_BADGE = {
    open:        "badge-green",
    full:        "badge-gold",
    in_progress: "badge-gold",
    completed:   "badge-gray",
    cancelled:   "badge-red",
  };
 
  return (
    <div className="page">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-4 pb-6">
        <div className="flex items-center gap-3">
          <Avatar user={user} size="md" showVerified />
          <div>
            <p className="text-white/70 text-[12px] font-bold tracking-widest uppercase">Driver dashboard</p>
            <h1 className="text-white font-black text-[18px]">{user?.full_name}</h1>
            {user?.parish && <p className="text-white/60 text-[12px]">{user.parish}</p>}
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "Rides given",  value: user?.total_rides || 0, icon: "🚗" },
            { label: "Rating",       value: (user?.average_rating || 0).toFixed(1), icon: "⭐" },
            { label: "Active rides", value: activeRides.length, icon: "🟢" },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-[20px]">{s.icon}</p>
              <p className="text-white font-black text-[18px]">{s.value}</p>
              <p className="text-white/60 text-[10px] font-bold tracking-wide uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
 
      <div className="px-4 pt-4">
        {/* Car details gate */}
        {!hasCarDetails && (
          <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 mb-4 flex gap-3 items-start">
            <span className="text-2xl flex-shrink-0">🚗</span>
            <div className="flex-1">
              <p className="font-bold text-[14px] text-gold-700">Add your car details first</p>
              <p className="text-[12px] text-gold-600 mt-0.5">
                You need to add your car make, model, colour and plate number before you can post rides.
              </p>
              <button
                onClick={() => navigate("/profile")}
                className="mt-2 text-[12px] font-bold text-gold-700 underline"
              >
                Go to profile →
              </button>
            </div>
          </div>
        )}
 
        {/* Post ride CTA */}
        <button
          onClick={() => {
            if (!hasCarDetails) {
              showToast("Please add your car details in your profile first.", "error");
              navigate("/profile");
              return;
            }
            navigate("/post-ride");
          }}
          className="btn-gold mb-5 flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span> Post a ride for today
        </button>
 
        {/* Active rides */}
        <div className="flex items-center justify-between mb-3">
          <p className="section-label mb-0">My active rides</p>
          <button onClick={fetchMyRides} className="text-green-700 text-[12px] font-bold">↻ Refresh</button>
        </div>
 
        {loading ? (
          <div className="card p-4 h-24 animate-pulse bg-gray-100 mb-3" />
        ) : activeRides.length === 0 ? (
          <div className="card p-6 text-center text-gray-400 text-[13px] mb-4">
            No active rides. Post one above!
          </div>
        ) : (
          activeRides.map((ride) => {
            const isBusy = working === ride.id;
            return (
              <div key={ride.id} className="card p-4 mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-[15px]">{ride.origin} → {ride.destination}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5">🕐 {ride.departure_time}</p>
                  </div>
                  <span className={`badge ${STATUS_BADGE[ride.status] || "badge-gray"}`}>
                    {ride.status === "in_progress" ? "🟢 In progress" : ride.status}
                  </span>
                </div>
 
                <p className="text-[12px] text-gray-500 mb-3">
                  💺 {ride.seats_taken}/{ride.total_seats} seats taken
                </p>
 
                {/* Action buttons based on status */}
                <div className="flex gap-2">
                  {/* View requests — always available */}
                  <button
                    onClick={() => navigate(`/rides/${ride.id}/requests`)}
                    className="btn-secondary btn-sm flex-1"
                  >
                    👥 Requests
                  </button>
 
                  {/* Start — only when open or full */}
                  {(ride.status === "open" || ride.status === "full") && (
                    <button
                      onClick={() => handleStart(ride.id)}
                      disabled={isBusy}
                      className="btn-sm flex-1 bg-green-700 text-white rounded-lg font-semibold"
                    >
                      {isBusy ? "…" : "🚗 Start ride"}
                    </button>
                  )}
 
                  {/* End ride — only when in progress */}
                  {ride.status === "in_progress" && (
                    <button
                      onClick={() => handleComplete(ride.id)}
                      disabled={isBusy}
                      className="btn-sm flex-1 bg-green-700 text-white rounded-lg font-semibold"
                    >
                      {isBusy ? "…" : "✅ End ride"}
                    </button>
                  )}
 
                  {/* Cancel — available unless already in progress */}
                  {ride.status !== "in_progress" && (
                    <button
                      onClick={() => handleCancel(ride.id)}
                      disabled={isBusy}
                      className="btn-sm flex-1 bg-red-50 text-red-600 border border-red-200 rounded-lg font-semibold"
                    >
                      {isBusy ? "…" : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
 
        {/* Past rides */}
        {completedRides.length > 0 && (
          <>
            <p className="section-label mb-3 mt-4">Past rides</p>
            {completedRides.map((ride) => (
              <div key={ride.id} className="card p-4 mb-3 opacity-70">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[14px]">{ride.origin} → {ride.destination}</p>
                    <p className="text-[12px] text-gray-500">{ride.departure_time}</p>
                  </div>
                  <span className={`badge ${STATUS_BADGE[ride.status]}`}>{ride.status}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
 
export default function HomePage() {
  const { user } = useAuth();
  return (
    <>
      {user?.role === "driver" ? <DriverHome /> : <RiderHome />}
      <BottomNav />
    </>
  );
}