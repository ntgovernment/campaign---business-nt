/**
 * Main Application - Orchestrates all form components
 */

class FormApplication {
    constructor() {
        this.formConfig = null;
        this.stateManager = null;
        this.formRenderer = null;
        this.conditionalLogic = null;
        this.pageManager = null;
        this.resumeModal = null;
        this.importModal = null;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            // Load form configuration
            this.formConfig = await this.loadFormConfig();
            
            // Initialize components
            const container = document.getElementById('formFieldsContainer');
            this.formRenderer = new FormRenderer(container);
            this.stateManager = new StateManager('dynamicFormState');
            this.stateManager.setFormConfig(this.formConfig);
            this.conditionalLogic = new ConditionalLogic(this.formConfig, this.formRenderer);
            this.pageManager = new PageManager(
                this.formConfig,
                this.formRenderer,
                this.stateManager,
                this.conditionalLogic
            );

            // Check for query string state first (takes priority)
            if (this.stateManager.hasQueryStringState()) {
                const queryState = this.stateManager.importFromQueryString();
                if (queryState) {
                    console.log('Loading form state from URL...');
                    this.startForm(false); // Start without resuming localStorage
                    this.stateManager.formState = queryState;
                    this.stateManager.applyStateToForm();
                    this.stateManager.saveToLocalStorage(); // Save to localStorage for future
                    const currentState = this.stateManager.captureFormState();
                    this.conditionalLogic.evaluateAll(currentState);
                    this.stateManager.updatePointsDisplay();
                    
                    // Show success message
                    this.showSuccess('Form state loaded from URL successfully!');
                } else {
                    this.showError('Failed to load form state from URL. Starting fresh.');
                    this.startForm();
                }
            }
            // Check for saved session in localStorage
            else if (this.stateManager.hasSavedSession()) {
                this.showResumeModal();
            } else {
                this.startForm();
            }

            // Setup event listeners
            this.setupEventListeners();

        } catch (error) {
            console.error('Error initializing form:', error);
            this.showError('Failed to load form configuration. Please refresh the page.');
        }
    }

    /**
     * Load form configuration from JSON
     */
    async loadFormConfig() {
        try {
            const response = await fetch('../assets/business-strategy.json');
            if (!response.ok) {
                throw new Error('Failed to load form configuration');
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading form config:', error);
            throw error;
        }
    }

    /**
     * Start the form (new or resumed session)
     */
    startForm(resumeSession = false) {
        if (resumeSession) {
            const savedState = this.stateManager.loadFromLocalStorage();
            if (savedState) {
                this.stateManager.formState = savedState;
            }
        }

        // Initialize page manager and render first page
        this.pageManager.initialize();

        // Apply saved state if resuming
        if (resumeSession) {
            this.stateManager.applyStateToForm();
            const currentState = this.stateManager.captureFormState();
            this.conditionalLogic.evaluateAll(currentState);
        }

        // Setup auto-save
        this.stateManager.setupAutoSave();

        // Setup conditional logic listeners
        this.conditionalLogic.setupEventListeners(this.stateManager);

        // Initial points calculation
        this.stateManager.updatePointsDisplay();
    }

    /**
     * Show resume session modal
     */
    showResumeModal() {
        this.resumeModal = new bootstrap.Modal(document.getElementById('resumeModal'));
        
        // Update last saved time
        const lastSaved = this.stateManager.getLastSavedTimestamp();
        if (lastSaved) {
            document.getElementById('lastSavedTime').textContent = this.formatDate(lastSaved);
        }

        this.resumeModal.show();
    }

    /**
     * Format date for display
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
     * Setup all event listeners
     */
    setupEventListeners() {
        // Resume session buttons
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.resumeModal.hide();
            this.startForm(true);
        });

        document.getElementById('startFreshBtn').addEventListener('click', () => {
            this.stateManager.clearLocalStorage();
            this.resumeModal.hide();
            this.startForm(false);
        });

        // Form submission
        document.getElementById('dynamicForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Export state
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportState();
        });

        // Import state
        document.getElementById('importBtn').addEventListener('click', () => {
            this.showImportModal();
        });

        // Clear form
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearForm();
        });

        // Copy state string to clipboard
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyStateToClipboard();
        });

        // Copy shareable URL to clipboard
        document.getElementById('copyUrlBtn').addEventListener('click', () => {
            this.copyUrlToClipboard();
        });

        // Import confirmation
        document.getElementById('confirmImportBtn').addEventListener('click', () => {
            this.importState();
        });

        // Download PDF
        document.getElementById('downloadPdfBtn').addEventListener('click', () => {
            this.generatePdf();
        });
    }

    /**
     * Handle form submission
     */
    handleFormSubmit() {
        // Validate all pages
        if (!this.pageManager.validateCurrentPage()) {
            const firstInvalid = document.querySelector('.is-invalid');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalid.focus();
            }
            return;
        }

        // Capture final state
        const finalState = this.stateManager.captureFormState();
        const totalPoints = this.stateManager.calculateTotalPoints();

        // Log the submission (in production, you would send this to a server)
        console.log('Form submitted successfully!');
        console.log('Form Data:', finalState);
        console.log('Total Points:', totalPoints);

        // Show success message
        alert(`Form submitted successfully!\n\nTotal Points: ${totalPoints}\n\nCheck the console for form data.`);

        // Optionally clear the saved state
        // this.stateManager.clearLocalStorage();
    }

    /**
     * Export form state as compressed string
     */
    exportState() {
        const compressedState = this.stateManager.exportCompressedState();
        const shareableUrl = this.stateManager.generateShareableUrl();
        const stateTextarea = document.getElementById('stateString');
        const urlTextarea = document.getElementById('shareableUrl');
        const exportedStateDiv = document.getElementById('exportedState');

        stateTextarea.value = compressedState;
        urlTextarea.value = shareableUrl;
        exportedStateDiv.style.display = 'block';

        // Scroll to the textarea
        stateTextarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Copy state to clipboard
     */
    async copyStateToClipboard() {
        const stateTextarea = document.getElementById('stateString');
        const copyBtn = document.getElementById('copyBtn');

        try {
            await navigator.clipboard.writeText(stateTextarea.value);
            
            // Show success feedback
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.remove('btn-outline-success');
            copyBtn.classList.add('btn-success');

            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.classList.remove('btn-success');
                copyBtn.classList.add('btn-outline-success');
            }, 2000);
        } catch (error) {
            alert('Failed to copy to clipboard. Please copy manually.');
        }
    }

    /**
     * Copy shareable URL to clipboard
     */
    async copyUrlToClipboard() {
        const urlInput = document.getElementById('shareableUrl');
        const copyBtn = document.getElementById('copyUrlBtn');

        try {
            await navigator.clipboard.writeText(urlInput.value);
            
            // Show success feedback
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.remove('btn-outline-success');
            copyBtn.classList.add('btn-success');

            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.classList.remove('btn-success');
                copyBtn.classList.add('btn-outline-success');
            }, 2000);
        } catch (error) {
            alert('Failed to copy URL to clipboard. Please copy manually.');
        }
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
     * Import state from compressed string
     */
    importState() {
        const importTextarea = document.getElementById('importStateString');
        const compressedString = importTextarea.value.trim();

        if (!compressedString) {
            alert('Please paste a state string to import.');
            return;
        }

        const importedState = this.stateManager.importCompressedState(compressedString);
        
        if (importedState) {
            // Apply the imported state
            this.stateManager.formState = importedState;
            this.stateManager.saveToLocalStorage();
            
            // Close modal
            this.importModal.hide();

            // Restart form with imported state
            this.pageManager.goToPage(0);
            this.stateManager.applyStateToForm();
            
            const currentState = this.stateManager.captureFormState();
            this.conditionalLogic.evaluateAll(currentState);
            this.stateManager.updatePointsDisplay();

            alert('State imported successfully!');
        } else {
            alert('Failed to import state. Please check the string and try again.');
        }
    }

    /**
     * Clear the form
     */
    clearForm() {
        if (!confirm('Are you sure you want to clear all form data? This cannot be undone.')) {
            return;
        }

        this.stateManager.clearLocalStorage();
        this.stateManager.formState = {};
        
        // Reset to first page
        this.pageManager.goToPage(0);
        
        // Clear all inputs
        const form = document.getElementById('dynamicForm');
        form.reset();
        form.classList.remove('was-validated');
        
        // Remove validation classes
        form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid');
        });

        // Re-evaluate conditional logic
        this.conditionalLogic.evaluateAll({});
        this.stateManager.updatePointsDisplay();

        // Hide exported state
        document.getElementById('exportedState').style.display = 'none';
    }

    /**
     * Show error message
     */
    showError(message) {
        const container = document.querySelector('.container');
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alert.innerHTML = `
            <strong>Error:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        container.insertBefore(alert, container.firstChild);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const container = document.querySelector('.container');
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show';
        alert.innerHTML = `
            <strong>Success:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        container.insertBefore(alert, container.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        }, 5000);
    }

    /**
     * Generate and download PDF summary
     */
    async generatePdf() {
        try {
            // Capture current form state before generating PDF
            this.stateManager.captureFormState();
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Load PNG logo
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = 'territory-business-logo.png';
            });
            
            // Add logo to PDF
            const logoWidth = 80;
            const logoHeight = (img.height / img.width) * logoWidth;
            doc.addImage(img, 'PNG', 15, 15, logoWidth, logoHeight);
            
            let yPosition = 15 + logoHeight + 15;
            
            // Add title
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text(this.formConfig.formTitle || 'Form Summary', 15, yPosition);
            yPosition += 10;
            
            // Add date
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100);
            const now = new Date();
            doc.text(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 15, yPosition);
            yPosition += 15;
            doc.setTextColor(0);
            
            // Add radar chart with high resolution
            const chartCanvas = document.getElementById('pointsRadarChart');
            if (chartCanvas && this.stateManager.radarChart) {
                // Create a high-resolution temporary canvas
                const scale = 3; // 3x resolution for crisp output
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = chartCanvas.width * scale;
                tempCanvas.height = chartCanvas.height * scale;
                
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.scale(scale, scale);
                
                // Render the chart to the high-res canvas
                tempCtx.drawImage(chartCanvas, 0, 0);
                
                const chartImage = tempCanvas.toDataURL('image/png');
                const chartWidth = 100;
                const chartHeight = 80;
                const chartX = (doc.internal.pageSize.getWidth() - chartWidth) / 2; // Center the chart
                
                doc.addImage(chartImage, 'PNG', chartX, yPosition, chartWidth, chartHeight);
                yPosition += chartHeight + 15;
            }
            
            // Add section title
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Form Responses', 15, yPosition);
            yPosition += 10;
            
            // Add form data
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            const allFields = this.stateManager.getAllFields();
            const pageWidth = doc.internal.pageSize.getWidth();
            const maxLineWidth = pageWidth - 30;
            
            for (const field of allFields) {
                const value = this.stateManager.formState[field.id];
                if (!value && value !== 0) continue;
                
                // Check if we need a new page
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                // Field label
                doc.setFont(undefined, 'bold');
                doc.text(field.label + ':', 15, yPosition);
                yPosition += 5;
                
                // Field value (handle long text)
                doc.setFont(undefined, 'normal');
                let displayValue = '';
                
                if (Array.isArray(value)) {
                    displayValue = value.join(', ');
                } else if (field.type === 'select') {
                    const option = field.options?.find(opt => opt.value === value);
                    displayValue = option ? option.label : value;
                } else if (field.type === 'radio') {
                    const option = field.options?.find(opt => opt.value === value);
                    displayValue = option ? option.label : value;
                } else {
                    displayValue = value.toString();
                }
                
                const lines = doc.splitTextToSize(displayValue, maxLineWidth);
                doc.text(lines, 20, yPosition);
                yPosition += (lines.length * 5) + 3;
            }
            
            // Add new page for scores
            doc.addPage();
            yPosition = 20;
            
            // Scores section title
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Point Summary', 15, yPosition);
            yPosition += 10;
            
            // Category breakdown
            doc.setFontSize(11);
            const pointsByCategory = this.stateManager.calculatePointsByCategory();
            const maxPointsByCategory = this.stateManager.calculateMaxPointsByCategory();
            
            for (const category of this.formConfig.categories || []) {
                const categoryData = pointsByCategory[category.id];
                const maxCategoryData = maxPointsByCategory[category.id];
                const points = categoryData ? categoryData.points : 0;
                const maxPoints = maxCategoryData ? maxCategoryData.maxPoints : 0;
                const percentage = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
                
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.setFont(undefined, 'bold');
                doc.text(category.label + ':', 15, yPosition);
                doc.setFont(undefined, 'normal');
                doc.text(`${points}/${maxPoints} points (${percentage}%)`, pageWidth - 40, yPosition, { align: 'right' });
                yPosition += 8;
            }
            
            // Total points
            yPosition += 5;
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            const totalPoints = Object.values(pointsByCategory).reduce((sum, cat) => sum + (cat.points || 0), 0);
            const totalMaxPoints = Object.values(maxPointsByCategory).reduce((sum, cat) => sum + (cat.maxPoints || 0), 0);
            const totalPercentage = totalMaxPoints > 0 ? Math.round((totalPoints / totalMaxPoints) * 100) : 0;
            doc.text('Total Points:', 15, yPosition);
            doc.text(`${totalPoints}/${totalMaxPoints} (${totalPercentage}%)`, pageWidth - 40, yPosition, { align: 'right' });
            
            // Download
            const filename = `${(this.formConfig.formTitle || 'Form_Summary').replace(/[^a-z0-9]/gi, '_')}_${now.getTime()}.pdf`;
            doc.save(filename);
            
            this.showSuccess('PDF downloaded successfully!');
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showError('Failed to generate PDF. Please try again.');
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new FormApplication();
    app.initialize();
});
