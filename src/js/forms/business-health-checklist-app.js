/**
 * Business Health Checklist App
 * Manages multiple forms with unified state, URL sharing, and progress tracking
 */

class BusinessHealthChecklistApp {
    constructor() {
        this.checklist = null;
        this.forms = {};
        this.currentFormId = null;
        this.unifiedState = {}; // Holds state from all forms keyed by form ID
        this.formInstances = {}; // Holds FormRenderer, PageManager instances for each form
        this.resumeModal = null;
        this.exportModal = null;
        this.importModal = null;
        this.storageKey = 'businessHealthChecklistState';
        this.saveStatusTimer = null;
        this.debouncedUpdateUrl = null; // will be initialized in initialize()
    }

    /**
     * Very small debounce helper
     */
    _debounce(fn, wait) {
        let t = null;
        return (...args) => {
            if (t) clearTimeout(t);
            t = setTimeout(() => fn(...args), wait);
        };
    }

    /**
     * Show save status in UI
     */
    _showSaveStatus(text) {
        try {
            const el = document.getElementById('saveStatus');
            if (!el) return;
            el.textContent = text;
            el.style.display = 'inline-block';
            el.classList.remove('saving');

            // If text is 'Saving...' add saving class
            if (text === 'Saving...') {
                el.classList.add('saving');
            }

            // Hide after 2.5s when showing 'Saved'
            if (this.saveStatusTimer) clearTimeout(this.saveStatusTimer);
            if (text === 'Saved') {
                this.saveStatusTimer = setTimeout(() => {
                    el.style.display = 'none';
                }, 2500);
            }
        } catch (e) {
            // ignore
        }
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            // Load checklist config
            const response = await fetch('../assets/business-health-checklist.json');
            if (!response.ok) throw new Error('Failed to load checklist config');
            this.checklist = await response.json();

            // Load all form configs
            for (const form of this.checklist.forms) {
                const configResponse = await fetch(form.configPath);
                if (!configResponse.ok) throw new Error(`Failed to load ${form.id}`);
                this.forms[form.id] = await configResponse.json();
            }

            // Render sidebar
            this.renderSidebar();

            // Setup event listeners
            this.setupEventListeners();

            // Check for URL state first

            // initialize debounced URL updater (800ms)
            this.debouncedUpdateUrl = this._debounce(() => {
                this.updateUrlWithState();
                this._showSaveStatus('Saved');
            }, 800);

            if (this.hasQueryStringState()) {
                const importedState = this.importFromQueryString();
                if (importedState) {
                    console.log('Loading state from URL...');
                    this.unifiedState = importedState;
                    this.saveToLocalStorage();
                    this.selectForm(this.checklist.forms[0].id);
                    this.showSuccess('Progress loaded from URL!');
                    return;
                }
            }

            // Check for saved session
            if (this.hasSavedSession()) {
                this.showResumeModal();
            } else {
                this.selectForm(this.checklist.forms[0].id);
            }

        } catch (error) {
            console.error('Error initializing:', error);
            this.showError('Failed to initialize. Please refresh the page.');
        }
    }

    /**
     * Render the sidebar with form list
     */
    renderSidebar() {
        const formList = document.getElementById('formList');
        formList.innerHTML = '';

        this.checklist.forms.forEach(form => {
            const item = document.createElement('button');
            item.className = 'list-group-item list-group-item-action';
            item.dataset.formId = form.id;
            item.innerHTML = `
                <span class="form-icon">
                    <i class="fas ${form.icon}"></i>
                </span>
                <span class="form-title">${form.title}</span>
                <span class="form-description">${form.description}</span>
                <span class="form-status" id="status-${form.id}">0%</span>
            `;
            item.addEventListener('click', () => this.selectForm(form.id));
            formList.appendChild(item);
        });

        this.updateProgress();
    }

    /**
     * Select a form to display
     */
    async selectForm(formId) {
        // Save current form state before switching to another form
        if (this.currentFormId && this.currentFormId !== formId) {
            this.saveCurrrentFormState(this.currentFormId);
        }

        if (this.currentFormId === formId && this.formInstances[formId]) {
            // Form already loaded, just update UI
            this.updateSidebarActive(formId);
            return;
        }

        this.currentFormId = formId;
        const formConfig = this.forms[formId];

        // Initialize form components if not already done
        if (!this.formInstances[formId]) {
            const container = document.getElementById('formFieldsContainer');
            const formRenderer = new FormRenderer(container);
            const stateManager = new StateManager(`formState_${formId}`);
            stateManager.setFormConfig(formConfig);
            const conditionalLogic = new ConditionalLogic(formConfig, formRenderer);
            const pageManager = new PageManager(formConfig, formRenderer, stateManager, conditionalLogic);

            this.formInstances[formId] = {
                renderer: formRenderer,
                stateManager: stateManager,
                conditionalLogic: conditionalLogic,
                pageManager: pageManager,
                config: formConfig
            };

            // Setup event listeners for this form
            this.setupFormEventListeners(formId);

            // Initialize page manager
            pageManager.initialize();

            // Load any existing state for this form
            if (this.unifiedState[formId]) {
                stateManager.formState = this.unifiedState[formId];
                stateManager.applyStateToForm();
                const currentState = stateManager.captureFormState();
                conditionalLogic.evaluateAll(currentState);
            }

            // Setup auto-save
            stateManager.setupAutoSave = this.setupAutoSave.bind(this, formId);
            stateManager.updatePointsDisplay = () => this.updatePoints(formId);
            stateManager.setupAutoSave();
        } else {
            // Form already initialized, just re-render
            const instance = this.formInstances[formId];
            instance.pageManager.renderCurrentPage();
        }

        // Update sidebar
        this.updateSidebarActive(formId);

        // Show form
        document.getElementById('dynamicForm').style.display = 'block';
        document.getElementById('formTitle').textContent = formConfig.formTitle || '';
        document.getElementById('formDescription').textContent = formConfig.formDescription || '';
        document.getElementById('formTitle').style.display = 'block';
        document.getElementById('formDescription').style.display = 'block';

        // Hide the initial placeholder text when a form is shown
        const placeholder = document.querySelector('.placeholder-start');
        if (placeholder) placeholder.style.display = 'none';

        // Update progress
        this.updateProgress();

        // Scroll to top
        document.getElementById('formContainer').scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Update browser URL with current compressed unified state (no reload)
     */
    updateUrlWithState() {
        try {
            const url = new URL(window.location.href);
            let compressed = null;

            if (window.LZString && typeof window.LZString.compressToEncodedURIComponent === 'function') {
                compressed = window.LZString.compressToEncodedURIComponent(JSON.stringify(this.unifiedState || {}));
            } else {
                // Fallback: use plain encoded JSON (may be large)
                console.warn('LZString not available, falling back to plain encoded JSON for state in URL.');
                compressed = encodeURIComponent(JSON.stringify(this.unifiedState || {}));
            }

            url.searchParams.set('state', compressed);
            // Replace current history entry so back button isn't clogged
            history.replaceState(null, '', url.toString());
        } catch (e) {
            console.error('Failed to update URL with state:', e);
        }
    }

    /**
     * Setup form-specific event listeners
     */
    setupFormEventListeners(formId) {
        const instance = this.formInstances[formId];
        if (!instance) return;

        // Ensure renderer writes into the live container
        const container = document.getElementById('formFieldsContainer');
        if (instance.renderer) instance.renderer.container = container;

        // Setup conditional logic listeners once per instance (guarded)
        if (!instance._listenersSetup) {
            instance.conditionalLogic.setupEventListeners(instance.stateManager);
            instance._listenersSetup = true;
        }

        // Setup auto-save once per instance (guarded inside setupAutoSave)

        // Ensure the current page is rendered into the live container
        if (instance.pageManager) instance.pageManager.renderCurrentPage();
    }

    /**
     * Save current form state
     */
    saveCurrrentFormState(formId) {
        const instance = this.formInstances[formId];
        if (!instance || !instance.stateManager) return;
        const state = instance.stateManager.captureFormState();
        this.unifiedState[formId] = state;
        this.saveToLocalStorage();
        // Update URL with latest unified state so it can be shared/resumed
        this.updateUrlWithState();
        this.updateProgress();
    }

    /**
     * Setup auto-save for a form
     */
    setupAutoSave(formId) {
        const form = document.getElementById('dynamicForm');
        if (!form) return;

        const saveState = () => {
            const instance = this.formInstances[formId];
            const state = instance.stateManager.captureFormState();
            this.unifiedState[formId] = state;
            this.saveToLocalStorage();
            this.updateProgress();
            // Keep URL in-sync with latest state
            // show saving immediately
            this._showSaveStatus('Saving...');
            // debounce URL updates
            if (this.debouncedUpdateUrl) this.debouncedUpdateUrl();
        };

        // Avoid binding multiple times for same instance
        const instance = this.formInstances[formId];
        if (instance && !instance._autoSaveBound) {
            form.addEventListener('input', saveState);
            form.addEventListener('change', saveState);
            instance._autoSaveBound = true;
        }
    }

    /**
     * Update points display for a form
     */
    updatePoints(formId) {
        // This can be extended to show points per form or overall
    }

    /**
     * Handle form submission
     */
    handleFormSubmit(formId) {
        const instance = this.formInstances[formId];

        // Validate
        if (!instance.pageManager.validateCurrentPage()) {
            return;
        }

        // Save state
        this.saveCurrrentFormState(formId);

        // Show success
        alert(`"${this.forms[formId].formTitle}" completed successfully!`);

        // Move to next form if available
        const currentIndex = this.checklist.forms.findIndex(f => f.id === formId);
        if (currentIndex < this.checklist.forms.length - 1) {
            const nextFormId = this.checklist.forms[currentIndex + 1].id;
            this.selectForm(nextFormId);
        }
    }

    /**
     * Update sidebar active state
     */
    updateSidebarActive(formId) {
        document.querySelectorAll('#formList .list-group-item').forEach(item => {
            item.classList.toggle('active', item.dataset.formId === formId);
        });
    }

    /**
     * Update overall progress
     */
    updateProgress() {
        let totalFields = 0;
        let completedFields = 0;

        // Count all fields and completed fields across all forms
        Object.keys(this.forms).forEach(formId => {
            const formConfig = this.forms[formId];
            const formState = this.unifiedState[formId] || {};
            const allFields = this.getAllFields(formConfig);

            // Only count answerable field types towards completion
            const answerableTypes = ['text','email','number','textarea','select','radio','checkbox'];
            const answerableFields = allFields.filter(f => answerableTypes.includes(f.type));

            // All answerable fields count
            totalFields += answerableFields.length;

            // Count completed fields for this form only by matching its field IDs
            const fieldIds = answerableFields.map(f => f.id);
            const formCompletedFields = fieldIds.reduce((acc, fieldId) => {
                const value = formState[fieldId];
                if (value && value !== '' && (!Array.isArray(value) || value.length > 0)) {
                    return acc + 1;
                }
                return acc;
            }, 0);

            // Add to overall completedFields
            completedFields += formCompletedFields;

            const formAllFields = allFields.length;
            const formProgress = formAllFields > 0 ? Math.round((formCompletedFields / formAllFields) * 100) : 0;

            const statusEl = document.getElementById(`status-${formId}`);
            if (statusEl) {
                statusEl.textContent = `${formProgress}%`;
                statusEl.setAttribute('aria-valuenow', formProgress);
            }
        });

        // Update overall progress
        const overallProgress = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const progressDetails = document.getElementById('progressDetails');

        if (progressBar) {
            progressBar.style.width = `${overallProgress}%`;
            progressBar.setAttribute('aria-valuenow', overallProgress);
        }
        if (progressText) {
            progressText.textContent = `${overallProgress}%`;
        }
        if (progressDetails) {
            progressDetails.textContent = `${completedFields} of ${totalFields} fields completed`;
        }
    }

    /**
     * Get all fields from a form config
     */
    getAllFields(formConfig) {
        const allFields = [];
        if (formConfig && formConfig.pages) {
            formConfig.pages.forEach(page => {
                if (page.fields) {
                    allFields.push(...page.fields);
                }
            });
        }
        return allFields;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Export
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.showExportModal();
        });

        // Import
        document.getElementById('importBtn').addEventListener('click', () => {
            this.showImportModal();
        });

        // Clear
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearAll();
        });

        // Navigation buttons (operate on the currently selected form)
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (!this.currentFormId) return;
                // Save current state then go to previous page for the active form
                this.saveCurrrentFormState(this.currentFormId);
                const inst = this.formInstances[this.currentFormId];
                if (inst && inst.pageManager) inst.pageManager.previousPage();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (!this.currentFormId) return;
                this.saveCurrrentFormState(this.currentFormId);
                const inst = this.formInstances[this.currentFormId];
                if (inst && inst.pageManager) inst.pageManager.nextPage();
            });
        }

        // Global form submit handler (single handler, uses currentFormId)
        const dynamicForm = document.getElementById('dynamicForm');
        if (dynamicForm) {
            dynamicForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!this.currentFormId) return;
                this.handleFormSubmit(this.currentFormId);
            });
        }

        // Export Modal
        document.getElementById('copyUrlBtn').addEventListener('click', () => {
            this.copyToClipboard(document.getElementById('shareableUrl'));
        });

        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyToClipboard(document.getElementById('stateString'));
        });

        // Import Modal
        document.getElementById('confirmImportBtn').addEventListener('click', () => {
            this.importState();
        });

        // Resume Modal
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.resumeModal.hide();
            this.loadFromLocalStorage();
            this.selectForm(this.currentFormId || this.checklist.forms[0].id);
        });

        document.getElementById('startFreshBtn').addEventListener('click', () => {
            this.resumeModal.hide();
            this.unifiedState = {};
            this.clearLocalStorage();
            this.selectForm(this.checklist.forms[0].id);
        });
    }

    /**
     * Show export modal with URL and state string
     */
    showExportModal() {
        // Save current form state before exporting
        if (this.currentFormId) {
            this.saveCurrrentFormState(this.currentFormId);
        }

        const compressedState = this.exportCompressedState();
        const shareableUrl = this.generateShareableUrl();

        document.getElementById('stateString').value = compressedState;
        document.getElementById('shareableUrl').value = shareableUrl;

        this.exportModal = new bootstrap.Modal(document.getElementById('exportModal'));
        this.exportModal.show();
    }

    /**
     * Show import modal
     */
    showImportModal() {
        this.importModal = new bootstrap.Modal(document.getElementById('importModal'));
        document.getElementById('importStateString').value = '';
        this.importModal.show();
    }

    /**
     * Import state from string
     */
    importState() {
        const importTextarea = document.getElementById('importStateString');
        const input = importTextarea.value.trim();

        if (!input) {
            alert('Please paste a state string or URL.');
            return;
        }

        // Try to extract state from URL if it's a full URL
        let stateString = input;
        try {
            const url = new URL(input);
            const params = new URLSearchParams(url.search);
            stateString = params.get('state') || input;
        } catch (e) {
            // Not a URL, use as-is
        }

        const importedState = this.importCompressedState(stateString);
        if (importedState) {
            this.unifiedState = importedState;
            this.saveToLocalStorage();
            this.importModal.hide();

            // Reload current form
            if (this.currentFormId) {
                this.formInstances[this.currentFormId] = null;
            }
            this.selectForm(this.checklist.forms[0].id);
            this.updateProgress();
            this.showSuccess('State imported successfully!');
        } else {
            this.showError('Failed to import state. Please check the string.');
        }
    }

    /**
     * Show resume modal
     */
    showResumeModal() {
        const lastSaved = localStorage.getItem(`${this.storageKey}_timestamp`);
        if (lastSaved) {
            const date = new Date(lastSaved);
            document.getElementById('lastSavedTime').textContent = this.formatDate(date);
        }

        this.resumeModal = new bootstrap.Modal(document.getElementById('resumeModal'));
        this.resumeModal.show();
    }

    /**
     * Format date
     */
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    /**
     * Export unified state as compressed string
     */
    exportCompressedState() {
        if (this.currentFormId) {
            this.saveCurrrentFormState(this.currentFormId);
        }
        const stateString = JSON.stringify(this.unifiedState);
        return LZString.compressToEncodedURIComponent(stateString);
    }

    /**
     * Import compressed state
     */
    importCompressedState(compressedString) {
        try {
            const decompressed = LZString.decompressFromEncodedURIComponent(compressedString);
            if (!decompressed) return null;
            return JSON.parse(decompressed);
        } catch (e) {
            console.error('Error importing:', e);
            return null;
        }
    }

    /**
     * Generate shareable URL
     */
    generateShareableUrl() {
        const compressedState = this.exportCompressedState();
        const url = new URL(window.location.href);
        url.searchParams.delete('state');
        url.searchParams.set('state', compressedState);
        return url.toString();
    }

    /**
     * Import state from URL query string
     */
    importFromQueryString(paramName = 'state') {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const stateParam = urlParams.get(paramName);
            if (stateParam) {
                return this.importCompressedState(stateParam);
            }
            return null;
        } catch (e) {
            console.error('Error importing from query:', e);
            return null;
        }
    }

    /**
     * Check if URL has state parameter
     */
    hasQueryStringState(paramName = 'state') {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has(paramName);
    }

    /**
     * Save to localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.unifiedState));
            localStorage.setItem(`${this.storageKey}_timestamp`, new Date().toISOString());
        } catch (e) {
            console.error('Error saving:', e);
        }
    }

    /**
     * Load from localStorage
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                this.unifiedState = JSON.parse(saved);
                return this.unifiedState;
            }
        } catch (e) {
            console.error('Error loading:', e);
        }
        return null;
    }

    /**
     * Check if saved session exists
     */
    hasSavedSession() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    /**
     * Clear all data
     */
    clearAll() {
        if (!confirm('Are you sure? This will clear all progress.')) return;

        this.unifiedState = {};
        this.clearLocalStorage();

        // Reset all form instances
        Object.keys(this.formInstances).forEach(formId => {
            this.formInstances[formId] = null;
        });

        this.currentFormId = null;
        this.selectForm(this.checklist.forms[0].id);
        this.updateProgress();
    }

    /**
     * Clear localStorage
     */
    clearLocalStorage() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(`${this.storageKey}_timestamp`);
    }

    /**
     * Copy to clipboard
     */
    async copyToClipboard(element) {
        try {
            await navigator.clipboard.writeText(element.value);
            const originalText = event.target.textContent;
            event.target.textContent = 'Copied!';
            setTimeout(() => {
                event.target.textContent = originalText;
            }, 2000);
        } catch (e) {
            alert('Failed to copy. Please copy manually.');
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showAlert(message, 'danger');
    }

    /**
     * Show alert
     */
    showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const container = document.querySelector('.navbar');
        container.insertAdjacentElement('afterend', alert);

        setTimeout(() => alert.remove(), 5000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new BusinessHealthChecklistApp();
    app.initialize();
});
