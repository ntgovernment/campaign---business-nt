/**
 * ConditionalLogic - Evaluates and applies conditional visibility and required states
 */

class ConditionalLogic {
    constructor(formConfig, formRenderer) {
        this.formConfig = formConfig;
        this.formRenderer = formRenderer;
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
     * Evaluate all conditional rules for current form state
     */
    evaluateAll(formState) {
        const allFields = this.getAllFields();
        if (allFields.length === 0) return;

        allFields.forEach(field => {
            // Evaluate conditional visibility
            if (field.conditionalVisibility) {
                const isVisible = this.evaluateCondition(field.conditionalVisibility, formState);
                this.formRenderer.setFieldVisibility(field.id, isVisible);
                
                // If field is hidden, clear its value and remove validation
                if (!isVisible) {
                    this.clearFieldValue(field.id);
                    this.formRenderer.setFieldRequired(field.id, false);
                }
            }

            // Evaluate conditional required state (only if field is visible)
            if (field.conditionalRequired) {
                const fieldVisible = this.isFieldVisible(field.id);
                if (fieldVisible) {
                    const isRequired = this.evaluateCondition(field.conditionalRequired, formState);
                    this.formRenderer.setFieldRequired(field.id, isRequired);
                }
            } else if (field.required) {
                // Apply base required state if no conditional
                const fieldVisible = this.isFieldVisible(field.id);
                if (fieldVisible) {
                    this.formRenderer.setFieldRequired(field.id, true);
                }
            }
        });
    }

    /**
     * Evaluate a single condition
     */
    evaluateCondition(condition, formState) {
        const fieldValue = formState[condition.field];
        const conditionValue = condition.value;
        const operator = condition.operator || 'equals';

        switch (operator) {
            case 'equals':
                return fieldValue === conditionValue;
            
            case 'notEquals':
                return fieldValue !== conditionValue;
            
            case 'contains':
                if (Array.isArray(fieldValue)) {
                    return fieldValue.includes(conditionValue);
                }
                return String(fieldValue || '').includes(conditionValue);
            
            case 'notContains':
                if (Array.isArray(fieldValue)) {
                    return !fieldValue.includes(conditionValue);
                }
                return !String(fieldValue || '').includes(conditionValue);
            
            case 'greaterThan':
                return Number(fieldValue) > Number(conditionValue);
            
            case 'lessThan':
                return Number(fieldValue) < Number(conditionValue);
            
            case 'greaterThanOrEqual':
                return Number(fieldValue) >= Number(conditionValue);
            
            case 'lessThanOrEqual':
                return Number(fieldValue) <= Number(conditionValue);
            
            case 'isEmpty':
                return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);
            
            case 'isNotEmpty':
                return fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0);
            
            case 'in':
                // Check if field value is in an array of possible values
                const possibleValues = Array.isArray(conditionValue) ? conditionValue : [conditionValue];
                return possibleValues.includes(fieldValue);
            
            case 'notIn':
                const excludedValues = Array.isArray(conditionValue) ? conditionValue : [conditionValue];
                return !excludedValues.includes(fieldValue);
            
            default:
                console.warn(`Unknown operator: ${operator}`);
                return false;
        }
    }

    /**
     * Check if a field is currently visible
     */
    isFieldVisible(fieldId) {
        const fieldGroup = document.getElementById(`field-${fieldId}`);
        if (!fieldGroup) return false;
        return !fieldGroup.classList.contains('hidden');
    }

    /**
     * Clear the value of a field
     */
    clearFieldValue(fieldId) {
        const elements = document.querySelectorAll(`[name="${fieldId}"]`);
        elements.forEach(element => {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = false;
            } else {
                element.value = '';
            }
        });
    }

    /**
     * Setup event listeners for conditional logic
     */
    setupEventListeners(stateManager) {
        const form = document.getElementById('dynamicForm');
        if (!form) return;

        // Listen for all input changes
        form.addEventListener('input', () => {
            const currentState = stateManager.captureFormState();
            this.evaluateAll(currentState);
        });

        form.addEventListener('change', () => {
            const currentState = stateManager.captureFormState();
            this.evaluateAll(currentState);
        });
    }

    /**
     * Evaluate complex conditions with AND/OR logic
     * For future enhancement - supports nested conditions
     */
    evaluateComplexCondition(conditions, formState, logic = 'AND') {
        if (!Array.isArray(conditions)) {
            return this.evaluateCondition(conditions, formState);
        }

        const results = conditions.map(condition => {
            if (condition.conditions) {
                // Nested conditions
                return this.evaluateComplexCondition(
                    condition.conditions,
                    formState,
                    condition.logic || 'AND'
                );
            }
            return this.evaluateCondition(condition, formState);
        });

        if (logic === 'OR') {
            return results.some(result => result === true);
        } else {
            // Default to AND
            return results.every(result => result === true);
        }
    }
}
