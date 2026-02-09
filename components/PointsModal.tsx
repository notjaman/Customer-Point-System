
import React, { useState } from 'react';
import { Customer, POINTS_PER_REDEMPTION, convertPointsToRM, formatRM, isValidRedemption } from '../types';

interface PointsModalProps {
  customer: Customer;
  onUpdate: (id: string, amount: number) => void;
  onClose: () => void;
}

const PointsModal: React.FC<PointsModalProps> = ({ customer, onUpdate, onClose }) => {
  const [amount, setAmount] = useState<number>(0);
  const [type, setType] = useState<'add' | 'subtract'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    // Validate redemption
    if (type === 'subtract') {
      if (!isValidRedemption(amount)) {
        setError(`Redemption must be in multiples of ${POINTS_PER_REDEMPTION} points`);
        return;
      }
      if (customer.points < amount) {
        setError(`Insufficient points. Available: ${customer.points} pts`);
        return;
      }
    }

    setIsSubmitting(true);
    setError('');
    try {
      const finalAmount = type === 'add' ? amount : -amount;
      await onUpdate(customer.id, finalAmount);
      onClose();
    } catch (error) {
      console.error('Points update error:', error);
      setError('Failed to update points. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickRedeem = (points: number) => {
    setType('subtract');
    setAmount(points);
    setError('');
  };

  const handleAmountChange = (value: number) => {
    setAmount(value);
    setError('');
  };

  const rmValue = type === 'subtract' ? convertPointsToRM(amount) : 0;
  const newBalance = type === 'add' ? (customer.points || 0) + amount : (customer.points || 0) - amount;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Update Points</h3>
            <p className="text-slate-500 text-sm font-medium mt-1">{customer.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => { setType('add'); setError(''); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${type === 'add' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Add Earned
            </button>
            <button
              type="button"
              onClick={() => { setType('subtract'); setError(''); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${type === 'subtract' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Redeem
            </button>
          </div>

          {/* Quick Redemption Buttons */}
          {type === 'subtract' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-3">Quick Redeem</p>
              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 1500].map((points) => (
                  <button
                    key={points}
                    type="button"
                    onClick={() => handleQuickRedeem(points)}
                    disabled={customer.points < points}
                    className={`py-3 px-2 rounded-xl text-xs font-bold transition-all ${customer.points >= points
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                  >
                    {points} pts
                    <div className="text-[10px] font-black mt-0.5">{formatRM(convertPointsToRM(points))}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Amount to {type === 'add' ? 'Issue' : 'Redeem'}</label>
            <div className="relative inline-block w-full">
              <input
                autoFocus
                required
                type="number"
                min={type === 'subtract' ? POINTS_PER_REDEMPTION : 1}
                step={type === 'subtract' ? POINTS_PER_REDEMPTION : 1}
                value={amount || ''}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                className="w-full text-5xl font-black text-center px-4 py-6 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-3xl outline-none transition-all placeholder-slate-200"
                placeholder="000"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 pointer-events-none tracking-widest uppercase">Points</span>
            </div>

            {/* RM Conversion Display */}
            {type === 'subtract' && amount > 0 && (
              <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <p className="text-xs font-bold text-green-700">Discount Value</p>
                <p className="text-2xl font-black text-green-600">{formatRM(rmValue)}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
                <p className="text-xs font-bold text-red-600">{error}</p>
              </div>
            )}

            {/* Balance Preview */}
            <p className="text-[10px] text-slate-400 font-bold mt-3">
              Customer Balance: <span className="text-indigo-600">{(customer.points || 0).toLocaleString()}</span> →
              <span className={type === 'add' ? 'text-indigo-600' : 'text-rose-600'}>
                {' '}{newBalance.toLocaleString()}
              </span>
              {type === 'subtract' && amount > 0 && (
                <span className="block mt-1 text-amber-600">
                  {isValidRedemption(amount) ? '✓ Valid redemption' : '⚠ Must be multiples of 500'}
                </span>
              )}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={amount <= 0 || isSubmitting || (type === 'subtract' && (!isValidRedemption(amount) || customer.points < amount))}
              className={`w-full py-5 font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-[0.98] ${amount <= 0 || isSubmitting || (type === 'subtract' && (!isValidRedemption(amount) || customer.points < amount))
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : type === 'add'
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 text-white'
                }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                'Confirm Transaction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PointsModal;
