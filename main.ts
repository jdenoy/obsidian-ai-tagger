import { App, Plugin, PluginSettingTab, Setting, TFile, Notice, Modal, MarkdownView } from 'obsidian';
import { AIService, AIResponse } from './ai-service';
import { AITaggerSettings, DEFAULT_SETTINGS } from './settings';

export default class AITaggerPlugin extends Plugin {
	settings: AITaggerSettings;
	aiService: AIService;

	async onload() {
		await this.loadSettings();
		this.aiService = new AIService(this.settings);

		this.addRibbonIcon('tag', 'Generate AI Tags', () => {
			this.generateTagsForActiveFile();
		});

		this.addCommand({
			id: 'generate-tags-current-note',
			name: 'Generate tags for current note',
			callback: () => {
				this.generateTagsForActiveFile();
			}
		});

		this.addCommand({
			id: 'generate-tags-all-notes',
			name: 'Generate tags for all notes',
			callback: () => {
				this.showBatchProcessingModal();
			}
		});

		this.addSettingTab(new AITaggerSettingTab(this.app, this));
	}

	async generateTagsForActiveFile() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('No active file');
			return;
		}

		if (activeFile.extension !== 'md') {
			new Notice('Active file is not a markdown file');
			return;
		}

		await this.generateTagsForFile(activeFile);
	}

	async generateTagsForFile(file: TFile) {
		const notice = new Notice('Generating tags...', 0);
		
		try {
			const content = await this.app.vault.read(file);
			const contentWithoutFrontmatter = this.removeYamlFrontmatter(content);
			
			const response: AIResponse = await this.aiService.generateTags(contentWithoutFrontmatter);
			
			if (response.error) {
				notice.hide();
				new Notice(`Error: ${response.error}`);
				return;
			}

			if (response.tags.length === 0) {
				notice.hide();
				new Notice('No tags generated');
				return;
			}

			const existingTags = this.extractExistingTags(content);
			let newTags = response.tags;

			if (this.settings.excludeExistingTags) {
				newTags = response.tags.filter(tag => !existingTags.includes(tag));
			}

			if (newTags.length === 0) {
				notice.hide();
				new Notice('No new tags to add');
				return;
			}

			if (this.settings.autoApplyTags) {
				await this.applyTagsToFile(file, newTags);
				notice.hide();
				new Notice(`Added ${newTags.length} tags: ${newTags.join(', ')}`);
			} else {
				notice.hide();
				this.showTagPreviewModal(file, newTags);
			}
		} catch (error) {
			notice.hide();
			new Notice(`Error generating tags: ${error.message}`);
		}
	}

	private removeYamlFrontmatter(content: string): string {
		const frontmatterRegex = /^---\s*\n.*?\n---\s*\n/s;
		return content.replace(frontmatterRegex, '');
	}

	private extractExistingTags(content: string): string[] {
		const frontmatterMatch = content.match(/^---\s*\n(.*?)\n---\s*\n/s);
		if (!frontmatterMatch) return [];

		const frontmatter = frontmatterMatch[1];
		const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/s) || 
						 frontmatter.match(/tags:\s*\n((?:\s*-\s*.+\n?)*)/);
		
		if (!tagsMatch) return [];

		if (tagsMatch[1].includes('[')) {
			return tagsMatch[1].split(',').map(tag => tag.trim().replace(/['"]/g, ''));
		} else {
			return tagsMatch[1].split('\n')
				.map(line => line.trim().replace(/^-\s*/, '').replace(/['"]/g, ''))
				.filter(tag => tag.length > 0);
		}
	}

	private async applyTagsToFile(file: TFile, tags: string[]) {
		const content = await this.app.vault.read(file);
		const newContent = this.addTagsToContent(content, tags);
		await this.app.vault.modify(file, newContent);
	}

	private addTagsToContent(content: string, tags: string[]): string {
		const frontmatterMatch = content.match(/^---\s*\n(.*?)\n---\s*\n/s);
		
		if (frontmatterMatch) {
			const frontmatter = frontmatterMatch[1];
			const existingTags = this.extractExistingTags(content);
			const allTags = [...new Set([...existingTags, ...tags])];
			
			const tagsYaml = `tags: [${allTags.map(tag => `"${tag}"`).join(', ')}]`;
			
			let newFrontmatter = frontmatter;
			if (frontmatter.includes('tags:')) {
				newFrontmatter = frontmatter.replace(/tags:\s*\[.*?\]/s, tagsYaml);
				newFrontmatter = newFrontmatter.replace(/tags:\s*\n((?:\s*-\s*.+\n?)*)/s, tagsYaml);
			} else {
				newFrontmatter = frontmatter + '\n' + tagsYaml;
			}
			
			return content.replace(frontmatterMatch[0], `---\n${newFrontmatter}\n---\n`);
		} else {
			const tagsYaml = `tags: [${tags.map(tag => `"${tag}"`).join(', ')}]`;
			return `---\n${tagsYaml}\n---\n\n${content}`;
		}
	}

	private showTagPreviewModal(file: TFile, tags: string[]) {
		new TagPreviewModal(this.app, file, tags, async (selectedTags) => {
			if (selectedTags.length > 0) {
				await this.applyTagsToFile(file, selectedTags);
				new Notice(`Added ${selectedTags.length} tags: ${selectedTags.join(', ')}`);
			}
		}).open();
	}

	private showBatchProcessingModal() {
		new BatchProcessingModal(this.app, this).open();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.aiService = new AIService(this.settings);
	}
}

class TagPreviewModal extends Modal {
	file: TFile;
	tags: string[];
	onSubmit: (selectedTags: string[]) => void;
	selectedTags: Set<string>;

	constructor(app: App, file: TFile, tags: string[], onSubmit: (selectedTags: string[]) => void) {
		super(app);
		this.file = file;
		this.tags = tags;
		this.onSubmit = onSubmit;
		this.selectedTags = new Set(tags);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Generated Tags Preview' });
		contentEl.createEl('p', { text: `File: ${this.file.name}` });
		
		const tagsContainer = contentEl.createDiv({ cls: 'tags-container' });
		
		this.tags.forEach(tag => {
			const tagEl = tagsContainer.createDiv({ cls: 'tag-item' });
			const checkbox = tagEl.createEl('input', { type: 'checkbox' });
			checkbox.checked = this.selectedTags.has(tag);
			checkbox.addEventListener('change', () => {
				if (checkbox.checked) {
					this.selectedTags.add(tag);
				} else {
					this.selectedTags.delete(tag);
				}
			});
			tagEl.createSpan({ text: tag, cls: 'tag-text' });
		});

		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
		
		const applyButton = buttonContainer.createEl('button', { text: 'Apply Selected Tags' });
		applyButton.addEventListener('click', () => {
			this.onSubmit(Array.from(this.selectedTags));
			this.close();
		});

		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelButton.addEventListener('click', () => {
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class BatchProcessingModal extends Modal {
	plugin: AITaggerPlugin;

	constructor(app: App, plugin: AITaggerPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Batch Processing' });
		contentEl.createEl('p', { text: 'This will generate tags for all markdown files in your vault.' });
		
		const warningEl = contentEl.createEl('p', { cls: 'warning' });
		warningEl.setText('⚠️ This may take a while and consume API credits. Are you sure?');

		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
		
		const proceedButton = buttonContainer.createEl('button', { text: 'Proceed' });
		proceedButton.addEventListener('click', () => {
			this.processBatch();
			this.close();
		});

		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelButton.addEventListener('click', () => {
			this.close();
		});
	}

	async processBatch() {
		const files = this.app.vault.getMarkdownFiles();
		const notice = new Notice(`Processing ${files.length} files...`, 0);
		
		let processed = 0;
		let errors = 0;

		for (const file of files) {
			try {
				await this.plugin.generateTagsForFile(file);
				processed++;
			} catch (error) {
				errors++;
				console.error(`Error processing ${file.name}:`, error);
			}
			
			if (processed % 10 === 0) {
				notice.setMessage(`Processed ${processed}/${files.length} files...`);
			}
		}

		notice.hide();
		new Notice(`Batch processing complete. Processed: ${processed}, Errors: ${errors}`);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class AITaggerSettingTab extends PluginSettingTab {
	plugin: AITaggerPlugin;

	constructor(app: App, plugin: AITaggerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'AI Tagger Settings' });

		new Setting(containerEl)
			.setName('Default AI Provider')
			.setDesc('Choose between OpenAI (ChatGPT) or Claude')
			.addDropdown(dropdown => dropdown
				.addOption('openai', 'OpenAI (ChatGPT)')
				.addOption('claude', 'Claude')
				.setValue(this.plugin.settings.defaultProvider)
				.onChange(async (value: 'openai' | 'claude') => {
					this.plugin.settings.defaultProvider = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc('Your OpenAI API key')
			.addText(text => text
				.setPlaceholder('sk-...')
				.setValue(this.plugin.settings.openaiApiKey)
				.onChange(async (value) => {
					this.plugin.settings.openaiApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Claude API Key')
			.setDesc('Your Anthropic Claude API key')
			.addText(text => text
				.setPlaceholder('sk-ant-...')
				.setValue(this.plugin.settings.claudeApiKey)
				.onChange(async (value) => {
					this.plugin.settings.claudeApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Minimum Tags')
			.setDesc('Minimum number of tags to generate')
			.addSlider(slider => slider
				.setLimits(1, 10, 1)
				.setValue(this.plugin.settings.minTags)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.minTags = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Maximum Tags')
			.setDesc('Maximum number of tags to generate')
			.addSlider(slider => slider
				.setLimits(1, 10, 1)
				.setValue(this.plugin.settings.maxTags)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxTags = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Custom Prompt')
			.setDesc('Custom prompt to use for tag generation')
			.addTextArea(text => text
				.setPlaceholder('Generate relevant tags...')
				.setValue(this.plugin.settings.customPrompt)
				.onChange(async (value) => {
					this.plugin.settings.customPrompt = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto Apply Tags')
			.setDesc('Automatically apply generated tags without preview')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoApplyTags)
				.onChange(async (value) => {
					this.plugin.settings.autoApplyTags = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Exclude Existing Tags')
			.setDesc('Do not generate tags that already exist in the note')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.excludeExistingTags)
				.onChange(async (value) => {
					this.plugin.settings.excludeExistingTags = value;
					await this.plugin.saveSettings();
				}));
	}
}