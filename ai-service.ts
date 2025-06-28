import { AITaggerSettings } from './settings';

export interface AIResponse {
	tags: string[];
	error?: string;
}

export class AIService {
	private settings: AITaggerSettings;

	constructor(settings: AITaggerSettings) {
		this.settings = settings;
	}

	async generateTags(content: string): Promise<AIResponse> {
		if (this.settings.defaultProvider === 'openai') {
			return this.generateTagsWithOpenAI(content);
		} else {
			return this.generateTagsWithClaude(content);
		}
	}

	private async generateTagsWithOpenAI(content: string): Promise<AIResponse> {
		if (!this.settings.openaiApiKey) {
			return { tags: [], error: 'OpenAI API key not configured' };
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
				throw new Error(`OpenAI API error: ${response.status}`);
			}

			const data = await response.json();
			const tagsText = data.choices[0].message.content.trim();
			const tags = this.parseTags(tagsText);
			
			return { tags };
		} catch (error) {
			return { tags: [], error: `OpenAI error: ${error.message}` };
		}
	}

	private async generateTagsWithClaude(content: string): Promise<AIResponse> {
		if (!this.settings.claudeApiKey) {
			return { tags: [], error: 'Claude API key not configured' };
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
				throw new Error(`Claude API error: ${response.status}`);
			}

			const data = await response.json();
			const tagsText = data.content[0].text.trim();
			const tags = this.parseTags(tagsText);
			
			return { tags };
		} catch (error) {
			return { tags: [], error: `Claude error: ${error.message}` };
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