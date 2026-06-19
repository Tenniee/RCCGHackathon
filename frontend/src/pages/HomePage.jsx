import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ridesAPI } from "../api";
import RideCard from "../components/rides/rideCard";
import BottomNav from "../components/layout/bottomNav";
import Avatar from "../components/common/avatar";
 
// ─── Rider home — browse the ride feed ───────────────────────────────────────
function RiderHome() {
  const navigate          = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ destination: "", route_keyword: "", max_cost: "" });
 
  useEffect(() => { fetchFeed(); }, []); // eslint-disable-line
 
  async function fetchFeed() {
    setLoading(true);
    try {
      const params = {};
      if (filters.destination)  params.destination   = filters.destination;
      if (filters.route_keyword) params.route_keyword = filters.route_keyword;
      if (filters.max_cost)     params.max_cost       = Number(filters.max_cost);
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
      {/* Green header */}
      <div className="bg-green-700 px-4 pt-4 pb-5">
        <p className="text-white/70 text-[12px] font-bold tracking-widest uppercase">Welcome back 🙏</p>
        <h1 className="text-white font-black text-[22px] mt-0.5">Find a ride</h1>
 
        {/* Search bar */}
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 bg-white/15 text-white placeholder-white/50 rounded-xl px-4 py-2.5
                       text-[14px] outline-none border border-white/20 focus:border-white/50"
            placeholder="Where are you going?"
            value={filters.destination}
            onChange={(e) => setFilters((f) => ({ ...f, destination: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && fetchFeed()}
          />
          <button
            onClick={fetchFeed}
            className="bg-gold-500 text-white px-4 rounded-xl font-bold text-[14px]"
          >
            Search
          </button>
        </div>
 
        {/* Route filter */}
        <input
          className="mt-2 w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-2
                     text-[13px] outline-none border border-white/15"
          placeholder="Filter by route passing through…"
          value={filters.route_keyword}
          onChange={(e) => setFilters((f) => ({ ...f, route_keyword: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && fetchFeed()}
        />
      </div>
 
      {/* Feed */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label mb-0">
            {loading ? "Loading rides…" : `${rides.length} ride${rides.length === 1 ? "" : "s"} available`}
          </p>
          <button onClick={fetchFeed} className="text-green-700 text-[12px] font-bold">
            ↻ Refresh
          </button>
        </div>
 
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 h-32 animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : rides.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🚗</p>
            <p className="font-bold text-gray-600 text-[16px]">No rides posted yet</p>
            <p className="text-[13px] text-gray-400 mt-1">
              Check back after service — drivers usually post closer to the time.
            </p>
          </div>
        ) : (
          rides.map((ride) => <RideCard key={ride.id} ride={ride} />)
        )}
      </div>
    </div>
  );
}
 
// ─── Driver home — dashboard summary ─────────────────────────────────────────
function DriverHome() {
  const navigate            = useNavigate();
  const { user }            = useAuth();
  const [myRides, setMyRides] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
 
  useEffect(() => {
    Promise.all([ridesAPI.myPosted(), ridesAPI.getRideRequests])
      .catch(() => {})
      .finally(() => setLoading(false));
 
    ridesAPI.myPosted()
      .then((res) => setMyRides(res.data))
      .catch(() => {});
  }, []);
 
  const totalRequests = myRides.reduce((acc, r) => acc + (r.requests?.length || 0), 0);
 
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
            { label: "Rides given",  value: user?.total_rides || 0,    icon: "🚗" },
            { label: "Rating",       value: (user?.average_rating || 0).toFixed(1), icon: "⭐" },
            { label: "Pending reqs", value: totalRequests,             icon: "📋" },
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
        {/* Post ride CTA */}
        <button
          onClick={() => navigate("/post-ride")}
          className="btn-gold mb-5 flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span> Post a ride for today
        </button>
 
        {/* My rides */}
        <p className="section-label mb-3">My posted rides</p>
        {loading ? (
          <div className="card p-4 h-24 animate-pulse bg-gray-100" />
        ) : myRides.length === 0 ? (
          <div className="card p-6 text-center text-gray-400 text-[13px] mb-4">
            No rides posted yet. Tap above to post one!
          </div>
        ) : (
          myRides.slice(0, 3).map((ride) => (
            <div
              key={ride.id}
              className="card card-hover p-4 mb-3"
              onClick={() => navigate(`/rides/${ride.id}/requests`)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-[15px]">{ride.origin} → {ride.destination}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">🕐 {ride.departure_time}</p>
                </div>
                <span className={`badge ${ride.status === "open" ? "badge-green" : "badge-gray"}`}>
                  {ride.status}
                </span>
              </div>
              <div className="flex gap-3 text-[12px] text-gray-500">
                <span>💺 {ride.seats_taken}/{ride.total_seats} seats taken</span>
                <span className="ml-auto text-green-700 font-bold">
                  {(ride.requests?.length || 0)} request{(ride.requests?.length || 0) === 1 ? "" : "s"} →
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
 
// ─── Main export — picks view based on role ───────────────────────────────────
export default function HomePage() {
  const { user } = useAuth();
  return (
    <>
      {user?.role === "driver" ? <DriverHome /> : <RiderHome />}
      <BottomNav />
    </>
  );
}
