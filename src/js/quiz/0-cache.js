/* cache.js
   JSON cache manager with parallel fetching and memory caching.
   Stores JSON files in memory and uses ETag/Last-Modified for cache invalidation.
*/
(function (global) {
    class JSONCache {
        constructor() {
            this.cache = new Map();
            this.loading = new Map();
            this.loadingOverlay = null;
        }

        /**
         * Initialize cache by prefetching all JSON files in parallel
         */
        async init() {
            this.showLoadingOverlay('Loading quiz data...');
            
            try {
                const appEl = document.getElementById('app');
                if (!appEl) {
                    throw new Error('App element not found');
                }

                // Get all JSON URLs from data attributes
                const urls = {
                    mainNavigation: appEl.dataset.quizMainNavigation || '../assets/data/mainNavigation.json',
                    uiMessages: appEl.dataset.uiMessages || '../assets/data/uiMessages.json',
                    propertySafety: appEl.dataset.propertySafety,
                    staffSafety: appEl.dataset.staffSafety,
                    mobileBusiness: appEl.dataset.mobileBusiness,
                    vehicleSafety: appEl.dataset.vehicleSafety
                };

                // Filter out undefined URLs and create fetch promises
                const fetchPromises = Object.entries(urls)
                    .filter(([key, url]) => url)
                    .map(([key, url]) => 
                        this.fetchWithCache(url).then(data => ({ key, url, data }))
                    );

                // Fetch all in parallel
                const results = await Promise.all(fetchPromises);
                
                this.hideLoadingOverlay();
                
                return results;
            } catch (error) {
                this.hideLoadingOverlay();
                this.showError('Failed to load quiz data. Please refresh the page.');
                throw error;
            }
        }

        /**
         * Fetch JSON with caching
         */
        async fetchWithCache(url) {
            // Check if already loading
            if (this.loading.has(url)) {
                return this.loading.get(url);
            }

            // Check memory cache
            const cached = this.cache.get(url);
            if (cached) {
                // Validate cache with HEAD request in background
                this.validateCache(url, cached);
                return cached.data;
            }

            // Create fetch promise
            const fetchPromise = this.fetchJSON(url);
            this.loading.set(url, fetchPromise);

            try {
                const result = await fetchPromise;
                this.loading.delete(url);
                return result;
            } catch (error) {
                this.loading.delete(url);
                throw error;
            }
        }

        /**
         * Fetch JSON with metadata
         */
        async fetchJSON(url) {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            }

            const data = await response.json();
            const etag = response.headers.get('ETag');
            const lastModified = response.headers.get('Last-Modified');

            // Store in cache
            this.cache.set(url, {
                data,
                etag,
                lastModified,
                timestamp: Date.now()
            });

            return data;
        }

        /**
         * Validate cache in background using HEAD request
         */
        async validateCache(url, cached) {
            try {
                const response = await fetch(url, { method: 'HEAD' });
                const etag = response.headers.get('ETag');
                const lastModified = response.headers.get('Last-Modified');

                // Check if cache is stale
                const isStale = 
                    (etag && etag !== cached.etag) ||
                    (lastModified && lastModified !== cached.lastModified);

                if (isStale) {
                    // Invalidate cache and refetch
                    this.cache.delete(url);
                    await this.fetchJSON(url);
                }
            } catch (error) {
                // Silent fail - keep using cached data
                console.warn('Cache validation failed:', error);
            }
        }

        /**
         * Get cached data or fetch if not available
         */
        async get(url) {
            return this.fetchWithCache(url);
        }

        /**
         * Clear all cache
         */
        clear() {
            this.cache.clear();
            this.loading.clear();
        }

        /**
         * Show loading overlay with Bootstrap spinner
         */
        showLoadingOverlay(message = 'Loading...') {
            if (this.loadingOverlay) return;

            this.loadingOverlay = document.createElement('div');
            this.loadingOverlay.className = 'quiz-loading-overlay';
            this.loadingOverlay.innerHTML = `
                <div class="quiz-loading-content">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3">${message}</p>
                </div>
            `;
            document.body.appendChild(this.loadingOverlay);
        }

        /**
         * Hide loading overlay
         */
        hideLoadingOverlay() {
            if (this.loadingOverlay) {
                this.loadingOverlay.remove();
                this.loadingOverlay = null;
            }
        }

        /**
         * Show error message
         */
        showError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
            errorDiv.style.zIndex = '9999';
            errorDiv.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            document.body.appendChild(errorDiv);

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }
    }

    // Create global cache instance
    global.JSONCache = new JSONCache();
})(window);
