/**
 * Copy text to clipboard with fallback support
 */
async function copyToClipboard(text) {
    try {
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers or non-secure contexts
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (!successful) {
                    throw new Error('execCommand failed');
                }
            } catch (err) {
                throw new Error('Copy command failed');
            } finally {
                document.body.removeChild(textArea);
            }
        }
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const accessibilityCheckContainer = document.getElementById('accessibility-check');
    const copyButton = document.getElementById('copyButton');

    copyButton.addEventListener('click', async () => {
        try {
            await copyToClipboard(accessibilityCheckContainer.textContent);
            showToast(RESULT.SUCCESS, MESSAGES.COPIED);
        } catch (err) {
            showToast(RESULT.ERROR, MESSAGES.FAILED);
        }
    });

    showResult(FEATURE.CHECK_ACCESSIBILITY);
});
