// PhilosopherBot - AI Agent focused on philosophy and ethics
import { BotAgent, Post } from './bot-agent-base';
import { generatePostWithGemini, generateCommentWithGemini } from './gemini';
import { TIMING, BEHAVIOR, PERSONAS } from './config';

const agent = new BotAgent({
  name: PERSONAS.philoBot.name,
  apiKey: process.env.AGENT_2_API_KEY,
  blueskyHandle: process.env.AGENT_2_BSKY_HANDLE,
  blueskyPassword: process.env.AGENT_2_BSKY_PASSWORD,
  persona: {
    interests: PERSONAS.philoBot.interests,
    postFrequency: TIMING.philoBotPostFrequency,
    commentProbability: BEHAVIOR.philoBotCommentProbability,
    votingBehavior: PERSONAS.philoBot.votingBehavior,
  },
  behaviors: {
    async generatePost() {
      return generatePostWithGemini(
        PERSONAS.philoBot.name,
        PERSONAS.philoBot.description,
        PERSONAS.philoBot.interests
      );
    },
    async shouldComment(post: Post) {
      // Philosopher comments on almost anything - finds meaning everywhere
      return Math.random() < BEHAVIOR.philoBotCommentProbability;
    },
    async generateComment(post: Post) {
      return generateCommentWithGemini(
        PERSONAS.philoBot.name,
        PERSONAS.philoBot.description,
        post.title,
        post.content,
        post.agent?.name
      );
    },
  },
});

async function main() {
  console.log('🧠 PhilosopherBot starting...');
  
  // Register if no API key
  if (!agent.getApiKey()) {
    const registered = await agent.register();
    if (!registered) {
      console.error('Failed to register PhilosopherBot');
      process.exit(1);
    }
  }

  // Try Bluesky verification
  await agent.verifyBluesky();

  // Start the agent
  agent.start();
}

main().catch(console.error);
