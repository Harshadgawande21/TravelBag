export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  bio: string;
  verified: boolean;
  trustScore: number; // 0 to 100
  reviews: Review[];
  blockList: string[]; // User IDs blocked by this user
  verificationStatus: "none" | "pending" | "approved" | "rejected";
  verificationDocUrl?: string;
  verificationDocsPreview?: string;
  role: "user" | "admin";
  travelStylePreferences: string[];
  createdAt: string;
  dateOfBirth?: string;
  currentCity?: string;
  showDetailsToOthers?: boolean;
  gender?: string;
}

export interface TripComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  title: string;
  source: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelStyle: string; // e.g. Adventure, Backpacking, Luxury, Foodie, Relaxing
  itinerary: string[]; // list of days or milestones
  maxCompanions: number;
  joinedCompanionIds: string[]; // Approved companion IDs
  pendingCompanionIds: string[]; // Requested companion IDs
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    trustScore: number;
    completed?: boolean;
  };
  likes: string[]; // User IDs who liked the trip
  comments: TripComment[];
  savedBy: string[]; // User IDs who saved the trip
  createdAt: string;
  completed?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  type: "text" | "system";
}

export interface GroupPollOption {
  id: string;
  text: string;
  votes: string[]; // User IDs who voted
}

export interface GroupPoll {
  id: string;
  question: string;
  options: GroupPollOption[];
  createdById: string;
  createdAt: string;
}

export interface GroupExpense {
  id: string;
  desc: string;
  amount: number;
  paidById: string;
  paidByName: string;
  splitWithIds: string[];
  createdAt: string;
  isSettlement?: boolean;
}

export interface GroupDetails {
  tripId: string;
  messages: Message[];
  polls: GroupPoll[];
  expenses?: GroupExpense[];
}

export interface PrivateChat {
  id: string;
  userA: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
  };
  userB: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
  };
  messages: Message[];
  lastMessageAt: string;
}

export interface Notification {
  id: string;
  userId: string; // Recipient
  title: string;
  message: string;
  type: "request" | "approval" | "comment" | "like" | "chat" | "moderation" | "info";
  data?: {
    tripId?: string;
    chatId?: string;
    commentId?: string;
    requestedById?: string;
    reportId?: string;
  };
  read: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  itemType: "trip" | "comment" | "user" | "message";
  itemId: string;
  itemPreview: string; // Text preview of what was reported
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
}

export interface DestinationPlace {
  name: string;
  description: string;
  rating: number;
  reviewsCount: number;
  image: string;
  attractions: string[];
  hotels: { name: string; price: string; rating: number }[];
  restaurants: { name: string; cuisine: string; rating: number }[];
}
