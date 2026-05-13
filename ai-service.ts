import { AITaggerSettings } from './settings';
import { RateLimiter } from './rate-limiter';
import { i18n } from './i18n';
import { Notice } from 'obsidian';

export interface AIResponse {
	tags: string[];
	error?: string;
}

export class AIService {
	private settings: AITaggerSettings;
	private rateLimiter: RateLimiter;

	constructor(settings: AITaggerSettings) {
		this.settings = settings;
		this.rateLimiter = new RateLimiter({ requestsPerMinute: settings.rateLimit });
	}

	updateSettings(settings: AITaggerSettings): void {
		this.settings = settings;
		this.rateLimiter.updateConfig({ requestsPerMinute: settings.rateLimit });
	}

	async generateTags(content: string): Promise<AIResponse> {
		await this.rateLimiter.waitIfNeeded();
		
		if (this.settings.defaultProvider === 'openai') {
			return this.generateTagsWithRetry(content, 'openai');
		} else {
			return this.generateTagsWithRetry(content, 'claude');
		}
	}

	private async generateTagsWithRetry(content: string, provider: 'openai' | 'claude'): Promise<AIResponse> {
		let lastError: string = '';
		
		for (let attempt = 1; attempt <= this.settings.maxRetries; attempt++) {
			try {
				if (attempt > 1) {
					new Notice(i18n.t('notice.retryingRequest', { 
						attempt: attempt.toString(), 
						maxAttempts: this.settings.maxRetries.toString() 
					}));
					
					// Exponential backoff: 1s, 2s, 4s, etc.
					const delay = Math.pow(2, attempt - 1) * 1000;
					await new Promise(resolve => setTimeout(resolve, delay));
				}

				if (provider === 'openai') {
					return await this.generateTagsWithOpenAI(content);
				} else {
					return await this.generateTagsWithClaude(content);
				}
			} catch (error) {
				lastError = error.message;
				
				// Don't retry for authentication errors
				if (error.message.includes('401') || error.message.includes('403')) {
					return { tags: [], error: lastError };
				}
				
				// Don't retry for rate limit errors from the API itself
				if (error.message.includes('429')) {
					return { tags: [], error: i18n.t('error.rateLimitExceeded') };
				}
			}
		}
		
		return { tags: [], error: i18n.t('error.maxRetriesReached') + ': ' + lastError };
	}

	private async generateTagsWithOpenAI(content: string): Promise<AIResponse> {
		if (!this.settings.openaiApiKey) {
			return { tags: [], error: i18n.t('error.openaiKeyMissing') };
		}

		try {
			const response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.settings.openaiApiKey}`
				},
				body: JSON.stringify({
					model: 'gpt-3.5-turbo',
					messages: [
						{
							role: 'system',
							content: `${this.settings.customPrompt} Generate between ${this.settings.minTags} and ${this.settings.maxTags} tags. Return only the tags as a comma-separated list, no other text.`
						},
						{
							role: 'user',
							content: content.substring(0, 4000)
						}
					],
					max_tokens: 100,
					temperature: 0.3
				})
			});

			if (!response.ok) {
				throw new Error(i18n.t('error.openaiApi', { status: response.status.toString() }));
			}

			const data = await response.json();
			const tagsText = data.choices[0].message.content.trim();
			const tags = this.parseTags(tagsText);
			
			return { tags };
		} catch (error) {
			throw new Error(i18n.t('error.openaiError', { message: error.message }));
		}
	}

	private async generateTagsWithClaude(content: string): Promise<AIResponse> {
		if (!this.settings.claudeApiKey) {
			return { tags: [], error: i18n.t('error.claudeKeyMissing') };
		}

		try {
			const response = await fetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': this.settings.claudeApiKey,
					'anthropic-version': '2023-06-01'
				},
				body: JSON.stringify({
					model: 'claude-3-haiku-20240307',
					max_tokens: 100,
					messages: [
						{
							role: 'user',
							content: `${this.settings.customPrompt} Generate between ${this.settings.minTags} and ${this.settings.maxTags} tags for this content. Return only the tags as a comma-separated list, no other text.\n\nContent: ${content.substring(0, 4000)}`
						}
					]
				})
			});

			if (!response.ok) {
				throw new Error(i18n.t('error.claudeApi', { status: response.status.toString() }));
			}

			const data = await response.json();
			const tagsText = data.content[0].text.trim();
			const tags = this.parseTags(tagsText);
			
			return { tags };
		} catch (error) {
			throw new Error(i18n.t('error.claudeError', { message: error.message }));
		}
	}

	private parseTags(tagsText: string): string[] {
		return tagsText
			.split(',')
			.map(tag => tag.trim().toLowerCase())
			.filter(tag => tag.length > 0 && tag.length <= 50)
			.slice(0, this.settings.maxTags);
	}
}