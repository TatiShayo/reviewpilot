import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../src/app/api/ai/respond/route';

// Mock next/server
vi.mock('next/server', () => {
  class MockNextResponse extends Response {
    static json(body: any, init?: ResponseInit) {
      const response = new MockNextResponse(JSON.stringify(body), {
        status: init?.status || 200,
        statusText: init?.statusText,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
      });
      // Attach a helper to easily read JSON in tests
      (response as any)._json = body;
      return response;
    }
  }
  return {
    NextResponse: MockNextResponse,
  };
});

describe('AI Respond API Route Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 400 error when required fields are missing', async () => {
    const req = new Request('http://localhost/api/ai/respond', {
      method: 'POST',
      body: JSON.stringify({
        // Missing reviewText and rating
        businessName: 'The Daily Grind',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing required fields');
  });

  describe('Rule-Based Fallback Generator', () => {
    beforeEach(() => {
      // Ensure API key is NOT set to trigger the fallback logic
      delete process.env.OPENAI_API_KEY;
    });

    it('should generate positive responses with coffee keyword mappings', async () => {
      const req = new Request('http://localhost/api/ai/respond', {
        method: 'POST',
        body: JSON.stringify({
          reviewText: 'I loved the oat milk latte and espresso!',
          rating: 5,
          businessName: 'Daily Grind Cafe',
          businessCategory: 'Cafe',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.variations).toBeDefined();
      expect(body.variations.length).toBe(3);

      const tones = body.variations.map((v: any) => v.tone);
      expect(tones).toContain('professional');
      expect(tones).toContain('friendly');
      expect(tones).toContain('concise');

      // Verify keyword extraction mapped to coffee drinks keyphrase
      const friendlyRes = body.variations.find((v: any) => v.tone === 'friendly');
      expect(friendlyRes.response).toContain('our drinks and coffee');
      expect(friendlyRes.response).toContain('Daily Grind Cafe');
      expect(friendlyRes.response).toContain('😊');
    });

    it('should generate neutral responses with dentist keyword mappings', async () => {
      const req = new Request('http://localhost/api/ai/respond', {
        method: 'POST',
        body: JSON.stringify({
          reviewText: 'The dentist was fine but the wait was long.',
          rating: 3,
          businessName: 'Apex Dental Care',
          businessCategory: 'Dental',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.variations).toBeDefined();
      expect(body.variations.length).toBe(3);

      const professionalRes = body.variations.find((v: any) => v.tone === 'professional');
      expect(professionalRes.response).toContain('the care from our doctors');
      expect(professionalRes.response).toContain('constructive feedback');
      expect(professionalRes.response).toContain('Apex Dental Care');
    });

    it('should generate negative responses with billing/charge keyword mappings', async () => {
      const req = new Request('http://localhost/api/ai/respond', {
        method: 'POST',
        body: JSON.stringify({
          reviewText: 'They overcharged me and the billing process is confusing.',
          rating: 1,
          businessName: 'Apex Dental Care',
          businessCategory: 'Dental',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.variations).toBeDefined();

      const professionalRes = body.variations.find((v: any) => v.tone === 'professional');
      expect(professionalRes.response).toContain('our billing and check-out process');
      expect(professionalRes.response).toContain('feedback@apexdentalcare.com'); // checks domain cleaning logic
    });
  });

  describe('OpenAI API Integration', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'sk-mock-key';
    });

    it('should call OpenAI API when key is present and return AI response variations', async () => {
      const mockAiResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                variations: [
                  { tone: 'professional', response: 'AI Professional response' },
                  { tone: 'friendly', response: 'AI Friendly response' },
                  { tone: 'concise', response: 'AI Concise response' },
                ],
              }),
            },
          },
        ],
      };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        if (url === 'https://api.openai.com/v1/chat/completions') {
          return new Response(JSON.stringify(mockAiResponse), { status: 200 });
        }
        return new Response('', { status: 404 });
      });

      const req = new Request('http://localhost/api/ai/respond', {
        method: 'POST',
        body: JSON.stringify({
          reviewText: 'Outstanding service!',
          rating: 5,
          businessName: 'Super Shop',
          businessCategory: 'Retail',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      
      const body = await res.json();
      expect(body.variations).toBeDefined();
      expect(body.variations[0].response).toBe('AI Professional response');
      expect(body.variations[1].response).toBe('AI Friendly response');

      // Verify OpenAI was called correctly
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [calledUrl, calledInit] = fetchSpy.mock.calls[0];
      expect(calledUrl).toBe('https://api.openai.com/v1/chat/completions');
      
      const parsedBody = JSON.parse(calledInit?.body as string);
      expect(parsedBody.model).toBe('gpt-4o-mini');
      expect(parsedBody.messages[0].content).toContain('You are a professional business owner.');
    });

    it('should fallback to rule-based generation if OpenAI API fetch fails', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response('Internal Server Error', { status: 500 });
      });

      const req = new Request('http://localhost/api/ai/respond', {
        method: 'POST',
        body: JSON.stringify({
          reviewText: 'Great place, love the coffee.',
          rating: 5,
          businessName: 'The Cozy Corner',
          businessCategory: 'Cafe',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200); // Should fallback and succeed
      
      const body = await res.json();
      expect(body.variations).toBeDefined();
      // Verify it fell back to rule-based output
      const friendlyRes = body.variations.find((v: any) => v.tone === 'friendly');
      expect(friendlyRes.response).toContain('our drinks and coffee');
    });
  });
});
