# AI Summary Feature Setup Guide

This guide explains how to set up and use the AI-powered summary generation feature for quiz results using OpenAI's ChatGPT API.

## Overview

The AI summary feature automatically generates professional, personalized summaries of quiz results that highlight:
- Overall business health assessment
- Key strengths
- Priority areas for improvement
- Actionable recommendations

## Setup Instructions

### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy your API key (starts with `sk-...`)

⚠️ **Important**: Keep your API key secure and never commit it to version control!

### 2. Configure the API Key

You have two options to configure your API key:

#### Option A: Data Attribute (Recommended for Development)

Update the `data-openai-api-key` attribute in `/src/site/includes/content/_safety-quiz.php`:

```php
<div class="ntg-quiz" id="app" 
     data-quiz-main-navigation="../assets/data/mainNavigation.json"
     ...
     data-openai-api-key="sk-your-actual-api-key-here">
```

#### Option B: Environment Variable (Recommended for Production)

For production environments, use server-side configuration:

1. Store the API key in an environment variable or secure configuration
2. Inject it into the data attribute via PHP:

```php
<div class="ntg-quiz" id="app" 
     ...
     data-openai-api-key="<?php echo getenv('OPENAI_API_KEY'); ?>">
```

### 3. Include the AI Summary Script

The AI summary script (`8-ai-summary.js`) should be included in your JavaScript bundle. Make sure it's loaded **after** the cache and other quiz utilities but **before** the app initialization.

Script loading order:
1. `0-cache.js` - JSON cache manager
2. `1-lz-string.js` - Compression utility
3. `2-state.js` - State management
4. `3-conditional.js` - Conditional logic
5. `4-modal.js` - Modal handling
6. `5-ui.js` - UI rendering
7. `6-router.js` - Routing
8. `7-app.js` - App initialization
9. **`8-ai-summary.js`** - AI summary generation ← New file

### 4. Build the Project

After adding the new file, rebuild your JavaScript bundle:

```bash
npm run build
```

Or if you have a watch mode:

```bash
npm run start
```

## How It Works

### Workflow

1. User completes a quiz and navigates to the results page
2. Results are calculated (scores, percentages, recommendations)
3. AI summary generator is initialized with the API key from data attribute
4. A loading indicator is shown while the summary is being generated
5. Quiz data is sent to OpenAI's ChatGPT API with a structured prompt
6. The AI generates a professional, personalized summary (2-3 paragraphs)
7. The summary is displayed in a styled section on the results page
8. Summary is cached to avoid repeated API calls for the same results

### Caching

The system caches AI-generated summaries based on:
- Quiz ID
- User answers
- Overall score percentage

This prevents unnecessary API calls if the user views the same results multiple times.

### API Configuration

**Model**: `gpt-4o-mini` (default)
- Cost-effective option (~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens)
- Fast response time
- Good quality for summaries

**Alternative**: Change to `gpt-4` in `/src/js/quiz/8-ai-summary.js` for higher quality:
```javascript
this.model = 'gpt-4'; // Better quality, higher cost
```

**Parameters**:
- `temperature: 0.7` - Balanced creativity and consistency
- `max_tokens: 300` - Limit summary length (~200-250 words)

## Cost Estimation

### Typical Costs per Summary

Using `gpt-4o-mini`:
- Input: ~500-800 tokens (quiz context)
- Output: ~200-300 tokens (summary)
- **Cost per summary**: ~$0.001 - $0.002 (less than a cent)

Using `gpt-4`:
- Same token usage
- **Cost per summary**: ~$0.02 - $0.03 (2-3 cents)

### Monthly Cost Examples

**With caching** (users don't change answers frequently):
- 1,000 unique quiz completions/month with `gpt-4o-mini`: ~$2-3/month
- 1,000 unique quiz completions/month with `gpt-4`: ~$20-30/month

## Customization

### Adjust Summary Tone

Edit the system prompt in `/src/js/quiz/8-ai-summary.js`:

```javascript
{
    role: 'system',
    content: 'You are a business consultant providing concise, actionable feedback...'
}
```

### Change Summary Length

Modify the `max_tokens` parameter:

```javascript
max_tokens: 300  // Increase for longer summaries, decrease for shorter
```

### Customize Prompt Structure

The prompt is generated in the `prepareContext()` method. You can:
- Add more context about the quiz
- Include specific business domain knowledge
- Adjust the formatting instructions
- Change the tone (professional, friendly, formal, etc.)

## Troubleshooting

### Summary Not Showing

1. **Check API Key**: Ensure the API key is correctly set in the data attribute
2. **Check Console**: Open browser console (F12) for error messages
3. **Verify File Inclusion**: Ensure `8-ai-summary.js` is in your bundle
4. **Check Network Tab**: Look for failed API requests to OpenAI

### API Errors

**401 Unauthorized**: Invalid API key
- Verify your API key is correct
- Check if the key has been revoked

**429 Rate Limit**: Too many requests
- Add delays between requests
- Upgrade your OpenAI plan
- Increase caching

**500 Server Error**: OpenAI service issue
- Wait and retry
- Check [OpenAI Status](https://status.openai.com/)

### Performance Issues

**Slow Loading**: 
- OpenAI API typically responds in 2-5 seconds
- Consider showing results immediately and loading summary asynchronously (already implemented)

**High Costs**:
- Ensure caching is working
- Reduce `max_tokens` to lower output costs
- Switch to `gpt-4o-mini` if using `gpt-4`

## Security Best Practices

1. **Never expose API key in client-side code**
   - Use server-side proxy in production (see below)
   
2. **Implement rate limiting**
   - Prevent abuse by limiting requests per user/IP

3. **Validate input**
   - Sanitize quiz data before sending to API

### Production Setup: Server-Side Proxy (Recommended)

For production, create a server-side endpoint to proxy OpenAI requests:

```php
<?php
// api/generate-summary.php

header('Content-Type: application/json');

// Get API key from environment
$apiKey = getenv('OPENAI_API_KEY');

// Get request data
$input = json_decode(file_get_contents('php://input'), true);

// Forward to OpenAI
$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($input));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
```

Then update `8-ai-summary.js` to use your proxy:

```javascript
this.apiEndpoint = '/api/generate-summary.php';
// Remove Authorization header - handled server-side
```

## Styling

The AI summary uses these CSS classes (in `_quiz.scss`):

- `.ai-summary-section` - Container
- `.summary-title` - Summary heading
- `.summary-content` - Summary text
- `.summary-loading` - Loading indicator

Customize the appearance by modifying these styles in `/src/css/scss/components/custom/_quiz.scss`.

## Disabling the Feature

To disable AI summaries:

1. Remove or comment out the `data-openai-api-key` attribute
2. The feature will gracefully degrade - results will show without AI summary

## Support

For issues with:
- **OpenAI API**: Check [OpenAI Documentation](https://platform.openai.com/docs)
- **Quiz Implementation**: Check your project's main README
- **Integration Issues**: Review the console logs and network requests

## Example Output

Here's an example of what an AI-generated summary might look like:

> **Summary**
>
> Your business is currently in good health, with a score of 75 out of 100. Key strengths include strong sales performance and high customer satisfaction. However, there are areas for improvement, particularly in operational efficiency and financial stability. Addressing these areas will further enhance your business's overall health and resilience.

## License

This feature integrates with OpenAI's API and is subject to OpenAI's [Terms of Use](https://openai.com/policies/terms-of-use).
