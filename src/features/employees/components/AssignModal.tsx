"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, ChevronRight, ChevronsRight, ChevronLeft, ChevronsLeft, Users2, Building2 } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  initials: string;
}

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisorName: string;
  supervisorDept: string;
  onSave: (count: number) => void;
}

// ─── Expanded Mock Data ────────────────────────────────────────────────────────
const MOCK_POOL: Employee[] = [
  { id: '101', name: 'Noah Oliver', jobTitle: 'HR Specialist', department: 'Human Resources', initials: 'NO' },
  { id: '102', name: 'Olivia Parker', jobTitle: 'Recruiter', department: 'Human Resources', initials: 'OP' },
  { id: '103', name: 'Peter Quinn', jobTitle: 'HR Coordinator', department: 'Human Resources', initials: 'PQ' },
  { id: '104', name: 'Quinn Roberts', jobTitle: 'Sales Executive', department: 'Sales', initials: 'QR' },
  { id: '105', name: 'Ruby Smith', jobTitle: 'Account Manager', department: 'Sales', initials: 'RS' },
  { id: '106', name: 'Samuel Taylor', jobTitle: 'Sales Associate', department: 'Sales', initials: 'ST' },
  { id: '107', name: 'Thomas Underwood', jobTitle: 'Frontend Developer', department: 'Engineering', initials: 'TU' },
  { id: '108', name: 'Ursula Vance', jobTitle: 'Backend Developer', department: 'Engineering', initials: 'UV' },
  { id: '109', name: 'Victor Williams', jobTitle: 'Product Designer', department: 'Marketing', initials: 'VW' },
  { id: '110', name: 'Wendy Xander', jobTitle: 'Marketing Specialist', department: 'Marketing', initials: 'WX' },
  { id: '111', name: 'Xavier Young', jobTitle: 'Operations Analyst', department: 'Operations', initials: 'XY' },
  { id: '112', name: 'Yara Zane', jobTitle: 'IT Specialist', department: 'IT', initials: 'YZ' },
];

const DEPARTMENTS = ['All', 'Sales', 'Marketing', 'Human Resources', 'Operations', 'IT'];

// ─── Shared Shared Styles ──────────────────────────────────────────────────────
const BTN_CONTROL = 'flex items-center justify-center w-10 h-10 rounded-lg shadow-md transition-all active:scale-90';
const BTN_CANCEL_STYLE = { background: 'rgba(215.16, 211.02, 211.02, 0.3)' } as React.CSSProperties;

export function AssignModal({ isOpen, onClose, supervisorName, supervisorDept, onSave }: AssignModalProps) {
  const [available, setAvailable] = useState<Employee[]>([]);
  const [assigned, setAssigned] = useState<Employee[]>([]);
  const [selectedAvailable, setSelectedAvailable] = useState<Set<string>>(new Set());
  const [selectedAssigned, setSelectedAssigned] = useState<Set<string>>(new Set());
  const [availSearch, setAvailSearch] = useState('');
  const [assignSearch, setAssignSearch] = useState('');
  const [activeDept, setActiveDept] = useState('All');

  // Initialize pool logic
  useEffect(() => {
    if (isOpen) {
      setAvailable(MOCK_POOL);
      setAssigned([]);
      setSelectedAvailable(new Set());
      setSelectedAssigned(new Set());
      setAvailSearch('');
      setAssignSearch('');
      setActiveDept('All');
    }
  }, [isOpen]);

  // Filtering
  const filteredAvailable = useMemo(() => {
    return available.filter(emp => {
      const matchSearch = emp.name.toLowerCase().includes(availSearch.toLowerCase());
      const matchDept = activeDept === 'All' || emp.department === activeDept;
      return matchSearch && matchDept;
    });
  }, [available, availSearch, activeDept]);

  const filteredAssigned = useMemo(() => {
    return assigned.filter(emp => emp.name.toLowerCase().includes(assignSearch.toLowerCase()));
  }, [assigned, assignSearch]);

  // Helper to move specific IDs from one list to another
  const moveEmployees = (ids: Set<string>, from: 'available' | 'assigned') => {
    if (ids.size === 0) return;
    
    if (from === 'available') {
      const toMove = available.filter(emp => ids.has(emp.id));
      setAssigned(prev => [...prev, ...toMove]);
      setAvailable(prev => prev.filter(emp => !ids.has(emp.id)));
      setSelectedAvailable(new Set());
    } else {
      const toMove = assigned.filter(emp => ids.has(emp.id));
      setAvailable(prev => [...prev, ...toMove]);
      setAssigned(prev => prev.filter(emp => !ids.has(emp.id)));
      setSelectedAssigned(new Set());
    }
  };

  // Transfer Handlers
  const moveSelectedRight = () => moveEmployees(selectedAvailable, 'available');
  const moveAllRight = () => moveEmployees(new Set(available.map(e => e.id)), 'available');
  const moveSelectedLeft = () => moveEmployees(selectedAssigned, 'assigned');
  const moveAllLeft = () => moveEmployees(new Set(assigned.map(e => e.id)), 'assigned');

  const toggleSelection = (id: string, set: Set<string>, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string, source: 'available' | 'assigned') => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, source }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, target: 'available' | 'assigned') => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.source !== target) {
        moveEmployees(new Set([data.id]), data.source);
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div 
          className="relative flex flex-col w-full max-w-[1152px] h-[640px] rounded-[16px] bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in-95 duration-300"
          onClick={e => e.stopPropagation()}
        >
          {/* Header with Gradient */}
          <div 
            className="flex items-center justify-between px-8 py-6 rounded-t-[16px] text-white shrink-0"
            style={{ background: 'linear-gradient(90deg, rgba(43, 127, 255, 0.9) 0%, rgba(0, 201, 80, 0.9) 100%)' }}
          >
            <div>
              <h2 className="text-[28px] font-bold tracking-tight">Assign Employees</h2>
              <div className="flex items-center gap-4 mt-1 opacity-90">
                <div className="flex items-center gap-1.5 text-[14px]">
                  <Users2 size={16} /> {supervisorName}
                </div>
                <div className="flex items-center gap-1.5 text-[14px]">
                  <Building2 size={16} /> {supervisorDept}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden px-8 pt-6 pb-4">
            
            {/* Filter Section */}
            <div className="mb-6">
              <p className="text-[13px] font-bold text-[#4A5565] uppercase tracking-wider mb-3">Filter by Department</p>
              <div className="flex flex-wrap gap-2">
                {DEPARTMENTS.map(dept => (
                  <button
                    key={dept}
                    onClick={() => setActiveDept(dept)}
                    className={`px-5 py-2 rounded-full text-[14px] font-semibold transition-all shadow-sm ${
                      activeDept === dept 
                      ? 'bg-gradient-to-r from-[#155DFC] to-[#01c951] text-white shadow-md scale-105' 
                      : 'bg-gray-50 text-[#4A5565] hover:bg-gray-100'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content: 3-Column Layout */}
            <div className="flex-1 flex gap-6 overflow-hidden">
              
              {/* Column 1: Available */}
              <div 
                className="flex-1 flex flex-col overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'available')}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-[15px] font-bold text-[#1E2939]">Available Employees ({filteredAvailable.length})</h3>
                </div>
                <div className="flex-1 flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-3 bg-white/50 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="search" 
                        placeholder="Search employees..."
                        value={availSearch}
                        onChange={e => setAvailSearch(e.target.value)}
                        className="w-full h-9 pl-9 pr-4 bg-white border border-gray-100 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#155DFC]/10 transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredAvailable.map(emp => (
                      <div 
                        key={emp.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, emp.id, 'available')}
                        onClick={() => toggleSelection(emp.id, selectedAvailable, setSelectedAvailable)}
                        className={`group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                          selectedAvailable.has(emp.id)
                          ? 'bg-[#E8F1FF] border-[#155DFC]/30 ring-1 ring-[#155DFC]/10'
                          : 'bg-white border-transparent hover:border-gray-200'
                        }`}
                      >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#155DFC]/80 to-[#01c951]/80 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                          {emp.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-[#1E2939] truncate">{emp.name}</p>
                          <p className="text-[12px] font-medium text-gray-400 truncate">{emp.jobTitle}</p>
                        </div>
                        {selectedAvailable.has(emp.id) && (
                          <div className="h-5 w-5 rounded-full bg-[#155DFC] flex items-center justify-center text-white">
                            <ChevronRight size={14} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredAvailable.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                        <Users2 size={40} className="mb-2 opacity-20" />
                        <p className="text-[14px] font-medium">No available employees</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Column 2: Controls */}
              <div className="flex flex-col justify-center gap-4 px-1">
                <button 
                  onClick={moveAllRight}
                  className={`${BTN_CONTROL} bg-gradient-to-br from-[#155DFC] to-[#01c951] text-white`}
                >
                  <ChevronsRight size={20} />
                </button>
                <button 
                  onClick={moveSelectedRight}
                  className={`${BTN_CONTROL} bg-[#155DFC] text-white ${selectedAvailable.size === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  disabled={selectedAvailable.size === 0}
                >
                  <ChevronRight size={20} />
                </button>
                <button 
                  onClick={moveSelectedLeft}
                  className={`${BTN_CONTROL} bg-[#E8E8E8] text-[#4A5565] ${selectedAssigned.size === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  disabled={selectedAssigned.size === 0}
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={moveAllLeft}
                  className={`${BTN_CONTROL} bg-[#E8E8E8] text-[#4A5565]`}
                >
                  <ChevronsLeft size={20} />
                </button>
              </div>

              {/* Column 3: Assigned */}
              <div 
                className="flex-1 flex flex-col overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'assigned')}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-[15px] font-bold text-[#1E2939]">Assigned Employees ({assigned.length})</h3>
                </div>
                <div className="flex-1 flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-3 bg-white/50 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="search" 
                        placeholder="Search employees..."
                        value={assignSearch}
                        onChange={e => setAssignSearch(e.target.value)}
                        className="w-full h-9 pl-9 pr-4 bg-white border border-gray-100 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#155DFC]/10 transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredAssigned.map(emp => (
                      <div 
                        key={emp.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, emp.id, 'assigned')}
                        onClick={() => toggleSelection(emp.id, selectedAssigned, setSelectedAssigned)}
                        className={`group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                          selectedAssigned.has(emp.id)
                          ? 'bg-[#E8F1FF] border-[#155DFC]/30 ring-1 ring-[#155DFC]/10'
                          : 'bg-white border-transparent hover:border-gray-200'
                        }`}
                      >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#155DFC]/80 to-[#01c951]/80 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                          {emp.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-[#1E2939] truncate">{emp.name}</p>
                          <p className="text-[12px] font-medium text-gray-400 truncate">{emp.jobTitle}</p>
                        </div>
                      </div>
                    ))}
                    {assigned.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                        <p className="text-[14px] font-medium opacity-60">No assigned employees</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Area */}
          <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-50 shrink-0">
            <button
              onClick={onClose}
              className="h-11 px-8 rounded-xl text-[15px] font-bold text-[#4A5565] transition-all hover:bg-gray-50"
              style={BTN_CANCEL_STYLE}
            >
              Cancel
            </button>
            <button
              onClick={() => { onSave(assigned.length); onClose(); }}
              className="h-11 px-8 rounded-xl text-[15px] font-bold text-white bg-gradient-to-r from-[#155DFC] to-[#01c951] shadow-lg shadow-[#155DFC]/20 hover:shadow-[#155DFC]/40 transition-all hover:scale-[1.02]"
            >
              Save Assignments
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
