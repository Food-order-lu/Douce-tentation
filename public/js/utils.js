/**
 * Douce Tentation - Utility Functions
 * ====================================
 * Common helper functions used across the application.
 * 
 * @module utils
 */

/**
 * Order source types for visual styling
 */
const ORDER_SOURCES = {
    GLORIA_CAKE: 'gloria_cake',
    GLORIA_SNACK: 'gloria_snack',
    MANUAL: 'manual'
};

/**
 * Get the Monday of the week containing the given date
 * @param {Date} date - Reference date
 * @returns {Date} Monday of that week
 */
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format a date in French locale
 * @param {Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
function formatDateFR(date, options = {}) {
    return date.toLocaleDateString('fr-FR', options);
}

/**
 * Get CSS class for order source
 * @param {string} source - Order source type
 * @returns {string} CSS class name
 */
function getSourceClass(source) {
    switch (source) {
        case ORDER_SOURCES.GLORIA_SNACK:
            return 'gloria-snack';
        case ORDER_SOURCES.GLORIA_CAKE:
            return 'gloria-cake';
        default:
            return '';
    }
}

/**
 * Get label HTML for order source
 * @param {string} source - Order source type
 * @returns {string} HTML string with icon and label
 */
function getSourceLabel(source) {
    switch (source) {
        case ORDER_SOURCES.GLORIA_SNACK:
            return '<span style="color:#E85D04;"><i class="fas fa-utensils"></i> Snacking</span>';
        case ORDER_SOURCES.GLORIA_CAKE:
            return '<span style="color:#D4AF37;"><i class="fas fa-birthday-cake"></i> Gâteau Web</span>';
        default:
            return '';
    }
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
function isAuthenticated() {
    return localStorage.getItem('isAuthenticated') === 'true';
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem('isAuthenticated');
    window.location.href = 'index.html';
}

// Export for use in other modules
window.DouxUtils = {
    ORDER_SOURCES,
    getStartOfWeek,
    formatDateISO,
    formatDateFR,
    getSourceClass,
    getSourceLabel,
    isAuthenticated,
    logout
};
