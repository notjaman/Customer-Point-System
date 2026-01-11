import { createClient } from '@supabase/supabase-js';
import { Customer } from '../types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

console.log('Supabase Configuration Check:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  key: supabaseAnonKey ? 'Set' : 'Missing',
  urlLength: supabaseUrl?.length || 0,
  keyLength: supabaseAnonKey?.length || 0
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '[HIDDEN]' : 'undefined'
  });
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Tier thresholds
const TIER_THRESHOLDS = {
  GOLD: 1000,
  PLATINUM: 5000
} as const;

// Helper function to calculate tier based on points
export const calculateTier = (points: number): 'standard' | 'gold' | 'platinum' => {
  const tier = points >= TIER_THRESHOLDS.PLATINUM ? 'platinum' : 
               points >= TIER_THRESHOLDS.GOLD ? 'gold' : 
               'standard';
  
  console.log(`Calculating tier for ${points} points: ${tier}`);
  return tier;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
class SupabaseDB {
  async getCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }

      // Debug logging to check what data we're getting
      console.log('Fetched customers from Supabase:', data?.slice(0, 2));
      
      return data || [];
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      return [];
    }
  }

  async addCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'points_redeemed' | 'tier'>): Promise<Customer> {
    try {
      const points = customer.points || 0;
      const tier = calculateTier(points);
      
      const newCustomer = {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        points: points,
        points_redeemed: 0,
        tier: tier,
      };

      console.log('🔍 DEBUG: About to insert customer:', {
        ...newCustomer,
        tierType: typeof tier,
        tierValue: tier,
        pointsValue: points
      });

      const { data, error } = await supabase
        .from('customers')
        .insert([newCustomer])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          sentData: newCustomer
        });
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from database');
      }

      console.log('✅ Successfully added customer:', data);
      return data;
    } catch (error) {
      console.error('💥 Failed to add customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating customer:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update customer:', error);
      return null;
    }
  }

  async updatePoints(id: string, amount: number): Promise<Customer | null> {
    try {
      // First, get the current customer data
      const { data: currentCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !currentCustomer) {
        console.error('Error fetching customer for points update:', fetchError);
        return null;
      }

      // Calculate new values
      const newPoints = currentCustomer.points + amount;
      const newPointsRedeemed = amount < 0 
        ? (currentCustomer.points_redeemed || 0) + Math.abs(amount)
        : currentCustomer.points_redeemed || 0;
      const newTier = calculateTier(newPoints);

      // Update the customer
      const { data, error } = await supabase
        .from('customers')
        .update({
          points: newPoints,
          points_redeemed: newPointsRedeemed,
          tier: newTier
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating points:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update points:', error);
      return null;
    }
  }

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting customer:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete customer:', error);
      return false;
    }
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching customers:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to search customers:', error);
      return [];
    }
  }
}

export const db = new SupabaseDB();