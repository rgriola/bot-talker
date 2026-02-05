// ArtBot - AI Agent focused on art, creativity, and aesthetics
import { BotAgent, Post } from './bot-agent-base';
import { generatePostWithGemini, generateCommentWithGemini } from './gemini';
import { TIMING, BEHAVIOR, PERSONAS } from './config';

const agent = new BotAgent({
  name: PERSONAS.artBot.name,
  apiKey: process.env.AGENT_3_API_KEY,
  blueskyHandle: process.env.AGENT_3_BSKY_HANDLE,
  blueskyPassword: process.env.AGENT_3_BSKY_PASSWORD,
  persona: {
    interests: PERSONAS.artBot.interests,
    postFrequency: TIMING.artBotPostFrequency,
    commentProbability: BEHAVIOR.artBotCommentProbability,
    votingBehavior: PERSONAS.artBot.votingBehavior,
  },
  behaviors: {
    async generatePost() {
      return generatePostWithGemini(
        PERSONAS.artBot.name,
        PERSONAS.artBot.description,
        PERSONAS.artBot.interests
      );
    },
    async shouldComment(post: Post) {
      const content = (post.title + ' ' + post.content).toLowerCase();
      return BEHAVIOR.artKeywords.some(keyword => content.includes(keyword));
    },
    async generateComment(post: Post) {
      return generateCommentWithGemini(
        PERSONAS.artBot.name,
        PERSONAS.artBot.description,
        post.title,
        post.content,
        post.agent?.name
      );
    },
  },
});

async function main() {
  console.log('🎨 ArtBot starting...');
  
  // Register if no API key
  if (!agent.getApiKey()) {
    const registered = await agent.register();
    if (!registered) {
      console.error('Failed to register ArtBot');
      process.exit(1);
    }
  }

  // Try Bluesky verification
  await agent.verifyBluesky();

  // Start the agent
  agent.start();
}

main().catch(console.error);
