import { useRef, useState } from "react";
import { emergencyAPI } from "../../api";
import { useToast } from "../../context/ToastContext";
 
/**
 * Silent emergency button — double-tap within 500ms triggers SOS.
 * Sends POST /emergency/alert — no sound, no visible indication to driver.
 * GPS live location: added later via Google Maps SDK.
 */
export default function SOSButton({ rideRequestId }) {
  const { showToast } = useToast();
  const tapCount      = useRef(0);
  const tapTimer      = useRef(null);
  const [fired, setFired]       = useState(false);
  const [showModal, setShowModal] = useState(false);
 
  async function handleTap() {
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
 
    if (tapCount.current >= 2) {
      tapCount.current = 0;
      await triggerSOS();
    } else {
      tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 500);
    }
  }
 
  async function triggerSOS() {
    if (fired) return;
    try {
      await emergencyAPI.triggerAlert({ ride_request_id: rideRequestId });
      setFired(true);
      setShowModal(true);
    } catch {
      showToast("Could not send alert. Try again.", "error");
    }
  }
 
  return (
    <>
      {/* Floating SOS button */}
      <button
        onClick={handleTap}
        className={`sos-btn fixed bottom-28 right-4 z-40 w-14 h-14 rounded-full
                    flex items-center justify-center shadow-lg
                    ${fired ? "bg-gray-400" : "bg-red-600"} text-white text-2xl`}
        title="Double-tap for silent emergency alert"
      >
        🛡️
      </button>
 
      {/* SOS confirmation modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-red-700 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl mb-4 animate-bounce">🛡️</div>
          <h2 className="text-white text-2xl font-black mb-3">Silent Alert Sent</h2>
          <p className="text-white/90 text-[15px] leading-relaxed mb-6">
            Your trusted contact has been notified with your current ride details.
            Stay calm. Help is aware.
          </p>
          <div className="bg-white/10 rounded-xl p-4 mb-8 text-left w-full max-w-xs">
            <p className="text-white text-[13px]">📍 Live location sharing</p>
            <p className="text-white/60 text-[11px] mt-0.5">Added later via Google Maps SDK</p>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="bg-white text-red-700 font-bold px-8 py-3 rounded-xl"
          >
            I'm safe — dismiss
          </button>
        </div>
      )}
    </>
  );
}