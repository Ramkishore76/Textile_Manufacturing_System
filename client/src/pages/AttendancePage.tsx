import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  CheckCheck,
  AlertCircle,
  Building2,
  Briefcase
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const AttendancePage: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, any>>({});
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const [empList, attList] = await Promise.all([
        api.get<any[]>('/employees'),
        api.get<any[]>(`/attendance?date=${selectedDate}`),
      ]);

      setEmployees(empList);

      const map: Record<string, any> = {};
      for (const emp of empList) {
        const existing = attList.find((a) => a.employeeId === emp.id);
        if (existing) {
          map[emp.id] = {
            status: existing.status,
            hoursWorked: existing.hoursWorked,
            overtimeHours: existing.overtimeHours,
            remarks: existing.remarks || '',
            saved: true,
          };
        } else {
          map[emp.id] = {
            status: 'PRESENT',
            hoursWorked: 8,
            overtimeHours: 0,
            remarks: '',
            saved: false,
          };
        }
      }
      setAttendanceMap(map);
    } catch (err: any) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendanceState = (empId: string, field: string, value: any) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: value,
        saved: false,
      },
    }));
  };

  const saveEmployeeAttendance = async (empId: string) => {
    const data = attendanceMap[empId];
    if (!data) return;

    setSavingId(empId);
    setSaveSuccess(null);
    try {
      await api.post('/attendance', {
        employeeId: empId,
        date: selectedDate,
        status: data.status,
        hoursWorked: Number(data.hoursWorked),
        overtimeHours: Number(data.overtimeHours),
        remarks: data.remarks || undefined,
      });

      setAttendanceMap((prev) => ({
        ...prev,
        [empId]: { ...prev[empId], saved: true },
      }));
      toast.success('Shift attendance record saved successfully');
    } catch (err: any) {
      toast.error('Failed to save attendance: ' + err.message);
    } finally {
      setSavingId(null);
    }
  };

  const markAllPresentAndSave = async () => {
    setLoading(true);
    try {
      for (const emp of employees) {
        const data = attendanceMap[emp.id] || { hoursWorked: 8, overtimeHours: 0 };
        await api.post('/attendance', {
          employeeId: emp.id,
          date: selectedDate,
          status: 'PRESENT',
          hoursWorked: 8,
          overtimeHours: data.overtimeHours || 0,
        });
      }
      toast.success('Bulk attendance marked for all shift workers!');
      loadAttendanceData();
    } catch (err: any) {
      toast.error('Error bulk saving attendance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Metrics
  const totalEmps = employees.length;
  const presentCount = Object.values(attendanceMap).filter((a) => a.status === 'PRESENT').length;
  const halfDayCount = Object.values(attendanceMap).filter((a) => a.status === 'HALF_DAY').length;
  const absentCount = Object.values(attendanceMap).filter((a) => a.status === 'ABSENT' || a.status === 'ON_LEAVE').length;
  const totalOvertime = Object.values(attendanceMap).reduce((sum, a) => sum + (Number(a.overtimeHours) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Shift Attendance Register</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Shift presence, base daily hours, and overtime directly linked to payroll.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-white border border-zinc-200 px-3 py-2 rounded-xl text-xs shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-zinc-800 font-medium focus:outline-none"
            />
          </div>

          <button
            onClick={markAllPresentAndSave}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Present</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Workforce Total</p>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-bold tracking-tight text-zinc-900">{totalEmps}</span>
            <span className="text-xs text-zinc-400">plant staff</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Present Today</p>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-bold tracking-tight text-emerald-700">{presentCount}</span>
            {halfDayCount > 0 && (
              <span className="text-xs text-amber-700 font-semibold">(+{halfDayCount} half day)</span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Absent / Leave</p>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-bold tracking-tight text-rose-700">{absentCount}</span>
            <span className="text-xs text-zinc-400">workers</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Total Overtime</p>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-bold tracking-tight text-zinc-900">{totalOvertime}</span>
            <span className="text-xs text-zinc-400">hours logged</span>
          </div>
        </div>
      </div>

      {/* Attendance Grid */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs font-medium">Loading employee register...</div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 text-xs italic">No employees found in system.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Emp Code & Name</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Daily Base Rate</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Regular Hours</th>
                  <th className="py-3 px-4">Overtime Hours</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {employees.map((emp) => {
                  const state = attendanceMap[emp.id] || {
                    status: 'PRESENT',
                    hoursWorked: 8,
                    overtimeHours: 0,
                    remarks: '',
                    saved: false,
                  };

                  return (
                    <tr key={emp.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-zinc-900 block">{emp.employeeCode}</span>
                        <span className="text-zinc-800 font-medium">{emp.name}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-zinc-800 block">{emp.department}</span>
                        <span className="text-zinc-400 text-[10px]">{emp.role}</span>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-800 font-medium">
                        ₹{emp.dailyBaseWage} / day
                        <span className="text-[10px] text-zinc-400 block font-normal">(OT: ₹{emp.overtimeHourlyRate}/h)</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex rounded-xl border border-zinc-200 p-0.5 bg-zinc-100">
                          {['PRESENT', 'HALF_DAY', 'ABSENT', 'ON_LEAVE'].map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => updateAttendanceState(emp.id, 'status', st)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                                state.status === st
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'text-zinc-600 hover:text-zinc-900'
                              }`}
                            >
                              {st === 'PRESENT' ? 'P' : st === 'HALF_DAY' ? 'HD' : st === 'ABSENT' ? 'A' : 'L'}
                            </button>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <input
                          type="number"
                          value={state.hoursWorked}
                          onChange={(e) => updateAttendanceState(emp.id, 'hoursWorked', e.target.value)}
                          min={0}
                          max={24}
                          className="w-14 px-2 py-1.5 rounded-lg border border-zinc-200 text-center text-xs text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <input
                          type="number"
                          value={state.overtimeHours}
                          onChange={(e) => updateAttendanceState(emp.id, 'overtimeHours', e.target.value)}
                          min={0}
                          max={16}
                          className="w-14 px-2 py-1.5 rounded-lg border border-zinc-200 text-center text-xs text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={state.remarks}
                          onChange={(e) => updateAttendanceState(emp.id, 'remarks', e.target.value)}
                          placeholder="Note..."
                          className="w-28 px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-800 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => saveEmployeeAttendance(emp.id)}
                          disabled={savingId === emp.id}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            state.saved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                          }`}
                        >
                          {state.saved ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>{savingId === emp.id ? '...' : 'Save'}</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
