import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load env variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Supabase configuration
const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || "https://mgiskamzhgdptbdlxyfm.supabase.co";
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, "");
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1naXNrYW16aGdkcHRiZGx4eWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMjE0NzAsImV4cCI6MjA5NTc5NzQ3MH0.uJxPKjPqzPrlu-GSPEmrn_xTkMCfnytKCu0GuTG24Ic";

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase Client initialized successfully for URL:", supabaseUrl);
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
}

// Initialize Gemini client if API key is provided
let ai: any = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini client:", err);
  }
} else {
  console.log("No GEMINI_API_KEY detected. Falling back to pre-seeded high-quality destination metadata.");
}

// Memory Database state
let users: any[] = [
  {
    id: "user-admin",
    email: "admin@travel.com",
    password: "admin123",
    name: "admin",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Admin",
    bio: "Chief travel moderator and safety overseer on TravelBag.",
    verified: true,
    trustScore: 100,
    reviews: [] as any[],
    blockList: [] as string[],
    verificationStatus: "approved" as "none" | "pending" | "approved" | "rejected",
    role: "admin" as "user" | "admin",
    travelStylePreferences: ["Adventure", "Backpacker"],
    createdAt: "2026-01-01T12:00:00Z"
  },
  {
    id: "user-harshad-2110",
    email: "harshad2110@travel.com",
    password: "Fantasticfive@4023",
    name: "harshad@2110",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=harshad",
    bio: "Super Admin at TravelBag. Managing companion interactions and platform safety.",
    verified: true,
    trustScore: 100,
    reviews: [] as any[],
    blockList: [] as string[],
    verificationStatus: "approved" as "none" | "pending" | "approved" | "rejected",
    role: "admin" as "user" | "admin",
    travelStylePreferences: ["Adventure", "Solo", "Foodie"],
    createdAt: "2026-06-01T12:00:00Z"
  },
  {
    id: "user-hasrhad-2110",
    email: "hasrhad2110@travel.com",
    password: "Fantasticfive@4023",
    name: "hasrhad@2110",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=hasrhad",
    bio: "Super Admin at TravelBag. Managing companion interactions and platform safety.",
    verified: true,
    trustScore: 100,
    reviews: [] as any[],
    blockList: [] as string[],
    verificationStatus: "approved" as "none" | "pending" | "approved" | "rejected",
    role: "admin" as "user" | "admin",
    travelStylePreferences: ["Adventure", "Solo", "Foodie"],
    createdAt: "2026-06-01T12:00:00Z"
  },
  {
    id: "user-harshad-4023",
    email: "harshad4023@travel.com",
    password: "Fantasticfive@4023",
    name: "harshad4023",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=harshad4023",
    bio: "Platform Administrator. Orchestrating itineraries & ensuring user safety.",
    verified: true,
    trustScore: 100,
    reviews: [] as any[],
    blockList: [] as string[],
    verificationStatus: "approved" as "none" | "pending" | "approved" | "rejected",
    role: "admin" as "user" | "admin",
    travelStylePreferences: ["Luxury", "Foodie", "Local Culture"],
    createdAt: "2026-06-01T12:00:00Z"
  },
  {
    id: "user-standard",
    email: "user@travel.com",
    password: "user123",
    name: "user",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=User",
    bio: "Passionate road tripper and beach vacation enthusiast.",
    verified: false,
    trustScore: 70,
    reviews: [] as any[],
    blockList: [] as string[],
    verificationStatus: "none" as "none" | "pending" | "approved" | "rejected",
    role: "user" as "user" | "admin",
    travelStylePreferences: ["Relaxing", "Foodie"],
    createdAt: "2026-01-02T12:00:00Z"
  }
];

let trips: any[] = [
  {
    id: "trip-goa-sunshine",
    title: "Sunkissed Goa Beach & Cafe Trail",
    source: "Mumbai",
    destination: "Goa",
    startDate: "2026-11-15",
    endDate: "2026-11-22",
    budget: 12000,
    travelStyle: "Relaxing",
    itinerary: [
      "Day 1: Arrive in North Goa, catch sunset at Vagator Beach",
      "Day 2: Morning wellness yoga followed by local beach shack crawl",
      "Day 3: Sightseeing South Goa Portuguese historical cathedrals",
      "Day 4: Evening party & live music at Anjuna Flea Market area",
      "Day 5: Ferry trip to peaceful Divar Island with authentic Goan lunch",
      "Day 6: Relaxed beach volleyball and water activities at Palolem Beach",
      "Day 7: Departure back with sunset coordinates memories"
    ],
    maxCompanions: 4,
    joinedCompanionIds: ["user-standard"],
    pendingCompanionIds: [] as string[],
    createdById: "user-harshad-4023",
    createdBy: {
      id: "user-harshad-4023",
      name: "harshad4023",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=harshad4023",
      verified: true,
      trustScore: 100
    },
    likes: ["user-standard", "user-harshad-2110"],
    comments: [
      {
        id: "c-goa-1",
        userId: "user-standard",
        userName: "user",
        userAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=User",
        text: "Count me in! I've been waiting for a South Goa relaxation trip.",
        createdAt: "2026-06-01T08:00:00Z"
      }
    ],
    savedBy: [] as string[],
    createdAt: "2026-06-01T00:00:00Z"
  },
  {
    id: "trip-manali-solang",
    title: "Solang Valley Adventure & Camping",
    source: "Delhi",
    destination: "Manali",
    startDate: "2026-12-05",
    endDate: "2026-12-11",
    budget: 15000,
    travelStyle: "Adventure",
    itinerary: [
      "Day 1: Arrival in Manali, sightseeing of Old Manali cafes and Hadimba Temple",
      "Day 2: Heading up to Solang Valley for paragliding & outdoor adventure team-building",
      "Day 3: Hike to secret Jogini Waterfalls with hot local Maggi and tea",
      "Day 4: Exploring frozen beauty of Rohtang Pass (depends on weather clearances)",
      "Day 5: Valley riverside camping & evening bonfire under the stars",
      "Day 6: Returning to town, purchasing local souvenirs & wood oven pizzas"
    ],
    maxCompanions: 5,
    joinedCompanionIds: [] as string[],
    pendingCompanionIds: [] as string[],
    createdById: "user-harshad-2110",
    createdBy: {
      id: "user-harshad-2110",
      name: "harshad@2110",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=harshad",
      verified: true,
      trustScore: 100
    },
    likes: [] as string[],
    comments: [] as any[],
    savedBy: [] as string[],
    createdAt: "2026-06-01T01:00:00Z"
  },
  {
    id: "trip-dwarka-spiritual",
    title: "Sacred Dwarka Temple Trail",
    source: "Ahmedabad",
    destination: "Dwarka",
    startDate: "2026-10-10",
    endDate: "2026-10-14",
    budget: 6500,
    travelStyle: "Culture",
    itinerary: [
      "Day 1: Arrive in Dwarka, participate in majestic Dwarkadhish temple afternoon aarti",
      "Day 2: Early ferry ride to Beyt Dwarka island, spiritual trails & temple visits",
      "Day 3: Gomti Ghat sunset walk, holy bath, and evening spiritual aarti ceremony",
      "Day 4: Sunset at Blue flag Shivrajpur Beach, clean waters & bird sighting",
      "Day 5: Rukmini Devi shrine and return journey back to Ahmedabad"
    ],
    maxCompanions: 3,
    joinedCompanionIds: ["user-hasrhad-2110"],
    pendingCompanionIds: [] as string[],
    createdById: "user-admin",
    createdBy: {
      id: "user-admin",
      name: "admin",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Admin",
      verified: true,
      trustScore: 100
    },
    likes: ["user-admin"],
    comments: [] as any[],
    savedBy: [] as string[],
    createdAt: "2026-06-01T02:00:00Z"
  },
  {
    id: "trip-ladakh-biking",
    title: "High Passes Ladakh Biking Expedition",
    source: "Manali",
    destination: "Ladakh",
    startDate: "2026-08-01",
    endDate: "2026-08-12",
    budget: 25000,
    travelStyle: "Adventure",
    itinerary: [
      "Day 1: Assemble in Manali for bike orientation, safety checkups & gears selection",
      "Day 2: Ride to Jispa crossing Rohtang route with high-altitude views",
      "Day 3: High-altitude biking crossing Baralacha La pass, arrive in Sarchu campsites",
      "Day 4: Riding across Gata Loops and Lachulung La, arriving in Leh town",
      "Day 5: Rest & acclimatization day in Leh, exploring Shanti Stupa",
      "Day 6: Conquering Khardung La (highest motorized pass), driving to Nubra Valley",
      "Day 7: Nubra Valley to breathtaking blue waters of Pangong Tso Lake",
      "Day 8: Pancake sunrise overlooking Pangong, return biking ride to Leh town"
    ],
    maxCompanions: 6,
    joinedCompanionIds: [] as string[],
    pendingCompanionIds: [] as string[],
    createdById: "user-harshad-2110",
    createdBy: {
      id: "user-harshad-2110",
      name: "harshad@2110",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=harshad",
      verified: true,
      trustScore: 100
    },
    likes: ["user-admin", "user-standard"],
    comments: [] as any[],
    savedBy: [] as string[],
    createdAt: "2026-06-01T03:00:00Z"
  },
  {
    id: "trip-pune-heritage",
    title: "Pune Fort Trekking & Food Walk",
    source: "Mumbai",
    destination: "Pune",
    startDate: "2026-09-15",
    endDate: "2026-09-17",
    budget: 4000,
    travelStyle: "Foodie",
    itinerary: [
      "Day 1: Arrive in Pune via Expressway caravan, evening Shaniwar Wada heritage walk and delicious misal-pav tasting trail",
      "Day 2: Early morning hiking expedition to historical Sinhagad Fort, drinking organic buttermilk & pitla bhakri",
      "Day 3: Craft brewery tasting in Koregaon Park and departure back to Mumbai"
    ],
    maxCompanions: 5,
    joinedCompanionIds: [] as string[],
    pendingCompanionIds: [] as string[],
    createdById: "user-hasrhad-2110",
    createdBy: {
      id: "user-hasrhad-2110",
      name: "hasrhad@2110",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=hasrhad",
      verified: true,
      trustScore: 100
    },
    likes: [],
    comments: [] as any[],
    savedBy: [] as string[],
    createdAt: "2026-06-01T04:00:00Z"
  },
  {
    id: "trip-mumbai-monsoon",
    title: "Marine Drive Monsoon Backpacker",
    source: "Pune",
    destination: "Mumbai",
    startDate: "2026-07-20",
    endDate: "2026-07-22",
    budget: 3500,
    travelStyle: "Backpacker",
    itinerary: [
      "Day 1: Train to Mumbai, local train hopping, and monsoon stroll along beautiful Marine Drive promenade with hot tea and pakodas",
      "Day 2: Street food tour around Chaupati, Gateway of India, and Colaba Causeway shopping",
      "Day 3: Sunrise cycle tour across South Bombay architecture lanes, return ride"
    ],
    maxCompanions: 4,
    joinedCompanionIds: [] as string[],
    pendingCompanionIds: [] as string[],
    createdById: "user-standard",
    createdBy: {
      id: "user-standard",
      name: "user",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=User",
      verified: false,
      trustScore: 70
    },
    likes: ["user-hasrhad-2110"],
    comments: [] as any[],
    savedBy: [] as string[],
    createdAt: "2026-06-01T05:00:00Z"
  }
];

let groupDetails: any[] = [
  {
    tripId: "trip-goa-sunshine",
    messages: [
      {
        id: "m-goa-init",
        senderId: "system",
        senderName: "TravelBag Bot",
        senderAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=travelbag",
        content: "Travel Group Chat initialized for 'Sunkissed Goa Beach & Cafe Trail'. Explore planning, budgets, lodging, and coordinate securely!",
        timestamp: "2026-06-01T05:01:00Z",
        type: "system"
      }
    ],
    polls: [] as any[]
  },
  {
    tripId: "trip-manali-solang",
    messages: [
      {
        id: "m-manali-init",
        senderId: "system",
        senderName: "TravelBag Bot",
        senderAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=travelbag",
        content: "Travel Group Chat initialized for 'Solang Valley Adventure & Camping'. Explore planning, budgets, lodging, and coordinate securely!",
        timestamp: "2026-06-01T05:02:00Z",
        type: "system"
      }
    ],
    polls: [] as any[]
  },
  {
    tripId: "trip-dwarka-spiritual",
    messages: [
      {
        id: "m-dwarka-init",
        senderId: "system",
        senderName: "TravelBag Bot",
        senderAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=travelbag",
        content: "Travel Group Chat initialized for 'Sacred Dwarka Temple Trail'. Explore planning, budgets, lodging, and coordinate securely!",
        timestamp: "2026-06-01T05:03:00Z",
        type: "system"
      }
    ],
    polls: [] as any[]
  },
  {
    tripId: "trip-ladakh-biking",
    messages: [
      {
        id: "m-ladakh-init",
        senderId: "system",
        senderName: "TravelBag Bot",
        senderAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=travelbag",
        content: "Travel Group Chat initialized for 'High Passes Ladakh Biking Expedition'. Explore planning, budgets, lodging, and coordinate securely!",
        timestamp: "2026-06-01T05:04:00Z",
        type: "system"
      }
    ],
    polls: [] as any[]
  },
  {
    tripId: "trip-pune-heritage",
    messages: [
      {
        id: "m-pune-init",
        senderId: "system",
        senderName: "TravelBag Bot",
        senderAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=travelbag",
        content: "Travel Group Chat initialized for 'Pune Fort Trekking & Food Walk'. Explore planning, budgets, lodging, and coordinate securely!",
        timestamp: "2026-06-01T05:05:00Z",
        type: "system"
      }
    ],
    polls: [] as any[]
  },
  {
    tripId: "trip-mumbai-monsoon",
    messages: [
      {
        id: "m-mumbai-init",
        senderId: "system",
        senderName: "TravelBag Bot",
        senderAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=travelbag",
        content: "Travel Group Chat initialized for 'Marine Drive Monsoon Backpacker'. Explore planning, budgets, lodging, and coordinate securely!",
        timestamp: "2026-06-01T05:06:00Z",
        type: "system"
      }
    ],
    polls: [] as any[]
  }
];

let privateChats: any[] = [];

let notifications: any[] = [];

let reports: any[] = [];

// Supabase State Synchronization and Loading Management
let isDirty = false;

function markDirty() {
  isDirty = true;
}

async function runBackgroundSync() {
  if (!supabase || !isDirty) return;
  isDirty = false;
  console.log("Supabase Background Sync: Saving latest state...");
  try {
    const results = await Promise.allSettled([
      users.length > 0 ? supabase.from("users").upsert(
        users.map((u: any) => ({
          id: u.id,
          email: u.email,
          password: u.password || "goa123",
          name: u.name,
          avatar: u.avatar,
          bio: u.bio,
          verified: !!u.verified,
          trustScore: u.trustScore,
          verificationStatus: u.verificationStatus || "none",
          verificationDocUrl: u.verificationDocUrl || null,
          verificationDocsPreview: u.verificationDocsPreview || null,
          role: u.role || "user",
          travelStylePreferences: u.travelStylePreferences || [],
          reviews: u.reviews || [],
          blockList: u.blockList || [],
          createdAt: u.createdAt || new Date().toISOString(),
          dateOfBirth: u.dateOfBirth || null,
          currentCity: u.currentCity || null,
          showDetailsToOthers: u.showDetailsToOthers !== false
        }))
      ) : Promise.resolve(),
      trips.length > 0 ? supabase.from("trips").upsert(
        trips.map(t => ({
          id: t.id,
          title: t.title,
          source: t.source,
          destination: t.destination,
          startDate: t.startDate,
          endDate: t.endDate,
          budget: t.budget,
          travelStyle: t.travelStyle,
          itinerary: t.itinerary || [],
          maxCompanions: t.maxCompanions || 4,
          joinedCompanionIds: t.joinedCompanionIds || [],
          pendingCompanionIds: t.pendingCompanionIds || [],
          createdById: t.createdById,
          createdBy: {
            id: t.createdBy?.id,
            name: t.createdBy?.name,
            avatar: t.createdBy?.avatar,
            verified: !!t.createdBy?.verified,
            trustScore: t.createdBy?.trustScore || 60,
            completed: !!t.completed
          },
          completed: !!t.completed,
          likes: t.likes || [],
          comments: t.comments || [],
          savedBy: t.savedBy || [],
          createdAt: t.createdAt || new Date().toISOString()
        }))
      ) : Promise.resolve(),
      groupDetails.length > 0 ? (async () => {
        const payload = groupDetails.map(gd => ({
          tripId: gd.tripId,
          messages: gd.messages || [],
          polls: gd.polls || [],
          expenses: gd.expenses || []
        }));
        const { error } = await supabase.from("group_details").upsert(payload);
        if (error) {
          console.warn("Supabase upsert failure for group_details:", error.message);
          if (error.code === "42703" || error.message?.includes("column \"expenses\"")) {
            console.warn("Supabase 'expenses' column does not exist on 'group_details' table. Retrying with memory-only fallback upsert.");
            const fallbackPayload = groupDetails.map(gd => ({
              tripId: gd.tripId,
              messages: gd.messages || [],
              polls: gd.polls || []
            }));
            await supabase.from("group_details").upsert(fallbackPayload);
          }
        }
      })() : Promise.resolve(),
      privateChats.length > 0 ? supabase.from("private_chats").upsert(
        privateChats.map(pc => ({
          id: pc.id,
          userA: {
            id: pc.userA?.id,
            name: pc.userA?.name,
            avatar: pc.userA?.avatar,
            verified: !!pc.userA?.verified
          },
          userB: {
            id: pc.userB?.id,
            name: pc.userB?.name,
            avatar: pc.userB?.avatar,
            verified: !!pc.userB?.verified
          },
          messages: pc.messages || [],
          lastMessageAt: pc.lastMessageAt || new Date().toISOString()
        }))
      ) : Promise.resolve(),
      notifications.length > 0 ? supabase.from("notifications").upsert(
        notifications.map(n => ({
          id: n.id,
          userId: n.userId,
          title: n.title,
          message: n.message,
          type: n.type,
          data: n.data || {},
          read: !!n.read,
          createdAt: n.createdAt || new Date().toISOString()
        }))
      ) : Promise.resolve(),
      reports.length > 0 ? supabase.from("reports").upsert(
        reports.map(r => ({
          id: r.id,
          reporterId: r.reporterId,
          reporterName: r.reporterName,
          itemType: r.itemType,
          itemId: r.itemId,
          itemPreview: r.itemPreview,
          reason: r.reason,
          status: r.status || "pending",
          createdAt: r.createdAt || new Date().toISOString()
        }))
      ) : Promise.resolve(),
    ]);

    results.forEach((res, idx) => {
      const idxToName = ["users", "trips", "group_details", "private_chats", "notifications", "reports"];
      if (res.status === "rejected") {
        console.warn(`Supabase Background Sync Failed for [${idxToName[idx]}]:`, res.reason);
      } else if (res.value && res.value.error) {
        console.warn(`Supabase Background Sync Warning [${idxToName[idx]}]:`, res.value.error.message);
      }
    });
  } catch (err: any) {
    console.error("Exception during background sync:", err.message);
  }
}

// Periodic check for dirty state
setInterval(runBackgroundSync, 5000);

// Express middleware to set the dirty synchronizer on modification requests
app.use((req: any, res: any, next: any) => {
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    res.on("finish", () => {
      markDirty();
      setTimeout(runBackgroundSync, 500);
    });
  }
  next();
});

// Seed top destinations details
const topDestinations: Record<string, any> = {
  "goa": {
    name: "Goa",
    description: "Sunkissed beaches, glorious Portuguese-influenced cathedrals, vibrant nightlife trails, and cozy local cafes. Perfect destination for slow seaside travel, yoga paths, and fresh culinary seafood adventures.",
    rating: 4.8,
    reviewsCount: 1420,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    attractions: ["Calangute & Palolem Beaches", "Dudhsagar Waterfalls", "Basilica of Bom Jesus (UNESCO Site)", "Anjuna Flea Market & Cafes", "Fontainhas Latin Quarter"],
    hotels: [
      { name: "Saffron Eco-Resort Arambol", price: "₹2,500/night", rating: 4.9 },
      { name: "Taj Exotica South Goa", price: "₹18,000/night", rating: 4.8 },
      { name: "The Hostel Crowd Anjuna", price: "₹800/night", rating: 4.6 }
    ],
    restaurants: [
      { name: "Curlies Beach Shack", cuisine: "Goan Seafood & Drinks", rating: 4.5 },
      { name: "Gunpowder Assagao", cuisine: "South Indian Coastal", rating: 4.7 },
      { name: "Arambol Wellness Cafe", cuisine: "Vegan & Organic juices", rating: 4.8 }
    ]
  },
  "manali": {
    name: "Manali",
    description: "The gateway to Solang Valley and Rohtang Pass, nestled in the snow-capped Himachal range. Rich in pine forests, river rafting channels, ski slopes, and apple orchards.",
    rating: 4.7,
    reviewsCount: 980,
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1200&q=80",
    attractions: ["Hadimba Temple", "Solang Valley adventure park", "Rohtang Pass high altitude site", "Old Manali streets & cafes", "Jogini Waterfall trek"],
    hotels: [
      { name: "Zostel Homes Old Manali", price: "₹1,200/night", rating: 4.7 },
      { name: "The Himalayan Luxe Castle", price: "₹9,500/night", rating: 4.8 },
      { name: "Pineview Backpacker Base", price: "₹600/night", rating: 4.4 }
    ],
    restaurants: [
      { name: "Cafe 1947", cuisine: "Italian & Live Music", rating: 4.6 },
      { name: "Johnson Cafe", cuisine: "Trout Specialities & Drinks", rating: 4.7 },
      { name: "IL Forno", cuisine: "Woodfired Pizzas", rating: 4.5 }
    ]
  },
  "dwarka": {
    name: "Dwarka",
    description: "Steeped in sacred cosmic history, Dwarka is the legendary capital of Lord Krishna's kingdom. Famous for coastal scenic views, maritime heritage, and majestic architectures.",
    rating: 4.6,
    reviewsCount: 750,
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0db?auto=format&fit=crop&w=1200&q=80",
    attractions: ["Dwarkadhish Temple (Jagat Mandir)", "Beyt Dwarka island ferry", "Gomti Ghat & Evening Aarti", "Shivrajpur Blue Flag Beach", "Rukmini Devi Temple"],
    hotels: [
      { name: "Goverdhan Greens Heritage Resort", price: "₹3,200/night", rating: 4.6 },
      { name: "VITS Devbhumi Dwarka", price: "₹4,500/night", rating: 4.4 },
      { name: "Dwarka Pilgrim Dormitory", price: "₹500/night", rating: 4.2 }
    ],
    restaurants: [
      { name: "Chappan Bhog Thali", cuisine: "Traditional Gujrati Thali", rating: 4.8 },
      { name: "Shreenathji Dining Hall", cuisine: "Pure Vegetarian Indian", rating: 4.5 },
      { name: "Blue Beach Cafe Shivrajpur", cuisine: "Snacks & Mocktails", rating: 4.3 }
    ]
  },
  "ladakh": {
    name: "Ladakh",
    description: "A high-altitude desert framed by dramatic jagged peaks, cobalt lakes, and majestic Tibetan monasteries. The ultimate destination for bikers, road-trippers, and thrill-seekers around the globe.",
    rating: 4.9,
    reviewsCount: 1650,
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    attractions: ["Pangong Tso Cobalt Lake", "Nubra Valley Sand Dunes", "Khardung La (One of the highest motorable roads)", "Thiksey Monastery Complex", "Magnetic Hill & Confluence"],
    hotels: [
      { name: "The Grand Dragon Ladakh", price: "₹12,500/night", rating: 4.9 },
      { name: "Pangong Lake Luxury Camps", price: "₹4,500/night", rating: 4.6 },
      { name: "Leh Backpacker Hostel", price: "₹900/night", rating: 4.7 }
    ],
    restaurants: [
      { name: "The Tibetan Kitchen Leh", cuisine: "Momos, Thukpa & Traditional Ladakhi", rating: 4.8 },
      { name: "Gesmo Restaurant & Bakery", cuisine: "Yak Cheese Pizza & Yak Burgers", rating: 4.6 },
      { name: "Leh Cafe Shanti", cuisine: "Organic Greens, Ginger Tea", rating: 4.5 }
    ]
  },
  "mumbai": {
    name: "Mumbai",
    description: "The City of Dreams. A buzzing metropolis blending grand colonial history, famous sea faces like Marine Drive, rich Bollywood subcultures, and delicious local vada pavs.",
    rating: 4.6,
    reviewsCount: 1850,
    image: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=1200&q=80",
    attractions: ["Gateway of India", "Marine Drive Sea Face", "Colaba Causeway shopping", "Haji Ali Dargah", "Elephanta Caves ferry trail"],
    hotels: [
      { name: "Taj Mahal Palace Colaba", price: "₹24,000/night", rating: 4.9 },
      { name: "The Gordon House Boutique Hotel", price: "₹8,000/night", rating: 4.5 },
      { name: "Cohostel Bandra", price: "₹1,100/night", rating: 4.6 }
    ],
    restaurants: [
      { name: "Leopold Cafe Colaba", cuisine: "Multicuisine Historic hangout", rating: 4.3 },
      { name: "Bademiya Kebabs Colaba", cuisine: "Mughlai Street food", rating: 4.4 },
      { name: "Britannia & Co.", cuisine: "Traditional Parsi Berry pulao", rating: 4.7 }
    ]
  },
  "pune": {
    name: "Pune",
    description: "The Oxford of the East. Framed by rich Maratha history, beautiful fort treks like Sinhagad, vibrant youth-driven cafe cultures, and peaceful green oases.",
    rating: 4.5,
    reviewsCount: 820,
    image: "https://images.unsplash.com/photo-1601058498522-834cfa735fc3?auto=format&fit=crop&w=1200&q=80",
    attractions: ["Shaniwar Wada Palace", "Sinhagad Fort trek", "Koregaon Park cafe trails", "Aga Khan Palace", "Osho Meditation Resort Garden"],
    hotels: [
      { name: "Conrad Pune Luxury Hotel", price: "₹11,000/night", rating: 4.8 },
      { name: "Koregaon Park Serene Hotel", price: "₹3,500/night", rating: 4.4 },
      { name: "Gostops Backpacker Pune", price: "₹750/night", rating: 4.5 }
    ],
    restaurants: [
      { name: "Effingut Koregaon Park", cuisine: "Craft Brewery & Pub Fare", rating: 4.6 },
      { name: "Vaishali Cafe FC Road", cuisine: "South Indian SPDP & Filters", rating: 4.5 },
      { name: "Kayani Bakery", cuisine: "Mastro Butter Shrewsbury biscuits", rating: 4.7 }
    ]
  }
};

// Gemini Destination intelligence Generator Endpoint
app.get("/api/destinations/info", async (req, res) => {
  const query = (req.query.query as string || "").toLowerCase().trim();
  if (!query) {
    return res.status(400).json({ error: "Missing query" });
  }

  // Look for exact key match first
  let targetKey = Object.keys(topDestinations).find(k => query.includes(k) || k.includes(query));

  if (ai) {
    try {
      console.log(`Querying Gemini model 'gemini-3.5-flash' for destination details of: ${query}`);
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Provide travel information for the city/destination: "${query}". Return the output strictly in the following JSON schema format. Return ONLY standard JSON object, do not wrap in markdown quotes.
        
        {
          "name": "Proper City Name",
          "description": "Attractive 3-sentence description highlighting why travel companions should visit this location.",
          "rating": 4.5,
          "reviewsCount": 250,
          "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
          "attractions": ["Attraction Title 1", "Attraction Title 2", "Attraction Title 3", "Attraction Title 4"],
          "hotels": [
            {"name": "Luxury Hotel Name", "price": "₹15,000/night", "rating": 4.8},
            {"name": "Boutique Hotel Name", "price": "₹4,500/night", "rating": 4.5},
            {"name": "Cozy Hostel Name", "price": "₹800/night", "rating": 4.6}
          ],
          "restaurants": [
            {"name": "Popular restaurant 1", "cuisine": "What kind of dish", "rating": 4.7},
            {"name": "Traditional restaurant 2", "cuisine": "Local specialization", "rating": 4.6}
          ]
        }`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const payload = JSON.parse(cleaned);
      
      // Inject unsplash fallback if image link is broken or placeholder
      if (!payload.image || payload.image.includes("unsplash.com/photo-1507525")) {
        const queryImageMap: Record<string, string> = {
          goa: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200",
          manali: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200",
          dwarka: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200",
          ladakh: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200",
          mumbai: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=1200",
          pune: "https://images.unsplash.com/photo-1601058498522-834cfa735fc3?auto=format&fit=crop&w=1200"
        };
        const searchKey = Object.keys(queryImageMap).find(k => k.includes(query) || query.includes(k));
        payload.image = queryImageMap[searchKey || "goa"] || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200";
      }

      return res.json(payload);
    } catch (err) {
      console.error("Gemini context retrieval failed, using fallback database:", err);
    }
  }

  // Fallback to static pre-seeded database
  const finalKey = targetKey || "goa";
  const data = topDestinations[finalKey];
  return res.json({
    ...data,
    name: targetKey ? data.name : (query.charAt(0).toUpperCase() + query.slice(1))
  });
});

app.get("/api/debug/sync-status", async (req, res) => {
  if (!supabase) {
    return res.json({
      initialized: false,
      error: "Supabase client is not initialized in server.ts. Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env variables."
    });
  }

  const results: any = {};
  
  // Test connection
  try {
    const { data, error } = await supabase.from("users").select("count");
    results.testConnection = { data, error };
  } catch (err: any) {
    results.testConnection = { error: err.message };
  }

  // Run dynamic users upsert
  try {
    const { data, error } = await supabase.from("users").upsert(
      users.map((u: any) => ({
        id: u.id,
        email: u.email,
        password: u.password || "goa123",
        name: u.name,
        avatar: u.avatar,
        bio: u.bio,
        verified: !!u.verified,
        trustScore: u.trustScore,
        verificationStatus: u.verificationStatus || "none",
        verificationDocUrl: u.verificationDocUrl || null,
        verificationDocsPreview: u.verificationDocsPreview || null,
        role: u.role || "user",
        travelStylePreferences: u.travelStylePreferences || [],
        reviews: u.reviews || [],
        blockList: u.blockList || [],
        createdAt: u.createdAt || new Date().toISOString(),
        dateOfBirth: u.dateOfBirth || null,
        currentCity: u.currentCity || null,
        showDetailsToOthers: u.showDetailsToOthers !== false
      }))
    );
    results.usersUpsert = { success: !error, error };
  } catch (err: any) {
    results.usersUpsert = { success: false, error: err.message };
  }

  // Run dynamic trips upsert
  if (trips.length > 0) {
    try {
      const { data, error } = await supabase.from("trips").upsert(
        trips.slice(0, 1).map(t => ({
          id: t.id,
          title: t.title,
          source: t.source,
          destination: t.destination,
          startDate: t.startDate,
          endDate: t.endDate,
          budget: t.budget,
          travelStyle: t.travelStyle,
          itinerary: t.itinerary || [],
          maxCompanions: t.maxCompanions || 4,
          joinedCompanionIds: t.joinedCompanionIds || [],
          pendingCompanionIds: t.pendingCompanionIds || [],
          createdById: t.createdById,
          createdBy: {
            id: t.createdBy?.id,
            name: t.createdBy?.name,
            avatar: t.createdBy?.avatar,
            verified: !!t.createdBy?.verified,
            trustScore: t.createdBy?.trustScore || 60,
            completed: !!t.completed
          },
          completed: !!t.completed,
          likes: t.likes || [],
          comments: t.comments || [],
          savedBy: t.savedBy || [],
          createdAt: t.createdAt || new Date().toISOString()
        }))
      );
      results.tripsUpsert = { success: !error, error };
    } catch (err: any) {
      results.tripsUpsert = { success: false, error: err.message };
    }
  }

  return res.json(results);
});

// API AUTH ROUTE SIMULATIONS
app.post("/api/auth/register", async (req, res) => {
  const { username, password, email, reqRole, fullName, bio, travelStylePreferences, gender } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required for registration." });
  }

  const normalizedName = username.trim().toLowerCase();
  const existing = users.find(u => u.name.toLowerCase() === normalizedName);
  if (existing) {
    return res.status(400).json({ error: "Username is already taken by another companion." });
  }

  const finalEmail = email ? email.trim() : `${username.trim()}@travel.com`;

  let userId = `user-${Date.now()}`;
  if (supabase) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: finalEmail,
        password: password,
        options: {
          data: {
            name: fullName && fullName.trim() ? fullName.trim() : username.trim(),
            role: reqRole === "admin" ? "admin" : "user",
          }
        }
      });
      if (authError) {
        console.error("Supabase auth signUp error:", authError.message);
      } else if (authData && authData.user) {
        userId = authData.user.id;
        console.log("Successfully registered user in Supabase Auth:", userId);
      }
    } catch (err: any) {
      console.error("Exception during supabase auth signUp:", err.message);
    }
  }

  const newUser = {
    id: userId,
    email: finalEmail,
    password: password,
    name: fullName && fullName.trim() ? fullName.trim() : username.trim(),
    avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username.trim()}`,
    bio: bio && bio.trim() ? bio.trim() : "New Travel Companion on TravelBag!",
    verified: false,
    trustScore: 60,
    reviews: [] as any[],
    blockList: [] as string[],
    verificationStatus: "none" as "none" | "pending" | "approved" | "rejected",
    role: (reqRole === "admin" ? "admin" : "user") as "user" | "admin",
    travelStylePreferences: Array.isArray(travelStylePreferences) ? travelStylePreferences : [] as string[],
    gender: gender || "Male",
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  markDirty();
  setTimeout(runBackgroundSync, 200);

  return res.json({ session: { user: newUser } });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password, loginType } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Please provide both username/email and password." });
  }

  const match = users.find(u => 
    (u.name.toLowerCase() === username.trim().toLowerCase() || u.email.toLowerCase() === username.trim().toLowerCase()) &&
    u.password === password
  );

  if (match) {
    if (loginType && match.role !== loginType) {
      return res.status(403).json({ error: `You are attempting to log in as an ${loginType}, but this account holds the role of ${match.role}.` });
    }
    return res.json({ session: { user: match } });
  }
  return res.status(401).json({ error: "Invalid username or password details." });
});

app.post("/api/auth/update", (req, res) => {
  const { id, name, bio, travelStylePreferences, avatar, dateOfBirth, currentCity, showDetailsToOthers, gender } = req.body;
  const matchIdx = users.findIndex(u => u.id === id);
  if (matchIdx !== -1) {
    const updated = {
      ...users[matchIdx],
      name: name || users[matchIdx].name,
      bio: bio || users[matchIdx].bio,
      avatar: avatar || users[matchIdx].avatar,
      travelStylePreferences: travelStylePreferences || users[matchIdx].travelStylePreferences,
      dateOfBirth: dateOfBirth !== undefined ? dateOfBirth : users[matchIdx].dateOfBirth,
      currentCity: currentCity !== undefined ? currentCity : users[matchIdx].currentCity,
      showDetailsToOthers: showDetailsToOthers !== undefined ? showDetailsToOthers : users[matchIdx].showDetailsToOthers,
      gender: gender !== undefined ? gender : users[matchIdx].gender
    };
    users[matchIdx] = updated;

    // Trigger local state persistence to Supabase database
    markDirty();
    setTimeout(runBackgroundSync, 200);

    // Update creator details cached in trips
    trips.forEach((t, index) => {
      if (t.createdById === id) {
        trips[index].createdBy = {
          id: updated.id,
          name: updated.name,
          avatar: updated.avatar,
          verified: updated.verified,
          trustScore: updated.trustScore
        };
      }
    });

    return res.json({ user: updated });
  }
  return res.status(404).json({ error: "User profile not found" });
});

app.get("/api/users", (req, res) => {
  return res.json(users);
});

// PRIVATE CHATS
app.get("/api/chats/private", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const conversationList = privateChats.filter(fc => fc.userA.id === userId || fc.userB.id === userId);
  return res.json(conversationList);
});

app.post("/api/chats/private/message", (req, res) => {
  const { senderId, recipientId, content } = req.body;
  
  // Find or create chat session
  let chat = privateChats.find(pc => 
    (pc.userA.id === senderId && pc.userB.id === recipientId) ||
    (pc.userA.id === recipientId && pc.userB.id === senderId)
  );

  const senderObj = users.find(u => u.id === senderId);
  const recipientObj = users.find(u => u.id === recipientId);

  if (!senderObj || !recipientObj) {
    return res.status(404).json({ error: "User profiles not found" });
  }

  // Row Level Security Sim: Check if either user is blocked by the other
  if (senderObj.blockList.includes(recipientId) || recipientObj.blockList.includes(senderId)) {
    return res.status(403).json({ error: "Secure communications blocked. A participant has active blocks." });
  }

  const newMessage = {
    id: `msg-${Date.now()}`,
    senderId,
    senderName: senderObj.name,
    senderAvatar: senderObj.avatar,
    content,
    timestamp: new Date().toISOString(),
    type: "text" as const
  };

  if (!chat) {
    chat = {
      id: `pchat-${Date.now()}`,
      userA: {
        id: senderObj.id,
        name: senderObj.name,
        avatar: senderObj.avatar,
        verified: senderObj.verified
      },
      userB: {
        id: recipientObj.id,
        name: recipientObj.name,
        avatar: recipientObj.avatar,
        verified: recipientObj.verified
      },
      messages: [newMessage],
      lastMessageAt: newMessage.timestamp
    };
    privateChats.push(chat);
  } else {
    chat.messages.push(newMessage);
    chat.lastMessageAt = newMessage.timestamp;
  }

  // Push private notification to recipient
  notifications.push({
    id: `notif-${Date.now()}`,
    userId: recipientId,
    title: `New Message from ${senderObj.name}`,
    message: content.length > 40 ? `${content.slice(0, 40)}...` : content,
    type: "chat",
    data: { chatId: chat.id, requestedById: senderId },
    read: false,
    createdAt: new Date().toISOString()
  });

  return res.json(chat);
});

// TRAVEL TRIPS
app.get("/api/trips", (req, res) => {
  const { query, source, travelStyle, maxBudget, userId, includeCompleted } = req.query;
  let list = [...trips];

  // Filter out completed trips or trips expired for more than 3 days for everyone
  list = list.filter(t => {
    // Filter complete status
    const isCompleted = !!t.completed || !!t.createdBy?.completed;
    if (isCompleted && includeCompleted !== "true") return false;

    // Filter expiration status (more than 3 days after end date)
    if (t.endDate) {
      try {
        const endDateTime = new Date(t.endDate).getTime();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        const expireTime = endDateTime + threeDaysMs;
        if (Date.now() > expireTime) {
          return false;
        }
      } catch (e) {}
    }
    return true;
  });

  // RLS Simulation: Filter out content if author blocked user
  if (userId) {
    const activeUser = users.find(u => u.id === userId);
    const userBlocks = activeUser?.blockList || [];
    list = list.filter(t => !userBlocks.includes(t.createdById));
    // Also filter out trips created by users who blocked the activeUser
    list = list.filter(t => {
      const author = users.find(u => u.id === t.createdById);
      return !author?.blockList.includes(userId as string);
    });
  }

  if (query) {
    const qString = (query as string).toLowerCase().trim();
    list = list.filter(t => 
      t.destination.toLowerCase().includes(qString) ||
      t.source.toLowerCase().includes(qString) ||
      t.title.toLowerCase().includes(qString)
    );
  }

  if (source) {
    const sString = (source as string).toLowerCase().trim();
    list = list.filter(t =>
      t.source.toLowerCase().includes(sString) ||
      t.destination.toLowerCase().includes(sString) ||
      t.title.toLowerCase().includes(sString)
    );
  }

  if (travelStyle) {
    list = list.filter(t => t.travelStyle.toLowerCase() === (travelStyle as string).toLowerCase());
  }

  if (maxBudget) {
    const limit = parseInt(maxBudget as string, 10);
    list = list.filter(t => t.budget <= limit);
  }

  return res.json(list);
});

app.post("/api/trips/:id/complete", async (req, res) => {
  const { userId } = req.body;
  const trip = trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  if (trip.createdById !== userId) {
    return res.status(403).json({ error: "Only the trip owner can mark it as complete" });
  }

  trip.completed = true;
  if (trip.createdBy) {
    trip.createdBy.completed = true;
  }

  markDirty();
  await runBackgroundSync();

  return res.json(trip);
});

app.post("/api/trips", (req, res) => {
  const { title, source, destination, startDate, endDate, budget, travelStyle, itinerary, maxCompanions, createdById } = req.body;
  if (!title || !destination || !createdById) {
    return res.status(400).json({ error: "Missing mandatory fields" });
  }

  const creator = users.find(u => u.id === createdById);
  if (!creator) return res.status(400).json({ error: "Creator not found" });

  const newTrip = {
    id: `trip-${Date.now()}`,
    title,
    source: source || "Flexible",
    destination,
    startDate,
    endDate,
    budget: parseInt(budget, 10) || 5000,
    travelStyle: travelStyle || "Adventure",
    itinerary: Array.isArray(itinerary) ? itinerary : [itinerary].filter(Boolean),
    maxCompanions: parseInt(maxCompanions, 10) || 4,
    joinedCompanionIds: [] as string[],
    pendingCompanionIds: [] as string[],
    createdById,
    createdBy: {
      id: creator.id,
      name: creator.name,
      avatar: creator.avatar,
      verified: creator.verified,
      trustScore: creator.trustScore
    },
    likes: [] as any[],
    comments: [] as any[],
    savedBy: [] as any[],
    createdAt: new Date().toISOString()
  };

  trips.push(newTrip);

  // Initialize Private Group
  groupDetails.push({
    tripId: newTrip.id,
    messages: [
      {
        id: `gm-init-${Date.now()}`,
        senderId: "system",
        senderName: "TravelBag Bot",
        senderAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=travelbag",
        content: `Travel Group Chat initialized for '${newTrip.title}'. Explore planning, budgets, lodging, and coordinate securely!`,
        timestamp: new Date().toISOString(),
        type: "system"
      }
    ],
    polls: [] as any[]
  });

  markDirty();
  setTimeout(runBackgroundSync, 200);

  return res.json(newTrip);
});

// Trip Join Requests / Approvals
app.post("/api/trips/:id/request-join", (req, res) => {
  const { userId } = req.body;
  const trip = trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  if (trip.createdById === userId) {
    return res.status(400).json({ error: "You are the creator of this trip group" });
  }

  if (trip.joinedCompanionIds.includes(userId)) {
    return res.status(400).json({ error: "You are already an approved companion!" });
  }

  if (trip.pendingCompanionIds.includes(userId)) {
    return res.status(400).json({ error: "Your companion request is already pending review" });
  }

  trip.pendingCompanionIds.push(userId);

  // Notify Owner
  const requestingUser = users.find(u => u.id === userId);
  notifications.push({
    id: `notif-${Date.now()}`,
    userId: trip.createdById,
    title: "Companion Request",
    message: `${requestingUser?.name || "A traveler"} wants to join your trip to ${trip.destination}!`,
    type: "request",
    data: { tripId: trip.id, requestedById: userId },
    read: false,
    createdAt: new Date().toISOString()
  });

  markDirty();
  setTimeout(runBackgroundSync, 200);

  return res.json(trip);
});

app.post("/api/trips/:id/approve-join", (req, res) => {
  const { companyId, approved } = req.body; // approved is boolean
  const trip = trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  // Remove elements from pending
  trip.pendingCompanionIds = trip.pendingCompanionIds.filter(pid => pid !== companyId);

  // Auto-mark the request notification as read
  notifications.forEach(n => {
    if (
      n.userId === trip.createdById && 
      n.type === "request" && 
      n.data && 
      n.data.tripId === trip.id && 
      n.data.requestedById === companyId
    ) {
      n.read = true;
    }
  });

  if (approved) {
    if (!trip.joinedCompanionIds.includes(companyId)) {
      trip.joinedCompanionIds.push(companyId);
    }

    // Add partner to private group with system messages
    const group = groupDetails.find(gd => gd.tripId === trip.id);
    const newUser = users.find(u => u.id === companyId);
    if (group && newUser) {
      group.messages.push({
        id: `gm-join-${Date.now()}`,
        senderId: "system",
        senderName: "TravelBag Bot",
        senderAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=travelbag",
        content: `${newUser.name} has joined the travel group! Let's say hi and align on dates/budget!`,
        timestamp: new Date().toISOString(),
        type: "system"
      });
    }

    // Send notification to applicant
    notifications.push({
      id: `notif-${Date.now()}`,
      userId: companyId,
      title: "Trip Request Approved!",
      message: `Your request to join '${trip.title}' was approved by ${trip.createdBy.name}. Welcome aboard!`,
      type: "approval",
      data: { tripId: trip.id },
      read: false,
      createdAt: new Date().toISOString()
    });
  } else {
    // Rejected notification
    notifications.push({
      id: `notif-${Date.now()}`,
      userId: companyId,
      title: "Trip Request Update",
      message: `Your request to join '${trip.title}' was not accepted at this time. Keep searching other companions!`,
      type: "info",
      data: { tripId: trip.id },
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  markDirty();
  setTimeout(runBackgroundSync, 200);

  return res.json(trip);
});

// COMMENTS & LIKES & SAVING
app.post("/api/trips/:id/like", (req, res) => {
  const { userId } = req.body;
  const trip = trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const likedIdx = trip.likes.indexOf(userId);
  if (likedIdx === -1) {
    trip.likes.push(userId);
    // Send user specific like notification
    if (trip.createdById !== userId) {
      const liker = users.find(u => u.id === userId);
      notifications.push({
        id: `notif-${Date.now()}`,
        userId: trip.createdById,
        title: "Trip Liked",
        message: `${liker?.name || "A traveler"} liked your trip to ${trip.destination}!`,
        type: "like",
        data: { tripId: trip.id },
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  } else {
    trip.likes.splice(likedIdx, 1);
  }
  return res.json(trip);
});

app.post("/api/trips/:id/save", (req, res) => {
  const { userId } = req.body;
  const trip = trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const savedIdx = trip.savedBy.indexOf(userId);
  if (savedIdx === -1) {
    trip.savedBy.push(userId);
  } else {
    trip.savedBy.splice(savedIdx, 1);
  }
  return res.json(trip);
});

app.post("/api/trips/:id/comment", (req, res) => {
  const { userId, text } = req.body;
  const trip = trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const commenter = users.find(u => u.id === userId);
  if (!commenter) return res.status(404).json({ error: "Commenter profile not found" });

  const commentObj = {
    id: `comm-${Date.now()}`,
    userId,
    userName: commenter.name,
    userAvatar: commenter.avatar,
    text,
    createdAt: new Date().toISOString()
  };

  trip.comments.push(commentObj);

  // Send user specific comment notification
  if (trip.createdById !== userId) {
    notifications.push({
      id: `notif-${Date.now()}`,
      userId: trip.createdById,
      title: "New Travel Feed Comment",
      message: `${commenter.name} commented: "${text.slice(0, 30)}..."`,
      type: "comment",
      data: { tripId: trip.id, commentId: commentObj.id },
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  return res.json(trip);
});

// GROUP CHATS & POLLS
app.get("/api/chats/group/:tripId", (req, res) => {
  const { userId } = req.query;
  const trip = trips.find(t => t.id === req.params.tripId);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  // RLS Security: Approved group members or Trip Owner ONLY
  const isAuthorized = trip.createdById === userId || trip.joinedCompanionIds.includes(userId as string);
  if (!isAuthorized) {
    return res.status(403).json({ error: "Access Denied. Private travel group chats are secured by Row Level Security." });
  }

  let group = groupDetails.find(gd => gd.tripId === req.params.tripId);
  if (!group) {
    group = { tripId: req.params.tripId, messages: [], polls: [], expenses: [] };
    groupDetails.push(group);
  } else if (!group.expenses) {
    group.expenses = [];
  }
  return res.json(group);
});

app.post("/api/chats/group/:tripId/message", (req, res) => {
  const { senderId, content } = req.body;
  const trip = trips.find(t => t.id === req.params.tripId);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const isAuthorized = trip.createdById === senderId || trip.joinedCompanionIds.includes(senderId);
  if (!isAuthorized) {
    return res.status(403).json({ error: "Access Denied. Row Level Security secures group messaging." });
  }

  const senderObj = users.find(u => u.id === senderId);
  if (!senderObj) return res.status(404).json({ error: "Sender profile not found" });

  let group = groupDetails.find(gd => gd.tripId === req.params.tripId);
  if (!group) {
    group = { tripId: req.params.tripId, messages: [], polls: [] };
    groupDetails.push(group);
  }

  const newMessage = {
    id: `gm-${Date.now()}`,
    senderId,
    senderName: senderObj.name,
    senderAvatar: senderObj.avatar,
    content,
    timestamp: new Date().toISOString(),
    type: "text" as const
  };

  group.messages.push(newMessage);

  // Send lightweight silent chat notifications to all other group participants
  const participants = [trip.createdById, ...trip.joinedCompanionIds].filter(pid => pid !== senderId);
  participants.forEach(pid => {
    notifications.push({
      id: `notif-${Date.now()}-${pid}`,
      userId: pid,
      title: `${senderObj.name} in Group:`,
      message: `${trip.destination} group chat: "${content.slice(0, 30)}..."`,
      type: "chat",
      data: { tripId: trip.id },
      read: false,
      createdAt: new Date().toISOString()
    });
  });

  return res.json(group);
});

app.post("/api/chats/group/:tripId/poll", (req, res) => {
  const { createdById, question, options } = req.body; // options is list of strings
  const trip = trips.find(t => t.id === req.params.tripId);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const isAuthorized = trip.createdById === createdById || trip.joinedCompanionIds.includes(createdById);
  if (!isAuthorized) {
    return res.status(403).json({ error: "Access Denied" });
  }

  let group = groupDetails.find(gd => gd.tripId === req.params.tripId);
  if (!group) {
    group = { tripId: req.params.tripId, messages: [], polls: [] };
    groupDetails.push(group);
  }

  const newPoll = {
    id: `poll-${Date.now()}`,
    question,
    options: options.map((opt: string, i: number) => ({
      id: `opt-${Date.now()}-${i}`,
      text: opt,
      votes: [] as string[]
    })),
    createdById,
    createdAt: new Date().toISOString()
  };

  group.polls.push(newPoll);

  // System notification message to group chat
  const creator = users.find(u => u.id === createdById);
  group.messages.push({
    id: `gm-poll-${Date.now()}`,
    senderId: "system",
    senderName: "TravelBag Bot",
    senderAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=travelbag",
    content: `${creator?.name || "A member"} published a poll: "${question}"`,
    timestamp: new Date().toISOString(),
    type: "system" as const
  });

  return res.json(group);
});

app.post("/api/chats/group/:tripId/poll/:pollId/vote", (req, res) => {
  const { userId, optionId } = req.body;
  const trip = trips.find(t => t.id === req.params.tripId);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const isAuthorized = trip.createdById === userId || trip.joinedCompanionIds.includes(userId);
  if (!isAuthorized) {
    return res.status(403).json({ error: "Access Denied" });
  }

  const group = groupDetails.find(gd => gd.tripId === req.params.tripId);
  if (!group) return res.status(404).json({ error: "Group details not found" });

  const poll = group.polls.find(p => p.id === req.params.pollId);
  if (!poll) return res.status(404).json({ error: "Poll not found" });

  // Clean votes of this user across options of this same poll
  poll.options.forEach(opt => {
    opt.votes = opt.votes.filter(vid => vid !== userId);
    if (opt.id === optionId) {
      opt.votes.push(userId);
    }
  });

  return res.json(group);
});

// SPLITWISE GROUP EXPENSES API
app.post("/api/chats/group/:tripId/expense", async (req, res) => {
  const { desc, amount, paidById, splitWithIds, isSettlement } = req.body;
  const trip = trips.find(t => t.id === req.params.tripId);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const isAuthorized = trip.createdById === paidById || trip.joinedCompanionIds.includes(paidById);
  if (!isAuthorized) {
    return res.status(403).json({ error: "Access Denied. Private travel group chats are secured by Row Level Security." });
  }

  let group = groupDetails.find(gd => gd.tripId === req.params.tripId);
  if (!group) {
    group = { tripId: req.params.tripId, messages: [], polls: [], expenses: [] };
    groupDetails.push(group);
  } else if (!group.expenses) {
    group.expenses = [];
  }

  const payer = users.find(u => u.id === paidById);
  const paidByName = payer ? payer.name : "A group member";

  const newExpense = {
    id: `expense-${Date.now()}`,
    desc: desc || (isSettlement ? "Settle balance" : "Trip expense"),
    amount: Number(amount) || 0,
    paidById,
    paidByName,
    splitWithIds: Array.isArray(splitWithIds) ? splitWithIds : [paidById],
    isSettlement: !!isSettlement,
    createdAt: new Date().toISOString()
  };

  group.expenses.push(newExpense);

  // Add system dialogue notification
  let notificationText = "";
  if (isSettlement) {
    const receiverId = splitWithIds.find(id => id !== paidById) || trip.createdById;
    const receiver = users.find(u => u.id === receiverId);
    notificationText = `${paidByName} paid ${receiver ? receiver.name : "other member"} ₹${Number(amount).toLocaleString()} to settle balances.`;
  } else {
    notificationText = `${paidByName} registered expense "₹${Number(amount).toLocaleString()} for ${desc}". Split with ${newExpense.splitWithIds.length} members.`;
  }

  group.messages.push({
    id: `gm-expense-${Date.now()}`,
    senderId: "system",
    senderName: "TravelBag Bot",
    senderAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=travelbag",
    content: notificationText,
    timestamp: new Date().toISOString(),
    type: "system" as const
  });

  markDirty();
  await runBackgroundSync();

  return res.json(group);
});

app.delete("/api/chats/group/:tripId/expense/:expenseId", async (req, res) => {
  const { userId } = req.query;
  const trip = trips.find(t => t.id === req.params.tripId);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const isAuthorized = trip.createdById === userId || trip.joinedCompanionIds.includes(userId as string);
  if (!isAuthorized) {
    return res.status(403).json({ error: "Access Denied" });
  }

  const group = groupDetails.find(gd => gd.tripId === req.params.tripId);
  if (!group || !group.expenses) return res.status(404).json({ error: "Expense group records empty" });

  const originalLength = group.expenses.length;
  const deletedExpense = group.expenses.find(e => e.id === req.params.expenseId);
  group.expenses = group.expenses.filter(e => e.id !== req.params.expenseId);

  if (deletedExpense && group.expenses.length < originalLength) {
    const deletor = users.find(u => u.id === userId);
    group.messages.push({
      id: `gm-expense-del-${Date.now()}`,
      senderId: "system",
      senderName: "TravelBag Bot",
      senderAvatar: "https://api.dicebear.com/7.x/identicon/svg?seed=travelbag",
      content: `${deletor ? deletor.name : "A member"} deleted the expense "${deletedExpense.desc}" of ₹${deletedExpense.amount.toLocaleString()}.`,
      timestamp: new Date().toISOString(),
      type: "system" as const
    });
  }

  markDirty();
  await runBackgroundSync();

  return res.json(group);
});

// NOTIFICATIONS SYSTEM
app.get("/api/notifications", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing Target userId" });

  // Secure: Show only recipient's private notifications
  const userNotifs = notifications.filter(n => n.userId === userId);
  return res.json(userNotifs);
});

app.post("/api/notifications/read-all", (req, res) => {
  const { userId } = req.body;
  notifications.forEach((n, idx) => {
    if (n.userId === userId) {
      notifications[idx].read = true;
    }
  });
  return res.json({ status: "success" });
});

app.post("/api/notifications/:id/read", (req, res) => {
  const match = notifications.find(n => n.id === req.params.id);
  if (match) {
    match.read = true;
    return res.json(match);
  }
  return res.status(404).json({ error: "Notification not found" });
});

// Traveler Verification Verification, reviews, trust scores, reporting, and moderation features
app.post("/api/travelers/verify-apply", (req, res) => {
  const { userId, docUrl, mockText } = req.body;
  const uObj = users.find(u => u.id === userId) as any;
  if (!uObj) return res.status(404).json({ error: "User profile not found" });

  uObj.verificationStatus = "pending";
  uObj.verificationDocUrl = docUrl || "https://images.unsplash.com/photo-1544256718-3bcf237f3974"; // passport/ID mockup image url
  uObj.verificationDocsPreview = mockText || "Travel ID Card Document Application Serial: #ID-4422";

  return res.json(uObj);
});

app.post("/api/travelers/review", (req, res) => {
  const { reviewerId, coworkerId, rating, comment } = req.body; // rate on other traveler
  const coworker = users.find(u => u.id === coworkerId);
  const reviewer = users.find(u => u.id === reviewerId);

  if (!coworker || !reviewer) {
    return res.status(404).json({ error: "Users not found" });
  }

  const reviewObj = {
    id: `rev-${Date.now()}`,
    reviewerId,
    reviewerName: reviewer.name,
    reviewerAvatar: reviewer.avatar,
    rating: parseInt(rating, 10) || 5,
    comment,
    createdAt: new Date().toISOString()
  };

  coworker.reviews.push(reviewObj);

  // Dynamically recompute Trust Score!
  // Trust score criteria:
  // Base is 60. Verified adds +20. Average review increases up to +20. Block lists subtract.
  let score = 60;
  if (coworker.verificationStatus === "approved") {
    score += 20;
    coworker.verified = true;
  }
  if (coworker.reviews.length > 0) {
    let totalRating = 0;
    for (const r of coworker.reviews) {
      totalRating += r.rating;
    }
    const avgRating = totalRating / coworker.reviews.length;
    score += Math.round((avgRating / 5) * 20);
  }
  coworker.trustScore = Math.min(score, 100);

  // Notify recipient
  notifications.push({
    id: `notif-${Date.now()}`,
    userId: coworkerId,
    title: "New Community Review",
    message: `${reviewer.name} gave you a ${rating}⭐ review. Your trust score is now ${coworker.trustScore}%!`,
    type: "info",
    read: false,
    createdAt: new Date().toISOString()
  });

  return res.json(coworker);
});

// CONTENT REPORTING
app.post("/api/moderation/report", (req, res) => {
  const { reporterId, itemType, itemId, itemPreview, reason } = req.body;
  const reporterObj = users.find(u => u.id === reporterId);

  const newReport = {
    id: `rep-${Date.now()}`,
    reporterId,
    reporterName: reporterObj?.name || "Anonymous",
    itemType,
    itemId,
    itemPreview,
    reason,
    status: "pending" as const,
    createdAt: new Date().toISOString()
  };

  reports.push(newReport);
  return res.json(newReport);
});

// Admin Moderation Controls
app.get("/api/moderation/stats", (req, res) => {
  const { adminId } = req.query;
  const admin = users.find(u => u.id === adminId);
  if (!admin || admin.role !== "admin") {
    return res.status(403).json({ error: "Access Denied. Administrator clearance needed." });
  }

  return res.json({
    totalUsers: users.length,
    totalTrips: trips.length,
    totalReports: reports.length,
    pendingVerifications: users.filter(u => u.verificationStatus === "pending").length,
    tripsByDestination: trips.reduce((acc, t) => {
      acc[t.destination] = (acc[t.destination] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    pendingReports: reports.filter(r => r.status === "pending")
  });
});

app.get("/api/moderation/reports", (req, res) => {
  const { adminId } = req.query;
  const admin = users.find(u => u.id === adminId);
  if (!admin || admin.role !== "admin") {
    return res.status(403).json({ error: "Access Denied" });
  }
  return res.json(reports);
});

app.post("/api/moderation/resolve-report", (req, res) => {
  const { adminId, reportId, action } = req.body; // action: "dismiss" | "delete_item"
  const admin = users.find(u => u.id === adminId);
  if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Access Denied" });

  const repIdx = reports.findIndex(r => r.id === reportId);
  if (repIdx === -1) return res.status(404).json({ error: "Report not found" });

  const report = reports[repIdx];
  report.status = action === "dismiss" ? "dismissed" : "resolved";

  if (action === "delete_item") {
    if (report.itemType === "trip") {
      trips = trips.filter(t => t.id !== report.itemId);
      if (supabase) {
        supabase.from("trips").delete().eq("id", report.itemId).then((res: any) => {
          if (res.error) console.log("Supabase trip delete warning:", res.error.message);
        });
      }
    } else if (report.itemType === "comment") {
      trips.forEach((t, i) => {
        trips[i].comments = t.comments.filter(c => c.id !== report.itemId);
      });
    }
  }

  return res.json(report);
});

app.get("/api/moderation/verifications", (req, res) => {
  const { adminId } = req.query;
  const admin = users.find(u => u.id === adminId);
  if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Access Denied" });

  const pendingUsers = users.filter(u => u.verificationStatus === "pending" || u.verificationStatus === "approved");
  return res.json(pendingUsers);
});

app.post("/api/moderation/approve-verification", (req, res) => {
  const { adminId, targetUserId, approved } = req.body;
  const admin = users.find(u => u.id === adminId);
  if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Access Denied" });

  const user = users.find(u => u.id === targetUserId);
  if (!user) return res.status(404).json({ error: "Target traveler not found" });

  if (approved) {
    user.verificationStatus = "approved";
    user.verified = true;
    user.trustScore = Math.min(user.trustScore + 20, 100);

    // Notify user
    notifications.push({
      id: `notif-${Date.now()}`,
      userId: targetUserId,
      title: "Identity Verified!",
      message: "Congratulations! Our trust safety administrators approved your verification document. Your traveler checklist now displays the verified gold safety badge.",
      type: "moderation",
      read: false,
      createdAt: new Date().toISOString()
    });
  } else {
    user.verificationStatus = "rejected";
    user.verified = false;

    notifications.push({
      id: `notif-${Date.now()}`,
      userId: targetUserId,
      title: "Identity Verification Denied",
      message: "Our trust team could not verify your submitted credentials. Please re-submit clear guidelines or authentic travel ID parameters.",
      type: "moderation",
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  return res.json(user);
});

app.post("/api/moderation/block-user", (req, res) => {
  const { requestUserId, targetBlockUserId, block } = req.body; // user blocking another user
  const user = users.find(u => u.id === requestUserId);
  if (!user) return res.status(404).json({ error: "User session not found" });

  const isBlocked = user.blockList.includes(targetBlockUserId);

  if (block && !isBlocked) {
    user.blockList.push(targetBlockUserId);
  } else if (!block && isBlocked) {
    user.blockList = user.blockList.filter(id => id !== targetBlockUserId);
  }

  return res.json(user);
});

// Admin User Management Endpoint
app.post("/api/moderation/users/update", (req, res) => {
  const { adminId, targetUserId, role, trustScore, isSuspended } = req.body;
  const admin = users.find(u => u.id === adminId);
  if (!admin || admin.role !== "admin") {
    return res.status(403).json({ error: "Access Denied" });
  }

  const targetUser: any = users.find(u => u.id === targetUserId);
  if (!targetUser) return res.status(404).json({ error: "Target user not found" });

  if (role !== undefined) targetUser.role = role;
  if (trustScore !== undefined) targetUser.trustScore = Math.max(0, Math.min(100, Number(trustScore)));
  if (isSuspended !== undefined) targetUser.isSuspended = !!isSuspended;

  // Notify target user
  notifications.push({
    id: `notif-${Date.now()}`,
    userId: targetUserId,
    title: "Account Status Update",
    message: `Your companion profile status has been reviewed. Role: ${targetUser.role || "user"}, Status: ${targetUser.isSuspended ? "Suspended" : "Active"}.`,
    type: "moderation",
    read: false,
    createdAt: new Date().toISOString()
  });

  return res.json(targetUser);
});

// Admin User Purge/Delete Endpoint (Removes user, their trips, notifications, chats, polls, and expenses entirely)
app.post("/api/moderation/users/delete", async (req, res) => {
  const { adminId, targetUserId } = req.body;
  const admin = users.find(u => u.id === adminId);
  if (!admin || admin.role !== "admin") {
    return res.status(403).json({ error: "Access Denied" });
  }

  // Prevent admin from deleting themselves
  if (adminId === targetUserId) {
    return res.status(400).json({ error: "Administrators cannot delete their own profile from this dashboard." });
  }

  const targetUser = users.find(u => u.id === targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: "Target companion profile not found" });
  }

  try {
    // 1. Identify items to purge in database
    const deletedTripIds = trips.filter(t => t.createdById === targetUserId).map(t => t.id);
    const deletedChatIds = privateChats.filter(pc => (pc.userA?.id === targetUserId || pc.userB?.id === targetUserId)).map(pc => pc.id);
    const deletedReportIds = reports.filter(r => r.reporterId === targetUserId || (r.itemType === "profile" && r.itemId === targetUserId)).map(r => r.id);

    // 2. Clear memory arrays
    users = users.filter(u => u.id !== targetUserId);
    trips = trips.filter(t => t.createdById !== targetUserId);
    
    // Remove the user from companion lists and likes/saves on other ongoing trips
    trips.forEach(t => {
      if (t.joinedCompanionIds) {
        t.joinedCompanionIds = t.joinedCompanionIds.filter(id => id !== targetUserId);
      }
      if (t.pendingCompanionIds) {
        t.pendingCompanionIds = t.pendingCompanionIds.filter(id => id !== targetUserId);
      }
      if (t.likes) {
        t.likes = t.likes.filter(id => id !== targetUserId);
      }
      if (t.savedBy) {
        t.savedBy = t.savedBy.filter(id => id !== targetUserId);
      }
    });

    privateChats = privateChats.filter(pc => pc.userA?.id !== targetUserId && pc.userB?.id !== targetUserId);
    notifications = notifications.filter(n => n.userId !== targetUserId);
    reports = reports.filter(r => r.reporterId !== targetUserId && !(r.itemType === "profile" && r.itemId === targetUserId));

    // 3. Clear/clean group details for remaining trips (like comments, messages, poll votes, or expenses)
    groupDetails = groupDetails.filter(gd => !deletedTripIds.includes(gd.tripId));

    groupDetails.forEach(gd => {
      if (gd.messages) {
        gd.messages = gd.messages.filter(m => m.senderId !== targetUserId);
      }
      if (gd.polls) {
        gd.polls.forEach(p => {
          if (p.options) {
            p.options.forEach(o => {
              if (o.votes) {
                o.votes = o.votes.filter(vId => vId !== targetUserId);
              }
            });
          }
        });
      }
      if (gd.expenses) {
        gd.expenses = gd.expenses.filter(e => e.paidById !== targetUserId);
        gd.expenses.forEach(e => {
          if (e.splitWithIds) {
            e.splitWithIds = e.splitWithIds.filter(id => id !== targetUserId);
          }
        });
      }
    });

    // 4. Supabase DB manual purging and logical marking
    if (supabase) {
      try {
        console.log(`[Supabase Purge] Executing deletion pipeline for target user: ${targetUserId}`);

        // Update target user's role to 'deleted' and change email to free it up for key constraints
        const { error: roleUpdateError } = await supabase.from("users")
          .update({ 
            role: "deleted", 
            email: `deleted-${targetUserId}-${Date.now()}@travel.com` 
          })
          .eq("id", targetUserId);
        
        if (roleUpdateError) {
          console.warn("[Supabase Purge] Failed logical delete update on users table:", roleUpdateError.message);
        } else {
          console.log("[Supabase Purge] Logical delete role update succeeded on users table.");
        }

        // Try direct deletion on trips (trips has PUBLIC delete policy)
        if (deletedTripIds.length > 0) {
          const { error: gdError } = await supabase.from("group_details").delete().in("tripId", deletedTripIds);
          if (gdError) console.warn("[Supabase Purge] group_details delete notice:", gdError.message);

          const { error: tripsDelError } = await supabase.from("trips").delete().in("id", deletedTripIds);
          if (tripsDelError) {
            console.warn("[Supabase Purge] Failed physical trip delete from DB:", tripsDelError.message);
          } else {
            console.log("[Supabase Purge] Trips and dependent group discussions deleted from DB.");
          }
        }

        // Try optional cascading deletes for chats, reports, and notifications (may yield 0 rows or silent failures under RLS)
        if (deletedChatIds.length > 0) {
          await supabase.from("private_chats").delete().in("id", deletedChatIds);
        }
        if (deletedReportIds.length > 0) {
          await supabase.from("reports").delete().in("id", deletedReportIds);
        }
        await supabase.from("notifications").delete().eq("userId", targetUserId);

        // Finally, try physical deletion query on the target user
        await supabase.from("users").delete().eq("id", targetUserId);

      } catch (err: any) {
        console.warn("Supabase manual cascade purge notice during admin user deletion:", err.message);
      }
    }

    markDirty();
    await runBackgroundSync();

    return res.json({ success: true, message: `Traveler profile and all associated logs for ${targetUser.name} purged completely.` });
  } catch (err: any) {
    console.error("Critical error in user deletion route:", err);
    return res.status(500).json({ error: "Failed to purge user registers completely." });
  }
});

app.post("/api/moderation/trips/delete", async (req, res) => {
  const { adminId, tripId } = req.body;
  const admin = users.find(u => u.id === adminId);
  if (!admin || admin.role !== "admin") {
    return res.status(403).json({ error: "Access Denied" });
  }

  const matched = trips.find(t => t.id === tripId);
  if (!matched) return res.status(404).json({ error: "Trip not found" });

  try {
    // Purge trip from memory
    trips = trips.filter(t => t.id !== tripId);
    groupDetails = groupDetails.filter(gd => gd.tripId !== tripId);

    // Sync deletion to Supabase
    if (supabase) {
      try {
        console.log(`[Supabase Purge] Deleting trip ID: ${tripId}`);
        await supabase.from("group_details").delete().eq("tripId", tripId);
        const { error: tripDelErr } = await supabase.from("trips").delete().eq("id", tripId);
        if (tripDelErr) {
          console.warn("[Supabase Purge] Failed physical trip delete:", tripDelErr.message);
        } else {
          console.log("[Supabase Purge] Successfully deleted trip from Supabase.");
        }
      } catch (dbErr: any) {
        console.warn("[Supabase Purge] Notice during database trip purge:", dbErr.message);
      }
    }

    markDirty();
    await runBackgroundSync();
    
    return res.json({ success: true, message: "Campaign trip moderated and removed successfully." });
  } catch (err: any) {
    console.error("Critical error in trip deletion route:", err);
    return res.status(500).json({ error: "Failed to process campaign deletion." });
  }
});

// Supabase State Synchronization handled at top of file

async function loadStateFromSupabase() {
  if (!supabase) return;
  console.log("Loading state from Supabase Database...");
  
  const defaultUsers = [...users];
  const defaultTrips = [...trips];
  const defaultGroups = [...groupDetails];

  const safeJsonParse = (val: any, fallback: any) => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === "object") return val;
    try {
      return JSON.parse(val);
    } catch (e) {
      return fallback;
    }
  };

  try {
    // 1. Load users
    let activeUserIds = new Set<string>();
    {
      const { data, error } = await supabase.from("users").select("*");
      if (!error && data) {
        const loadedUsers = data.map((u: any) => ({
          ...u,
          password: u.password || "goa123",
          reviews: Array.isArray(u.reviews) ? u.reviews : [],
          blockList: Array.isArray(u.blockList) ? u.blockList : [],
          travelStylePreferences: Array.isArray(u.travelStylePreferences) ? u.travelStylePreferences : []
        })).filter((u: any) => u.role !== "deleted");

        if (data.length === 0) {
          users = [...defaultUsers];
          isDirty = true;
          console.log("Supabase 'users' table is empty. Pre-seeding default database users...");
        } else {
          users = loadedUsers;
          console.log(`Loaded ${users.length} active users from Supabase.`);
        }
        activeUserIds = new Set(users.map(u => u.id));
      } else if (error) {
        console.log("Could not load users from Supabase (running in-memory):", error.message);
        activeUserIds = new Set(users.map(u => u.id));
      }
    }

    // 2. Load trips (Filter out orphaned trips whose creator is deleted)
    let activeTripIds = new Set<string>();
    {
      const { data, error } = await supabase.from("trips").select("*");
      if (!error && data) {
        const loadedTrips = data.map((t: any) => {
          const parsedCreatedBy = safeJsonParse(t.createdBy, {});
          const isCompleted = !!t.completed || !!parsedCreatedBy.completed;
          return {
            ...t,
            completed: isCompleted,
            createdBy: {
              ...parsedCreatedBy,
              completed: isCompleted
            },
            itinerary: safeJsonParse(t.itinerary, []),
            joinedCompanionIds: safeJsonParse(t.joinedCompanionIds, []),
            pendingCompanionIds: safeJsonParse(t.pendingCompanionIds, []),
            likes: safeJsonParse(t.likes, []),
            comments: safeJsonParse(t.comments, []),
            savedBy: safeJsonParse(t.savedBy, [])
          };
        }).filter((t: any) => activeUserIds.has(t.createdById));

        if (data.length === 0) {
          trips = [...defaultTrips];
          isDirty = true;
          console.log("Supabase 'trips' table is empty. Pre-seeding default database trips...");
        } else {
          trips = loadedTrips;
          console.log(`Loaded ${trips.length} active trips from Supabase.`);
        }
        activeTripIds = new Set(trips.map(t => t.id));
      } else if (error) {
        console.log("Could not load trips from Supabase (running in-memory):", error.message);
        activeTripIds = new Set(trips.map(t => t.id));
      }
    }

    // 3. Load groupDetails (Filter out group details of deleted trips)
    {
      const { data, error } = await supabase.from("group_details").select("*");
      if (!error && data) {
        const loadedGroups = data.map((g: any) => ({
          ...g,
          messages: safeJsonParse(g.messages, []),
          polls: safeJsonParse(g.polls, []),
          expenses: safeJsonParse(g.expenses, [])
        })).filter((g: any) => activeTripIds.has(g.tripId));

        if (data.length === 0) {
          groupDetails = [...defaultGroups];
          isDirty = true;
          console.log("Supabase 'group_details' table is empty. Pre-seeding default database group chats...");
        } else {
          groupDetails = loadedGroups;
          console.log(`Loaded ${groupDetails.length} active group chats from Supabase.`);
        }
      } else if (error) {
        console.log("Could not load group_details from Supabase:", error.message);
      }
    }

    // 4. Load privateChats (Filter out chats of deleted users)
    {
      const { data, error } = await supabase.from("private_chats").select("*");
      if (!error && data) {
        if (data.length > 0) {
          privateChats = data.map((pc: any) => ({
            ...pc,
            userA: safeJsonParse(pc.userA, {}),
            userB: safeJsonParse(pc.userB, {}),
            messages: safeJsonParse(pc.messages, [])
          })).filter((pc: any) => activeUserIds.has(pc.userA?.id) && activeUserIds.has(pc.userB?.id));
          console.log(`Loaded ${privateChats.length} active private chats from Supabase.`);
        } else {
          console.log("Supabase 'private_chats' table is empty. Pre-seeding with sample chats...");
          isDirty = true;
        }
      } else if (error) {
        console.log("Could not load private_chats from Supabase:", error.message);
      }
    }

    // 5. Load notifications (Filter out notifications of deleted users)
    {
      const { data, error } = await supabase.from("notifications").select("*");
      if (!error && data) {
        if (data.length > 0) {
          notifications = data.filter((n: any) => activeUserIds.has(n.userId));
          console.log(`Loaded ${notifications.length} notifications from Supabase.`);
        } else {
          console.log("Supabase 'notifications' table is empty. Pre-seeding with sample notifications...");
          isDirty = true;
        }
      } else if (error) {
        console.log("Could not load notifications from Supabase:", error.message);
      }
    }

    // 6. Load reports (Filter out reports from or targeting deleted users)
    {
      const { data, error } = await supabase.from("reports").select("*");
      if (!error && data) {
        if (data.length > 0) {
          reports = data.filter((r: any) => activeUserIds.has(r.reporterId));
          console.log(`Loaded ${reports.length} reports from Supabase.`);
        } else {
          console.log("Supabase 'reports' table is empty. Pre-seeding with sample reports...");
          isDirty = true;
        }
      } else if (error) {
        console.log("Could not load reports from Supabase:", error.message);
      }
    }

    if (isDirty) {
      setTimeout(runBackgroundSync, 1000);
    }
  } catch (err: any) {
    console.error("Exception loading state from Supabase:", err.message);
  }
}

// Server boot setups
// Serve frontend static files
async function startServer() {
  await loadStateFromSupabase();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TravelBag Server successfully loaded and running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
