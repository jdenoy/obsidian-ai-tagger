export interface AITaggerSettings {
	openaiApiKey: string;
	claudeApiKey: string;
	defaultProvider: 'openai' | 'claude';
	maxTags: number;
	minTags: number;
	customPrompt: string;
	batchProcessing: boolean;
	autoApplyTags: boolean;
	excludeExistingTags: boolean;
}

export const DEFAULT_SETTINGS: AITaggerSettings = {
	openaiApiKey: '',
	claudeApiKey: '',
	defaultProvider: 'openai',
	maxTags: 5,
	minTags: 2,
	customPrompt: 'Generate relevant tags for this note content. Focus on main topics, themes, and categories. Return tags as a comma-separated list.',
	batchProcessing: false,
	autoApplyTags: false,
	excludeExistingTags: true
};