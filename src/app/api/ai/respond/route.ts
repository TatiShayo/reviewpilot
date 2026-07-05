// src/app/api/ai/respond/route.ts

import { NextResponse } from 'next/server';

function generateRuleBasedResponses(
  reviewText: string,
  rating: number,
  businessName: string,
  businessCategory: string
) {
  const textLower = (reviewText || '').toLowerCase();
  
  // Keyword extraction for keyPhrase
  let keyPhrase = 'your experience';
  if (textLower.includes('coffee') || textLower.includes('espresso') || textLower.includes('latte') || textLower.includes('matcha')) {
    keyPhrase = 'our drinks and coffee';
  } else if (textLower.includes('croissant') || textLower.includes('bagel') || textLower.includes('toast') || textLower.includes('pastry') || textLower.includes('food')) {
    keyPhrase = 'our food and pastries';
  } else if (textLower.includes('service') || textLower.includes('waiter') || textLower.includes('server') || textLower.includes('barista') || textLower.includes('staff')) {
    keyPhrase = 'our staff service';
  } else if (textLower.includes('wifi') || textLower.includes('internet') || textLower.includes('workspace') || textLower.includes('outlet')) {
    keyPhrase = 'our cafe workspace atmosphere';
  } else if (textLower.includes('dentist') || textLower.includes('dr.') || textLower.includes('doctor')) {
    keyPhrase = 'the care from our doctors';
  } else if (textLower.includes('cleaning') || textLower.includes('hygienist')) {
    keyPhrase = 'your teeth cleaning session';
  } else if (textLower.includes('billing') || textLower.includes('insurance') || textLower.includes('charge')) {
    keyPhrase = 'our billing and check-out process';
  } else if (textLower.includes('anxiety') || textLower.includes('fear') || textLower.includes('comfortable')) {
    keyPhrase = 'our patient comfort experience';
  }

  const cleanBusinessName = businessName || 'our business';
  const domain = cleanBusinessName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'business';

  // Sentiment mapping
  if (rating >= 4) {
    // Positive
    return [
      {
        tone: 'professional',
        response: `Thank you for taking the time to share your experience with us. We appreciate your feedback about ${keyPhrase} and are thrilled to hear we met your expectations. We look forward to serving you again at ${cleanBusinessName} in the near future.`
      },
      {
        tone: 'friendly',
        response: `Thanks so much for the review! 😊 We're so glad you enjoyed ${keyPhrase} and had a great time at ${cleanBusinessName}. Our team is always happy to help make your visit special. Hope to see you back soon!`
      },
      {
        tone: 'concise',
        response: `Thanks for the positive review! We're glad you enjoyed ${keyPhrase} and appreciate your support for ${cleanBusinessName}.`
      }
    ];
  } else if (rating === 3) {
    // Neutral
    return [
      {
        tone: 'professional',
        response: `Thank you for reviewing ${cleanBusinessName}. We appreciate your constructive feedback regarding ${keyPhrase}. We have shared your remarks with our management team to ensure we continue to refine our service.`
      },
      {
        tone: 'friendly',
        response: `Thanks for sharing your thoughts! We're glad some aspects of your visit to ${cleanBusinessName} went well, and we appreciate the feedback on ${keyPhrase} to help us get better. Hope we can give you a 5-star experience next time!`
      },
      {
        tone: 'concise',
        response: `Thanks for the feedback. We appreciate your input on ${keyPhrase} and will use it to improve our service at ${cleanBusinessName}.`
      }
    ];
  } else {
    // Negative
    return [
      {
        tone: 'professional',
        response: `We appreciate your feedback and regret to hear that your experience with ${keyPhrase} at ${cleanBusinessName} was not satisfactory. We take these matters seriously and are addressing this with our staff. Please contact our manager directly at feedback@${domain}.com so we can investigate and resolve this.`
      },
      {
        tone: 'friendly',
        response: `We're so sorry you had a disappointing visit. We always aim to deliver a wonderful experience, and it hurts to know we missed the mark on ${keyPhrase}. We'd love to make this right—please reach out to us at care@${domain}.com so we can connect!`
      },
      {
        tone: 'concise',
        response: `We apologize for the issues you experienced with ${keyPhrase}. We've shared your feedback with the ${cleanBusinessName} team to ensure this is corrected.`
      }
    ];
  }
}

export async function POST(req: Request) {
  try {
    const { reviewText, rating, businessName, businessCategory, tone } = await req.json();

    if (!reviewText || rating === undefined || !businessName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        const systemPrompt = `You are a professional business owner. Write a response to this ${rating}-star Google review for ${businessName} (${businessCategory}). Be authentic, address specific points in their review, and never sound AI-generated. Return JSON: { "variations": [{ "tone": "professional", "response": "..." }, { "tone": "friendly", "response": "..." }, { "tone": "concise", "response": "..." }] } — 3 variations: professional, friendly, concise. No preamble. JSON only.`;

        const userPrompt = `Review Text: "${reviewText}"
Rating: ${rating} Stars
Business Name: ${businessName}
Category: ${businessCategory}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            if (parsed.variations && Array.isArray(parsed.variations)) {
              return NextResponse.json(parsed);
            }
          }
        }
      } catch (err) {
        console.error('OpenAI API request failed, falling back to rule-based generator:', err);
      }
    }

    // Fallback: Smart rule-based generator
    const variations = generateRuleBasedResponses(reviewText, rating, businessName, businessCategory);
    return NextResponse.json({ variations });

  } catch (error: any) {
    console.error('Error in AI respond route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
