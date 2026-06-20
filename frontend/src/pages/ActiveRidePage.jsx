import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ridesAPI } from "../api";
import { useToast } from "../context/ToastContext";
import Avatar from "../components/common/Avatar";
import SOSButton from "../components/common/SOSButton";
import TopBar from "../components/layout/topBar";
 
export default function ActiveRidePage() {
  const { requestId }  = useParams();
  const navigate       = useNavigate();
  const { showToast }  = useToast();
  const [req, setReq]  = useState(null);
  const [loading, setLoading] = useState(true);
  const alreadyRedirected = useRef(false);  // prevent double-redirect
 
  // ── Fetch the request and check ride status ──────────────────────────────
  const fetchRequest = useCallback(async () => {
    try {
      const res  = await ridesAPI.myRequests();
      const found = res.data.find((r) => r.id === parseInt(requestId));
      if (!found) return;
      setReq(found);
 
      const rideStatus = found.ride?.status;
 
      // Driver ended the ride → prompt rating
      if (rideStatus === "completed" && !alreadyRedirected.current) {
        alreadyRedirected.current = true;
        showToast("Your ride is complete! Please rate your driver 🌟", "info");
        navigate(`/rate/${requestId}`, { replace: true });
        return;
      }
 
      // Driver cancelled the ride → send back to requests
      if (rideStatus === "cancelled" && !alreadyRedirected.current) {
        alreadyRedirected.current = true;
        showToast("The driver cancelled this ride.", "error");
        navigate("/requests", { replace: true });
        return;
      }
    } catch {
      // silent — don't break the page on a failed poll
    } finally {
      setLoading(false);
    }
  }, [requestId, navigate, showToast]);
 
  useEffect(() => {
    fetchRequest();
    // Poll every 10 seconds — detects driver starting/ending/cancelling
    const id = setInterval(fetchRequest, 10000);
    return () => clearInterval(id);
  }, [fetchRequest]);
 
  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="text-gray-400">Loading ride…</p>
    </div>
  );
 
  if (!req) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 text-center">
      <p className="text-4xl mb-3">🚗</p>
      <p className="font-bold text-gray-600">Ride not found</p>
      <button onClick={() => navigate("/requests")} className="btn-primary mt-4 w-auto px-8">
        Back to requests
      </button>
    </div>
  );
 
  const ride   = req.ride;
  const driver = ride?.driver;
 
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <TopBar
        title="Ride in progress"
        subtitle="Double-tap 🛡️ for silent SOS"
        onBack={() => navigate("/requests")}
      />
 
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
 
        {/* Live polling indicator */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          <p className="text-[11px] text-green-700 font-semibold">
            Live — updates automatically every 10s
          </p>
          <button
            onClick={fetchRequest}
            className="ml-auto text-[11px] text-green-700 font-bold underline"
          >
            Refresh now
          </button>
        </div>
 
        {/* Map placeholder */}
        <div className="relative bg-gradient-to-br from-green-200 to-emerald-300 rounded-2xl h-44
                        flex items-center justify-center mb-4 overflow-hidden">
          <div className="text-5xl animate-pulse">📍</div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full border-2 border-green-600/30 animate-ping" />
          </div>
          <div className="absolute top-3 right-3 bg-white/80 rounded-lg px-2.5 py-1.5 text-right">
            <p className="text-[10px] font-bold text-green-700">Live GPS tracking</p>
            <p className="text-[9px] text-gray-500">Added later via Google Maps SDK</p>
          </div>
        </div>
 
        {/* Driver card */}
        {driver && (
          <div className="card p-4 mb-4">
            <div className="flex items-center gap-3">
              <Avatar user={driver} size="lg" showVerified />
              <div className="flex-1">
                <p className="font-black text-[17px]">{driver.full_name}</p>
                <p className="text-[12px] text-gray-500 mt-0.5">{driver.parish}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="badge badge-green text-[10px]">🚗 En route</span>
                  <span className="badge badge-gold text-[10px]">
                    ⭐ {driver.average_rating?.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
 
        {/* Car details — only visible because request was accepted */}
        {(driver?.car_make || ride?.car_make) && (
          <div className="bg-green-700 rounded-2xl p-4 mb-4 text-white">
            <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-1">Your ride</p>
            <p className="font-black text-[18px]">
              {driver?.car_make} {driver?.car_model} {driver?.car_year}
            </p>
            <p className="text-white/70 text-[13px] mt-0.5 capitalize">{driver?.car_colour}</p>
            <div className="bg-white/15 rounded-xl mt-2 py-2 px-3 inline-block">
              <p className="font-black text-[18px] tracking-[0.15em]">{driver?.car_plate}</p>
            </div>
          </div>
        )}
 
        {/* Trip info */}
        <div className="card p-4 mb-4">
          <p className="section-label mb-2">Trip details</p>
          <div className="info-row">
            <span className="text-gray-400 text-[13px]">Pickup</span>
            <span className="font-semibold text-[13px]">{req.meetup_point || ride?.origin}</span>
          </div>
          <div className="info-row">
            <span className="text-gray-400 text-[13px]">Drop-off</span>
            <span className="font-semibold text-[13px]">{req.drop_off_note || ride?.destination}</span>
          </div>
          <div className="info-row">
            <span className="text-gray-400 text-[13px]">Leaving at</span>
            <span className="font-semibold text-[13px]">{ride?.departure_time}</span>
          </div>
          <div className="info-row">
            <span className="text-gray-400 text-[13px]">Est. arrival</span>
            <span className="text-[11px] bg-gold-50 text-gold-700 px-2 py-0.5 rounded font-bold">
              Added later via Maps API
            </span>
          </div>
        </div>
 
        {/* SOS instructions */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <p className="text-[12px] font-bold text-red-600 mb-1">🛡️ Emergency alert</p>
          <p className="text-[12px] text-red-500 leading-relaxed">
            If you feel unsafe, <strong>double-tap the red shield</strong> (bottom right).
            A silent alert goes to your trusted contact with the driver's details.
            No sound. The driver won't know.
          </p>
        </div>
 
        {/* Waiting for driver to end */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-[12px] font-bold text-green-700 mb-1">Waiting for ride to end</p>
          <p className="text-[12px] text-green-700/80">
            The driver ends the ride from their dashboard when you arrive.
            You'll be automatically taken to the rating page as soon as they do.
          </p>
        </div>
      </div>
 
      {/* Silent SOS button — double-tap to trigger */}
      <SOSButton rideRequestId={req.id} />
    </div>
  );
}
