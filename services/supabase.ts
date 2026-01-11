
/**
 * Note: In a production environment, these would be process.env.SUPABASE_URL
 * and process.env.SUPABASE_ANON_KEY.
 * For this implementation, we will mock the database interactions to ensure 
 * the app is fully functional out-of-the-box, but the structure is ready 
 * for a real Supabase client.
 */

import { Customer, Transaction } from '../types';

// Mock Storage to ensure the app works immediately
class MockDB {
  private customers: Customer[] = [
    { id: '1', name: 'Alice Johnson', phone: '555-0101', points: 1250, points_redeemed: 500, created_at: new Date().toISOString() },
    { id: '2', name: 'Bob Smith', phone: '555-0102', points: 450, points_redeemed: 150, created_at: new Date().toISOString() },
    { id: '3', name: 'Charlie Davis', phone: '555-0103', points: 8900, points_redeemed: 4200, created_at: new Date().toISOString() },
    { id: '4', name: 'Diana Prince', phone: '555-0104', points: 300, points_redeemed: 0, created_at: new Date().toISOString() },
  ];

  async getCustomers(): Promise<Customer[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.customers]), 500);
    });
  }

  async addCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'points_redeemed'>): Promise<Customer> {
    const newCustomer: Customer = {
      ...customer,
      id: Math.random().toString(36).substr(2, 9),
      points_redeemed: 0,
      created_at: new Date().toISOString(),
    };
    this.customers.push(newCustomer);
    return newCustomer;
  }

  async updatePoints(id: string, amount: number): Promise<Customer | null> {
    const index = this.customers.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    // Update current balance
    this.customers[index].points += amount;
    
    // If it's a negative amount (redemption), track it in points_redeemed
    if (amount < 0) {
      this.customers[index].points_redeemed += Math.abs(amount);
    }
    
    return this.customers[index];
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const q = query.toLowerCase();
    return this.customers.filter(c => 
      c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }
}

export const db = new MockDB();
