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

        // Render each form as a grouped block showing its categories
        this.checklist.forms.forEach(form => {
            const group = document.createElement('div');
            group.className = 'mb-2';

            const header = document.createElement('div');
            header.className = 'd-flex align-items-start px-2 form-group-header';
            header.dataset.formId = form.id;
            header.innerHTML = `
                <div class="form-icon me-2"><i class="fas ${form.icon}"></i></div>
                <div class="flex-grow-1">
                    <div class="form-title fw-bold">${form.title}</div>
                    <div class="form-description small text-muted">${form.description || ''}</div>
                </div>
                <div class="form-status ms-2" id="status-${form.id}">0%</div>
            `;

            group.appendChild(header);

            // categories may be stored in the form config under `categories` or in the checklist index
            const categories = (this.forms[form.id] && this.forms[form.id].categories) || form.categories || [];

            const list = document.createElement('div');
            list.className = 'list-group list-group-flush';

            // Render categories as sub-items
            categories.forEach(cat => {
                const catBtn = document.createElement('button');
                catBtn.className = 'list-group-item list-group-item-action ps-4';
                catBtn.dataset.formId = form.id;
                catBtn.dataset.categoryId = cat.id;
                catBtn.innerHTML = `<strong>${this._escapeHtml(cat.label || '')}</strong>`;
                if (cat.description) {
                    const desc = document.createElement('div');
                    desc.className = 'form-description small text-muted';
                    desc.textContent = cat.description;
                    catBtn.appendChild(desc);
                }
                // Clicking a category opens the form and navigates to the first page containing questions from that category
                catBtn.addEventListener('click', () => this.selectFormAndCategory(form.id, cat.id));
                list.appendChild(catBtn);
            });

            // Add 'Your Results' link for this form
            const resultsBtn = document.createElement('button');
            resultsBtn.className = 'list-group-item list-group-item-action ps-4';
            resultsBtn.textContent = 'Your Results';
            resultsBtn.addEventListener('click', () => this.showResults(form.id));
            list.appendChild(resultsBtn);

            group.appendChild(list);
            formList.appendChild(group);
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

        // Render category stepper for this form
        this.renderCategoryStepper(formId);

        // Scroll to top
        document.getElementById('formContainer').scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Render a horizontal category stepper inside the form container
     */
    renderCategoryStepper(formId) {
        const formConfig = this.forms[formId];
        if (!formConfig) return;

        // Remove existing stepper if present
        const existing = document.getElementById('formCategoryStepper');
        if (existing) existing.remove();

        const container = document.getElementById('formContainer');
        if (!container) return;

        const stepper = document.createElement('div');
        stepper.id = 'formCategoryStepper';
        stepper.className = 'category-stepper mb-3';

        const state = this.unifiedState[formId] || (this.formInstances[formId] && this.formInstances[formId].stateManager ? this.formInstances[formId].stateManager.captureFormState() : {});

        const categories = formConfig.categories || [];
        categories.forEach((cat, idx) => {
            const step = document.createElement('div');
            step.className = 'category-step';
            step.dataset.categoryId = cat.id;

            // compute progress for this category
            const progress = this.computeCategoryProgress(formId, cat.id);

            const circle = document.createElement('div');
            circle.className = 'category-circle';
            circle.textContent = progress + '%';
            if (idx === 0) circle.classList.add('first');
            if (idx === categories.length - 1) circle.classList.add('last');

            const label = document.createElement('div');
            label.className = 'category-label';
            label.textContent = cat.label || '';

            step.appendChild(circle);
            step.appendChild(label);

            step.addEventListener('click', () => {
                this.selectFormAndCategory(formId, cat.id);
            });

            // Mark active if current page contains this category
            const currentInstance = this.formInstances[formId];
            if (currentInstance && currentInstance.pageManager) {
                const currentPageId = currentInstance.pageManager.currentPageId || null;
                const pageIdForCat = this.findFirstPageByCategory(formId, cat.id);
                if (pageIdForCat && pageIdForCat === currentPageId) {
                    step.classList.add('active-step');
                }
            }

            stepper.appendChild(step);
        });

        // Insert stepper before fields container
        const fieldsContainer = document.getElementById('formFieldsContainer');
        if (fieldsContainer && fieldsContainer.parentNode) {
            fieldsContainer.parentNode.insertBefore(stepper, fieldsContainer);
        } else {
            container.insertBefore(stepper, container.firstChild);
        }
    }

    /**
     * Compute percentage completion for a category within a form
     */
    computeCategoryProgress(formId, categoryId) {
        const formConfig = this.forms[formId];
        if (!formConfig) return 0;
        const fields = this.getAllFields(formConfig).filter(f => f.category === categoryId);
        if (!fields || fields.length === 0) return 0;
        const answerableTypes = ['text','email','number','textarea','select','radio','checkbox'];
        const relevant = fields.filter(f => answerableTypes.includes(f.type));
        if (relevant.length === 0) return 0;
        const state = this.unifiedState[formId] || (this.formInstances[formId] && this.formInstances[formId].stateManager ? this.formInstances[formId].stateManager.captureFormState() : {});
        const completed = relevant.reduce((acc, f) => {
            const v = state[f.id];
            if (v === undefined || v === null) return acc;
            if (Array.isArray(v)) return acc + (v.length > 0 ? 1 : 0);
            if (v === '') return acc;
            return acc + 1;
        }, 0);
        return Math.round((completed / relevant.length) * 100);
    }

    /**
     * Select a form and navigate to the first page with fields in the given category
     */
    selectFormAndCategory(formId, categoryId) {
        // First, select and initialize the form
        this.selectForm(formId);

        // Then find the first page containing fields from this category and navigate to it
        const instance = this.formInstances[formId];
        if (instance && instance.pageManager) {
            const pageId = this.findFirstPageByCategory(formId, categoryId);
            if (pageId) {
                instance.pageManager.goToPageById(pageId);
            }
        }
    }

    /**
     * Find the first page ID that contains fields with the given category
     */
    findFirstPageByCategory(formId, categoryId) {
        const formConfig = this.forms[formId];
        if (!formConfig || !formConfig.pages) return null;

        for (const page of formConfig.pages) {
            if (page.fields && page.fields.some(field => field.category === categoryId)) {
                return page.id;
            }
        }
        return null;
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

        // Show results page for this form
        this.showResults(formId);
    }

    /**
     * Simple HTML-escape helper
     */
    _escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Render a simple results view for a form inside the main form container.
     * This will show answers and any option feedback available.
     */
    showResults(formId) {
        // Ensure current form state saved
        if (this.currentFormId && this.currentFormId !== formId) {
            this.saveCurrrentFormState(this.currentFormId);
        }

        // Initialize form if needed so we have a renderer and config
        if (!this.formInstances[formId]) {
            // create minimal instance so we can render results
            this.selectForm(formId);
        }

        const instance = this.formInstances[formId];
        const container = document.getElementById('formFieldsContainer');
        container.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'form-page-title';
        header.textContent = 'Your Results';
        container.appendChild(header);

        const desc = document.createElement('div');
        desc.className = 'form-page-description';
        desc.textContent = this.forms[formId].formDescription || '';
        container.appendChild(desc);

        const state = this.unifiedState[formId] || (instance && instance.stateManager ? instance.stateManager.captureFormState() : {});
        const formConfig = this.forms[formId];

        const list = document.createElement('div');
        list.className = 'list-group';

        const fields = this.getAllFields(formConfig);
        fields.forEach(field => {
            const item = document.createElement('div');
            item.className = 'list-group-item';

            const label = document.createElement('div');
            label.className = 'fw-bold';
            label.textContent = field.label || field.id;
            item.appendChild(label);

            const answer = document.createElement('div');
            answer.className = 'text-muted';
            const val = state[field.id];
            if (Array.isArray(val)) {
                answer.textContent = val.join(', ');
            } else if (val === undefined || val === null || val === '') {
                answer.textContent = 'No answer provided';
            } else {
                answer.textContent = String(val);
            }
            item.appendChild(answer);

            // If this field has options with feedback, and the user selected one, show feedback
            if (field.options && val) {
                let feedbackObj = null;
                if (Array.isArray(val)) {
                    // multiple selected - find each option feedback
                    const fbs = field.options.filter(o => val.includes(o.value)).map(o => o.feedback).filter(Boolean);
                    if (fbs.length) feedbackObj = { title: '', text: fbs.map(f => (f.title ? f.title + ': ' : '') + (f.text || '')).join('\n') };
                } else {
                    const opt = field.options.find(o => o.value === val);
                    if (opt && opt.feedback) feedbackObj = opt.feedback;
                }

                if (feedbackObj) {
                    const fbDiv = document.createElement('div');
                    fbDiv.className = 'option-feedback mt-2';
                    // Use a simple formatting: bold title + text
                    let html = '';
                    if (feedbackObj.title) html += `<strong>${this._escapeHtml(feedbackObj.title)}</strong><br>`;
                    if (feedbackObj.text) html += this._escapeHtml(feedbackObj.text);
                    fbDiv.innerHTML = html;
                    item.appendChild(fbDiv);
                }
            }

            list.appendChild(item);
        });

        container.appendChild(list);

        // Add Previous/Next Quiz buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'btn-group mt-4 w-100';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '0.5rem';

        const currentIndex = this.checklist.forms.findIndex(f => f.id === formId);
        
        // Previous Quiz button
        if (currentIndex > 0) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'btn btn-outline-secondary';
            prevBtn.textContent = 'Previous Quiz';
            prevBtn.addEventListener('click', () => {
                const prevFormId = this.checklist.forms[currentIndex - 1].id;
                this.showResults(prevFormId);
            });
            buttonContainer.appendChild(prevBtn);
        }

        // Next Quiz button
        if (currentIndex < this.checklist.forms.length - 1) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn btn-outline-secondary';
            nextBtn.textContent = 'Next Quiz';
            nextBtn.addEventListener('click', () => {
                const nextFormId = this.checklist.forms[currentIndex + 1].id;
                this.showResults(nextFormId);
            });
            buttonContainer.appendChild(nextBtn);
        }

        // Download PDF button
        const downloadPdfBtn = document.createElement('button');
        downloadPdfBtn.className = 'btn btn-outline-primary ms-auto';
        downloadPdfBtn.textContent = 'Download PDF';
        downloadPdfBtn.addEventListener('click', () => this.generatePdf(formId));
        buttonContainer.appendChild(downloadPdfBtn);

        container.appendChild(buttonContainer);

        // Update sidebar active state to this form and ensure title/description updated
        this.updateSidebarActive(formId);
        document.getElementById('formTitle').textContent = this.forms[formId].formTitle || '';
        document.getElementById('formDescription').textContent = this.forms[formId].formDescription || '';

        // Hide navigation buttons when viewing results (they are page-specific)
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'none';

        // Scroll to top
        document.getElementById('formContainer').scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Generate and download PDF for a form results (uses jsPDF on window.jspdf)
     */
    async generatePdf(formId) {
        try {
            // Ensure state saved
            if (this.currentFormId && this.currentFormId !== formId) {
                this.saveCurrrentFormState(this.currentFormId);
            }

            const instance = this.formInstances[formId];
            const state = this.unifiedState[formId] || (instance && instance.stateManager ? instance.stateManager.captureFormState() : {});
            const formConfig = this.forms[formId];

            if (!window.jspdf) {
                this.showError('PDF library not loaded. Please ensure jsPDF is included on the page.');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Optional logo (attempt to load, but don't fail if missing)
            let img = null;
            try {
                img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = resolve; // resolve on error so we continue without blocking
                    img.src = 'territory-business-logo.png';
                });
            } catch (e) {
                img = null;
            }

            if (img && img.width && img.height) {
                const logoWidth = 80;
                const logoHeight = (img.height / img.width) * logoWidth;
                doc.addImage(img, 'PNG', 15, 15, logoWidth, logoHeight);
                var yPosition = 15 + logoHeight + 15;
            } else {
                var yPosition = 30;
            }

            // Title
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text(formConfig.formTitle || 'Form Summary', 15, yPosition);
            yPosition += 10;

            // Date
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100);
            const now = new Date();
            doc.text(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 15, yPosition);
            yPosition += 12;
            doc.setTextColor(0);

            // Responses
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Your Responses', 15, yPosition);
            yPosition += 8;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            const allFields = this.getAllFields(formConfig);
            const pageWidth = doc.internal.pageSize.getWidth();
            const maxLineWidth = pageWidth - 30;

            for (const field of allFields) {
                const value = state[field.id];
                if ((value === undefined || value === null || value === '') ) continue;

                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }

                doc.setFont(undefined, 'bold');
                doc.text(field.label + ':', 15, yPosition);
                yPosition += 5;

                doc.setFont(undefined, 'normal');
                let displayValue = '';
                if (Array.isArray(value)) displayValue = value.join(', ');
                else if (field.type === 'select' || field.type === 'radio') {
                    const opt = field.options?.find(o => o.value === value);
                    displayValue = opt ? opt.label : String(value);
                } else displayValue = String(value);

                const lines = doc.splitTextToSize(displayValue, maxLineWidth);
                doc.text(lines, 20, yPosition);
                yPosition += (lines.length * 5) + 4;
            }

            // Points summary page
            doc.addPage();
            yPosition = 20;
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Point Summary', 15, yPosition);
            yPosition += 10;

            doc.setFontSize(11);
            // calculate points by category (use instance.stateManager helpers if available)
            let pointsByCategory = {};
            let maxPointsByCategory = {};
            if (instance && instance.stateManager && typeof instance.stateManager.calculatePointsByCategory === 'function') {
                pointsByCategory = instance.stateManager.calculatePointsByCategory();
                maxPointsByCategory = instance.stateManager.calculateMaxPointsByCategory();
            }

            for (const category of formConfig.categories || []) {
                const cat = pointsByCategory[category.id] || { points: 0 };
                const maxCat = maxPointsByCategory[category.id] || { maxPoints: 0 };
                const points = cat.points || 0;
                const maxPoints = maxCat.maxPoints || 0;
                const percentage = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;

                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }

                doc.setFont(undefined, 'bold');
                doc.text(category.label + ':', 15, yPosition);
                doc.setFont(undefined, 'normal');
                doc.text(`${points}/${maxPoints} (${percentage}%)`, pageWidth - 40, yPosition, { align: 'right' });
                yPosition += 8;
            }

            // Total
            yPosition += 6;
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            const totalPoints = Object.values(pointsByCategory).reduce((sum, c) => sum + (c.points || 0), 0);
            const totalMax = Object.values(maxPointsByCategory).reduce((sum, c) => sum + (c.maxPoints || 0), 0);
            const totalPercent = totalMax > 0 ? Math.round((totalPoints / totalMax) * 100) : 0;
            doc.text('Total Points:', 15, yPosition);
            doc.text(`${totalPoints}/${totalMax} (${totalPercent}%)`, pageWidth - 40, yPosition, { align: 'right' });

            const filename = `${(formConfig.formTitle || 'Form_Summary').replace(/[^a-z0-9]/gi, '_')}_${now.getTime()}.pdf`;
            doc.save(filename);
            this.showSuccess('PDF downloaded successfully!');
        } catch (e) {
            console.error('Error generating PDF:', e);
            this.showError('Failed to generate PDF.');
        }
    }

    /**
     * Update sidebar active state
     */
    updateSidebarActive(formId) {
        document.querySelectorAll('#formList .list-group-item').forEach(item => {
            item.classList.toggle('active', item.dataset.formId === formId);
        });

        // Also mark the header block for the active form
        document.querySelectorAll('#formList .form-group-header').forEach(h => {
            const id = h.dataset.formId;
            if (!id) return;
            h.classList.toggle('active-form', id === formId);
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
                // update category stepper active state
                this.renderCategoryStepper(this.currentFormId);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (!this.currentFormId) return;
                this.saveCurrrentFormState(this.currentFormId);
                const inst = this.formInstances[this.currentFormId];
                if (inst && inst.pageManager) inst.pageManager.nextPage();
                // update category stepper active state
                this.renderCategoryStepper(this.currentFormId);
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
