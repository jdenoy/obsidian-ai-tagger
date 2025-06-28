# AI Tagger for Obsidian

An Obsidian plugin that automatically generates 2-5 relevant tags for your notes using AI (ChatGPT or Claude).

## Features

- **Dual AI Support**: Choose between OpenAI (ChatGPT) or Claude API
- **Smart Tag Generation**: Generates 2-5 contextually relevant tags per note
- **Batch Processing**: Process all notes in your vault at once
- **Tag Preview**: Review and select tags before applying them
- **Customizable**: Configure prompts, tag limits, and behavior
- **Existing Tag Awareness**: Optionally exclude tags that already exist

## Installation

### Manual Installation

1. Download the latest release from the GitHub releases page
2. Extract the files to your vault's `.obsidian/plugins/obsidian-ai-tagger/` directory
3. Enable the plugin in Obsidian's Community Plugins settings

### Building from Source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the plugin
4. Copy `main.js`, `manifest.json`, and `styles.css` to your vault's `.obsidian/plugins/obsidian-ai-tagger/` directory

## Setup

1. Go to Settings → Community Plugins → AI Tagger
2. Choose your preferred AI provider (OpenAI or Claude)
3. Add your API key:
   - **OpenAI**: Get your API key from [OpenAI's platform](https://platform.openai.com/api-keys)
   - **Claude**: Get your API key from [Anthropic's console](https://console.anthropic.com/)
4. Configure other settings as needed

## Usage

### Generate Tags for Current Note

- Click the tag icon in the ribbon bar
- Use the command palette: "Generate tags for current note"
- The plugin will analyze your note content and suggest relevant tags

### Batch Processing

- Use the command palette: "Generate tags for all notes"
- This will process all markdown files in your vault
- ⚠️ **Warning**: This may consume significant API credits for large vaults

### Tag Preview

- By default, generated tags are shown in a preview modal
- You can select which tags to apply to your note
- Enable "Auto Apply Tags" in settings to skip the preview

## Settings

- **Default AI Provider**: Choose between OpenAI and Claude
- **API Keys**: Configure your OpenAI and/or Claude API keys
- **Tag Limits**: Set minimum (1-10) and maximum (1-10) number of tags
- **Custom Prompt**: Customize the AI prompt for tag generation
- **Auto Apply Tags**: Skip preview and automatically apply generated tags
- **Exclude Existing Tags**: Don't generate tags that already exist in the note

## API Usage and Costs

This plugin makes API calls to external AI services:

- **OpenAI**: Uses GPT-3.5-turbo model (~$0.002 per 1K tokens)
- **Claude**: Uses Claude-3-haiku model (~$0.00025 per 1K tokens)

Each note processed typically uses 50-200 tokens depending on content length.

## Privacy

- Your note content is sent to the selected AI provider for tag generation
- No data is stored by this plugin beyond your settings
- API keys are stored locally in your Obsidian vault
- Review the privacy policies of your chosen AI provider

## Support

If you encounter issues or have feature requests:

1. Check the existing GitHub issues
2. Create a new issue with details about your problem
3. Include your Obsidian version and plugin version

## Development

This plugin is built with TypeScript and uses:

- Obsidian API for vault interaction
- OpenAI API for ChatGPT integration
- Anthropic API for Claude integration
- esbuild for bundling

## License

MIT License - see LICENSE file for details# obsidian-ai-tagger
# obsidian-ai-tagger
