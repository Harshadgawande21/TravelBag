import React, { useState } from "react";
import { Compass, Search, MapPin, Sparkles, SlidersHorizontal, IndianRupee } from "lucide-react";

interface HeroSearchProps {
  onSearch: (filters: {
    source: string;
    destination: string;
    travelStyle: string;
    budget: string;
  }) => void;
  activeCount: number;
}

export default function HeroSearch({ onSearch, activeCount }: HeroSearchProps) {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [travelStyle, setTravelStyle] = useState("");
  const [budget, setBudget] = useState("");
  const [isExpandedFilters, setIsExpandedFilters] = useState(false);

  const topLocations = ["Goa", "Manali", "Dwarka", "Ladakh", "Mumbai", "Pune"];
  const styles = ["Adventure", "Backpacker", "Luxury", "Foodie", "Relaxing", "Culture"];

  const handleFormSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ source, destination, travelStyle, budget });
  };

  const handleQuickDestination = (loc: string) => {
    setDestination(loc);
    onSearch({ source, destination: loc, travelStyle, budget });
  };

  const handleStyleSelect = (chosenStyle: string) => {
    const updated = travelStyle === chosenStyle ? "" : chosenStyle;
    setTravelStyle(updated);
    onSearch({ source, destination, travelStyle: updated, budget });
  };

  const handleClear = () => {
    setSource("");
    setDestination("");
    setTravelStyle("");
    setBudget("");
    onSearch({ source: "", destination: "", travelStyle: "", budget: "" });
  };

  return (
    <div className="bg-gradient-to-br from-teal-800 via-teal-950 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden" id="hero-search-box">
      {/* Decorative vector overlays */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center space-x-1.5 bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md text-xs font-semibold text-orange-200 tracking-wide uppercase border border-white/5">
            <Sparkles className="h-3.5 w-3.5 text-orange-400 animate-pulse" />
            <span>Discover Perfect Travel Companions</span>
          </div>
          <h1 className="font-sans font-extrabold text-3xl sm:text-5xl tracking-tight text-white leading-tight">
            Who is traveling to your next <span className="text-teal-400 underline decoration-orange-400 decoration-wavy underline-offset-6">destination</span>?
          </h1>
          <p className="text-teal-100 max-w-xl mx-auto text-sm sm:text-base font-medium">
            Find active travel partners, join pre-arranged campaigns, share budgets, chat securely, and conquer new horizons together.
          </p>
        </div>

        {/* INPUT LOOKUP WIDGET */}
        <form onSubmit={handleFormSearch} className="bg-white text-gray-800 p-3 rounded-2xl sm:rounded-full shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-2 border border-gray-100" id="search-form">
          {/* SOURCE */}
          <div className="flex-1 flex items-center space-x-2 px-3 py-2 border-b sm:border-b-0 sm:border-r border-gray-100">
            <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
            <div className="w-full">
              <label className="block text-[10px] text-gray-400 font-bold uppercase leading-none mb-0.5">Leaving From</label>
              <input 
                type="text" 
                placeholder="City (e.g. Mumbai, Pune)" 
                value={source} 
                onChange={(e) => setSource(e.target.value)}
                className="w-full text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                id="source-input"
              />
            </div>
          </div>

          {/* DESTINATION */}
          <div className="flex-1 flex items-center space-x-2 px-3 py-2 border-b sm:border-b-0 sm:border-r border-gray-100">
            <MapPin className="h-5 w-5 text-teal-600 shrink-0" />
            <div className="w-full">
              <label className="block text-[10px] text-teal-600 font-bold uppercase leading-none mb-0.5">Going To</label>
              <input 
                type="text" 
                placeholder="Destination (Goa, Manali, Ladakh...)" 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)}
                className="w-full text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
                id="destination-input"
              />
            </div>
          </div>

          {/* BUDGET & STYLE ADVANCED COMPRESSOR */}
          <div className="flex items-center space-x-2 px-3">
            <button
              type="button"
              onClick={() => setIsExpandedFilters(!isExpandedFilters)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                isExpandedFilters || travelStyle || budget 
                  ? "bg-teal-50 border-teal-200 text-teal-700" 
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
              id="advanced-filter-toggle"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Criteria {travelStyle && `• ${travelStyle}`}</span>
            </button>
          </div>

          <button 
            type="submit" 
            className="bg-orange-500 hover:bg-orange-600 text-white font-sans font-bold text-sm px-6 py-3 rounded-xl sm:rounded-full shadow-lg shadow-orange-500/30 transition flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
            id="search-btn"
          >
            <Search className="h-4 w-4" />
            <span>Discover Companions</span>
          </button>
        </form>

        {/* EXPANDABLE CRITERIA BAR */}
        {isExpandedFilters && (
          <div className="mt-4 bg-white/95 text-gray-800 p-5 rounded-2xl shadow-xl border border-white/20 animate-fade-in flex flex-col sm:flex-row gap-5" id="expanded-filters">
            <div className="flex-1 space-y-2">
              <span className="block text-xs font-bold text-gray-500 uppercase">Max Budget Contribution</span>
              <div className="flex items-center space-x-3">
                <IndianRupee className="h-5 w-5 text-teal-600 shrink-0" />
                <input 
                  type="range" 
                  min="3000" 
                  max="50000" 
                  step="1000"
                  value={budget || "50000"} 
                  onChange={(e) => {
                    setBudget(e.target.value);
                    onSearch({ source, destination, travelStyle, budget: e.target.value });
                  }}
                  className="w-full accent-teal-600"
                  id="budget-range"
                />
                <span className="font-sans font-extrabold text-sm text-teal-800 shrink-0 min-w-16">
                  {budget ? `₹${parseInt(budget).toLocaleString()}` : "Any"}
                </span>
              </div>
            </div>

            <div className="sm:border-l border-gray-150 pl-0 sm:pl-5 flex-1 space-y-2">
              <span className="block text-xs font-bold text-gray-500 uppercase">Preferred Travel Mood</span>
              <div className="flex flex-wrap gap-1.5" id="style-bubble-container">
                {styles.map((styl) => (
                  <button
                    key={styl}
                    type="button"
                    onClick={() => handleStyleSelect(styl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      travelStyle === styl 
                        ? "bg-teal-700 text-white" 
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {styl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONTROLS CLEARING */}
        {(source || destination || travelStyle || budget) && (
          <div className="mt-4 flex items-center justify-between" id="active-filters-info">
            <p className="text-xs font-semibold text-teal-200">
              Active filters found: {source && `leaving ${source}, `}{destination && `visiting ${destination}, `}{travelStyle && `mood is ${travelStyle}, `}{budget && `max cost ₹${budget}`}
            </p>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-orange-300 hover:text-orange-200 underline cursor-pointer"
              id="clear-filters"
            >
              Clear All Rules
            </button>
          </div>
        )}

        {/* TOP COMPANION BOOKMARKS */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4" id="trending-destinations">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-teal-300 uppercase tracking-widest block">Instant Destinations:</span>
            <div className="flex flex-wrap gap-2">
              {topLocations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleQuickDestination(loc)}
                  className={`text-xs px-3 py-1.5 rounded-full transition cursor-pointer font-bold border ${
                    destination === loc 
                      ? "bg-orange-500 border-orange-500 text-white" 
                      : "bg-white/5 border-white/10 hover:bg-white/15 text-white"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[11px] font-mono text-teal-200 tracking-wider">
            ● <span className="font-semibold text-orange-200">{activeCount}</span> Campaigns Match Your Style
          </div>
        </div>
      </div>
    </div>
  );
}
