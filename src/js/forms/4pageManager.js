/**
 * PageManager - Handles multi-page navigation and validation
 */

class PageManager {
    constructor(formConfig, formRenderer, stateManager, conditionalLogic) {
        this.formConfig = formConfig;
        this.formRenderer = formRenderer;
        this.stateManager = stateManager;
        this.conditionalLogic = conditionalLogic;
        this.currentPageIndex = 0;
        this.pages = formConfig.pages || [];
    }

    /**
     * Initialize page manager and render first page
     */
    initialize() {
        this.updateUI();
        this.renderCurrentPage();
        this.setupNavigationButtons();
    }

    /**
     * Get fields for a specific page
     */
    getFieldsForPage(pageId) {
        const page = this.pages.find(p => p.id === pageId);
        return page && page.fields ? page.fields : [];
    }

    /**
     * Get current page configuration
     */
    getCurrentPage() {
        return this.pages[this.currentPageIndex];
    }

    /**
     * Render the current page
     */
    renderCurrentPage() {
        const currentPage = this.getCurrentPage();
        if (!currentPage) return;

        // Update page header
        document.getElementById('pageTitle').textContent = currentPage.title || '';
        document.getElementById('pageDescription').textContent = currentPage.description || '';

        // Get fields for this page
        const fields = this.getFieldsForPage(currentPage.id);

        // IMPORTANT: Capture current state from ALL form fields before rendering new page
        const currentState = this.stateManager.captureFormState();
        this.formRenderer.renderPage(fields, currentState);

        // Apply conditional logic with the captured state
        this.conditionalLogic.evaluateAll(currentState);

        // Update points with all captured data
        this.stateManager.updatePointsDisplay();

        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Update progress bar
        this.updateProgressBar();
    }

    /**
     * Update navigation button visibility
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        // Show/hide previous button
        if (this.currentPageIndex === 0) {
            prevBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'inline-block';
        }

        // Show/hide next/submit buttons
        if (this.currentPageIndex === this.pages.length - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        }
    }

    /**
     * Update progress bar
     */
    updateProgressBar() {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        const progress = ((this.currentPageIndex + 1) / this.pages.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
        
        progressText.textContent = `Page ${this.currentPageIndex + 1} of ${this.pages.length}`;
    }

    /**
     * Update form title and description
     */
    updateUI() {
        document.getElementById('formTitle').textContent = this.formConfig.formTitle || 'Form';
        document.getElementById('formDescription').textContent = this.formConfig.formDescription || '';
    }

    /**
     * Validate current page
     */
    validateCurrentPage(showFeedback = true) {
        const form = document.getElementById('dynamicForm');
        const currentPage = this.getCurrentPage();
        const fields = this.getFieldsForPage(currentPage.id);
        
        let isValid = true;
        const visibleFields = fields.filter(field => {
            const fieldGroup = document.getElementById(`field-${field.id}`);
            return fieldGroup && !fieldGroup.classList.contains('hidden');
        });

        visibleFields.forEach(field => {
            const inputs = document.querySelectorAll(`[name="${field.id}"]`);
            
            inputs.forEach(input => {
                // Check HTML5 validation
                if (!input.checkValidity()) {
                    isValid = false;
                    if (showFeedback) {
                        input.classList.add('is-invalid');
                        
                        // Find the field group and show invalid feedback
                        const fieldGroup = input.closest('.field-group');
                        if (fieldGroup) {
                            const feedback = fieldGroup.querySelector('.invalid-feedback');
                            if (feedback) {
                                feedback.style.display = 'block';
                            }
                        }
                    }
                } else if (showFeedback) {
                    input.classList.remove('is-invalid');
                    input.classList.add('is-valid');
                }
            });
        });

        // Add Bootstrap validation classes
        if (!isValid && showFeedback) {
            form.classList.add('was-validated');
        }

        return isValid;
    }

    /**
     * Validate all pages in the form. If showFeedback is true, render the first
     * page that has validation errors and display feedback; otherwise just return false.
     */
    validateAllPages(showFeedback = true) {
        // Preserve current page index
        const originalIndex = this.currentPageIndex;

        // Ensure latest inputs are captured
        this.stateManager.captureFormState();

        for (let i = 0; i < this.pages.length; i++) {
            this.currentPageIndex = i;
            // Render the page so its inputs exist in the DOM
            this.renderCurrentPage();

            // Evaluate conditional logic for this page's state
            const currentState = this.stateManager.captureFormState();
            this.conditionalLogic.evaluateAll(currentState);

            // Validate this page
            const valid = this.validateCurrentPage(showFeedback);
            if (!valid) {
                // If showing feedback, focus first invalid and return false
                if (showFeedback) {
                    const firstInvalid = document.querySelector('.is-invalid');
                    if (firstInvalid) {
                        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        try { firstInvalid.focus(); } catch (e) {}
                    }
                }
                // restore original page index and leave the invalid page rendered
                return false;
            }
        }

        // All pages valid - restore original page index and render it
        this.currentPageIndex = originalIndex;
        this.renderCurrentPage();
        return true;
    }

    /**
     * Go to next page
     */
    nextPage() {
        // Validate current page before proceeding and show feedback if invalid
        if (!this.validateCurrentPage(true)) {
            // Scroll to first invalid field and focus it
            const firstInvalid = document.querySelector('.is-invalid');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                try { firstInvalid.focus(); } catch (e) {}
            }
            return;
        }

        // Save state before changing page
        this.stateManager.saveToLocalStorage();

        if (this.currentPageIndex < this.pages.length - 1) {
            this.currentPageIndex++;
            this.renderCurrentPage();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * Go to previous page
     */
    previousPage() {
        // Save state before changing page
        this.stateManager.saveToLocalStorage();

        if (this.currentPageIndex > 0) {
            this.currentPageIndex--;
            this.renderCurrentPage();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * Go to a specific page
     */
    goToPage(pageIndex) {
        if (pageIndex >= 0 && pageIndex < this.pages.length) {
            this.stateManager.saveToLocalStorage();
            this.currentPageIndex = pageIndex;
            this.renderCurrentPage();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * Navigate to a page by its ID
     */
    goToPageById(pageId) {
        const pageIndex = this.pages.findIndex(p => p.id === pageId);
        if (pageIndex >= 0) {
            this.goToPage(pageIndex);
        }
    }

    /**
     * Setup navigation button event listeners
     */
    setupNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        prevBtn.addEventListener('click', () => this.previousPage());
        nextBtn.addEventListener('click', () => this.nextPage());
    }

    /**
     * Get form completion percentage
     */
    getCompletionPercentage() {
        const state = this.stateManager.captureFormState();
        const totalFields = this.formConfig.fields.length;
        const completedFields = Object.keys(state).filter(key => {
            const value = state[key];
            return value && value !== '' && (!Array.isArray(value) || value.length > 0);
        }).length;

        return Math.round((completedFields / totalFields) * 100);
    }
}
