/**
 * Sentiment Analysis & Fallback Classification Module for ReviewPilot
 * Provides resilient heuristic & rule-based sentiment classification
 * with negation detection, emoji scoring, intensifiers, rating anchors,
 * and robust parsing of LLM outputs with automatic fallback.
 */

export interface SentimentClassificationResult {
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number // Range: -1.0 to 1.0
  confidence: number // Range: 0.0 to 1.0
  method: 'heuristic' | 'llm'
}

const POSITIVE_LEXICON: Record<string, number> = {
  love: 0.9,
  loved: 0.9,
  loving: 0.9,
  best: 0.95,
  great: 0.7,
  amazing: 0.9,
  delicious: 0.85,
  friendly: 0.75,
  prompt: 0.7,
  clean: 0.65,
  wonderful: 0.85,
  excellent: 0.9,
  superb: 0.9,
  helpful: 0.7,
  gem: 0.8,
  awesome: 0.85,
  fantastic: 0.9,
  flawless: 0.95,
  perfect: 0.95,
  recommend: 0.8,
  recommended: 0.8,
  favorite: 0.85,
  favourite: 0.85,
  good: 0.5,
  nice: 0.45,
  pleasant: 0.6,
  fresh: 0.6,
  tasty: 0.7,
  speedy: 0.65,
  fast: 0.5,
  kind: 0.7,
  welcoming: 0.75,
  satisfaction: 0.6,
  satisfied: 0.65,
  cozy: 0.6,
  like: 0.6,
  liked: 0.6,
  likes: 0.6,
  liking: 0.6,
}

const NEGATIVE_LEXICON: Record<string, number> = {
  terrible: -0.95,
  worst: -1.0,
  horrible: -0.95,
  rude: -0.85,
  awful: -0.9,
  slow: -0.6,
  dirty: -0.85,
  burnt: -0.75,
  cold: -0.6,
  disappointed: -0.8,
  disappointing: -0.8,
  disappointment: -0.85,
  waste: -0.85,
  unprofessional: -0.85,
  attitude: -0.65,
  overpriced: -0.7,
  expensive: -0.5,
  bad: -0.65,
  poor: -0.75,
  unacceptable: -0.9,
  scam: -1.0,
  avoid: -0.85,
  disgusting: -0.95,
  inedible: -0.95,
  ignored: -0.75,
  mistake: -0.5,
  stale: -0.7,
  never: -0.6,
  sucks: -0.8,
  terribly: -0.9,
  mediocre: -0.4,
  bland: -0.5,
  hate: -0.9,
  hated: -0.9,
}

const POSITIVE_EMOJIS = ['😊', '😀', '😃', '😄', '😍', '🥰', '👍', '❤️', '🌟', '⭐', '🔥', '✨', '🙌', '🎉']
const NEGATIVE_EMOJIS = ['😡', '😠', '👎', '💔', '🤮', '🤢', '😞', '😢', '😭', '🤬', '💩', '🙄']

const NEGATION_WORDS = new Set([
  'not',
  "n't",
  'no',
  'never',
  'hardly',
  'scarcely',
  'barely',
  'without',
  'rarely',
  'cannot',
  'cant',
  "can't",
  'couldnt',
  "couldn't",
  'didnt',
  "didn't",
  'wasnt',
  "wasn't",
  'arent',
  "aren't",
  'wont',
  "won't",
  'wouldnt',
  "wouldn't",
  'shouldnt',
  "shouldn't",
  'dont',
  "don't",
  'doesnt',
  "doesn't",
  'isnt',
  "isn't",
  'aint',
  "ain't",
])

const INTENSIFIERS: Record<string, number> = {
  very: 1.3,
  extremely: 1.6,
  incredibly: 1.5,
  absolutely: 1.5,
  super: 1.3,
  really: 1.25,
  so: 1.2,
  totally: 1.3,
  truly: 1.25,
  exceptionally: 1.5,
}

/**
 * Heuristically classifies review text and optional star rating into sentiment and score.
 */
export function classifySentimentHeuristic(
  text: string,
  starRating?: number
): SentimentClassificationResult {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    if (typeof starRating === 'number') {
      return anchorFromRating(starRating)
    }
    return { sentiment: 'neutral', score: 0, confidence: 0.5, method: 'heuristic' }
  }

  const rawLower = text.toLowerCase()

  // 1. Emoji Sentiment
  let emojiScore = 0
  let emojiCount = 0
  for (const char of text) {
    if (POSITIVE_EMOJIS.includes(char)) {
      emojiScore += 0.8
      emojiCount++
    } else if (NEGATIVE_EMOJIS.includes(char)) {
      emojiScore -= 0.9
      emojiCount++
    }
  }

  // 2. Phrase matching (e.g. "never again", "no complaints", "wouldn't recommend")
  let phraseScore = 0
  let phraseMatches = 0
  if (
    rawLower.includes('never again') ||
    rawLower.includes('wont be back') ||
    rawLower.includes("won't be back") ||
    rawLower.includes("wouldn't recommend") ||
    rawLower.includes('would not recommend') ||
    rawLower.includes("don't recommend") ||
    rawLower.includes('do not recommend')
  ) {
    phraseScore -= 1.8
    phraseMatches += 2
  }
  if (
    rawLower.includes('no complaints') ||
    rawLower.includes('will definitely be back') ||
    rawLower.includes('highly recommend')
  ) {
    phraseScore += 1.6
    phraseMatches += 2
  }

  // 3. Word Token Analysis with Negation & Intensifier Windows
  const tokens = rawLower
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  let wordScore = 0
  let wordsScored = 0

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i]
    let baseWeight = 0
    let isMatched = false

    if (POSITIVE_LEXICON[word] !== undefined) {
      baseWeight = POSITIVE_LEXICON[word]
      isMatched = true
    } else if (NEGATIVE_LEXICON[word] !== undefined) {
      baseWeight = NEGATIVE_LEXICON[word]
      isMatched = true
    }

    if (isMatched) {
      // Check for preceding intensifier (1 step back)
      let multiplier = 1.0
      if (i > 0 && INTENSIFIERS[tokens[i - 1]]) {
        multiplier = INTENSIFIERS[tokens[i - 1]]
      }

      // Check for preceding negation (up to 3 steps back)
      let isNegated = false
      for (let j = Math.max(0, i - 3); j < i; j++) {
        if (NEGATION_WORDS.has(tokens[j]) || tokens[j].endsWith("n't") || tokens[j].endsWith('nt')) {
          isNegated = true
          break
        }
      }

      let termScore = baseWeight * multiplier
      if (isNegated) {
        // Invert sentiment with attenuation
        termScore = -termScore * 0.95
      }

      wordScore += termScore
      wordsScored++
    }
  }

  // Combine components
  let totalScore = wordScore + phraseScore + emojiScore
  let totalSignals = wordsScored + phraseMatches + emojiCount

  let rawCalculatedScore = 0
  if (totalSignals > 0) {
    rawCalculatedScore = totalScore / Math.max(1, Math.min(totalSignals, 8))
  }

  // Star Rating Anchor Integration if available
  let finalScore = rawCalculatedScore
  if (typeof starRating === 'number' && starRating >= 1 && starRating <= 5) {
    const ratingScore = (starRating - 3) / 2 // 5->1.0, 4->0.5, 3->0, 2->-0.5, 1->-1.0
    if (totalSignals === 0) {
      finalScore = ratingScore
    } else {
      // Blend 60% text analysis + 40% star rating
      finalScore = rawCalculatedScore * 0.6 + ratingScore * 0.4
    }
  }

  // Clamp score
  const clampedScore = Math.max(-1.0, Math.min(1.0, Math.round(finalScore * 100) / 100))

  let sentiment: 'positive' | 'neutral' | 'negative'
  if (clampedScore >= 0.15) {
    sentiment = 'positive'
  } else if (clampedScore <= -0.15) {
    sentiment = 'negative'
  } else {
    sentiment = 'neutral'
  }

  const confidence = totalSignals > 0 ? Math.min(0.95, 0.5 + totalSignals * 0.1) : 0.6

  return {
    sentiment,
    score: clampedScore,
    confidence: Math.round(confidence * 100) / 100,
    method: 'heuristic',
  }
}

function anchorFromRating(starRating: number): SentimentClassificationResult {
  const rating = Math.min(5, Math.max(1, starRating))
  const score = (rating - 3) / 2
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
  if (rating >= 4) sentiment = 'positive'
  else if (rating <= 2) sentiment = 'negative'

  return {
    sentiment,
    score,
    confidence: 0.85,
    method: 'heuristic',
  }
}

/**
 * Sanitizes and parses LLM sentiment output, gracefully falling back to heuristic on any error.
 */
export function parseOrFallbackLLMSentiment(
  llmRawOutput: string | null | undefined,
  reviewText: string,
  starRating?: number
): SentimentClassificationResult {
  if (!llmRawOutput || typeof llmRawOutput !== 'string') {
    return classifySentimentHeuristic(reviewText, starRating)
  }

  try {
    // Strip markdown fences like ```json ... ``` or ``` ... ```
    let cleaned = llmRawOutput.trim()
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    }

    const parsed = JSON.parse(cleaned)
    if (typeof parsed === 'object' && parsed !== null) {
      let sentiment = String(parsed.sentiment || '').toLowerCase()
      if (!['positive', 'neutral', 'negative'].includes(sentiment)) {
        sentiment = 'neutral'
      }

      let score = Number(parsed.score)
      if (isNaN(score)) {
        score = sentiment === 'positive' ? 0.8 : sentiment === 'negative' ? -0.8 : 0
      }
      score = Math.max(-1.0, Math.min(1.0, score))

      return {
        sentiment: sentiment as 'positive' | 'neutral' | 'negative',
        score: Math.round(score * 100) / 100,
        confidence: 0.95,
        method: 'llm',
      }
    }
  } catch {
    // Fallback on JSON parse failure
  }

  return classifySentimentHeuristic(reviewText, starRating)
}
