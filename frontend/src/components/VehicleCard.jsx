import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatAUDFromString, vehicleTypeLabel } from '../utils/formatters';

const TYPE_ICON = {
  wheelchair: '♿',
  van:        '🚐',
  wagon:      '🚗',
  sedan:      '🚘',
};

export default function VehicleCard({ vehicle, searchParams, showPrice = true }) {
  const navigate = useNavigate();

  function handleBook() {
    const qs = searchParams ? `?${new URLSearchParams(searchParams).toString()}` : '';
    navigate(`/vehicles/${vehicle.id}${qs}`);
  }

  return (
    <article className="card p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-full sm:w-36 h-28 sm:h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden"
           aria-hidden="true">
        {vehicle.photos && vehicle.photos[0]
          ? <img src={vehicle.photos[0]} alt="" className="w-full h-full object-cover rounded-lg" />
          : <span className="text-4xl">{TYPE_ICON[vehicle.type] || '🚗'}</span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between gap-2">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-gray-900">{vehicle.name}</h3>
            <span className="flex-shrink-0 text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {vehicleTypeLabel(vehicle.type)}
            </span>
          </div>
          {vehicle.accessibility_notes && (
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
              <span aria-hidden="true">♿</span>
              {vehicle.accessibility_notes}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {vehicle.capacity} {vehicle.capacity === 1 ? 'seat' : 'seats'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {showPrice && (
            <div className="text-sm">
              {vehicle.price_for_period_aud
                ? <span className="font-semibold text-gray-900 text-base">{formatAUDFromString(vehicle.price_for_period_aud)} <span className="text-xs font-normal text-gray-500">incl. GST</span></span>
                : (
                  <span className="text-gray-600">
                    From {formatAUDFromString(vehicle.hourly_rate_aud)}/hr · {formatAUDFromString(vehicle.daily_rate_aud)}/day
                  </span>
                )
              }
            </div>
          )}
          <button onClick={handleBook} className="btn-primary text-sm py-2 px-4 self-start sm:self-auto">
            Book This Vehicle
          </button>
        </div>
      </div>
    </article>
  );
}
