import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { messagesAPI } from "../../api";
import { useEffect, useState } from "react";
 
const RIDER_TABS = [
  { to: "/home",     icon: "🏠", label: "Home"     },
  { to: "/messages", icon: "💬", label: "Messages" },
  { to: "/requests", icon: "📋", label: "Requests" },
  { to: "/profile",  icon: "👤", label: "Profile"  },
];
 
const DRIVER_TABS = [
  { to: "/home",         icon: "🏠", label: "Home"     },
  { to: "/messages",     icon: "💬", label: "Messages" },
  { to: "/my-rides",     icon: "🚗", label: "My Rides" },
  { to: "/profile",      icon: "👤", label: "Profile"  },
];
 
export default function BottomNav() {
  const { user }  = useAuth();
  const location  = useLocation();
  const tabs      = user?.role === "driver" ? DRIVER_TABS : RIDER_TABS;
  const [unread, setUnread] = useState(0);
 
  useEffect(() => {
    messagesAPI.unreadCount()
      .then((res) => setUnread(res.data.unread || 0))
      .catch(() => {});
    const id = setInterval(() => {
      messagesAPI.unreadCount()
        .then((res) => setUnread(res.data.unread || 0))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [location]);
 
  return (
    <nav className="bottom-nav z-40">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.to);
          const isMsgs   = tab.to === "/messages";
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold tracking-wide
                          transition-colors relative
                          ${isActive ? "text-green-700" : "text-gray-400"}`}
            >
              <span className="text-[22px] leading-none relative">
                {tab.icon}
                {isMsgs && unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold-500 text-white text-[9px] font-black
                                   w-4 h-4 rounded-full flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
              <span className="uppercase tracking-widest">{tab.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-green-700 rounded-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}