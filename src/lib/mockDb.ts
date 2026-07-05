// src/lib/mockDb.ts

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  subscription_tier: 'free' | 'pro' | 'business';
  stripe_customer_id: string;
}

export interface Business {
  id: string;
  user_id: string;
  name: string;
  gmb_id: string;
  category: string;
  address: string;
  is_connected: boolean;
  avg_rating: number;
  total_reviews: number;
}

export interface Review {
  id: string;
  business_id: string;
  gmb_review_id: string;
  author_name: string;
  rating: number;
  text: string;
  posted_at: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  is_responded: boolean;
  response?: Response;
}

export interface Response {
  id: string;
  review_id: string;
  response_text: string;
  tone_used: 'professional' | 'friendly' | 'concise';
  ai_generated: boolean;
  posted_at: string;
  approved_by?: string;
}

export interface Template {
  id: string;
  name: string;
  content: string;
}

export interface AutoResponderSettings {
  enabled: boolean;
  tone: 'professional' | 'friendly' | 'concise';
  signature: string;
  blacklistedWords: string[];
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  plan: 'free' | 'pro' | 'business';
  status: string;
}

// In-memory fallback for SSR
let inMemoryDb: {
  profile: Profile | null;
  businesses: Business[];
  reviews: Review[];
  responses: Response[];
  templates: Template[];
  autoResponderSettings: AutoResponderSettings;
  subscription: Subscription | null;
} = {
  profile: null,
  businesses: [],
  reviews: [],
  responses: [],
  templates: [],
  autoResponderSettings: {
    enabled: false,
    tone: 'friendly',
    signature: 'Best regards, The Team',
    blacklistedWords: [],
  },
  subscription: null,
};

const DEFAULT_PROFILE: Profile = {
  id: 'user-123',
  email: 'owner@dailygrind.com',
  full_name: 'Alex Johnson',
  company_name: 'The Daily Grind Cafe & Health Co.',
  subscription_tier: 'free',
  stripe_customer_id: 'cus_mock_123',
};

const DEFAULT_BUSINESSES: Business[] = [
  {
    id: 'biz-1',
    user_id: 'user-123',
    name: 'The Daily Grind Cafe',
    gmb_id: 'gmb-daily-grind-01',
    category: 'Restaurant/Cafe',
    address: '123 Espresso Way, Seattle, WA 98101',
    is_connected: true,
    avg_rating: 4.0,
    total_reviews: 12,
  },
  {
    id: 'biz-2',
    user_id: 'user-123',
    name: 'Apex Dental Care',
    gmb_id: 'gmb-apex-dental-02',
    category: 'Healthcare/Dental',
    address: '456 Wisdom Ln, Suite 200, Boston, MA 02108',
    is_connected: true,
    avg_rating: 4.1,
    total_reviews: 8,
  },
];

const DEFAULT_REVIEWS: Review[] = [
  // 12 Reviews for The Daily Grind Cafe (biz-1)
  {
    id: 'rev-c1',
    business_id: 'biz-1',
    gmb_review_id: 'gmb-rev-c1',
    author_name: 'Sarah Jenkins',
    rating: 5,
    text: 'Best oat milk latte in town! The staff is super friendly, and the chocolate croissants are to die for. Will definitely be a regular here.',
    posted_at: '2026-06-28T14:30:00Z',
    sentiment: 'positive',
    is_responded: false,
  },
  {
    id: 'rev-c2',
    business_id: 'biz-1',
    gmb_review_id: 'gmb-rev-c2',
    author_name: 'Michael Chen',
    rating: 5,
    text: 'Great workspace. High-speed wifi, plenty of outlets, and the cold brew kept me going for hours. Highly recommended for remote workers.',
    posted_at: '2026-06-27T09:15:00Z',
    sentiment: 'positive',
    is_responded: false,
  },
  {
    id: 'rev-c3',
    business_id: 'biz-1',
    gmb_review_id: 'gmb-rev-c3',
    author_name: 'Emily Rodriguez',
    rating: 4,
    text: 'Lovely atmosphere and great coffee. It can get a bit noisy during the morning rush, but the service is fast.',
    posted_at: '2026-06-25T11:00:00Z',
    sentiment: 'positive',
    is_responded: false,
  },
  {
    id: 'rev-c4',
    business_id: 'biz-1',
    gmb_review_id: 'gmb-rev-c4',
    author_name: 'David Kim',
    rating: 3,
    text: 'The coffee is decent, but they were out of avocado toast by 10 AM. Service was a bit slow today.',
    posted_at: '2026-06-24T10:45:00Z',
    sentiment: 'neutral',
    is_responded: false,
  },
  {
    id: 'rev-c5',
    business_id: 'biz-1',
    gmb_review_id: 'gmb-rev-c5',
    author_name: 'Jessica Taylor',
    rating: 2,
    text: 'Disappointed with my visit. I ordered a hot latte but got an iced one, and the bagel was burnt. Staff didn\'t seem to care.',
    posted_at: '2026-06-22T08:20:00Z',
    sentiment: 'negative',
    is_responded: false,
  },
  {
    id: 'rev-c6',
    business_id: 'biz-1',
    gmb_review_id: 'gmb-rev-c6',
    author_name: 'Robert Smith',
    rating: 1,
    text: 'Terrible service. The barista was extremely rude when I asked for a cup sleeve. The coffee tasted burnt. Won\'t be coming back.',
    posted_at: '2026-06-20T16:05:00Z',
    sentiment: 'negative',
    is_responded: false,
  },
  {
    id: 'rev-c7',
    business_id: 'biz-1',
    gmb_review_id: 'gmb-rev-c7',
    author_name: 'Olivia Martinez',
    rating: 5,
    text: 'Such a cozy spot! The outdoor patio is beautiful. I tried their seasonal pumpkin spice latte, and it was perfect.',
    posted_at: '2026-06-18T15:40:00Z',
    sentiment: 'positive',
    is_responded: false,
  },
  {
    id: 'rev-c8',
    business_id: 'biz-1',
    gmb_review_id: 'gmb-rev-c8',
    author_name: 'James Wilson',
    rating: 4,
    text: 'Solid local coffee shop. Pastries are fresh and coffee is consistent. Wish they had more vegan options.',
    posted_at: '2026-06-15T07:55:00Z',
    sentiment: 'positive',
    is_responded: false,
  },
  {
    id: 'rev-c9',
    business_id: 'biz-1',
    gmb_review_id: 'gmb-rev-c9',
    author_name: 'Sophia Brown',
    rating: 3,
    text: 'Decent coffee, but prices are a bit high for the portion sizes. Atmosphere is nice though.',
    posted_at: '2026-06-12T12:00:00Z',
    sentiment: 'neutral',
    is_responded: false,
  },
  {
    id: 'rev-c10',
    business_id: 'biz-1',
    gmb_review_id: 'gmb-rev-c10',
    author_name: 'Daniel Thomas',
    rating: 5,
    text: 'Super friendly baristas! They recognized me on my second visit. Love the matcha latte here.',
    posted_at: '2026-06-10T09:10:00Z',
    sentiment: 'positive',
    is_responded: false,
  },
  {
    id: 'rev-c11',
    business_id: 'biz-1',
    gmb_review_id: 'gmb-rev-c11',
    author_name: 'Amanda White',
    rating: 2,
    text: 'The place is cute, but they charge extra for every single alternative milk and syrup. Ends up being an $8 coffee.',
    posted_at: '2026-06-08T11:45:00Z',
    sentiment: 'negative',
    is_responded: false,
  },
  {
    id: 'rev-c12',
    business_id: 'biz-1',
    gmb_review_id: 'gmb-rev-c12',
    author_name: 'William Jackson',
    rating: 4,
    text: 'Good place to grab a quick coffee before work. Quick service and the espresso is pulling nicely.',
    posted_at: '2026-06-05T08:15:00Z',
    sentiment: 'positive',
    is_responded: false,
  },

  // 8 Reviews for Apex Dental Care (biz-2)
  {
    id: 'rev-d1',
    business_id: 'biz-2',
    gmb_review_id: 'gmb-rev-d1',
    author_name: 'Linda Harris',
    rating: 5,
    text: 'Dr. Apex and the team are amazing! I\'ve always had dental anxiety, but they made me feel completely comfortable and pain-free. Highly recommend!',
    posted_at: '2026-06-29T08:00:00Z',
    sentiment: 'positive',
    is_responded: false,
  },
  {
    id: 'rev-d2',
    business_id: 'biz-2',
    gmb_review_id: 'gmb-rev-d2',
    author_name: 'Charles Davies',
    rating: 5,
    text: 'Very professional and clean office. They use high-tech equipment, and the hygienist did an excellent job. Best dental cleaning I\'ve had.',
    posted_at: '2026-06-26T10:30:00Z',
    sentiment: 'positive',
    is_responded: false,
  },
  {
    id: 'rev-d3',
    business_id: 'biz-2',
    gmb_review_id: 'gmb-rev-d3',
    author_name: 'Karen Thompson',
    rating: 4,
    text: 'Nice clinic, staff is friendly. Appointment started 15 minutes late, but the treatment itself was quick and painless.',
    posted_at: '2026-06-24T14:15:00Z',
    sentiment: 'positive',
    is_responded: false,
  },
  {
    id: 'rev-d4',
    business_id: 'biz-2',
    gmb_review_id: 'gmb-rev-d4',
    author_name: 'Thomas Miller',
    rating: 3,
    text: 'The dentist was great, but the billing department is a mess. I got billed twice for my co-pay and had to call three times to resolve it.',
    posted_at: '2026-06-21T09:00:00Z',
    sentiment: 'neutral',
    is_responded: false,
  },
  {
    id: 'rev-d5',
    business_id: 'biz-2',
    gmb_review_id: 'gmb-rev-d5',
    author_name: 'Nancy Garcia',
    rating: 1,
    text: 'Had a terrible experience. Dr. Apex was very rushed during my filling, and now the tooth is highly sensitive to cold. When I called back, they couldn\'t fit me in for two weeks.',
    posted_at: '2026-06-18T13:20:00Z',
    sentiment: 'negative',
    is_responded: false,
  },
  {
    id: 'rev-d6',
    business_id: 'biz-2',
    gmb_review_id: 'gmb-rev-d6',
    author_name: 'Brian Clark',
    rating: 5,
    text: 'I had a dental emergency and they squeezed me in the same day. Saved my vacation! Excellent care and reasonable pricing.',
    posted_at: '2026-06-14T11:00:00Z',
    sentiment: 'positive',
    is_responded: false,
  },
  {
    id: 'rev-d7',
    business_id: 'biz-2',
    gmb_review_id: 'gmb-rev-d7',
    author_name: 'Susan Robinson',
    rating: 2,
    text: 'The receptionist was quite impolite. The cleaning was rough, and my gums were bleeding for two days. I\'ve had better experiences elsewhere.',
    posted_at: '2026-06-10T15:30:00Z',
    sentiment: 'negative',
    is_responded: false,
  },
  {
    id: 'rev-d8',
    business_id: 'biz-2',
    gmb_review_id: 'gmb-rev-d8',
    author_name: 'Matthew Walker',
    rating: 4,
    text: 'Clean facility, advanced tech, and clear explanations of the treatment plan. A solid choice for family dentistry.',
    posted_at: '2026-06-06T10:10:00Z',
    sentiment: 'positive',
    is_responded: false,
  },
];

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'temp-1',
    name: 'Thank You (Positive)',
    content: 'Thank you so much for your kind words! We work hard to provide the best experience and we are so glad you enjoyed your visit. Hope to see you again soon!',
  },
  {
    id: 'temp-2',
    name: 'Apology & Outreach (Negative)',
    content: 'We are incredibly sorry to hear that your experience fell short of expectations. We take this feedback very seriously. Please reach out to us directly at feedback@ourbusiness.com so we can make this right.',
  },
  {
    id: 'temp-3',
    name: 'Quick Acknowledge (Neutral)',
    content: 'Thanks for taking the time to share your feedback. We appreciate your honesty and will use this to improve our service.',
  },
];

const DEFAULT_SUBSCRIPTION: Subscription = {
  id: 'sub-123',
  user_id: 'user-123',
  stripe_subscription_id: 'sub_mock_123',
  plan: 'free',
  status: 'active',
};

// Helper to determine if we are in browser environment
const isBrowser = typeof window !== 'undefined';

// Load state from localStorage or fallback
function loadFromStorage() {
  if (!isBrowser) {
    // If server side, populate default memory if empty
    if (inMemoryDb.businesses.length === 0) {
      inMemoryDb = {
        profile: DEFAULT_PROFILE ? { ...DEFAULT_PROFILE } : null,
        businesses: DEFAULT_BUSINESSES.map(b => ({ ...b })),
        reviews: DEFAULT_REVIEWS.map(r => ({ ...r })),
        responses: [],
        templates: DEFAULT_TEMPLATES.map(t => ({ ...t })),
        autoResponderSettings: {
          enabled: false,
          tone: 'friendly',
          signature: 'Best regards, The Team',
          blacklistedWords: [],
        },
        subscription: DEFAULT_SUBSCRIPTION ? { ...DEFAULT_SUBSCRIPTION } : null,
      };
    }
    return inMemoryDb;
  }

  const stored = window.localStorage.getItem('reviewpilot_db');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored db, resetting to default', e);
    }
  }

  // Pre-seed default data
  const defaultDb = {
    profile: DEFAULT_PROFILE ? { ...DEFAULT_PROFILE } : null,
    businesses: DEFAULT_BUSINESSES.map(b => ({ ...b })),
    reviews: DEFAULT_REVIEWS.map(r => ({ ...r })),
    responses: [],
    templates: DEFAULT_TEMPLATES.map(t => ({ ...t })),
    autoResponderSettings: {
      enabled: false,
      tone: 'friendly',
      signature: 'Best regards, The Team',
      blacklistedWords: [],
    },
    subscription: DEFAULT_SUBSCRIPTION ? { ...DEFAULT_SUBSCRIPTION } : null,
  };
  window.localStorage.setItem('reviewpilot_db', JSON.stringify(defaultDb));
  return defaultDb;
}

function saveToStorage(db: typeof inMemoryDb) {
  if (isBrowser) {
    window.localStorage.setItem('reviewpilot_db', JSON.stringify(db));
  } else {
    inMemoryDb = db;
  }
}

export const mockDb = {
  // DB management
  resetDb: () => {
    const defaultDb = {
      profile: DEFAULT_PROFILE ? { ...DEFAULT_PROFILE } : null,
      businesses: DEFAULT_BUSINESSES.map(b => ({ ...b })),
      reviews: DEFAULT_REVIEWS.map(r => ({ ...r })),
      responses: [],
      templates: DEFAULT_TEMPLATES.map(t => ({ ...t })),
      autoResponderSettings: {
        enabled: false,
        tone: 'friendly' as const,
        signature: 'Best regards, The Team',
        blacklistedWords: [],
      },
      subscription: DEFAULT_SUBSCRIPTION ? { ...DEFAULT_SUBSCRIPTION } : null,
    };
    saveToStorage(defaultDb);
    return defaultDb;
  },

  // Auth Simulation
  login: (email: string, fullName = 'Demo User', companyName = 'Demo Company') => {
    const db = loadFromStorage();
    db.profile = {
      id: 'user-123',
      email,
      full_name: fullName,
      company_name: companyName,
      subscription_tier: db.profile?.subscription_tier || 'free',
      stripe_customer_id: db.profile?.stripe_customer_id || 'cus_mock_123',
    };
    saveToStorage(db);
    return db.profile;
  },

  signup: (email: string, fullName: string, companyName: string) => {
    const db = loadFromStorage();
    db.profile = {
      id: 'user-123',
      email,
      full_name: fullName,
      company_name: companyName,
      subscription_tier: 'free',
      stripe_customer_id: 'cus_mock_' + Math.floor(Math.random() * 100000),
    };
    // Keep businesses and reviews, but assign owner info
    db.businesses = db.businesses.map((b: Business) => ({ ...b, user_id: 'user-123' }));
    saveToStorage(db);
    return db.profile;
  },

  logout: () => {
    const db = loadFromStorage();
    db.profile = null;
    saveToStorage(db);
  },

  getProfile: (): Profile | null => {
    const db = loadFromStorage();
    return db.profile;
  },

  updateProfile: (updates: Partial<Profile>): Profile => {
    const db = loadFromStorage();
    if (!db.profile) {
      db.profile = {
        id: 'user-123',
        email: 'guest@demo.com',
        full_name: 'Guest User',
        company_name: 'Guest Company',
        subscription_tier: 'free',
        stripe_customer_id: 'cus_guest',
      };
    }
    db.profile = { ...db.profile, ...updates };
    saveToStorage(db);
    return db.profile;
  },

  // Businesses
  getBusinesses: (): Business[] => {
    const db = loadFromStorage();
    return db.businesses;
  },

  addBusiness: (business: Omit<Business, 'id' | 'user_id'>): Business => {
    const db = loadFromStorage();
    const newBiz: Business = {
      ...business,
      id: 'biz-' + (db.businesses.length + 1),
      user_id: db.profile?.id || 'user-123',
    };
    db.businesses.push(newBiz);
    saveToStorage(db);
    return newBiz;
  },

  updateBusiness: (id: string, updates: Partial<Business>): Business => {
    const db = loadFromStorage();
    db.businesses = db.businesses.map((b: Business) =>
      b.id === id ? { ...b, ...updates } : b
    );
    saveToStorage(db);
    return db.businesses.find((b: Business) => b.id === id)!;
  },

  // Reviews
  getReviews: (): Review[] => {
    const db = loadFromStorage();
    // Populate responses directly
    return db.reviews.map((rev: Review) => {
      const resp = db.responses.find((r: Response) => r.review_id === rev.id);
      return { ...rev, response: resp };
    });
  },

  getReviewById: (id: string): Review | undefined => {
    const db = loadFromStorage();
    const rev = db.reviews.find((r: Review) => r.id === id);
    if (rev) {
      const resp = db.responses.find((r: Response) => r.review_id === rev.id);
      return { ...rev, response: resp };
    }
    return undefined;
  },

  updateReview: (id: string, updates: Partial<Review>): Review => {
    const db = loadFromStorage();
    db.reviews = db.reviews.map((r: Review) =>
      r.id === id ? { ...r, ...updates } : r
    );
    saveToStorage(db);
    return mockDb.getReviewById(id)!;
  },

  addReviews: (newReviews: Omit<Review, 'id'>[]): Review[] => {
    const db = loadFromStorage();
    const added: Review[] = [];
    newReviews.forEach((r, index) => {
      const rev: Review = {
        ...r,
        id: 'rev-new-' + (db.reviews.length + index + 1),
      };
      db.reviews.unshift(rev); // put newest on top
      added.push(rev);
    });
    // Update businesses total review counts
    db.businesses = db.businesses.map((biz: Business) => {
      const bizReviews = db.reviews.filter((r: Review) => r.business_id === biz.id);
      const total = bizReviews.length;
      const avg = total > 0 ? Number((bizReviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / total).toFixed(1)) : 0;
      return { ...biz, total_reviews: total, avg_rating: avg };
    });
    saveToStorage(db);
    return added;
  },

  // Responses
  getResponses: (): Response[] => {
    const db = loadFromStorage();
    return db.responses;
  },

  addResponse: (response: Omit<Response, 'id' | 'posted_at'>): Response => {
    const db = loadFromStorage();
    const newResponse: Response = {
      ...response,
      id: 'resp-' + (db.responses.length + 1),
      posted_at: new Date().toISOString(),
    };
    
    // Remove duplicate responses for this review if any
    db.responses = db.responses.filter((r: Response) => r.review_id !== response.review_id);
    db.responses.push(newResponse);

    // Update review responded state
    db.reviews = db.reviews.map((rev: Review) =>
      rev.id === response.review_id ? { ...rev, is_responded: true } : rev
    );

    saveToStorage(db);
    return newResponse;
  },

  // Templates
  getTemplates: (): Template[] => {
    const db = loadFromStorage();
    return db.templates;
  },

  saveTemplate: (template: Template): Template => {
    const db = loadFromStorage();
    const exists = db.templates.some((t: Template) => t.id === template.id);
    if (exists) {
      db.templates = db.templates.map((t: Template) => (t.id === template.id ? template : t));
    } else {
      db.templates.push(template);
    }
    saveToStorage(db);
    return template;
  },

  deleteTemplate: (id: string) => {
    const db = loadFromStorage();
    db.templates = db.templates.filter((t: Template) => t.id !== id);
    saveToStorage(db);
  },

  // Settings
  getAutoResponderSettings: (): AutoResponderSettings => {
    const db = loadFromStorage();
    return db.autoResponderSettings;
  },

  saveAutoResponderSettings: (settings: AutoResponderSettings): AutoResponderSettings => {
    const db = loadFromStorage();
    db.autoResponderSettings = settings;
    saveToStorage(db);
    return db.autoResponderSettings;
  },

  // Subscription / Billing Tier
  getSubscription: (): Subscription | null => {
    const db = loadFromStorage();
    return db.subscription;
  },

  upgradeSubscription: (tier: 'pro' | 'business'): Subscription => {
    const db = loadFromStorage();
    db.subscription = {
      id: 'sub_mock_' + Math.floor(Math.random() * 100000),
      user_id: db.profile?.id || 'user-123',
      stripe_subscription_id: 'sub_stripe_' + Math.floor(Math.random() * 1000000),
      plan: tier,
      status: 'active',
    };
    if (db.profile) {
      db.profile.subscription_tier = tier;
    }
    saveToStorage(db);
    return db.subscription;
  },

  cancelSubscription: (): void => {
    const db = loadFromStorage();
    if (db.subscription) {
      db.subscription.status = 'canceled';
      db.subscription.plan = 'free';
    }
    if (db.profile) {
      db.profile.subscription_tier = 'free';
    }
    saveToStorage(db);
  },
};
