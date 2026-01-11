
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import CustomerForm from './components/CustomerForm';
import PointsModal from './components/PointsModal';
import Notification, { NotificationType } from './components/Notification';
import ConfirmDialog from './components/ConfirmDialog';
import AuditLogViewer from './components/AuditLogViewer';
import { db, calculateTier, supabase } from './services/supabase';
import { Customer, SortOption, TierFilter } from './types';

type Tab = 'dashboard' | 'customers' | 'audit';

interface NotificationState {
  type: NotificationType;
  title: string;
  message: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [pointsAdjustmentCustomer, setPointsAdjustmentCustomer] = useState<Customer | null>(null);

  // Notification state
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    customer: Customer | null;
  }>({ isOpen: false, customer: null });

  // Sorting and Filtering State
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [tierFilter, setTierFilter] = useState<TierFilter>('All');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const showNotification = (type: NotificationType, title: string, message: string) => {
    setNotification({ type, title, message });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      // Test Supabase connection first
      console.log('Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('customers')
        .select('count', { count: 'exact' });

      if (testError) {
        console.error('Supabase connection test failed:', testError);
        showNotification('error', 'Database Connection Failed', 'Please check your Supabase configuration and ensure the customers table exists.');
        setLoading(false);
        return;
      }

      console.log('Supabase connection successful, customer count:', testData);

      const data = await db.getCustomers();
      setCustomers(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showNotification('error', 'Failed to Load', 'Could not fetch customer data. Please check your database setup.');
      console.error('Error fetching customers:', error);
    }
  };

  const handleSaveCustomer = async (name: string, phone: string, points: number, id?: string) => {
    try {
      if (id) {
        // Update existing customer
        const updated = await db.updateCustomer(id, { name, phone, points });
        if (updated) {
          setCustomers(prev => prev.map(c => c.id === id ? updated : c));
          showNotification('success', 'Customer Updated', `${name}'s details have been updated successfully.`);
        } else {
          throw new Error('Failed to update customer');
        }
      } else {
        // Add new customer
        const newCust = await db.addCustomer({ name, phone, points });
        setCustomers(prev => [newCust, ...prev]);
        showNotification('success', 'Customer Added', `${name} has been added to your loyalty program.`);
      }
      setEditingCustomer(null);
      setIsFormOpen(false);
    } catch (error) {
      showNotification('error', 'Save Failed', 'Could not save customer details. Please try again.');
      console.error('Error saving customer:', error);
    }
  };

  const handleUpdatePoints = async (id: string, amount: number) => {
    try {
      const updated = await db.updatePoints(id, amount);
      if (updated) {
        setCustomers(prev => prev.map(c => c.id === id ? updated : c));
        const action = amount > 0 ? 'added' : 'redeemed';
        const absAmount = Math.abs(amount);
        showNotification('success', 'Points Updated', `${absAmount} points ${action} successfully.`);
      } else {
        throw new Error('Failed to update points');
      }
    } catch (error) {
      showNotification('error', 'Update Failed', 'Could not update points. Please try again.');
      console.error('Error updating points:', error);
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    setDeleteConfirm({ isOpen: true, customer });
  };

  const confirmDeleteCustomer = async () => {
    if (!deleteConfirm.customer) return;

    try {
      const success = await db.deleteCustomer(deleteConfirm.customer.id);
      if (success) {
        setCustomers(prev => prev.filter(c => c.id !== deleteConfirm.customer!.id));
        showNotification('success', 'Customer Deleted', `${deleteConfirm.customer.name} has been removed from your system.`);
      } else {
        throw new Error('Failed to delete customer');
      }
    } catch (error) {
      showNotification('error', 'Delete Failed', 'Could not delete customer. Please try again.');
      console.error('Error deleting customer:', error);
    } finally {
      setDeleteConfirm({ isOpen: false, customer: null });
    }
  };

  const cancelDeleteCustomer = () => {
    setDeleteConfirm({ isOpen: false, customer: null });
  };

  const filteredAndSortedCustomers = useMemo(() => {
    let result = [...customers];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) || c.phone.includes(q)
      );
    }

    if (tierFilter !== 'All') {
      result = result.filter(c => {
        const tier = calculateTier(c.points || 0);
        return tier === tierFilter;
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'points-high': return (b.points || 0) - (a.points || 0);
        case 'points-low': return (a.points || 0) - (b.points || 0);
        case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: return 0;
      }
    });

    return result;
  }, [customers, searchQuery, sortBy, tierFilter]);

  const stats = useMemo(() => {
    const totalPoints = customers.reduce((acc, c) => acc + (c.points || 0), 0);
    const totalRedeemed = customers.reduce((acc, c) => acc + (c.points_redeemed || 0), 0);

    // Debug logging to check data
    console.log('Stats calculation:', {
      totalCustomers: customers.length,
      totalPoints,
      totalRedeemed,
      sampleCustomer: customers[0] ? {
        name: customers[0].name,
        points: customers[0].points,
        points_redeemed: customers[0].points_redeemed
      } : null
    });

    return {
      totalCustomers: customers.length,
      totalPoints,
      totalRedeemed,
    };
  }, [customers]);

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Total Customers</p>
          <h4 className="text-3xl font-bold text-slate-800 mt-2">{stats.totalCustomers}</h4>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Total Points Issued</p>
          <h4 className="text-3xl font-bold text-slate-800 mt-2">{stats.totalPoints.toLocaleString()}</h4>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Total Points Redeemed</p>
          <h4 className="text-3xl font-bold text-slate-800 mt-2">{stats.totalRedeemed.toLocaleString()}</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-w-0">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top Members</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...customers].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 6).map((c, i) => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-400' : 'bg-indigo-400'
                    }`}>
                    {i + 1}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-800 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.phone}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-indigo-600">{(c.points || 0).toLocaleString()}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAuditLog = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4">System Activity Log</h2>
        <p className="text-slate-600 text-sm mb-6">
          Track all admin actions including customer management, points adjustments, and system changes.
        </p>
        <AuditLogViewer limit={100} />
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <button
          onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }}
          className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Add Customer
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Tiers:</span>
          {(['All', 'standard', 'gold', 'platinum'] as TierFilter[]).map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${tierFilter === tier
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
            >
              {tier === 'All' ? 'All' : tier.charAt(0).toUpperCase() + tier.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="points-high">Points: High to Low</option>
            <option value="points-low">Points: Low to High</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Phone</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-indigo-600">Current Pts</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-rose-500">Redeemed</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Tier Status</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group cursor-pointer">
                  <td className="px-6 py-4" onClick={() => { setEditingCustomer(c); setIsFormOpen(true); }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg shadow-sm">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">View Profile</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{c.phone}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-indigo-600 text-lg">{(c.points || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-rose-500 text-lg">
                      {(c.points_redeemed || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${calculateTier(c.points || 0) === 'platinum' ? 'bg-indigo-100 text-indigo-700' :
                      calculateTier(c.points || 0) === 'gold' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                      {(c.tier || calculateTier(c.points || 0)).charAt(0).toUpperCase() + (c.tier || calculateTier(c.points || 0)).slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPointsAdjustmentCustomer(c); }}
                        className="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md"
                      >
                        Point Adjust
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(c); }}
                        className="px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all shadow-md"
                        title="Delete Customer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAndSortedCustomers.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <p className="text-xl font-bold text-slate-400">No results found</p>
            <p className="text-sm text-slate-400">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold text-sm tracking-widest uppercase animate-pulse">Synchronizing Data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'customers' && renderCustomers()}
          {activeTab === 'audit' && renderAuditLog()}
        </>
      )}

      {(isFormOpen || editingCustomer) && (
        <CustomerForm
          customer={editingCustomer}
          onClose={() => { setIsFormOpen(false); setEditingCustomer(null); }}
          onSave={handleSaveCustomer}
        />
      )}

      {pointsAdjustmentCustomer && (
        <PointsModal
          customer={pointsAdjustmentCustomer}
          onClose={() => {
            setPointsAdjustmentCustomer(null);
            setActiveTab('customers');
          }}
          onUpdate={handleUpdatePoints}
        />
      )}

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Customer"
        message={`Are you sure you want to delete ${deleteConfirm.customer?.name}? This action cannot be undone and will permanently remove all their data including points history.`}
        confirmText="Delete Customer"
        cancelText="Keep Customer"
        onConfirm={confirmDeleteCustomer}
        onCancel={cancelDeleteCustomer}
        type="danger"
      />
    </Layout>
  );
};

export default App;
