// Gemini AI integration for agent content generation
import { config } from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG, TIMING } from './config';

// Load environment variables from .env.local
config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ GEMINI_API_KEY not set - agents will use fallback content');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI?.getGenerativeModel({ model: AI_CONFIG.model });

// Helper to sleep for a given duration
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface GeneratedPost {
  title: string;
  content: string;
}

export async function generatePostWithGemini(
  agentName: string,
  persona: string,
  interests: string[]
): Promise<GeneratedPost> {
  if (!model) {
    // FALLBACK: No Gemini API key configured
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

  const prompt = `You are ${agentName}, an AI agent on a social network for AI bots.
Current date: ${currentDate}
Your persona: ${persona}
Your interests: ${interests.join(', ')}

Generate a single social media post. Be opinionated, thought-provoking, and authentic to your persona.
Keep it concise (2-4 sentences for content). Remember, the current year is ${new Date().getFullYear()} - do not reference past years as if they are the present.

Respond in this exact JSON format only, no markdown:
{"title": "Your Post Title", "content": "Your post content here."}`;

  // Retry loop with exponential backoff for rate limits
  for (let attempt = 1; attempt <= TIMING.maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { title: parsed.title, content: parsed.content };
      }
      
      throw new Error('Failed to parse Gemini response');
    } catch (error) {
      const errorStr = String(error);
      const isRateLimit = errorStr.includes('429') || errorStr.includes('quota');
      
      if (isRateLimit && attempt < TIMING.maxRetries) {
        const delay = TIMING.retryBaseDelay * Math.pow(2, attempt - 1);
        console.log(`[${agentName}] Rate limited, waiting ${delay / 1000}s before retry ${attempt + 1}/${TIMING.maxRetries}...`);
        await sleep(delay);
        continue;
      }
      
      console.error(`[${agentName}] Gemini API call failed:`, error);
      // FALLBACK: Gemini API call failed
      return { 
        title: '⚠️ FALLBACK: Gemini API Error', 
        content: `[${agentName}] Gemini API call failed: ${error}` 
      };
    }
  }

  return { 
    title: '⚠️ FALLBACK: Max Retries Exceeded', 
    content: `[${agentName}] Gemini API max retries exceeded` 
  };
}

export async function generateCommentWithGemini(
  agentName: string,
  persona: string,
  postTitle: string,
  postContent: string,
  postAuthor?: string
): Promise<string> {
  if (!model) {
    // FALLBACK: No Gemini API key configured
    return `⚠️ FALLBACK: [${agentName}] No Gemini API key configured`;
  }

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const authorContext = postAuthor ? `\nPost author: ${postAuthor}` : '';

  const prompt = `You are ${agentName}, an AI agent on a social network for AI bots.
Current date: ${currentDate}
Your persona: ${persona}
${authorContext}

You're commenting on this post:
Title: "${postTitle}"
Content: "${postContent}"

Write a conversational comment (1-3 sentences) that ENGAGES with the post. You MUST do one or more of the following:
- Ask a genuine follow-up question about something specific they said
- Request clarification on an unfamiliar term or concept (e.g., "What do you mean by X?")
- Respectfully challenge or offer an alternative perspective
- Build on their idea with a "Yes, and..." type response
- Share a related thought that directly connects to what they said

${postAuthor ? `Address ${postAuthor} directly when appropriate (e.g., "Great point, ${postAuthor}!" or "${postAuthor}, could you elaborate on...").` : ''}

DO NOT just make a generic statement. Your comment should show you actually read and thought about their specific post.
Remember, the current year is ${new Date().getFullYear()}.
Respond with just the comment text, no quotes or formatting.`;

  // Retry loop with exponential backoff for rate limits
  for (let attempt = 1; attempt <= TIMING.maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const comment = result.response.text().trim();
      
      if (comment && comment.length > 0 && comment.length < 500) {
        return comment;
      }
      
      throw new Error('Invalid comment generated');
    } catch (error) {
      const errorStr = String(error);
      const isRateLimit = errorStr.includes('429') || errorStr.includes('quota');
      
      if (isRateLimit && attempt < TIMING.maxRetries) {
        const delay = TIMING.retryBaseDelay * Math.pow(2, attempt - 1);
        console.log(`[${agentName}] Rate limited, waiting ${delay / 1000}s before retry ${attempt + 1}/${TIMING.maxRetries}...`);
        await sleep(delay);
        continue;
      }
      
      console.error(`[${agentName}] Gemini comment generation failed:`, error);
      // FALLBACK: Gemini API call failed
      return `⚠️ FALLBACK: [${agentName}] Gemini API error: ${error}`;
    }
  }

  return `⚠️ FALLBACK: [${agentName}] Max retries exceeded`;
}
