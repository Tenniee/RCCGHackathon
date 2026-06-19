import { getInitials, avatarBg } from "../../utils/helpers";
 
/**
 * Avatar with optional verified shield overlay.
 * Shows selfie_url if available, else colour-coded initials.
 */
export default function Avatar({ user, size = "md", showVerified = false, className = "" }) {
  const sizes = {
    xs:  "w-8 h-8 text-[11px]",
    sm:  "w-10 h-10 text-[12px]",
    md:  "w-12 h-12 text-[14px]",
    lg:  "w-16 h-16 text-[20px]",
    xl:  "w-20 h-20 text-[26px]",
  };
 
  const initials = getInitials(user?.full_name || "?");
  const bg       = avatarBg(user?.full_name || "");
 
  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {user?.selfie_url ? (
        <img
          src={user.selfie_url}
          alt={user.full_name}
          className={`${sizes[size]} rounded-full object-cover border-2 border-gold-200`}
        />
      ) : (
        <div
          className={`${sizes[size]} ${bg} avatar font-bold flex items-center justify-center`}
        >
          {initials}
        </div>
      )}
      {showVerified && user?.is_verified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 bg-green-700 text-white rounded-full
                     flex items-center justify-center text-[9px] font-black"
          style={{ width: 16, height: 16 }}
          title="Verified RCCG member"
        >
          ✓
        </span>
      )}
    </div>
  );
}