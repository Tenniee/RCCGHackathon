import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ratingsAPI, ridesAPI } from "../api";
import { useToast } from "../context/ToastContext";
import { apiError } from "../utils/helpers";
import { StarPicker } from "../components/common/stars";
import Avatar from "../components/common/avatar";
import TopBar from "../components/layout/topbar";
 
const TAGS = ["Punctual", "Safe driver", "Friendly", "Clean car", "Good route", "Great conversation"];
 
export default function RatePage() {
  const { requestId } = useParams();
  const navigate      = useNavigate();
  const { showToast } = useToast();
 
  const [score, setScore]       = useState(0);
  const [comment, setComment]   = useState("");
  const [tags, setTags]         = useState([]);
  const [submitting, setSubmitting] = useState(false);
 
  // The request object — we read driver info from req.ride.driver
  const [req, setReq]     = useState(null);
  const [loadError, setLoadError] = useState(false);
 
  // useEffect (not useState) to actually run the fetch
  useEffect(() => {
    ridesAPI.myRequests()
      .then((res) => {
        const found = res.data.find((r) => r.id === parseInt(requestId));
        if (found) {
          setReq(found);
        } else {
          setLoadError(true);
        }
      })
      .catch(() => setLoadError(true));
  }, [requestId]);
 
  // Driver id comes from the nested ride.driver object
  const driver   = req?.ride?.driver;
  const rateeId  = driver?.id;
 
  function toggleTag(tag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }
 
  async function submit() {
    if (score === 0)  return showToast("Please pick a star rating", "error");
    if (!rateeId)     return showToast("Still loading driver info — please wait a moment.", "error");
 
    setSubmitting(true);
    try {
      await ratingsAPI.submit({
        ride_request_id: parseInt(requestId),
        ratee_id: rateeId,
        score,
        comment: comment || null,
        tags: tags.join(",") || null,
      });
      showToast("Rating submitted! Thank you 🙏", "success");
      navigate("/home");
    } catch (err) {
      showToast(apiError(err), "error");
    } finally {
      setSubmitting(false);
    }
  }
 
  if (loadError) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 text-center">
      <p className="text-4xl mb-3">😕</p>
      <p className="font-bold text-gray-600">Could not load ride details</p>
      <button onClick={() => navigate("/home")} className="btn-primary mt-5 w-auto px-8">
        Go home
      </button>
    </div>
  );
 
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <TopBar title="Rate your ride" onBack={() => navigate("/home")} />
 
      <div className="flex-1 px-5 py-8 text-center overflow-y-auto">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="font-black text-[22px] text-gray-900 mb-1">You arrived safely!</h2>
        <p className="text-[14px] text-gray-500 mb-6">
          How was your ride? Your rating helps build trust in the community.
        </p>
 
        {/* Driver being rated */}
        {driver ? (
          <div className="card p-4 mb-6 flex items-center gap-3 text-left">
            <Avatar user={driver} size="md" showVerified />
            <div>
              <p className="font-bold text-[15px]">{driver.full_name}</p>
              <p className="text-[12px] text-gray-500">{driver.parish}</p>
              <p className="text-[11px] text-green-700 font-semibold mt-0.5">
                {req?.ride?.origin} → {req?.ride?.destination}
              </p>
            </div>
          </div>
        ) : (
          <div className="card p-4 mb-6 animate-pulse bg-gray-100 h-20" />
        )}
 
        {/* Stars */}
        <div className="mb-6">
          <p className="section-label mb-3">Rate the driver</p>
          <StarPicker value={score} onChange={setScore} />
          <p className="text-[12px] text-gray-400 mt-2 h-4">
            {score === 0 && "Tap a star to rate"}
            {score === 1 && "⚠️ Poor"}
            {score === 2 && "😕 Below average"}
            {score === 3 && "😊 Okay"}
            {score === 4 && "👍 Good"}
            {score === 5 && "🙏 Excellent!"}
          </p>
        </div>
 
        {/* Quick tags */}
        <div className="text-left mb-5">
          <p className="section-label mb-3">Quick tags</p>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-all
                  ${tags.includes(tag)
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-white text-gray-600 border-green-200"}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
 
        {/* Comment */}
        <div className="text-left mb-6">
          <label className="label">
            Leave a note{" "}
            <span className="text-gray-400 font-normal normal-case">(optional)</span>
          </label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="e.g. Very kind and punctual. Great conversation. Would ride again!"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
 
        <button
          onClick={submit}
          disabled={submitting || score === 0 || !rateeId}
          className="btn-primary mb-3"
        >
          {submitting ? "Submitting…" : "Submit rating"}
        </button>
        <button onClick={() => navigate("/home")} className="btn-secondary">
          Skip for now
        </button>
      </div>
    </div>
  );
}