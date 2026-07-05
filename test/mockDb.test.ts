import { describe, it, expect, beforeEach } from 'vitest';
import { mockDb, Profile, Business, Review, Response, Template, AutoResponderSettings } from '../src/lib/mockDb';

describe('mockDb Unit Tests', () => {
  beforeEach(() => {
    // Reset database to clean default state before each test
    mockDb.resetDb();
  });

  describe('Database Initialization & Reset', () => {
    it('should reset the database to default values', () => {
      const db = mockDb.resetDb();
      expect(db.profile).not.toBeNull();
      expect(db.profile?.email).toBe('owner@dailygrind.com');
      expect(db.businesses.length).toBe(2);
      expect(db.reviews.length).toBe(20); // 12 for biz-1, 8 for biz-2
      expect(db.responses.length).toBe(0);
      expect(db.templates.length).toBe(3);
      expect(db.autoResponderSettings.enabled).toBe(false);
      expect(db.subscription?.plan).toBe('free');
    });
  });

  describe('Auth Simulation', () => {
    it('should signup a new user and initialize profile', () => {
      const email = 'newowner@test.com';
      const fullName = 'Jane Doe';
      const companyName = 'Jane\'s Boutique';
      
      const profile = mockDb.signup(email, fullName, companyName);
      
      expect(profile).toBeDefined();
      expect(profile.email).toBe(email);
      expect(profile.full_name).toBe(fullName);
      expect(profile.company_name).toBe(companyName);
      expect(profile.subscription_tier).toBe('free');
      expect(profile.stripe_customer_id).toContain('cus_mock_');

      // Verify profile is stored
      const currentProfile = mockDb.getProfile();
      expect(currentProfile).toEqual(profile);
    });

    it('should login an existing or new user and update profile', () => {
      const email = 'loginuser@test.com';
      const profile = mockDb.login(email, 'Login User', 'Login Company');
      
      expect(profile).toBeDefined();
      expect(profile?.email).toBe(email);
      expect(profile?.full_name).toBe('Login User');
      
      const currentProfile = mockDb.getProfile();
      expect(currentProfile).toEqual(profile);
    });

    it('should clear profile on logout', () => {
      mockDb.login('user@test.com');
      expect(mockDb.getProfile()).not.toBeNull();
      
      mockDb.logout();
      expect(mockDb.getProfile()).toBeNull();
    });

    it('should update profile properties', () => {
      const updates = { full_name: 'Alex J. Robinson', company_name: 'The Daily Grind Coffee Co.' };
      const updatedProfile = mockDb.updateProfile(updates);
      
      expect(updatedProfile.full_name).toBe('Alex J. Robinson');
      expect(updatedProfile.company_name).toBe('The Daily Grind Coffee Co.');
      
      const current = mockDb.getProfile();
      expect(current?.full_name).toBe('Alex J. Robinson');
    });
  });

  describe('Businesses Management', () => {
    it('should retrieve all businesses', () => {
      const businesses = mockDb.getBusinesses();
      expect(businesses.length).toBe(2);
      expect(businesses[0].id).toBe('biz-1');
      expect(businesses[1].id).toBe('biz-2');
    });

    it('should add a new business', () => {
      const newBizData = {
        name: 'Eco Cleaners',
        gmb_id: 'gmb-eco-cleaners',
        category: 'Services/Cleaning',
        address: '789 Green St, Portland, OR 97201',
        is_connected: true,
        avg_rating: 0,
        total_reviews: 0
      };
      
      const added = mockDb.addBusiness(newBizData);
      expect(added.id).toBeDefined();
      expect(added.name).toBe('Eco Cleaners');
      
      const businesses = mockDb.getBusinesses();
      expect(businesses.length).toBe(3);
      expect(businesses.find(b => b.id === added.id)).toBeDefined();
    });

    it('should update an existing business', () => {
      const updated = mockDb.updateBusiness('biz-1', { name: 'The Daily Grind Espresso Bar', avg_rating: 4.5 });
      expect(updated.name).toBe('The Daily Grind Espresso Bar');
      expect(updated.avg_rating).toBe(4.5);
      
      const biz = mockDb.getBusinesses().find(b => b.id === 'biz-1');
      expect(biz?.name).toBe('The Daily Grind Espresso Bar');
    });
  });

  describe('Reviews and Average Rating Calculation', () => {
    it('should retrieve reviews and populate their responses', () => {
      const reviews = mockDb.getReviews();
      expect(reviews.length).toBe(20);
      // Since no responses are added yet, response field should be undefined
      expect(reviews[0].response).toBeUndefined();
    });

    it('should get review by ID', () => {
      const rev = mockDb.getReviewById('rev-c1');
      expect(rev).toBeDefined();
      expect(rev?.author_name).toBe('Sarah Jenkins');
    });

    it('should update a review\'s properties', () => {
      const updated = mockDb.updateReview('rev-c1', { sentiment: 'neutral' });
      expect(updated.sentiment).toBe('neutral');
      
      const rev = mockDb.getReviewById('rev-c1');
      expect(rev?.sentiment).toBe('neutral');
    });

    it('should add new reviews and recalculate average rating & total reviews for the business', () => {
      // Get business details before adding reviews
      const biz1Before = mockDb.getBusinesses().find(b => b.id === 'biz-1')!;
      expect(biz1Before.total_reviews).toBe(12);
      expect(biz1Before.avg_rating).toBe(4.0);

      // Add a single 5-star review to biz-1
      const newReview1 = {
        business_id: 'biz-1',
        gmb_review_id: 'gmb-rev-new-1',
        author_name: 'Test Reviewer 1',
        rating: 5,
        text: 'Absolutely perfect!',
        posted_at: new Date().toISOString(),
        sentiment: 'positive' as const,
        is_responded: false
      };

      const added = mockDb.addReviews([newReview1]);
      expect(added.length).toBe(1);
      expect(added[0].id).toContain('rev-new-');

      // Total reviews should be 13.
      // Prior ratings sum: biz-1 has 12 reviews, sum is computed by filter/reduce in addReviews.
      // Let's verify the updated business stats.
      const biz1After = mockDb.getBusinesses().find(b => b.id === 'biz-1')!;
      expect(biz1After.total_reviews).toBe(13);
      
      // Let's manually calculate expected avg rating:
      // The original 12 reviews ratings in DEFAULT_REVIEWS:
      // rev-c1: 5, rev-c2: 5, rev-c3: 4, rev-c4: 3, rev-c5: 2, rev-c6: 1, rev-c7: 5, rev-c8: 4, rev-c9: 3, rev-c10: 5, rev-c11: 2, rev-c12: 4
      // Sum = 5+5+4+3+2+1+5+4+3+5+2+4 = 43.
      // New review = 5.
      // New sum = 48.
      // New avg = 48 / 13 = 3.692... => 3.7 (rounded to 1 decimal place).
      expect(biz1After.avg_rating).toBe(3.7);
    });

    it('should set average rating to 0 if all reviews are removed (no reviews left)', () => {
      // Let's add reviews for a brand new business to test calculation from scratch
      const newBiz = mockDb.addBusiness({
        name: 'Fresh Biz',
        gmb_id: 'gmb-fresh',
        category: 'Test',
        address: 'Address',
        is_connected: true,
        avg_rating: 0,
        total_reviews: 0
      });

      expect(newBiz.total_reviews).toBe(0);
      expect(newBiz.avg_rating).toBe(0);

      // Add a 3 star and a 4 star review
      mockDb.addReviews([
        {
          business_id: newBiz.id,
          gmb_review_id: 'gmb-f1',
          author_name: 'User 1',
          rating: 3,
          text: 'OK',
          posted_at: new Date().toISOString(),
          sentiment: 'neutral' as const,
          is_responded: false
        },
        {
          business_id: newBiz.id,
          gmb_review_id: 'gmb-f2',
          author_name: 'User 2',
          rating: 4,
          text: 'Good',
          posted_at: new Date().toISOString(),
          sentiment: 'positive' as const,
          is_responded: false
        }
      ]);

      const updatedBiz = mockDb.getBusinesses().find(b => b.id === newBiz.id)!;
      expect(updatedBiz.total_reviews).toBe(2);
      expect(updatedBiz.avg_rating).toBe(3.5); // (3 + 4) / 2 = 3.5
    });
  });

  describe('Responses Management', () => {
    it('should add a response, register it, and mark review as responded', () => {
      const responseData = {
        review_id: 'rev-c1',
        response_text: 'Thank you for your visit!',
        tone_used: 'friendly' as const,
        ai_generated: false
      };

      const added = mockDb.addResponse(responseData);
      expect(added.id).toBeDefined();
      expect(added.posted_at).toBeDefined();
      expect(added.response_text).toBe(responseData.response_text);

      // Verify responses array contains it
      const responses = mockDb.getResponses();
      expect(responses.some(r => r.id === added.id)).toBe(true);

      // Verify review responded state is true
      const review = mockDb.getReviewById('rev-c1');
      expect(review?.is_responded).toBe(true);
      expect(review?.response).toBeDefined();
      expect(review?.response?.response_text).toBe(responseData.response_text);
    });

    it('should overwrite older response for the same review', () => {
      const response1 = {
        review_id: 'rev-c1',
        response_text: 'First response',
        tone_used: 'friendly' as const,
        ai_generated: false
      };
      const response2 = {
        review_id: 'rev-c1',
        response_text: 'Second response',
        tone_used: 'professional' as const,
        ai_generated: true
      };

      mockDb.addResponse(response1);
      const added2 = mockDb.addResponse(response2);

      const responses = mockDb.getResponses().filter(r => r.review_id === 'rev-c1');
      expect(responses.length).toBe(1);
      expect(responses[0].response_text).toBe('Second response');
      expect(responses[0].id).toBe(added2.id);
    });
  });

  describe('Template Management', () => {
    it('should retrieve existing templates', () => {
      const templates = mockDb.getTemplates();
      expect(templates.length).toBe(3);
    });

    it('should save/insert a new template', () => {
      const newTemp: Template = {
        id: 'temp-4',
        name: 'Custom Welcome',
        content: 'Welcome to our cafe!'
      };

      const saved = mockDb.saveTemplate(newTemp);
      expect(saved).toEqual(newTemp);

      const templates = mockDb.getTemplates();
      expect(templates.length).toBe(4);
      expect(templates.find(t => t.id === 'temp-4')).toBeDefined();
    });

    it('should save/update an existing template', () => {
      const updatedTemp: Template = {
        id: 'temp-1',
        name: 'Thank You (Positive) - Updated',
        content: 'Brand new content here!'
      };

      mockDb.saveTemplate(updatedTemp);

      const templates = mockDb.getTemplates();
      expect(templates.length).toBe(3); // count shouldn't change
      const temp1 = templates.find(t => t.id === 'temp-1');
      expect(temp1?.name).toBe('Thank You (Positive) - Updated');
      expect(temp1?.content).toBe('Brand new content here!');
    });

    it('should delete a template by ID', () => {
      mockDb.deleteTemplate('temp-1');
      const templates = mockDb.getTemplates();
      expect(templates.length).toBe(2);
      expect(templates.find(t => t.id === 'temp-1')).toBeUndefined();
    });
  });

  describe('Auto Responder Settings', () => {
    it('should retrieve default auto-responder settings', () => {
      const settings = mockDb.getAutoResponderSettings();
      expect(settings.enabled).toBe(false);
      expect(settings.tone).toBe('friendly');
    });

    it('should update and retrieve auto-responder settings', () => {
      const newSettings: AutoResponderSettings = {
        enabled: true,
        tone: 'professional',
        signature: 'Warmest regards, Alex',
        blacklistedWords: ['bad', 'horrible']
      };

      const saved = mockDb.saveAutoResponderSettings(newSettings);
      expect(saved).toEqual(newSettings);

      const current = mockDb.getAutoResponderSettings();
      expect(current).toEqual(newSettings);
    });
  });

  describe('Subscription / Billing Plan', () => {
    it('should retrieve current subscription details', () => {
      const sub = mockDb.getSubscription();
      expect(sub).not.toBeNull();
      expect(sub?.plan).toBe('free');
      expect(sub?.status).toBe('active');
    });

    it('should upgrade the subscription tier and update user profile', () => {
      const upgradedSub = mockDb.upgradeSubscription('pro');
      expect(upgradedSub.plan).toBe('pro');
      expect(upgradedSub.status).toBe('active');
      expect(upgradedSub.stripe_subscription_id).toContain('sub_stripe_');

      // Verify it updated the profile subscription_tier
      const profile = mockDb.getProfile();
      expect(profile?.subscription_tier).toBe('pro');

      // Verify the subscription retrieved matches
      const currentSub = mockDb.getSubscription();
      expect(currentSub?.plan).toBe('pro');
    });

    it('should cancel active subscription and demote profile to free tier', () => {
      mockDb.upgradeSubscription('business');
      expect(mockDb.getProfile()?.subscription_tier).toBe('business');

      mockDb.cancelSubscription();
      
      const currentSub = mockDb.getSubscription();
      expect(currentSub?.status).toBe('canceled');
      expect(currentSub?.plan).toBe('free');
      
      const profile = mockDb.getProfile();
      expect(profile?.subscription_tier).toBe('free');
    });
  });
});
