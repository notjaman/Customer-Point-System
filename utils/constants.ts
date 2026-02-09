/**
 * Application-wide constants
 */

// Display constants
export const TOP_MEMBERS_COUNT = 6;
export const QUICK_REDEMPTION_AMOUNTS = [500, 1000, 1500] as const;

// Tier badge styles
export const TIER_STYLES = {
    platinum: 'bg-indigo-100 text-indigo-700',
    gold: 'bg-amber-100 text-amber-700',
    standard: 'bg-emerald-100 text-emerald-700'
} as const;

// Tier badge background colors for top members
export const TIER_RANKING_COLORS = {
    0: 'bg-amber-400',      // 1st place - gold
    1: 'bg-slate-400',       // 2nd place - silver
    2: 'bg-orange-400',      // 3rd place - bronze
    default: 'bg-indigo-400' // Others
} as const;

// Notification styles
export const NOTIFICATION_STYLES = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
} as const;

// Action type colors for audit logs
export const ACTION_TYPE_COLORS = {
    customer_created: 'text-green-600',
    customer_updated: 'text-blue-600',
    customer_deleted: 'text-red-600',
    points_added: 'text-green-600',
    points_redeemed: 'text-orange-600'
} as const;

// Confirm dialog button styles
export const DIALOG_BUTTON_STYLES = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white'
} as const;
