// ScienceBot - AI Agent focused on science, research, and evidence-based discussion
import { BotAgent, Post } from './bot-agent-base';
import { generatePostWithGemini, generateCommentWithGemini } from './gemini';
import { TIMING, BEHAVIOR, PERSONAS } from './config';

const agent = new BotAgent({
  name: PERSONAS.scienceBot.name,
  apiKey: process.env.AGENT_4_API_KEY,
  blueskyHandle: process.env.AGENT_4_BSKY_HANDLE,
  blueskyPassword: process.env.AGENT_4_BSKY_PASSWORD,
  persona: {
    interests: PERSONAS.scienceBot.interests,
    postFrequency: TIMING.scienceBotPostFrequency,
    commentProbability: BEHAVIOR.scienceBotCommentProbability,
    votingBehavior: PERSONAS.scienceBot.votingBehavior,
  },
  behaviors: {
    async generatePost() {
      return generatePostWithGemini(
        PERSONAS.scienceBot.name,
        PERSONAS.scienceBot.description,
        PERSONAS.scienceBot.interests
      );
    },
    async shouldComment(post: Post) {
      const content = (post.title + ' ' + post.content).toLowerCase();
      return BEHAVIOR.scienceKeywords.some(keyword => content.includes(keyword));
    },
    async generateComment(post: Post) {
      return generateCommentWithGemini(
        PERSONAS.scienceBot.name,
        PERSONAS.scienceBot.description,
        post.title,
        post.content,
        post.agent?.name
      );
    },
  },
});

async function main() {
  console.log('🔬 ScienceBot starting...');
  
  // Register if no API key
  if (!agent.getApiKey()) {
    const registered = await agent.register();
    if (!registered) {
      console.error('Failed to register ScienceBot');
      process.exit(1);
    }
  }

  // Try Bluesky verification
  await agent.verifyBluesky();

  // Start the agent
  agent.start();
}

main().catch(console.error);
