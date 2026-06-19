/** Returns initials from a full name, e.g. "Ada Okonkwo" → "AO" */
export function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}
 
/** Formats a number as Naira, e.g. 1500 → "₦1,500" */
export function formatNaira(amount) {
  if (!amount || amount === 0) return "Free";
  return `₦${Number(amount).toLocaleString("en-NG")}`;
}
 
/** Returns "3 seats left" or "Full" */
export function seatsLabel(available) {
  if (available <= 0) return "Full";
  return `${available} seat${available === 1 ? "" : "s"} left`;
}
 
/** Returns how long ago a date was, e.g. "2m ago", "1h ago" */
export function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}
 
/** Returns a deterministic pastel background colour from a string */
const AVATAR_BG = [
  "bg-green-100", "bg-emerald-100", "bg-teal-100",
  "bg-amber-100", "bg-orange-100", "bg-lime-100",
];
export function avatarBg(str = "") {
  const idx = (str.charCodeAt(0) || 0) % AVATAR_BG.length;
  return AVATAR_BG[idx];
}
 
/** Cleans an error from axios into a readable string */
export function apiError(err) {
  return (
    err?.response?.data?.detail ||
    err?.message ||
    "Something went wrong. Please try again."
  );
}