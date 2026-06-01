import React, { useState } from "react";
import { User } from "../types";
import { ShieldCheck, Star, Sparkles, AlertTriangle, Save, Loader2, FileCheck, Award } from "lucide-react";

interface ProfileTabProps {
  currentUser: User | null;
  usersList: User[];
  onUpdateProfile: (userId: string, data: { name: string; bio: string; travelStylePreferences: string[]; dateOfBirth?: string; currentCity?: string; showDetailsToOthers?: boolean; gender?: string }) => void;
  onApplyVerification: (userId: string, mockText: string) => void;
  onPostReview: (coworkerId: string, rating: number, comment: string) => void;
}

export default function ProfileTab({
  currentUser,
  usersList,
  onUpdateProfile,
  onApplyVerification,
  onPostReview
}: ProfileTabProps) {
  const [name, setName] = useState(currentUser?.name || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(currentUser?.travelStylePreferences || []);
  const [dateOfBirth, setDateOfBirth] = useState(currentUser?.dateOfBirth || "");
  const [currentCity, setCurrentCity] = useState(currentUser?.currentCity || "");
  const [gender, setGender] = useState(currentUser?.gender || "Male");
  const [showDetailsToOthers, setShowDetailsToOthers] = useState(currentUser?.showDetailsToOthers !== false);
  const [isEditing, setIsEditing] = useState(false);
  const [passportMockInput, setPassportMockInput] = useState("");
  
  // Reset fields when profile changes
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setBio(currentUser.bio || "");
      setSelectedPrefs(currentUser.travelStylePreferences || []);
      setDateOfBirth(currentUser.dateOfBirth || "");
      setCurrentCity(currentUser.currentCity || "");
      setGender(currentUser.gender || "Male");
      setShowDetailsToOthers(currentUser.showDetailsToOthers !== false);
    }
  }, [currentUser?.id]);
  
  // Review posting states
  const [reviewCoworkerId, setReviewCoworkerId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const prefOptions = ["Backpacker", "Adventure", "Foodie", "Luxury", "Relaxing", "Culture"];

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    onUpdateProfile(currentUser.id, {
      name,
      bio,
      travelStylePreferences: selectedPrefs,
      dateOfBirth,
      currentCity,
      showDetailsToOthers,
      gender
    });
    setIsEditing(false);
    alert("Profile configurations saved.");
  };

  const handlePrefToggle = (pref: string) => {
    if (selectedPrefs.includes(pref)) {
      setSelectedPrefs(prev => prev.filter(p => p !== pref));
    } else {
      setSelectedPrefs(prev => [...prev, pref]);
    }
  };

  const handleApplyVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !passportMockInput.trim()) return;
    onApplyVerification(currentUser.id, passportMockInput);
    setPassportMockInput("");
    alert("Verification applied success! Switch active persona in the header to Harshad Gawande (Admin) to review & approve your submitted ID form.");
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !reviewCoworkerId || !reviewComment.trim()) return;
    onPostReview(reviewCoworkerId, reviewRating, reviewComment);
    setReviewComment("");
    setReviewCoworkerId("");
    alert("Review posted! The user's trust score has been dynamically recalculated in the relational database.");
  };

  if (!currentUser) {
    return (
      <div className="bg-white border border-gray-150 p-8 text-center text-gray-500 rounded-3xl max-w-sm mx-auto" id="profile-anonymous-box">
        <p className="font-bold">Access personal dashboard</p>
        <p className="text-xs text-gray-400 mt-1">Please select an Active Profile Persona inside the navbar dropdown.</p>
      </div>
    );
  }

  // Filter other users so we don't rate ourselves
  const otherUsers = usersList.filter(u => u.id !== currentUser.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="profile-tab-grid">
      
      {/* COLUMN 1 & 2: MANAGE PROFILE PARAMETERS */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* EDIT PROFILE FORM */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-50 pb-3 mb-4 gap-4">
            <div className="flex items-center space-x-3">
              <img src={currentUser.avatar} alt="Profile Avatar" className="h-12 w-12 rounded-full border border-teal-500 bg-teal-50 object-cover" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 leading-tight flex items-center space-x-0.5">
                  <span>{currentUser.name}</span>
                  {currentUser.verified && <ShieldCheck className="h-4 w-4 text-teal-600 fill-teal-100" />}
                </h3>
                <p className="text-[10px] text-gray-400 font-mono font-bold leading-none mt-1">
                  Account Status: {currentUser.role === "admin" ? "🛠️ SYSTEM ADMINISTRATOR" : "Standard Traveler"}
                </p>
                <p className="text-[10px] text-teal-600 font-mono font-bold leading-none mt-1">
                  Profile Name: <span className="font-extrabold text-teal-700">{currentUser.name}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer flex items-center gap-1 shadow-sm ${
                isEditing
                  ? "bg-amber-500 border-amber-500 hover:bg-amber-600 text-white"
                  : "bg-teal-700 border-teal-700 hover:bg-teal-800 text-white"
              }`}
              id="profile-edit-toggle-button"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4" id="update-profile-form">
            <div className="space-y-1">
              <label className="block text-[10px] text-gray-400 font-bold uppercase">Traveler Public Name</label>
              <input
                type="text"
                required
                disabled={!isEditing}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 text-xs border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-800 disabled:bg-gray-100 disabled:text-gray-450 disabled:cursor-not-allowed"
                id="profile-name-field"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-gray-400 font-bold uppercase">Biographical Introduction</label>
              <textarea
                disabled={!isEditing}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your favorite hikes, beach stays, food preferences..."
                className="w-full bg-gray-50 text-xs border border-gray-200 rounded-xl p-2.5 h-24 font-medium text-gray-800 disabled:bg-gray-100 disabled:text-gray-450 disabled:cursor-not-allowed"
                id="profile-bio-field"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] text-gray-400 font-bold uppercase">Date of Birth</label>
                <input
                  type="date"
                  disabled={!isEditing}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-gray-50 text-xs border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-800 disabled:bg-gray-100 disabled:text-gray-450 disabled:cursor-not-allowed"
                  id="profile-dob-field"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-gray-400 font-bold uppercase">Current City</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="e.g. Pune, Maharashtra"
                  value={currentCity}
                  onChange={(e) => setCurrentCity(e.target.value)}
                  className="w-full bg-gray-50 text-xs border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-800 disabled:bg-gray-100 disabled:text-gray-450 disabled:cursor-not-allowed"
                  id="profile-city-field"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-gray-400 font-bold uppercase">Gender</label>
              <div className="bg-gray-100 text-gray-800 text-xs font-semibold rounded-xl p-2.5 inline-flex items-center space-x-1.5" id="profile-gender-display">
                <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
                <span>{gender || "Male"}</span>
              </div>
              <p className="text-[10px] text-gray-400 italic">Locked to registration choice and cannot be modified.</p>
            </div>

            <div className="bg-teal-50/50 border border-teal-100/50 p-3.5 rounded-2xl flex items-center justify-between space-x-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-teal-950">Share Basic Details in Trip Groups</p>
                <p className="text-[10px] text-teal-700/80 font-medium">Allows approved travel partners in your active groups to view your age/DOB and city.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={!isEditing}
                  checked={showDetailsToOthers}
                  onChange={(e) => setShowDetailsToOthers(e.target.checked)}
                  className="sr-only peer"
                  id="profile-details-toggle"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] text-gray-400 font-bold uppercase">Travel style tags</label>
              <div className="flex flex-wrap gap-1.5" id="profile-styles-grid">
                {prefOptions.map((opt) => {
                  const active = selectedPrefs.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={!isEditing}
                      onClick={() => handlePrefToggle(opt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        active 
                          ? "bg-teal-700 text-white shadow-sm" 
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:border-gray-300"
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {isEditing && (
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-1 cursor-pointer w-full justify-center shadow-md animate-fade-in"
                id="save-profile-btn"
              >
                <Save className="h-4 w-4" />
                <span>Save Profile Updates</span>
              </button>
            )}
          </form>
        </div>

        {/* REVIEWS ABOUT SECURED USER */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2 mb-3">
            Your Companion Reviews & Trust Ratings ({currentUser.reviews.length})
          </h3>
          <div className="space-y-4" id="received-reviews-list">
            {currentUser.reviews.length === 0 ? (
              <p className="text-[11px] text-gray-400 font-medium italic text-center py-6">
                No active community reviews yet. Complete travel campaigns with companions to accumulate trusted stars!
              </p>
            ) : (
              currentUser.reviews.map((rev) => (
                <div key={rev.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2" id={`rev-detail-${rev.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img src={rev.reviewerAvatar} alt="Reviewer" className="h-7 w-7 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-bold text-gray-700 leading-none">{rev.reviewerName}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Author ID: {rev.reviewerId}</p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 text-yellow-700 border border-yellow-150 px-2 py-0.5 rounded flex items-center space-x-0.5 text-[10px] font-bold">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{rev.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 font-medium font-sans italic leading-relaxed">"{rev.comment}"</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* COLUMN 3: TRUST AND SAFETY ENGINES */}
      <div className="space-y-6">
        
        {/* TRUST SCORE OVERVIEW PANEL */}
        <div className="bg-gradient-to-br from-teal-800 to-emerald-950 text-white rounded-3xl p-5 shadow-sm space-y-3" id="trust-score-badge-card">
          <Award className="h-8 w-8 text-orange-400" />
          <div>
            <span className="text-[9px] font-bold text-teal-300 uppercase tracking-widest block">Safe Community Score</span>
            <h3 className="font-sans font-extrabold text-2xl tracking-tight leading-snug">
              Travel Trust Score: <span className="text-orange-400">{currentUser.trustScore}%</span>
            </h3>
            <p className="text-[11px] text-teal-100 mt-1 leading-normal font-medium font-sans">
              TravelBag safety guidelines verify passport checklists and review logs. Verified status provides +20% instantly.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl" id="verification-status-label">
            <span className="text-[9px] text-teal-300 uppercase font-bold tracking-wider block">ID Verification Status</span>
            <p className="text-xs font-extrabold mt-0.5 flex items-center space-x-1">
              <span>Status:</span>
              <span className={`capitalize ${
                currentUser.verificationStatus === "approved" 
                  ? "text-green-400" 
                  : currentUser.verificationStatus === "pending" 
                  ? "text-amber-400 animate-pulse" 
                  : "text-gray-400"
              }`}>
                {currentUser.verificationStatus}
              </span>
            </p>
          </div>
        </div>

        {/* VERIFICATION FORM */}
        {currentUser.verificationStatus !== "approved" && (
          <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-1.5 flex items-center space-x-1">
              <FileCheck className="h-4.5 w-4.5 text-teal-600 inline" />
              <span>Apply for Verified Trust Badge</span>
            </h3>
            <p className="text-[11px] text-gray-400 font-sans leading-tight">
              To earn trust badges, please provide a secure preview text of passport details. Submissions are reviewed immediately by administrators.
            </p>

            <form onSubmit={handleApplyVerificationSubmit} className="space-y-2.5" id="apply-verification-form">
              <input
                type="text"
                required
                placeholder="Passport ID Draft (e.g. Passport Z7421)"
                value={passportMockInput}
                onChange={(e) => setPassportMockInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl px-2.5 py-2 font-medium text-gray-800 placeholder-gray-400"
                id="passport-input-field"
              />
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] py-2 w-full rounded-xl transition cursor-pointer"
                id="submit-verification-btn"
              >
                Submit ID Verification application
              </button>
            </form>
          </div>
        )}

        {/* RATE AND REVIEW COMPANIONS */}
        {otherUsers.length > 0 && (
          <div className="bg-white border border-gray-155 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-1.5 flex items-center space-x-1">
              <Star className="h-4.5 w-4.5 text-teal-600 inline" />
              <span>Rate Travel Companions</span>
            </h3>

            <form onSubmit={handleReviewSubmit} className="space-y-3" id="post-review-form">
              <div className="space-y-1">
                <label className="block text-[9px] text-gray-400 font-bold uppercase">Select Companion</label>
                <select
                  required
                  value={reviewCoworkerId}
                  onChange={(e) => setReviewCoworkerId(e.target.value)}
                  className="w-full bg-gray-50 text-xs border border-gray-200 rounded-xl px-2.5 py-2 font-semibold text-gray-700"
                  id="target-reviewee-picker"
                >
                  <option value="">-- Choose Partner --</option>
                  {otherUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (Score: {u.trustScore}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="block text-[9px] text-gray-400 font-bold uppercase">Rating Grade</label>
                  <span className="text-xs font-extrabold text-teal-700">{reviewRating} ⭐</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(parseInt(e.target.value))}
                  className="w-full accent-teal-600"
                  id="rating-range-slider"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] text-gray-400 font-bold uppercase font-sans">Feedback Statement</label>
                <textarea
                  required
                  placeholder="Review travel habits, safe conduct, driving, lodgings..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full bg-gray-50 text-xs border border-gray-200 rounded-xl p-2.5 h-20 placeholder-gray-400 font-medium text-gray-850"
                  id="review-comment-field"
                />
              </div>

              <button
                type="submit"
                disabled={!reviewCoworkerId}
                className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-[11px] py-2 w-full rounded-xl transition disabled:opacity-40 cursor-pointer"
                id="submit-review-btn"
              >
                Post Review & Adjust Trust Score
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
