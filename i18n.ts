export type Language = 'en' | 'fr';

export interface Translations {
  [key: string]: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Plugin general
    'plugin.name': 'AI Tagger',
    'plugin.description': 'Automatically generate relevant tags for your notes using AI',
    
    // Commands
    'command.generateTags': 'Generate tags for current note',
    'command.generateTagsAll': 'Generate tags for all notes',
    
    // Ribbon
    'ribbon.generateTags': 'Generate AI Tags',
    
    // Notices
    'notice.noActiveFile': 'No active file',
    'notice.notMarkdown': 'Active file is not a markdown file',
    'notice.generatingTags': 'Generating tags...',
    'notice.noTagsGenerated': 'No tags generated',
    'notice.noNewTags': 'No new tags to add',
    'notice.tagsAdded': 'Added {count} tags: {tags}',
    'notice.errorGenerating': 'Error generating tags: {error}',
    'notice.batchComplete': 'Batch processing complete. Processed: {processed}, Errors: {errors}',
    'notice.processingFiles': 'Processing {count} files...',
    'notice.processedFiles': 'Processed {processed}/{total} files...',
    'notice.rateLimitHit': 'Rate limit reached. Waiting {seconds} seconds...',
    'notice.retryingRequest': 'Request failed, retrying ({attempt}/{maxAttempts})...',
    
    // Settings
    'settings.title': 'AI Tagger Settings',
    'settings.language': 'Language',
    'settings.language.desc': 'Choose interface language',
    'settings.defaultProvider': 'Default AI Provider',
    'settings.defaultProvider.desc': 'Choose between OpenAI (ChatGPT) or Claude',
    'settings.openaiKey': 'OpenAI API Key',
    'settings.openaiKey.desc': 'Your OpenAI API key',
    'settings.claudeKey': 'Claude API Key',
    'settings.claudeKey.desc': 'Your Anthropic Claude API key',
    'settings.minTags': 'Minimum Tags',
    'settings.minTags.desc': 'Minimum number of tags to generate',
    'settings.maxTags': 'Maximum Tags',
    'settings.maxTags.desc': 'Maximum number of tags to generate',
    'settings.customPrompt': 'Custom Prompt',
    'settings.customPrompt.desc': 'Custom prompt to use for tag generation',
    'settings.autoApply': 'Auto Apply Tags',
    'settings.autoApply.desc': 'Automatically apply generated tags without preview',
    'settings.excludeExisting': 'Exclude Existing Tags',
    'settings.excludeExisting.desc': 'Do not generate tags that already exist in the note',
    'settings.rateLimit': 'Rate Limit (requests/minute)',
    'settings.rateLimit.desc': 'Maximum API requests per minute',
    'settings.maxRetries': 'Max Retries',
    'settings.maxRetries.desc': 'Maximum retry attempts for failed API calls',
    'settings.preferVaultTags': 'Prefer Existing Vault Tags',
    'settings.preferVaultTags.desc': 'When an AI-generated tag matches an existing vault tag (case-insensitive), use the vault tag\'s exact name instead',
    
    // Modals
    'modal.tagPreview.title': 'Generated Tags Preview',
    'modal.tagPreview.file': 'File: {filename}',
    'modal.tagPreview.apply': 'Apply Selected Tags',
    'modal.tagPreview.cancel': 'Cancel',
    
    'modal.batchProcessing.title': 'Batch Processing',
    'modal.batchProcessing.description': 'This will generate tags for all markdown files in your vault.',
    'modal.batchProcessing.warning': '⚠️ This may take a while and consume API credits. Are you sure?',
    'modal.batchProcessing.proceed': 'Proceed',
    'modal.batchProcessing.cancel': 'Cancel',
    
    // Errors
    'error.openaiKeyMissing': 'OpenAI API key not configured',
    'error.claudeKeyMissing': 'Claude API key not configured',
    'error.openaiApi': 'OpenAI API error: {status}',
    'error.claudeApi': 'Claude API error: {status}',
    'error.openaiError': 'OpenAI error: {message}',
    'error.claudeError': 'Claude error: {message}',
    'error.maxRetriesReached': 'Maximum retry attempts reached',
    'error.rateLimitExceeded': 'Rate limit exceeded',
  },
  
  fr: {
    // Plugin général
    'plugin.name': 'AI Tagger',
    'plugin.description': 'Génère automatiquement des tags pertinents pour vos notes avec l\'IA',
    
    // Commandes
    'command.generateTags': 'Générer des tags pour la note actuelle',
    'command.generateTagsAll': 'Générer des tags pour toutes les notes',
    
    // Ruban
    'ribbon.generateTags': 'Générer des Tags IA',
    
    // Notifications
    'notice.noActiveFile': 'Aucun fichier actif',
    'notice.notMarkdown': 'Le fichier actif n\'est pas un fichier markdown',
    'notice.generatingTags': 'Génération des tags...',
    'notice.noTagsGenerated': 'Aucun tag généré',
    'notice.noNewTags': 'Aucun nouveau tag à ajouter',
    'notice.tagsAdded': '{count} tags ajoutés : {tags}',
    'notice.errorGenerating': 'Erreur lors de la génération des tags : {error}',
    'notice.batchComplete': 'Traitement par lot terminé. Traités : {processed}, Erreurs : {errors}',
    'notice.processingFiles': 'Traitement de {count} fichiers...',
    'notice.processedFiles': 'Traités {processed}/{total} fichiers...',
    'notice.rateLimitHit': 'Limite de débit atteinte. Attente de {seconds} secondes...',
    'notice.retryingRequest': 'Échec de la requête, nouvelle tentative ({attempt}/{maxAttempts})...',
    
    // Paramètres
    'settings.title': 'Paramètres AI Tagger',
    'settings.language': 'Langue',
    'settings.language.desc': 'Choisir la langue de l\'interface',
    'settings.defaultProvider': 'Fournisseur IA par défaut',
    'settings.defaultProvider.desc': 'Choisir entre OpenAI (ChatGPT) ou Claude',
    'settings.openaiKey': 'Clé API OpenAI',
    'settings.openaiKey.desc': 'Votre clé API OpenAI',
    'settings.claudeKey': 'Clé API Claude',
    'settings.claudeKey.desc': 'Votre clé API Anthropic Claude',
    'settings.minTags': 'Tags minimum',
    'settings.minTags.desc': 'Nombre minimum de tags à générer',
    'settings.maxTags': 'Tags maximum',
    'settings.maxTags.desc': 'Nombre maximum de tags à générer',
    'settings.customPrompt': 'Prompt personnalisé',
    'settings.customPrompt.desc': 'Prompt personnalisé pour la génération de tags',
    'settings.autoApply': 'Appliquer automatiquement',
    'settings.autoApply.desc': 'Appliquer automatiquement les tags générés sans aperçu',
    'settings.excludeExisting': 'Exclure les tags existants',
    'settings.excludeExisting.desc': 'Ne pas générer les tags qui existent déjà dans la note',
    'settings.rateLimit': 'Limite de débit (requêtes/minute)',
    'settings.rateLimit.desc': 'Nombre maximum de requêtes API par minute',
    'settings.maxRetries': 'Tentatives maximum',
    'settings.maxRetries.desc': 'Nombre maximum de tentatives pour les appels API échoués',
    'settings.preferVaultTags': 'Privilégier les tags existants du coffre',
    'settings.preferVaultTags.desc': 'Si un tag généré par l\'IA correspond à un tag existant (insensible à la casse), utiliser le nom exact du tag du coffre',
    
    // Modales
    'modal.tagPreview.title': 'Aperçu des tags générés',
    'modal.tagPreview.file': 'Fichier : {filename}',
    'modal.tagPreview.apply': 'Appliquer les tags sélectionnés',
    'modal.tagPreview.cancel': 'Annuler',
    
    'modal.batchProcessing.title': 'Traitement par lot',
    'modal.batchProcessing.description': 'Ceci génèrera des tags pour tous les fichiers markdown de votre coffre.',
    'modal.batchProcessing.warning': '⚠️ Cela peut prendre du temps et consommer des crédits API. Êtes-vous sûr ?',
    'modal.batchProcessing.proceed': 'Continuer',
    'modal.batchProcessing.cancel': 'Annuler',
    
    // Erreurs
    'error.openaiKeyMissing': 'Clé API OpenAI non configurée',
    'error.claudeKeyMissing': 'Clé API Claude non configurée',
    'error.openaiApi': 'Erreur API OpenAI : {status}',
    'error.claudeApi': 'Erreur API Claude : {status}',
    'error.openaiError': 'Erreur OpenAI : {message}',
    'error.claudeError': 'Erreur Claude : {message}',
    'error.maxRetriesReached': 'Nombre maximum de tentatives atteint',
    'error.rateLimitExceeded': 'Limite de débit dépassée',
  }
};

export class I18n {
  private currentLanguage: Language = 'en';
  
  constructor(language: Language = 'en') {
    this.currentLanguage = language;
  }
  
  setLanguage(language: Language): void {
    this.currentLanguage = language;
  }
  
  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }
  
  t(key: string, params?: Record<string, string | number>): string {
    const translation = translations[this.currentLanguage][key] || translations.en[key] || key;
    
    if (!params) {
      return translation;
    }
    
    return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }
}

export const i18n = new I18n();