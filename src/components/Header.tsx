import React from "react";
import { User, Trip, Notification } from "../types";
import { Compass, ShieldCheck, Mail, Bell, Settings2, LogIn, Users, LogOut } from "lucide-react";
import TravelBagLogo from "./TravelBagLogo";

interface HeaderProps {
  currentUser: User | null;
  usersList: User[];
  onSwitchUser: (userId: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount: number;
  onLogout: () => void;
  tripsList?: Trip[];
  notificationsList?: Notification[];
  onResolveAlert?: (notifId: string, resolve: boolean) => void;
  onApproveRequest?: (tripId: string, companionId: string, approved: boolean, id: string) => void;
  processingNotifs?: Record<string, "approve" | "deny" | null>;
}

export default function Header({
  currentUser,
  usersList,
  onSwitchUser,
  activeTab,
  setActiveTab,
  unreadCount,
  onLogout,
  tripsList = [],
  notificationsList = [],
  onResolveAlert,
  onApproveRequest,
  processingNotifs = {}
}: HeaderProps) {
  const [isOpenNotif, setIsOpenNotif] = React.useState(false);

  React.useEffect(() => {
    setIsOpenNotif(false);
  }, [activeTab, currentUser?.id]);
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm" id="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* LOGO */}
        <div 
          className="cursor-pointer"
          onClick={() => setActiveTab("discover")}
          id="logo-section"
        >
          <TravelBagLogo size="sm" />
        </div>

        {/* TABS NAVIGATION */}
        <nav className="hidden md:flex items-center space-x-1" id="desktop-nav">
          <button
            onClick={() => setActiveTab("discover")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === "discover" 
                ? "bg-teal-50 text-teal-700 font-semibold" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Discover Trips
          </button>
          <button
            onClick={() => setActiveTab("feed")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === "feed" 
                ? "bg-teal-50 text-teal-700 font-semibold" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Social Feed
          </button>
          {currentUser && (() => {
            const isApprovedInAnyTrip = tripsList.some(t => 
              t.createdById === currentUser.id || 
              t.joinedCompanionIds?.includes(currentUser.id)
            );
            return (
              <>
                {isApprovedInAnyTrip && (
                  <button
                    onClick={() => setActiveTab("groups")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition relative ${
                      activeTab === "groups" 
                        ? "bg-teal-50 text-teal-700 font-semibold" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Travel Groups
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("chats")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition relative ${
                    activeTab === "chats" 
                      ? "bg-teal-50 text-teal-700 font-semibold" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Direct Messages
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-orange-500 text-white font-sans text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </>
            );
          })()}
          {currentUser?.role === "admin" && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center space-x-1 ${
                activeTab === "admin" 
                  ? "bg-orange-50 text-orange-700" 
                  : "text-orange-600 hover:bg-orange-50/50"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Desk</span>
            </button>
          )}
        </nav>

        {/* PROFILE SELECTOR & USER ACTIONS */}
        <div className="flex items-center space-x-3" id="header-actions">
          {/* NOTIFICATION BELL WITH DROPDOWN */}
          {currentUser && (
            <div className="relative font-sans" id="header-notif-container">
              <button
                onClick={() => setIsOpenNotif(!isOpenNotif)}
                className={`p-2 rounded-xl border flex items-center justify-center relative cursor-pointer transition-all duration-200 ${
                  isOpenNotif 
                    ? "bg-teal-50 border-teal-200 text-teal-700 ring-2 ring-teal-100" 
                    : "text-gray-500 bg-white border-gray-200 hover:text-gray-900 hover:bg-gray-50"
                }`}
                title="Notifications Desk"
                id="header-notif-bell-btn"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white font-sans text-[10px] font-semibold h-4.5 w-4.5 rounded-full flex items-center justify-center animate-pulse border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isOpenNotif && (
                <div 
                  className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white border border-gray-150 rounded-2xl shadow-xl z-50 overflow-hidden text-xs divide-y divide-gray-100 animate-fade-in" 
                  id="header-notif-dropdown"
                >
                  <div className="p-3 bg-teal-50/20 flex items-center justify-between">
                    <span className="font-extrabold text-teal-950 uppercase tracking-wider text-[10px]">Notifications Inbox</span>
                    {onResolveAlert && notificationsList && notificationsList.some(n => !n.read) && (
                      <button
                        onClick={async () => {
                          const unreads = notificationsList.filter(n => !n.read);
                          for (const un of unreads) {
                            await onResolveAlert(un.id, true);
                          }
                          setIsOpenNotif(false);
                        }}
                        className="text-[10px] text-teal-700 hover:underline font-extrabold pr-1"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50" id="header-notif-scroll-list">
                    {notificationsList && notificationsList.length > 0 ? (
                      [...notificationsList]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((notif) => (
                          <div 
                            key={notif.id} 
                            className={`p-3.5 transition-all text-xs space-y-2 ${notif.read ? "bg-white opacity-70" : "bg-teal-50/25"}`}
                            id={`header-notif-item-${notif.id}`}
                          >
                            <div className="flex justify-between items-start gap-2.5">
                              <div className="space-y-0.5">
                                <p className="font-extrabold text-gray-900 leading-snug">{notif.title}</p>
                                <p className="text-gray-600 font-medium leading-relaxed text-[11px]">{notif.message}</p>
                                <p className="text-[9px] font-mono text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleTimeString()} • {new Date(notif.createdAt).toLocaleDateString()}</p>
                              </div>
                              
                              {onResolveAlert && !notif.read && (
                                <button
                                  onClick={() => onResolveAlert(notif.id, true)}
                                  className="text-[10px] text-gray-400 hover:text-teal-700 font-bold shrink-0 hover:underline"
                                >
                                  Dismiss
                                </button>
                              )}
                            </div>

                            {/* Companion Join Request actions inside dropdown list */}
                            {notif.type === "request" && notif.data?.tripId && notif.data?.requestedById && onApproveRequest && (
                              (() => {
                                const currentStatus = processingNotifs ? processingNotifs[notif.id] : null;
                                const isAnyProcessing = !!currentStatus;
                                
                                return (
                                  <div className="flex space-x-2 pt-1 items-center">
                                    <button
                                      disabled={isAnyProcessing}
                                      onClick={() => onApproveRequest(notif.data!.tripId!, notif.data!.requestedById!, false, notif.id)}
                                      className={`px-3 py-1 text-[10px] font-extrabold tracking-tight transition rounded-xl border h-7 cursor-pointer ${
                                        currentStatus === "deny"
                                          ? "bg-red-50 border-red-200 text-red-500"
                                          : isAnyProcessing
                                          ? "bg-gray-100 border-gray-100 text-gray-300"
                                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                                      }`}
                                    >
                                      Deny
                                    </button>
                                    <button
                                      disabled={isAnyProcessing}
                                      onClick={() => onApproveRequest(notif.data!.tripId!, notif.data!.requestedById!, true, notif.id)}
                                      className={`px-3 py-1 text-[10px] font-extrabold tracking-tight transition rounded-xl h-7 cursor-pointer ${
                                        currentStatus === "approve"
                                          ? "bg-teal-600 text-white border border-teal-600"
                                          : isAnyProcessing
                                          ? "bg-teal-700/50 text-white/50"
                                          : "bg-teal-700 text-white hover:bg-teal-800"
                                      }`}
                                    >
                                      Approve
                                    </button>
                                  </div>
                                );
                              })()
                            )}
                          </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 italic">
                        No notification history.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentUser && (
            <button
              onClick={() => setActiveTab("profile")}
              className={`hidden sm:flex items-center space-x-2 text-left p-1.5 rounded-xl border border-gray-100 hover:border-teal-200 transition bg-gray-50/50 ${
                activeTab === "profile" ? "ring-2 ring-teal-500" : ""
              }`}
              id="header-profile-button"
            >
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="h-8 w-8 rounded-full border border-teal-500/30 object-cover bg-white animate-fade-in"
              />
              <div className="pr-1">
                <p className="text-xs font-semibold text-gray-800 leading-none flex items-center space-x-0.5">
                  <span>{currentUser.name}</span>
                  {currentUser.verified && <ShieldCheck className="h-3 w-3 text-teal-600 fill-teal-100 inline" />}
                </p>
                <p className="text-[9px] text-teal-600 font-semibold">Trust Score: {currentUser.trustScore}%</p>
              </div>
            </button>
          )}

          {currentUser && (
            <button
              onClick={onLogout}
              className="p-1 px-2 border border-gray-200 rounded-xl text-gray-500 hover:text-orange-650 hover:bg-orange-50 hover:border-orange-200 flex items-center space-x-1 transition cursor-pointer text-xs font-semibold"
              title="Sign Out to Login Portal"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 grid grid-cols-5 h-16 z-50 shadow-2xl" id="mobile-nav">
        <button
          onClick={() => setActiveTab("discover")}
          className={`flex flex-col items-center justify-center text-xs space-y-1 ${
            activeTab === "discover" ? "text-teal-700 font-semibold" : "text-gray-500"
          }`}
          id="m-nav-discover"
        >
          <Compass className="h-5 w-5" />
          <span>Search</span>
        </button>
        <button
          onClick={() => setActiveTab("feed")}
          className={`flex flex-col items-center justify-center text-xs space-y-1 ${
            activeTab === "feed" ? "text-teal-700 font-semibold" : "text-gray-500"
          }`}
          id="m-nav-feed"
        >
          <Users className="h-5 w-5" />
          <span>Feed</span>
        </button>
        {currentUser && tripsList.some(t => 
          t.createdById === currentUser.id || 
          t.joinedCompanionIds?.includes(currentUser.id)
        ) && (
          <button
            onClick={() => setActiveTab("groups")}
            className={`flex flex-col items-center justify-center text-xs space-y-1 ${
              activeTab === "groups" ? "text-teal-700 font-semibold" : "text-gray-500"
            }`}
            id="m-nav-groups"
          >
            <Users className="h-5 w-5 text-indigo-500" />
            <span>Groups</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex flex-col items-center justify-center text-xs space-y-1 relative ${
            activeTab === "chats" ? "text-teal-700 font-semibold" : "text-gray-500"
          }`}
          id="m-nav-chats"
        >
          <Mail className="h-5 w-5" />
          <span>Chat</span>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-4 bg-orange-500 text-white font-sans text-[9px] font-bold h-4.5 w-4.5 rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center justify-center text-xs space-y-1 ${
            activeTab === "profile" ? "text-teal-700 font-semibold" : "text-gray-500"
          }`}
          id="m-nav-profile"
        >
          {currentUser ? (
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className={`h-5.5 w-5.5 rounded-full border border-gray-300 object-cover ${
                activeTab === "profile" ? "ring-2 ring-teal-600" : ""
              }`}
            />
          ) : (
            <LogIn className="h-5 w-5" />
          )}
          <span>Me</span>
        </button>
      </div>
    </header>
  );
}
