
export interface Customer {
  id: string;
  phone: string;
  name: string;
  points: number;
  points_redeemed: number; // Track total points spent
  created_at: string;
  tier?: 'standard' | 'gold' | 'platinum';
}

export type SortOption = 'name-asc' | 'name-desc' | 'points-high' | 'points-low' | 'newest';
export type TierFilter = 'All' | 'standard' | 'gold' | 'platinum';

export interface AuditLog {
  id: string;
  action_type: 'customer_created' | 'customer_updated' | 'customer_deleted' | 'points_added' | 'points_redeemed';
  customer_id: string | null;
  customer_name: string;
  points_change?: number;
  created_at: string;
}
export const REFERRAL_BONUS_POINTS = 50;

// Redemption System Constants
export const POINTS_PER_REDEMPTION = 500;
export const RM_PER_REDEMPTION = 10;
export const POINTS_TO_RM_RATE = RM_PER_REDEMPTION / POINTS_PER_REDEMPTION; // 0.02

// Redemption threshold for admin notifications (daily)
export const REDEMPTION_THRESHOLD = {
  dailyPoints: 5000,  // Notify when 5000+ points redeemed today
  dailyRM: 100,       // Equivalent to RM 100
};

// Utility Functions
export const convertPointsToRM = (points: number): number => {
  return points * POINTS_TO_RM_RATE;
};

export const isValidRedemption = (points: number): boolean => {
  return points > 0 && points % POINTS_PER_REDEMPTION === 0;
};

export const formatRM = (amount: number): string => {
  return `RM ${amount.toFixed(2)}`;
};
