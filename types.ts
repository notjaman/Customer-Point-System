
export interface Customer {
  id: string;
  phone: string;
  name: string;
  points: number;
  points_redeemed: number; // Track total points spent
  created_at: string;
  tier?: 'Standard' | 'Gold' | 'Platinum';
}

export type SortOption = 'name-asc' | 'name-desc' | 'points-high' | 'points-low' | 'newest';
export type TierFilter = 'All' | 'Standard' | 'Gold' | 'Platinum';

export interface Transaction {
  id: string;
  customer_id: string;
  amount: number;
  type: 'earn' | 'redeem';
  description: string;
  created_at: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalPoints: number;
  activeToday: number;
  growth: number;
}
