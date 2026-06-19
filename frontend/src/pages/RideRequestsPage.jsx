import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ridesAPI } from "../api";
import { useToast } from "../context/ToastContext";
import { apiError } from "../utils/helpers";
import Avatar from "../components/common/avatar";
import { Stars } from "../components/common/stars";
import TopBar from "../components/layout/topbar";
import BottomNav from "../components/layout/bottomNav";
 
export default function RideRequestsPage() {
  const { rideId }        = useParams();
  const navigate          = useNavigate();
  const { showToast }     = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [working, setWorking]   = useState(null); // request id being acted on
  const [meetupInput, setMeetupInput] = useState({});
 
  useEffect(() => {
    ridesAPI.getRideRequests(rideId)
      .then((res) => setRequests(res.data))
      .catch(() => showToast("Could not load requests.", "error"))
      .finally(() => setLoading(false));
  }, [rideId]); // eslint-disable-line
 
  async function accept(reqId) {
    setWorking(reqId);
    try {
      await ridesAPI.acceptRequest(reqId, { meetup_point: meetupInput[reqId] || "" });
      showToast("Request accepted! Car details revealed to rider.");
      setRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: "accepted" } : r));
    } catch (err) {
      showToast(apiError(err), "error");
    } finally {
      setWorking(null);
    }
  }
 
  async function decline(reqId) {
    setWorking(reqId);
    try {
      await ridesAPI.declineRequest(reqId);
      showToast("Request declined.");
      setRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: "declined" } : r));
    } catch (err) {
      showToast(apiError(err), "error");
    } finally {
      setWorking(null);
    }
  }
 
  const pending  = requests.filter((r) => r.status === "pending");
  const accepted = requests.filter((r) => r.status === "accepted");
  const others   = requests.filter((r) => !["pending", "accepted"].includes(r.status));
 
  const RequestCard = ({ req }) => {
    const { rider } = req;
    const isPending  = req.status === "pending";
    const isAccepted = req.status === "accepted";
    const isWorking  = working === req.id;
 
    return (
      <div className="card p-4 mb-3">
        {/* Rider profile */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar user={rider} size="md" showVerified />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] truncate">{rider.full_name}</p>
            <div className="flex items-center gap-1.5">
              <Stars score={rider.average_rating} />
              <span className="text-[12px] text-gray-400">{rider.total_rides} rides</span>
            </div>
            {rider.parish && <p className="text-[11px] text-green-700 font-semibold mt-0.5">{rider.parish}</p>}
          </div>
          <span className={`badge flex-shrink-0
            ${isPending  ? "badge-gold"  : ""}
            ${isAccepted ? "badge-green" : ""}
            ${req.status === "declined"  ? "badge-gray"  : ""}
            ${req.status === "cancelled" ? "badge-gray"  : ""}
          `}>
            {req.status}
          </span>
        </div>
 
        {/* Trust badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {rider.is_verified   && <span className="badge badge-green text-[10px]">✓ Verified</span>}
          {rider.phone_verified && <span className="badge badge-green text-[10px]">📱 Phone</span>}
        </div>
 
        {req.drop_off_note && (
          <p className="text-[12px] text-gray-500 mb-3">
            📍 Dropping off at: <strong>{req.drop_off_note}</strong>
          </p>
        )}
 
        {/* Meetup input — only for pending */}
        {isPending && (
          <div className="mb-3">
            <label className="label">Meetup point (optional)</label>
            <input
              className="input text-[13px] py-2"
              placeholder="e.g. Gate 9, RCCG Camp"
              value={meetupInput[req.id] || ""}
              onChange={(e) => setMeetupInput((m) => ({ ...m, [req.id]: e.target.value }))}
            />
          </div>
        )}
 
        {isAccepted && req.meetup_point && (
          <p className="text-[12px] text-green-700 font-semibold mb-3">
            📍 Meetup: {req.meetup_point}
          </p>
        )}
 
        {/* Actions */}
        <div className="flex gap-2">
          {req.thread_id && (
            <button
              onClick={() => navigate(`/messages/${req.thread_id}`)}
              className="btn-secondary btn-sm flex-1"
            >
              💬 Message
            </button>
          )}
          {isPending && (
            <>
              <button
                onClick={() => decline(req.id)}
                disabled={isWorking}
                className="btn-sm flex-1 bg-red-50 text-red-600 border border-red-200 rounded-lg font-semibold"
              >
                Decline
              </button>
              <button
                onClick={() => accept(req.id)}
                disabled={isWorking}
                className="btn-sm flex-1 bg-green-700 text-white rounded-lg font-semibold"
              >
                {isWorking ? "…" : "Accept ✓"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };
 
  return (
    <>
      <div className="page">
        <TopBar title="Ride requests" subtitle="Review who wants to join your ride" />
        <div className="px-4 pt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="card p-4 h-28 animate-pulse bg-gray-100" />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-bold text-gray-600">No requests yet</p>
              <p className="text-[13px] text-gray-400 mt-1">Riders will appear here when they request to join.</p>
            </div>
          ) : (
            <>
              {pending.length > 0 && (
                <>
                  <p className="section-label mb-3">Pending ({pending.length})</p>
                  {pending.map((r) => <RequestCard key={r.id} req={r} />)}
                </>
              )}
              {accepted.length > 0 && (
                <>
                  <p className="section-label mb-3">Accepted ({accepted.length})</p>
                  {accepted.map((r) => <RequestCard key={r.id} req={r} />)}
                </>
              )}
              {others.length > 0 && (
                <>
                  <p className="section-label mb-3">Others</p>
                  {others.map((r) => <RequestCard key={r.id} req={r} />)}
                </>
              )}
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
