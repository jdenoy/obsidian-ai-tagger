import { Language } from './i18n';

export interface SmartTaggerSettings {
	openaiApiKey: string;
	claudeApiKey: string;
	defaultProvider: 'openai' | 'claude';
	maxTags: number;
	minTags: number;
	customPrompt: string;
	batchProcessing: boolean;
	autoApplyTags: boolean;
	excludeExistingTags: boolean;
	language: Language;
	rateLimit: number;
	maxRetries: number;
	preferVaultTags: boolean;
}

export const DEFAULT_SETTINGS: SmartTaggerSettings = {
	openaiApiKey: '',
	claudeApiKey: '',
	defaultProvider: 'openai',
	maxTags: 5,
	minTags: 2,
	customPrompt: 'Generate relevant tags for this note content. Focus on main topics, themes, and categories. Return tags as a comma-separated list. Each tag will not contain spaces, but dashes.',
	batchProcessing: false,
	autoApplyTags: false,
	excludeExistingTags: true,
	language: 'en',
	rateLimit: 10,
	maxRetries: 3,
	preferVaultTags: true
};