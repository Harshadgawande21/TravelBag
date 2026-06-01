import React, { useState, useEffect } from "react";
import { DestinationPlace } from "../types";
import { Star, MapPin, Loader2, Sparkles, Coffee, Hotel, ShieldAlert, Navigation } from "lucide-react";

interface DestinationInsightsProps {
  destinationName: string;
  onClose?: () => void;
}

export default function DestinationInsights({ destinationName, onClose }: DestinationInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DestinationPlace | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!destinationName) return;

    const fetchDetails = async () => {
      setLoading(true);
      setErr(null);
      try {
        const response = await fetch(`/api/destinations/info?query=${encodeURIComponent(destinationName)}`);
        if (!response.ok) {
          throw new Error("Unable to retrieve destination data");
        }
        const payload = await response.json();
        setData(payload);
      } catch (error: any) {
        setErr(error.message || "Failed loading travel details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [destinationName]);

  if (!destinationName) return null;

  return (
    <div className="bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-xl" id="destination-insights-panel">
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center space-y-3" id="loading-insight">
          <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
          <p className="text-sm font-semibold text-gray-700">Brewing travel intelligence for {destinationName}...</p>
          <p className="text-xs text-gray-400 font-mono">Retrieving local attractions, stays, and budget trails...</p>
        </div>
      ) : err ? (
        <div className="p-8 text-center text-red-500 space-y-2" id="error-insight">
          <ShieldAlert className="h-8 w-8 mx-auto" />
          <p className="text-sm font-bold">{err}</p>
          <p className="text-xs text-gray-500">We'll retry loading details shortly.</p>
        </div>
      ) : data ? (
        <div id="insight-data-content">
          {/* Cover Hero Banner Image */}
          <div className="h-48 w-full relative" id="insight-banner">
            <img 
              referrerPolicy="no-referrer"
              src={data.image} 
              alt={data.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <span className="text-[10px] bg-orange-500 text-white font-bold uppercase tracking-widest px-2 py-0.5 rounded mr-2">Local Intel</span>
                <h2 className="text-2xl font-sans font-extrabold text-white leading-tight flex items-center space-x-1">
                  <MapPin className="h-5 w-5 text-orange-400 shrink-0 inline" />
                  <span>{data.name}</span>
                </h2>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center space-x-1 text-xs border border-white/10 text-white font-semibold">
                <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                <span>{data.rating}</span>
                <span className="text-white/60 font-medium">({data.reviewsCount})</span>
              </div>
            </div>
            {onClose && (
              <button 
                onClick={onClose} 
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full text-xs"
                id="close-insights-btn"
              >
                ✕
              </button>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Description */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block">AI Destination Overview</span>
              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                {data.description}
              </p>
            </div>

            {/* Attractions Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-1.5 border-b border-gray-100 pb-1.5">
                <Navigation className="h-4.5 w-4.5 text-teal-600 shrink-0" />
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Must-Visit Attractions</h3>
              </div>
              <div className="flex flex-wrap gap-1.5" id="attractions-container">
                {data.attractions?.map((attr, idx) => (
                  <span 
                    key={idx} 
                    className="bg-teal-50 border border-teal-100/60 text-teal-800 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1"
                  >
                    <span>{attr}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Accommodations and Dining Side-by-Side Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="hotels-restaurants-grid">
              {/* HOTELS */}
              <div className="space-y-3">
                <div className="flex items-center space-x-1.5 border-b border-gray-100 pb-1.5">
                  <Hotel className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Lodging Guide</h3>
                </div>
                <div className="space-y-2">
                  {data.hotels?.map((ht, idx) => (
                    <div key={idx} className="bg-gray-50/50 border border-gray-100 p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-gray-800 leading-tight">{ht.name}</p>
                        <p className="text-gray-500 font-medium">{ht.price}</p>
                      </div>
                      <div className="bg-white px-1.5 py-0.5 rounded border border-gray-100 flex items-center space-x-0.5 text-[10px] font-bold text-gray-700 shrink-0">
                        <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                        <span>{ht.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RESTAURANTS */}
              <div className="space-y-3">
                <div className="flex items-center space-x-1.5 border-b border-gray-100 pb-1.5">
                  <Coffee className="h-4.5 w-4.5 text-orange-500 shrink-0" />
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Top Rated Dining</h3>
                </div>
                <div className="space-y-2">
                  {data.restaurants?.map((rt, idx) => (
                    <div key={idx} className="bg-gray-50/50 border border-gray-100 p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-gray-800 leading-tight">{rt.name}</p>
                        <p className="text-gray-500 font-medium italic">{rt.cuisine}</p>
                      </div>
                      <div className="bg-white px-1.5 py-0.5 rounded border border-gray-100 flex items-center space-x-0.5 text-[10px] font-bold text-gray-700 shrink-0">
                        <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                        <span>{rt.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Safety & RLS warning footer */}
            <div className="bg-teal-50/50 border border-teal-100 p-3 rounded-2xl flex items-start space-x-2 text-[11px] text-teal-800 leading-normal font-semibold">
              <Sparkles className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span>Planning a tour to {data.name}? Browse active travel campaigns below, request to join their secure groups, and discuss itinerary adjustments in real time!</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-400 text-xs font-serif italic" id="empty-insight">
          Select or search a destination above to display traveler itineraries & hotel options.
        </div>
      )}
    </div>
  );
}
