/**
 * StateManager - Handles form state persistence and compression
 */

class StateManager {
    constructor(storageKey = 'dynamicFormState') {
        this.storageKey = storageKey;
        this.timestampKey = `${storageKey}_timestamp`;
        this.formState = {};
        this.formConfig = null;
        this.radarChart = null; // Chart.js instance for radar chart
    }

    /**
     * Initialize with form configuration
     */
    setFormConfig(config) {
        this.formConfig = config;
    }

    /**
     * Get current form state from all inputs
     */
    captureFormState() {
        const form = document.getElementById('dynamicForm');
        if (!form) return this.formState;

        const currentPageState = {};

        // Get all input, select, and textarea elements currently in DOM
        form.querySelectorAll('input, select, textarea').forEach(element => {
            const fieldId = element.name || element.id;
            if (!fieldId) return;

            if (element.type === 'checkbox') {
                // Handle checkbox groups
                if (!currentPageState[fieldId]) {
                    currentPageState[fieldId] = [];
                }
                if (element.checked) {
                    currentPageState[fieldId].push(element.value);
                }
            } else if (element.type === 'radio') {
                // Handle radio buttons
                if (element.checked) {
                    currentPageState[fieldId] = element.value;
                }
            } else {
                // Handle text inputs, selects, textareas
                currentPageState[fieldId] = element.value;
            }
        });

        // Clean up empty checkbox arrays
        Object.keys(currentPageState).forEach(key => {
            if (Array.isArray(currentPageState[key]) && currentPageState[key].length === 0) {
                delete currentPageState[key];
            }
        });

        // IMPORTANT: Merge with existing state instead of replacing
        // This preserves data from other pages that aren't currently rendered
        this.formState = { ...this.formState, ...currentPageState };
        
        return this.formState;
    }

    /**
     * Save state to localStorage
     */
    saveToLocalStorage() {
        const state = this.captureFormState();
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(state));
            localStorage.setItem(this.timestampKey, new Date().toISOString());
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    }

    /**
     * Load state from localStorage
     */
    loadFromLocalStorage() {
        try {
            const savedState = localStorage.getItem(this.storageKey);
            if (savedState) {
                this.formState = JSON.parse(savedState);
                return this.formState;
            }
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }
        return null;
    }

    /**
     * Get last saved timestamp
     */
    getLastSavedTimestamp() {
        const timestamp = localStorage.getItem(this.timestampKey);
        if (timestamp) {
            return new Date(timestamp);
        }
        return null;
    }

    /**
     * Check if there's a saved session
     */
    hasSavedSession() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    /**
     * Clear saved state
     */
    clearLocalStorage() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.timestampKey);
        this.formState = {};
    }

    /**
     * Export state as compressed string
     */
    exportCompressedState() {
        const state = this.captureFormState();
        const stateString = JSON.stringify(state);
        return LZString.compressToEncodedURIComponent(stateString);
    }

    /**
     * Import state from compressed string
     */
    importCompressedState(compressedString) {
        try {
            const decompressed = LZString.decompressFromEncodedURIComponent(compressedString);
            if (!decompressed) {
                throw new Error('Invalid compressed string');
            }
            this.formState = JSON.parse(decompressed);
            return this.formState;
        } catch (e) {
            console.error('Error importing compressed state:', e);
            return null;
        }
    }

    /**
     * Import state from URL query string
     */
    importFromQueryString(paramName = 'state') {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const stateParam = urlParams.get(paramName);
            
            if (stateParam) {
                const importedState = this.importCompressedState(stateParam);
                if (importedState) {
                    this.formState = importedState;
                    return importedState;
                }
            }
            return null;
        } catch (e) {
            console.error('Error importing from query string:', e);
            return null;
        }
    }

    /**
     * Generate shareable URL with current state
     */
    generateShareableUrl(paramName = 'state') {
        const compressedState = this.exportCompressedState();
        const url = new URL(window.location.href);
        
        // Remove existing state parameter
        url.searchParams.delete(paramName);
        
        // Add new compressed state
        url.searchParams.set(paramName, compressedState);
        
        return url.toString();
    }

    /**
     * Check if URL contains state parameter
     */
    hasQueryStringState(paramName = 'state') {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has(paramName);
    }

    /**
     * Apply saved state to form
     */
    applyStateToForm(state = null) {
        const stateToApply = state || this.formState;
        if (!stateToApply) return;

        Object.keys(stateToApply).forEach(fieldId => {
            const value = stateToApply[fieldId];
            this.setFieldValue(fieldId, value);
        });
    }

    /**
     * Set value for a specific field
     */
    setFieldValue(fieldId, value) {
        const elements = document.querySelectorAll(`[name="${fieldId}"]`);
        if (elements.length === 0) return;

        const firstElement = elements[0];

        if (firstElement.type === 'checkbox') {
            // Handle checkbox group
            const values = Array.isArray(value) ? value : [value];
            elements.forEach(element => {
                element.checked = values.includes(element.value);
            });
        } else if (firstElement.type === 'radio') {
            // Handle radio group
            elements.forEach(element => {
                element.checked = element.value === value;
            });
        } else {
            // Handle text inputs, selects, textareas
            firstElement.value = value || '';
        }
    }

    /**
     * Get current form state
     */
    getState() {
        return this.formState;
    }

    /**
     * Get all fields from all pages (flatten nested structure)
     */
    getAllFields() {
        if (!this.formConfig || !this.formConfig.pages) return [];
        
        const allFields = [];
        this.formConfig.pages.forEach(page => {
            if (page.fields) {
                allFields.push(...page.fields);
            }
        });
        return allFields;
    }

    /**
     * Calculate total points based on current state
     */
    calculateTotalPoints() {
        if (!this.formConfig) return 0;

        let totalPoints = 0;
        const state = this.captureFormState();
        const allFields = this.getAllFields();

        allFields.forEach(field => {
            // Add base field points
            if (field.points) {
                totalPoints += field.points;
            }

            // Add option points for selected values
            if (field.options && state[field.id]) {
                const fieldValue = state[field.id];

                if (Array.isArray(fieldValue)) {
                    // Checkbox - multiple values
                    fieldValue.forEach(val => {
                        const option = field.options.find(opt => opt.value === val);
                        if (option && option.points) {
                            totalPoints += option.points;
                        }
                    });
                } else {
                    // Radio or select - single value
                    const option = field.options.find(opt => opt.value === fieldValue);
                    if (option && option.points) {
                        totalPoints += option.points;
                    }
                }
            }
        });

        return totalPoints;
    }

    /**
     * Calculate points grouped by category
     */
    calculatePointsByCategory() {
        if (!this.formConfig) return {};

        const categoryPoints = {};
        const state = this.captureFormState();
        const allFields = this.getAllFields();

        // Initialize categories
        if (this.formConfig.categories) {
            this.formConfig.categories.forEach(category => {
                categoryPoints[category.id] = {
                    label: category.label,
                    description: category.description,
                    points: 0
                };
            });
        }

        // Calculate points for each field by category
        allFields.forEach(field => {
            const category = field.category || 'uncategorized';
            
            // Initialize uncategorized if needed
            if (!categoryPoints[category]) {
                categoryPoints[category] = {
                    label: 'Uncategorized',
                    description: '',
                    points: 0
                };
            }

            // Add base field points
            if (field.points) {
                categoryPoints[category].points += field.points;
            }

            // Add option points for selected values
            if (field.options && state[field.id]) {
                const fieldValue = state[field.id];

                if (Array.isArray(fieldValue)) {
                    // Checkbox - multiple values
                    fieldValue.forEach(val => {
                        const option = field.options.find(opt => opt.value === val);
                        if (option && option.points) {
                            categoryPoints[category].points += option.points;
                        }
                    });
                } else {
                    // Radio or select - single value
                    const option = field.options.find(opt => opt.value === fieldValue);
                    if (option && option.points) {
                        categoryPoints[category].points += option.points;
                    }
                }
            }
        });

        return categoryPoints;
    }

    /**
     * Calculate maximum possible points grouped by category
     */
    calculateMaxPointsByCategory() {
        if (!this.formConfig) return {};

        const maxCategoryPoints = {};
        const allFields = this.getAllFields();

        // Initialize categories
        if (this.formConfig.categories) {
            this.formConfig.categories.forEach(category => {
                maxCategoryPoints[category.id] = {
                    label: category.label,
                    description: category.description,
                    maxPoints: 0
                };
            });
        }

        // Calculate maximum possible points for each field by category
        allFields.forEach(field => {
            const category = field.category || 'uncategorized';
            
            // Initialize uncategorized if needed
            if (!maxCategoryPoints[category]) {
                maxCategoryPoints[category] = {
                    label: 'Uncategorized',
                    description: '',
                    maxPoints: 0
                };
            }

            // Add base field points (always counted)
            if (field.points) {
                maxCategoryPoints[category].maxPoints += field.points;
            }

            // Add maximum option points
            if (field.options && field.options.length > 0) {
                if (field.type === 'checkbox') {
                    // Checkbox: sum all options (user can select all)
                    field.options.forEach(option => {
                        if (option.points) {
                            maxCategoryPoints[category].maxPoints += option.points;
                        }
                    });
                } else if (field.type === 'radio' || field.type === 'select') {
                    // Radio/Select: take the maximum option value (user picks one)
                    const maxOptionPoints = Math.max(
                        ...field.options.map(opt => opt.points || 0)
                    );
                    maxCategoryPoints[category].maxPoints += maxOptionPoints;
                }
            }
        });

        return maxCategoryPoints;
    }

    /**
     * Update points display
     */
    updatePointsDisplay() {
        // Update total points
        const pointsElement = document.getElementById('totalPoints');
        if (pointsElement) {
            const categoryPoints = this.calculatePointsByCategory();
            const maxCategoryPoints = this.calculateMaxPointsByCategory();
            
            const totalPoints = Object.values(categoryPoints).reduce((sum, cat) => sum + (cat.points || 0), 0);
            const totalMaxPoints = Object.values(maxCategoryPoints).reduce((sum, cat) => sum + (cat.maxPoints || 0), 0);
            const totalPercentage = totalMaxPoints > 0 ? Math.round((totalPoints / totalMaxPoints) * 100) : 0;
            
            pointsElement.textContent = `${totalPoints}/${totalMaxPoints} (${totalPercentage}%)`;
        }

        // Update category points
        this.updateCategoryPointsDisplay();
        
        // Update radar chart
        this.updateRadarChart();
    }

    /**
     * Update category points breakdown display
     */
    updateCategoryPointsDisplay() {
        const container = document.getElementById('categoryPointsContainer');
        if (!container) return;

        const categoryPoints = this.calculatePointsByCategory();
        const maxCategoryPoints = this.calculateMaxPointsByCategory();
        
        // Clear existing content
        container.innerHTML = '';

        // Get the order of categories from config if available
        const categoryOrder = this.formConfig.categories 
            ? this.formConfig.categories.map(cat => cat.id)
            : Object.keys(categoryPoints);

        // Render each category
        categoryOrder.forEach(categoryId => {
            const category = categoryPoints[categoryId];
            if (!category) return;

            const maxCategory = maxCategoryPoints[categoryId];
            const maxPoints = maxCategory ? maxCategory.maxPoints : 0;
            const percentage = maxPoints > 0 ? Math.round((category.points / maxPoints) * 100) : 0;

            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-points-item';

            const labelDiv = document.createElement('div');
            
            const labelSpan = document.createElement('div');
            labelSpan.className = 'category-label';
            labelSpan.textContent = category.label;
            labelDiv.appendChild(labelSpan);

            if (category.description) {
                const descSpan = document.createElement('div');
                descSpan.className = 'category-description';
                descSpan.textContent = category.description;
                labelDiv.appendChild(descSpan);
            }

            const pointsSpan = document.createElement('div');
            pointsSpan.className = 'category-points-value';
            pointsSpan.textContent = `${category.points}/${maxPoints} pts (${percentage}%)`;

            categoryItem.appendChild(labelDiv);
            categoryItem.appendChild(pointsSpan);
            container.appendChild(categoryItem);
        });

        // If no categories have points, show a message
        const hasPoints = Object.values(categoryPoints).some(cat => cat.points > 0);
        if (!hasPoints) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'text-muted text-center py-2';
            emptyMessage.textContent = 'Complete the form to see your points breakdown';
            container.appendChild(emptyMessage);
        }
    }

    /**
     * Render or update radar chart for points summary
     */
    updateRadarChart() {
        const canvas = document.getElementById('pointsRadarChart');
        if (!canvas) return;

        const categoryPoints = this.calculatePointsByCategory();
        const maxCategoryPoints = this.calculateMaxPointsByCategory();

        // Get the order of categories from config if available
        const categoryOrder = this.formConfig.categories 
            ? this.formConfig.categories.map(cat => cat.id)
            : Object.keys(categoryPoints);

        // Prepare data for chart
        const labels = [];
        const percentages = [];
        const colors = [
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 99, 132, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(153, 102, 255, 0.2)',
        ];
        const borderColors = [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(153, 102, 255, 1)',
        ];

        categoryOrder.forEach(categoryId => {
            const category = categoryPoints[categoryId];
            const maxCategory = maxCategoryPoints[categoryId];
            if (!category) return;

            const maxPoints = maxCategory ? maxCategory.maxPoints : 0;
            const percentage = maxPoints > 0 ? Math.round((category.points / maxPoints) * 100) : 0;

            labels.push(category.label);
            percentages.push(percentage);
        });

        // If chart exists, update it; otherwise create new
        if (this.radarChart) {
            this.radarChart.data.labels = labels;
            this.radarChart.data.datasets[0].data = percentages;
            this.radarChart.update();
        } else {
            const ctx = canvas.getContext('2d');
            this.radarChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Score Percentage',
                        data: percentages,
                        fill: true,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            min: 0,
                            ticks: {
                                stepSize: 20,
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            pointLabels: {
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.parsed.r + '%';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    /**
     * Setup auto-save on blur events
     */
    setupAutoSave() {
        const form = document.getElementById('dynamicForm');
        if (!form) return;

        // Save on blur for all input types
        form.addEventListener('blur', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.saveToLocalStorage();
                this.updatePointsDisplay();
            }
        }, true);

        // Save and update points immediately on change for all inputs
        form.addEventListener('change', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.saveToLocalStorage();
                this.updatePointsDisplay();
            }
        });

        // Update points immediately on input (for real-time feedback on text fields)
        form.addEventListener('input', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.updatePointsDisplay();
            }
        });
    }
}
