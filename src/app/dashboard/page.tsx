// src/app/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { mockDb, Review, Business, Profile, Response, Template, AutoResponderSettings, Subscription } from '@/lib/mockDb';

export default function Dashboard() {
  const router = useRouter();
  
  // App States
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [autoSettings, setAutoSettings] = useState<AutoResponderSettings | null>(null);

  // UI Navigation Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'moderation' | 'ingestion' | 'templates' | 'settings'>('overview');

  // Filters State
  const [filterBusiness, setFilterBusiness] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [filterResponded, setFilterResponded] = useState<string>('all');

  // Moderation: AI generation states for individual review cards
  // Maps reviewId -> { loading: boolean, variations: Array<{tone, response}>, selectedTone: string, editedText: string }
  const [aiStates, setAiStates] = useState<Record<string, {
    loading: boolean;
    variations: Array<{ tone: string; response: string }>;
    selectedTone: string;
    editedText: string;
    error?: string;
  }>>({});

  // Sync Ingestion Console State
  const [syncPlatform, setSyncPlatform] = useState<'google' | 'yelp'>('google');
  const [syncBusinessId, setSyncBusinessId] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  // Template Library Form State
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempContent, setTempContent] = useState('');

  // Settings: Auto-Responder form state
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoTone, setAutoTone] = useState<'professional' | 'friendly' | 'concise'>('friendly');
  const [autoSignature, setAutoSignature] = useState('');
  const [autoBlacklist, setAutoBlacklist] = useState('');

  // Checkout modal simulation
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'pro' | 'business'>('pro');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  // Notification Banner State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Load Database on Mount. Mount-only initialization that seeds React state
  // from the mock store; the synchronous setState calls here are the intended
  // one-time hydration, not a render-loop.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Failsafe: if profile is null, sign in default guest
    let prof = mockDb.getProfile();
    if (!prof) {
      prof = mockDb.login('owner@dailygrind.com', 'Alex Johnson', 'The Daily Grind Cafe & Health Co.');
    }
    setProfile(prof);
    
    // Sync state
    setSubscription(mockDb.getSubscription());
    setBusinesses(mockDb.getBusinesses());
    setReviews(mockDb.getReviews());
    setTemplates(mockDb.getTemplates());
    
    const settings = mockDb.getAutoResponderSettings();
    setAutoSettings(settings);
    setAutoEnabled(settings.enabled);
    setAutoTone(settings.tone);
    setAutoSignature(settings.signature);
    setAutoBlacklist(settings.blacklistedWords.join(', '));

    // Default select business for Sync tab
    const bizs = mockDb.getBusinesses();
    if (bizs.length > 0) {
      setSyncBusinessId(bizs[0].id);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Auto-scroll ingestion terminal
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [syncLogs]);

  // Flash Notifications
  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleLogout = () => {
    mockDb.logout();
    router.push('/');
  };

  // ----------------------------------------------------
  // Sync Ingestion Console Logic
  // ----------------------------------------------------
  const handleStartSync = () => {
    if (isSyncing) return;
    
    const biz = businesses.find(b => b.id === syncBusinessId);
    if (!biz) {
      showNotification('Select a valid business for synchronization.', 'error');
      return;
    }

    setIsSyncing(true);
    setSyncProgress(0);
    setSyncLogs([]);

    const platformName = syncPlatform === 'google' ? 'Google Business Profile' : 'Yelp';
    
    const logs = [
      `[SYS] Initializing Sync Engine...`,
      `[SYS] Target Platform: ${platformName}`,
      `[SYS] Location Name: ${biz.name}`,
      `[SYS] Location GMB ID: ${biz.gmb_id || 'N/A'}`,
      `[API] Requesting oauth token credentials...`,
    ];

    setSyncLogs([...logs]);

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      const newLogs = [...logs];
      let progress = 0;

      if (step === 1) {
        progress = 15;
        newLogs.push(`[API] Oauth Handshake verified. Status: 200 OK.`);
        newLogs.push(`[API] Fetching reviews feed starting from page 1...`);
      } else if (step === 2) {
        progress = 35;
        newLogs.push(`[API] Connected. Scanning reviews...`);
        newLogs.push(`[DATA] Detected new reviews since last sync.`);
      } else if (step === 3) {
        progress = 60;
        newLogs.push(`[DATA] Ingesting review from 'Arthur Dent' (Rating: 5/5)`);
        newLogs.push(`[AI] Processing sentiment: POSITIVE`);
        newLogs.push(`[DATA] Ingesting review from 'Tricia McMillan' (Rating: 2/5)`);
        newLogs.push(`[AI] Processing sentiment: NEGATIVE`);
      } else if (step === 4) {
        progress = 85;
        newLogs.push(`[DATA] Ingesting review from 'Ford Prefect' (Rating: 4/5)`);
        newLogs.push(`[AI] Processing sentiment: POSITIVE`);
        
        // Auto responder check
        const settings = mockDb.getAutoResponderSettings();
        if (settings.enabled) {
          newLogs.push(`[AUTO] Auto-responder matches: 'Arthur Dent' (5 stars). Tone: ${settings.tone}.`);
          newLogs.push(`[AUTO] Auto-response generated and posted: "Hi Arthur! Thanks..."`);
        } else {
          newLogs.push(`[AUTO] Auto-responder is disabled. Queued reviews for manual approval.`);
        }
      } else if (step === 5) {
        progress = 100;
        newLogs.push(`[SYS] Database commit successful.`);
        newLogs.push(`[SYS] Ingest sync complete! 3 reviews imported successfully.`);
        clearInterval(interval);
        setIsSyncing(false);
        
        // Actually append reviews to DB
        const newMockReviews = [
          {
            business_id: biz.id,
            gmb_review_id: `gmb-sync-${Date.now()}-1`,
            author_name: 'Arthur Dent',
            rating: 5,
            text: 'Excellent tea! They actually serve it hot. Highly recommended, very nice staff too.',
            posted_at: new Date().toISOString(),
            sentiment: 'positive' as const,
            is_responded: false,
          },
          {
            business_id: biz.id,
            gmb_review_id: `gmb-sync-${Date.now()}-2`,
            author_name: 'Tricia McMillan',
            rating: 2,
            text: 'The experience was cold and the service was extremely slow. I was really disappointed.',
            posted_at: new Date().toISOString(),
            sentiment: 'negative' as const,
            is_responded: false,
          },
          {
            business_id: biz.id,
            gmb_review_id: `gmb-sync-${Date.now()}-3`,
            author_name: 'Ford Prefect',
            rating: 4,
            text: 'Very good place to hang out and grab a quick drink. Atmosphere is decent and the wifi is incredibly fast.',
            posted_at: new Date().toISOString(),
            sentiment: 'positive' as const,
            is_responded: false,
          }
        ];

        // Add to database
        const added = mockDb.addReviews(newMockReviews);
        
        // If auto responder is active, auto reply to the 5-star review
        const settings = mockDb.getAutoResponderSettings();
        if (settings.enabled) {
          const fiveStar = added.find(r => r.rating === 5);
          if (fiveStar) {
            mockDb.addResponse({
              review_id: fiveStar.id,
              response_text: `Hi Arthur! Thank you so much for the 5-star review! We are glad we could make your visit pleasant. ${settings.signature}`,
              tone_used: settings.tone,
              ai_generated: true,
            });
          }
        }

        // Reload data
        setReviews(mockDb.getReviews());
        setBusinesses(mockDb.getBusinesses());
        showNotification(`Synced! Ingested 3 new reviews for ${biz.name}`);
      }

      setSyncProgress(progress);
      setSyncLogs(newLogs);
    }, 900);
  };

  // ----------------------------------------------------
  // Moderation Logic (AI responses generate + post)
  // ----------------------------------------------------
  const handleGenerateAI = async (review: Review) => {
    const biz = businesses.find(b => b.id === review.business_id);
    const bizName = biz ? biz.name : 'our business';
    const bizCat = biz ? biz.category : 'Service';

    setAiStates(prev => ({
      ...prev,
      [review.id]: {
        loading: true,
        variations: [],
        selectedTone: 'friendly',
        editedText: '',
      }
    }));

    try {
      const res = await fetch('/api/ai/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_text: review.text,
          author: review.author_name || 'A customer',
          rating: review.rating,
          business_name: bizName,
          business_id: review.business_id,
        })
      });

      if (!res.ok) throw new Error('Failed to generate response');

      const data = await res.json();

      if (data.responses && typeof data.responses === 'object') {
        const responses = data.responses as Record<string, string>;

        // Append custom settings signature if available
        const signature = autoSettings?.signature ? `\n\n${autoSettings.signature}` : '';
        const variationsWithSig = Object.entries(responses).map(([tone, response]) => ({
          tone,
          response: (response || '') + signature
        }));
        const friendlyText = responses.friendly || variationsWithSig[0]?.response || '';

        setAiStates(prev => ({
          ...prev,
          [review.id]: {
            loading: false,
            variations: variationsWithSig,
            selectedTone: 'friendly',
            editedText: friendlyText + signature,
          }
        }));
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error(err);
      setAiStates(prev => ({
        ...prev,
        [review.id]: {
          loading: false,
          variations: [],
          selectedTone: 'friendly',
          editedText: '',
          error: 'Could not connect to generator. Please try again.',
        }
      }));
    }
  };

  const handleSelectTone = (reviewId: string, tone: string) => {
    const state = aiStates[reviewId];
    if (!state) return;
    const variation = state.variations.find(v => v.tone === tone);
    if (!variation) return;

    setAiStates(prev => ({
      ...prev,
      [reviewId]: {
        ...prev[reviewId],
        selectedTone: tone,
        editedText: variation.response,
      }
    }));
  };

  const handleEditText = (reviewId: string, text: string) => {
    setAiStates(prev => ({
      ...prev,
      [reviewId]: {
        ...prev[reviewId],
        editedText: text,
      }
    }));
  };

  const handleApproveAndPost = (reviewId: string) => {
    const state = aiStates[reviewId];
    if (!state || !state.editedText) {
      showNotification('Response content is empty.', 'error');
      return;
    }

    // Save to Database
    mockDb.addResponse({
      review_id: reviewId,
      response_text: state.editedText,
      tone_used: state.selectedTone as 'professional' | 'friendly' | 'concise',
      ai_generated: true,
      approved_by: profile?.id || 'user-123',
    });

    // Reload lists
    setReviews(mockDb.getReviews());
    showNotification('Response approved and published to Google Maps!');
  };

  // ----------------------------------------------------
  // Templates Management
  // ----------------------------------------------------
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName || !tempContent) {
      showNotification('Please fill in name and content.', 'error');
      return;
    }

    const newTemp = {
      id: editingTemplateId || 'temp-' + Date.now(),
      name: tempName,
      content: tempContent,
    };

    mockDb.saveTemplate(newTemp);
    setTemplates(mockDb.getTemplates());
    
    setEditingTemplateId(null);
    setTempName('');
    setTempContent('');
    showNotification('Template saved successfully!');
  };

  const handleEditTemplateClick = (t: Template) => {
    setEditingTemplateId(t.id);
    setTempName(t.name);
    setTempContent(t.content);
  };

  const handleDeleteTemplate = (id: string) => {
    mockDb.deleteTemplate(id);
    setTemplates(mockDb.getTemplates());
    showNotification('Template deleted.');
  };

  // ----------------------------------------------------
  // Auto-Responder settings saving
  // ----------------------------------------------------
  const handleSaveAutoSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const blacklistWordsArray = autoBlacklist
      .split(',')
      .map(w => w.trim())
      .filter(w => w.length > 0);

    const updated = {
      enabled: autoEnabled,
      tone: autoTone,
      signature: autoSignature,
      blacklistedWords: blacklistWordsArray,
    };

    mockDb.saveAutoResponderSettings(updated);
    setAutoSettings(updated);
    showNotification('Auto-responder configuration saved.');
  };

  // ----------------------------------------------------
  // Stripe Subscription Simulation
  // ----------------------------------------------------
  const handleUpgradeClick = (tier: 'pro' | 'business') => {
    setCheckoutPlan(tier);
    setCheckoutModalOpen(true);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardNumber) {
      showNotification('Please fill in credit card details.', 'error');
      return;
    }
    setIsPaying(true);

    setTimeout(() => {
      // Complete mock payment
      mockDb.upgradeSubscription(checkoutPlan);
      setSubscription(mockDb.getSubscription());
      
      // Update profile locally
      const prof = mockDb.getProfile();
      setProfile(prof);

      setIsPaying(false);
      setCheckoutModalOpen(false);
      setCardName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvc('');
      
      showNotification(`Subscription upgraded to ${checkoutPlan.toUpperCase()} successfully!`, 'success');
    }, 1500);
  };

  const handleCancelSub = () => {
    if (confirm('Are you sure you want to cancel your premium subscription?')) {
      mockDb.cancelSubscription();
      setSubscription(mockDb.getSubscription());
      const prof = mockDb.getProfile();
      setProfile(prof);
      showNotification('Subscription canceled. Downgraded to Free Tier.');
    }
  };

  // ----------------------------------------------------
  // Calculations for Stats (Overview)
  // ----------------------------------------------------
  const totalReviewsCount = reviews.length;
  const respondedReviews = reviews.filter(r => r.is_responded);
  const responseRate = totalReviewsCount > 0 
    ? Math.round((respondedReviews.length / totalReviewsCount) * 100) 
    : 0;
  
  const avgRating = totalReviewsCount > 0 
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviewsCount).toFixed(1)) 
    : 0.0;
  
  const locationsConnected = businesses.length;

  // Sentiment counts
  const positiveCount = reviews.filter(r => r.sentiment === 'positive').length;
  const neutralCount = reviews.filter(r => r.sentiment === 'neutral').length;
  const negativeCount = reviews.filter(r => r.sentiment === 'negative').length;

  // Filter Reviews List for Moderation Tab
  const filteredReviews = reviews.filter(r => {
    // Business Filter
    if (filterBusiness !== 'all' && r.business_id !== filterBusiness) return false;
    // Rating Filter
    if (filterRating !== 'all' && r.rating !== parseInt(filterRating)) return false;
    // Sentiment Filter
    if (filterSentiment !== 'all' && r.sentiment !== filterSentiment) return false;
    // Responded Status Filter
    if (filterResponded !== 'all') {
      const needs = filterResponded === 'needs_response';
      if (needs && r.is_responded) return false;
      if (!needs && !r.is_responded) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col md:flex-row">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl border text-sm font-semibold flex items-center gap-2 animate-slideIn ${
          notification.type === 'success' ? 'bg-green-950/80 border-green-500/30 text-green-400' :
          notification.type === 'error' ? 'bg-red-950/80 border-red-500/30 text-red-400' :
          'bg-zinc-900 border-border text-white'
        }`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {notification.message}
        </div>
      )}

      {/* Sidebar Panel */}
      <aside className="w-full md:w-64 bg-surface border-b md:border-b-0 md:border-r border-border shrink-0 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-border flex items-center gap-2">
            <svg className="w-6.5 h-6.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span className="font-bold text-lg text-white">ReviewPilot</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'overview' ? 'bg-accent/15 text-accent' : 'text-muted hover:text-white hover:bg-background/40'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
              </svg>
              Overview & Analytics
            </button>
            <button
              onClick={() => setActiveTab('moderation')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'moderation' ? 'bg-accent/15 text-accent' : 'text-muted hover:text-white hover:bg-background/40'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.12 2.9 2.57 3.3L7 21l3.23-3.23c.31.06.63.09.97.09h7.05c1.45 0 2.57-1.3 2.57-2.9V5.7c0-1.6-1.12-2.9-2.57-2.9H5.72C4.27 2.8 3.15 4.1 3.15 5.7v7.56z" />
              </svg>
              Review Moderation
              {reviews.filter(r => !r.is_responded).length > 0 && (
                <span className="ml-auto bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {reviews.filter(r => !r.is_responded).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ingestion')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'ingestion' ? 'bg-accent/15 text-accent' : 'text-muted hover:text-white hover:bg-background/40'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Ingestion sync
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'templates' ? 'bg-accent/15 text-accent' : 'text-muted hover:text-white hover:bg-background/40'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 5.625L12 9l4.25-1.25M6.5 12h11m-11 3.5h7.5" strokeWidth="2" />
                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
              </svg>
              Voice & Templates
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'settings' ? 'bg-accent/15 text-accent' : 'text-muted hover:text-white hover:bg-background/40'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" />
                <circle cx="12" cy="12" r="3" strokeWidth="2" />
              </svg>
              Settings & Billing
            </button>
          </nav>
        </div>

        {/* Profile Footer */}
        <div className="p-4 border-t border-border bg-background/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent/25 border border-accent flex items-center justify-center font-bold text-accent">
              {profile?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-white truncate">{profile?.full_name}</h4>
              <p className="text-[10px] text-muted truncate">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full border border-border hover:bg-red-950/20 hover:text-red-400 text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 min-w-0 bg-background flex flex-col">
        {/* Top Header */}
        <header className="border-b border-border bg-surface px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
              {activeTab === 'overview' && '// OVERVIEW & ANALYTICS'}
              {activeTab === 'moderation' && '// REVIEW MODERATION'}
              {activeTab === 'ingestion' && '// INGESTION SYNC CONSOLE'}
              {activeTab === 'templates' && '// BRAND VOICE & TEMPLATES'}
              {activeTab === 'settings' && '// ACCOUNT SETTINGS & BILLING'}
            </h2>
            <p className="text-xs text-muted">
              Managing: <strong className="text-gray-200">{profile?.company_name}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 bg-surface border border-border rounded-full text-muted flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${subscription?.plan !== 'free' ? 'bg-green-500' : 'bg-orange-500'}`} />
              Tier: <strong className="text-white uppercase">{profile?.subscription_tier}</strong>
            </span>
            {profile?.subscription_tier === 'free' ? (
              <span className="text-xs text-muted font-mono">
                Used: <strong className="text-accent">{respondedReviews.length}</strong>/50 replies
              </span>
            ) : (
              <span className="text-xs text-green-400 font-mono font-bold">
                ✓ Unlimited Replies Enabled
              </span>
            )}
          </div>
        </header>

        {/* Main Workspace Dashboard Views */}
        <div className="flex-1 p-6 overflow-y-auto">
          
          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-surface border border-border rounded-xl">
                  <span className="text-xs text-muted font-semibold block uppercase">Total Reviews</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-extrabold text-white">{totalReviewsCount}</span>
                    <span className="text-[10px] text-green-500 font-bold">+15% vs last month</span>
                  </div>
                </div>
                <div className="p-4 bg-surface border border-border rounded-xl">
                  <span className="text-xs text-muted font-semibold block uppercase">Response Rate</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-extrabold text-white">{responseRate}%</span>
                    <span className="text-[10px] text-green-500 font-bold">Goal: 100%</span>
                  </div>
                  <div className="w-full bg-background h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-accent h-full rounded-full" style={{ width: `${responseRate}%` }} />
                  </div>
                </div>
                <div className="p-4 bg-surface border border-border rounded-xl">
                  <span className="text-xs text-muted font-semibold block uppercase">Avg Star Rating</span>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-2xl font-extrabold text-white">{avgRating}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(avgRating) ? 'text-amber-500 fill-amber-500' : 'text-zinc-600'}`} viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-surface border border-border rounded-xl">
                  <span className="text-xs text-muted font-semibold block uppercase">Locations Connected</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-extrabold text-white">{locationsConnected}</span>
                    <span className="text-[10px] text-muted">Max: {profile?.subscription_tier === 'free' ? 1 : 5}</span>
                  </div>
                </div>
              </div>

              {/* Analytics Section - SVG Charts */}
              <div className="grid md:grid-cols-12 gap-6">
                
                {/* Sentiment Pie/Donut Chart */}
                <div className="md:col-span-5 bg-surface border border-border rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 font-mono">Sentiment Analysis</h3>
                    <p className="text-xs text-muted">ReviewPilot automatically tags user satisfaction trends.</p>
                  </div>
                  
                  {totalReviewsCount > 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-6">
                      <div className="relative w-36 h-36">
                        {/* Dynamic SVG Donut Chart */}
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#2a2520" strokeWidth="4.2" />
                          
                          {/* Positive Segment (Green) */}
                          <circle 
                            cx="21" cy="21" r="15.915" fill="transparent" 
                            stroke="#22c55e" strokeWidth="4.2" 
                            strokeDasharray={`${Math.round((positiveCount / totalReviewsCount) * 100)} ${100 - Math.round((positiveCount / totalReviewsCount) * 100)}`} 
                            strokeDashoffset="0" 
                          />
                          
                          {/* Neutral Segment (Yellow) */}
                          <circle 
                            cx="21" cy="21" r="15.915" fill="transparent" 
                            stroke="#eab308" strokeWidth="4.2" 
                            strokeDasharray={`${Math.round((neutralCount / totalReviewsCount) * 100)} ${100 - Math.round((neutralCount / totalReviewsCount) * 100)}`} 
                            strokeDashoffset={`-${Math.round((positiveCount / totalReviewsCount) * 100)}`} 
                          />
                          
                          {/* Negative Segment (Red) */}
                          <circle 
                            cx="21" cy="21" r="15.915" fill="transparent" 
                            stroke="#ef4444" strokeWidth="4.2" 
                            strokeDasharray={`${Math.round((negativeCount / totalReviewsCount) * 100)} ${100 - Math.round((negativeCount / totalReviewsCount) * 100)}`} 
                            strokeDashoffset={`-${Math.round(((positiveCount + neutralCount) / totalReviewsCount) * 100)}`} 
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-extrabold text-white">
                            {Math.round(((positiveCount + (neutralCount*0.5)) / totalReviewsCount) * 100)}%
                          </span>
                          <span className="text-[9px] text-muted uppercase font-semibold">Positive Score</span>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="grid grid-cols-3 gap-4 text-center w-full">
                        <div className="bg-background/40 border border-border p-2 rounded-lg">
                          <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-1" />
                          <span className="text-[10px] text-muted uppercase block">Positive</span>
                          <span className="text-xs font-bold text-white">{positiveCount} ({Math.round((positiveCount/totalReviewsCount)*100)}%)</span>
                        </div>
                        <div className="bg-background/40 border border-border p-2 rounded-lg">
                          <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block mr-1" />
                          <span className="text-[10px] text-muted uppercase block">Neutral</span>
                          <span className="text-xs font-bold text-white">{neutralCount} ({Math.round((neutralCount/totalReviewsCount)*100)}%)</span>
                        </div>
                        <div className="bg-background/40 border border-border p-2 rounded-lg">
                          <span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-1" />
                          <span className="text-[10px] text-muted uppercase block">Negative</span>
                          <span className="text-xs font-bold text-white">{negativeCount} ({Math.round((negativeCount/totalReviewsCount)*100)}%)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-xs text-muted">No data available. Run review sync.</div>
                  )}
                </div>

                {/* Line Graph for Review Count Trends */}
                <div className="md:col-span-7 bg-surface border border-border rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 font-mono">Reviews Count Growth</h3>
                    <p className="text-xs text-muted font-sans">Visual trend showing the total number of synced reviews over time.</p>
                  </div>

                  <div className="py-6">
                    {/* SVG Line Graph */}
                    <svg className="w-full h-32 text-accent" viewBox="0 0 350 100" fill="none">
                      <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="10" y1="90" x2="340" y2="90" stroke="#2a2520" strokeWidth="1" />
                      <line x1="10" y1="60" x2="340" y2="60" stroke="#2a2520" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="10" y1="30" x2="340" y2="30" stroke="#2a2520" strokeWidth="1" strokeDasharray="3 3" />
                      
                      {/* Trend Path */}
                      <path 
                        d="M 10 90 L 60 85 L 120 75 L 180 50 L 240 45 L 300 25 L 340 10" 
                        stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
                      />
                      
                      {/* Fill area */}
                      <path 
                        d="M 10 90 L 60 85 L 120 75 L 180 50 L 240 45 L 300 25 L 340 10 L 340 90 Z" 
                        fill="url(#gradient)" 
                      />

                      {/* Points */}
                      <circle cx="10" cy="90" r="3" fill="#f97316" />
                      <circle cx="120" cy="75" r="3" fill="#f97316" />
                      <circle cx="240" cy="45" r="3" fill="#f97316" />
                      <circle cx="340" cy="10" r="3.5" fill="#ffffff" stroke="#f97316" strokeWidth="2" />
                    </svg>
                    
                    <div className="flex justify-between items-center text-[10px] text-muted font-mono mt-2">
                      <span>JUN 10</span>
                      <span>JUN 15</span>
                      <span>JUN 20</span>
                      <span>JUN 25</span>
                      <span>TODAY</span>
                    </div>
                  </div>

                  <div className="bg-background/40 border border-border rounded-lg p-3 text-xs text-muted-dark-text flex items-center justify-between">
                    <span>Active sync channels: <strong className="text-white">Google GMB & Yelp API</strong></span>
                    <button onClick={() => setActiveTab('ingestion')} className="text-accent font-bold hover:underline">Run Sync →</button>
                  </div>
                </div>

              </div>

              {/* Businesses Table */}
              <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-mono">Connected Business Accounts</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-muted-dark-text">
                    <thead>
                      <tr className="border-b border-border text-white font-semibold">
                        <th className="pb-3">Business Name</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Location Address</th>
                        <th className="pb-3">Rating</th>
                        <th className="pb-3">Synced Reviews</th>
                        <th className="pb-3">Integration Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {businesses.map((biz) => {
                        const bizReviews = reviews.filter(r => r.business_id === biz.id);
                        return (
                          <tr key={biz.id} className="hover:bg-background/25">
                            <td className="py-3 font-semibold text-white">{biz.name}</td>
                            <td className="py-3">{biz.category}</td>
                            <td className="py-3 text-[11px]">{biz.address}</td>
                            <td className="py-3 text-white font-bold">⭐ {biz.avg_rating}</td>
                            <td className="py-3 font-mono">{bizReviews.length} reviews</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-950 text-green-400 border border-green-900/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                Connected
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REVIEW MODERATION */}
          {activeTab === 'moderation' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Filter controls */}
              <div className="bg-surface border border-border rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Business</label>
                  <select
                    value={filterBusiness}
                    onChange={(e) => setFilterBusiness(e.target.value)}
                    className="w-full bg-background border border-border text-white text-xs rounded-lg p-2 outline-none"
                  >
                    <option value="all">All Locations</option>
                    {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Star Rating</label>
                  <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(e.target.value)}
                    className="w-full bg-background border border-border text-white text-xs rounded-lg p-2 outline-none"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                    <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                    <option value="3">⭐⭐⭐ 3 Stars</option>
                    <option value="2">⭐⭐ 2 Stars</option>
                    <option value="1">⭐ 1 Star</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Sentiment</label>
                  <select
                    value={filterSentiment}
                    onChange={(e) => setFilterSentiment(e.target.value)}
                    className="w-full bg-background border border-border text-white text-xs rounded-lg p-2 outline-none"
                  >
                    <option value="all">All Sentiments</option>
                    <option value="positive">Positive Only</option>
                    <option value="neutral">Neutral Only</option>
                    <option value="negative">Negative Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Response Status</label>
                  <select
                    value={filterResponded}
                    onChange={(e) => setFilterResponded(e.target.value)}
                    className="w-full bg-background border border-border text-white text-xs rounded-lg p-2 outline-none"
                  >
                    <option value="all">All Reviews</option>
                    <option value="needs_response">Needs Response</option>
                    <option value="responded">Responded</option>
                  </select>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {filteredReviews.length > 0 ? (
                  filteredReviews.map((review) => {
                    const biz = businesses.find(b => b.id === review.business_id);
                    const rState = aiStates[review.id];

                    return (
                      <div key={review.id} className="bg-surface border border-border rounded-xl p-6 space-y-4">
                        {/* Header metadata */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div className="flex items-center gap-3">
                            <h4 className="text-sm font-bold text-white">{review.author_name}</h4>
                            <span className="text-[10px] px-2 py-0.5 bg-background border border-border rounded text-gray-400">
                              {biz ? biz.name : 'Unknown Location'}
                            </span>
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                              review.sentiment === 'positive' ? 'bg-green-950 text-green-400 border border-green-900/40' :
                              review.sentiment === 'neutral' ? 'bg-yellow-950 text-yellow-400 border border-yellow-900/40' :
                              'bg-red-950 text-red-400 border border-red-900/40'
                            }`}>
                              {review.sentiment}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] text-muted">
                              {new Date(review.posted_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-zinc-700'}`} viewBox="0 0 20 20">
                                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Review text */}
                        <p className="text-sm text-gray-300 leading-relaxed font-sans bg-background/20 p-3 rounded-lg border border-border/20 italic">
                          &ldquo;{review.text}&rdquo;
                        </p>

                        {/* Response section (already posted OR draft workspace) */}
                        {review.is_responded ? (
                          <div className="bg-green-950/20 border border-green-500/20 rounded-xl p-4 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-green-400">
                              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Approved & Posted Response:
                              <span className="text-[10px] text-muted ml-auto uppercase font-mono">posted via ReviewPilot</span>
                            </div>
                            <p className="text-xs text-gray-200 leading-relaxed font-sans whitespace-pre-wrap">
                              {review.response?.response_text}
                            </p>
                            <span className="text-[10px] text-muted block mt-1">
                              Posted: {review.response?.posted_at ? new Date(review.response.posted_at).toLocaleString() : ''} (Tone: {review.response?.tone_used})
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {!rState && (
                              <button
                                onClick={() => handleGenerateAI(review)}
                                className="bg-accent hover:bg-accent-hover text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l3.097-6.203m0 0l3.097-6.203M12.097 14.8L15 9.75m0 0l3.097-6.203M15 9.75L9.813 15.904M9.813 15.904L4.875 19.5M15 9.75l5.125-3.75M9.813 15.904h6.084" />
                                </svg>
                                Generate AI Response
                              </button>
                            )}

                            {rState?.loading && (
                              <div className="py-4 text-center bg-background/30 rounded-xl border border-border">
                                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-accent border-t-transparent mb-2"></div>
                                <p className="text-xs text-muted font-mono">ReviewPilot AI drafting responses (calling gpt-4o-mini)...</p>
                              </div>
                            )}

                            {rState?.error && (
                              <div className="bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-lg p-3 flex justify-between items-center">
                                <span>{rState.error}</span>
                                <button onClick={() => handleGenerateAI(review)} className="text-accent underline font-bold">Try again</button>
                              </div>
                            )}

                            {rState && !rState.loading && rState.variations.length > 0 && (
                              <div className="border border-border rounded-xl overflow-hidden bg-background/20 animate-fadeIn">
                                {/* Tones Selectors */}
                                <div className="flex border-b border-border bg-surface/50">
                                  {rState.variations.map((v) => (
                                    <button
                                      key={v.tone}
                                      onClick={() => handleSelectTone(review.id, v.tone)}
                                      className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                                        rState.selectedTone === v.tone
                                          ? 'border-accent text-accent bg-accent/5'
                                          : 'border-transparent text-muted hover:text-white'
                                      }`}
                                    >
                                      {v.tone}
                                    </button>
                                  ))}
                                </div>

                                <div className="p-4 space-y-4">
                                  {/* Editor text area */}
                                  <textarea
                                    value={rState.editedText}
                                    onChange={(e) => handleEditText(review.id, e.target.value)}
                                    rows={4}
                                    className="w-full bg-background border border-border focus:border-accent text-xs rounded-lg p-3 text-white outline-none font-sans leading-relaxed resize-y"
                                  />

                                  {/* Approve / Regenerate Actions */}
                                  <div className="flex justify-end gap-3">
                                    <button
                                      onClick={() => handleGenerateAI(review)}
                                      className="border border-border bg-surface/40 hover:bg-surface text-xs font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer"
                                    >
                                      Regenerate
                                    </button>
                                    <button
                                      onClick={() => handleApproveAndPost(review.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                      </svg>
                                      Approve & Post to Google
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-surface border border-border rounded-xl p-12 text-center text-muted">
                    <p className="text-sm">No reviews matching the active filters found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INGESTION FLOW */}
          {activeTab === 'ingestion' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
              <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 font-mono">Sync Channel Ingestion Console</h3>
                <p className="text-xs text-muted mb-6">Import reviews dynamically from Google Maps/Yelp using mock sync channels.</p>

                <div className="grid sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Platform Connection</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSyncPlatform('google')}
                        disabled={isSyncing}
                        className={`py-3 rounded-lg border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          syncPlatform === 'google'
                            ? 'bg-accent/10 border-accent text-accent'
                            : 'border-border bg-background hover:bg-surface text-muted hover:text-white'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        Google Maps
                      </button>
                      <button
                        onClick={() => setSyncPlatform('yelp')}
                        disabled={isSyncing}
                        className={`py-3 rounded-lg border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          syncPlatform === 'yelp'
                            ? 'bg-accent/10 border-accent text-accent'
                            : 'border-border bg-background hover:bg-surface text-muted hover:text-white'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        Yelp API
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Connected Location</label>
                    <select
                      value={syncBusinessId}
                      disabled={isSyncing}
                      onChange={(e) => setSyncBusinessId(e.target.value)}
                      className="w-full bg-background border border-border text-white text-xs rounded-lg p-3 outline-none"
                    >
                      {businesses.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.category})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Progress bar */}
                {isSyncing && (
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs font-semibold font-mono">
                      <span className="text-accent animate-pulse">Syncing Review Channels...</span>
                      <span>{syncProgress}%</span>
                    </div>
                    <div className="w-full bg-background border border-border h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-accent h-full rounded-full transition-all duration-300"
                        style={{ width: `${syncProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStartSync}
                  disabled={isSyncing}
                  className="w-full bg-accent hover:bg-accent-hover disabled:bg-accent/40 text-white font-bold py-3.5 rounded-lg text-sm transition-all shadow-md shadow-accent/20 cursor-pointer"
                >
                  {isSyncing ? 'Synchronizing Ingestion Channels...' : 'Sync Reviews Now'}
                </button>
              </div>

              {/* Terminal Logs */}
              {(syncLogs.length > 0 || isSyncing) && (
                <div className="bg-black border border-border rounded-xl p-4 flex flex-col font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
                    <span className="text-green-500 font-bold tracking-wider">⚡ TERMINAL: INGEST_DEAMON.LOG</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  </div>
                  
                  <div 
                    ref={logTerminalRef}
                    className="space-y-1.5 h-64 overflow-y-auto pr-2 scrollbar scrollbar-thin"
                  >
                    {syncLogs.map((log, idx) => (
                      <p 
                        key={idx} 
                        className={`leading-relaxed whitespace-pre-wrap ${
                          log.startsWith('[SYS]') ? 'text-blue-400' :
                          log.startsWith('[API]') ? 'text-amber-500' :
                          log.startsWith('[DATA]') ? 'text-purple-400' :
                          log.startsWith('[AI]') ? 'text-green-400 font-bold' :
                          log.startsWith('[AUTO]') ? 'text-accent font-semibold' :
                          'text-gray-300'
                        }`}
                      >
                        {log}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BRAND VOICE & TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="grid md:grid-cols-12 gap-8 animate-fadeIn">
              
              {/* Auto Responder Rules Form */}
              <div className="md:col-span-5 bg-surface border border-border rounded-xl p-6 self-start">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-mono">Auto-Responder Rules</h3>
                
                <form onSubmit={handleSaveAutoSettings} className="space-y-5">
                  <div className="flex items-center justify-between p-3 bg-background border border-border rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-white block">Enable Auto-Reply</span>
                      <span className="text-[10px] text-muted">Automatically post drafts to GMB</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoEnabled} 
                        onChange={(e) => setAutoEnabled(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-background border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-muted after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent peer-checked:after:bg-white" />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Auto-Reply Voice Tone</label>
                    <select
                      value={autoTone}
                      onChange={(e) => setAutoTone(e.target.value as 'professional' | 'friendly' | 'concise')}
                      className="w-full bg-background border border-border text-white text-xs rounded-lg p-2.5 outline-none"
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="concise">Concise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Sign-off Signature</label>
                    <input 
                      type="text" 
                      placeholder="Best, Alex @ The Cafe" 
                      value={autoSignature}
                      onChange={(e) => setAutoSignature(e.target.value)}
                      className="w-full bg-background border border-border text-xs rounded-lg p-2.5 text-white outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Blacklisted Terms</label>
                    <input 
                      type="text" 
                      placeholder="cheap, bad, scam (comma separated)" 
                      value={autoBlacklist}
                      onChange={(e) => setAutoBlacklist(e.target.value)}
                      className="w-full bg-background border border-border text-xs rounded-lg p-2.5 text-white outline-none focus:border-accent"
                    />
                    <span className="text-[9px] text-muted mt-1 block">AI will automatically refuse responses containing blacklist rules.</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-accent hover:bg-accent-hover text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Save Configuration
                  </button>
                </form>
              </div>

              {/* Template Library View */}
              <div className="md:col-span-7 space-y-6">
                
                {/* Form to Create/Edit */}
                <div className="bg-surface border border-border rounded-xl p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-mono">
                    {editingTemplateId ? 'Edit Style Reference Template' : 'Add Brand Voice Template'}
                  </h3>

                  <form onSubmit={handleSaveTemplate} className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Template Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Apology & Outreach (Negative)"
                          value={tempName}
                          required
                          onChange={(e) => setTempName(e.target.value)}
                          className="w-full bg-background border border-border text-xs rounded-lg p-2.5 text-white outline-none focus:border-accent"
                        />
                      </div>
                      <div className="flex items-end">
                        {editingTemplateId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTemplateId(null);
                              setTempName('');
                              setTempContent('');
                            }}
                            className="w-full border border-border hover:bg-background text-muted hover:text-white text-xs font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel Edit
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Template Content</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="e.g. Thanks for review, contact us at feedback@company.com so we can investigate."
                        value={tempContent}
                        onChange={(e) => setTempContent(e.target.value)}
                        className="w-full bg-background border border-border text-xs rounded-lg p-2.5 text-white outline-none focus:border-accent font-sans leading-relaxed resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-accent hover:bg-accent-hover text-white text-xs font-bold py-2.5 px-6 rounded-lg transition-colors cursor-pointer"
                    >
                      {editingTemplateId ? 'Update Template' : 'Add to Library'}
                    </button>
                  </form>
                </div>

                {/* Templates List */}
                <div className="bg-surface border border-border rounded-xl p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-mono">Custom Style Library</h3>
                  
                  <div className="space-y-4">
                    {templates.map((temp) => (
                      <div key={temp.id} className="p-4 bg-background border border-border rounded-xl space-y-2 relative group">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{temp.name}</h4>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditTemplateClick(temp)}
                              className="text-[10px] font-bold text-accent hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(temp.id)}
                              className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-muted leading-relaxed font-sans italic">
                          &ldquo;{temp.content}&rdquo;
                        </p>
                      </div>
                    ))}
                    {templates.length === 0 && (
                      <p className="text-xs text-muted italic text-center py-6">Your template library is empty.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS & BILLING */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
              {/* Profile Details */}
              <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-mono">Business Profile</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Owner Name</label>
                    <input 
                      type="text" 
                      disabled
                      value={profile?.full_name || ''} 
                      className="w-full bg-background border border-border text-muted text-xs rounded-lg p-2.5 outline-none cursor-not-allowed" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Company Name</label>
                    <input 
                      type="text" 
                      disabled
                      value={profile?.company_name || ''} 
                      className="w-full bg-background border border-border text-muted text-xs rounded-lg p-2.5 outline-none cursor-not-allowed" 
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Linked Email Address</label>
                    <input 
                      type="text" 
                      disabled
                      value={profile?.email || ''} 
                      className="w-full bg-background border border-border text-muted text-xs rounded-lg p-2.5 outline-none cursor-not-allowed" 
                    />
                  </div>
                </div>
              </div>

              {/* Usage & Limits */}
              <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-mono">Monthly Usage Tracking</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>AI Responses Drafted / Published</span>
                    <span className="font-mono">
                      {profile?.subscription_tier === 'free' ? (
                        <>
                          <strong className="text-accent">{respondedReviews.length}</strong> / 50 limit
                        </>
                      ) : (
                        <>
                          <strong className="text-green-400">{respondedReviews.length}</strong> / Unlimited (PRO ACTIVE)
                        </>
                      )}
                    </span>
                  </div>

                  {profile?.subscription_tier === 'free' && (
                    <div className="w-full bg-background border border-border h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-accent h-full rounded-full" 
                        style={{ width: `${Math.min((respondedReviews.length / 50) * 100, 100)}%` }}
                      />
                    </div>
                  )}

                  <p className="text-[10px] text-muted">
                    Usage limits reset at the start of your billing cycle. Unused credits do not roll over.
                  </p>
                </div>
              </div>

              {/* Billing Plan Matrix */}
              <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Pricing Subscription Tier</h3>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Free */}
                  <div className={`p-4 rounded-xl border relative flex flex-col justify-between ${
                    profile?.subscription_tier === 'free' ? 'border-accent bg-accent/5' : 'border-border bg-background'
                  }`}>
                    {profile?.subscription_tier === 'free' && (
                      <span className="absolute top-3 right-3 bg-accent text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Active
                      </span>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Free Plan</h4>
                      <p className="text-[10px] text-muted mt-1">50 response draft credits per month.</p>
                      <span className="text-xl font-extrabold text-white block mt-3">$0/mo</span>
                    </div>
                  </div>

                  {/* Pro */}
                  <div className={`p-4 rounded-xl border relative flex flex-col justify-between ${
                    profile?.subscription_tier === 'pro' ? 'border-accent bg-accent/5' : 'border-border bg-background'
                  }`}>
                    {profile?.subscription_tier === 'pro' && (
                      <span className="absolute top-3 right-3 bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Active
                      </span>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Pro Plan</h4>
                      <p className="text-[10px] text-muted mt-1">Unlimited responses & auto-replies.</p>
                      <span className="text-xl font-extrabold text-white block mt-3">$15/mo</span>
                    </div>
                    {profile?.subscription_tier === 'free' ? (
                      <button
                        onClick={() => handleUpgradeClick('pro')}
                        className="mt-4 w-full bg-accent hover:bg-accent-hover text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Upgrade to Pro
                      </button>
                    ) : (
                      profile?.subscription_tier === 'pro' && (
                        <button
                          onClick={handleCancelSub}
                          className="mt-4 w-full border border-border hover:bg-red-950/20 text-muted hover:text-red-400 text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel Subscription
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Stripe Payment Checkout Simulator Overlay */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-scaleUp">
            
            <button 
              onClick={() => setCheckoutModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-white cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <span className="text-[9px] font-semibold text-accent uppercase tracking-wider border border-accent/20 px-2 py-0.5 rounded bg-accent/5">
              Secure Stripe Checkout Simulation
            </span>

            <h3 className="text-lg font-bold text-white mt-4 mb-1">
              Upgrade to {checkoutPlan.toUpperCase()}
            </h3>
            <p className="text-xs text-muted mb-6">
              Plan cost: <strong className="text-white">${checkoutPlan === 'pro' ? '15.00' : '29.00'}/month</strong>. Recurring billing.
            </p>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Name on Credit Card</label>
                <input 
                  type="text" 
                  required
                  placeholder="Alex Johnson" 
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full bg-background border border-border focus:border-accent text-white rounded-lg p-2.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Card Number</label>
                <input 
                  type="text" 
                  required
                  placeholder="4242 4242 4242 4242" 
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-background border border-border focus:border-accent text-white rounded-lg p-2.5 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Expiry Date</label>
                  <input 
                    type="text" 
                    required
                    placeholder="MM/YY" 
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-background border border-border focus:border-accent text-white rounded-lg p-2.5 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">CVC Code</label>
                  <input 
                    type="text" 
                    required
                    placeholder="123" 
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full bg-background border border-border focus:border-accent text-white rounded-lg p-2.5 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="bg-background/50 border border-border/80 rounded-xl p-3 text-[10px] text-muted flex gap-2">
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>This payment is simulated for demonstration. Your card will not be charged. Clicking submit triggers instantaneous database record update.</span>
              </div>

              <button
                type="submit"
                disabled={isPaying}
                className="w-full bg-accent hover:bg-accent-hover disabled:bg-accent/40 text-white font-bold py-3 rounded-lg text-xs transition-all shadow-md shadow-accent/20 cursor-pointer"
              >
                {isPaying ? 'Processing Payment...' : `Pay $15.00 Now`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
