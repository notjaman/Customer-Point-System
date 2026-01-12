
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';

interface CustomerFormProps {
  customer?: Customer | null;
  onSave: (name: string, phone: string, points: number, id?: string, referralDetails?: { name?: string, phone?: string }) => Promise<void>;
  onClose: () => void;
}

// Malaysian phone number validation
const validateMalaysianPhone = (phone: string): boolean => {
  // Remove all spaces, dashes for validation
  const cleanPhone = phone.replace(/[\s\-]/g, '');

  // Must start with +60 and have the right length
  if (!cleanPhone.startsWith('+60')) {
    return false;
  }

  // Remove +60 prefix for pattern matching
  const numberPart = cleanPhone.substring(3);

  // Malaysian mobile patterns: 1X-XXX XXXX (where first digit after 1 is 0-9)
  // Should be 9-10 digits after +60
  const mobilePattern = /^1[0-9]\d{7,8}$/;

  // Malaysian landline patterns: area code (1-2 digits) + number (7-8 digits)
  const landlinePattern = /^[2-9]\d{7,8}$/;

  return mobilePattern.test(numberPart) || landlinePattern.test(numberPart);
};

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+60 ');
  const [points, setPoints] = useState<string>('');
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Referral state
  const [isReferred, setIsReferred] = useState(false);
  const [referralName, setReferralName] = useState('');
  const [referralPhone, setReferralPhone] = useState('+60 ');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setPoints(customer.points.toString());
    } else {
      // Reset to defaults for new customer
      setName('');
      setPhone('+60 ');
      setPoints('');
    }
  }, [customer]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Always ensure it starts with +60
    if (!value.startsWith('+60')) {
      value = '+60 ' + value.replace(/^\+?60?\s*/, '');
    }

    // Prevent deletion of +60 prefix
    if (value.length < 4) {
      value = '+60 ';
    }

    setPhone(value);

    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
  };

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers
    if (value === '' || /^\d+$/.test(value)) {
      setPoints(value);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);

    // Clear error when user starts typing
    if (nameError) {
      setNameError('');
    }
  };

  const validateName = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError('Full name is required');
      return false;
    }

    if (trimmedName.length < 2) {
      setNameError('Name must be at least 2 characters long');
      return false;
    }

    if (trimmedName.length > 100) {
      setNameError('Name must be less than 100 characters');
      return false;
    }

    // Check for valid name characters (letters, spaces, hyphens, apostrophes)
    const namePattern = /^[a-zA-Z\s\-'\.]+$/;
    if (!namePattern.test(trimmedName)) {
      setNameError('Name can only contain letters, spaces, hyphens, and apostrophes');
      return false;
    }

    setNameError('');
    return true;
  };

  const validatePhone = () => {
    if (!phone.trim() || phone.trim() === '+60') {
      setPhoneError('Phone number is required');
      return false;
    }

    if (!validateMalaysianPhone(phone)) {
      setPhoneError('Please enter a valid Malaysian phone number (e.g., +60 12-345 6789)');
      return false;
    }

    setPhoneError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isNameValid = validateName();
    const isPhoneValid = validatePhone();

    if (!isNameValid || !isPhoneValid) {
      return;
    }

    // Convert points to number, default to 0 if empty
    const pointsValue = points === '' ? 0 : parseInt(points, 10);

    setIsSubmitting(true);
    try {
      const referralDetails = isReferred ? {
        name: referralName.trim() || undefined,
        phone: referralPhone.trim() === '+60' ? undefined : referralPhone.trim()
      } : undefined;

      await onSave(name.trim(), phone, pointsValue, customer?.id, referralDetails);
      onClose();
    } catch (error: any) {
      if (error.message === 'DUPLICATE_PHONE') {
        setPhoneError('This phone number is already registered.');
      } else {
        // For other errors, let the parent handle it or log it
        console.error('Form submission error:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEdit = !!customer;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {isEdit ? 'Customer Details' : 'New Customer'}
            </h3>
            {isEdit && <p className="text-xs text-slate-500 font-medium">ID: {customer.id}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
            <input
              autoFocus={!isEdit}
              required
              type="text"
              value={name}
              onChange={handleNameChange}
              onBlur={validateName}
              className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl focus:ring-2 outline-none transition-all font-medium ${nameError
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              placeholder="e.g. Jane Doe"
            />
            {nameError && (
              <div className="mt-2 flex items-center gap-2 text-red-600">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-medium">{nameError}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
            <input
              required
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              onBlur={validatePhone}
              className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl focus:ring-2 outline-none transition-all font-medium ${phoneError
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              placeholder="+60 12-345 6789"
            />
            {phoneError && (
              <div className="mt-2 flex items-center gap-2 text-red-600">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-medium">{phoneError}</p>
              </div>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Malaysian phone number with +60 country code
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Initial Points</label>
            <div className="relative">
              <input
                type="text"
                value={points}
                onChange={handlePointsChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold text-indigo-600"
                placeholder="0"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                PTS
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Leave empty for 0 points, or enter initial points for existing customer
            </p>
          </div>

          {!isEdit && (
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isReferred}
                    onChange={(e) => setIsReferred(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${isReferred ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isReferred ? 'translate-x-4' : ''}`}></div>
                </div>
                <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
                  Referred by an existing customer?
                </span>
              </label>

              {isReferred && (
                <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Referrer Information (Optional)</p>
                  <div>
                    <input
                      type="text"
                      value={referralName}
                      onChange={(e) => setReferralName(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="Referrer's Full Name"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      value={referralPhone}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (!val.startsWith('+60')) val = '+60 ' + val.replace(/^\+?60?\s*/, '');
                        if (val.length < 4) val = '+60 ';
                        setReferralPhone(val);
                      }}
                      className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="Referrer's Phone (e.g. +60 12...)"
                    />
                  </div>
                  <p className="text-[10px] text-indigo-400 font-medium italic">
                    Referrer will receive 50 bonus points if found.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!nameError || !!phoneError || !name.trim() || phone.trim() === '+60' || isSubmitting}
              className={`flex-1 py-4 font-bold rounded-2xl transition-colors shadow-lg ${nameError || phoneError || !name.trim() || phone.trim() === '+60' || isSubmitting
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-slate-100'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                isEdit ? 'Update Details' : 'Add Customer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
