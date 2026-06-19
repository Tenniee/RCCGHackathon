import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { messagesAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../utils/helpers";
import Avatar from "../components/common/Avatar";
import TopBar from "../components/layout/TopBar";
import BottomNav from "../components/layout/BottomNav";
 
export default function MessagesPage() {
  const navigate        = useNavigate();
  const { user }        = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    messagesAPI.listThreads()
      .then((res) => setThreads(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
 
  return (
    <>
      <div className="page">
        <TopBar title="Messages" onBack={false} />
        <div className="px-4 pt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-4 h-20 animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">💬</p>
              <p className="font-bold text-gray-600">No messages yet</p>
              <p className="text-[13px] text-gray-400 mt-1">
                Messages appear here when a driver or rider starts a conversation about a ride.
              </p>
            </div>
          ) : (
            threads.map((thread) => {
              const other     = user?.id === thread.driver_id ? thread.rider : thread.driver;
              const lastMsg   = thread.messages?.[thread.messages.length - 1];
              const hasUnread = thread.messages?.some(
                (m) => !m.is_read && m.sender_id !== user?.id
              );
 
              return (
                <div
                  key={thread.id}
                  className="card card-hover p-4 mb-3 flex items-center gap-3"
                  onClick={() => navigate(`/messages/${thread.id}`)}
                >
                  <Avatar user={other} size="md" showVerified />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-[14px] truncate ${hasUnread ? "font-black text-gray-900" : "font-semibold text-gray-700"}`}>
                        {other?.full_name}
                      </p>
                      {lastMsg && (
                        <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                          {timeAgo(lastMsg.created_at)}
                        </span>
                      )}
                    </div>
                    <p className={`text-[12px] truncate ${hasUnread ? "text-green-700 font-semibold" : "text-gray-400"}`}>
                      {lastMsg ? lastMsg.body : "No messages yet"}
                    </p>
                    <p className="text-[10px] text-gray-300 mt-0.5 truncate">
                      Re: {thread.ride?.origin} → {thread.ride?.destination}
                    </p>
                  </div>
                  {hasUnread && (
                    <div className="w-2.5 h-2.5 rounded-full bg-gold-500 flex-shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
