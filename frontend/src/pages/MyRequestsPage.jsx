import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ridesAPI } from "../api";
import { useToast } from "../context/ToastContext";
import { apiError, formatNaira } from "../utils/helpers";
import TopBar from "../components/layout/TopBar";
import BottomNav from "../components/layout/BottomNav";
 
const STATUS_STYLE = {
  pending:   { badge: "badge-gold",  label: "⏳ Pending"   },
  accepted:  { badge: "badge-green", label: "✅ Accepted"  },
  declined:  { badge: "badge-gray",  label: "❌ Declined"  },
  cancelled: { badge: "badge-gray",  label: "Cancelled"    },
};
 
const RIDE_STATUS_LABEL = {
  open:        null,               // don't show anything extra
  full:        null,
  in_progress: { badge: "badge-gold",  label: "🚗 Ride in progress" },
  completed:   { badge: "badge-green", label: "✅ Ride completed"   },
  cancelled:   { badge: "badge-red",   label: "❌ Ride was cancelled" },
};
 
export default function MyRequestsPage() {
  const navigate        = useNavigate();
  const { showToast }   = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  // Track which completed rides we've already prompted to rate
  const [ratedRides, setRatedRides] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rccg_rated_rides") || "[]"); }
    catch { return []; }
  });
 
  const fetchRequests = useCallback(async () => {
    try {
      const res = await ridesAPI.myRequests();
      const data = res.data;
      setRequests(data);
 
      // Check for newly completed rides — prompt to rate
      data.forEach((req) => {
        const rideCompleted = req.ride?.status === "completed";
        const wasAccepted   = req.status === "accepted";
        const alreadyRated  = ratedRides.includes(req.id);
 
        if (rideCompleted && wasAccepted && !alreadyRated) {
          showToast("Your ride is complete! Please rate your driver.", "info");
          // Navigate to rate page for the first completed unrated ride found
          navigate(`/rate/${req.id}`);
        }
      });
    } catch {
      // Silent fail on poll
    } finally {
      setLoading(false);
    }
  }, [ratedRides, navigate, showToast]);
 
  useEffect(() => {
    fetchRequests();
    // Poll every 15 seconds so status updates (start, cancel, complete) reflect live
    const id = setInterval(fetchRequests, 15000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line
 
  async function cancel(reqId) {
    try {
      await ridesAPI.cancelRequest(reqId);
      showToast("Request cancelled.");
      setRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: "cancelled" } : r));
    } catch (err) {
      showToast(apiError(err), "error");
    }
  }
 
  function markRated(reqId) {
    const updated = [...ratedRides, reqId];
    setRatedRides(updated);
    localStorage.setItem("rccg_rated_rides", JSON.stringify(updated));
  }
 
  return (
    <>
      <div className="page">
        <TopBar title="My requests" onBack={false} />
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="section-label mb-0">{requests.length} request{requests.length !== 1 ? "s" : ""}</p>
            <button onClick={fetchRequests} className="text-green-700 text-[12px] font-bold">↻ Refresh</button>
          </div>
 
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="card p-4 h-24 animate-pulse bg-gray-100" />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🚗</p>
              <p className="font-bold text-gray-600">No requests yet</p>
              <p className="text-[13px] text-gray-400 mt-1">Browse rides on the home tab.</p>
              <button onClick={() => navigate("/home")} className="btn-primary mt-5 w-auto px-8">
                Browse rides
              </button>
            </div>
          ) : (
            requests.map((req) => {
              const s          = STATUS_STYLE[req.status] || STATUS_STYLE.pending;
              const rideStatus = RIDE_STATUS_LABEL[req.ride?.status];
              const isAccepted = req.status === "accepted";
              const rideCompleted  = req.ride?.status === "completed";
              const rideCancelled  = req.ride?.status === "cancelled";
              const rideInProgress = req.ride?.status === "in_progress";
              const alreadyRated   = ratedRides.includes(req.id);
 
              return (
                <div key={req.id} className={`card p-4 mb-3 ${rideCancelled ? "opacity-60" : ""}`}>
                  {/* Ride route */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="font-bold text-[15px] truncate">
                        {req.ride?.origin} → {req.ride?.destination}
                      </p>
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        🕐 {req.ride?.departure_time} · {formatNaira(req.ride?.cost_per_rider)}
                      </p>
                    </div>
                    <span className={`badge flex-shrink-0 ${s.badge}`}>{s.label}</span>
                  </div>
 
                  {/* Ride status banner — shows when driver has started, completed or cancelled */}
                  {rideStatus && (
                    <div className={`rounded-xl px-3 py-2 mb-3 ${
                      rideCompleted  ? "bg-green-50 border border-green-200"  :
                      rideCancelled  ? "bg-red-50 border border-red-200"      :
                      rideInProgress ? "bg-gold-50 border border-gold-200"    : ""
                    }`}>
                      <span className={`badge ${rideStatus.badge}`}>{rideStatus.label}</span>
                      {rideCancelled && (
                        <p className="text-[11px] text-red-500 mt-1">
                          The driver cancelled this ride. Please look for another ride.
                        </p>
                      )}
                      {rideInProgress && (
                        <p className="text-[11px] text-gold-700 mt-1">
                          Your driver has started the ride. Head to the meetup point!
                        </p>
                      )}
                      {rideCompleted && !alreadyRated && isAccepted && (
                        <p className="text-[11px] text-green-700 mt-1">
                          You arrived! Please rate your driver.
                        </p>
                      )}
                    </div>
                  )}
 
                  {req.drop_off_note && (
                    <p className="text-[12px] text-gray-500 mb-2">
                      My drop-off: {req.drop_off_note}
                    </p>
                  )}
 
                  {/* Accepted state — show meetup and car reveal link */}
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
 
                  {/* Action buttons */}
                  <div className="flex gap-2 mt-1">
                    {/* Chat — available if thread exists and ride not cancelled */}
                    {req.thread_id && !rideCancelled && (
                      <button
                        onClick={() => navigate(`/messages/${req.thread_id}`)}
                        className="btn-secondary btn-sm flex-1"
                      >
                        💬 Chat
                      </button>
                    )}
 
                    {/* Rate driver — only when ride completed, request accepted, not yet rated */}
                    {rideCompleted && isAccepted && !alreadyRated && (
                      <button
                        onClick={() => {
                          markRated(req.id);
                          navigate(`/rate/${req.id}`);
                        }}
                        className="btn-sm flex-1 bg-gold-500 text-white rounded-lg font-semibold"
                      >
                        ⭐ Rate driver
                      </button>
                    )}
 
                    {/* Active ride — when in progress */}
                    {rideInProgress && isAccepted && (
                      <button
                        onClick={() => navigate(`/active-ride/${req.id}`)}
                        className="btn-sm flex-1 bg-green-700 text-white rounded-lg font-semibold"
                      >
                        🚗 View ride
                      </button>
                    )}
 
                    {/* Cancel — only when still pending and ride not cancelled */}
                    {req.status === "pending" && !rideCancelled && (
                      <button
                        onClick={() => cancel(req.id)}
                        className="btn-sm flex-1 bg-red-50 text-red-600 border border-red-200 rounded-lg font-semibold"
                      >
                        Cancel
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
