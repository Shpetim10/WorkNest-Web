"use client";

import React, { useState } from 'react';
import { Card, PageHeaderDecorativeCircles, TablePagination } from '@/common/ui';
import { Search, UserPlus2, Building2, Users2, Plus, ChevronDown } from 'lucide-react';
import { AssignModal } from './AssignModal';
import { useStaff } from '../api/get-staff';

interface Supervisor {
  id: string;
  supervisorRoleAssignmentId: string;
  name: string;
  jobTitle: string;
  department: string;
  departmentId: string;
  assignedCount: number;
  initials: string;
  assignedEmployees: Array<{ id: string; name: string; jobTitle: string; email: string }>;
}

const TABLE_HEADERS = ['Name', 'Job Title', 'Department', 'Assigned Employees', 'Action'];

export function AssignEmployeesView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSupervisor, setActiveSupervisor] = useState<Supervisor | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [date, setDate] = useState('2026-05-01');
  const [status, setStatus] = useState('All statuses');
  const [department, setDepartment] = useState('All departments');
  const { data: staffResponse } = useStaff({
    page: currentPage,
    size: pageSize,
  });

  const supervisors: Supervisor[] = React.useMemo(() => {
    const rawData = staffResponse?.data.items || [];

    return rawData.map(staff => ({
      id: staff.id,
      supervisorRoleAssignmentId: staff.roleAssignmentId || '',
      name: `${staff.firstName} ${staff.lastName}`,
      jobTitle: staff.jobTitle || 'N/A',
      department: staff.departmentName || 'N/A',
      departmentId: staff.departmentId || '',
      assignedCount: staff.assignedEmployeesCount || 0,
      initials: `${staff.firstName?.charAt(0) || ''}${staff.lastName?.charAt(0) || ''}`.toUpperCase(),
      assignedEmployees: (staff.assignedEmployees || []).map(e => ({
        id: e.employeeId || e.userId,
        name: [e.firstName, e.lastName].filter(Boolean).join(' ') || e.email,
        jobTitle: e.jobTitle || '',
        email: e.email || '',
      })),
    }));
  }, [staffResponse]);

  const filteredSupervisors = supervisors.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, staffResponse?.data.totalPages ?? 1);
  const totalItems = staffResponse?.data.totalItems ?? filteredSupervisors.length;
  // Use pageSize from state

  const handleUpdateAssignment = (_newCount: number) => {
    setActiveSupervisor(null);
  };

  return (
    <div className="flex flex-col gap-6 -mx-2 lg:-mx-4">
      {/* ── Page Header Card ───────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden px-8 py-8 flex items-center justify-between"
        style={{
          background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)',
          minHeight: 120,
          boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
        }}
      >
        <PageHeaderDecorativeCircles />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <UserPlus2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Assign Employees</h1>
            <p className="text-white/80 text-sm mt-0.5">
              Manage employee assignments to supervisors
            </p>
          </div>
        </div>
      </div>

      {/* ── Search / Filter Bar ────────────────────────────────────────── */}
      <div 
        className="bg-white rounded-xl border border-gray-100 px-4 py-1.5 flex flex-wrap gap-3 items-center min-h-[48px]"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
      >
        <div className="relative w-full max-w-[340px] md:max-w-[420px] lg:max-w-[500px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employee locally..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-8 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 px-3 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
          />

          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="appearance-none h-8 pl-3 pr-8 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
            >
              <option>All statuses</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="appearance-none h-8 pl-3 pr-8 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
            >
              <option>All departments</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <button
            onClick={() => {}}
            className="h-8 px-6 bg-[#2B7FFF] text-white text-[13px] font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            Apply
          </button>
        </div>
      </div>

      <div 
        className="bg-white rounded-2xl border border-[#2B7FFF] overflow-hidden mt-2"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr 
                className="text-xs font-semibold text-white uppercase tracking-wide"
                style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}
              >
                {TABLE_HEADERS.map(header => (
                  <th
                    key={header}
                    className="px-4 py-3.5 text-left font-semibold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredSupervisors.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-16 text-center">
                    <p className="text-[14px] font-medium text-gray-400">No supervisors found</p>
                  </td>
                </tr>
              ) : (
                filteredSupervisors.map((supervisor, index) => (
                  <tr 
                    key={supervisor.id} 
                    className={`border-b border-[#E5E7EB] group transition-colors hover:bg-blue-50/30 ${
                      index % 2 === 1 ? 'bg-gray-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div 
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white shadow-sm"
                          style={{ background: 'linear-gradient(135deg, #2B7FFF 0%, #00BBA7 100%)' }}
                        >
                          {supervisor.initials}
                        </div>
                        <span className="text-[15px] font-medium text-gray-800">{supervisor.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600">
                      {supervisor.jobTitle}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 size={14} className="text-gray-400" strokeWidth={1.5} />
                        <span>{supervisor.department}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#E8F1FF] px-3 py-1 text-[#2B7FFF] font-bold">
                        <Users2 size={14} strokeWidth={2.2} />
                        {supervisor.assignedCount}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setActiveSupervisor(supervisor)}
                        className="h-8 px-4 text-white text-[13px] font-semibold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #2B7FFF 0%, #00BBA7 100%)' }}
                      >
                        Assign Employees
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
        totalItems={totalItems}
      />

      {activeSupervisor && (
        <AssignModal
          isOpen={!!activeSupervisor}
          onClose={() => setActiveSupervisor(null)}
          supervisorName={activeSupervisor.name}
          supervisorDept={activeSupervisor.department}
          supervisorRoleAssignmentId={activeSupervisor.supervisorRoleAssignmentId}
          onSave={handleUpdateAssignment}
        />
      )}
    </div>
  );
}
