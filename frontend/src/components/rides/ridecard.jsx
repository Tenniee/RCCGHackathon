import { useNavigate } from "react-router-dom";
import Avatar from "../common/avatar";
import { Stars } from "../common/stars";
import { formatNaira, seatsLabel } from "../../utils/helpers";
 
export default function RideCard({ ride }) {
  const navigate = useNavigate();
  const { driver, seats_available, status } = ride;
  const isFull = seats_available <= 0 || status === "full";
 
  return (
    <div
      className="card card-hover p-4 mb-3"
      onClick={() => navigate(`/rides/${ride.id}`)}
    >
      {/* Driver row */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar user={driver} size="md" showVerified />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] text-gray-900 truncate">{driver.full_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Stars score={driver.average_rating} />
            <span className="text-[12px] text-gray-500">
              {driver.average_rating?.toFixed(1)} · {driver.total_rides} rides
            </span>
          </div>
          {driver.parish && (
            <p className="text-[11px] text-green-700 font-semibold mt-0.5 truncate">
              {driver.parish}
            </p>
          )}
        </div>
        <div className={`badge flex-shrink-0 ${isFull ? "badge-gray" : "badge-green"}`}>
          {seatsLabel(seats_available)}
        </div>
      </div>
 
      {/* Trust badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {driver.is_verified && (
          <span className="badge badge-green">✓ Verified</span>
        )}
        {driver.total_rides >= 10 && (
          <span className="badge badge-gold">⭐ {driver.total_rides} rides</span>
        )}
      </div>
 
      {/* Route */}
      <div className="flex items-start gap-2 mb-1.5">
        <span className="text-green-700 text-[16px] mt-0.5 flex-shrink-0">📍</span>
        <div>
          <p className="text-[14px] font-semibold text-gray-800">
            {ride.origin} → {ride.destination}
          </p>
          {ride.route_description && (
            <p className="text-[12px] text-gray-500 mt-0.5">
              Passing: {ride.route_description}
            </p>
          )}
        </div>
      </div>
 
      {/* Meta */}
      <div className="flex items-center gap-4 pt-2 border-t border-green-50">
        <span className="text-[12px] text-gray-500">🕐 {ride.departure_time}</span>
        <span className="text-[12px] font-bold text-green-700 ml-auto">
          {formatNaira(ride.cost_per_rider)}
        </span>
        {isFull && <span className="badge badge-gray text-[10px]">Full</span>}
      </div>
    </div>
  );
}