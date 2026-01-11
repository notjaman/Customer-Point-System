
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
  created_at: string;
}
