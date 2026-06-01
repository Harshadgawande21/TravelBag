import React, { useState, useEffect } from "react";
import { User, Trip, Notification } from "./types";
import Header from "./components/Header";
import HeroSearch from "./components/HeroSearch";
import DestinationInsights from "./components/DestinationInsights";
import SocialFeed from "./components/SocialFeed";
import PrivateMessenger from "./components/PrivateMessenger";
import GroupManager from "./components/GroupManager";
import AdminPanel from "./components/AdminPanel";
import ProfileTab from "./components/ProfileTab";
import LoginPage from "./components/LoginPage";
import { Compass, ShieldCheck, Mail, Calendar, Sparkles, MapPin, Plus, ListPlus, BellRing, Settings2, Trash, CheckCircle2, AlertCircle, X } from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [tripsList, setTripsList] = useState<Trip[]>([]);
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  
  const [processingNotifs, setProcessingNotifs] = useState<Record<string, "approve" | "deny" | null>>({});
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "info" | "error" }>({
    show: false,
    message: "",
    type: "info"
  });

  const showToast = (message: string, type: "success" | "info" | "error" = "info") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      if (!message) return;
      let type: "success" | "info" | "error" = "info";
      const lowered = message.toLowerCase();
      if (
        lowered.includes("success") || 
        lowered.includes("approved") || 
        lowered.includes("published") || 
        lowered.includes("applied") || 
        lowered.includes("saved") ||
        lowered.includes("posted") ||
        lowered.includes("thank you")
      ) {
        type = "success";
      } else if (
        lowered.includes("error") || 
        lowered.includes("failed") || 
        lowered.includes("cannot") || 
        lowered.includes("forbidden") || 
        lowered.includes("denied") ||
        lowered.includes("invalid") ||
        lowered.includes("please select")
      ) {
        type = "error";
      }
      showToast(message, type);
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);
  
  const [activeTab, setActiveTab] = useState("discover");
  const [selectedDMUserId, setSelectedDMUserId] = useState<string | undefined>(undefined);
  
  const handleOpenDM = (recipientUserId: string) => {
    setSelectedDMUserId(recipientUserId);
    setActiveTab("chats");
  };

  const [searchDestination, setSearchDestination] = useState("Goa");
  const [searchFilters, setSearchFilters] = useState({
    source: "",
    destination: "",
    travelStyle: "",
    budget: ""
  });

  // Create Campaign Form modal controls
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [newStartDate, setNewStartDate] = useState("2026-07-02");
  const [newEndDate, setNewEndDate] = useState("2026-07-09");
  const [newBudget, setNewBudget] = useState("10000");
  const [newTravelStyle, setNewTravelStyle] = useState("Adventure");
  const [newItinerary, setNewItinerary] = useState<string[]>([
    "Day 1: Arrive, check in, and local explorations",
    "Day 2: Morning hike / outdoor group team-building",
    "Day 3: Sightseeing local food walks & sunset coordinate checks",
    "Day 4: Checkout, sharing fuel splitting checklists, departure"
  ]);
  const [newItineraryInput, setNewItineraryInput] = useState("");
  const [newMaxCompanions, setNewMaxCompanions] = useState("4");
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  // Load and sync database logs
  const syncDatabase = async () => {
    try {
      // Sync active trips list
      const queryParams = new URLSearchParams();
      if (searchFilters.source) queryParams.append("source", searchFilters.source);
      if (searchFilters.destination) queryParams.append("query", searchFilters.destination);
      if (searchFilters.travelStyle) queryParams.append("travelStyle", searchFilters.travelStyle);
      if (searchFilters.budget) queryParams.append("maxBudget", searchFilters.budget);
      if (currentUser) queryParams.append("userId", currentUser.id);
      queryParams.append("includeCompleted", "true");

      const tripsRes = await fetch(`/api/trips?${queryParams.toString()}`);
      if (tripsRes.ok) {
        const tList = await tripsRes.json();
        setTripsList(tList);
      }

      // Sync personal notifications
      if (currentUser) {
        const notifRes = await fetch(`/api/notifications?userId=${currentUser.id}`);
        if (notifRes.ok) {
          const nList = await notifRes.json();
          setNotificationsList(nList);
        }
      }

      // Re-fetch usersList completely to map dynamic reviews, verified, and blocklists
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const allUsers: User[] = await usersRes.json();
        setUsersList(allUsers);

        if (currentUser) {
          const found = allUsers.find(u => u.id === currentUser.id);
          if (found) {
            if (found.verified !== currentUser.verified || 
                found.trustScore !== currentUser.trustScore || 
                found.verificationStatus !== currentUser.verificationStatus || 
                found.role !== currentUser.role ||
                found.name !== currentUser.name ||
                found.avatar !== currentUser.avatar) {
              setCurrentUser(found);
            }
          }
        }
      }

    } catch (err) {
      console.error("Database alignment failed", err);
    }
  };

  const handleLogin = async (username: string, password?: string, loginType?: "user" | "admin"): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, loginType })
      });
      if (response.ok) {
        const payload = await response.json();
        setCurrentUser(payload.session.user);
        setIsLoggedOut(false);
        setActiveTab("discover");
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleRegister = async (fields: { username: string; password?: string; email?: string; reqRole?: "user" | "admin"; fullName?: string; bio?: string; travelStylePreferences?: string[]; gender?: string }): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields)
      });
      if (response.ok) {
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedOut(true);
    // Clear notifications list to avoid leak
    setNotificationsList([]);
  };

  useEffect(() => {
    syncDatabase();
    // Dynamic background replication loop matching Supabase Realtime
    const loop = setInterval(syncDatabase, 3000);
    return () => clearInterval(loop);
  }, [currentUser?.id, searchFilters]);

  const handleSwitchUser = (userId: string) => {
    const match = usersList.find(u => u.id === userId);
    if (match) {
      setCurrentUser(match);
      // Clear personal state caches
      setNotificationsList([]);
    }
  };

  const handleSearch = (filters: { source: string; destination: string; travelStyle: string; budget: string }) => {
    setSearchFilters(filters);
    if (filters.destination) {
      setSearchDestination(filters.destination);
    }
  };

  const handleUpdateProfile = async (uId: string, profileMeta: { name: string; bio: string; travelStylePreferences: string[]; dateOfBirth?: string; currentCity?: string; showDetailsToOthers?: boolean; gender?: string }) => {
    try {
      const response = await fetch("/api/auth/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: uId, ...profileMeta })
      });
      if (response.ok) {
        const payload = await response.json();
        setCurrentUser(payload.user);
        syncDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyVerification = async (uId: string, mockText: string) => {
    try {
      const response = await fetch("/api/travelers/verify-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uId, docUrl: "", mockText })
      });
      if (response.ok) {
        syncDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostReview = async (coworkerId: string, rating: number, comment: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/travelers/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerId: currentUser.id, coworkerId, rating, comment })
      });
      if (response.ok) {
        syncDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTitle.trim() || !newDestination.trim()) return;

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          source: newSource,
          destination: newDestination,
          startDate: newStartDate,
          endDate: newEndDate,
          budget: newBudget,
          travelStyle: newTravelStyle,
          itinerary: newItinerary,
          maxCompanions: newMaxCompanions,
          createdById: currentUser.id
        })
      });

      if (response.ok) {
        setShowCampaignModal(false);
        // Reset inputs
        setNewTitle("");
        setNewSource("");
        setNewDestination("");
        setNewStartDate("2026-07-02");
        setNewEndDate("2026-07-09");
        setNewBudget("10000");
        setNewTravelStyle("Adventure");
        setNewItinerary([
          "Day 1: Arrive, check in, and local explorations",
          "Day 2: Morning hike / outdoor group team-building",
          "Day 3: Sightseeing local food walks & sunset coordinate checks",
          "Day 4: Checkout, sharing fuel splitting checklists, departure"
        ]);
        setNewMaxCompanions("4");
        
        syncDatabase();
        setActiveTab("discover");
        setSearchDestination(newDestination);
        setSearchFilters(prev => ({ ...prev, destination: newDestination }));
        alert("Campaign successfully published!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItineraryItem = () => {
    if (!newItineraryInput.trim()) return;
    setNewItinerary(prev => [...prev, `Day ${prev.length + 1}: ${newItineraryInput}`]);
    setNewItineraryInput("");
  };

  const handleRemoveItineraryItem = (idx: number) => {
    setNewItinerary(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLikeTrip = async (tripId: string) => {
    if (!currentUser) {
      alert("Please select your active persona in the navbar dropdown to enable likes or interactions.");
      return;
    }
    try {
      await fetch(`/api/trips/${tripId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      syncDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTrip = async (tripId: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/trips/${tripId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      syncDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (tripId: string, commentText: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/trips/${tripId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, text: commentText })
      });
      syncDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteCampaign = async (tripId: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/trips/${tripId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (response.ok) {
        syncDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestJoinCampaign = async (tripId: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/trips/${tripId}/request-join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (response.ok) {
        syncDatabase();
        alert("Companion application submitted user-specifically to owner. They will review and approve via verification notifications.");
      } else {
        const errPayload = await response.json();
        alert(errPayload.error || "Join application error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessagePrivate = async (recipientId: string, content: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/chats/private/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: currentUser.id, recipientId, content })
      });
      if (response.ok) {
        syncDatabase();
      } else {
        const ep = await response.json();
        alert(ep.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessageGroup = async (tripId: string, content: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/chats/group/${tripId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: currentUser.id, content })
      });
      syncDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePoll = async (tripId: string, question: string, options: string[]) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/chats/group/${tripId}/poll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createdById: currentUser.id, question, options })
      });
      syncDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVotePoll = async (tripId: string, pollId: string, optionId: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/chats/group/${tripId}/poll/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, optionId })
      });
      syncDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveCompanionRequest = async (tripId: string, companyId: string, approved: boolean, notifId?: string) => {
    if (notifId) {
      setProcessingNotifs(prev => ({ ...prev, [notifId]: approved ? "approve" : "deny" }));
    }
    try {
      const response = await fetch(`/api/trips/${tripId}/approve-join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, approved })
      });
      if (response.ok) {
        // Mark notification read as well
        syncDatabase();
        alert(approved ? "Companion approved! They have been added to your Private Travel Group & live chat logs." : "Companion request denied.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (notifId) {
        setProcessingNotifs(prev => ({ ...prev, [notifId]: null }));
      }
    }
  };

  const handleResolveAlert = async (id: string, read: boolean) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      syncDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlockUserToggle = async (targetBlockUserId: string, block: boolean) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/moderation/block-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestUserId: currentUser.id, targetBlockUserId, block })
      });
      if (response.ok) {
        syncDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveVerificationAdmin = async (targetUserId: string, approved: boolean) => {
    if (!currentUser) return;
    try {
      await fetch("/api/moderation/approve-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: currentUser.id, targetUserId, approved })
      });
      syncDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveReportAdmin = async (reportId: string, action: "dismiss" | "delete_item") => {
    if (!currentUser) return;
    try {
      await fetch("/api/moderation/resolve-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: currentUser.id, reportId, action })
      });
      syncDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostReportContent = async (itemType: "trip" | "comment", itemId: string, itemPreview: string, reason: string) => {
    if (!currentUser) return;
    try {
      await fetch("/api/moderation/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reporterId: currentUser.id, itemType, itemId, itemPreview, reason })
      });
      syncDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadAlerts = notificationsList.filter(n => !n.read);

  if (!currentUser) {
    return (
      <LoginPage
        usersList={usersList}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 md:pb-6" id="app-root-visual">
      
      {/* GLOBAL BANNER NOTIFICATIONS TOAST SIMULATOR */}
      {unreadAlerts.length > 0 && (
        <div className="bg-teal-900 text-white font-sans text-xs px-4 py-2 flex items-center justify-between" id="global-alerts-badge">
          <div className="flex items-center space-x-2">
            <BellRing className="h-4.5 w-4.5 text-orange-400 animate-bounce" />
            <span className="font-semibold">You have {unreadAlerts.length} unread personal companion alerts / join requests!</span>
          </div>
          <button 
            onClick={() => {
              fetch("/api/notifications/read-all", { 
                method: "POST", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: currentUser?.id })
              }).then(() => syncDatabase());
            }} 
            className="underline text-teal-300 font-bold hover:text-white"
            id="read-all-notifications"
          >
            Mark all read
          </button>
        </div>
      )}

      {/* HEADER NAVBAR */}
      <Header 
        currentUser={currentUser} 
        usersList={usersList} 
        onSwitchUser={handleSwitchUser} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        unreadCount={unreadAlerts.length}
        onLogout={handleLogout}
        tripsList={tripsList}
        notificationsList={notificationsList}
        onResolveAlert={handleResolveAlert}
        onApproveRequest={handleApproveCompanionRequest}
        processingNotifs={processingNotifs}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="main-content-flow">
        


        {/* ROUTED VIEWS SWITCH */}

        {/* TAB A: COMPANION LOOKUP SEARCH */}
        {activeTab === "discover" && (
          <div className="space-y-8 animate-fade-in" id="discover-tab-view">
            <HeroSearch onSearch={handleSearch} activeCount={tripsList.filter(t => !t.completed && !t.createdBy?.completed).length} />

            {/* SIDE-BY-SIDE INSIGHTS + CAMPAIGNS SEARCH */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="discover-interactive-grid">
              {/* INSIGHTS */}
              <div className="lg:col-span-1" id="insights-left-column">
                <DestinationInsights destinationName={searchDestination} />
              </div>

              {/* SEARCH RESULTS FEED */}
              <div className="lg:col-span-2" id="trips-right-column">
                <SocialFeed 
                  trips={tripsList} 
                  currentUser={currentUser}
                  onLikeTrip={handleLikeTrip}
                  onSaveTrip={handleSaveTrip}
                  onAddComment={handleAddComment}
                  onRequestJoin={handleRequestJoinCampaign}
                  onReportItem={handlePostReportContent}
                  onCreateNewTripClick={() => setShowCampaignModal(true)}
                  onNavigateTab={setActiveTab}
                  onOpenDM={handleOpenDM}
                  onCompleteTrip={handleCompleteCampaign}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB B: ALL SOCIAL FEED */}
        {activeTab === "feed" && (
          <div className="max-w-2xl mx-auto" id="feed-tab-view">
            <SocialFeed 
              trips={tripsList} 
              currentUser={currentUser}
              onLikeTrip={handleLikeTrip}
              onSaveTrip={handleSaveTrip}
              onAddComment={handleAddComment}
              onRequestJoin={handleRequestJoinCampaign}
              onReportItem={handlePostReportContent}
              onCreateNewTripClick={() => setShowCampaignModal(true)}
              onNavigateTab={setActiveTab}
              onOpenDM={handleOpenDM}
              onCompleteTrip={handleCompleteCampaign}
            />
          </div>
        )}

        {/* TAB C: TRAVEL GROUPS */}
        {activeTab === "groups" && (
          <GroupManager
            currentUser={currentUser}
            trips={tripsList}
            usersList={usersList}
            onSendMessage={handleSendMessageGroup}
            onCreatePoll={handleCreatePoll}
            onVotePoll={handleVotePoll}
            onOpenDM={handleOpenDM}
          />
        )}

        {/* TAB D: DIRECT PRIVATE COMMUNICATIONS */}
        {activeTab === "chats" && (
          <PrivateMessenger
            currentUser={currentUser}
            usersList={usersList}
            onSendMessage={handleSendMessagePrivate}
            onBlockUserToggle={handleBlockUserToggle}
            preselectedRecipientId={selectedDMUserId}
            onRecipientSelected={setSelectedDMUserId}
          />
        )}

        {/* TAB E: SAFETY ADMINISTRATION */}
        {activeTab === "admin" && (
          <AdminPanel
            currentUser={currentUser}
            onApproveVerification={handleApproveVerificationAdmin}
            onResolveReport={handleResolveReportAdmin}
            usersList={usersList}
            tripsList={tripsList}
            onRefreshData={syncDatabase}
          />
        )}

        {/* TAB F: PERSONAL PROFILE DASHBOARD */}
        {activeTab === "profile" && (
          <ProfileTab
            currentUser={currentUser}
            usersList={usersList}
            onUpdateProfile={handleUpdateProfile}
            onApplyVerification={handleApplyVerification}
            onPostReview={handlePostReview}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12" id="site-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-900 tracking-tight">travel<span className="text-[#FF6B00]">bag</span></span>
            <span>© {new Date().getFullYear()} • Companion Hub & Safety Protocol.</span>
          </div>
          
          <div className="flex items-center space-x-2.5 bg-slate-50 border border-gray-100 px-4 py-2 rounded-full shadow-xs" id="creator-credit-badge">
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-ping"></span>
            <p className="font-semibold text-gray-600">
              Created with <span className="text-red-500 animate-pulse">❤️</span> by <span className="text-teal-950 font-extrabold hover:text-[#FF6B00] transition-colors">Harshad Gawande</span>
            </p>
            <div className="w-5 h-5 flex items-center justify-center text-orange-500">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current transform rotate-45 hover:translate-x-1 hover:-translate-y-1 transition-all duration-300">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
            </div>
          </div>
        </div>
      </footer>

      {/* CREATE CAMPAIGN SLIDE-OVER DRAWER MODAL */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="campaign-creator-modal">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto" id="drawer-form-box">
            
            <button 
              onClick={() => setShowCampaignModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-sm font-semibold"
            >
              ✕
            </button>

            <div>
              <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest block">TravelBag campaign creator</span>
              <h3 className="font-sans font-extrabold text-gray-900 text-lg">Recruit Travel Companions</h3>
              <p className="text-xs text-gray-400">Launch a customized campaign route and budget limits.</p>
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4 text-xs font-semibold" id="new-campaign-input-form">
              <div className="space-y-1">
                <label className="block text-[10px] text-gray-400 uppercase font-bold">Campaign title description</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Scuba Dive and Coastal Beach Yoga Trails"
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  id="campaign-title-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-bold">Leaving From</label>
                  <input 
                    type="text" 
                    required
                    placeholder="City (e.g. Pune)"
                    value={newSource} 
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-teal-600 uppercase font-bold">Going To</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Destination (e.g. Goa)"
                    value={newDestination} 
                    onChange={(e) => setNewDestination(e.target.value)}
                    className="w-full bg-gray-50 border border-teal-200 rounded-xl p-2.5 font-extrabold text-teal-950 bg-teal-50/20"
                    id="campaign-destination-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-bold">Start Date</label>
                  <input 
                    type="date" 
                    required
                    value={newStartDate} 
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-mono text-gray-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-bold">End Date</label>
                  <input 
                    type="date" 
                    required
                    value={newEndDate} 
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-mono text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="block text-[10px] text-gray-400 uppercase font-bold">Estimated Lodging contribution (₹)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="12000"
                    value={newBudget} 
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-mono text-gray-800 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-400 uppercase font-bold">Max pax limits</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    max="12"
                    value={newMaxCompanions} 
                    onChange={(e) => setNewMaxCompanions(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-mono text-gray-800 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-gray-400 uppercase font-bold">Travel style preference</label>
                <select
                  value={newTravelStyle}
                  onChange={(e) => setNewTravelStyle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 font-bold text-gray-700"
                >
                  <option value="Adventure">Adventure</option>
                  <option value="Backpacker">Backpacker</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Foodie">Foodie</option>
                  <option value="Relaxing">Relaxing</option>
                  <option value="Culture">Culture</option>
                </select>
              </div>

              {/* Dynamic day-by-day Itinerary steps builder */}
              <div className="space-y-2">
                <label className="block text-[10px] text-gray-400 uppercase font-bold">Itinerary Milestones ({newItinerary.length} days)</label>
                <div className="space-y-1 max-h-24 overflow-y-auto bg-gray-50 p-2 rounded-2xl border border-gray-150">
                  {newItinerary.map((step, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-1.5 rounded-lg border border-gray-100 text-[11px]">
                      <span>{step}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItineraryItem(idx)}
                        className="text-red-500 hover:text-red-700 font-bold p-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-1.5">
                  <input 
                    type="text" 
                    placeholder="Day activity description..."
                    value={newItineraryInput}
                    onChange={(e) => setNewItineraryInput(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-250 rounded-lg px-2.5 py-1.5"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddItineraryItem}
                    className="bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition whitespace-nowrap"
                  >
                    + Add Day
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-650 py-2.5 rounded-xl font-bold transition text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-teal-700 hover:bg-teal-800 text-white py-2.5 rounded-xl font-bold transition text-center shadow-md cursor-pointer"
                  id="submit-new-campaign"
                >
                  Publish Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GORGEOUS IN-APP CUSTOM TOAST FEEDBACK OVERLAY */}
      {toast.show && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[9999] max-w-sm"
          id="custom-toast-overlay"
        >
          <div className={`p-4 rounded-3xl shadow-xl flex items-start space-x-3 border ${
            toast.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-950 shadow-emerald-500/5" 
              : toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-950 shadow-rose-500/5"
              : "bg-blue-50 border-blue-200 text-blue-950 shadow-blue-500/5"
          }`}>
            <div className="shrink-0 pt-0.5">
              {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600 animate-pulse" />}
              {toast.type === "error" && <AlertCircle className="h-5 w-5 text-rose-600" />}
              {toast.type === "info" && <Sparkles className="h-5 w-5 text-blue-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wider text-opacity-80">
                {toast.type === "success" ? "Success" : toast.type === "error" ? "System Warning" : "Notification"}
              </p>
              <p className="text-xs font-medium mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast(prev => ({ ...prev, show: false }))}
              className="shrink-0 p-1 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5 hover:text-[#FF6B00]" />
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
}
