
import React, { useState } from 'react';
import { Customer } from '../types';

interface PointsModalProps {
  customer: Customer;
  onUpdate: (id: string, amount: number) => void;
  onClose: () => void;
}

const PointsModal: React.FC<PointsModalProps> = ({ customer, onUpdate, onClose }) => {
  const [amount, setAmount] = useState<number>(0);
  const [type, setType] = useState<'add' | 'subtract'>('add');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = type === 'add' ? amount : -amount;
    onUpdate(customer.id, finalAmount);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Update Points</h3>
            <p className="text-slate-500 text-sm font-medium mt-1">{customer.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('add')}
              className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${
                type === 'add' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Add Earned
            </button>
            <button
              type="button"
              onClick={() => setType('subtract')}
              className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${
                type === 'subtract' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Redeem
            </button>
          </div>
          
          <div className="text-center">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Amount to {type === 'add' ? 'Issue' : 'Spend'}</label>
            <div className="relative inline-block w-full">
              <input
                autoFocus
                required
                type="number"
                min="1"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full text-5xl font-black text-center px-4 py-6 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-3xl outline-none transition-all placeholder-slate-200"
                placeholder="000"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 pointer-events-none tracking-widest uppercase">Points</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-3">
              Customer Balance: <span className="text-indigo-600">{customer.points.toLocaleString()}</span> → 
              <span className={type === 'add' ? 'text-indigo-600' : 'text-rose-600'}>
                {' '}{(type === 'add' ? customer.points + amount : customer.points - amount).toLocaleString()}
              </span>
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-5 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-[0.98] ${
                type === 'add' 
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' 
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
              }`}
            >
              Confirm Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PointsModal;
