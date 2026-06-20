import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ridesAPI } from "../api";
import { useToast } from "../context/ToastContext";
import { apiError, formatNaira } from "../utils/helpers";
import TopBar from "../components/layout/topbar";
import BottomNav from "../components/layout/bottomNav";
 
const REQUEST_STATUS = {
  pending:   { badge: "badge-gold",  label: "⏳ Pending"  },
  accepted:  { badge: "badge-green", label: "✅ Accepted" },
  declined:  { badge: "badge-gray",  label: "❌ Declined" },
  cancelled: { badge: "badge-gray",  label: "Cancelled"   },
};
 
const RIDE_STATUS = {
  in_progress: { badge: "badge-gold",  label: "🚗 Ride in progress"  },
  completed:   { badge: "badge-green", label: "✅ Ride completed"    },
  cancelled:   { badge: "badge-red",   label: "❌ Ride was cancelled" },
};
 
export default function MyRequestsPage() {
  const navigate      = useNavigate();
  const { showToast } = useToast();
 
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
 
  // Use a ref for "already prompted" so it never causes re-renders or stale closures
  const promptedRef = useRef(new Set(
    JSON.parse(localStorage.getItem("rccg_rated_rides") || "[]")
  ));
 
  function markPrompted(reqId) {
    promptedRef.current.add(reqId);
    localStorage.setItem("rccg_rated_rides", JSON.stringify([...promptedRef.current]));
  }
 
  // Plain async function — no useCallback, no dependency arrays to worry about
  async function fetchRequests() {
    try {
      const res  = await ridesAPI.myRequests();
      const data = res.data;
      setRequests(data);
      // NOTE: redirect logic deliberately NOT here — it lives in the UI below
      // so it only fires on explicit user action, not automatically on every poll.
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => {
    fetchRequests();
    const id = setInterval(fetchRequests, 15000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
 
  async function cancelRequest(reqId) {
    try {
      await ridesAPI.cancelRequest(reqId);
      showToast("Request cancelled.");
      setRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: "cancelled" } : r));
    } catch (err) {
      showToast(apiError(err), "error");
    }
  }
 
  return (
    <>
      <div className="page">
        <TopBar title="My requests" onBack={false} />
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="section-label mb-0">
              {requests.length} request{requests.length !== 1 ? "s" : ""}
            </p>
            <button onClick={fetchRequests} className="text-green-700 text-[12px] font-bold">
              ↻ Refresh
            </button>
          </div>
 
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="card p-4 h-24 animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🚗</p>
              <p className="font-bold text-gray-600">No requests yet</p>
              <p className="text-[13px] text-gray-400 mt-1">Browse rides on the home tab.</p>
              <button
                onClick={() => navigate("/home")}
                className="btn-primary mt-5 w-auto px-8"
              >
                Browse rides
              </button>
            </div>
          ) : (
            requests.map((req) => {
              const reqStatus  = REQUEST_STATUS[req.status] || REQUEST_STATUS.pending;
              const rideInfo   = RIDE_STATUS[req.ride?.status];
 
              const isAccepted     = req.status === "accepted";
              const isPending      = req.status === "pending";
              const rideOpen       = !req.ride?.status || req.ride?.status === "open" || req.ride?.status === "full";
              const rideInProgress = req.ride?.status === "in_progress";
              const rideCompleted  = req.ride?.status === "completed";
              const rideCancelled  = req.ride?.status === "cancelled";
              const alreadyRated   = promptedRef.current.has(req.id);
 
              return (
                <div
                  key={req.id}
                  className={`card p-4 mb-3 ${rideCancelled ? "opacity-60" : ""}`}
                >
                  {/* Route + request status */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="font-bold text-[15px] truncate">
                        {req.ride?.origin} → {req.ride?.destination}
                      </p>
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        🕐 {req.ride?.departure_time} · {formatNaira(req.ride?.cost_per_rider)}
                      </p>
                    </div>
                    <span className={`badge flex-shrink-0 ${reqStatus.badge}`}>
                      {reqStatus.label}
                    </span>
                  </div>
 
                  {/* Ride status banner — only when something notable has happened */}
                  {rideInfo && (
                    <div className={`rounded-xl px-3 py-2.5 mb-3 ${
                      rideCompleted  ? "bg-green-50 border border-green-200" :
                      rideCancelled  ? "bg-red-50 border border-red-200"    :
                      rideInProgress ? "bg-gold-50 border border-gold-200"  : ""
                    }`}>
                      <span className={`badge ${rideInfo.badge}`}>{rideInfo.label}</span>
                      {rideCancelled && (
                        <p className="text-[11px] text-red-500 mt-1.5">
                          The driver cancelled this ride. Please look for another.
                        </p>
                      )}
                      {rideInProgress && (
                        <p className="text-[11px] text-gold-700 mt-1.5">
                          Your driver has started the ride. Head to the meetup point!
                        </p>
                      )}
                      {rideCompleted && isAccepted && !alreadyRated && (
                        <p className="text-[11px] text-green-700 mt-1.5 font-semibold">
                          You've arrived! Tap below to rate your driver.
                        </p>
                      )}
                    </div>
                  )}
 
                  {/* Accepted info — meetup point + car details link */}
                  {isAccepted && !rideCancelled && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
                      <p className="text-[12px] font-bold text-green-700">✅ Driver accepted you!</p>
                      {req.meetup_point && (
                        <p className="text-[12px] text-green-700 mt-0.5">
                          📍 Meetup: <strong>{req.meetup_point}</strong>
                        </p>
                      )}
                      <button
                        onClick={() => navigate(`/rides/${req.ride_id}`)}
                        className="mt-1.5 text-[12px] font-bold text-green-700 underline"
                      >
                        See car details →
                      </button>
                    </div>
                  )}
 
                  {req.drop_off_note && (
                    <p className="text-[12px] text-gray-500 mb-3">
                      My drop-off: {req.drop_off_note}
                    </p>
                  )}
 
                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap">
 
                    {/* Chat */}
                    {req.thread_id && !rideCancelled && (
                      <button
                        onClick={() => navigate(`/messages/${req.thread_id}`)}
                        className="btn-secondary btn-sm flex-1"
                      >
                        💬 Chat
                      </button>
                    )}
 
                    {/* View active ride — only when in progress AND accepted */}
                    {rideInProgress && isAccepted && (
                      <button
                        onClick={() => navigate(`/active-ride/${req.id}`)}
                        className="btn-sm flex-1 bg-green-700 text-white rounded-lg font-semibold"
                      >
                        🚗 In-ride page
                      </button>
                    )}
 
                    {/* Rate driver — only when completed AND accepted AND not yet rated */}
                    {rideCompleted && isAccepted && !alreadyRated && (
                      <button
                        onClick={() => {
                          markPrompted(req.id);
                          navigate(`/rate/${req.id}`);
                        }}
                        className="btn-sm flex-1 bg-gold-500 text-white rounded-lg font-semibold"
                      >
                        ⭐ Rate driver
                      </button>
                    )}
 
                    {/* Cancel own request — only when pending and ride still open */}
                    {isPending && rideOpen && (
                      <button
                        onClick={() => cancelRequest(req.id)}
                        className="btn-sm flex-1 bg-red-50 text-red-600 border border-red-200 rounded-lg font-semibold"
                      >
                        Cancel request
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}