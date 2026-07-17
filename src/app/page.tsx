// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockDb } from '@/lib/mockDb';

export default function Home() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // FAQ Accordion State
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true, // open first by default
  });

  // Interactive Demo State
  const [demoState, setDemoState] = useState<'idle' | 'generating' | 'generated' | 'approved'>('idle');
  const [demoTone, setDemoTone] = useState<'professional' | 'friendly' | 'concise'>('friendly');
  const [demoText, setDemoText] = useState('');

  const demoReview = {
    author: "Jessica M.",
    rating: 5,
    text: "The oat milk latte here is absolutely amazing, and the seating area has great natural light. Service was extremely prompt and friendly!",
  };

  const demoResponses = {
    professional: "Thank you for sharing your experience, Jessica. We are pleased to hear that you enjoyed our oat milk latte and found our seating area to be comfortable. Our staff works hard to maintain prompt service, and we look forward to welcoming you back.",
    friendly: "Hi Jessica! Thanks so much for the love! 😊 We're absolutely thrilled that you loved the oat milk latte and our sunny seating area. Our team is always happy to help make your day brighter. Can't wait to see you next time!",
    concise: "Thanks for the great feedback, Jessica! We're glad you enjoyed the latte, seating, and service. See you again soon!"
  };

  useEffect(() => {
    if (demoState === 'generating') {
      const timer = setTimeout(() => {
        setDemoText(demoResponses[demoTone]);
        setDemoState('generated');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [demoState, demoTone]);

  const handleGenerateDemo = () => {
    setDemoState('generating');
    setDemoText('');
  };

  const handleApproveDemo = () => {
    setDemoState('approved');
  };

  const handleAuthAction = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!email) {
      setErrorMsg('Email is required.');
      setLoading(false);
      return;
    }

    try {
      if (modalTab === 'signup') {
        if (!fullName || !companyName) {
          setErrorMsg('All fields are required for sign-up.');
          setLoading(false);
          return;
        }
        mockDb.signup(email, fullName, companyName);
      } else {
        mockDb.login(email);
      }
      
      // Success redirect
      router.push('/dashboard');
    } catch {
      setErrorMsg('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const openModal = (tab: 'login' | 'signup') => {
    setModalTab(tab);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-white">
      {/* Top Banner / Navigation */}
      <header className="border-b border-border bg-surface/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <svg className="w-8 h-8 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              <polygon points="12 8 13.5 10.5 16 11.5 13.5 12.5 12 15 10.5 12.5 8 11.5 10.5 10.5" fill="currentColor" />
            </svg>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
              Review<span className="text-accent">Pilot</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#comparison" className="hover:text-white transition-colors">Comparison</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => openModal('login')} 
              className="text-sm font-semibold hover:text-white transition-colors px-3 py-1.5 rounded-md text-muted"
            >
              Log In
            </button>
            <button 
              onClick={() => openModal('signup')} 
              className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-md shadow-accent/20 cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 border-b border-border">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-[200px] h-[200px] rounded-full bg-accent/3 blur-[80px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-12 gap-12 items-center">
          {/* Hero Content */}
          <div className="md:col-span-7 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-3 py-1 rounded-full text-xs font-semibold text-accent tracking-wide uppercase">
              ⚡ Respond 10x Faster
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Respond to every review in <span className="text-accent underline decoration-wavy decoration-2">one click</span>.
            </h1>
            <p className="text-lg md:text-xl text-muted max-w-xl mx-auto md:mx-0">
              Sound human every time. Auto-generate authentic AI responses for your Google reviews, review draft variations, and approve in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <button 
                onClick={() => openModal('signup')} 
                className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-white text-base font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-accent/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                Start Responding Free
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <a 
                href="#features" 
                className="w-full sm:w-auto border border-border bg-surface/50 hover:bg-surface text-white text-base font-semibold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Learn More
              </a>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-6 pt-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <svg className="w-4.5 h-4.5 text-accent" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4.5 h-4.5 text-accent" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                50 Free credits monthly
              </span>
            </div>
          </div>

          {/* Hero Interactive Mockup */}
          <div className="md:col-span-5 w-full">
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl relative">
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-muted block mb-4 font-mono">PILOT CONSOLE // DEMO</span>
              
              {/* Customer Review Box */}
              <div className="bg-background/80 border border-border rounded-xl p-4 mb-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{demoReview.author}</h4>
                    <span className="text-[10px] text-muted">Google Reviewer</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(demoReview.rating)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-dark-text text-gray-300 italic leading-relaxed">
                  &ldquo;{demoReview.text}&rdquo;
                </p>
              </div>

              {/* Responder Controls */}
              {demoState === 'idle' && (
                <button 
                  onClick={handleGenerateDemo}
                  className="w-full bg-accent hover:bg-accent-hover text-white text-xs font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l3.097-6.203m0 0l3.097-6.203M12.097 14.8L15 9.75m0 0l3.097-6.203M15 9.75L9.813 15.904M9.813 15.904L4.875 19.5M15 9.75l5.125-3.75M9.813 15.904h6.084" />
                  </svg>
                  Generate AI Response
                </button>
              )}

              {demoState === 'generating' && (
                <div className="py-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-accent border-t-transparent mb-2"></div>
                  <p className="text-xs text-muted font-mono">ReviewPilot AI drafting response...</p>
                </div>
              )}

              {(demoState === 'generated' || demoState === 'approved') && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Tones Tabs */}
                  <div className="flex border-b border-border">
                    {(['professional', 'friendly', 'concise'] as const).map((tone) => (
                      <button
                        key={tone}
                        disabled={demoState === 'approved'}
                        onClick={() => {
                          setDemoTone(tone);
                          setDemoText(demoResponses[tone]);
                        }}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                          demoTone === tone
                            ? 'border-accent text-accent bg-accent/5'
                            : 'border-transparent text-muted hover:text-white'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>

                  {/* Typing Output Area */}
                  <div className="bg-background border border-border rounded-lg p-3 min-h-[90px]">
                    <p className="text-xs text-gray-200 leading-relaxed font-sans">{demoText}</p>
                  </div>

                  {/* Actions */}
                  {demoState === 'generated' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleGenerateDemo}
                        className="flex-1 border border-border hover:bg-background text-muted hover:text-white text-xs font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={handleApproveDemo}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Approve & Post
                      </button>
                    </div>
                  ) : (
                    <div className="bg-green-950/30 border border-green-500/30 rounded-lg p-3 text-center flex items-center justify-center gap-2">
                      <span className="text-green-500 font-semibold text-xs flex items-center gap-1">
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Posted to Google Maps!
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="py-20 md:py-24 border-b border-border bg-surface/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Why pay <span className="text-accent">$299/mo</span> for Birdeye or Podium?
            </h2>
            <p className="text-base text-muted mt-4">
              Get better AI, instant setup, and no-contract pricing for a fraction of the cost.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/80 font-semibold text-white">
                  <th className="p-6">Feature</th>
                  <th className="p-6 text-accent">ReviewPilot</th>
                  <th className="p-6 text-muted">Birdeye</th>
                  <th className="p-6 text-muted">Podium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr className="hover:bg-background/25 transition-colors">
                  <td className="p-6 font-medium text-white">Monthly Price</td>
                  <td className="p-6 text-accent font-bold">Free / $15</td>
                  <td className="p-6 text-gray-400">$299+</td>
                  <td className="p-6 text-gray-400">$249+</td>
                </tr>
                <tr className="hover:bg-background/25 transition-colors">
                  <td className="p-6 font-medium text-white">Setup Time</td>
                  <td className="p-6 text-white">2 Minutes (Self-serve)</td>
                  <td className="p-6 text-gray-400">2 Weeks (Sales Demo)</td>
                  <td className="p-6 text-gray-400">2 Weeks (Sales Demo)</td>
                </tr>
                <tr className="hover:bg-background/25 transition-colors">
                  <td className="p-6 font-medium text-white">AI Generation</td>
                  <td className="p-6 text-white font-semibold">1-Click (3 Tone variations)</td>
                  <td className="p-6 text-gray-400">Static templates only</td>
                  <td className="p-6 text-gray-400">Static templates only</td>
                </tr>
                <tr className="hover:bg-background/25 transition-colors">
                  <td className="p-6 font-medium text-white">Auto-Responder</td>
                  <td className="p-6 text-white">Smart matching filter</td>
                  <td className="p-6 text-gray-400">Limited / Paid Add-on</td>
                  <td className="p-6 text-gray-400">Limited / Paid Add-on</td>
                </tr>
                <tr className="hover:bg-background/25 transition-colors">
                  <td className="p-6 font-medium text-white">Contract</td>
                  <td className="p-6 text-white">No contracts, cancel anytime</td>
                  <td className="p-6 text-gray-400">12 Months mandatory</td>
                  <td className="p-6 text-gray-400">12 Months mandatory</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-24 border-b border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Features built to streamline your workflow
            </h2>
            <p className="text-base text-muted mt-4">
              Everything you need to automate your response strategy while retaining 100% voice control.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-surface border border-border rounded-xl hover:border-accent/40 transition-colors">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">3 Real-Time Tones</h3>
              <p className="text-sm text-muted leading-relaxed">
                Choose between Professional, Friendly, or Concise response drafts created using your reviewer&apos;s comments.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-surface border border-border rounded-xl hover:border-accent/40 transition-colors">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Rapid Ingestion Sync</h3>
              <p className="text-sm text-muted leading-relaxed">
                Instantly connect to Google Maps & Yelp to sync reviews into a single interface. No manual copy-pasting.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-surface border border-border rounded-xl hover:border-accent/40 transition-colors">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Sentiment Analytics</h3>
              <p className="text-sm text-muted leading-relaxed">
                Auto-categorize customer satisfaction with sentiment tagging (Positive, Neutral, Negative) and track review trends.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-surface border border-border rounded-xl hover:border-accent/40 transition-colors">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-2.225.257l-1.25.75A1 1 0 014.5 16.279v-2.029a1 1 0 00-.564-.9l-.36-.18a2.985 2.985 0 01-1.637-2.677v-1.19c0-.921.39-1.802 1.077-2.427L4.5 5.625M9.53 16.122a3 3 0 002.225-.257l1.25-.75a1 1 0 011.536.834v2.029a1 1 0 00.564.9l.36.18a2.985 2.985 0 011.637 2.677v1.19a3 3 0 01-.89 2.121l-1.077 1.077a1 1 0 01-1.414 0l-1.077-1.077a3 3 0 01-.89-2.121v-1.19z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Smart Auto-Responder</h3>
              <p className="text-sm text-muted leading-relaxed">
                Configure auto-reply rules to automatically approve and publish responses to simple 5-star reviews instantly.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-surface border border-border rounded-xl hover:border-accent/40 transition-colors">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5-6h7.5m-7.5 3h7.5m-7.5 3h7.5m-7.5 3h7.5M3 4.5h18v15H3v-15z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Voice Style & Templates</h3>
              <p className="text-sm text-muted leading-relaxed">
                Save customized response templates for different review situations. The AI uses them as brand-voice templates.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-surface border border-border rounded-xl hover:border-accent/40 transition-colors">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Safe Sandbox Post</h3>
              <p className="text-sm text-muted leading-relaxed">
                Safe review simulation lets you approve drafts, record responses, and test configurations prior to full OAuth sync.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-24 border-b border-border bg-surface/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-base text-muted mt-4">
              Get started for free. Upgrade whenever you need more locations or unlimited replies.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Free Tier */}
            <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Free Plan</h3>
                <p className="text-sm text-muted mt-2">Perfect for checking out ReviewPilot.</p>
                <div className="my-8">
                  <span className="text-4xl font-extrabold text-white">$0</span>
                  <span className="text-sm text-muted"> / month</span>
                </div>
                <ul className="space-y-4 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    50 AI Response Drafts / mo
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    1 Location Sync
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    3 Tone Variations
                  </li>
                  <li className="flex items-center gap-2 text-muted">
                    <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    Auto-Responder
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => openModal('signup')} 
                className="mt-8 w-full border border-border bg-background hover:bg-surface text-white text-sm font-bold py-3 rounded-xl transition-colors cursor-pointer"
              >
                Sign Up Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-surface border-2 border-accent rounded-2xl p-8 flex flex-col justify-between relative shadow-xl shadow-accent/5">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Pro Plan</h3>
                <p className="text-sm text-muted mt-2">Best for active small businesses.</p>
                <div className="my-8">
                  <span className="text-4xl font-extrabold text-white">$15</span>
                  <span className="text-sm text-muted"> / month</span>
                </div>
                <ul className="space-y-4 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    <strong>Unlimited</strong> AI Responses
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    Up to 5 Locations Sync
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    Custom Signature & Tone Customizer
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    Smart Auto-Responder Toggle
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    Template Library Manager
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => openModal('signup')} 
                className="mt-8 w-full bg-accent hover:bg-accent-hover text-white text-sm font-bold py-3 rounded-xl transition-all shadow-md shadow-accent/20 cursor-pointer"
              >
                Get Started with Pro
              </button>
            </div>

            {/* Business Tier */}
            <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Business Plan</h3>
                <p className="text-sm text-muted mt-2">For multi-brand operations and agencies.</p>
                <div className="my-8">
                  <span className="text-4xl font-extrabold text-white">$29</span>
                  <span className="text-sm text-muted"> / month</span>
                </div>
                <ul className="space-y-4 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    Unlimited Locations
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    White-label PDF Reports
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    Team Members Collaboration
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    Dedicated Support Manager
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => openModal('signup')} 
                className="mt-8 w-full border border-border bg-background hover:bg-surface text-white text-sm font-bold py-3 rounded-xl transition-colors cursor-pointer"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-muted mt-4">
              Have questions? We have answers.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How does the AI sound natural?",
                a: "Unlike standard rule-based auto-replies, ReviewPilot utilizes OpenAI's GPT-4o-mini to analyze the specific keywords, tone, and critiques in the review. It couples this analysis with your customized business category and pre-set brand rules, generating drafts that are authentic, human, and Context-Aware."
              },
              {
                q: "Does this actually post to Google My Business (GMB)?",
                a: "Yes! Once you authorize Google Maps and Yelp integration via secure OAuth, you can post replies directly from ReviewPilot. We support a one-click approve-and-publish flow so you never have to toggle between multiple accounts."
              },
              {
                q: "Can I customize the signature or blacklist words?",
                a: "Absolutely. Under Settings, you can configure your default signature (e.g. 'Sincerely, Alex - General Manager'), blacklist negative terms you never want the AI to write, and set tone guidelines to keep branding perfectly aligned."
              },
              {
                q: "Is there a contract or commitment?",
                a: "No! ReviewPilot is a flexible SaaS product. There are no contracts, and you can cancel or change subscription tiers at any point from your billing panel."
              }
            ].map((item, idx) => (
              <div key={idx} className="border border-border bg-surface rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-6 text-left font-bold text-white flex justify-between items-center hover:bg-background/20 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <svg 
                    className={`w-5 h-5 text-accent transition-transform duration-200 ${faqOpen[idx] ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {faqOpen[idx] && (
                  <div className="p-6 pt-0 border-t border-border/40 text-sm text-gray-300 leading-relaxed bg-background/10">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-surface/50">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span className="font-bold text-white text-base">ReviewPilot</span>
          </div>
          <span className="text-xs text-muted">
            &copy; 2026 ReviewPilot Inc. All rights reserved. Built with Tailwind CSS & Next.js.
          </span>
        </div>
      </footer>

      {/* Interactive Authentication Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-scaleUp">
            
            {/* Close Button */}
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-white cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Tabs */}
            <div className="flex border-b border-border mb-6">
              <button
                onClick={() => { setModalTab('signup'); setErrorMsg(''); }}
                className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'signup' 
                    ? 'border-accent text-accent' 
                    : 'border-transparent text-muted hover:text-white'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => { setModalTab('login'); setErrorMsg(''); }}
                className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'login' 
                    ? 'border-accent text-accent' 
                    : 'border-transparent text-muted hover:text-white'
                }`}
              >
                Log In
              </button>
            </div>

            {/* Modal Header Title */}
            <h3 className="text-xl font-bold text-white mb-2">
              {modalTab === 'signup' ? 'Create your Pilot Account' : 'Welcome Back'}
            </h3>
            <p className="text-xs text-muted mb-4">
              {modalTab === 'signup' 
                ? 'Get 50 free AI responses monthly. No credit card required.' 
                : 'Log in to manage your connected business reviews.'}
            </p>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-lg p-3 mb-4">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuthAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="name@business.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border focus:border-accent text-white rounded-lg p-3 text-sm outline-none transition-all"
                />
              </div>

              {modalTab === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Alex Johnson" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-background border border-border focus:border-accent text-white rounded-lg p-3 text-sm outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                      Company Name
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="The Daily Grind Cafe" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-background border border-border focus:border-accent text-white rounded-lg p-3 text-sm outline-none transition-all"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-hover disabled:bg-accent/50 text-white font-bold py-3 rounded-lg text-sm transition-all shadow-md shadow-accent/20 cursor-pointer"
              >
                {loading ? 'Processing...' : modalTab === 'signup' ? 'Create Account & Sync' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
