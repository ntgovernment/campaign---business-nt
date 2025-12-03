/**
 * FormRenderer - Dynamically generates Bootstrap 5 form fields from JSON configuration
 */

class FormRenderer {
    constructor(container) {
        this.container = container;
    }

    /**
     * Safely escape HTML to prevent XSS when injecting feedback as HTML
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
     * Parse a feedback string from dataset (may be JSON or plain text)
     */
    _parseFeedback(feedbackStr) {
        if (!feedbackStr) return null;
        try {
            const parsed = JSON.parse(feedbackStr);
            return parsed;
        } catch (e) {
            // Not JSON, treat as plain text
            return { text: feedbackStr };
        }
    }

    /**
     * Return HTML for a feedback object {title, text} or plain text
     */
    _formatFeedbackHtml(feedbackObj) {
        if (!feedbackObj) return '';
        if (typeof feedbackObj === 'string') {
            return this._escapeHtml(feedbackObj);
        }
        const parts = [];
        if (feedbackObj.title) {
            parts.push(`<strong>${this._escapeHtml(feedbackObj.title)}</strong>`);
        }
        if (feedbackObj.text) {
            parts.push(`${this._escapeHtml(feedbackObj.text)}`);
        }
        return parts.join(' - ');
    }

    /**
     * Render all fields for a specific page
     */
    renderPage(fields, formState = {}) {
        this.container.innerHTML = '';
        
        fields.forEach(field => {
            const fieldElement = this.renderField(field, formState[field.id]);
            this.container.appendChild(fieldElement);
        });
    }

    /**
     * Render a single field based on its type
     */
    renderField(field, value = null) {
        const fieldGroup = document.createElement('div');
        fieldGroup.className = 'field-group';
        fieldGroup.id = `field-${field.id}`;
        fieldGroup.dataset.fieldId = field.id;

        const label = this.createLabel(field);
        fieldGroup.appendChild(label);

        if (field.description) {
            const description = document.createElement('div');
            description.className = 'field-description';
            description.textContent = field.description;
            fieldGroup.appendChild(description);
        }

        let inputElement;
        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
                inputElement = this.createTextInput(field, value);
                break;
            case 'textarea':
                inputElement = this.createTextarea(field, value);
                break;
            case 'select':
                inputElement = this.createSelect(field, value);
                break;
            case 'radio':
                inputElement = this.createRadio(field, value);
                break;
            case 'checkbox':
                inputElement = this.createCheckbox(field, value);
                break;
            default:
                inputElement = this.createTextInput(field, value);
        }

        fieldGroup.appendChild(inputElement);

        // Add validation feedback
        const invalidFeedback = document.createElement('div');
        invalidFeedback.className = 'invalid-feedback';
        invalidFeedback.textContent = `Please provide a valid ${field.label.toLowerCase()}.`;
        // Hide feedback by default; will be shown when validation runs
        invalidFeedback.style.display = 'none';
        fieldGroup.appendChild(invalidFeedback);

        return fieldGroup;
    }

    /**
     * Create label element with required indicator
     */
    createLabel(field) {
        const label = document.createElement('label');
        label.className = 'form-label fw-bold';
        label.htmlFor = field.id;
        label.textContent = field.label;

        if (field.required) {
            const requiredSpan = document.createElement('span');
            requiredSpan.className = 'required-indicator';
            requiredSpan.textContent = '*';
            label.appendChild(requiredSpan);
        }

        if (field.points !== undefined && field.points !== 0) {
            const pointsSpan = document.createElement('span');
            pointsSpan.className = 'field-points';
            pointsSpan.textContent = `${field.points} pts`;
            label.appendChild(pointsSpan);
        }

        return label;
    }

    /**
     * Create text/email/number input
     */
    createTextInput(field, value) {
        const input = document.createElement('input');
        input.type = field.type || 'text';
        input.className = 'form-control';
        input.id = field.id;
        input.name = field.id;
        
        if (value !== null && value !== undefined) {
            input.value = value;
        }
        
        if (field.required) {
            input.required = true;
        }
        
        if (field.min !== undefined) {
            input.min = field.min;
        }
        
        if (field.max !== undefined) {
            input.max = field.max;
        }
        
        if (field.type === 'email') {
            input.pattern = '[^@]+@[^@]+\\.[^@]+';
        }

        return input;
    }

    /**
     * Create textarea
     */
    createTextarea(field, value) {
        const textarea = document.createElement('textarea');
        textarea.className = 'form-control';
        textarea.id = field.id;
        textarea.name = field.id;
        textarea.rows = field.rows || 3;
        
        if (value !== null && value !== undefined) {
            textarea.value = value;
        }
        
        if (field.required) {
            textarea.required = true;
        }

        return textarea;
    }

    /**
     * Create select dropdown
     */
    createSelect(field, value) {
        const select = document.createElement('select');
        select.className = 'form-select';
        select.id = field.id;
        select.name = field.id;
        
        if (field.required) {
            select.required = true;
        }

        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Select an option --';
        defaultOption.selected = true;
        defaultOption.disabled = true;
        select.appendChild(defaultOption);

        // Add options
        if (field.options) {
            field.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.label;
                optionElement.dataset.points = option.points || 0;
                // store feedback on the option element for later display
                if (option.feedback) {
                    optionElement.dataset.feedback = JSON.stringify(option.feedback);
                }
                
                if (value === option.value) {
                    optionElement.selected = true;
                }
                
                if (option.points && option.points !== 0) {
                    optionElement.textContent += ` (${option.points} pts)`;
                }
                
                select.appendChild(optionElement);
            });
        }

        // Create feedback container for select option feedback
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'option-feedback mt-2 text-muted';
        feedbackDiv.style.display = 'none';

        // Update feedback when selection changes
        select.addEventListener('change', () => {
            const selected = select.selectedOptions && select.selectedOptions[0];
            if (selected && selected.dataset && selected.dataset.feedback) {
                const parsed = this._parseFeedback(selected.dataset.feedback);
                feedbackDiv.innerHTML = this._formatFeedbackHtml(parsed);
                feedbackDiv.style.display = 'block';
            } else {
                feedbackDiv.textContent = '';
                feedbackDiv.style.display = 'none';
            }
        });

        // If a value was already selected, trigger feedback display
        if (value !== null && value !== undefined) {
            const initial = Array.from(select.options).find(o => o.value === value);
            if (initial && initial.dataset && initial.dataset.feedback) {
                const parsed = this._parseFeedback(initial.dataset.feedback);
                feedbackDiv.innerHTML = this._formatFeedbackHtml(parsed);
                feedbackDiv.style.display = 'block';
            }
        }

        // Wrap select and feedback in a container so caller can append both
        const wrapper = document.createElement('div');
        wrapper.appendChild(select);
        wrapper.appendChild(feedbackDiv);

        return wrapper;
    }

    /**
     * Create radio button group
     */
    createRadio(field, value) {
        const container = document.createElement('div');
        container.className = 'mt-2';
        // feedback container for radio group
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'option-feedback mt-2 text-muted';
        feedbackDiv.style.display = 'none';

        if (field.options) {
            field.options.forEach((option, index) => {
                const radioDiv = document.createElement('div');
                radioDiv.className = 'form-check';

                const input = document.createElement('input');
                input.className = 'form-check-input';
                input.type = 'radio';
                input.name = field.id;
                input.id = `${field.id}_${index}`;
                input.value = option.value;
                input.dataset.points = option.points || 0;
                if (option.feedback) {
                    input.dataset.feedback = JSON.stringify(option.feedback);
                }
                
                if (field.required) {
                    input.required = true;
                }
                
                if (value === option.value) {
                    input.checked = true;
                }

                const label = document.createElement('label');
                label.className = 'form-check-label';
                label.htmlFor = `${field.id}_${index}`;
                label.textContent = option.label;

                if (option.points && option.points !== 0) {
                    const pointsSpan = document.createElement('span');
                    pointsSpan.className = 'field-points';
                    pointsSpan.textContent = `${option.points} pts`;
                    label.appendChild(pointsSpan);
                }

                radioDiv.appendChild(input);
                radioDiv.appendChild(label);
                container.appendChild(radioDiv);
            });
        }

        // Listen for changes in the radio group to display feedback
        container.addEventListener('change', (e) => {
            const target = e.target;
            if (target && target.type === 'radio') {
                const fb = target.dataset && target.dataset.feedback;
                if (fb) {
                    const parsed = this._parseFeedback(fb);
                    feedbackDiv.innerHTML = this._formatFeedbackHtml(parsed);
                    feedbackDiv.style.display = 'block';
                } else {
                    feedbackDiv.textContent = '';
                    feedbackDiv.style.display = 'none';
                }
            }
        });

        // If a value was already selected, show its feedback
        if (value !== null && value !== undefined) {
            const selectedInput = container.querySelector(`input[type="radio"][value="${value}"]`);
            if (selectedInput && selectedInput.dataset && selectedInput.dataset.feedback) {
                const parsed = this._parseFeedback(selectedInput.dataset.feedback);
                feedbackDiv.innerHTML = this._formatFeedbackHtml(parsed);
                feedbackDiv.style.display = 'block';
            }
        }

        container.appendChild(feedbackDiv);

        return container;
    }

    /**
     * Create checkbox group
     */
    createCheckbox(field, values) {
        const container = document.createElement('div');
        container.className = 'mt-2';
        
        const valuesArray = Array.isArray(values) ? values : (values ? [values] : []);

        if (field.options) {
            field.options.forEach((option, index) => {
                const checkDiv = document.createElement('div');
                checkDiv.className = 'form-check';

                const input = document.createElement('input');
                input.className = 'form-check-input';
                input.type = 'checkbox';
                input.name = field.id;
                input.id = `${field.id}_${index}`;
                input.value = option.value;
                input.dataset.points = option.points || 0;
                if (option.feedback) {
                    input.dataset.feedback = JSON.stringify(option.feedback);
                }
                
                if (valuesArray.includes(option.value)) {
                    input.checked = true;
                }

                const label = document.createElement('label');
                label.className = 'form-check-label';
                label.htmlFor = `${field.id}_${index}`;
                label.textContent = option.label;

                if (option.points && option.points !== 0) {
                    const pointsSpan = document.createElement('span');
                    pointsSpan.className = 'field-points';
                    pointsSpan.textContent = `${option.points} pts`;
                    label.appendChild(pointsSpan);
                }

                checkDiv.appendChild(input);
                checkDiv.appendChild(label);
                container.appendChild(checkDiv);
            });
        }

        // feedback container for checkbox group - show combined feedbacks
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'option-feedback mt-2 text-muted';
        feedbackDiv.style.display = 'none';

        container.addEventListener('change', () => {
            const checked = Array.from(container.querySelectorAll('input[type="checkbox"]:checked'));
            const feedbacks = checked.map(ch => {
                if (ch.dataset && ch.dataset.feedback) {
                    const parsed = this._parseFeedback(ch.dataset.feedback);
                    return this._formatFeedbackHtml(parsed);
                }
                return null;
            }).filter(Boolean);
            if (feedbacks.length > 0) {
                feedbackDiv.innerHTML = feedbacks.join('<br>');
                feedbackDiv.style.display = 'block';
            } else {
                feedbackDiv.textContent = '';
                feedbackDiv.style.display = 'none';
            }
        });

        // If some values are pre-checked, show their feedbacks
        if (valuesArray.length > 0) {
            const initialChecked = Array.from(container.querySelectorAll('input[type="checkbox"]'))
                .filter(i => valuesArray.includes(i.value));
            const initialFeedbacks = initialChecked.map(i => {
                if (i.dataset && i.dataset.feedback) {
                    const parsed = this._parseFeedback(i.dataset.feedback);
                    return this._formatFeedbackHtml(parsed);
                }
                return null;
            }).filter(Boolean);
            if (initialFeedbacks.length > 0) {
                feedbackDiv.innerHTML = initialFeedbacks.join('<br>');
                feedbackDiv.style.display = 'block';
            }
        }

        container.appendChild(feedbackDiv);

        return container;
    }

    /**
     * Update field visibility
     */
    setFieldVisibility(fieldId, visible) {
        const fieldGroup = document.getElementById(`field-${fieldId}`);
        if (fieldGroup) {
            if (visible) {
                fieldGroup.classList.remove('hidden');
            } else {
                fieldGroup.classList.add('hidden');
            }
        }
    }

    /**
     * Update field required state
     */
    setFieldRequired(fieldId, required) {
        const fieldGroup = document.getElementById(`field-${fieldId}`);
        if (!fieldGroup) return;

        // Update all inputs within the field group
        const inputs = fieldGroup.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (required) {
                input.required = true;
            } else {
                input.required = false;
            }
        });

        // Update label
        const label = fieldGroup.querySelector('.form-label');
        if (label) {
            let requiredIndicator = label.querySelector('.required-indicator');
            if (required && !requiredIndicator) {
                requiredIndicator = document.createElement('span');
                requiredIndicator.className = 'required-indicator';
                requiredIndicator.textContent = '*';
                label.appendChild(requiredIndicator);
            } else if (!required && requiredIndicator) {
                requiredIndicator.remove();
            }
        }
    }
}
