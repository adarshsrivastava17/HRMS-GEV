import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';
import { attendanceAPI, dashboardAPI, taskAPI, leaveAPI, announcementAPI, payrollAPI, hiringAPI } from '../services/api';

// Menu Items for Employee
const menuItems = [
    { path: '/employee', label: 'Dashboard', icon: '🏠', exact: true },
    { path: '/employee/attendance', label: 'My Attendance', icon: '📅' },
    { path: '/employee/leaves', label: 'Leave Requests', icon: '🏖️' },
    { path: '/employee/tasks', label: 'My Tasks', icon: '📋' },
    { path: '/employee/payslips', label: 'Payslips', icon: '💰' },
    { path: '/employee/job-openings', label: 'Job Openings', icon: '💼' },
    { path: '/employee/announcements', label: 'Announcements', icon: '📢' }
];

export default function EmployeeDashboard() {
    return (
        <div className="app-container">
            <Sidebar role="employee" menuItems={menuItems} />
            <main className="main-content">
                <Routes>
                    <Route index element={<DashboardHome />} />
                    <Route path="attendance" element={<MyAttendance />} />
                    <Route path="leaves" element={<MyLeaves />} />
                    <Route path="tasks" element={<MyTasks />} />
                    <Route path="payslips" element={<MyPayslips />} />
                    <Route path="job-openings" element={<JobOpenings />} />
                    <Route path="announcements" element={<Announcements />} />
                </Routes>
            </main>
        </div>
    );
}

// Dashboard Home with Attendance Controls
function DashboardHome() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [todayStatus, setTodayStatus] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [breakTimer, setBreakTimer] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchData();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let interval;
        if (todayStatus?.isOnBreak && todayStatus?.currentBreak) {
            interval = setInterval(() => {
                const start = new Date(todayStatus.currentBreak.startTime).getTime();
                const now = Date.now();
                setBreakTimer(Math.floor((now - start) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [todayStatus?.isOnBreak, todayStatus?.currentBreak]);

    const fetchData = async () => {
        try {
            const [statsRes, todayRes] = await Promise.all([
                dashboardAPI.getStats(),
                attendanceAPI.getToday()
            ]);
            setStats(statsRes.data);
            setTodayStatus(todayRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        setActionLoading(true);
        try {
            await attendanceAPI.checkIn();
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to check in');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setActionLoading(true);
        try {
            await attendanceAPI.checkOut();
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to check out');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBreakStart = async () => {
        setActionLoading(true);
        try {
            await attendanceAPI.breakStart();
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to start break');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBreakEnd = async () => {
        setActionLoading(true);
        try {
            await attendanceAPI.breakEnd();
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to end break');
        } finally {
            setActionLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return <div className="loading-overlay"><div className="spinner"></div></div>;
    }

    const isCheckedIn = todayStatus?.isCheckedIn;
    const isCheckedOut = todayStatus?.isCheckedOut;
    const isOnBreak = todayStatus?.isOnBreak;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
                <p className="page-subtitle">{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Current Time Display */}
            <div className="glass-card p-3 mb-3 text-center">
                <div className="time-display">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <p className="text-muted mt-1">Current Time</p>
            </div>

            {/* Attendance Controls */}
            <div className="glass-card card-3d p-3 mb-3">
                <h2 className="mb-2" style={{ fontSize: '20px', fontWeight: 600 }}>📍 Attendance Control</h2>

                {/* Status Indicator */}
                <div className="attendance-status mb-2">
                    {!isCheckedIn && (
                        <div className="status-badge badge-pending">Not Checked In</div>
                    )}
                    {isCheckedIn && !isCheckedOut && !isOnBreak && (
                        <div className="status-badge badge-success">✅ Working</div>
                    )}
                    {isOnBreak && (
                        <div className="status-badge badge-warning">☕ On Break</div>
                    )}
                    {isCheckedOut && (
                        <div className="status-badge badge-info">🏠 Day Completed</div>
                    )}
                </div>

                {/* Break Timer */}
                {isOnBreak && (
                    <div className="break-timer-container mb-2">
                        <p className="text-muted mb-1">Break Duration</p>
                        <div className="break-timer">{formatTime(breakTimer)}</div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="attendance-actions">
                    {!isCheckedIn && (
                        <button
                            className="attendance-btn login"
                            onClick={handleCheckIn}
                            disabled={actionLoading}
                        >
                            ▶️ LOGIN
                        </button>
                    )}

                    {isCheckedIn && !isCheckedOut && !isOnBreak && (
                        <>
                            <button
                                className="attendance-btn break"
                                onClick={handleBreakStart}
                                disabled={actionLoading}
                            >
                                ☕ BREAK
                            </button>
                            <button
                                className="attendance-btn leave"
                                onClick={handleCheckOut}
                                disabled={actionLoading}
                            >
                                🚪 LEAVE
                            </button>
                        </>
                    )}

                    {isOnBreak && (
                        <button
                            className="attendance-btn break"
                            onClick={handleBreakEnd}
                            disabled={actionLoading}
                            style={{ background: 'var(--success-gradient)' }}
                        >
                            ✅ BREAKOFF
                        </button>
                    )}
                </div>

                {/* Today's Summary */}
                {todayStatus?.attendance && (
                    <div className="today-summary mt-2">
                        <div className="summary-item">
                            <span className="summary-label">Check In</span>
                            <span className="summary-value">
                                {todayStatus.attendance.checkIn
                                    ? new Date(todayStatus.attendance.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                    : '--:--'}
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Check Out</span>
                            <span className="summary-value">
                                {todayStatus.attendance.checkOut
                                    ? new Date(todayStatus.attendance.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                    : '--:--'}
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Total Break</span>
                            <span className="summary-value">{todayStatus.attendance.totalBreakTime || 0} mins</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Work Time</span>
                            <span className="summary-value">{todayStatus.attendance.totalWorkTime || 0} mins</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Stats - Clickable */}
            <div className="grid grid-4 mb-3">
                <div className="glass-card stat-card clickable" onClick={() => navigate('/employee/tasks')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: 'var(--success-gradient)' }}>📋</div>
                    <div className="stat-value gradient-text">{stats?.pendingTasks || 0}</div>
                    <div className="stat-label">Pending Tasks</div>
                </div>
                <div className="glass-card stat-card clickable" onClick={() => navigate('/employee/leaves')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: 'var(--warning-gradient)' }}>🏖️</div>
                    <div className="stat-value gradient-text">{stats?.pendingLeaves || 0}</div>
                    <div className="stat-label">Pending Leaves</div>
                </div>
                <div className="glass-card stat-card clickable" onClick={() => navigate('/employee/payslips')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: 'var(--info-gradient)' }}>💰</div>
                    <div className="stat-value gradient-text">{stats?.totalPayslips || 0}</div>
                    <div className="stat-label">Payslips</div>
                </div>
                <div className="glass-card stat-card clickable" onClick={() => navigate('/employee/announcements')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: 'var(--primary-gradient)' }}>📢</div>
                    <div className="stat-value gradient-text">{stats?.announcements || 0}</div>
                    <div className="stat-label">Announcements</div>
                </div>
            </div>

            <style>{`
        .attendance-status {
          text-align: center;
        }

        .status-badge {
          display: inline-block;
          padding: 8px 24px;
          font-size: 16px;
          border-radius: 30px;
          font-weight: 600;
        }

        .break-timer-container {
          text-align: center;
          padding: 20px;
          background: rgba(249, 115, 22, 0.1);
          border-radius: var(--radius-lg);
        }

        .attendance-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .today-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
        }

        .summary-item {
          text-align: center;
        }

        .summary-label {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .summary-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .today-summary {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
        </div>
    );
}

// My Attendance History
function MyAttendance() {
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const response = await attendanceAPI.getMy();
            setAttendances(response.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">My Attendance History 📅</h1>
                <p className="page-subtitle">View your attendance records</p>
            </div>

            <div className="glass-card p-2">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Break Time</th>
                            <th>Work Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendances.map((att) => (
                            <tr key={att.id}>
                                <td>{new Date(att.date).toLocaleDateString()}</td>
                                <td>{att.checkIn ? new Date(att.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                <td>{att.checkOut ? new Date(att.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                <td>{att.totalBreakTime} mins</td>
                                <td>{att.totalWorkTime} mins</td>
                                <td><span className={`badge badge-${att.status === 'present' ? 'success' : 'warning'}`}>{att.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {attendances.length === 0 && (
                    <p className="text-center text-muted p-3">No attendance records found</p>
                )}
            </div>
        </div>
    );
}

// My Leave Requests
function MyLeaves() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ type: 'casual', startDate: '', endDate: '', reason: '' });

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const response = await leaveAPI.getMy();
            setLeaves(response.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await leaveAPI.create(form);
            setShowForm(false);
            setForm({ type: 'casual', startDate: '', endDate: '', reason: '' });
            fetchLeaves();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to submit leave request');
        }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    // Show form view
    if (showForm) {
        return (
            <div className="animate-fade-in">
                <div className="d-flex justify-between align-center mb-3" style={{ flexWrap: 'wrap', gap: 12 }}>
                    <h2 style={{ margin: 0 }}>🏖️ Apply for Leave</h2>
                    <button className="btn btn-ghost" onClick={() => setShowForm(false)}>
                        ← Back to Leave Requests
                    </button>
                </div>

                <div className="glass-card p-3">
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="input-label">Leave Type *</label>
                            <select
                                className="input-field select-field"
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                            >
                                <option value="casual">Casual Leave</option>
                                <option value="sick">Sick Leave</option>
                                <option value="annual">Annual Leave</option>
                                <option value="maternity">Maternity Leave</option>
                                <option value="paternity">Paternity Leave</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                            <div className="input-group">
                                <label className="input-label">Start Date *</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={form.startDate}
                                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">End Date *</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={form.endDate}
                                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Reason *</label>
                            <textarea
                                className="input-field"
                                rows="4"
                                value={form.reason}
                                onChange={e => setForm({ ...form, reason: e.target.value })}
                                required
                                placeholder="Enter reason for leave..."
                            ></textarea>
                        </div>

                        <div className="d-flex gap-2" style={{ marginTop: 24 }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '14px' }}>
                                ✅ Submit Leave Request
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ padding: '14px 24px' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Show list view
    return (
        <div className="animate-fade-in">
            <div className="page-header d-flex justify-between align-center" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="page-title">Leave Requests 🏖️</h1>
                    <p className="page-subtitle">Manage your leave applications</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Apply Leave</button>
            </div>

            <div className="glass-card p-2" style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ minWidth: 600 }}>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Reason</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaves.map((leave) => (
                            <tr key={leave.id}>
                                <td style={{ textTransform: 'capitalize' }}>{leave.type}</td>
                                <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                                <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                                <td>{leave.reason}</td>
                                <td><span className={`badge badge-${leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'danger' : 'pending'}`}>{leave.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {leaves.length === 0 && <p className="text-center text-muted p-3">No leave requests</p>}
            </div>
        </div>
    );
}

// My Tasks
function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await taskAPI.getMy();
            setTasks(response.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await taskAPI.updateStatus(id, status);
            fetchTasks();
        } catch (error) {
            alert('Failed to update task');
        }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">My Tasks 📋</h1>
                <p className="page-subtitle">Tasks assigned to you</p>
            </div>

            <div className="grid grid-3">
                {tasks.map((task) => (
                    <div key={task.id} className="glass-card p-2">
                        <div className="d-flex justify-between align-center mb-1">
                            <span className={`badge badge-${task.priority === 'high' || task.priority === 'urgent' ? 'danger' : task.priority === 'medium' ? 'warning' : 'info'}`}>{task.priority}</span>
                            <span className={`badge badge-${task.status === 'completed' ? 'success' : task.status === 'in-progress' ? 'warning' : 'pending'}`}>{task.status}</span>
                        </div>
                        <h4 className="mb-1">{task.title}</h4>
                        <p className="text-muted" style={{ fontSize: 13 }}>{task.description}</p>
                        {task.dueDate && <p className="text-muted mt-1" style={{ fontSize: 12 }}>Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
                        <div className="d-flex gap-1 mt-2">
                            {task.status !== 'in-progress' && task.status !== 'completed' && (
                                <button className="btn btn-sm btn-warning" onClick={() => updateStatus(task.id, 'in-progress')}>Start</button>
                            )}
                            {task.status !== 'completed' && (
                                <button className="btn btn-sm btn-success" onClick={() => updateStatus(task.id, 'completed')}>Complete</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {tasks.length === 0 && <div className="glass-card p-3 text-center text-muted">No tasks assigned</div>}
        </div>
    );
}

// My Payslips
function MyPayslips() {
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayslips();
    }, []);

    const fetchPayslips = async () => {
        try {
            const response = await payrollAPI.getMy();
            setPayslips(response.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">My Payslips 💰</h1>
                <p className="page-subtitle">View your salary records</p>
            </div>

            <div className="glass-card p-2">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Basic Salary</th>
                            <th>Bonus</th>
                            <th>Deductions</th>
                            <th>Net Salary</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payslips.map((pay) => (
                            <tr key={pay.id}>
                                <td>{pay.month}</td>
                                <td>${pay.basicSalary.toLocaleString()}</td>
                                <td className="text-success">+${pay.bonus.toLocaleString()}</td>
                                <td className="text-danger">-${pay.deductions.toLocaleString()}</td>
                                <td><strong>${pay.netSalary.toLocaleString()}</strong></td>
                                <td><span className={`badge badge-${pay.status === 'paid' ? 'success' : pay.status === 'processed' ? 'info' : 'pending'}`}>{pay.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {payslips.length === 0 && <p className="text-center text-muted p-3">No payslips available</p>}
            </div>
        </div>
    );
}

// Announcements
function Announcements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const response = await announcementAPI.getAll();
            setAnnouncements(response.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Announcements 📢</h1>
                <p className="page-subtitle">Company news and updates</p>
            </div>

            {announcements.map((ann) => (
                <div key={ann.id} className="glass-card p-2 mb-2">
                    <div className="d-flex justify-between align-center mb-1">
                        <h3>{ann.title}</h3>
                        <span className={`badge badge-${ann.priority === 'urgent' || ann.priority === 'high' ? 'danger' : ann.priority === 'normal' ? 'info' : 'pending'}`}>{ann.priority}</span>
                    </div>
                    <p className="text-muted">{ann.content}</p>
                    <p className="text-muted mt-1" style={{ fontSize: 12 }}>Posted by {ann.author?.name} • {new Date(ann.createdAt).toLocaleDateString()}</p>
                </div>
            ))}
            {announcements.length === 0 && <div className="glass-card p-3 text-center text-muted">No announcements</div>}
        </div>
    );
}

// Job Openings - View open positions
function JobOpenings() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await hiringAPI.getAll();
            // Only show open jobs to employees
            const openJobs = (res.data || []).filter(job => job.status === 'open');
            setJobs(openJobs);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        }
        finally { setLoading(false); }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    // Detail View
    if (selectedJob) {
        return (
            <div className="animate-fade-in">
                <div className="d-flex justify-between align-center mb-3" style={{ flexWrap: 'wrap', gap: 12 }}>
                    <h2 style={{ margin: 0 }}>📋 Job Details</h2>
                    <button className="btn btn-ghost" onClick={() => setSelectedJob(null)} style={{ fontSize: 18 }}>
                        ← Back to Openings
                    </button>
                </div>

                <div className="glass-card p-3">
                    {/* Job Header */}
                    <div className="d-flex justify-between align-center mb-2" style={{ flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h2 style={{ margin: 0, marginBottom: 8 }}>{selectedJob.title}</h2>
                            <div className="d-flex gap-2" style={{ flexWrap: 'wrap', fontSize: 14, color: 'var(--text-muted)' }}>
                                <span>🏢 {selectedJob.department}</span>
                                <span>📍 {selectedJob.location}</span>
                                <span>⏰ {selectedJob.type}</span>
                                {selectedJob.salaryRange && <span>💰 {selectedJob.salaryRange}</span>}
                            </div>
                        </div>
                        <span className="badge badge-success" style={{ fontSize: 14, padding: '8px 16px' }}>
                            OPEN
                        </span>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />

                    {/* Job Description */}
                    <div style={{ marginBottom: 24 }}>
                        <h3 style={{ marginBottom: 12, color: 'var(--text-primary)' }}>📝 Job Description</h3>
                        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                            {selectedJob.description}
                        </p>
                    </div>

                    {/* Requirements */}
                    <div style={{ marginBottom: 24 }}>
                        <h3 style={{ marginBottom: 12, color: 'var(--text-primary)' }}>✅ Requirements</h3>
                        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                            {selectedJob.requirements}
                        </p>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />

                    {/* Meta Info */}
                    <div className="d-flex justify-between align-center" style={{ flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                        <span>📅 Posted: {new Date(selectedJob.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>

                    {/* Info Note */}
                    <div style={{ marginTop: 24, padding: '16px', background: 'var(--accent-blue-light, rgba(79, 172, 254, 0.1))', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-blue)' }}>
                        <p style={{ margin: 0, color: 'var(--accent-blue)', fontWeight: 500 }}>
                            💡 Interested in this position? Contact HR for more information about the application process.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // List View
    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Job Openings 💼</h1>
                <p className="page-subtitle">View current open positions in the company</p>
            </div>

            {jobs.length === 0 ? (
                <div className="glass-card p-3 text-center" style={{ color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
                    <h3>No Open Positions</h3>
                    <p>There are no job openings at the moment. Check back later!</p>
                </div>
            ) : (
                <div className="grid grid-2">
                    {jobs.map(job => (
                        <div
                            key={job.id}
                            className="glass-card p-2 hover-lift"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedJob(job)}
                        >
                            <div className="d-flex justify-between align-center mb-1" style={{ flexWrap: 'wrap', gap: 8 }}>
                                <h3 style={{ margin: 0 }}>{job.title}</h3>
                                <span className="badge badge-success">Open</span>
                            </div>
                            <div className="d-flex gap-2 mb-1" style={{ flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)' }}>
                                <span>🏢 {job.department}</span>
                                <span>📍 {job.location}</span>
                                <span>⏰ {job.type}</span>
                                {job.salaryRange && <span>💰 {job.salaryRange}</span>}
                            </div>
                            <p className="text-muted mb-1" style={{ fontSize: 13 }}>{job.description?.substring(0, 100)}...</p>
                            <div className="d-flex justify-between align-center" style={{ marginTop: 12 }}>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                                <span style={{ fontSize: 12, color: 'var(--accent-blue)', fontWeight: 500 }}>Click to view details →</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
