import { useRef, useState } from "react";
import { authAPI, uploadToCloudinary, usersAPI } from "../../api";
import { apiError } from "../../utils/helpers";
 
/**
 * Handles the full Cloudinary upload flow:
 * 1. Gets signed upload params from our backend
 * 2. Uploads file directly to Cloudinary
 * 3. POSTs the returned secure_url to our backend
 */
export default function UploadBox({
  docType,
  label,
  icon,
  accept = "image/*",
  onDone,
}) {
  const inputRef   = useRef(null);
  const [state, setState] = useState("idle"); // idle | uploading | done | error
  const [error, setError] = useState("");
 
  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setState("uploading");
    setError("");
    try {
      // Step 1: get Cloudinary signature from our backend
      const sigRes = await authAPI.cloudinarySignature();
      const sig    = sigRes.data;
 
      // Step 2: upload directly to Cloudinary
      const url = await uploadToCloudinary(file, docType, sig);
 
      // Step 3: save the URL to our backend
      await usersAPI.uploadDocument({ doc_type: docType, cloudinary_url: url });
 
      setState("done");
      onDone?.(url);
    } catch (err) {
      setState("error");
      setError(apiError(err));
    }
  }
 
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFile}
      />
      <div
        className={`upload-box ${state === "done" ? "done" : ""}`}
        onClick={() => state !== "uploading" && inputRef.current?.click()}
      >
        <div className="text-3xl mb-1.5">
          {state === "done"      ? "✅" :
           state === "uploading" ? "⏳" :
           state === "error"     ? "❌" :
           icon}
        </div>
        <p className={`text-[13px] font-semibold ${state === "done" ? "text-green-700" : "text-gray-500"}`}>
          {state === "done"      ? `${label} uploaded` :
           state === "uploading" ? "Uploading…"        :
           state === "error"     ? "Try again"         :
           label}
        </p>
        {state === "idle" && (
          <p className="text-[11px] text-gray-400 mt-0.5">Tap to upload</p>
        )}
        {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  );
}