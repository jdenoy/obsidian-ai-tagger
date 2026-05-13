import { App, Plugin, PluginSettingTab, Setting, TFile, Notice, Modal, MarkdownView } from 'obsidian';
import { AIService, AIResponse } from './ai-service';
import { AITaggerSettings, DEFAULT_SETTINGS } from './settings';
import { i18n } from './i18n';

export default class AITaggerPlugin extends Plugin {
	settings: AITaggerSettings;
	aiService: AIService;

	async onload() {
		await this.loadSettings();
		i18n.setLanguage(this.settings.language);
		this.aiService = new AIService(this.settings);

		this.addRibbonIcon('tag', i18n.t('ribbon.generateTags'), () => {
			this.generateTagsForActiveFile();
		});

		this.addCommand({
			id: 'generate-tags-current-note',
			name: i18n.t('command.generateTags'),
			callback: () => {
				this.generateTagsForActiveFile();
			}
		});

		this.addCommand({
			id: 'generate-tags-all-notes',
			name: i18n.t('command.generateTagsAll'),
			callback: () => {
				this.showBatchProcessingModal();
			}
		});

		this.addSettingTab(new AITaggerSettingTab(this.app, this));
	}

	async generateTagsForActiveFile() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice(i18n.t('notice.noActiveFile'));
			return;
		}

		if (activeFile.extension !== 'md') {
			new Notice(i18n.t('notice.notMarkdown'));
			return;
		}

		await this.generateTagsForFile(activeFile);
	}

	async generateTagsForFile(file: TFile) {
		const notice = new Notice(i18n.t('notice.generatingTags'), 0);
		
		try {
			const content = await this.app.vault.read(file);
			const contentWithoutFrontmatter = this.removeYamlFrontmatter(content);
			
			const response: AIResponse = await this.aiService.generateTags(contentWithoutFrontmatter);
			
			if (response.error) {
				notice.hide();
				new Notice(i18n.t('notice.errorGenerating', { error: response.error }));
				return;
			}

			if (response.tags.length === 0) {
				notice.hide();
				new Notice(i18n.t('notice.noTagsGenerated'));
				return;
			}

			const existingTags = this.extractExistingTags(content);
			let newTags = response.tags;

			if (this.settings.excludeExistingTags) {
				newTags = response.tags.filter(tag => !existingTags.includes(tag));
			}

			if (newTags.length === 0) {
				notice.hide();
				new Notice(i18n.t('notice.noNewTags'));
				return;
			}

			if (this.settings.autoApplyTags) {
				await this.applyTagsToFile(file, newTags);
				notice.hide();
				new Notice(i18n.t('notice.tagsAdded', { count: newTags.length.toString(), tags: newTags.join(', ') }));
			} else {
				notice.hide();
				this.showTagPreviewModal(file, newTags);
			}
		} catch (error) {
			notice.hide();
			new Notice(i18n.t('notice.errorGenerating', { error: error.message }));
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
				new Notice(i18n.t('notice.tagsAdded', { count: selectedTags.length.toString(), tags: selectedTags.join(', ') }));
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
		i18n.setLanguage(this.settings.language);
		this.aiService.updateSettings(this.settings);
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
		contentEl.createEl('h2', { text: i18n.t('modal.tagPreview.title') });
		contentEl.createEl('p', { text: i18n.t('modal.tagPreview.file', { filename: this.file.name }) });
		
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
		
		const applyButton = buttonContainer.createEl('button', { text: i18n.t('modal.tagPreview.apply') });
		applyButton.addEventListener('click', () => {
			this.onSubmit(Array.from(this.selectedTags));
			this.close();
		});

		const cancelButton = buttonContainer.createEl('button', { text: i18n.t('modal.tagPreview.cancel') });
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
		contentEl.createEl('h2', { text: i18n.t('modal.batchProcessing.title') });
		contentEl.createEl('p', { text: i18n.t('modal.batchProcessing.description') });
		
		const warningEl = contentEl.createEl('p', { cls: 'warning' });
		warningEl.setText(i18n.t('modal.batchProcessing.warning'));

		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
		
		const proceedButton = buttonContainer.createEl('button', { text: i18n.t('modal.batchProcessing.proceed') });
		proceedButton.addEventListener('click', () => {
			this.processBatch();
			this.close();
		});

		const cancelButton = buttonContainer.createEl('button', { text: i18n.t('modal.batchProcessing.cancel') });
		cancelButton.addEventListener('click', () => {
			this.close();
		});
	}

	async processBatch() {
		const files = this.app.vault.getMarkdownFiles();
		const notice = new Notice(i18n.t('notice.processingFiles', { count: files.length.toString() }), 0);
		
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
				notice.setMessage(i18n.t('notice.processedFiles', { processed: processed.toString(), total: files.length.toString() }));
			}
		}

		notice.hide();
		new Notice(i18n.t('notice.batchComplete', { processed: processed.toString(), errors: errors.toString() }));
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

		containerEl.createEl('h2', { text: i18n.t('settings.title') });

		new Setting(containerEl)
			.setName(i18n.t('settings.language'))
			.setDesc(i18n.t('settings.language.desc'))
			.addDropdown(dropdown => dropdown
				.addOption('en', 'English')
				.addOption('fr', 'Français')
				.setValue(this.plugin.settings.language)
				.onChange(async (value: 'en' | 'fr') => {
					this.plugin.settings.language = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh the settings display
				}));

		new Setting(containerEl)
			.setName(i18n.t('settings.defaultProvider'))
			.setDesc(i18n.t('settings.defaultProvider.desc'))
			.addDropdown(dropdown => dropdown
				.addOption('openai', 'OpenAI (ChatGPT)')
				.addOption('claude', 'Claude')
				.setValue(this.plugin.settings.defaultProvider)
				.onChange(async (value: 'openai' | 'claude') => {
					this.plugin.settings.defaultProvider = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(i18n.t('settings.openaiKey'))
			.setDesc(i18n.t('settings.openaiKey.desc'))
			.addText(text => text
				.setPlaceholder('sk-...')
				.setValue(this.plugin.settings.openaiApiKey)
				.onChange(async (value) => {
					this.plugin.settings.openaiApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(i18n.t('settings.claudeKey'))
			.setDesc(i18n.t('settings.claudeKey.desc'))
			.addText(text => text
				.setPlaceholder('sk-ant-...')
				.setValue(this.plugin.settings.claudeApiKey)
				.onChange(async (value) => {
					this.plugin.settings.claudeApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(i18n.t('settings.minTags'))
			.setDesc(i18n.t('settings.minTags.desc'))
			.addSlider(slider => slider
				.setLimits(1, 10, 1)
				.setValue(this.plugin.settings.minTags)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.minTags = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(i18n.t('settings.maxTags'))
			.setDesc(i18n.t('settings.maxTags.desc'))
			.addSlider(slider => slider
				.setLimits(1, 10, 1)
				.setValue(this.plugin.settings.maxTags)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxTags = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(i18n.t('settings.customPrompt'))
			.setDesc(i18n.t('settings.customPrompt.desc'))
			.addTextArea(text => text
				.setPlaceholder('Generate relevant tags...')
				.setValue(this.plugin.settings.customPrompt)
				.onChange(async (value) => {
					this.plugin.settings.customPrompt = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(i18n.t('settings.autoApply'))
			.setDesc(i18n.t('settings.autoApply.desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoApplyTags)
				.onChange(async (value) => {
					this.plugin.settings.autoApplyTags = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(i18n.t('settings.excludeExisting'))
			.setDesc(i18n.t('settings.excludeExisting.desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.excludeExistingTags)
				.onChange(async (value) => {
					this.plugin.settings.excludeExistingTags = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(i18n.t('settings.rateLimit'))
			.setDesc(i18n.t('settings.rateLimit.desc'))
			.addSlider(slider => slider
				.setLimits(1, 60, 1)
				.setValue(this.plugin.settings.rateLimit)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.rateLimit = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(i18n.t('settings.maxRetries'))
			.setDesc(i18n.t('settings.maxRetries.desc'))
			.addSlider(slider => slider
				.setLimits(1, 10, 1)
				.setValue(this.plugin.settings.maxRetries)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxRetries = value;
					await this.plugin.saveSettings();
				}));
	}
}