/**
 * Storage Wrapper Utility
 * Provides unified storage interface that works in both Chrome extension and web contexts
 */

/**
 * Storage wrapper that handles both chrome.storage and localStorage
 */
class StorageWrapper {
    constructor() {
        this.isExtensionContext = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
        this.prefix = 'testcraft_';
    }

    /**
     * Get items from storage
     * @param {string|string[]|object} keys - Keys to retrieve
     * @returns {Promise<object>} Promise resolving to key-value pairs
     */
    async get(keys) {
        if (this.isExtensionContext) {
            return this._getChromeStorage(keys);
        } else {
            return this._getLocalStorage(keys);
        }
    }

    /**
     * Set items in storage
     * @param {object} items - Key-value pairs to store
     * @returns {Promise<void>}
     */
    async set(items) {
        if (this.isExtensionContext) {
            return this._setChromeStorage(items);
        } else {
            return this._setLocalStorage(items);
        }
    }

    /**
     * Remove items from storage
     * @param {string|string[]} keys - Keys to remove
     * @returns {Promise<void>}
     */
    async remove(keys) {
        if (this.isExtensionContext) {
            return this._removeChromeStorage(keys);
        } else {
            return this._removeLocalStorage(keys);
        }
    }

    /**
     * Clear all storage
     * @returns {Promise<void>}
     */
    async clear() {
        if (this.isExtensionContext) {
            return chrome.storage.local.clear();
        } else {
            // Only clear items with our prefix
            const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
            keys.forEach(key => localStorage.removeItem(key));
            return Promise.resolve();
        }
    }

    // Chrome storage methods
    async _getChromeStorage(keys) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(keys, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result);
                }
            });
        });
    }

    async _setChromeStorage(items) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set(items, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    }

    async _removeChromeStorage(keys) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove(keys, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    }

    // LocalStorage methods (fallback)
    async _getLocalStorage(keys) {
        const result = {};
        
        if (typeof keys === 'string') {
            const value = localStorage.getItem(this.prefix + keys);
            if (value !== null) {
                try {
                    result[keys] = JSON.parse(value);
                } catch (e) {
                    result[keys] = value;
                }
            }
        } else if (Array.isArray(keys)) {
            keys.forEach(key => {
                const value = localStorage.getItem(this.prefix + key);
                if (value !== null) {
                    try {
                        result[key] = JSON.parse(value);
                    } catch (e) {
                        result[key] = value;
                    }
                }
            });
        } else if (typeof keys === 'object' && keys !== null) {
            Object.keys(keys).forEach(key => {
                const value = localStorage.getItem(this.prefix + key);
                if (value !== null) {
                    try {
                        result[key] = JSON.parse(value);
                    } catch (e) {
                        result[key] = value;
                    }
                } else {
                    // Use default value if provided
                    result[key] = keys[key];
                }
            });
        }
        
        return Promise.resolve(result);
    }

    async _setLocalStorage(items) {
        Object.keys(items).forEach(key => {
            const value = typeof items[key] === 'object' 
                ? JSON.stringify(items[key]) 
                : items[key];
            localStorage.setItem(this.prefix + key, value);
        });
        return Promise.resolve();
    }

    async _removeLocalStorage(keys) {
        if (typeof keys === 'string') {
            localStorage.removeItem(this.prefix + keys);
        } else if (Array.isArray(keys)) {
            keys.forEach(key => localStorage.removeItem(this.prefix + key));
        }
        return Promise.resolve();
    }
}

// Create a global instance
const storageWrapper = new StorageWrapper();

// Make it available globally in multiple ways for compatibility
if (typeof window !== 'undefined') {
    window.storageWrapper = storageWrapper;
}

// Also make it available as a global variable
if (typeof global !== 'undefined') {
    global.storageWrapper = storageWrapper;
}

// And as a direct assignment for immediate access
self.storageWrapper = storageWrapper;
