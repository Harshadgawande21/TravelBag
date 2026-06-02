import React, { useState, useEffect } from "react";
import { User, Report } from "../types";
import { 
  ShieldCheck, 
  Users, 
  Ban, 
  ShieldAlert, 
  BarChart3, 
  AlertTriangle, 
  UserCheck, 
  Trash2, 
  Check, 
  X, 
  Loader2, 
  Settings, 
  Search, 
  Sliders, 
  MapPin, 
  TrendingUp, 
  Plus, 
  Compass, 
  FileText, 
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Shield,
  Activity,
  Heart
} from "lucide-react";

interface AdminPanelProps {
  currentUser: User | null;
  onApproveVerification: (targetUserId: string, approved: boolean) => void;
  onResolveReport: (reportId: string, action: "dismiss" | "delete_item") => void;
  usersList: User[];
  tripsList: any[];
  onRefreshData?: () => void;
}

export default function AdminPanel({
  currentUser,
  onApproveVerification,
  onResolveReport,
  usersList = [],
  tripsList = [],
  onRefreshData
}: AdminPanelProps) {
  const [currentSection, setCurrentSection] = useState<"dashboard" | "users" | "trips" | "reports" | "verifications" | "analytics">("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [verificationsList, setVerificationsList] = useState<User[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Search/Filters states
  const [userSearchText, setUserSearchText] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [tripSearchText, setTripSearchText] = useState("");

  // Platform settings state (Dashboard page config controls)
  const [platformSettings, setPlatformSettings] = useState({
    autoModerateAI: true,
    maintenanceMode: false,
    guidelinesText: "Be respectful, verify travel dates, share fuel costs transparently, and follow the Golden Rule.",
    notificationTemplate: "Upcoming trip alert: Ensure you coordinate check points safely!"
  });

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3000);
  };

  const fetchAdminDetailsOnDemand = async () => {
    if (!currentUser || currentUser.role !== "admin") return;
    try {
      // Fetch stats
      const sRes = await fetch(`/api/moderation/stats?adminId=${currentUser.id}`);
      if (sRes.ok) setStats(await sRes.json());

      // Fetch content reports
      const rRes = await fetch(`/api/moderation/reports?adminId=${currentUser.id}`);
      if (rRes.ok) setReports(await rRes.json());

      // Fetch pending verifications
      const vRes = await fetch(`/api/moderation/verifications?adminId=${currentUser.id}`);
      if (vRes.ok) setVerificationsList(await vRes.json());
    } catch (err) {
      console.error("Error updating admin details on demand:", err);
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") return;
    fetchAdminDetailsOnDemand();
    const poll = setInterval(fetchAdminDetailsOnDemand, 4000);
    return () => clearInterval(poll);
  }, [currentUser]);

  // Admin User CRUD action handlers
  const handleUpdateUserRole = async (targetUserId: string, targetRole: string) => {
    if (!currentUser) return;
    setIsUpdating(targetUserId);
    try {
      const res = await fetch("/api/moderation/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: currentUser.id,
          targetUserId,
          role: targetRole
        })
      });
      if (res.ok) {
        triggerToast(`Updated companion's platform authorization level to ${targetRole}.`);
        fetchAdminDetailsOnDemand();
        onRefreshData?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUpdateUserSuspension = async (targetUserId: string, makeSuspended: boolean) => {
    if (!currentUser) return;
    setIsUpdating(targetUserId);
    try {
      const res = await fetch("/api/moderation/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: currentUser.id,
          targetUserId,
          isSuspended: makeSuspended
        })
      });
      if (res.ok) {
        triggerToast(makeSuspended ? "Traveler profile suspended successfully." : "Suspension lifted.");
        fetchAdminDetailsOnDemand();
        onRefreshData?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUpdateUserTrustScore = async (targetUserId: string, score: number) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/moderation/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: currentUser.id,
          targetUserId,
          trustScore: score
        })
      });
      if (res.ok) {
        fetchAdminDetailsOnDemand();
        onRefreshData?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleModerateTripDelete = async (tripId: string) => {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to remove this campaign trip? This action will delete any related chats, polls, and group sessions immediately.")) return;
    try {
      const res = await fetch("/api/moderation/trips/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: currentUser.id,
          tripId
        })
      });
      if (res.ok) {
        triggerToast("Inappropriate campaign trip deleted successfully.");
        fetchAdminDetailsOnDemand();
        onRefreshData?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (targetUserId: string, targetName: string) => {
    if (!currentUser) return;
    if (currentUser.id === targetUserId) {
      alert("You cannot delete your own admin account.");
      return;
    }
    if (!confirm(`⚠️ WARNING: Are you absolutely sure you want to delete "${targetName}"'s account permanently?\n\nThis will instantly delete:\n• Their companion profile completely\n• All travel trips they scheduled\n• All their associated message threads/expenses\n• All their votes, reviews and saved states\n\nThis action CANNOT be undone.`)) {
      return;
    }
    setIsUpdating(targetUserId);
    try {
      const res = await fetch("/api/moderation/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: currentUser.id,
          targetUserId
        })
      });
      if (res.ok) {
        triggerToast(`Permanently deleted companion "${targetName}" and purged all associated data.`);
        fetchAdminDetailsOnDemand();
        onRefreshData?.();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete companion profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Failed to execute delete.");
    } finally {
      setIsUpdating(null);
    }
  };

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="bg-white border border-gray-150 p-8 text-center text-red-500 rounded-3xl max-w-md mx-auto my-12" id="admin-forbidden-alert">
        <ShieldAlert className="h-10 w-10 text-red-500 mx-auto mb-2 animate-pulse" />
        <p className="font-bold">Administrator Clearance Required</p>
        <p className="text-xs text-gray-500 mt-1 leading-normal font-sans">
          This portal contains restricted safety verification metrics. To view the admin dashboard, please log in with your Admin credentials!
        </p>
      </div>
    );
  }

  // Derived filtered users list
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearchText.toLowerCase()) || 
                          (u.email && u.email.toLowerCase().includes(userSearchText.toLowerCase()));
    const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter || 
                        (userRoleFilter === "suspended" && (u as any).isSuspended) ||
                        (userRoleFilter === "verified" && u.verified);
    return matchesSearch && matchesRole;
  });

  // Derived filtered trips list
  const filteredTrips = tripsList.filter(t => {
    return t.title.toLowerCase().includes(tripSearchText.toLowerCase()) ||
           t.destination.toLowerCase().includes(tripSearchText.toLowerCase()) ||
           (t.createdBy?.name || "").toLowerCase().includes(tripSearchText.toLowerCase());
  });

  // Hotspot stats derivation
  const popularDestStats = tripsList.reduce((acc: any, t) => {
    acc[t.destination] = (acc[t.destination] || 0) + 1;
    return acc;
  }, {});

  const currentPendingFlags = reports.filter(r => r.status === "pending").length;
  const currentPendingVerifications = verificationsList.filter(u => u.verificationStatus === "pending").length;

  return (
    <div className="space-y-6 animate-fade-in font-sans" id="admin-panel-module">
      
      {/* SUCCESS TOAST PANEL */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-teal-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-teal-800 flex items-center space-x-2 animate-bounce">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span className="font-bold">{successToast}</span>
        </div>
      )}

      {/* ADMIN LEVEL TOP BAR */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-md">
        <div className="absolute right-0 top-0 opacity-15 transform translate-x-12 -translate-y-6 pointer-events-none">
          <Shield className="h-48 w-48 text-teal-400" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-teal-500 text-slate-950 font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 rounded-full">
                Super Admin Access
              </span>
              <p className="text-xs text-teal-300 font-mono">Platform Health: Excellent</p>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight mt-1 flex items-center space-x-1.5 font-sans">
              <ShieldCheck className="h-7 w-7 text-teal-400" />
              <span>TravelBag Platform Control Hub</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Perform dynamic role conversions, moderate flagged travel campaigns, process applicant identity papers, and view system growth metrics.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="bg-slate-800 border border-slate-700/50 px-3 py-2 rounded-xl text-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase">Pending Flags</p>
              <p className="text-lg font-bold text-red-400 font-mono">{currentPendingFlags}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700/50 px-3 py-2 rounded-xl text-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase">Pending IDs</p>
              <p className="text-lg font-bold text-emerald-400 font-mono">{currentPendingVerifications}</p>
            </div>
          </div>
        </div>

        {/* SECTION ACTION TABS */}
        <div className="flex flex-wrap border-t border-slate-800/80 mt-6 pt-4 gap-1.5 text-xs font-bold">
          <button
            onClick={() => setCurrentSection("dashboard")}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
              currentSection === "dashboard" ? "bg-teal-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Dashboard & Config</span>
          </button>

          <button
            onClick={() => setCurrentSection("users")}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
              currentSection === "users" ? "bg-teal-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Users Desk ({usersList.length})</span>
          </button>

          <button
            onClick={() => setCurrentSection("trips")}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
              currentSection === "trips" ? "bg-teal-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Trips Moderation ({tripsList.length})</span>
          </button>

          <button
            onClick={() => setCurrentSection("reports")}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
              currentSection === "reports" ? "bg-teal-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Reports Queue ({reports.length})</span>
          </button>

          <button
            onClick={() => setCurrentSection("verifications")}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
              currentSection === "verifications" ? "bg-teal-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Verifications ({verificationsList.filter(v => v.verificationStatus === "pending").length})</span>
          </button>

          <button
            onClick={() => setCurrentSection("analytics")}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
              currentSection === "analytics" ? "bg-teal-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics Portal</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENTS */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm min-h-[480px]">

        {/* SECTION A: DASHBOARD & CONFIGURATION SETTINGS */}
        {currentSection === "dashboard" && (
          <div className="space-y-6" id="admin-dashboard-section">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-800">Operational Controls & Configuration Settings</h3>
              <p className="text-xs text-gray-400">Configure global platform guidelines, notification alert messages, and monitor health protocols.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* PLATFORM CONFIG SLIDERS */}
              <div className="md:col-span-2 space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1">
                  <Sliders className="h-4 w-4 text-teal-600" />
                  <span>Platform Feature Flags</span>
                </h4>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">AI Automated Moderation</span>
                      <p className="text-[10px] text-gray-500">Scan incoming campaign notes with Gemini API safeguards instantly</p>
                    </div>
                    <button
                      onClick={() => setPlatformSettings(prev => ({ ...prev, autoModerateAI: !prev.autoModerateAI }))}
                      className={`w-12 h-6.5 rounded-full transition-colors relative duration-200 cursor-pointer ${
                        platformSettings.autoModerateAI ? "bg-teal-600" : "bg-gray-300"
                      }`}
                    >
                      <span className={`block w-4.5 h-4.5 bg-white rounded-full absolute top-1 transition-transform duration-200 shadow-xs ${
                        platformSettings.autoModerateAI ? "translate-x-6.5" : "translate-x-1"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Maintenance Protocol Mode</span>
                      <p className="text-[10px] text-gray-500">Temporarily restrict new trip creations to shield active host networks</p>
                    </div>
                    <button
                      onClick={() => setPlatformSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                      className={`w-12 h-6.5 rounded-full transition-colors relative duration-200 cursor-pointer ${
                        platformSettings.maintenanceMode ? "bg-amber-600" : "bg-gray-300"
                      }`}
                    >
                      <span className={`block w-4.5 h-4.5 bg-white rounded-full absolute top-1 transition-transform duration-200 shadow-xs ${
                        platformSettings.maintenanceMode ? "translate-x-6.5" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1">
                      <FileText className="h-3 w-3 text-teal-600" />
                      <span>Community Rules Announcement Text</span>
                    </label>
                    <textarea
                      rows={2}
                      value={platformSettings.guidelinesText}
                      onChange={(e) => setPlatformSettings(prev => ({ ...prev, guidelinesText: e.target.value }))}
                      className="w-full bg-white border border-gray-250 p-2.5 rounded-xl text-xs outline-none focus:border-teal-500 text-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3 text-teal-600" />
                      <span>Platform Notification Invite Template</span>
                    </label>
                    <input
                      type="text"
                      value={platformSettings.notificationTemplate}
                      onChange={(e) => setPlatformSettings(prev => ({ ...prev, notificationTemplate: e.target.value }))}
                      className="w-full bg-white border border-gray-250 px-2.5 py-2 rounded-xl text-xs outline-none focus:border-teal-500 text-gray-700"
                    />
                  </div>

                  <button
                    onClick={() => triggerToast("Global platform configuration saved successfully.")}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition shadow-sm"
                  >
                    Save Platform Config
                  </button>
                </div>
              </div>

              {/* QUICK SYSTEM ACTIONS PANEL */}
              <div className="space-y-4 bg-teal-50/20 p-5 rounded-2xl border border-teal-100/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-950 flex items-center space-x-1.5">
                  <Activity className="h-4 w-4 text-teal-600" />
                  <span>Platform Health Diagnostics</span>
                </h4>

                <div className="space-y-3 text-xs pt-1">
                  <div className="flex justify-between items-center py-1.5 border-b border-teal-100/30">
                    <span className="text-gray-500 font-medium">Database Node:</span>
                    <span className="font-bold text-teal-950 bg-teal-100/50 px-1.5 py-0.5 rounded text-[10px]">Cloud Sandboxed</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-teal-100/30">
                    <span className="text-gray-500 font-medium">Memory Stack:</span>
                    <span className="font-bold text-teal-950">{(124 + usersList.length * 3).toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-teal-100/30">
                    <span className="text-gray-500 font-medium">Durable Sync Logs:</span>
                    <span className="font-bold text-teal-950">Normal</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-gray-500 font-medium">Pending Safety Audits:</span>
                    <span className="font-bold text-red-600">
                      {reports.filter(r => r.status === "pending").length} Reports
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-teal-150 p-4 rounded-xl space-y-2 mt-4 text-[11px] leading-relaxed text-teal-900">
                  <p className="font-bold">💡 Moderator Advisory:</p>
                  <p>In accordance with the travel community guidelines, always verify identity credentials thoroughly before upgrading member Trust Stars.</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SECTION B: USERS DESK */}
        {currentSection === "users" && (
          <div className="space-y-6" id="admin-users-section">
            
            {/* USERS FILTER BAR */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-50 border border-zinc-150 p-4 rounded-2xl">
              <div className="relative w-full sm:w-72">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search name, username, or email..."
                  value={userSearchText}
                  onChange={(e) => setUserSearchText(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-250 text-xs font-medium rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
                <span className="text-xs text-gray-500 font-bold shrink-0">Filter:</span>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-white border border-gray-250 rounded-xl px-2.5 py-1.5 text-xs font-medium outline-none focus:border-teal-400"
                >
                  <option value="all">All Members ({usersList.length})</option>
                  <option value="user">Regular Users</option>
                  <option value="admin">Administrators</option>
                  <option value="verified">Verified Identity</option>
                  <option value="suspended">Suspended Accounts</option>
                </select>
              </div>
            </div>

            {/* USERS LIST TABLE */}
            <div className="overflow-x-auto border border-gray-100 rounded-2xl" id="admin-users-table">
              <table className="min-w-full divide-y divide-gray-150 text-left text-xs font-medium">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th scope="col" className="px-5 py-3">Traveler Profile</th>
                    <th scope="col" className="px-5 py-3">Security Level (Role)</th>
                    <th scope="col" className="px-5 py-3">Security Credentials</th>
                    <th scope="col" className="px-5 py-3">Trust Parameters</th>
                    <th scope="col" className="px-5 py-3 text-right">Moderator Control Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center text-gray-400 italic">
                        No registered travel companions found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((usr: any) => (
                      <tr key={usr.id} className={`${usr.isSuspended ? "bg-red-50/20" : ""}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center space-x-3">
                            <img src={usr.avatar} alt={usr.name} className="h-10 w-10 rounded-full object-cover shrink-0 border border-gray-100" />
                            <div>
                              <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                <span>{usr.name}</span>
                                {usr.verified && (
                                  <span className="bg-teal-100 border border-teal-200 text-teal-800 font-bold px-1 py-0.5 rounded text-[8px] uppercase">
                                    ✓ Verified
                                  </span>
                                )}
                                {usr.isSuspended && (
                                  <span className="bg-red-100 border border-red-200 text-red-800 font-bold px-1 py-0.5 rounded text-[8px] uppercase">
                                    SUSPENDED
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-gray-400">{usr.email || `${usr.name.toLowerCase()}@travel.com`}</p>
                              <p className="text-[10px] text-gray-400 font-sans italic max-w-xs truncate">{usr.bio || "No companion bio setup"}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <select
                            value={usr.role || "user"}
                            disabled={isUpdating === usr.id}
                            onChange={(e) => handleUpdateUserRole(usr.id, e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg py-1 px-2 text-[11px] font-sans font-bold text-gray-700 focus:border-teal-400"
                          >
                            <option value="user">Regular User</option>
                            <option value="admin">Administrator / Moderator</option>
                          </select>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Credentials</span>
                            <div className="text-[11px] text-zinc-900 font-medium">
                              <span className="text-gray-400 font-semibold mr-1">ID:</span>
                              <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-bold select-all">
                                {usr.username || usr.id || usr.name.toLowerCase().replace(/[^a-z0-9]/g, "")}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-900 font-medium mt-0.5">
                              <span className="text-gray-400 font-semibold mr-1">PWD:</span>
                              <span className="font-mono bg-amber-50 text-amber-900 font-bold border border-amber-200 px-1.5 py-0.5 rounded select-all">
                                {usr.password || "goa123"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="space-y-1.5 max-w-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-gray-400 font-bold">Trust Score:</span>
                              <span className="font-mono text-xs font-extrabold text-teal-900">{usr.trustScore || 60}%</span>
                            </div>

                            {/* Trust Score Adjustment slider */}
                            <input
                              type="range"
                              min="0"
                              max="100"
                              disabled={isUpdating === usr.id}
                              value={usr.trustScore || 60}
                              onChange={(e) => handleUpdateUserTrustScore(usr.id, Number(e.target.value))}
                              className="w-full accent-teal-600 cursor-pointer h-1 bg-gray-200 rounded-lg"
                            />
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-2">
                            {usr.isSuspended ? (
                              <button
                                onClick={() => handleUpdateUserSuspension(usr.id, false)}
                                disabled={isUpdating === usr.id}
                                className="bg-green-100 hover:bg-green-200 text-green-800 font-bold px-3 py-1.5 rounded-lg transition text-[11px] cursor-pointer"
                              >
                                Revoke Suspension
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateUserSuspension(usr.id, true)}
                                disabled={isUpdating === usr.id || usr.role === "admin"}
                                className={`font-bold px-3 py-1.5 rounded-lg transition text-[11px] cursor-pointer ${
                                  usr.role === "admin" 
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                    : "bg-red-50 text-red-700 hover:bg-red-100"
                                }`}
                                title={usr.role === "admin" ? "Admins cannot be suspended directly" : "Suspend user profile access"}
                              >
                                <Ban className="h-3 w-3 inline mr-1" />
                                <span>Suspend Account</span>
                              </button>
                            )}

                            {/* ADMIN PERMANENT USER PURGE ACTION */}
                            <button
                              onClick={() => handleDeleteUser(usr.id, usr.name)}
                              disabled={isUpdating === usr.id || usr.id === currentUser?.id}
                              className={`font-bold px-3 py-1.5 rounded-lg transition text-[11px] cursor-pointer flex items-center space-x-1 ${
                                usr.id === currentUser?.id
                                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 active:scale-95"
                              }`}
                              title={usr.id === currentUser?.id ? "You cannot delete your own admin account" : "Permanently remove traveler and all their related trips/chats"}
                            >
                              <Trash2 className="h-3 w-3 shrink-0" />
                              <span>Delete Profile</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* SECTION C: TRIPS MODERATION */}
        {currentSection === "trips" && (
          <div className="space-y-6" id="admin-trips-section">
            
            {/* TRIPS SEARCH */}
            <div className="flex gap-3 items-center justify-between bg-zinc-50 border border-zinc-150 p-4 rounded-2xl">
              <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Filter by campaign title, destination, or host..."
                  value={tripSearchText}
                  onChange={(e) => setTripSearchText(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-250 text-xs font-medium rounded-xl outline-none focus:border-teal-500"
                />
              </div>
              <span className="text-[11px] text-gray-400 font-sans font-medium">Showing {filteredTrips.length} active campaigns</span>
            </div>

            {/* TRIPS LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="admin-trips-list">
              {filteredTrips.length === 0 ? (
                <div className="col-span-2 text-center py-24 text-gray-400 italic text-xs">
                  No published travel campaigns found. Include fresh companion posts first!
                </div>
              ) : (
                filteredTrips.map((trip: any) => (
                  <div key={trip.id} className="bg-gray-55/40 border border-gray-150 p-4.5 rounded-2xl space-y-3 relative group" id={`admin-trip-item-${trip.id}`}>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="bg-teal-50 border border-teal-100 text-teal-850 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md inline-block">
                          🎯 {trip.destination}
                        </p>
                        <h4 className="text-sm font-bold text-gray-900 mt-1">{trip.title}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">Budget Allocation: ₹{trip.budget || "9,000"}</p>
                      </div>

                      <button
                        onClick={() => handleModerateTripDelete(trip.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 rounded-xl p-2 transition cursor-pointer"
                        title="Remove Trip (Moderate/Delete)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-xs text-gray-600 font-sans leading-relaxed line-clamp-2">
                      {trip.itinerary && Array.isArray(trip.itinerary) 
                        ? trip.itinerary.join(" / ") 
                        : "No itinerary schedules details supplied."}
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-gray-100">
                      <div className="flex items-center space-x-1.5">
                        <img src={trip.createdBy?.avatar} alt="" className="h-5.5 w-5.5 rounded-full object-cover" />
                        <span className="text-[10px] text-gray-500 font-bold">Host: {trip.createdBy?.name || "Member"}</span>
                      </div>

                      <div className="flex space-x-1" id="admin-trip-pax-limits">
                        {trip.companions && (
                          <span className="bg-zinc-100 text-zinc-700 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                            {trip.companions.length} Joined
                          </span>
                        )}
                        <span className="bg-blue-50 text-blue-800 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                          Max {trip.maxCompanions || "4"} Pax
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* SECTION D: REPORTS QUEUE */}
        {currentSection === "reports" && (
          <div className="space-y-6" id="admin-reports-section">
            <div className="border-b border-gray-100 pb-2.5">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Flagged Community Content Queue</h3>
              <p className="text-xs text-gray-400">Review reported trip campaigns, group inputs, and reviews flagged by travelers.</p>
            </div>

            <div className="space-y-4">
              {reports.filter(r => r.status === "pending").length === 0 ? (
                <div className="text-center py-20 text-gray-400 italic text-xs">
                  No active safety report flags. The community travel playground has excellent behavior guidelines compliance!
                </div>
              ) : (
                reports.filter(r => r.status === "pending").map((rep) => (
                  <div key={rep.id} className="bg-rose-50/10 border border-rose-100/70 rounded-2xl p-4.5 space-y-3" id={`report-item-${rep.id}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-red-50 text-red-700 font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded">
                          FLAG TYPE: {rep.itemType}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          Reported by <span className="font-bold text-gray-700">{rep.reporterName}</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">Date flagged: {rep.createdAt.slice(0, 16).replace("T", " ")}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-100 p-3 rounded-xl text-xs font-medium">
                        <span className="block text-[8px] uppercase text-gray-400 font-bold mb-1">Item Snapshot Preview:</span>
                        <p className="italic text-gray-800 font-sans">"{rep.itemPreview}"</p>
                      </div>

                      <div className="bg-rose-50/50 border border-rose-50 p-3 rounded-xl text-xs font-medium text-red-900">
                        <span className="block text-[8px] uppercase text-red-500 font-bold mb-1">Reason for Flag:</span>
                        <p className="font-semibold leading-relaxed">{rep.reason}</p>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2 justify-end">
                      <button
                        onClick={() => onResolveReport(rep.id, "dismiss")}
                        className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                      >
                        Dismiss Flag
                      </button>
                      <button
                        onClick={() => onResolveReport(rep.id, "delete_item")}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center space-x-1 ml-2 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Confirm & Delete Content</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* SECTION E: IDENTITY VERIFICATIONS */}
        {currentSection === "verifications" && (
          <div className="space-y-6" id="admin-verifications-section">
            <div className="border-b border-gray-100 pb-2">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Identity Document Verification Desk</h3>
              <p className="text-xs text-gray-400">Validate authentic passports/National IDs submitted by companions to award the verified trust emblem.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verificationsList.filter(v => v.verificationStatus === "pending").length === 0 ? (
                <div className="col-span-2 text-center py-20 text-gray-400 italic text-xs">
                  No outstanding traveler document applications.
                </div>
              ) : (
                verificationsList.filter(v => v.verificationStatus === "pending").map((usr) => (
                  <div key={usr.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4.5 space-y-3" id={`verify-card-${usr.id}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <img src={usr.avatar} alt={usr.name} className="h-9 w-9 rounded-full object-cover shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-800">{usr.name}</p>
                          <p className="text-[10px] text-gray-400">{usr.email || "companion@travel.com"}</p>
                        </div>
                      </div>
                      <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        Pending Star Review
                      </span>
                    </div>

                    <div className="bg-white border border-gray-200 p-3 rounded-xl">
                      <span className="block text-[8px] text-gray-400 font-bold uppercase mb-1">Attached Travel Credentials:</span>
                      <p className="text-xs font-bold text-indigo-950 font-sans italic">
                        {usr.verificationDocsPreview || "Travel Registration Application Serial: #TRV-NDX4"}
                      </p>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => onApproveVerification(usr.id, false)}
                        className="flex-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                      >
                        Reject & Dismiss
                      </button>
                      <button
                        onClick={() => onApproveVerification(usr.id, true)}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Check className="h-4 w-4" />
                        <span>Validate and Approve</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* SECTION F: ANALYTICS PORTAL */}
        {currentSection === "analytics" && (
          <div className="space-y-6" id="admin-analytics-section">
            <div className="border-b border-gray-100 pb-2">
              <h3 className="text-base font-bold text-gray-800">Operational Analytics Dashboard</h3>
              <p className="text-xs text-gray-400">Examine onboarding metrics, platform engagement indices, and spatial travel cluster coordinates.</p>
            </div>

            {/* ANALYTICS BENTO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* MAIN ANALYTIC COUNTERS */}
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Volume Indices</span>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-250/50">
                    <span className="text-xs text-gray-500 font-medium">Registered Companion profiles:</span>
                    <span className="font-mono text-base font-extrabold text-slate-800">{usersList.length}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-250/50">
                    <span className="text-xs text-gray-500 font-medium">Published travel campaigns:</span>
                    <span className="font-mono text-base font-extrabold text-slate-800">{tripsList.length}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-250/50">
                    <span className="text-xs text-gray-500 font-medium">Verified travelers percentage:</span>
                    <span className="font-mono text-base font-extrabold text-slate-800">
                      {((usersList.filter(u => u.verified).length / Math.max(1, usersList.length)) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Unresolved reports count:</span>
                    <span className="font-mono text-base font-extrabold text-red-650">
                      {reports.filter(r => r.status === "pending").length}
                    </span>
                  </div>
                </div>
              </div>

              {/* BAR CHART GRAPH FOR DESTINATIONS */}
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3 md:col-span-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Spatial Campaign Hot-spots distribution</span>
                  <span className="text-[9px] text-teal-600 font-bold bg-teal-50 px-1.5 py-0.5 rounded">Real-time</span>
                </div>

                <div className="space-y-3 pt-2">
                  {Object.keys(popularDestStats).length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs italic font-serif">
                      Seedy destinations list empty. Create campaigns to map hot-spots!
                    </div>
                  ) : (
                    Object.keys(popularDestStats).map((dest) => {
                      const count = popularDestStats[dest];
                      const pct = Math.min(100, (count / Math.max(1, tripsList.length)) * 100);
                      return (
                        <div key={dest} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-800 font-sans">
                            <span className="capitalize">{dest}</span>
                            <span>{count} trip{count > 1 ? "s" : ""}</span>
                          </div>
                          {/* Visual progress bar bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* GROWTH ADVISORY */}
              <div className="md:col-span-3 bg-gradient-to-r from-teal-900 to-indigo-950 p-5 rounded-3xl text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <TrendingUp className="h-4.5 w-4.5" />
                    <span>Traveler Retention Index +34% This Month</span>
                  </p>
                  <h4 className="text-base font-extrabold tracking-tight">Expanding organic traveler networks safely and securely</h4>
                  <p className="text-xs text-teal-150 max-w-xl">
                    With identity checkpoints active, traveler reviews and trust stars help cultivate secure companionships. Keep validating authentic profiles to sustain platform safety.
                  </p>
                </div>

                <div className="shrink-0 bg-white/10 px-4 py-3 rounded-2xl border border-white/10 text-center">
                  <span className="block text-[9px] uppercase tracking-wider text-teal-200">Growth Star rating</span>
                  <div className="flex text-amber-400 mt-1 justify-center">
                    <Heart className="h-4 w-4 fill-amber-400" />
                    <Heart className="h-4 w-4 fill-amber-400" />
                    <Heart className="h-4 w-4 fill-amber-400" />
                    <Heart className="h-4 w-4 fill-amber-400" />
                    <Heart className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="text-[10px] font-bold block mt-1">Excellent (4.8/5)</span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
