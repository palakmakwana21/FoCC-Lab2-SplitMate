import React, { useState } from 'react';
import { api } from '../api/client';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (group: any) => void;
  users: any[];
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  users
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Trip');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['usr_alex']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { label: 'Trip 🌴', value: 'Trip' },
    { label: 'Living / Home 🏠', value: 'Living' },
    { label: 'Social / Outing ☕', value: 'Social' },
    { label: 'Event / Party 🎓', value: 'Event' },
    { label: 'Project / Work 💼', value: 'Project' }
  ];

  const toggleMember = (id: string) => {
    if (id === 'usr_alex') return; // current user always included
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== id));
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a group name.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await api.createGroup({
        name: name.trim(),
        category,
        description: description.trim(),
        memberIds: selectedMembers
      });
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-[#003b1b]/40 backdrop-blur-[6px]" onClick={onClose} />
      <div className="relative w-full max-w-[560px] bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[24px] modal-forest-shadow flex flex-col z-10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E1E3D5] flex items-center justify-between bg-[#FAF9F0]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-container border border-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl font-bold">group_add</span>
            </div>
            <div>
              <h2 className="text-[18px] font-headline text-primary font-bold">Create a Group</h2>
              <p className="text-[12px] text-on-surface-variant">Add roommates, trip buddies, or friends.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#E1E3D5] flex items-center justify-center text-outline hover:text-primary"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-error-container text-error text-[13px] font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[12px] font-label font-bold text-on-surface-variant mb-1">
              Group Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Manali Roadtrip, Apartment 302"
              className="w-full h-11 px-3.5 bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[14px] text-[14px] text-on-surface focus:border-primary-container focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-label font-bold text-on-surface-variant mb-1">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`p-2 rounded-xl text-[12px] font-label font-semibold border transition-all text-left ${
                    category === c.value
                      ? 'bg-secondary-container border-primary-container text-primary font-bold shadow-xs'
                      : 'border-[#E1E3D5] text-on-surface-variant hover:bg-[#FAF9F0]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-label font-bold text-on-surface-variant mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group for?"
              className="w-full h-11 px-3.5 bg-surface-container-lowest border-[1.5px] border-[#E1E3D5] rounded-[14px] text-[13px] text-on-surface focus:border-primary-container focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-label font-bold text-on-surface-variant mb-2">
              Select Members ({selectedMembers.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-[#FAF9F0] rounded-xl border border-[#E1E3D5]">
              {users.map((u) => {
                const isSelected = selectedMembers.includes(u.id);
                const isCurrent = u.id === 'usr_alex';
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleMember(u.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-surface-container-lowest border border-[#E1E3D5]' : 'hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isCurrent}
                        readOnly
                        className="w-4 h-4 rounded text-primary-container"
                      />
                      <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center font-bold text-[11px] text-primary">
                        {u.initials || u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[13px] font-medium text-primary">
                        {u.name} {isCurrent ? '(You)' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E1E3D5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E1E3D5] text-[13px] font-bold text-primary hover:bg-[#FAF9F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="primary-button px-5 py-2 rounded-xl text-[13px] font-bold shadow-sm"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
