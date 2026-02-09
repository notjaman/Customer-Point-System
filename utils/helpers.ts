/**
 * Utility helper functions
 */

import { Customer } from '../types';
import { cleanPhoneNumber } from './formatters';

/**
 * Finds a referrer customer based on name and/or phone number
 * Prioritizes exact matches on both fields, then falls back to individual matches
 * 
 * @param customers - Array of all customers
 * @param details - Referral details with optional name and phone
 * @returns The found customer or undefined
 */
export const findReferrer = (
    customers: Customer[],
    details: { name?: string; phone?: string }
): Customer | undefined => {
    const cleanInputPhone = details.phone ? cleanPhoneNumber(details.phone) : undefined;
    const lowerName = details.name?.toLowerCase();

    // Try to find exact match on both name and phone first
    if (lowerName && cleanInputPhone) {
        const exactMatch = customers.find(c => {
            const matchesName = c.name.toLowerCase() === lowerName;
            const matchesPhone = cleanPhoneNumber(c.phone) === cleanInputPhone;
            return matchesName && matchesPhone;
        });
        if (exactMatch) return exactMatch;
    }

    // Fallback to name match
    if (lowerName) {
        const nameMatch = customers.find(c => c.name.toLowerCase() === lowerName);
        if (nameMatch) return nameMatch;
    }

    // Fallback to phone match
    if (cleanInputPhone) {
        return customers.find(c => cleanPhoneNumber(c.phone) === cleanInputPhone);
    }

    return undefined;
};
