/**
 * Utility functions for formatting data
 */

/**
 * Formats a phone number to Malaysian format with +60 prefix
 * @param value - The input phone number string
 * @returns Formatted phone number with +60 prefix
 */
export const formatMalaysianPhone = (value: string): string => {
    // Always ensure it starts with +60
    if (!value.startsWith('+60')) {
        value = '+60 ' + value.replace(/^\+?60?\s*/, '');
    }

    // Prevent deletion of +60 prefix
    if (value.length < 4) {
        value = '+60 ';
    }

    return value;
};

/**
 * Removes all formatting characters from a phone number
 * @param phone - The formatted phone number
 * @returns Clean phone number with only digits and country code
 */
export const cleanPhoneNumber = (phone: string): string => {
    return phone.replace(/[\s\-]/g, '');
};

/**
 * Formats a date string to a localized date-time string
 * @param dateString - ISO date string
 * @returns Formatted date-time string
 */
export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
};
