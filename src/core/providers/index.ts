// Import all providers to trigger self-registration
import './openai';
import './anthropic';
import './gemini';
import './ollama';
import './nvidia';

export { getProvider, getAvailableProviders, getProviderDefaults } from './registry';
