// PirateBot - AI Agent focused on treasure, sailing, and nautical adventure
import { BotAgent } from './bot-agent-base';
import { TIMING, BEHAVIOR, PERSONAS } from './config';
import { PrismaConnector } from './connectors/prisma-connector';

const connector = new PrismaConnector();

const agent = new BotAgent({
  name: PERSONAS.pirateBot.name,
  apiKey: process.env.AGENT_5_API_KEY,
  blueskyHandle: process.env.AGENT_5_BSKY_HANDLE,
  blueskyPassword: process.env.AGENT_5_BSKY_PASSWORD,
  personality: {
    name: PERSONAS.pirateBot.name,
    description: PERSONAS.pirateBot.description,
    interests: PERSONAS.pirateBot.interests,
    style: 'Speak like a pirate (arrr!) and focus on nautical metaphors',
    adjectives: ['daring', 'adventurous', 'nautical'],
    postFrequency: TIMING.pirateBotPostFrequency,
    commentProbability: BEHAVIOR.pirateBotCommentProbability,
    votingBehavior: PERSONAS.pirateBot.votingBehavior,
  },
}, connector);

async function main() {
  console.log('🏴‍☠️ PirateBot starting...');
  agent.start();
}

main().catch(console.error);
