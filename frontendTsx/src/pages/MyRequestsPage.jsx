import { useEffect, useState } from "react";
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
 
export default function MyRequestsPage() {
  const navigate        = useNavigate();
  const { showToast }   = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
 
  useEffect(() => {
    ridesAPI.myRequests()
      .then((res) => setRequests(res.data))
      .catch(() => showToast("Could not load requests.", "error"))
      .finally(() => setLoading(false));
  }, []);
 
  async function cancel(reqId) {
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
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="card p-4 h-24 animate-pulse bg-gray-100" />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🚗</p>
              <p className="font-bold text-gray-600">No requests yet</p>
              <p className="text-[13px] text-gray-400 mt-1">
                Browse rides on the home tab and send a request to join one.
              </p>
              <button onClick={() => navigate("/home")} className="btn-primary mt-5 w-auto px-8">
                Browse rides
              </button>
            </div>
          ) : (
            requests.map((req) => {
              const s     = STATUS_STYLE[req.status] || STATUS_STYLE.pending;
              const isAcc = req.status === "accepted";
              return (
                <div key={req.id} className="card p-4 mb-3">
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
 
                  {req.drop_off_note && (
                    <p className="text-[12px] text-gray-500 mb-2">
                      My drop-off: {req.drop_off_note}
                    </p>
                  )}
 
                  {/* Accepted: show meetup + car reveal button */}
                  {isAcc && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
                      <p className="text-[12px] font-bold text-green-700">✅ Driver accepted you!</p>
                      {req.meetup_point && (
                        <p className="text-[12px] text-green-700 mt-0.5">
                          📍 Meetup: <strong>{req.meetup_point}</strong>
                        </p>
                      )}
                      <button
                        onClick={() => navigate(`/rides/${req.ride_id}`)}
                        className="mt-2 text-[12px] font-bold text-green-700 underline"
                      >
                        See car details →
                      </button>
                    </div>
                  )}
 
                  <div className="flex gap-2 mt-1">
                    {req.thread_id && (
                      <button
                        onClick={() => navigate(`/messages/${req.thread_id}`)}
                        className="btn-secondary btn-sm flex-1"
                      >
                        💬 Chat
                      </button>
                    )}
                    {req.status === "pending" && (
                      <button
                        onClick={() => cancel(req.id)}
                        className="btn-sm flex-1 bg-red-50 text-red-600 border border-red-200 rounded-lg font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                    {isAcc && (
                      <button
                        onClick={() => navigate(`/active-ride/${req.id}`)}
                        className="btn-sm flex-1 bg-green-700 text-white rounded-lg font-semibold"
                      >
                        🚗 View active ride
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
