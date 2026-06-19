import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ratingsAPI, ridesAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiError } from "../utils/helpers";
import { StarPicker } from "../components/common/stars";
import TopBar from "../components/layout/topbar";
 
const TAGS = ["Punctual", "Safe driver", "Friendly", "Clean car", "Good route", "Great conversation"];
 
export default function RatePage() {
  const { requestId }     = useParams();
  const navigate          = useNavigate();
  const { user }          = useAuth();
  const { showToast }     = useToast();
 
  const [score, setScore]     = useState(0);
  const [comment, setComment] = useState("");
  const [tags, setTags]       = useState([]);
  const [rateeId, setRateeId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
 
  // Fetch request to get ratee id
  useState(() => {
    ridesAPI.myRequests().then((res) => {
      const req = res.data.find((r) => r.id === parseInt(requestId));
      if (req) setRateeId(req.ride?.driver_id);
    }).catch(() => {});
  });
 
  function toggleTag(tag) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }
 
  async function submit() {
    if (score === 0) return showToast("Please pick a star rating", "error");
    if (!rateeId)   return showToast("Could not find driver to rate.", "error");
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
 
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <TopBar title="Rate your ride" onBack={false} />
 
      <div className="flex-1 px-5 py-8 text-center overflow-y-auto">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="font-black text-[22px] text-gray-900 mb-1">You arrived safely!</h2>
        <p className="text-[14px] text-gray-500 mb-8">
          How was your ride? Your rating helps build trust in the community.
        </p>
 
        {/* Stars */}
        <div className="mb-6">
          <p className="section-label mb-3">Rate the driver</p>
          <StarPicker value={score} onChange={setScore} />
          <p className="text-[12px] text-gray-400 mt-2">
            {score === 0 && "Tap a star"}
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
          <label className="label">Leave a note <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="e.g. Very kind and punctual. Great conversation. Would ride again!"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
 
        <button onClick={submit} disabled={submitting || score === 0} className="btn-primary mb-3">
          {submitting ? "Submitting…" : "Submit rating"}
        </button>
        <button onClick={() => navigate("/home")} className="btn-secondary">
          Skip for now
        </button>
      </div>
    </div>
  );
}
