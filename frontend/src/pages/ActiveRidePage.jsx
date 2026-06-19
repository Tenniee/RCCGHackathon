import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ridesAPI } from "../api";
import { useToast } from "../context/ToastContext";
import { apiError } from "../utils/helpers";
import Avatar from "../components/common/avatar";
import SOSButton from "../components/common/SOSButton";
import TopBar from "../components/layout/topbar";
 
export default function ActiveRidePage() {
  const { requestId }     = useParams();
  const navigate          = useNavigate();
  const { showToast }     = useToast();
  const [req, setReq]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
 
  useEffect(() => {
    // Load from my requests list
    ridesAPI.myRequests()
      .then((res) => {
        const found = res.data.find((r) => r.id === parseInt(requestId));
        setReq(found || null);
      })
      .catch(() => showToast("Could not load ride.", "error"))
      .finally(() => setLoading(false));
  }, [requestId]); // eslint-disable-line
 
  async function completeRide() {
    if (!req?.ride_id) return;
    setCompleting(true);
    try {
      await ridesAPI.completeRide(req.ride_id);
      navigate(`/rate/${requestId}`);
    } catch (err) {
      showToast(apiError(err), "error");
    } finally {
      setCompleting(false);
    }
  }
 
  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="text-gray-400">Loading ride…</p>
    </div>
  );
 
  if (!req) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 text-center">
      <p className="text-4xl mb-3">🚗</p>
      <p className="font-bold text-gray-600">Ride not found</p>
    </div>
  );
 
  const { ride } = req;
  const driver   = ride?.driver;
 
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <TopBar title="Ride in progress" subtitle="Double-tap 🛡️ for silent SOS" onBack={false} />
 
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        {/* Map placeholder */}
        <div className="relative bg-gradient-to-br from-green-200 to-emerald-300 rounded-2xl h-44
                        flex items-center justify-center mb-4 overflow-hidden">
          <div className="text-5xl animate-pulse">📍</div>
          <div className="absolute top-3 right-3 bg-white/80 rounded-lg px-2.5 py-1.5">
            <p className="text-[10px] font-bold text-green-700">Live tracking</p>
            <p className="text-[9px] text-gray-500">Added later via Google Maps SDK</p>
          </div>
          {/* Ripple effect */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full border-2 border-green-600/30 animate-ping" />
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
                  <span className="badge badge-green text-[10px]">✅ En route</span>
                  <span className="badge badge-gold text-[10px]">⭐ {driver.average_rating?.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
 
        {/* Car details */}
        {ride?.car_make && (
          <div className="bg-green-700 rounded-2xl p-4 mb-4 text-white">
            <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-1">Your ride</p>
            <p className="font-black text-[18px]">
              {ride.car_make} {ride.car_model} {ride.car_year}
            </p>
            <p className="text-white/70 text-[13px] mt-0.5">{ride.car_colour}</p>
            <div className="bg-white/15 rounded-xl mt-2 py-2 px-3 inline-block">
              <p className="font-black text-[18px] tracking-[0.15em]">{ride.car_plate}</p>
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
            <span className="text-gray-400 text-[13px]">Destination</span>
            <span className="font-semibold text-[13px]">{req.drop_off_note || ride?.destination}</span>
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
          <p className="text-[12px] font-bold text-red-600 mb-1">🛡️ Emergency — how it works</p>
          <p className="text-[12px] text-red-500 leading-relaxed">
            If you feel unsafe, <strong>double-tap the red shield button</strong> (bottom right).
            A silent alert will be sent to your trusted contact with the driver's details.
            No sound. The driver won't know.
          </p>
        </div>
 
        {/* Rider view — driver ends the ride from their dashboard */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-[12px] text-green-700">
            🚗 The driver will end the ride from their dashboard when you arrive.
            You'll then be prompted to rate your experience.
          </p>
        </div>
      </div>
 
      {/* Silent SOS button — double-tap */}
      <SOSButton rideRequestId={req.id} />
    </div>
  );
}
 
