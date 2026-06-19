import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ridesAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatNaira, apiError } from "../utils/helpers";
import Avatar from "../components/common/avatar";
import TopBar from "../components/layout/topBar";
import BottomNav from "../components/layout/bottomNav";
 
export default function RideDetailPage() {
  const { rideId }        = useParams();
  const navigate          = useNavigate();
  const { user }          = useAuth();
  const { showToast }     = useToast();
 
  const [ride, setRide]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [dropOff, setDropOff]     = useState("");
  const [myRequest, setMyRequest] = useState(null);
 
  useEffect(() => {
    ridesAPI.getRide(rideId)
      .then((res) => {
        setRide(res.data);
        // Check if I already have a request for this ride
        if (user?.role === "rider") {
          ridesAPI.myRequests().then((r) => {
            const existing = r.data.find((req) => req.ride_id === parseInt(rideId));
            setMyRequest(existing || null);
          }).catch(() => {});
        }
      })
      .catch(() => showToast("Could not load ride.", "error"))
      .finally(() => setLoading(false));
  }, [rideId]); // eslint-disable-line
 
  async function sendRequest() {
    setRequesting(true);
    try {
      await ridesAPI.requestToJoin(rideId, { drop_off_note: dropOff });
      showToast("Request sent! The driver will be in touch.");
      navigate("/requests");
    } catch (err) {
      showToast(apiError(err), "error");
    } finally {
      setRequesting(false);
    }
  }
 
  if (loading) return (
    <div className="page flex items-center justify-center">
      <p className="text-gray-400">Loading ride…</p>
    </div>
  );
 
  if (!ride) return null;
 
  const { driver } = ride;
  const isMyRide   = driver?.id === user?.id;
 
  // Car reveal: only visible if this rider has an accepted request
  const carRevealed = !!ride.car_make;
 
  const statusColour = {
    open:        "badge-green",
    full:        "badge-gray",
    completed:   "badge-gray",
    cancelled:   "badge-red",
    in_progress: "badge-gold",
  };
 
  return (
    <>
      <div className="page">
        <TopBar title="Ride details" />
 
        <div className="px-4 pt-4 pb-6">
          {/* Driver profile */}
          <div className="card p-5 mb-4">
            <div className="flex items-center gap-4 mb-4">
              <Avatar user={driver} size="lg" showVerified />
              <div className="flex-1 min-w-0">
                <h2 className="font-black text-[18px] text-gray-900">{driver.full_name}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Stars score={driver.average_rating} />
                  <span className="text-[13px] text-gray-500">
                    {driver.average_rating?.toFixed(1)} ({driver.total_rides} rides)
                  </span>
                </div>
                {driver.parish && (
                  <p className="text-[12px] text-green-700 font-semibold mt-1">{driver.parish}</p>
                )}
              </div>
            </div>
 
            {/* Trust badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {driver.is_verified && <span className="badge badge-green">✓ ID Verified</span>}
              {driver.phone_verified && <span className="badge badge-green">📱 Phone Verified</span>}
              {driver.total_rides >= 5 && <span className="badge badge-gold">⭐ {driver.total_rides} rides</span>}
            </div>
 
            {ride.driver_note && (
              <div className="bg-green-50 rounded-xl p-3 text-[13px] text-gray-600 italic">
                "{ride.driver_note}"
              </div>
            )}
          </div>
 
          {/* Trip info */}
          <p className="section-label">Trip details</p>
          <div className="card p-4 mb-4">
            <div className="info-row">
              <span className="text-gray-400 text-[13px]">From</span>
              <span className="font-semibold text-[13px]">{ride.origin}</span>
            </div>
            <div className="info-row">
              <span className="text-gray-400 text-[13px]">Destination</span>
              <span className="font-semibold text-[13px]">{ride.destination}</span>
            </div>
            {ride.route_description && (
              <div className="info-row">
                <span className="text-gray-400 text-[13px]">Passing</span>
                <span className="font-semibold text-[13px] text-right max-w-[60%]">{ride.route_description}</span>
              </div>
            )}
            <div className="info-row">
              <span className="text-gray-400 text-[13px]">Leaving at</span>
              <span className="font-semibold text-[13px]">{ride.departure_time}</span>
            </div>
            <div className="info-row">
              <span className="text-gray-400 text-[13px]">Seats available</span>
              <span className="font-semibold text-[13px]">{ride.seats_available} of {ride.total_seats}</span>
            </div>
            <div className="info-row">
              <span className="text-gray-400 text-[13px]">Cost per rider</span>
              <span className="font-bold text-green-700 text-[13px]">{formatNaira(ride.cost_per_rider)}</span>
            </div>
            <div className="info-row">
              <span className="text-gray-400 text-[13px]">Status</span>
              <span className={`badge ${statusColour[ride.status] || "badge-gray"} text-[11px]`}>
                {ride.status}
              </span>
            </div>
          </div>
 
          {/* Car reveal gate */}
          {carRevealed ? (
            <>
              <p className="section-label">Car details 🔓</p>
              <div className="bg-green-700 rounded-2xl p-5 mb-4 text-white text-center">
                <p className="text-4xl mb-2">🚗</p>
                <p className="font-black text-[18px]">
                  {ride.car_make} {ride.car_model} {ride.car_year}
                </p>
                <p className="text-white/80 text-[14px] mt-1">{ride.car_colour}</p>
                <div className="bg-white/15 rounded-xl mt-3 py-2 px-4">
                  <p className="font-black text-[20px] tracking-widest">{ride.car_plate}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gold-50 border border-gold-200 rounded-2xl p-4 mb-4 flex gap-3">
              <span className="text-2xl flex-shrink-0">🔒</span>
              <div>
                <p className="font-bold text-[14px] text-gold-700">Car details are hidden</p>
                <p className="text-[12px] text-gold-600 mt-0.5 leading-relaxed">
                  The driver's car make, colour, and plate number are only revealed
                  after they accept your request. This protects both of you.
                </p>
              </div>
            </div>
          )}
 
          {/* Safety notice */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5">
            <p className="text-[11px] font-bold text-green-700 mb-1">🛡️ Safety</p>
            <p className="text-[11px] text-green-700/80 leading-relaxed">
              Both you and this driver are NIN-verified RCCG members. During the active ride,
              you can silently alert your trusted contact by double-tapping the 🛡️ button.
            </p>
          </div>
 
          {/* Actions */}
          {!isMyRide && user?.role === "rider" && (
            <>
              {myRequest ? (
                <div className="card p-4 text-center">
                  <p className="font-bold text-green-700">
                    {myRequest.status === "pending"  && "⏳ Request pending — driver will message you"}
                    {myRequest.status === "accepted" && "✅ Request accepted! Check Requests tab"}
                    {myRequest.status === "declined" && "❌ Request was declined"}
                    {myRequest.status === "cancelled" && "Request cancelled"}
                  </p>
                  {myRequest.thread_id && (
                    <button
                      onClick={() => navigate(`/messages/${myRequest.thread_id}`)}
                      className="btn-secondary btn-sm mt-3 w-auto px-6"
                    >
                      Open chat →
                    </button>
                  )}
                </div>
              ) : ride.status === "open" && ride.seats_available > 0 ? (
                <>
                  <div className="mb-3">
                    <label className="label">Where are you dropping off? (optional)</label>
                    <input
                      className="input"
                      placeholder="e.g. Toyin Street, Ikeja"
                      value={dropOff}
                      onChange={(e) => setDropOff(e.target.value)}
                    />
                  </div>
                  <button onClick={sendRequest} disabled={requesting} className="btn-primary mb-3">
                    {requesting ? "Sending request…" : "Send ride request"}
                  </button>
                  {myRequest?.thread_id && (
                    <button
                      onClick={() => navigate(`/messages/${myRequest.thread_id}`)}
                      className="btn-secondary"
                    >
                      Message driver first
                    </button>
                  )}
                </>
              ) : (
                <div className="card p-4 text-center text-gray-400 text-[13px]">
                  This ride is no longer accepting requests.
                </div>
              )}
            </>
          )}
 
          {isMyRide && (
            <button
              onClick={() => navigate(`/rides/${rideId}/requests`)}
              className="btn-primary"
            >
              View ride requests →
            </button>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
