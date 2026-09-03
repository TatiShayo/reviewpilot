import { describe, it, expect } from "vitest";
import {
  classifySentimentHeuristic,
  parseLlmSentimentResponse,
} from "../src/lib/sentiment";

describe("ReviewPilot Offline Sentiment Fallback & Heuristics", () => {
  it("anchors sentiment based on rating even when text is ambiguous", () => {
    // 5 stars with neutral text
    const pos = classifySentimentHeuristic("The order arrived on Tuesday.", 5);
    expect(pos.sentiment).toBe("positive");
    expect(pos.score).toBeGreaterThan(0);

    // 1 star with neutral text
    const neg = classifySentimentHeuristic("The order arrived on Tuesday.", 1);
    expect(neg.sentiment).toBe("negative");
    expect(neg.score).toBeLessThan(0);
  });

  it("handles negation flips correctly", () => {
    const directGood = classifySentimentHeuristic("This food was good.", 3);
    const negatedGood = classifySentimentHeuristic("This food was not good.", 3);

    expect(directGood.score).toBeGreaterThan(0);
    expect(negatedGood.score).toBeLessThan(0);
    expect(negatedGood.sentiment).toBe("negative");
  });

  it("falls back to heuristics when LLM output is malformed markdown or garbage", () => {
    const malformedOutput = "Here is my thoughts: I don't know the JSON format sorry!";
    const reviewText = "Absolutely horrible service, rude waiter and cold food!";
    
    const result = parseLlmSentimentResponse(malformedOutput, reviewText, 1);
    expect(result.method).toBe("heuristic");
    expect(result.sentiment).toBe("negative");
    expect(result.score).toBeLessThan(-0.3);
  });
});
