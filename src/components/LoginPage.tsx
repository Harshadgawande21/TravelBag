import React, { useState } from "react";
import { Compass, ShieldCheck, Key, PlusCircle, ArrowRight, User as UserIcon, Lock, Mail, Sparkles, FileText, Check, Eye, EyeOff } from "lucide-react";
import { User } from "../types";
import TravelBagLogo from "./TravelBagLogo";

interface LoginPageProps {
  usersList: User[];
  onLogin: (username: string, password?: string, loginType?: "user" | "admin") => Promise<boolean>;
  onRegister: (fields: { 
    username: string; 
    password?: string; 
    email?: string; 
    reqRole?: "user" | "admin"; 
    fullName?: string; 
    bio?: string; 
    travelStylePreferences?: string[];
    gender?: string;
  }) => Promise<boolean>;
}

const AVAILABLE_STYLES = [
  "Backpacker",
  "Adventure",
  "Foodie",
  "Relaxing",
  "Local Culture",
  "Luxury",
  "Solo"
];

export default function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [loginType, setLoginType] = useState<"user" | "admin">("user");
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState<string>("Male");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [failedMsg, setFailedMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setFailedMsg("Please enter both your username and password.");
      return;
    }

    setIsLoading(true);
    setFailedMsg("");
    setSuccessMsg("");

    try {
      const success = await onLogin(username.trim(), password, loginType);
      if (!success) {
        setFailedMsg(`Invalid credentials or access denied for ${loginType} login.`);
      }
    } catch (err: any) {
      setFailedMsg(err.message || "An authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setFailedMsg("Username and password are required to register.");
      return;
    }

    if (password.length < 4) {
      setFailedMsg("Password should be at least 4 characters long.");
      return;
    }

    setIsLoading(true);
    setFailedMsg("");
    setSuccessMsg("");

    try {
      const success = await onRegister({
        username: username.trim().toLowerCase(), // normalize username
        password: password,
        email: email.trim() || undefined,
        reqRole: "user", // Default standard user
        fullName: fullName.trim() || username.trim(),
        bio: bio.trim() || undefined,
        travelStylePreferences: selectedStyles,
        gender: gender
      });
      if (success) {
        setSuccessMsg(`Welcome, ${username}! Your customized companion profile was created successfully.`);
        // Switch context to login and clear credentials so user has to type them manually
        setTimeout(() => {
          setIsRegister(false);
          setLoginType("user");
          setSuccessMsg("");
          setUsername("");
          setPassword("");
          setEmail("");
          setFullName("");
          setBio("");
          setGender("Male");
          setSelectedStyles([]);
          setShowRegisterPassword(false);
          setShowLoginPassword(false);
        }, 1500);
      } else {
        setFailedMsg("Username already exists or registration was unsuccessful.");
      }
    } catch (err: any) {
      setFailedMsg(err.message || "An error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStyleToggle = (style: string) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter(s => s !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans" id="login-page-root">
      
      {/* BRAND HEADER */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center text-center mb-6">
        <TravelBagLogo size="lg" />
        <p className="mt-2 text-xs text-gray-400 font-medium font-sans max-w-sm">
          Find travel companions, orchestrate itineraries, and interact securely.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md border border-gray-100 rounded-3xl sm:px-10">
          
          {/* TABS FOR USER / ADMIN LOGIN (Only if not registering) */}
          {!isRegister && (
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6 text-xs font-bold" id="login-tabs">
              <button
                type="button"
                onClick={() => {
                  setLoginType("user");
                  setFailedMsg("");
                }}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  loginType === "user" ? "bg-white text-teal-950 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>User Account Login</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginType("admin");
                  setFailedMsg("");
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  loginType === "admin" ? "bg-white text-teal-950 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Admin Portal Login</span>
              </button>
            </div>
          )}

          {/* FORM TITLE */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800 font-sans">
              {isRegister ? "New Companion Registration" : loginType === "admin" ? "Sign In as Administrator" : "Sign In to TravelBag"}
            </h3>
            <p className="text-xs text-gray-400">
              {isRegister 
                ? "Setup your traveler profile. These details are displays to upcoming trip members!" 
                : "Enter your username/email and password to authenticate."}
            </p>
          </div>

          {/* STATUS NOTIFICATIONS */}
          {failedMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-medium" id="login-error-toast">
              {failedMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-700 text-xs rounded-xl font-medium" id="login-success-toast">
              {successMsg}
            </div>
          )}

          {/* FORMS */}
          {isRegister ? (
            /* REGISTER COMPLETED FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4 font-sans" id="register-form">
              
              {/* PRIMARY CREDENTIAL DETAILS */}
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Account Credentials</span>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-650 mb-1">Username / Login ID</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Use lowercase characters (e.g. harshad)"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 text-xs font-medium rounded-xl outline-none focus:border-teal-500 text-gray-800 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-655 mb-1">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create security password (min 4 characters)"
                      className="w-full pl-9 pr-10 py-2 bg-white border border-gray-200 text-xs font-medium rounded-xl outline-none focus:border-teal-500 text-gray-800 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-650 mb-1">Email address (Optional)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@domain.com"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 text-xs font-medium rounded-xl outline-none focus:border-teal-500 text-gray-800 transition"
                    />
                  </div>
                </div>
              </div>

              {/* COMPANION PROFILE SPECIFICS */}
              <div className="bg-teal-50/20 p-4 rounded-2xl border border-teal-100/50 space-y-4">
                <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-teal-600" />
                  <span>Traveler Profile Showcase</span>
                </span>

                <div>
                  <label className="block text-xs font-semibold text-gray-650 mb-1">Full Display Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                      <UserIcon className="h-4 w-4 text-teal-600" />
                    </span>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Harshad Gawande"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 text-xs font-medium rounded-xl outline-none focus:border-teal-400 text-gray-850 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-650 mb-1">Gender</label>
                  <div className="flex space-x-3 mt-1" id="gender-selection">
                    {["Male", "Female"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`flex-1 py-1.5 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                          gender === g
                            ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-655 mb-1 flex justify-between">
                    <span>Biography & Bio</span>
                    <span className="text-[10px] font-medium text-gray-400">Introduce yourself!</span>
                  </label>
                  <div className="relative">
                    <span className="absolute top-2.5 left-3 text-gray-400 pointer-events-none">
                      <FileText className="h-4 w-4 text-teal-600" />
                    </span>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="e.g. Passionate trekker and road-tripper. Love quiet mountain trails, coastal cuisine, and photography."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 text-xs font-medium rounded-xl outline-none focus:border-teal-400 text-gray-850 transition resize-none"
                    />
                  </div>
                </div>

                {/* STYLE MULTI SELECT PILLS */}
                <div>
                  <label className="block text-xs font-semibold text-gray-655 mb-1">
                    Travel Style Preferences (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-1.5 mt-2" id="traveler-styles-selection">
                    {AVAILABLE_STYLES.map((style) => {
                      const isSelected = selectedStyles.includes(style);
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => handleStyleToggle(style)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold select-none cursor-pointer duration-150 transition flex items-center space-x-1 border ${
                            isSelected 
                              ? "bg-teal-600 border-teal-600 text-white shadow-sm shadow-teal-100" 
                              : "bg-white border-gray-200 text-gray-600 hover:border-teal-300"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                          <span>{style}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl text-xs font-bold transition shadow-md shadow-teal-50 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{isLoading ? "Assembling Traveler Profile..." : "Register & Complete Profile"}</span>
              </button>
            </form>
          ) : (
            /* SIMPLE LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4 font-sans" id="login-form">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Username / Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={loginType === "admin" ? "Type 'admin' or admin email" : "Type 'user' or your username"}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 text-xs font-medium rounded-xl outline-none focus:border-teal-500 focus:bg-white text-gray-800 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Password</label>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your security password"
                    className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 text-xs font-medium rounded-xl outline-none focus:border-teal-500 focus:bg-white text-gray-800 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-650 focus:outline-none"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-teal-50 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Key className="h-4 w-4" />
                <span>{isLoading ? "Authenticating..." : `Sign In as ${loginType === "admin" ? "Admin" : "User"}`}</span>
              </button>
            </form>
          )}

          {/* TOGGLE REGISTRATION AND LOGIN */}
          <div className="mt-6 pt-4 border-t border-gray-150 flex flex-col space-y-2 text-center text-xs">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setFailedMsg("");
                setSuccessMsg("");
              }}
              className="text-teal-600 hover:text-teal-700 font-bold transition flex items-center justify-center space-x-1 cursor-pointer self-center"
            >
              <span>{isRegister ? "Have an account already? Access Login Portal" : "New travel Companion? Register Here"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>

        {/* Creator Name below the form card */}
        <div className="text-center mt-6 text-[11px] text-gray-400 font-medium">
          Created with <span className="text-red-500">❤️</span> by <span className="text-teal-900 font-bold">Harshad Gawande</span>
        </div>

      </div>
    </div>
  );
}
