"use client";

import React, { useState, useEffect } from 'react';
import { Card, TablePagination } from '@/common/ui';
import { Search, UserPlus2, Building2, Users2 } from 'lucide-react';
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
const ITEMS_PER_PAGE = 10;

export function AssignEmployeesView() {
  const { data: staffResponse } = useStaff();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSupervisor, setActiveSupervisor] = useState<Supervisor | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const supervisors: Supervisor[] = React.useMemo(() => {
    if (!staffResponse?.data) return [];

    return staffResponse.data.map(staff => ({
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredSupervisors = supervisors.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSupervisors.length / ITEMS_PER_PAGE);
  const paginatedSupervisors = filteredSupervisors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleUpdateAssignment = (_newCount: number) => {
    setActiveSupervisor(null);
  };

  return (
    <div className="animate-in slide-in-from-bottom-2 w-full space-y-8 duration-500 fade-in pb-10">
      <div
        className="relative flex items-center justify-between overflow-hidden rounded-[24px] p-8 text-white shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]"
        style={{ background: 'linear-gradient(90deg, rgba(43, 127, 255, 0.90) 50%, rgba(0, 201, 80, 0.90) 100%)' }}
      >
        <div className="space-y-2 z-10">
          <h1 className="font-[Inter,sans-serif] text-[30px] font-bold leading-[36px]" style={{ letterSpacing: '-0.02em' }}>
            Assign Employees
          </h1>
          <p className="font-[Inter,sans-serif] text-[16px] font-normal leading-[24px] text-white/90">
            Manage employee assignments to supervisors
          </p>
        </div>

        <div className="z-10 flex h-[88px] w-[87px] items-center justify-center rounded-[16px] bg-white/20 backdrop-blur-sm">
          <UserPlus2 size={42} strokeWidth={1.5} className="text-white" />
        </div>
      </div>

      <Card className="rounded-[24px] border-0 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={18} strokeWidth={2} />
          </div>
          <input
            type="text"
            placeholder="Search by name, job title, or department..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 pr-4 text-[13.5px] font-medium text-gray-700 transition-all placeholder:text-gray-400 focus:border-[#155dfc]/40 focus:outline-none focus:ring-2 focus:ring-[#155dfc]/10"
          />
        </div>
      </Card>

      <Card className="overflow-hidden rounded-[24px] border border-[#155DFC]/30 p-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#155DFC]/10 bg-[#E8F1FF]/50">
                {TABLE_HEADERS.map(header => (
                  <th
                    key={header}
                    className="whitespace-nowrap px-6 py-4 font-[Inter,sans-serif] text-[12px] font-semibold uppercase text-[#4A5565]"
                    style={{ lineHeight: '16px', letterSpacing: '0.06em' }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {paginatedSupervisors.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-16 text-center">
                    <p className="text-[14px] font-medium text-gray-400">No supervisors found</p>
                  </td>
                </tr>
              ) : (
                paginatedSupervisors.map(supervisor => (
                  <tr key={supervisor.id} className="group transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#155DFC] to-[#01c951] text-[14px] font-bold text-white shadow-sm">
                          {supervisor.initials}
                        </div>
                        <span className="text-[15px] font-bold text-[#1E2939]">{supervisor.name}</span>
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-[13.5px] font-medium text-gray-600">{supervisor.jobTitle}</span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-gray-400" strokeWidth={1.5} />
                        <span className="text-[13.5px] font-medium text-gray-500">{supervisor.department}</span>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-2 rounded-[14px] bg-[#EEF4FF] px-3 py-1.5 text-[13px] font-semibold text-[#2B7FFF]">
                        <Users2 size={14} strokeWidth={2.2} />
                        {supervisor.assignedCount}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <button
                        onClick={() => setActiveSupervisor(supervisor)}
                        className="inline-flex items-center justify-center p-0 h-10 px-5 rounded-[14px] text-white shadow-md transition-all hover:shadow-lg hover:opacity-90 active:scale-95"
                        style={{
                          background: 'linear-gradient(90deg, rgba(43, 127, 255, 0.85) 0%, rgba(21, 93, 252, 0.85) 100%)',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          lineHeight: '20px',
                        }}
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
      </Card>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
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
