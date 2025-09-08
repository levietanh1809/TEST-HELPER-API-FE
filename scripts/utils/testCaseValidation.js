/**
 * Validation utilities for test case generation
 */

/**
 * Validate SRS description input
 * @param {string} srsDescription - The SRS description to validate
 * @returns {object} - Validation result with isValid boolean and error message
 */
function validateSRSDescription(srsDescription) {
    // SRS description is now optional, so empty is valid
    if (!srsDescription || typeof srsDescription !== 'string') {
        return {
            isValid: true,
            error: null
        };
    }
    
    const trimmed = srsDescription.trim();
    
    // Empty SRS is valid (optional field)
    if (trimmed.length === 0) {
        return {
            isValid: true,
            error: null
        };
    }
    
    if (trimmed.length > 10000) {
        return {
            isValid: false,
            error: 'SRS description is too long (maximum 10,000 characters)'
        };
    }
    
    // If provided, should have at least reasonable content
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount < 3) {
        return {
            isValid: false,
            error: 'SRS description is too short (minimum 3 words required if provided)'
        };
    }
    
    return {
        isValid: true,
        error: null
    };
}

/**
 * Validate project name input
 * @param {string} projectName - The project name to validate
 * @returns {object} - Validation result with isValid boolean and error message
 */
function validateProjectName(projectName) {
    // Project name is optional, so empty is valid
    if (!projectName || projectName.trim().length === 0) {
        return {
            isValid: true,
            error: null
        };
    }
    
    const trimmed = projectName.trim();
    
    if (trimmed.length > 100) {
        return {
            isValid: false,
            error: 'Project name is too long (maximum 100 characters)'
        };
    }
    
    // Check for valid characters (letters, numbers, spaces, hyphens, underscores)
    const validPattern = /^[a-zA-Z0-9\s\-_]+$/;
    if (!validPattern.test(trimmed)) {
        return {
            isValid: false,
            error: 'Project name contains invalid characters. Use only letters, numbers, spaces, hyphens, and underscores.'
        };
    }
    
    return {
        isValid: true,
        error: null
    };
}

/**
 * Validate additional requirements input
 * @param {string} additionalRequirements - The additional requirements to validate
 * @returns {object} - Validation result with isValid boolean and error message
 */
function validateAdditionalRequirements(additionalRequirements) {
    // Additional requirements are optional
    if (!additionalRequirements || additionalRequirements.trim().length === 0) {
        return {
            isValid: true,
            error: null
        };
    }
    
    const trimmed = additionalRequirements.trim();
    
    if (trimmed.length > 2000) {
        return {
            isValid: false,
            error: 'Additional requirements are too long (maximum 2,000 characters)'
        };
    }
    
    return {
        isValid: true,
        error: null
    };
}

/**
 * Validate testing framework selection
 * @param {string} testingFramework - The testing framework to validate
 * @returns {object} - Validation result with isValid boolean and error message
 */
function validateTestingFramework(testingFramework) {
    const validFrameworks = [
        'manual', 'cypress', 'playwright', 'jest', 
        'testing_library', 'vitest', 'selenium'
    ];
    
    if (!testingFramework || !validFrameworks.includes(testingFramework)) {
        return {
            isValid: false,
            error: 'Invalid testing framework selected'
        };
    }
    
    return {
        isValid: true,
        error: null
    };
}

/**
 * Validate AI model selection
 * @param {string} model - The AI model to validate
 * @returns {object} - Validation result with isValid boolean and error message
 */
function validateAIModel(model) {
    const validModels = [
        'gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini',
        'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'
    ];
    
    if (!model || !validModels.includes(model)) {
        return {
            isValid: false,
            error: 'Invalid AI model selected'
        };
    }
    
    return {
        isValid: true,
        error: null
    };
}

/**
 * Validate entire test case generation form
 * @param {object} formData - The form data to validate
 * @returns {object} - Validation result with isValid boolean and errors array
 */
function validateTestCaseGenerationForm(formData) {
    const errors = [];
    
    // Validate SRS description (optional now)
    const srsValidation = validateSRSDescription(formData.srsDescription);
    if (!srsValidation.isValid) {
        errors.push(srsValidation.error);
    }
    
    // Validate project name (optional)
    const projectValidation = validateProjectName(formData.projectName);
    if (!projectValidation.isValid) {
        errors.push(projectValidation.error);
    }
    
    // Validate additional requirements (optional)
    const requirementsValidation = validateAdditionalRequirements(formData.additionalRequirements);
    if (!requirementsValidation.isValid) {
        errors.push(requirementsValidation.error);
    }
    
    // Validate testing framework (required)
    const frameworkValidation = validateTestingFramework(formData.testingFramework);
    if (!frameworkValidation.isValid) {
        errors.push(frameworkValidation.error);
    }
    
    // Validate AI model (required)
    const modelValidation = validateAIModel(formData.model);
    if (!modelValidation.isValid) {
        errors.push(modelValidation.error);
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Show validation errors in UI
 * @param {array} errors - Array of error messages
 */
function showValidationErrors(errors) {
    if (!errors || errors.length === 0) return;
    
    const errorMessage = errors.length === 1 
        ? errors[0] 
        : `Multiple validation errors:\n${errors.map(error => `• ${error}`).join('\n')}`;
    
    showToast(RESULT.ERROR, errorMessage);
}

/**
 * Clear validation error styles from form fields
 */
function clearValidationErrors() {
    const formFields = [
        'srs-description',
        'project-name', 
        'additional-requirements',
        'testing-framework',
        'test-generation-model'
    ];
    
    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = '';
            field.style.boxShadow = '';
        }
    });
}

/**
 * Highlight form field with error
 * @param {string} fieldId - The ID of the form field to highlight
 */
function highlightFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.style.borderColor = '#ef4444';
        field.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
        field.focus();
    }
}
