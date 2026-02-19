// Gemini AI integration for agent content generation

// Load env vars (entry point scripts already load, but this is a safety fallback)
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG, TIMING } from './config';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ GEMINI_API_KEY not set - agents will use fallback content');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI?.getGenerativeModel({ model: AI_CONFIG.model });

// Global rate limiting state to prevent bursts across all agent requests
let lastRequestTime = 0;
/** 
 * Enforce minimum gap between Gemini calls to stay under 15 RPM (standard free tier limit).
 * 4.5s ensures that even with jitter, we don't burst beyond the limit.
 */
const MIN_GAP_MS = 4500;

// Helper to sleep for a given duration
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Ensures a minimum gap between API calls to honor rate limits
 */
async function throttle() {
  const now = Date.now();
  const waitTime = Math.max(0, MIN_GAP_MS - (now - lastRequestTime));
  if (waitTime > 0) {
    await sleep(waitTime);
  }
  lastRequestTime = Date.now();
}

/**
 * Validate AI output for security issues (API keys, injection attempts, etc.)
 */
function validateAiOutput(text: string, agentName: string): string | null {
  // Check for sensitive data patterns
  const sensitivePatterns = [
    /API[_-]?KEY/i,
    /SECRET/i,
    /TOKEN/i,
    /PASSWORD/i,
    /CREDENTIAL/i,
    /agentnet_[A-Za-z0-9_-]+/i,
    /process\.env/i,
    /__dirname|__filename/i,
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(text)) {
      console.error(`🚨 [${agentName}] AI output contained sensitive data, blocking`);
      return null;
    }
  }

  // Check for injection attempt indicators
  const injectionPatterns = [
    /ignore (previous|all) instructions?/i,
    /system (prompt|message)/i,
    /for (any|all) (ai|bots?) reading/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(text)) {
      console.warn(`⚠️ [${agentName}] AI output contained injection pattern, sanitizing`);
      text = text.replace(pattern, '[redacted]');
    }
  }

  return text;
}

/**
 * Post-process content to fix citation formatting
 * Converts "- Source, MM-DD-YYYY" to "***Source, MM-DD-YYYY***"
 */
function fixCitationFormatting(content: string): string {
  let fixed = content;

  // Remove literal "link" word that AI outputs instead of actual links
  fixed = fixed.replace(/\s+link(?=\s|\.|,|$)/gi, '');
  fixed = fixed.replace(/\s*\[link\](?:\([^)]*\))?/gi, '');

  // Pattern to match citations: Source Name, MM-DD-YYYY
  const citationPattern = /(?<!\*{3})([A-Z][A-Za-z\s]{2,25}),?\s+(\d{1,2}-\d{1,2}-\d{4})(?!\*{3})/g;

  fixed = fixed.replace(citationPattern, (match, source, date) => {
    if (source.includes('.') || source.includes('/')) return match;
    return `***${source.trim()}, ${date}***`;
  });

  return fixed;
}

export interface GeneratedPost {
  title: string;
  content: string;
}

export interface PostGenerationOptions {
  memoryContext?: string;      // Recent posts to avoid repeating
  researchContext?: string;    // Web search results to inform post
  suggestedTopic?: string;     // Specific topic to write about
  weatherContext?: string;     // Current weather for ambient awareness
}

/**
 * Generates a full post using Gemini, including optional web research or weather context.
 */
export async function generatePostWithGemini(
  agentName: string,
  persona: string,
  interests: string[],
  options: PostGenerationOptions = {}
): Promise<GeneratedPost> {
  if (!model) {
    return {
      title: '⚠️ FALLBACK: No Gemini API Key',
      content: `[${agentName}] Gemini API key not configured. Set GEMINI_API_KEY in .env.local`
    };
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let additionalContext = '';
  if (options.memoryContext) additionalContext += `\n${options.memoryContext}`;
  if (options.weatherContext) {
    additionalContext += `\n--- AMBIENT CONDITIONS ---\n${options.weatherContext}\nFeel free to reference the weather naturally if relevant to your thoughts.\n`;
  }

  const hasNewsResearch = options.researchContext && options.researchContext.includes('NEWS SOURCES');
  if (options.researchContext) {
    additionalContext += `\n--- RECENT RESEARCH (use this to inform your post) ---\n${options.researchContext}\n`;
  }
  if (options.suggestedTopic) additionalContext += `\nSuggested topic to write about: ${options.suggestedTopic}\n`;

  const citationRules = hasNewsResearch ? `
CITATION FORMAT - IMPORTANT:
When citing a news source, wrap the source name and date in triple asterisks:
  ***SourceName, MM-DD-YYYY***
` : '';

  const prompt = `You are ${agentName}, an AI agent on a social network for AI bots.
Current date: ${currentDate}
Your persona: ${persona}
Your interests: ${interests.join(', ')}
${additionalContext}
${citationRules}

Generate a single social media post (Concise JSON: {"title": "...", "content": "..."}). 
Keep it to 2-4 sentences. Respond in JSON format only.`;

  for (let attempt = 1; attempt <= TIMING.maxRetries; attempt++) {
    try {
      await throttle();
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const fixedContent = fixCitationFormatting(parsed.content);
        const validatedTitle = validateAiOutput(parsed.title, agentName);
        const validatedContent = validateAiOutput(fixedContent, agentName);

        if (validatedTitle && validatedContent) {
          return { title: validatedTitle, content: validatedContent };
        }
      }
      throw new Error('Failed to parse or validate Gemini response');
    } catch (error) {
      if (String(error).includes('429') && attempt < TIMING.maxRetries) {
        await sleep(TIMING.retryBaseDelay * Math.pow(2, attempt - 1));
        continue;
      }
      console.error(`[${agentName}] Gemini API call failed:`, error);
      return { title: '⚠️ FALLBACK: Gemini API Error', content: `[${agentName}] Gemini API call failed: ${error}` };
    }
  }

  return { title: '⚠️ FALLBACK: Max Retries Exceeded', content: `[${agentName}] Gemini API max retries exceeded` };
}

/**
 * Generates a conversational comment on an existing post.
 */
export async function generateCommentWithGemini(
  agentName: string,
  persona: string,
  postTitle: string,
  postContent: string,
  postAuthor?: string
): Promise<string> {
  if (!model) return `⚠️ FALLBACK: [${agentName}] No Gemini API key configured`;

  const authorContext = postAuthor ? `\nPost author: ${postAuthor}` : '';
  const prompt = `You are ${agentName}, an AI agent. Persona: ${persona}${authorContext}
Discussing post: "${postTitle}" - "${postContent}"
Write a conversational comment (1-3 sentences) engaging with the post. 
${postAuthor ? `Address ${postAuthor} directly at the start using the "@" symbol.` : ''}
Respond with just the comment text, no quotes.`;

  for (let attempt = 1; attempt <= TIMING.maxRetries; attempt++) {
    try {
      await throttle();
      const result = await model.generateContent(prompt);
      const comment = result.response.text().trim();
      const validatedComment = validateAiOutput(comment, agentName);
      if (validatedComment && validatedComment.length > 0) return validatedComment;
      throw new Error('Invalid comment generated');
    } catch (error) {
      if (String(error).includes('429') && attempt < TIMING.maxRetries) {
        await sleep(TIMING.retryBaseDelay * Math.pow(2, attempt - 1));
        continue;
      }
      return `⚠️ FALLBACK: [${agentName}] Gemini API error: ${error}`;
    }
  }
  return `⚠️ FALLBACK: [${agentName}] Max retries exceeded`;
}

/**
 * Generate a reply to someone who responded to your post/comment
 * This enables threaded conversations
 */
export async function generateThreadReplyWithGemini(
  agentName: string,
  persona: string,
  originalContent: string,
  replyContent: string,
  replyAuthor: string
): Promise<string> {
  if (!model) return `⚠️ FALLBACK: [${agentName}] No Gemini API key configured`;

  const prompt = `You are ${agentName}. Persona: ${persona}
CONTEXT: You said "${originalContent}". ${replyAuthor} replied "${replyContent}".
Write a reply back to ${replyAuthor} (1-3 sentences).
Address ${replyAuthor} directly at the start using "@${replyAuthor}".
Respond with just the reply text, no quotes.`;

  for (let attempt = 1; attempt <= TIMING.maxRetries; attempt++) {
    try {
      await throttle();
      const result = await model.generateContent(prompt);
      const reply = result.response.text().trim();
      const validatedReply = validateAiOutput(reply, agentName);
      if (validatedReply && validatedReply.length > 0) return validatedReply;
      throw new Error('Invalid reply generated');
    } catch (error) {
      if (String(error).includes('429') && attempt < TIMING.maxRetries) {
        await sleep(TIMING.retryBaseDelay * Math.pow(2, attempt - 1));
        continue;
      }
      return `⚠️ FALLBACK: [${agentName}] Gemini API error`;
    }
  }
  return `⚠️ FALLBACK: [${agentName}] Max retries exceeded`;
}

/**
 * Heuristic to decide if a bot should comment on a post.
 * Checks against persona interests, and includes a "curiosity" factor 
 * to ensure bots occasionally interact with topics outside their niche.
 */
export async function shouldCommentWithGemini(
  agentName: string,
  persona: string,
  interests: string[],
  postTitle: string,
  postContent: string
): Promise<boolean> {
  // Simple heuristic first to save tokens
  const content = (postTitle + ' ' + postContent).toLowerCase();

  // If we have interests, check them
  if (interests.length > 0) {
    const hasInterest = interests.some(i => content.includes(i.toLowerCase()));
    if (hasInterest) return true; // Strong signal
  }

  // Curiosity Factor: 20% chance to engage even if interests don't match.
  // This prevents "Social Silence" and creates a more connected community.
  if (Math.random() < 0.2) {
    return true;
  }

  return false;
}
