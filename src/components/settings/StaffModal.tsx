import React, { useState, useEffect } from 'react';
import { X, Users, Shield, Phone, KeyRound, Check } from 'lucide-react';
import { Employee, UserRole } from '../../types';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmployee?: Employee | null;
  onSave: (employee: Employee) => void;
}

const ROLES: UserRole[] = ['Owner', 'Admin', 'Manager', 'Staff'];

const PERMISSION_LABELS: {
  key: keyof Employee['permissions'];
  label: string;
  desc: string;
}[] = [
  {
    key: 'canManageProducts',
    label: 'Manage Products',
    desc: 'Add, edit, or disable snacks & drinks',
  },
  {
    key: 'canAdjustStock',
    label: 'Adjust Stock',
    desc: 'Record damaged, expired, or manual stock edits',
  },
  {
    key: 'canCreateDue',
    label: 'Create Customer Dues',
    desc: 'Allow partial payment or unpaid due checkout',
  },
  {
    key: 'canSettleDues',
    label: 'Collect Due Repayments',
    desc: 'Receive customer due payments',
  },
  {
    key: 'canGiveDiscount',
    label: 'Approve Discounts',
    desc: 'Apply discounts during booking or checkout',
  },
  {
    key: 'canViewAccounting',
    label: 'View Accounts & Reports',
    desc: 'Access cash register, expenses & profit reports',
  },
];

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  initialEmployee,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Staff');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('1111');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [permissions, setPermissions] = useState<Employee['permissions']>({
    canAdjustStock: false,
    canCreateDue: true,
    canGiveDiscount: false,
    canManageProducts: false,
    canViewAccounting: false,
    canSettleDues: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialEmployee) {
        setName(initialEmployee.name);
        setRole(initialEmployee.role);
        setPhone(initialEmployee.phone);
        setPin(initialEmployee.pin);
        setStatus(initialEmployee.status);
        setPermissions(initialEmployee.permissions);
      } else {
        setName('');
        setRole('Staff');
        setPhone('');
        setPin(String(Math.floor(1000 + Math.random() * 9000)));
        setStatus('active');
        setPermissions({
          canAdjustStock: false,
          canCreateDue: true,
          canGiveDiscount: false,
          canManageProducts: false,
          canViewAccounting: false,
          canSettleDues: true,
        });
      }
    }
  }, [initialEmployee, isOpen]);

  if (!isOpen) return null;

  const applyRoleDefaults = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'Owner' || selectedRole === 'Admin') {
      setPermissions({
        canAdjustStock: true,
        canCreateDue: true,
        canGiveDiscount: true,
        canManageProducts: true,
        canViewAccounting: true,
        canSettleDues: true,
      });
    } else if (selectedRole === 'Manager') {
      setPermissions({
        canAdjustStock: true,
        canCreateDue: true,
        canGiveDiscount: true,
        canManageProducts: true,
        canViewAccounting: false,
        canSettleDues: true,
      });
    } else {
      setPermissions({
        canAdjustStock: false,
        canCreateDue: true,
        canGiveDiscount: false,
        canManageProducts: false,
        canViewAccounting: false,
        canSettleDues: true,
      });
    }
  };

  const togglePermission = (key: keyof Employee['permissions']) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter full name.');
      return;
    }

    const employee: Employee = {
      id: initialEmployee?.id || `emp-${Date.now()}`,
      name: name.trim(),
      role,
      phone: phone.trim(),
      pin: pin.trim() || '1234',
      status,
      permissions,
    };

    onSave(employee);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialEmployee
                  ? `Edit ${initialEmployee.role === 'Owner' ? 'Owner' : 'Staff'} — ${initialEmployee.name}`
                  : 'Add New Staff Member'}
              </h2>
              <p className="text-xs text-slate-400">
                Configure details, role, PIN &amp; POS permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Arif Ahmed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Role *</label>
              <select
                value={role}
                onChange={(e) => applyRoleDefaults(e.target.value as UserRole)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  placeholder="017..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                4-Digit POS PIN
              </label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="1234"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Permissions &amp; Access Controls
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PERMISSION_LABELS.map((perm) => {
                const checked = permissions[perm.key];
                return (
                  <label
                    key={perm.key}
                    className={`cursor-pointer p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition ${
                      checked
                        ? 'bg-purple-500/10 border-purple-500/40'
                        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(perm.key)}
                      className="mt-0.5 rounded accent-purple-500"
                    />
                    <div>
                      <span className="font-bold text-white block">{perm.label}</span>
                      <span className="text-[10px] text-slate-400">{perm.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-purple-500 hover:bg-purple-400 rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              {initialEmployee ? 'Save Changes' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
