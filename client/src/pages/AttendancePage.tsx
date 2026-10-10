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

export const AttendancePage: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, any>>({});
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
      setSaveSuccess(`Attendance saved for ${empId}`);
    } catch (err: any) {
      alert('Failed to save attendance: ' + err.message);
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
      loadAttendanceData();
    } catch (err: any) {
      alert('Error bulk saving: ' + err.message);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 mb-1">
            <Users className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Human Resources & Plant Floor</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shift Attendance Register</h1>
          <p className="text-sm text-slate-500 mt-1">
            Log shift presence, daily base hours, and overtime directly feeding labour wage payroll
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <button
            onClick={markAllPresentAndSave}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Present</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Workforce Total</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-slate-900">{totalEmps}</span>
            <span className="text-xs font-medium text-slate-400">plant staff</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Present Today</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-emerald-600">{presentCount}</span>
            {halfDayCount > 0 && (
              <span className="text-xs font-bold text-amber-600">(+{halfDayCount} half day)</span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Absent / Leave</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-rose-600">{absentCount}</span>
            <span className="text-xs font-medium text-slate-400">workers</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Overtime</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-indigo-600">{totalOvertime}</span>
            <span className="text-xs font-medium text-slate-400">hours logged</span>
          </div>
        </div>
      </div>

      {/* Attendance Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading employee register...</div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs italic">No employees found in system.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employees.map((emp) => {
                  const state = attendanceMap[emp.id] || {
                    status: 'PRESENT',
                    hoursWorked: 8,
                    overtimeHours: 0,
                    remarks: '',
                    saved: false,
                  };

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{emp.employeeCode}</span>
                        <span className="font-semibold text-slate-700">{emp.name}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-indigo-600 block">{emp.department}</span>
                        <span className="text-slate-400 text-[10px]">{emp.role}</span>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        ₹{emp.dailyBaseWage} / day
                        <span className="text-[10px] text-slate-400 block">(OT: ₹{emp.overtimeHourlyRate}/h)</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                          {['PRESENT', 'HALF_DAY', 'ABSENT', 'ON_LEAVE'].map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => updateAttendanceState(emp.id, 'status', st)}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                                state.status === st
                                  ? st === 'PRESENT'
                                    ? 'bg-emerald-600 text-white'
                                    : st === 'HALF_DAY'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-rose-600 text-white'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {st === 'PRESENT' ? 'P' : st === 'HALF_DAY' ? 'HD' : st === 'ABSENT' ? 'A' : 'L'}
                            </button>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={state.hoursWorked}
                          onChange={(e) => updateAttendanceState(emp.id, 'hoursWorked', e.target.value)}
                          min={0}
                          max={24}
                          className="w-16 px-2 py-1 rounded border border-slate-200 text-center font-mono font-bold"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={state.overtimeHours}
                          onChange={(e) => updateAttendanceState(emp.id, 'overtimeHours', e.target.value)}
                          min={0}
                          max={16}
                          className="w-16 px-2 py-1 rounded border border-slate-200 text-center font-mono font-bold text-indigo-600"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={state.remarks}
                          onChange={(e) => updateAttendanceState(emp.id, 'remarks', e.target.value)}
                          placeholder="Note..."
                          className="w-32 px-2 py-1 rounded border border-slate-200 text-xs"
                        />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => saveEmployeeAttendance(emp.id)}
                          disabled={savingId === emp.id}
                          className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            state.saved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                          }`}
                        >
                          {state.saved ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3 h-3" />
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
