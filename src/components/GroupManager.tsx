import React, { useState, useEffect } from "react";
import { Trip, User, GroupDetails, GroupPoll } from "../types";
import { Mail, Send, Flag, ShieldCheck, Users, IndianRupee, MapPin, Plus, Check, Loader2, Sparkles, BarChart3, Trash2, TrendingUp, Coins, Receipt, ArrowRight } from "lucide-react";

interface GroupManagerProps {
  currentUser: User | null;
  trips: Trip[];
  usersList: User[];
  onSendMessage: (tripId: string, text: string) => void;
  onCreatePoll: (tripId: string, question: string, options: string[]) => void;
  onVotePoll: (tripId: string, pollId: string, optionId: string) => void;
  onOpenDM?: (recipientUserId: string) => void;
}

export default function GroupManager({
  currentUser,
  trips,
  usersList = [],
  onSendMessage,
  onCreatePoll,
  onVotePoll,
  onOpenDM
}: GroupManagerProps) {
  const [authorizedTrips, setAuthorizedTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [groupData, setGroupData] = useState<GroupDetails | null>(null);
  
  const [typedMessage, setTypedMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Poll creation states
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOption1, setPollOption1] = useState("");
  const [pollOption2, setPollOption2] = useState("");
  const [pollOption3, setPollOption3] = useState("");

  // Splitwise engine states
  const [activeSplitTab, setActiveSplitTab] = useState<"expenses" | "balances" | "add">("expenses");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expPayerId, setExpPayerId] = useState("");
  const [expSplitWith, setExpSplitWith] = useState<string[]>([]);
  const [isSubmittingBill, setIsSubmittingBill] = useState(false);

  // Filter trips where user is eligible: Owner OR Approved companion
  useEffect(() => {
    if (!currentUser) return;
    const filtered = trips.filter(t => 
      t.createdById === currentUser.id || 
      t.joinedCompanionIds.includes(currentUser.id)
    );
    setAuthorizedTrips(filtered);
    
    if (filtered.length > 0 && !selectedTrip) {
      setSelectedTrip(filtered[0]);
    }
  }, [currentUser, trips]);

  // Fetch group messages & polls details when selectedTrip shifts
  const fetchGroupDetails = async () => {
    if (!currentUser || !selectedTrip) return;
    try {
      const response = await fetch(`/api/chats/group/${selectedTrip.id}?userId=${currentUser.id}`);
      if (response.ok) {
        const payload = await response.json();
        setGroupData(payload);
      }
    } catch (err) {
      console.error("Failed loading travel group data", err);
    }
  };

  useEffect(() => {
    if (!selectedTrip) return;
    setLoading(true);
    fetchGroupDetails().then(() => setLoading(false));

    // Dynamic SSE/Polling simulation loop
    const interval = setInterval(fetchGroupDetails, 4000);
    return () => clearInterval(interval);
  }, [selectedTrip, currentUser]);

  // Synchronize Splitwise dropdown defaults with active trip members
  useEffect(() => {
    if (selectedTrip) {
      setExpPayerId(currentUser?.id || selectedTrip.createdById);
      setExpSplitWith([selectedTrip.createdById, ...selectedTrip.joinedCompanionIds]);
    }
  }, [selectedTrip, currentUser]);

  const handleSendGroupMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedTrip || !typedMessage.trim() || !groupData) return;

    onSendMessage(selectedTrip.id, typedMessage);
    setTypedMessage("");

    // Optimistically push to avoid latency delays
    const mockMsg = {
      id: `gm-opt-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: typedMessage,
      timestamp: new Date().toISOString(),
      type: "text" as const
    };
    setGroupData(prev => prev ? {
      ...prev,
      messages: [...prev.messages, mockMsg]
    } : null);
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedTrip || !pollQuestion.trim() || !pollOption1.trim() || !pollOption2.trim()) return;

    const options = [pollOption1, pollOption2];
    if (pollOption3.trim()) {
      options.push(pollOption3);
    }

    onCreatePoll(selectedTrip.id, pollQuestion, options);
    
    // Clear forms state
    setPollQuestion("");
    setPollOption1("");
    setPollOption2("");
    setPollOption3("");
    setShowPollForm(false);
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip || !currentUser || !expDesc.trim() || !expAmount) return;
    setIsSubmittingBill(true);
    try {
      const response = await fetch(`/api/chats/group/${selectedTrip.id}/expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desc: expDesc.trim(),
          amount: parseFloat(expAmount) || 0,
          paidById: expPayerId || currentUser.id,
          splitWithIds: expSplitWith.length > 0 ? expSplitWith : [currentUser.id]
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setGroupData(updated);
        setExpDesc("");
        setExpAmount("");
        setActiveSplitTab("expenses");
      }
    } catch (err) {
      console.error("Failed adding Splitwise expense", err);
    } finally {
      setIsSubmittingBill(false);
    }
  };

  const handleRemoveExpense = async (expenseId: string) => {
    if (!selectedTrip || !currentUser) return;
    if (!confirm("Are you sure you want to delete this expense? All balances will be recalculated.")) return;
    try {
      const response = await fetch(`/api/chats/group/${selectedTrip.id}/expense/${expenseId}?userId=${currentUser.id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        const updated = await response.json();
        setGroupData(updated);
      }
    } catch (err) {
      console.error("Failed deleting Splitwise expense", err);
    }
  };

  const handleRecordSettle = async (fromId: string, toId: string, amount: number) => {
    if (!selectedTrip || !currentUser) return;
    try {
      const response = await fetch(`/api/chats/group/${selectedTrip.id}/expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desc: `Repayment: Settle balance`,
          amount: amount,
          paidById: fromId,
          splitWithIds: [toId],
          isSettlement: true
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setGroupData(updated);
        setActiveSplitTab("balances");
      }
    } catch (err) {
      console.error("Failed settling Splitwise expense", err);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-white border border-gray-150 rounded-3xl p-8 text-center text-gray-500 max-w-md mx-auto" id="anonymous-group-alert">
        <Users className="h-10 w-10 text-teal-600 mx-auto mb-3 animate-bounce" />
        <p className="font-bold">Access Private Travel Groups</p>
        <p className="text-xs text-gray-400 mt-1 leading-normal font-sans">
          To view approved planners, vote on accommodation polls, and chat securely with other travel companions, please assume an Active Profile Persona first!
        </p>
      </div>
    );
  }

  const activeGroupMembersCount = selectedTrip ? (1 + selectedTrip.joinedCompanionIds.length) : 0;
  const groupMembersIds = selectedTrip ? [selectedTrip.createdById, ...selectedTrip.joinedCompanionIds] : [];
  const uniqueMemberIds = Array.from(new Set(groupMembersIds));

  // Compute live Splitwise ledger balances
  const memberBalances: Record<string, number> = {};
  uniqueMemberIds.forEach(id => {
    memberBalances[id] = 0;
  });

  const expensesList = groupData?.expenses || [];
  
  expensesList.forEach(exp => {
    const amount = Number(exp.amount) || 0;
    const payId = exp.paidById;
    const splitIds = exp.splitWithIds && exp.splitWithIds.length > 0 ? exp.splitWithIds : uniqueMemberIds;

    // Credit payer
    if (uniqueMemberIds.includes(payId)) {
      memberBalances[payId] = (memberBalances[payId] || 0) + amount;
    }

    // Debit participants
    if (splitIds.length > 0) {
      const share = amount / splitIds.length;
      splitIds.forEach(pId => {
        if (uniqueMemberIds.includes(pId)) {
          memberBalances[pId] = (memberBalances[pId] || 0) - share;
        }
      });
    }
  });

  // Simplified repayment transfers (Greedy greedy match debts structure)
  const getDebtsAndCredits = () => {
    const debtors: { id: string; balance: number }[] = [];
    const creditors: { id: string; balance: number }[] = [];

    uniqueMemberIds.forEach(id => {
      const bal = memberBalances[id] || 0;
      if (bal < -0.01) {
        debtors.push({ id, balance: bal });
      } else if (bal > 0.01) {
        creditors.push({ id, balance: bal });
      }
    });

    debtors.sort((a, b) => a.balance - b.balance);
    creditors.sort((a, b) => b.balance - a.balance);

    const transactions: { debtorId: string; creditorId: string; amount: number }[] = [];
    let dIdx = 0;
    let cIdx = 0;

    const activeDebts = debtors.map(d => ({ ...d, amountOwed: -d.balance }));
    const activeCredits = creditors.map(c => ({ ...c, amountOwed: c.balance }));

    while (dIdx < activeDebts.length && cIdx < activeCredits.length) {
      const debtor = activeDebts[dIdx];
      const creditor = activeCredits[cIdx];

      const minAmount = Math.min(debtor.amountOwed, creditor.amountOwed);
      if (minAmount > 0.01) {
        transactions.push({
          debtorId: debtor.id,
          creditorId: creditor.id,
          amount: Math.round(minAmount * 100) / 100
        });
      }

      debtor.amountOwed -= minAmount;
      creditor.amountOwed -= minAmount;

      if (debtor.amountOwed < 0.01) dIdx++;
      if (creditor.amountOwed < 0.01) cIdx++;
    }

    return transactions;
  };

  const getMemberName = (id: string) => {
    if (id === currentUser.id) return "You";
    const user = usersList.find(u => u.id === id);
    return user ? user.name : "Traveler";
  };

  // Only sum up non-repayment real items for the "Total Budget Cost" estimator
  const totalBudgetCost = expensesList.filter(e => !e.isSettlement).reduce((acc, b) => acc + b.amount, 0);
  const costPerCompanion = activeGroupMembersCount > 0 ? Math.round(totalBudgetCost / activeGroupMembersCount) : 0;

  return (
    <div className="space-y-6" id="group-manager-module">
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-xl font-sans font-extrabold text-gray-950 tracking-tight">Private Travel Groups</h2>
        <p className="text-xs text-gray-400">Cooperate and budget with approved campaign participants securely.</p>
      </div>

      {authorizedTrips.length === 0 ? (
        <div className="bg-white border border-gray-150 p-10 text-center rounded-3xl max-w-xl mx-auto" id="empty-groups-alert">
          <Users className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-700">You are not a member of any active travel groups yet.</p>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            Discover a trip on the TravelBag feed and request to join! Once approved by the creator, you will automatically unlock real-time chats, budget sheets, and coordination polls right here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6" id="groups-main-panel">
          {/* GROUP SELECTOR BAR */}
          <div className="w-full lg:w-1/4 flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto gap-2 p-1 bg-gray-50/50 rounded-2xl shrink-0" id="group-selector">
            {authorizedTrips.map((tg) => {
              const active = selectedTrip?.id === tg.id;
              return (
                <button
                  key={tg.id}
                  onClick={() => setSelectedTrip(tg)}
                  className={`p-3 rounded-xl text-left border shrink-0 transition text-xs font-bold w-48 lg:w-full leading-tight cursor-pointer ${
                    active 
                      ? "bg-teal-700 border-teal-700 text-white shadow" 
                      : "bg-white hover:bg-gray-100/50 border-gray-100 text-gray-700"
                  }`}
                  id={`dialog-group-${tg.id}`}
                >
                  <p className="font-sans font-extrabold truncate">{tg.title}</p>
                  <p className={`text-[10px] uppercase font-mono mt-0.5 ${active ? "text-teal-200" : "text-gray-400"}`}>
                    To: {tg.destination}
                  </p>
                </button>
              );
            })}
          </div>

          {/* CHAT/POLLS WRAPPER */}
          {selectedTrip && (
            <div className="flex-1 space-y-6" id="selected-group-detail-panel">
              {/* TARGET BANNER */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="tg-details-banner">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 leading-tight flex items-center space-x-1">
                    <MapPin className="h-4.5 w-4.5 text-teal-600 inline" />
                    <span>{selectedTrip.title}</span>
                  </h3>
                  <p className="text-[10px] text-gray-400 uppercase font-mono mt-0.5 font-semibold">
                    Owner: {selectedTrip.createdBy.name} • Partners: {selectedTrip.joinedCompanionIds.length} approved
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="bg-teal-50 border border-teal-100 text-teal-700 text-[10px] font-bold px-2 py-1 rounded">
                    Travel style: {selectedTrip.travelStyle}
                  </span>
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded">
                    Active Members: {activeGroupMembersCount}
                  </span>
                </div>
              </div>

              {/* TWO COLUMN GRID FOR CHAT & OTHER TOOLS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="group-coordination-grid">
                
                {/* 1. SECURE GROUP COMMUNITY CHAT */}
                <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex flex-col h-[480px]" id="group-chat-segment">
                  <div className="border-b border-gray-100 pb-2 mb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Group Communication Pipe</h4>
                      <p className="text-[10px] text-gray-400 font-mono">Row Level Security active</p>
                    </div>
                  </div>

                  {/* MESSAGES */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1" id="tg-chat-list">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
                      </div>
                    ) : groupData?.messages?.length === 0 ? (
                      <div className="text-center py-12 text-xs text-gray-400 font-serif italic">
                        No dialogue logs in this group. Say hello to get started!
                      </div>
                    ) : (
                      groupData?.messages?.map((msg, idx) => {
                        const isMe = msg.senderId === currentUser.id;
                        const isSystem = msg.senderId === "system";

                        if (isSystem) {
                          return (
                            <div key={msg.id || idx} className="bg-amber-50/55 border border-amber-100/40 p-2.5 rounded-xl text-[11px] text-amber-800 leading-snug font-semibold text-center shadow-xs">
                              {msg.content}
                            </div>
                          );
                        }

                        return (
                          <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] ${
                              isMe ? "bg-teal-700 text-white rounded-br-none" : "bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-none"
                            }`}>
                              <p className="text-[9px] font-bold opacity-60 mb-0.5">{msg.senderName}</p>
                              <p className="font-semibold leading-relaxed break-words font-sans">{msg.content}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* INPUT */}
                  <form onSubmit={handleSendGroupMessage} className="mt-3 flex items-center space-x-1.5 border-t border-gray-50 pt-3">
                    <input
                      type="text"
                      placeholder="Discuss budgets, maps, hotels..."
                      value={typedMessage}
                      onChange={(e) => setTypedMessage(e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-200 text-xs px-3 py-2.5 rounded-xl placeholder-gray-400 text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <button type="submit" className="bg-teal-700 hover:bg-teal-800 text-white p-2.5 rounded-xl block">
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>

                {/* 2. ALL ACTIVE COORDINATION POLLS */}
                <div className="space-y-6" id="coordination-polls-segment">
                  <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm max-h-[250px] overflow-y-auto" id="polls-box">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-3">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-1">
                        <BarChart3 className="h-4 w-4 text-teal-600" />
                        <span>Planning Polls</span>
                      </h4>
                      <button
                        onClick={() => setShowPollForm(!showPollForm)}
                        className="text-[10px] text-teal-600 font-bold hover:underline cursor-pointer"
                        id="new-poll-toggle"
                      >
                        {showPollForm ? "✕ Close" : "+ Create Poll"}
                      </button>
                    </div>

                    {showPollForm ? (
                      <form onSubmit={handleCreatePoll} className="space-y-2 bg-gray-50 p-3 rounded-2xl border border-gray-100 animate-slide-up" id="poll-form">
                        <input
                          type="text"
                          required
                          placeholder="What is your planning question?"
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                          className="w-full bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 text-gray-800 font-medium"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Option 1 (e.g. Budget Rooms)"
                          value={pollOption1}
                          onChange={(e) => setPollOption1(e.target.value)}
                          className="w-full bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 text-gray-800 font-medium"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Option 2 (e.g. Luxury Lodge)"
                          value={pollOption2}
                          onChange={(e) => setPollOption2(e.target.value)}
                          className="w-full bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 text-gray-800 font-medium"
                        />
                        <input
                          type="text"
                          placeholder="Option 3 (Optional)"
                          value={pollOption3}
                          onChange={(e) => setPollOption3(e.target.value)}
                          className="w-full bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 text-gray-800 font-medium"
                        />
                        <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold w-full py-2 rounded-xl">
                          Publish Poll to Group
                        </button>
                      </form>
                    ) : groupData?.polls?.length === 0 ? (
                      <p className="text-[10px] text-gray-400 font-medium text-center py-8">
                        No coordination polls published. Create one above to choose cabins or dates!
                      </p>
                    ) : (
                      <div className="space-y-4" id="active-poll-widgets">
                        {groupData?.polls?.map((poll) => {
                          const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);
                          return (
                            <div key={poll.id} className="bg-gray-50 border border-gray-100 p-3 rounded-2xl text-xs space-y-2">
                              <p className="font-bold text-gray-800 leading-snug">{poll.question}</p>
                              <div className="space-y-1.5">
                                {poll.options.map((opt) => {
                                  const voted = opt.votes.includes(currentUser.id);
                                  const percentage = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                                  return (
                                    <button
                                      key={opt.id}
                                      onClick={() => onVotePoll(selectedTrip.id, poll.id, opt.id)}
                                      className={`w-full text-left p-2 rounded-xl border relative overflow-hidden transition flex items-center justify-between text-[11px] cursor-pointer ${
                                        voted ? "bg-teal-50 border-teal-200 text-teal-800 font-bold" : "bg-white border-gray-150 hover:bg-gray-100"
                                      }`}
                                    >
                                      {/* Progress Bar background */}
                                      <div 
                                        className="absolute left-0 top-0 bottom-0 bg-teal-600/10 transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                      <span className="relative z-10">{opt.text}</span>
                                      <span className="font-mono font-bold text-gray-500 relative z-10 text-[10px]">
                                        {opt.votes.length} votes ({percentage}%)
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 3. SHARED BUDGET ESTIMATOR - SPLITWISE REPLICA */}
                  <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4" id="budget-sheet-box">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-1.5">
                        <Receipt className="h-4 w-4 text-teal-600 animate-pulse" />
                        <span>Group Bills & Splitwise Ledger</span>
                      </h4>
                      <div className="flex bg-gray-50 p-0.5 rounded-xl border border-gray-100">
                        <button
                          onClick={() => setActiveSplitTab("expenses")}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                            activeSplitTab === "expenses" ? "bg-teal-700 text-white shadow-xs" : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          Bills
                        </button>
                        <button
                          onClick={() => setActiveSplitTab("balances")}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                            activeSplitTab === "balances" ? "bg-teal-700 text-white shadow-xs" : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          Balances
                        </button>
                        <button
                          onClick={() => setActiveSplitTab("add")}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                            activeSplitTab === "add" ? "bg-teal-700 text-white shadow-xs" : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* EXPENSES TAB */}
                    {activeSplitTab === "expenses" && (
                      <div className="space-y-2.5">
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 text-xs">
                          {expensesList.length === 0 ? (
                            <div className="text-center py-6 text-[11px] text-gray-400 font-medium font-serif italic">
                              No bills logged yet. Tap "+ Add" to log Lodging, Dining, or Rental bills!
                            </div>
                          ) : (
                            expensesList.map((exp) => (
                              <div 
                                key={exp.id} 
                                className={`flex justify-between items-center p-2.5 rounded-xl border transition-all ${
                                  exp.isSettlement 
                                    ? "bg-emerald-50/50 border-emerald-100 text-emerald-850" 
                                    : "bg-gray-50/75 border-gray-100 hover:bg-gray-50"
                                }`}
                              >
                                <div className="space-y-0.5 max-w-[70%]">
                                  <p className="font-bold text-gray-850 truncate text-[11px]">
                                    {exp.isSettlement ? "🤝 Balance Settle-up" : exp.desc}
                                  </p>
                                  <p className="text-[9px] text-gray-400 font-semibold truncate">
                                    Paid by <span className="text-gray-600 font-bold">{exp.paidById === currentUser.id ? "You" : exp.paidByName}</span>
                                    {!exp.isSettlement && ` • Split with ${exp.splitWithIds.length} members`}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 shrink-0">
                                  <span className="font-mono font-bold text-gray-800 text-[11px]">₹{exp.amount.toLocaleString()}</span>
                                  <button
                                    onClick={() => handleRemoveExpense(exp.id)}
                                    className="text-gray-300 hover:text-rose-600 p-1 rounded-lg transition duration-150 cursor-pointer"
                                    title="Delete expense"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* SUMMARIES INSET */}
                        <div className="bg-teal-50 border border-teal-100/40 p-2.5 rounded-2xl flex items-center justify-between text-[11px] text-teal-850">
                          <div>
                            <p className="opacity-75 font-semibold">Real group expenses</p>
                            <p className="font-mono font-black text-xs">₹{totalBudgetCost.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="opacity-75 font-semibold">Equal share ({activeGroupMembersCount} pax)</p>
                            <p className="font-mono font-black text-rose-600 text-xs">₹{costPerCompanion.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* BALANCES TAB */}
                    {activeSplitTab === "balances" && (
                      <div className="space-y-3">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Group Balance Sheet</p>
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {uniqueMemberIds.map((mId) => {
                            const bal = memberBalances[mId] || 0;
                            const name = getMemberName(mId);
                            const memberUser = usersList.find(u => u.id === mId);
                            const avatarUrl = memberUser?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${mId}`;

                            return (
                              <div key={mId} className="flex items-center justify-between bg-gray-50/55 border border-gray-100 p-1.5 rounded-xl">
                                <div className="flex items-center space-x-2">
                                  <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="h-5 w-5 rounded-full object-cover border border-gray-200" />
                                  <span className="text-[11px] font-bold text-gray-700">{name}</span>
                                </div>
                                <div className="text-right text-[10px] font-mono">
                                  {bal < -0.01 ? (
                                    <span className="text-red-650 font-black">Owes ₹{Math.abs(Math.round(bal)).toLocaleString()}</span>
                                  ) : bal > 0.01 ? (
                                    <span className="text-emerald-700 font-black">Is owed ₹{Math.round(bal).toLocaleString()}</span>
                                  ) : (
                                    <span className="text-gray-400 font-bold">Settled Up</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* GREEDY DEBT SIMPLIFICATION REPAYMENTS */}
                        <div className="border-t border-gray-100 pt-2.5 space-y-1.5">
                          <p className="text-[10px] text-teal-800 font-bold uppercase tracking-wider flex items-center space-x-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>Simplified Repayment Plans</span>
                          </p>
                          {(() => {
                            const transactions = getDebtsAndCredits();
                            if (transactions.length === 0) {
                              return (
                                <p className="text-[10px] text-gray-400 font-medium text-center py-1 bg-emerald-50/45 border border-emerald-100/30 rounded-xl">
                                  🎉 Everything is settled perfectly! No repayments needed.
                                </p>
                              );
                            }
                            return (
                              <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                                {transactions.map((tx, idx) => {
                                  const isInvolved = tx.debtorId === currentUser.id || tx.creditorId === currentUser.id;
                                  return (
                                    <div key={idx} className="flex items-center justify-between bg-teal-50/45 border border-teal-100/30 p-1.5 rounded-xl text-[10px]">
                                      <div className="flex items-center space-x-1 font-semibold text-teal-950">
                                        <span className="font-bold">{getMemberName(tx.debtorId)}</span>
                                        <ArrowRight className="h-3 w-3 text-teal-600 shrink-0" />
                                        <span className="font-bold">{getMemberName(tx.creditorId)}</span>
                                        <span className="font-mono text-rose-600 bg-rose-50 px-1 py-0.5 rounded font-black ml-1">₹{tx.amount.toLocaleString()}</span>
                                      </div>
                                      {isInvolved ? (
                                        <button
                                          onClick={() => handleRecordSettle(tx.debtorId, tx.creditorId, tx.amount)}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-2 py-1 rounded-lg text-[9px] transition cursor-pointer shrink-0"
                                          title="Record cash settle-up payment"
                                        >
                                          Record Settle
                                        </button>
                                      ) : (
                                        <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded select-none cursor-not-allowed" title="You are not part of this specific debt/balance">
                                          Uninvolved
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* ADD BILL TAB */}
                    {activeSplitTab === "add" && (
                      <form onSubmit={handleSubmitExpense} className="space-y-3">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Add Shared Expense</p>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-450 uppercase block">What was it for?</label>
                            <input
                              type="text"
                              required
                              placeholder="Lodging, gas, cab, lunch..."
                              value={expDesc}
                              onChange={(e) => setExpDesc(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 text-gray-800 font-medium"
                            />
                          </div>
                          
                          <div className="space-y-1 font-mono">
                            <label className="text-[9px] font-bold text-gray-450 uppercase block">Amount (₹)</label>
                            <input
                              type="number"
                              required
                              placeholder="Cost in ₹"
                              value={expAmount}
                              onChange={(e) => setExpAmount(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 text-gray-800 font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {/* PAID BY */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-450 uppercase block">Who paid?</label>
                            <select
                              value={expPayerId}
                              onChange={(e) => setExpPayerId(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl px-1.5 py-1.5 font-bold text-gray-700 focus:outline-none"
                            >
                              {uniqueMemberIds.map((mId) => (
                                <option key={mId} value={mId}>
                                  {getMemberName(mId)} {mId === currentUser.id ? "(You)" : ""}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* SPLIT WITH */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-450 uppercase block">Split with?</label>
                            <div className="bg-gray-50 border border-gray-200 text-[10px] rounded-xl px-2 py-1 max-h-[85px] overflow-y-auto space-y-1 text-gray-700">
                              {uniqueMemberIds.map((mId) => {
                                const isChecked = expSplitWith.includes(mId);
                                return (
                                  <label key={mId} className="flex items-center space-x-1.5 cursor-pointer font-semibold py-0.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          setExpSplitWith(prev => prev.filter(id => id !== mId));
                                        } else {
                                          setExpSplitWith(prev => [...prev, mId]);
                                        }
                                      }}
                                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-3 w-3"
                                    />
                                    <span className="truncate">{getMemberName(mId)}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* AUTOMATIC SPLIT SHARE PREVIEW */}
                        {expAmount && Number(expAmount) > 0 && expSplitWith.length > 0 && (
                          <div className="bg-teal-50/75 border border-teal-100 p-2.5 rounded-2xl space-y-1">
                            <div className="flex justify-between text-[10px] text-teal-900 font-bold">
                              <span>🔄 Automatic Split share:</span>
                              <span className="font-mono text-xs">₹{Math.round(Number(expAmount) / expSplitWith.length).toLocaleString()} / person</span>
                            </div>
                            <p className="text-[9px] text-gray-500 font-semibold leading-normal">
                              Equally splitting ₹{Number(expAmount).toLocaleString()} with {expSplitWith.length} selected members: {expSplitWith.map(id => getMemberName(id)).join(", ")}.
                            </p>
                          </div>
                        )}

                        <button 
                          type="submit" 
                          disabled={isSubmittingBill}
                          className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-xs font-semibold w-full py-2.5 rounded-xl font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          {isSubmittingBill ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Coins className="h-4 w-4" />}
                          <span>Save Split-Bill Expense</span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              {/* GROUP COMPANIONS BASIC DETAILS DIRECTORY */}
              <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4" id="partners-details-directory">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-950 flex items-center space-x-2">
                      <Users className="h-5 w-5 text-teal-600" />
                      <span>Approved Companion Contact & Details Directory</span>
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Mutual info registry. Share your Birthday/City preferences inside the Profile tab to let partners know you better!
                    </p>
                  </div>
                  <div className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2.5 py-1 rounded-full w-fit">
                    🔑 Protected Member Access
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="group-partners-cards-grid">
                  {(() => {
                    const groupMemberIds = [selectedTrip.createdById, ...selectedTrip.joinedCompanionIds];
                    const uniqueMemberIds = Array.from(new Set(groupMemberIds));
                    
                    return uniqueMemberIds.map((mId) => {
                      const member = usersList.find(u => u.id === mId);
                      const isOwner = mId === selectedTrip.createdById;
                      
                      if (!member) {
                        return (
                          <div key={mId} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs text-gray-450 font-medium italic">
                            Inactive traveler record (ID: {mId})
                          </div>
                        );
                      }

                      const canShowAll = member.showDetailsToOthers !== false;

                      let ageStr = "N/A";
                      if (member.dateOfBirth) {
                        try {
                          const birthDate = new Date(member.dateOfBirth);
                          const today = new Date();
                          let age = today.getFullYear() - birthDate.getFullYear();
                          const m = today.getMonth() - birthDate.getMonth();
                          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                          }
                          ageStr = `${age} years old`;
                        } catch (e) {
                          ageStr = "Invalid date";
                        }
                      }

                      return (
                        <div 
                          key={member.id} 
                          className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                            member.id === currentUser.id 
                              ? "bg-teal-50/45 border-teal-200" 
                              : "bg-gray-50/50 border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <div className="flex items-start justify-between space-x-2">
                            <div className="flex items-center space-x-2.5">
                              <img 
                                src={member.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.name}`} 
                                alt={member.name} 
                                className="h-10 w-10 rounded-full border bg-white border-teal-500" 
                              />
                              <div>
                                <h4 className="text-xs font-bold text-gray-900 flex items-center space-x-1">
                                  <span>{member.name}</span>
                                  {member.verified && <ShieldCheck className="h-3.5 w-3.5 text-teal-600 fill-teal-100 animate-pulse" />}
                                </h4>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase mt-1 inline-block ${
                                  isOwner 
                                    ? "bg-orange-100 text-orange-700" 
                                    : "bg-teal-100 text-teal-800"
                                }`}>
                                  {isOwner ? "Organizer" : "Companion"}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-gray-400 font-bold block">Trust Score</span>
                              <span className="text-xs font-extrabold text-teal-700">{member.trustScore}%</span>
                            </div>
                          </div>

                          <div className="border-t border-gray-100 pt-3">
                            {canShowAll ? (
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between items-center bg-white border border-gray-100 px-2.5 py-1.5 rounded-xl">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase">Date of Birth</span>
                                  <span className="font-semibold text-gray-850">
                                    {member.dateOfBirth ? `${member.dateOfBirth} (${ageStr})` : "Not provided"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center bg-white border border-gray-100 px-2.5 py-1.5 rounded-xl">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase">Current City</span>
                                  <span className="font-semibold text-gray-850 truncate max-w-[150px]">
                                    {member.currentCity || "Not provided"}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-100/50 p-2.5 rounded-xl text-center space-y-1 border border-dashed border-gray-200">
                                <p className="text-[11px] font-bold text-gray-500 flex items-center justify-center space-x-1">
                                  <span>🔒 Profile details hidden</span>
                                </p>
                                <p className="text-[9px] text-gray-400">This partner chose to keep basic details private.</p>
                              </div>
                            )}
                          </div>
                          
                          {member.bio && (
                            <p className="text-[10px] text-gray-450 italic line-clamp-2 border-t border-gray-50 pt-2 font-medium">
                              "{member.bio}"
                            </p>
                          )}

                          {member.id !== currentUser?.id && onOpenDM && (
                            <button
                              onClick={() => onOpenDM(member.id)}
                              className="w-full mt-2 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer"
                              id={`dm-btn-${member.id}`}
                            >
                              <Mail className="h-3.5 w-3.5" />
                              <span>Direct Message {member.name}</span>
                            </button>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
