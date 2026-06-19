import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { messagesAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { timeAgo, apiError } from "../utils/helpers";
import Avatar from "../components/common/Avatar";
import TopBar from "../components/layout/TopBar";
 
export default function ChatPage() {
  const { threadId }      = useParams();
  const { user }          = useAuth();
  const { showToast }     = useToast();
  const bottomRef         = useRef(null);
 
  const [thread, setThread] = useState(null);
  const [body, setBody]     = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
 
  const other = thread
    ? (user?.id === thread.driver_id ? thread.rider : thread.driver)
    : null;
 
  useEffect(() => {
    fetchThread();
    const id = setInterval(fetchThread, 10000); // poll every 10s
    return () => clearInterval(id);
  }, [threadId]); // eslint-disable-line
 
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages?.length]);
 
  async function fetchThread() {
    try {
      const res = await messagesAPI.getThread(threadId);
      setThread(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }
 
  async function send() {
    if (!body.trim()) return;
    setSending(true);
    try {
      await messagesAPI.send({ thread_id: Number(threadId), body: body.trim() });
      setBody("");
      await fetchThread();
    } catch (err) {
      showToast(apiError(err), "error");
    } finally {
      setSending(false);
    }
  }
 
  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="text-gray-400">Loading chat…</p>
    </div>
  );
 
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top bar with other person's avatar */}
      <div className="bg-green-700 px-4 pt-3 pb-4 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => history.back()}
          className="w-8 h-8 flex-shrink-0 bg-white/20 hover:bg-white/30 rounded-full text-white flex items-center justify-center">
          ←
        </button>
        <Avatar user={other} size="sm" showVerified />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-[15px] truncate">{other?.full_name}</p>
          <p className="text-white/60 text-[11px] truncate">{other?.parish} · Verified</p>
        </div>
      </div>
 
      {/* Ride context bar */}
      {thread?.ride && (
        <div className="bg-green-50 border-b border-green-100 px-4 py-2">
          <p className="text-[11px] text-green-700 font-semibold">
            📍 {thread.ride.origin} → {thread.ride.destination} · {thread.ride.departure_time}
          </p>
        </div>
      )}
 
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {thread?.messages?.length === 0 && (
          <p className="text-center text-gray-400 text-[13px] mt-8">
            No messages yet. Say hi 👋
          </p>
        )}
        {thread?.messages?.map((msg, i) => {
          const isMine    = msg.sender_id === user?.id;
          const showTime  = i === 0 || (
            new Date(msg.created_at) - new Date(thread.messages[i - 1].created_at) > 300000
          );
          return (
            <div key={msg.id}>
              {showTime && (
                <p className="text-center text-[11px] text-gray-400 my-2">
                  {timeAgo(msg.created_at)}
                </p>
              )}
              <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                {!isMine && (
                  <Avatar user={msg.sender} size="xs" className="mb-0.5 flex-shrink-0" />
                )}
                <div
                  className={`max-w-[75%] px-4 py-2.5 text-[14px] leading-relaxed
                    ${isMine ? "bubble-mine" : "bubble-theirs"}`}
                >
                  {msg.body}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
 
      {/* Input bar */}
      <div className="bg-white border-t border-green-100 px-3 py-3 flex gap-2 items-center flex-shrink-0
                      pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <input
          className="flex-1 bg-green-50 border border-green-200 rounded-full px-4 py-2.5
                     text-[14px] outline-none focus:border-green-500"
          placeholder="Type a message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
        />
        <button
          onClick={send}
          disabled={sending || !body.trim()}
          className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center
                     text-white disabled:opacity-40 flex-shrink-0"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
