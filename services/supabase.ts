import { createClient } from '@supabase/supabase-js';
import { Customer, AuditLog } from '../types';

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

// Audit logging helper functions
class AuditLogger {
  private static async logAction(
    actionType: AuditLog['action_type'],
    customerId: string | null,
    customerName: string,
    pointsChange?: number
  ): Promise<void> {
    try {
      // Ensure customerId is either a valid string or null (not undefined or empty string)
      const sanitizedCustomerId = (customerId && customerId.trim() !== '') ? customerId : null;

      const { data, error } = await supabase
        .from('audit_logs')
        .insert([{
          action_type: actionType,
          customer_id: sanitizedCustomerId,
          customer_name: customerName,
          points_change: pointsChange
        }])
        .select();

      if (error) {
        console.error('❌ Failed to log audit action:', {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          sentData: { actionType, sanitizedCustomerId, customerName }
        });
      } else {
        console.log('✅ Audit log created successfully:', data?.[0]?.id);
      }
    } catch (error) {
      console.error('💥 Audit logging exception:', error);
    }
  }

  static async logCustomerCreated(customer: Customer): Promise<void> {
    await this.logAction('customer_created', customer.id, customer.name);
  }

  static async logCustomerUpdated(customerId: string, customerName: string): Promise<void> {
    await this.logAction('customer_updated', customerId, customerName);
  }

  static async logCustomerDeleted(customer: Customer): Promise<void> {
    await this.logAction('customer_deleted', customer.id, customer.name);
  }

  static async logPointsAdded(customerId: string, customerName: string, amount: number): Promise<void> {
    await this.logAction('points_added', customerId, customerName, amount);
  }

  static async logPointsRedeemed(customerId: string, customerName: string, amount: number): Promise<void> {
    await this.logAction('points_redeemed', customerId, customerName, amount);
  }
}

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

  async checkPhoneExists(phone: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('customers')
        .select('id')
        .eq('phone', phone.trim());

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error checking phone uniqueness:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Failed to check phone uniqueness:', error);
      return false;
    }
  }

  async addCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'points_redeemed' | 'tier'>): Promise<Customer> {
    try {
      // Check for uniqueness manually for better error messages
      const exists = await this.checkPhoneExists(customer.phone);
      if (exists) {
        throw new Error('DUPLICATE_PHONE');
      }

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

      // Log the audit trail
      await AuditLogger.logCustomerCreated(data);
      if (data.points > 0) {
        await AuditLogger.logPointsAdded(data.id, data.name, data.points);
      }

      return data;
    } catch (error) {
      console.error('💥 Failed to add customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    try {
      // If phone is being updated, check for uniqueness
      if (updates.phone) {
        const exists = await this.checkPhoneExists(updates.phone, id);
        if (exists) {
          throw new Error('DUPLICATE_PHONE');
        }
      }

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

      // Log the audit trail
      await AuditLogger.logCustomerUpdated(id, data.name);

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

      // Log points adjustment
      if (amount > 0) {
        await AuditLogger.logPointsAdded(id, data.name, amount);
      } else {
        await AuditLogger.logPointsRedeemed(id, data.name, amount);
      }

      return data;
    } catch (error) {
      console.error('Failed to update points:', error);
      return null;
    }
  }

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      // Get customer data before deletion for audit logging
      const { data: customerToDelete, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !customerToDelete) {
        console.error('Error fetching customer for deletion:', fetchError);
        return false;
      }

      // Log the deletion BEFORE deleting the customer
      // This ensures the customer_id (FK) still exists if the database has strict constraints
      await AuditLogger.logCustomerDeleted(customerToDelete);

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

  // Audit log methods
  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }
  }

  async getCustomerAuditLogs(customerId: string): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customer audit logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch customer audit logs:', error);
      return [];
    }
  }

  async getAuditLogsByAction(actionType: AuditLog['action_type'], limit: number = 50): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action_type', actionType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching audit logs by action:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch audit logs by action:', error);
      return [];
    }
  }
}

export const db = new SupabaseDB();