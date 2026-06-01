import React, { useState } from "react";
import { Trip, User } from "../types";
import { Heart, MessageSquare, Bookmark, Send, ShieldCheck, Calendar, Users, IndianRupee, MapPin, Plus, Flag, BadgeAlert, Check, Inbox, HelpCircle, MessageCircle } from "lucide-react";

interface SocialFeedProps {
  trips: Trip[];
  currentUser: User | null;
  onLikeTrip: (tripId: string) => void;
  onSaveTrip: (tripId: string) => void;
  onAddComment: (tripId: string, commentText: string) => void;
  onRequestJoin: (tripId: string) => void;
  onReportItem: (itemType: "trip" | "comment", itemId: string, itemPreview: string, reason: string) => void;
  onCreateNewTripClick?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenDM?: (recipientUserId: string) => void;
  onCompleteTrip?: (tripId: string) => void;
}

export default function SocialFeed({
  trips,
  currentUser,
  onLikeTrip,
  onSaveTrip,
  onAddComment,
  onRequestJoin,
  onReportItem,
  onCreateNewTripClick,
  onNavigateTab,
  onOpenDM,
  onCompleteTrip
}: SocialFeedProps) {
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [reportingItem, setReportingItem] = useState<{ id: string; type: "trip" | "comment"; preview: string } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [filterType, setFilterType] = useState<"all" | "created" | "joined" | "saved" | "completed">("all");
  const [confirmingTripId, setConfirmingTripId] = useState<string | null>(null);

  const handleCommentSubmit = (e: React.FormEvent, tripId: string) => {
    e.preventDefault();
    const text = commentInputs[tripId]?.trim();
    if (!text) return;
    onAddComment(tripId, text);
    setCommentInputs(prev => ({ ...prev, [tripId]: "" }));
  };

  const submitReport = () => {
    if (!reportingItem || !reportReason.trim()) return;
    onReportItem(reportingItem.type, reportingItem.id, reportingItem.preview, reportReason);
    setReportingItem(null);
    setReportReason("");
    alert("Thank you. Safety report submitted to administrators for trust review.");
  };

  // Filter the campaigns based on selected segmented tab
  const filteredTrips = trips.filter(trip => {
    const isCompleted = !!trip.completed || !!trip.createdBy?.completed;

    if (filterType === "completed") {
      return isCompleted; // only show completed/history trips
    }

    // For all other tabs, we ONLY want active/uncompleted campaigns
    if (isCompleted) {
      return false;
    }

    if (filterType === "created") {
      return trip.createdById === currentUser?.id;
    }
    if (filterType === "joined") {
      return trip.joinedCompanionIds.includes(currentUser?.id || "");
    }
    if (filterType === "saved") {
      return trip.savedBy.includes(currentUser?.id || "");
    }
    return true; // all
  });

  return (
    <div className="space-y-6" id="social-feed-section">
      {/* Feed Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="feed-header">
        <div>
          <h2 className="text-xl font-sans font-extrabold text-gray-900 tracking-tight">Active Companion Campaigns</h2>
          <p className="text-xs text-gray-500 font-medium font-sans">Browse upcoming trips, read itineraries, and request companionship.</p>
        </div>
        {currentUser && (
          <button
            onClick={onCreateNewTripClick}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-teal-50 flex items-center space-x-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
            id="create-new-trip-btn"
          >
            <Plus className="h-4 w-4" />
            <span>Create Campaign</span>
          </button>
        )}
      </div>

      {/* DASHBOARD TAB SEGMENTS FOR USER CAMPAIGNS */}
      {currentUser && (
        <div className="flex bg-gray-100 p-1 rounded-2xl w-full text-xs font-bold overflow-x-auto gap-1" id="feed-subset-filters">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap cursor-pointer text-center ${
              filterType === "all" ? "bg-white text-teal-950 shadow" : "text-gray-500 hover:text-teal-955"
            }`}
          >
            All Campaigns ({trips.filter(t => !t.completed && !t.createdBy?.completed).length})
          </button>
          <button
            onClick={() => setFilterType("created")}
            className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap cursor-pointer text-center ${
              filterType === "created" ? "bg-teal-650 bg-teal-700 text-white shadow" : "text-gray-500 hover:text-teal-955"
            }`}
          >
            Created Trips ({trips.filter(t => t.createdById === currentUser.id && !t.completed && !t.createdBy?.completed).length})
          </button>
          <button
            onClick={() => setFilterType("joined")}
            className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap cursor-pointer text-center ${
              filterType === "joined" ? "bg-green-650 bg-green-700 text-white shadow" : "text-gray-500 hover:text-teal-955"
            }`}
          >
            Joined Trips ({trips.filter(t => t.joinedCompanionIds.includes(currentUser.id) && !t.completed && !t.createdBy?.completed).length})
          </button>
          <button
            onClick={() => setFilterType("saved")}
            className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap cursor-pointer text-center ${
              filterType === "saved" ? "bg-amber-650 bg-amber-500 text-white shadow" : "text-gray-500 hover:text-teal-955"
            }`}
          >
            Saved Campaigns ({trips.filter(t => t.savedBy.includes(currentUser.id) && !t.completed && !t.createdBy?.completed).length})
          </button>
          <button
            onClick={() => setFilterType("completed")}
            className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap cursor-pointer text-center ${
              filterType === "completed" ? "bg-indigo-650 bg-indigo-600 text-white shadow" : "text-gray-500 hover:text-teal-955"
            }`}
          >
            History & Completed ({trips.filter(t => t.completed || t.createdBy?.completed).length})
          </button>
        </div>
      )}

      {filteredTrips.length === 0 ? (
        <div className="bg-white border border-gray-150 p-12 text-center rounded-3xl" id="no-trips-message">
          <BadgeAlert className="h-10 w-10 text-orange-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-700">No companion campaigns match this category.</p>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {filterType === "all" 
              ? "Try looking up other locations. You can also log in to initialize your own custom campaign!"
              : "No customized campaign profiles are saved inside this segmented filter. Add plans or join with active trip cards!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6" id="trips-grid">
          {filteredTrips.map((trip) => {
            const isLiked = currentUser ? trip.likes.includes(currentUser.id) : false;
            const isSaved = currentUser ? trip.savedBy.includes(currentUser.id) : false;
            
            // Check status of join request
            const isOwner = currentUser?.id === trip.createdById;
            const isApprovedCompanion = currentUser ? trip.joinedCompanionIds.includes(currentUser.id) : false;
            const isPendingCompanion = currentUser ? trip.pendingCompanionIds.includes(currentUser.id) : false;
            
            // Dynamic capacity math
            const isFull = trip.joinedCompanionIds.length >= trip.maxCompanions;
            const slotsLeft = trip.maxCompanions - trip.joinedCompanionIds.length;

            return (
              <div key={trip.id} className="bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition overflow-hidden" id={`trip-card-${trip.id}`}>
                {/* HEAD DETAILS */}
                <div className="p-5 flex items-start justify-between border-b border-gray-50 bg-gray-50/20">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={trip.createdBy.avatar} 
                      alt={trip.createdBy.name} 
                      className="h-10 w-10 rounded-full border border-teal-500/20 object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-800 leading-tight flex items-center space-x-1">
                        <span>{trip.createdBy.name}</span>
                        {trip.createdBy.verified && (
                          <ShieldCheck className="h-3.5 w-3.5 text-teal-600 fill-teal-100 inline-block" title="Verified Traveler" />
                        )}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">
                        Trust Score: <span className="text-teal-600">{trip.createdBy.trustScore}%</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center space-x-1">
                    {/* COMPLETED OR EXPIRED STATUS DISPLAY */}
                    {trip.completed || trip.createdBy?.completed ? (
                      <span className="bg-amber-100 border border-amber-250 text-amber-800 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                        ✓ COMPLETED
                      </span>
                    ) : (
                      (() => {
                        if (trip.endDate) {
                          try {
                            const endDateTime = new Date(trip.endDate).getTime();
                            const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
                            const expireTime = endDateTime + threeDaysMs;
                            if (Date.now() > expireTime) {
                              return (
                                <span className="bg-gray-100 border border-gray-250 text-gray-700 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                                  ⏳ EXPIRED
                                </span>
                              );
                            }
                          } catch (e) {}
                        }
                        return null;
                      })()
                    )}

                    {/* TRIP CAPACITY BADGES FOR CLEAR RECRUITMENT STATUS */}
                    {isFull ? (
                      <span className="bg-red-50 border border-red-150 text-red-600 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md animate-pulse">
                        🔴 FULL ({trip.joinedCompanionIds.length}/{trip.maxCompanions})
                      </span>
                    ) : (
                      <span className="bg-green-50 border border-green-150 text-green-600 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                        🟢 OPEN ({slotsLeft} left)
                      </span>
                    )}

                    <span className="bg-teal-50 border border-teal-100 text-teal-700 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg">
                      {trip.travelStyle}
                    </span>
                    <button
                      onClick={() => setReportingItem({ id: trip.id, type: "trip", preview: trip.title })}
                      className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                      title="Report Campaign"
                    >
                      <Flag className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* TRIP ARTIFACT BODY */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-sans font-extrabold text-gray-900 leading-snug">{trip.title}</h3>
                    <p className="text-xs text-gray-400 font-medium mt-1 inline-flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{trip.startDate} to {trip.endDate}</span>
                    </p>
                  </div>

                  {/* TRAVEL SPECS */}
                  <div className="grid grid-cols-3 gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Route</p>
                      <p className="text-xs font-bold text-teal-800 flex items-center justify-center space-x-0.5 mt-0.5">
                        <MapPin className="h-3 w-3 text-teal-500" />
                        <span className="truncate">{trip.source} → {trip.destination}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Lodging Contribution</p>
                      <p className="text-xs font-extrabold text-teal-800 flex items-center justify-center space-x-0.5 mt-0.5">
                        <IndianRupee className="h-3 w-3 text-teal-500" />
                        <span>₹{trip.budget.toLocaleString()}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Companions</p>
                      <p className="text-xs font-bold text-teal-800 flex items-center justify-center space-x-0.5 mt-0.5">
                        <Users className="h-3 w-3 text-teal-500" />
                        <span>
                          {trip.joinedCompanionIds.length}/{trip.maxCompanions}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* ITINERARY MILESTONES */}
                  <div className="space-y-1.5" id={`itinerary-collapse-${trip.id}`}>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Planned Itinerary Route</p>
                    <ul className="space-y-1 text-xs text-gray-600 font-medium list-disc pl-4 leading-normal">
                      {trip.itinerary.map((day, idx) => (
                        <li key={idx} className="marker:text-teal-500">{day}</li>
                      ))}
                    </ul>
                  </div>

                  {/* JOIN COMPANIONS LIST VISUALIZER */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Approved Partners:</span>
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {trip.joinedCompanionIds.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">Open recruitment</span>
                        ) : (
                          trip.joinedCompanionIds.map((cid, i) => (
                            <div key={cid} className="relative inline-block h-6 w-6 rounded-full ring-2 ring-white">
                              <img 
                                src={`https://api.dicebear.com/7.x/adventurer/svg?seed=Companion${cid}`} 
                                alt="Companion Avatar" 
                                className="h-full w-full rounded-full object-cover bg-teal-50"
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* JOIN ACTION BUTTON */}
                    <div>
                      {currentUser ? (
                        isOwner ? (
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            <span className="text-[11px] font-bold text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-xl block text-center w-full sm:w-auto">
                              Your Campaign Group
                            </span>
                            {!(trip.completed || trip.createdBy?.completed) && onCompleteTrip && (
                              confirmingTripId === trip.id ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => {
                                      onCompleteTrip(trip.id);
                                      setConfirmingTripId(null);
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 animate-pulse"
                                    title="Click again to confirm completing this campaign and closing recruitment"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Confirm Close?</span>
                                  </button>
                                  <button
                                    onClick={() => setConfirmingTripId(null)}
                                    className="bg-gray-150 hover:bg-gray-200 text-gray-600 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                                    title="Cancel"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setConfirmingTripId(trip.id);
                                    setTimeout(() => {
                                      setConfirmingTripId(prev => prev === trip.id ? null : prev);
                                    }, 5000);
                                  }}
                                  className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 w-full sm:w-auto shrink-0"
                                  title="Mark this campaign recruitment as completed and close public recruitment"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Complete Campaign</span>
                                </button>
                              )
                            )}
                          </div>
                        ) : isApprovedCompanion ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-150 px-2.5 py-1.5 rounded-xl flex items-center space-x-1 shrink-0">
                              <Check className="h-3.5 w-3.5 text-green-600" />
                              <span>Approved!</span>
                            </span>

                            {/* CHAT TRIGGERS SPECIFICALLY FOR APPROVED USERS */}
                            {onNavigateTab && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => onNavigateTab("groups")}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg transition shrink-0 cursor-pointer flex items-center space-x-0.5"
                                  title="Group secure chat room"
                                >
                                  <Users className="h-3 w-3" />
                                  <span>Group Chat</span>
                                </button>
                                <button
                                  onClick={() => {
                                    if (onOpenDM) {
                                      onOpenDM(trip.createdById);
                                    } else if (onNavigateTab) {
                                      onNavigateTab("chats");
                                    }
                                  }}
                                  className="bg-teal-750 bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg transition shrink-0 cursor-pointer flex items-center space-x-0.5"
                                  title="Private companion DM"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                  <span>DM Owner</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : isPendingCompanion ? (
                          <span className="text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-xl block animate-pulse">
                            Pending Approval
                          </span>
                        ) : isFull ? (
                          <button
                            disabled
                            className="bg-gray-200 text-gray-400 text-xs font-bold px-4 py-2 rounded-xl cursor-not-allowed"
                          >
                            Campaign status: Full
                          </button>
                        ) : (
                          <button
                            onClick={() => onRequestJoin(trip.id)}
                            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
                          >
                            Request to Join Companion Group
                          </button>
                        )
                      ) : (
                        <p className="text-[10px] font-semibold text-gray-400 italic">Log in to apply</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* LIKE & COMMENT ACTIONS BAR */}
                <div className="px-5 py-3 border-t border-b border-gray-50 flex items-center justify-between text-gray-500 text-sm">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => onLikeTrip(trip.id)}
                      className={`flex items-center space-x-1 hover:text-red-500 transition ${
                        isLiked ? "text-red-500 font-bold" : ""
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500" : ""}`} />
                      <span>{trip.likes.length}</span>
                    </button>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <MessageSquare className="h-5 w-5" />
                      <span>{trip.comments.length}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => onSaveTrip(trip.id)}
                    className={`hover:text-amber-500 transition ${
                      isSaved ? "text-amber-500 font-bold" : ""
                    }`}
                  >
                    <Bookmark className={`h-5 w-5 ${isSaved ? "fill-amber-500" : ""}`} />
                  </button>
                </div>

                {/* COMMENTS INLINE SECTION */}
                <div className="px-5 py-4 bg-gray-50/30 space-y-3" id={`comments-section-${trip.id}`}>
                  {trip.comments.length > 0 && (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {trip.comments.map((comm) => (
                        <div key={comm.id} className="text-xs leading-normal flex items-start justify-between bg-white/80 p-2 rounded-xl border border-gray-50 shadow-xs">
                          <div>
                            <span className="font-bold text-gray-800 mr-1.5">{comm.userName}:</span>
                            <span className="text-gray-600 font-medium font-sans">{comm.text}</span>
                          </div>
                          <button
                            onClick={() => setReportingItem({ id: comm.id, type: "comment", preview: comm.text })}
                            className="text-[10px] text-gray-400 hover:text-red-500 font-semibold p-0.5 transition shrink-0"
                            title="Report Comment"
                          >
                            Report
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* COMMENTS BOX INPUT */}
                  {currentUser ? (
                    <form onSubmit={(e) => handleCommentSubmit(e, trip.id)} className="flex items-center space-x-2">
                      <input 
                        type="text" 
                        placeholder="Say something friendly to this companion..."
                        value={commentInputs[trip.id] || ""}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [trip.id]: e.target.value }))}
                        className="flex-1 bg-white border border-gray-200 text-xs px-3.5 py-2.5 rounded-xl placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                        id={`comment-input-${trip.id}`}
                      />
                      <button 
                        type="submit"
                        className="bg-teal-50 p-2.5 text-teal-600 hover:bg-teal-100 hover:text-teal-700 rounded-xl transition shrink-0 border border-teal-100/30"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  ) : (
                    <p className="text-[11px] text-gray-400 font-medium italic text-center py-1 font-sans">Please select an Active Persona above to send messages or likes.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REPORT REASON DIALOG MODAL */}
      {reportingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="report-modal">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100">
            <div className="text-center space-y-1">
              <BadgeAlert className="h-10 w-10 text-red-500 mx-auto" />
              <h3 className="font-sans font-extrabold text-gray-950 text-base">Flag Content for Moderation</h3>
              <p className="text-xs text-gray-400">Our trust & safety team reviews reported elements immediately.</p>
            </div>

            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs">
              <span className="font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Reported item ({reportingItem.type}):</span>
              <p className="text-gray-800 font-medium italic">"{reportingItem.preview}"</p>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-gray-400 font-bold uppercase">Reason for flag</label>
              <textarea
                placeholder="Spam, harassment, unsafe lodging details, unsafe parameters, etc..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-gray-50 text-xs border border-gray-200 rounded-xl p-2.5 h-20 placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
                id="report-reason-box"
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setReportingItem(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-650 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReport}
                disabled={!reportReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                id="submit-report-btn"
              >
                Report Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
