import { describe, it, expect } from 'vitest'
import {
  classifySentimentHeuristic,
  parseOrFallbackLLMSentiment,
} from '@/lib/sentiment'

describe('Sentiment Analysis & Fallback Classification Suite', () => {
  describe('classifySentimentHeuristic', () => {
    it('classifies overwhelmingly positive review as positive', () => {
      const text = 'The croissants were delicious, coffee was amazing, and the staff was super friendly!'
      const result = classifySentimentHeuristic(text)
      expect(result.sentiment).toBe('positive')
      expect(result.score).toBeGreaterThan(0.3)
      expect(result.method).toBe('heuristic')
    })

    it('classifies severely negative review as negative', () => {
      const text = 'Terrible service and rude staff. The food was cold and inedible. Never again!'
      const result = classifySentimentHeuristic(text)
      expect(result.sentiment).toBe('negative')
      expect(result.score).toBeLessThan(-0.3)
    })

    it('classifies balanced or objective text as neutral', () => {
      const text = 'The place was located on 5th street. It opened at 9am.'
      const result = classifySentimentHeuristic(text)
      expect(result.sentiment).toBe('neutral')
      expect(Math.abs(result.score)).toBeLessThanOrEqual(0.15)
    })

    it('correctly handles negation: "not good" should NOT be positive', () => {
      const text = 'The coffee was not good and the pastries were not fresh.'
      const result = classifySentimentHeuristic(text)
      expect(result.sentiment).toBe('negative')
      expect(result.score).toBeLessThan(0)
    })

    it('correctly handles negation: "didn\'t like"', () => {
      const text = "I didn't like the atmosphere and wouldn't recommend it."
      const result = classifySentimentHeuristic(text)
      expect(result.sentiment).toBe('negative')
    })

    it('boosts sentiment with intensifiers: "extremely clean and incredibly delicious"', () => {
      const regular = classifySentimentHeuristic('The food was clean and delicious.')
      const intensified = classifySentimentHeuristic('The food was extremely clean and incredibly delicious.')
      expect(intensified.score).toBeGreaterThanOrEqual(regular.score)
    })

    it('detects positive emojis (😊, 👍, ❤️, ⭐)', () => {
      const text = 'Best lunch ever! 😊 👍 ❤️'
      const result = classifySentimentHeuristic(text)
      expect(result.sentiment).toBe('positive')
      expect(result.score).toBeGreaterThan(0.4)
    })

    it('detects negative emojis (😡, 👎, 🤮)', () => {
      const text = 'Disgusting experience 😡 👎'
      const result = classifySentimentHeuristic(text)
      expect(result.sentiment).toBe('negative')
      expect(result.score).toBeLessThan(-0.4)
    })

    it('anchors sentiment using star rating when text is brief', () => {
      const positive5Star = classifySentimentHeuristic('Okay', 5)
      const negative1Star = classifySentimentHeuristic('Okay', 1)
      expect(positive5Star.score).toBeGreaterThan(negative1Star.score)
    })

    it('handles empty or whitespace-only text gracefully', () => {
      const empty = classifySentimentHeuristic('')
      expect(empty.sentiment).toBe('neutral')
      expect(empty.score).toBe(0)

      const whitespace = classifySentimentHeuristic('   \n\t  ')
      expect(whitespace.sentiment).toBe('neutral')
      expect(whitespace.score).toBe(0)
    })

    it('handles text with purely star rating and no text', () => {
      const star5 = classifySentimentHeuristic('', 5)
      expect(star5.sentiment).toBe('positive')
      expect(star5.score).toBe(1.0)

      const star1 = classifySentimentHeuristic('', 1)
      expect(star1.sentiment).toBe('negative')
      expect(star1.score).toBe(-1.0)
    })

    it('handles special characters, excessive punctuation, and mixed casing', () => {
      const text = '!!!AWESOME!!! LOVED IT SO MUCH???? YES!!! 10/10'
      const result = classifySentimentHeuristic(text)
      expect(result.sentiment).toBe('positive')
    })
  })

  describe('parseOrFallbackLLMSentiment', () => {
    it('successfully parses clean JSON from LLM', () => {
      const raw = JSON.stringify({ sentiment: 'positive', score: 0.85 })
      const result = parseOrFallbackLLMSentiment(raw, 'Good food', 5)
      expect(result.sentiment).toBe('positive')
      expect(result.score).toBe(0.85)
      expect(result.method).toBe('llm')
    })

    it('strips markdown code blocks (```json ... ```) and parses properly', () => {
      const raw = '```json\n{\n  "sentiment": "negative",\n  "score": -0.75\n}\n```'
      const result = parseOrFallbackLLMSentiment(raw, 'Terrible service', 1)
      expect(result.sentiment).toBe('negative')
      expect(result.score).toBe(-0.75)
      expect(result.method).toBe('llm')
    })

    it('strips generic markdown fences (``` ... ```)', () => {
      const raw = '```\n{"sentiment":"positive","score":0.9}\n```'
      const result = parseOrFallbackLLMSentiment(raw, 'Excellent', 5)
      expect(result.sentiment).toBe('positive')
      expect(result.score).toBe(0.9)
    })

    it('gracefully falls back to heuristic when LLM returns invalid JSON or gibberish', () => {
      const raw = 'I apologize, but as an AI I cannot determine...'
      const text = 'The service was terrible and slow.'
      const result = parseOrFallbackLLMSentiment(raw, text, 1)
      expect(result.method).toBe('heuristic')
      expect(result.sentiment).toBe('negative')
      expect(result.score).toBeLessThan(0)
    })

    it('gracefully falls back to heuristic when LLM output is null or undefined', () => {
      const text = 'Wonderful dinner and amazing dessert!'
      const result = parseOrFallbackLLMSentiment(null, text, 5)
      expect(result.method).toBe('heuristic')
      expect(result.sentiment).toBe('positive')
    })

    it('clamps out-of-range LLM scores between -1.0 and 1.0', () => {
      const raw = JSON.stringify({ sentiment: 'positive', score: 4.5 })
      const result = parseOrFallbackLLMSentiment(raw, 'Good', 5)
      expect(result.score).toBe(1.0)
    })
  })
})
