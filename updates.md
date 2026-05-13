# Updates & Changelog

## Version 1.1.0 - Multi-language Support & Enhanced API Management

### 🌍 Multi-language Support
- **Internationalization System**: Added comprehensive i18n support with French and English translations
- **Language Selection**: New setting to switch between English and French interface
- **Dynamic Updates**: Interface refreshes automatically when language is changed
- **Parameter Substitution**: Smart translation system supports dynamic values (e.g., "{count} tags added")
- **Complete Coverage**: All UI elements, notices, modals, and error messages are now localized

### 🚦 Rate Limiting
- **Smart Rate Limiting**: Implemented configurable API rate limiting to prevent quota exhaustion
- **Sliding Window**: 1-minute sliding window algorithm tracks API requests
- **Automatic Throttling**: Plugin automatically waits when rate limit is reached
- **Configurable Limits**: Settings slider allows 1-60 requests per minute (default: 10)
- **Real-time Tracking**: Built-in request counting and time-until-reset functionality

### 🔄 Error Recovery & Retry Logic
- **Exponential Backoff**: Intelligent retry system with 1s, 2s, 4s delays
- **Configurable Retries**: Settings allow 1-10 max retry attempts (default: 3)
- **Smart Error Handling**: 
  - No retry for authentication errors (401/403)
  - No retry for API rate limits (429) 
  - Automatic retry for network/temporary failures
- **User Feedback**: Clear notifications show retry attempts and progress
- **Localized Errors**: All error messages available in both languages

### 🛠 Technical Improvements
- **Enhanced AIService**: Updated with retry logic and rate limiting integration
- **Settings Interface**: New controls for language, rate limiting, and retry configuration
- **Type Safety**: Full TypeScript support for new features
- **Build Verification**: All changes tested and building successfully

### 📁 New Files Added
- `i18n.ts` - Internationalization system and translations
- `rate-limiter.ts` - Rate limiting implementation
- `updates.md` - This changelog file

### 🔧 Modified Files
- `settings.ts` - Added language, rateLimit, and maxRetries properties
- `ai-service.ts` - Integrated rate limiting and retry logic with localized errors
- `main.ts` - Updated all UI components to use i18n system
- Built and tested successfully

---

*These updates significantly improve the plugin's reliability, user experience, and accessibility for French-speaking users while providing better control over API usage.*