/* ai-summary.js
   OpenAI API integration for generating quiz result summaries.
   Generates natural language summaries based on quiz answers and scores.
*/
(function (global) {
    class AISummaryGenerator {
        constructor() {
            this.apiKey = null;
            this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
            this.model = 'gpt-4o-mini'; // Use gpt-4o-mini for cost efficiency, or 'gpt-4' for better quality
            this.cache = new Map(); // Cache summaries to avoid repeated API calls
        }

        /**
         * Initialize the AI summary generator with API key
         * @param {string} apiKey - OpenAI API key
         */
        init(apiKey) {
            this.apiKey = apiKey;
        }

        /**
         * Set API key from data attribute
         */
        initFromDataAttribute() {
            const appEl = document.getElementById('app');
            if (appEl && appEl.dataset.openaiApiKey) {
                this.apiKey = appEl.dataset.openaiApiKey;
            }
        }

        /**
         * Generate a cache key from quiz results
         */
        getCacheKey(quizId, answers, overallPercentage) {
            return `${quizId}-${JSON.stringify(answers)}-${overallPercentage}`;
        }

        /**
         * Generate AI summary for quiz results
         * @param {Object} params - Parameters for summary generation
         * @param {string} params.quizId - Quiz identifier
         * @param {string} params.quizTitle - Quiz title
         * @param {number} params.overallPercentage - Overall score percentage
         * @param {Array} params.pageScores - Array of page scores
         * @param {Object} params.answers - User's answers
         * @param {Object} params.quiz - Full quiz data
         * @returns {Promise<Object>} Generated summary with title and content
         */
        async generateSummary({ quizId, quizTitle, overallPercentage, pageScores, answers, quiz }) {
            if (!this.apiKey) {
                console.warn('OpenAI API key not configured. Skipping AI summary generation.');
                return null;
            }

            // Check cache first
            const cacheKey = this.getCacheKey(quizId, answers, overallPercentage);
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            try {
                // Prepare context for AI
                const context = this.prepareContext({ quizTitle, overallPercentage, pageScores, answers, quiz });

                // Call OpenAI API
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: [
                            {
                                role: 'system',
                                content: 'You are a business consultant providing concise, actionable feedback on business health assessments. Generate professional summaries that highlight strengths and areas for improvement.'
                            },
                            {
                                role: 'user',
                                content: context
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 150
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
                }

                const data = await response.json();
                const summaryText = data.choices[0]?.message?.content?.trim();

                if (!summaryText) {
                    throw new Error('No summary generated from OpenAI API');
                }

                // Parse the summary
                const summary = {
                    title: 'Summary',
                    content: summaryText
                };

                // Cache the result
                this.cache.set(cacheKey, summary);

                return summary;
            } catch (error) {
                console.error('Error generating AI summary:', error);
                return null;
            }
        }

        /**
         * Prepare context string for OpenAI API
         */
        prepareContext({ quizTitle, overallPercentage, pageScores, answers, quiz }) {
            const scoreDescription = this.getScoreDescription(overallPercentage);
            
            // Identify strengths and weaknesses
            const strengths = pageScores.filter(ps => ps.percentage >= 70).map(ps => ps.title);
            const weaknesses = pageScores.filter(ps => ps.percentage < 70).map(ps => ps.title);

            // Analyze specific answers for key insights
            const insights = this.extractKeyInsights(quiz, answers);

            const prompt = `Generate a professional business health summary for "${quizTitle}" with the following results:

Overall Score: ${overallPercentage}/100
Score Level: ${scoreDescription}

Category Scores:
${pageScores.map(ps => `- ${ps.title}: ${ps.percentage}% (${ps.score}/${ps.possible})`).join('\n')}

${strengths.length > 0 ? `Strong Areas: ${strengths.join(', ')}` : ''}
${weaknesses.length > 0 ? `Areas for Improvement: ${weaknesses.join(', ')}` : ''}

Key Insights:
${insights.join('\n')}

Please generate a concise, professional summary (1-2 paragraphs, max 100 words) that:
1. Starts with an overall assessment statement
2. Highlights 1-2 key strengths
3. Identifies 1-2 priority areas for improvement
4. Uses a supportive, actionable tone

Format the response as plain text without markdown formatting or headings.`;

            return prompt;
        }

        /**
         * Get descriptive text for score percentage
         */
        getScoreDescription(percentage) {
            if (percentage >= 90) return 'Excellent';
            if (percentage >= 75) return 'Good';
            if (percentage >= 60) return 'Fair';
            if (percentage >= 40) return 'Needs Improvement';
            return 'Critical';
        }

        /**
         * Extract key insights from specific answers
         */
        extractKeyInsights(quiz, answers) {
            const insights = [];
            
            for (const page of quiz.pages) {
                for (const question of page.questions) {
                    if (question.type === 'group' && question.subQuestions) {
                        for (const subQ of question.subQuestions) {
                            const answer = answers[subQ.id];
                            if (answer === 'No' || answer === 'Unsure') {
                                insights.push(`- ${subQ.label || subQ.question}: ${answer}`);
                            }
                        }
                    } else {
                        const answer = answers[question.id];
                        if (answer === 'No' || answer === 'Unsure') {
                            insights.push(`- ${question.label || question.question}: ${answer}`);
                        }
                    }
                }
            }
            
            // Limit to top 5 most relevant insights
            return insights.slice(0, 5);
        }

        /**
         * Clear the summary cache
         */
        clearCache() {
            this.cache.clear();
        }
    }

    // Create global instance
    global.AISummaryGenerator = new AISummaryGenerator();
})(window);
