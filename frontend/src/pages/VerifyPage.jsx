import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authAPI } from "../api";
import { apiError } from "../utils/helpers";
import UploadBox from "../components/common/uploadBox";
 
const STEPS = ["Upload docs", "Pending review", "Approved"];
 
export default function VerifyPage() {
  const navigate      = useNavigate();
  const { login }     = useAuth();
  const { showToast } = useToast();
 
  const role     = sessionStorage.getItem("signup_role") || "rider";
  const phone    = sessionStorage.getItem("signup_phone") || "";
  const password = sessionStorage.getItem("signup_password") || "";
 
  const [uploaded, setUploaded] = useState({ selfie: false, nin: false, licence: false, car_photo: false });
  const [submitting, setSubmitting] = useState(false);
 
  const allMembersDone  = uploaded.selfie && uploaded.nin;
  const driverDocsDone  = role !== "driver" || (uploaded.licence && uploaded.car_photo);
  const canSubmit       = allMembersDone && driverDocsDone;
 
  function markDone(key) {
    return () => setUploaded((u) => ({ ...u, [key]: true }));
  }
 
  async function handleContinue() {
    setSubmitting(true);
    try {
      // Log the user in so they can access the pending screen
      await login(phone, password);
      navigate("/pending", { replace: true });
    } catch (err) {
      showToast(apiError(err), "error");
    } finally {
      setSubmitting(false);
    }
  }
 
  return (
    <div className="min-h-screen bg-green-700 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <button onClick={() => navigate("/signup")}
          className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center text-white mb-4">
          ←
        </button>
        <h1 className="text-white font-black text-[22px]">Identity verification</h1>
        <p className="text-white/70 text-[13px] mt-1">
          Upload your documents so the community admin can verify you.
        </p>
        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black
                ${i === 0 ? "bg-gold-500 text-white" : "bg-white/20 text-white/50"}`}>
                {i + 1}
              </div>
              <span className={`text-[11px] font-bold tracking-wide ${i === 0 ? "text-white" : "text-white/40"}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className="h-px w-4 bg-white/20" />}
            </div>
          ))}
        </div>
      </div>
 
      {/* Form card */}
      <div className="flex-1 bg-cream rounded-t-3xl px-5 pt-6 pb-12 overflow-y-auto">
 
        {/* Info banner */}
        <div className="bg-gold-50 border border-gold-200 rounded-xl p-3 flex gap-2 mb-6">
          <span className="text-gold-500 flex-shrink-0">🔒</span>
          <p className="text-[12px] text-gold-700 leading-relaxed">
            Files are uploaded securely to <strong>Cloudinary</strong>. Your ID images are
            reviewed manually by an RCCG admin and never shared publicly.
          </p>
        </div>
 
        {/* All members */}
        <p className="section-label mb-3">Required from everyone</p>
        <div className="space-y-3 mb-6">
          <div>
            <label className="label mb-1.5">Your selfie / short video of yourself</label>
            <UploadBox
              docType="selfie"
              label="Tap to take selfie or upload video"
              icon="🤳"
              accept="image/*,video/*"
              onDone={markDone("selfie")}
            />
          </div>
          <div>
            <label className="label mb-1.5">NIN slip or NIN card</label>
            <UploadBox
              docType="nin"
              label="Tap to upload NIN document"
              icon="🪪"
              onDone={markDone("nin")}
            />
          </div>
        </div>
 
        {/* Driver-only */}
        {role === "driver" && (
          <>
            <p className="section-label mb-3">Required for drivers</p>
            <div className="space-y-3 mb-6">
              <div>
                <label className="label mb-1.5">Driver's licence (front)</label>
                <UploadBox
                  docType="licence"
                  label="Tap to upload your licence"
                  icon="📄"
                  onDone={markDone("licence")}
                />
              </div>
              <div>
                <label className="label mb-1.5">Your car — exterior photo</label>
                <UploadBox
                  docType="car_photo"
                  label="Tap to upload car photo"
                  icon="🚗"
                  onDone={markDone("car_photo")}
                />
              </div>
            </div>
          </>
        )}
 
        {/* How image upload works */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-6">
          <p className="text-[11px] font-bold text-green-700 mb-1">How image upload works</p>
          <ol className="text-[11px] text-green-700/80 space-y-0.5 list-decimal list-inside">
            <li>Your file uploads directly to Cloudinary from this device</li>
            <li>Cloudinary returns a secure URL</li>
            <li>We save only the URL — your file never passes through our server</li>
            <li>An admin reviews the images to approve your account</li>
          </ol>
        </div>
 
        <p className="text-[11px] text-gray-400 text-center mb-4">
          OTP phone verification — optional module, can be added later via Termii SMS API
        </p>
 
        <button
          onClick={handleContinue}
          disabled={!canSubmit || submitting}
          className="btn-primary"
        >
          {submitting ? "Submitting…" : canSubmit ? "Submit for review →" : "Upload all documents to continue"}
        </button>
      </div>
    </div>
  );
}
