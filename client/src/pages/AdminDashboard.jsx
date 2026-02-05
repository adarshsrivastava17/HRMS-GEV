import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';
import { dashboardAPI, employeeAPI, departmentAPI, attendanceAPI, payrollAPI, announcementAPI, leaveAPI, hiringAPI } from '../services/api';

const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '🏠', exact: true },
    { path: '/admin/employees', label: 'All Employees', icon: '👥' },
    { path: '/admin/departments', label: 'Departments', icon: '🏢' },
    { path: '/admin/attendance', label: 'Attendance', icon: '📅' },
    { path: '/admin/payroll', label: 'Payroll', icon: '💰' },
    { path: '/admin/reports', label: 'Reports', icon: '📊' }
];

export default function AdminDashboard() {
    return (
        <div className="app-container">
            <Sidebar role="admin" menuItems={menuItems} />
            <main className="main-content">
                <Routes>
                    <Route index element={<DashboardHome />} />
                    <Route path="employees" element={<EmployeesPage />} />
                    <Route path="departments" element={<DepartmentsPage />} />
                    <Route path="attendance" element={<AttendancePage />} />
                    <Route path="payroll" element={<PayrollPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                </Routes>
            </main>
        </div>
    );
}

function DashboardHome() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [liveStatus, setLiveStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal states for Pending Actions
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    // New modal states for clickable dashboard elements
    const [showEmployeesModal, setShowEmployeesModal] = useState(false);
    const [showDepartmentsModal, setShowDepartmentsModal] = useState(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showPayrollModal, setShowPayrollModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showLiveStatusModal, setShowLiveStatusModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedLiveStatus, setSelectedLiveStatus] = useState(null);

    // Data states for modals
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [attendances, setAttendances] = useState([]);
    const [payrolls, setPayrolls] = useState([]);
    const [openHirings, setOpenHirings] = useState([]);

    const fetchData = async () => {
        try {
            const [s, l] = await Promise.all([dashboardAPI.getStats(), attendanceAPI.getLiveStatus()]);
            setStats(s.data);
            setLiveStatus(l.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch open hiring posts
    const fetchHirings = async () => {
        try {
            const res = await hiringAPI.getAll({ status: 'open' });
            setOpenHirings(res.data);
        } catch (error) {
            console.error('Error fetching hirings:', error);
        }
    };

    const fetchLeaveRequests = async () => {
        setModalLoading(true);
        try {
            const res = await leaveAPI.getAll({ status: 'pending' });
            setLeaveRequests(res.data.leaves || res.data || []);
        } catch (error) {
            console.error('Error fetching leave requests:', error);
        } finally {
            setModalLoading(false);
        }
    };

    const fetchAnnouncements = async () => {
        setModalLoading(true);
        try {
            const res = await announcementAPI.getAll();
            setAnnouncements(res.data.announcements || res.data || []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setModalLoading(false);
        }
    };

    // Fetch functions for new modals
    const fetchEmployees = async () => {
        setModalLoading(true);
        try {
            const res = await employeeAPI.getAll();
            setEmployees(res.data.employees || res.data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setModalLoading(false);
        }
    };

    const fetchDepartments = async () => {
        setModalLoading(true);
        try {
            const res = await departmentAPI.getAll();
            setDepartments(res.data || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setModalLoading(false);
        }
    };

    const fetchAttendances = async () => {
        setModalLoading(true);
        try {
            const res = await attendanceAPI.getAll({ date: new Date().toISOString().split('T')[0] });
            setAttendances(res.data.attendances || res.data || []);
        } catch (error) {
            console.error('Error fetching attendances:', error);
        } finally {
            setModalLoading(false);
        }
    };

    const fetchPayrolls = async () => {
        setModalLoading(true);
        try {
            const res = await payrollAPI.getAll();
            setPayrolls(res.data.payrolls || res.data || []);
        } catch (error) {
            console.error('Error fetching payrolls:', error);
        } finally {
            setModalLoading(false);
        }
    };

    // Click handlers for stat cards
    const handleEmployeesClick = () => {
        setShowEmployeesModal(true);
        fetchEmployees();
    };

    const handleDepartmentsClick = () => {
        setShowDepartmentsModal(true);
        fetchDepartments();
    };

    const handleAttendanceClick = () => {
        setShowAttendanceModal(true);
        fetchAttendances();
    };

    const handlePayrollClick = () => {
        setShowPayrollModal(true);
        fetchPayrolls();
    };

    const handleRoleClick = (role) => {
        setSelectedRole(role);
        setShowRoleModal(true);
        fetchEmployees();
    };

    const handleLiveStatusClick = (status) => {
        setSelectedLiveStatus(status);
        setShowLiveStatusModal(true);
    };

    const handleLeaveClick = () => {
        setShowLeaveModal(true);
        fetchLeaveRequests();
    };

    const handleAnnouncementClick = () => {
        setShowAnnouncementModal(true);
        fetchAnnouncements();
    };

    const handleLeaveAction = async (id, status) => {
        try {
            await leaveAPI.updateStatus(id, status);
            fetchLeaveRequests();
            fetchData(); // Refresh stats
        } catch (error) {
            console.error('Error updating leave status:', error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchHirings();
        // Auto-refresh every 3 seconds for real-time updates
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    // Helper to get employees filtered by live status
    const getLiveStatusEmployees = () => {
        if (!liveStatus?.employees || !selectedLiveStatus) return [];
        return liveStatus.employees.filter(emp => {
            if (selectedLiveStatus === 'working') return emp.status === 'working';
            if (selectedLiveStatus === 'onBreak') return emp.status === 'on_break';
            if (selectedLiveStatus === 'checkedOut') return emp.status === 'checked_out';
            return false;
        });
    };

    // Clickable card style
    const clickableCardStyle = {
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Admin Dashboard 👑</h1>
                <p className="page-subtitle">Welcome back, CEO {user?.name}</p>
            </div>

            <div className="grid grid-4 mb-3">
                <div
                    className="glass-card stat-card card-3d animate-glow"
                    style={clickableCardStyle}
                    onClick={handleEmployeesClick}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
                >
                    <div className="stat-icon" style={{ background: 'var(--primary-gradient)' }}>👥</div>
                    <div className="stat-value gradient-text">{stats?.totalEmployees || 0}</div>
                    <div className="stat-label">Total Employees</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Click to view details</div>
                </div>
                <div
                    className="glass-card stat-card card-3d"
                    style={clickableCardStyle}
                    onClick={handleDepartmentsClick}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
                >
                    <div className="stat-icon" style={{ background: 'var(--success-gradient)' }}>🏢</div>
                    <div className="stat-value gradient-text">{stats?.totalDepartments || 0}</div>
                    <div className="stat-label">Departments</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Click to view details</div>
                </div>
                <div
                    className="glass-card stat-card card-3d"
                    style={clickableCardStyle}
                    onClick={handleAttendanceClick}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
                >
                    <div className="stat-icon" style={{ background: 'var(--warning-gradient)' }}>✅</div>
                    <div className="stat-value gradient-text">{stats?.todayAttendance || 0}</div>
                    <div className="stat-label">Present Today</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Click to view details</div>
                </div>
                <div
                    className="glass-card stat-card card-3d"
                    style={clickableCardStyle}
                    onClick={handlePayrollClick}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
                >
                    <div className="stat-icon" style={{ background: 'var(--info-gradient)' }}>💰</div>
                    <div className="stat-value gradient-text">${(stats?.totalPayroll / 1000 || 0).toFixed(0)}K</div>
                    <div className="stat-label">Total Payroll</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Click to view details</div>
                </div>
            </div>

            <div className="grid grid-2 mb-3">
                <div className="glass-card p-3">
                    <h3 className="mb-2">📊 Role Distribution</h3>
                    <div className="d-flex gap-2 flex-wrap">
                        {Object.entries(stats?.roleBreakdown || {}).map(([role, count]) => (
                            <div
                                key={role}
                                className="text-center p-2"
                                style={{
                                    flex: 1,
                                    minWidth: 100,
                                    background: 'rgba(102, 126, 234, 0.1)',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onClick={() => handleRoleClick(role)}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                                }}
                            >
                                <div style={{ fontSize: 24, fontWeight: 700 }}>{count}</div>
                                <div style={{ fontSize: 12, textTransform: 'capitalize', color: 'var(--text-muted)' }}>{role}s</div>
                                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>Click to view</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass-card p-3">
                    <h3 className="mb-2">🟢 Live Status</h3>
                    <div className="d-flex gap-2">
                        <div
                            className="text-center p-2"
                            style={{
                                flex: 1,
                                background: 'rgba(56, 239, 125, 0.1)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => handleLiveStatusClick('working')}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.background = 'rgba(56, 239, 125, 0.2)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.background = 'rgba(56, 239, 125, 0.1)';
                            }}
                        >
                            <div style={{ fontSize: 28, fontWeight: 700, color: '#38ef7d' }}>{liveStatus?.summary?.working || 0}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Working</div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>Click to view</div>
                        </div>
                        <div
                            className="text-center p-2"
                            style={{
                                flex: 1,
                                background: 'rgba(249, 115, 22, 0.1)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => handleLiveStatusClick('onBreak')}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.2)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                            }}
                        >
                            <div style={{ fontSize: 28, fontWeight: 700, color: '#f97316' }}>{liveStatus?.summary?.onBreak || 0}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>On Break</div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>Click to view</div>
                        </div>
                        <div
                            className="text-center p-2"
                            style={{
                                flex: 1,
                                background: 'rgba(79, 172, 254, 0.1)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => handleLiveStatusClick('checkedOut')}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.background = 'rgba(79, 172, 254, 0.2)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.background = 'rgba(79, 172, 254, 0.1)';
                            }}
                        >
                            <div style={{ fontSize: 28, fontWeight: 700, color: '#4facfe' }}>{liveStatus?.summary?.checkedOut || 0}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Left</div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>Click to view</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card p-3">
                <h3 className="mb-2">📝 Pending Actions</h3>
                <div className="d-flex gap-2">
                    <div
                        className="badge badge-warning"
                        style={{ padding: '12px 20px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                        onClick={handleLeaveClick}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        📋 {stats?.pendingLeaves || 0} Leave Requests
                    </div>
                    <div
                        className="badge badge-info"
                        style={{ padding: '12px 20px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                        onClick={handleAnnouncementClick}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        📢 {stats?.announcements || 0} Announcements
                    </div>
                </div>
            </div>

            {/* Open Positions - Hiring Posts */}
            {openHirings.length > 0 && (
                <div className="glass-card p-3 mt-3">
                    <h3 className="mb-2">💼 Open Positions ({openHirings.length})</h3>
                    <div className="grid grid-2">
                        {openHirings.slice(0, 4).map(job => (
                            <div key={job.id} style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(102, 126, 234, 0.08)', border: '1px solid var(--border-color)' }}>
                                <div className="d-flex justify-between align-center mb-1" style={{ flexWrap: 'wrap', gap: 8 }}>
                                    <h4 style={{ margin: 0, fontSize: 15 }}>{job.title}</h4>
                                    <span className="badge badge-success">{job.type}</span>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                                    <span>🏢 {job.department}</span> • <span>📍 {job.location}</span>
                                    {job.salaryRange && <span> • 💰 {job.salaryRange}</span>}
                                </div>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                                    {job.description.substring(0, 80)}...
                                </p>
                            </div>
                        ))}
                    </div>
                    {openHirings.length > 4 && (
                        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--accent-blue)' }}>
                            +{openHirings.length - 4} more positions available
                        </p>
                    )}
                </div>
            )}

            {/* Leave Requests Modal */}
            {showLeaveModal && (
                <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
                    <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ overflow: 'hidden' }}>
                        <div className="modal-header d-flex justify-between align-center mb-2">
                            <h2 style={{ margin: 0 }}>📋 Leave Requests</h2>
                            <button className="btn" onClick={() => setShowLeaveModal(false)} style={{ background: 'transparent', fontSize: 24, padding: 0 }}>×</button>
                        </div>
                        {modalLoading ? (
                            <div className="text-center p-3"><div className="spinner"></div></div>
                        ) : leaveRequests.length === 0 ? (
                            <div className="text-center p-3" style={{ color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                                <p>No pending leave requests</p>
                            </div>
                        ) : (
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {leaveRequests.map(leave => (
                                    <div key={leave.id} className="glass-card p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div className="d-flex justify-between align-center mb-1">
                                            <div>
                                                <strong style={{ fontSize: 16 }}>{leave.user?.name || 'Unknown'}</strong>
                                                <span className="badge badge-primary" style={{ marginLeft: 8, fontSize: 10 }}>{leave.user?.position || 'N/A'}</span>
                                            </div>
                                            <span className={`badge badge-${leave.status === 'pending' ? 'warning' : leave.status === 'approved' ? 'success' : 'danger'}`}>
                                                {leave.status}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                                            <div><strong>Type:</strong> {leave.type}</div>
                                            <div><strong>From:</strong> {new Date(leave.startDate).toLocaleDateString()} <strong>To:</strong> {new Date(leave.endDate).toLocaleDateString()}</div>
                                            <div><strong>Reason:</strong> {leave.reason}</div>
                                        </div>
                                        {leave.status === 'pending' && (
                                            <div className="d-flex gap-1">
                                                <button className="btn btn-success" style={{ padding: '6px 16px', fontSize: 12 }} onClick={() => handleLeaveAction(leave.id, 'approved')}>✓ Approve</button>
                                                <button className="btn btn-danger" style={{ padding: '6px 16px', fontSize: 12 }} onClick={() => handleLeaveAction(leave.id, 'rejected')}>✗ Reject</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Announcements Modal */}
            {showAnnouncementModal && (
                <div className="modal-overlay" onClick={() => setShowAnnouncementModal(false)}>
                    <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ overflow: 'hidden' }}>
                        <div className="modal-header d-flex justify-between align-center mb-2">
                            <h2 style={{ margin: 0 }}>📢 Announcements</h2>
                            <button className="btn" onClick={() => setShowAnnouncementModal(false)} style={{ background: 'transparent', fontSize: 24, padding: 0 }}>×</button>
                        </div>
                        {modalLoading ? (
                            <div className="text-center p-3"><div className="spinner"></div></div>
                        ) : announcements.length === 0 ? (
                            <div className="text-center p-3" style={{ color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                                <p>No announcements found</p>
                            </div>
                        ) : (
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {announcements.map(announcement => (
                                    <div key={announcement.id} className="glass-card p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div className="d-flex justify-between align-center mb-1">
                                            <strong style={{ fontSize: 16 }}>{announcement.title}</strong>
                                            <span className={`badge badge-${announcement.priority === 'high' ? 'danger' : announcement.priority === 'medium' ? 'warning' : 'info'}`}>
                                                {announcement.priority || 'normal'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{announcement.content}</p>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            <span>👤 {announcement.author?.name || 'Admin'}</span>
                                            <span style={{ marginLeft: 16 }}>📅 {new Date(announcement.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Employees Modal */}
            {showEmployeesModal && (
                <div className="modal-overlay" onClick={() => setShowEmployeesModal(false)}>
                    <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ overflow: 'hidden' }}>
                        <div className="modal-header d-flex justify-between align-center mb-2">
                            <h2 style={{ margin: 0 }}>👥 All Employees ({employees.length})</h2>
                            <button className="btn" onClick={() => setShowEmployeesModal(false)} style={{ background: 'transparent', fontSize: 24, padding: 0 }}>×</button>
                        </div>
                        {modalLoading ? (
                            <div className="text-center p-3"><div className="spinner"></div></div>
                        ) : employees.length === 0 ? (
                            <div className="text-center p-3" style={{ color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
                                <p>No employees found</p>
                            </div>
                        ) : (
                            <div className="modal-table-container">
                                <table className="data-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Position</th>
                                            <th>Department</th>
                                            <th>Salary</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map(emp => (
                                            <tr key={emp.id}>
                                                <td><strong>{emp.name}</strong></td>
                                                <td>{emp.email}</td>
                                                <td>
                                                    <span className={`badge badge-${emp.role === 'admin' ? 'danger' : emp.role === 'hr' ? 'success' : emp.role === 'manager' ? 'info' : 'pending'}`}>
                                                        {emp.role}
                                                    </span>
                                                </td>
                                                <td>{emp.position || '-'}</td>
                                                <td>{emp.department?.name || '-'}</td>
                                                <td>${emp.salary?.toLocaleString() || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Departments Modal */}
            {showDepartmentsModal && (
                <div className="modal-overlay" onClick={() => setShowDepartmentsModal(false)}>
                    <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ overflow: 'hidden' }}>
                        <div className="modal-header d-flex justify-between align-center mb-2">
                            <h2 style={{ margin: 0 }}>🏢 Departments ({departments.length})</h2>
                            <button className="btn" onClick={() => setShowDepartmentsModal(false)} style={{ background: 'transparent', fontSize: 24, padding: 0 }}>×</button>
                        </div>
                        {modalLoading ? (
                            <div className="text-center p-3"><div className="spinner"></div></div>
                        ) : departments.length === 0 ? (
                            <div className="text-center p-3" style={{ color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
                                <p>No departments found</p>
                            </div>
                        ) : (
                            <div className="modal-body">
                                <div className="grid grid-2" style={{ gap: 16 }}>
                                    {departments.map(dept => (
                                        <div key={dept.id} className="glass-card p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                            <h3 style={{ margin: 0, marginBottom: 8 }}>{dept.name}</h3>
                                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{dept.description || 'No description'}</p>
                                            <div className="d-flex justify-between align-center">
                                                <span className="badge badge-info">👥 {dept._count?.users || 0} members</span>
                                                {dept.manager && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Manager: {dept.manager.name}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Attendance Modal */}
            {showAttendanceModal && (
                <div className="modal-overlay" onClick={() => setShowAttendanceModal(false)}>
                    <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ overflow: 'hidden' }}>
                        <div className="modal-header d-flex justify-between align-center mb-2">
                            <h2 style={{ margin: 0 }}>✅ Today's Attendance ({attendances.length})</h2>
                            <button className="btn" onClick={() => setShowAttendanceModal(false)} style={{ background: 'transparent', fontSize: 24, padding: 0 }}>×</button>
                        </div>
                        {modalLoading ? (
                            <div className="text-center p-3"><div className="spinner"></div></div>
                        ) : attendances.length === 0 ? (
                            <div className="text-center p-3" style={{ color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                                <p>No attendance records for today</p>
                            </div>
                        ) : (
                            <div className="modal-table-container">
                                <table className="data-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Position</th>
                                            <th>Check In</th>
                                            <th>Check Out</th>
                                            <th>Break Time</th>
                                            <th>Work Time</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendances.map(att => (
                                            <tr key={att.id}>
                                                <td><strong>{att.user?.name || 'Unknown'}</strong></td>
                                                <td>{att.user?.position || '-'}</td>
                                                <td>{att.checkIn ? new Date(att.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                                <td>{att.checkOut ? new Date(att.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                                <td>{att.totalBreakTime || 0}m</td>
                                                <td>{att.totalWorkTime || 0}m</td>
                                                <td>
                                                    <span className={`badge badge-${att.status === 'present' ? 'success' : 'warning'}`}>
                                                        {att.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Payroll Modal */}
            {showPayrollModal && (
                <div className="modal-overlay" onClick={() => setShowPayrollModal(false)}>
                    <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ overflow: 'hidden' }}>
                        <div className="modal-header d-flex justify-between align-center mb-2">
                            <h2 style={{ margin: 0 }}>💰 Payroll Overview ({payrolls.length})</h2>
                            <button className="btn" onClick={() => setShowPayrollModal(false)} style={{ background: 'transparent', fontSize: 24, padding: 0 }}>×</button>
                        </div>
                        {modalLoading ? (
                            <div className="text-center p-3"><div className="spinner"></div></div>
                        ) : payrolls.length === 0 ? (
                            <div className="text-center p-3" style={{ color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>💵</div>
                                <p>No payroll records found</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-3 mb-2" style={{ gap: 12 }}>
                                    <div className="text-center p-2" style={{ background: 'rgba(102, 126, 234, 0.1)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontSize: 20, fontWeight: 700 }}>${payrolls.reduce((s, p) => s + (p.netSalary || 0), 0).toLocaleString()}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total</div>
                                    </div>
                                    <div className="text-center p-2" style={{ background: 'rgba(56, 239, 125, 0.1)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: '#38ef7d' }}>${payrolls.filter(p => p.status === 'paid').reduce((s, p) => s + (p.netSalary || 0), 0).toLocaleString()}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Paid</div>
                                    </div>
                                    <div className="text-center p-2" style={{ background: 'rgba(249, 115, 22, 0.1)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: '#f97316' }}>${payrolls.filter(p => p.status !== 'paid').reduce((s, p) => s + (p.netSalary || 0), 0).toLocaleString()}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pending</div>
                                    </div>
                                </div>
                                <div className="modal-table-container">
                                    <table className="data-table" style={{ width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>Month</th>
                                                <th>Basic</th>
                                                <th>Bonus</th>
                                                <th>Net</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payrolls.slice(0, 15).map(pay => (
                                                <tr key={pay.id}>
                                                    <td><strong>{pay.user?.name || 'Unknown'}</strong></td>
                                                    <td>{pay.month}</td>
                                                    <td>${pay.basicSalary?.toLocaleString() || 0}</td>
                                                    <td>${pay.bonus?.toLocaleString() || 0}</td>
                                                    <td><strong>${pay.netSalary?.toLocaleString() || 0}</strong></td>
                                                    <td>
                                                        <span className={`badge badge-${pay.status === 'paid' ? 'success' : 'pending'}`}>
                                                            {pay.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Role Filter Modal */}
            {showRoleModal && (
                <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
                    <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ overflow: 'hidden' }}>
                        <div className="modal-header d-flex justify-between align-center mb-2">
                            <h2 style={{ margin: 0, textTransform: 'capitalize' }}>👤 {selectedRole}s ({employees.filter(e => e.role === selectedRole).length})</h2>
                            <button className="btn" onClick={() => setShowRoleModal(false)} style={{ background: 'transparent', fontSize: 24, padding: 0 }}>×</button>
                        </div>
                        {modalLoading ? (
                            <div className="text-center p-3"><div className="spinner"></div></div>
                        ) : employees.filter(e => e.role === selectedRole).length === 0 ? (
                            <div className="text-center p-3" style={{ color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
                                <p>No {selectedRole}s found</p>
                            </div>
                        ) : (
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {employees.filter(e => e.role === selectedRole).map(emp => (
                                    <div key={emp.id} className="glass-card p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div className="d-flex justify-between align-center">
                                            <div>
                                                <strong style={{ fontSize: 16 }}>{emp.name}</strong>
                                                <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>{emp.email}</span>
                                            </div>
                                            <span className={`badge badge-${selectedRole === 'admin' ? 'danger' : selectedRole === 'hr' ? 'success' : selectedRole === 'manager' ? 'info' : 'pending'}`}>
                                                {emp.position || selectedRole}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                                            <span>🏢 {emp.department?.name || 'No Department'}</span>
                                            <span style={{ marginLeft: 16 }}>💰 ${emp.salary?.toLocaleString() || 'N/A'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Live Status Modal */}
            {showLiveStatusModal && (
                <div className="modal-overlay" onClick={() => setShowLiveStatusModal(false)}>
                    <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ overflow: 'hidden' }}>
                        <div className="modal-header d-flex justify-between align-center mb-2">
                            <h2 style={{ margin: 0 }}>
                                {selectedLiveStatus === 'working' && '🟢 Currently Working'}
                                {selectedLiveStatus === 'onBreak' && '🟠 On Break'}
                                {selectedLiveStatus === 'checkedOut' && '🔵 Checked Out'}
                                {' '}({getLiveStatusEmployees().length})
                            </h2>
                            <button className="btn" onClick={() => setShowLiveStatusModal(false)} style={{ background: 'transparent', fontSize: 24, padding: 0 }}>×</button>
                        </div>
                        {getLiveStatusEmployees().length === 0 ? (
                            <div className="text-center p-3" style={{ color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>
                                    {selectedLiveStatus === 'working' && '🟢'}
                                    {selectedLiveStatus === 'onBreak' && '🟠'}
                                    {selectedLiveStatus === 'checkedOut' && '🔵'}
                                </div>
                                <p>No employees {selectedLiveStatus === 'working' ? 'currently working' : selectedLiveStatus === 'onBreak' ? 'on break' : 'have checked out'}</p>
                            </div>
                        ) : (
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {getLiveStatusEmployees().map(emp => (
                                    <div key={emp.id || emp.name} className="glass-card p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div className="d-flex justify-between align-center">
                                            <div>
                                                <strong style={{ fontSize: 16 }}>{emp.name}</strong>
                                                <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>{emp.position || ''}</span>
                                            </div>
                                            <span className={`badge badge-${selectedLiveStatus === 'working' ? 'success' : selectedLiveStatus === 'onBreak' ? 'warning' : 'info'}`}>
                                                {selectedLiveStatus === 'working' ? 'Working' : selectedLiveStatus === 'onBreak' ? 'On Break' : 'Left'}
                                            </span>
                                        </div>
                                        {emp.checkIn && (
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                                                <span>⏰ Check-in: {new Date(emp.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                                {emp.checkOut && <span style={{ marginLeft: 16 }}>🚪 Check-out: {new Date(emp.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function EmployeesPage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const limit = 10;

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await employeeAPI.getAll({ page: currentPage, limit });
            setEmployees(res.data.employees || []);
            setTotalPages(res.data.pagination?.pages || 1);
            setTotalEmployees(res.data.pagination?.total || res.data.employees?.length || 0);
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchEmployees(); }, [currentPage]);

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">All Employees 👥</h1>
                <p className="page-subtitle">Total: {totalEmployees} employees</p>
            </div>
            <div className="glass-card p-2">
                {/* Responsive Table Wrapper */}
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: 50 }}>#</th>
                                <th style={{ minWidth: 150 }}>Name</th>
                                <th style={{ minWidth: 200 }}>Email</th>
                                <th style={{ minWidth: 100 }}>Role</th>
                                <th style={{ minWidth: 150 }}>Position</th>
                                <th style={{ minWidth: 120 }}>Department</th>
                                <th style={{ minWidth: 100 }}>Salary</th>
                                <th style={{ minWidth: 100 }}>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((e, index) => (
                                <tr key={e.id}>
                                    <td>{((currentPage - 1) * limit) + index + 1}</td>
                                    <td>
                                        <div className="d-flex align-center gap-2">
                                            <div className={`avatar avatar-sm role-${e.role}`} style={{ width: 32, height: 32, fontSize: 12 }}>
                                                {e.name?.charAt(0) || 'U'}
                                            </div>
                                            <span style={{ fontWeight: 500 }}>{e.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>{e.email}</td>
                                    <td>
                                        <span className={`badge badge-${e.role === 'admin' ? 'danger' : e.role === 'hr' ? 'success' : e.role === 'manager' ? 'info' : 'pending'}`}>
                                            {e.role?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>{e.position || '-'}</td>
                                    <td>{e.department?.name || '-'}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                                        ₹{e.salary?.toLocaleString() || '-'}
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                        {e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="d-flex justify-between align-center" style={{ marginTop: 20, padding: '12px 16px', background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', flexWrap: 'wrap', gap: 12 }}>
                        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                            Showing {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, totalEmployees)} of {totalEmployees} employees
                        </span>
                        <div className="d-flex gap-1 align-center">
                            <button className="btn btn-sm btn-ghost" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={{ opacity: currentPage === 1 ? 0.5 : 1 }}>⏮️ First</button>
                            <button className="btn btn-sm btn-ghost" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ opacity: currentPage === 1 ? 0.5 : 1 }}>◀️ Prev</button>
                            <div className="d-flex gap-1" style={{ margin: '0 8px' }}>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button key={page} className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCurrentPage(page)} style={{ minWidth: 36 }}>{page}</button>
                                ))}
                            </div>
                            <button className="btn btn-sm btn-ghost" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}>Next ▶️</button>
                            <button className="btn btn-sm btn-ghost" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}>Last ⏭️</button>
                        </div>
                    </div>
                )}
                {totalPages <= 1 && totalEmployees > 0 && (
                    <div style={{ marginTop: 16, fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>Showing all {totalEmployees} employees</div>
                )}
            </div>
        </div>
    );
}


function DepartmentsPage() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        departmentAPI.getAll().then(res => setDepartments(res.data)).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header"><h1 className="page-title">Departments 🏢</h1></div>
            <div className="grid grid-3">
                {departments.map(d => (
                    <div key={d.id} className="glass-card p-2 card-3d">
                        <h3 className="mb-1">{d.name}</h3>
                        <p className="text-muted mb-1">{d.description}</p>
                        <span className="badge badge-info">{d._count?.users} members</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AttendancePage() {
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchAttendance = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await attendanceAPI.getAll({ date });
            setAttendances(res.data.attendances || []);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial fetch and when date changes
    useEffect(() => {
        fetchAttendance(true);
    }, [date]);

    // Auto-refresh every 3 seconds for real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            fetchAttendance(false);
        }, 3000);
        return () => clearInterval(interval);
    }, [date]);

    const handleManualRefresh = () => {
        fetchAttendance(false);
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header" style={{ marginBottom: 20 }}>
                <div className="d-flex justify-between align-center" style={{ flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 className="page-title">Attendance 📅</h1>
                        {lastUpdated && (
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                                Last updated: {lastUpdated.toLocaleTimeString()}
                                {refreshing && <span style={{ marginLeft: 8 }}>🔄 Refreshing...</span>}
                            </p>
                        )}
                    </div>
                    <div className="d-flex gap-1 align-center" style={{ flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleManualRefresh}
                            disabled={refreshing}
                            style={{ padding: '8px 16px' }}
                        >
                            🔄 Refresh
                        </button>
                        <input
                            type="date"
                            className="input-field"
                            style={{
                                minWidth: 140,
                                maxWidth: 200,
                                WebkitAppearance: 'none',
                                appearance: 'none'
                            }}
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? <div className="text-center p-3"><div className="spinner"></div></div> : (
                <div className="glass-card p-2">
                    {attendances.length === 0 ? (
                        <div className="text-center p-3" style={{ color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                            <h3>No Attendance Records</h3>
                            <p>No employees have checked in for {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.</p>
                            <p style={{ fontSize: 12 }}>Records will appear here automatically when employees check in.</p>
                        </div>
                    ) : (
                        <table className="data-table"><thead><tr><th>Employee</th><th>Position</th><th>Check In</th><th>Check Out</th><th>Break</th><th>Work</th><th>Status</th></tr></thead>
                            <tbody>{attendances.map(a => (
                                <tr key={a.id}><td>{a.user?.name}</td><td>{a.user?.position}</td><td>{a.checkIn ? new Date(a.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td><td>{a.checkOut ? new Date(a.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td><td>{a.totalBreakTime || 0}m</td><td>{a.totalWorkTime || 0}m</td><td><span className={`badge badge-${a.status === 'present' ? 'success' : 'warning'}`}>{a.status}</span></td></tr>
                            ))}</tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}

function PayrollPage() {
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        payrollAPI.getAll().then(res => setPayrolls(res.data.payrolls)).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    const summary = {
        total: payrolls.reduce((s, p) => s + p.netSalary, 0),
        paid: payrolls.filter(p => p.status === 'paid').reduce((s, p) => s + p.netSalary, 0),
        pending: payrolls.filter(p => p.status !== 'paid').reduce((s, p) => s + p.netSalary, 0)
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header"><h1 className="page-title">Payroll Overview 💰</h1></div>

            <div className="grid grid-3 mb-3">
                <div className="glass-card stat-card"><div className="stat-value gradient-text">${summary.total.toLocaleString()}</div><div className="stat-label">Total Payroll</div></div>
                <div className="glass-card stat-card"><div className="stat-value" style={{ color: '#38ef7d' }}>${summary.paid.toLocaleString()}</div><div className="stat-label">Paid</div></div>
                <div className="glass-card stat-card"><div className="stat-value" style={{ color: '#f97316' }}>${summary.pending.toLocaleString()}</div><div className="stat-label">Pending</div></div>
            </div>

            <div className="glass-card p-2">
                <table className="data-table"><thead><tr><th>Employee</th><th>Month</th><th>Basic</th><th>Bonus</th><th>Net</th><th>Status</th></tr></thead>
                    <tbody>{payrolls.slice(0, 10).map(p => (
                        <tr key={p.id}><td>{p.user?.name}</td><td>{p.month}</td><td>${p.basicSalary.toLocaleString()}</td><td>${p.bonus.toLocaleString()}</td><td><strong>${p.netSalary.toLocaleString()}</strong></td><td><span className={`badge badge-${p.status === 'paid' ? 'success' : 'pending'}`}>{p.status}</span></td></tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}

function ReportsPage() {
    const [chartData, setChartData] = useState([]);
    const [deptStats, setDeptStats] = useState([]);

    useEffect(() => {
        Promise.all([dashboardAPI.getAttendanceChart(), dashboardAPI.getDepartmentStats()])
            .then(([c, d]) => { setChartData(c.data); setDeptStats(d.data); });
    }, []);

    return (
        <div className="animate-fade-in">
            <div className="page-header"><h1 className="page-title">Reports & Analytics 📊</h1></div>

            <div className="grid grid-2">
                <div className="glass-card p-3">
                    <h3 className="mb-2">📅 Weekly Attendance</h3>
                    <div className="d-flex align-center gap-1" style={{ height: 200 }}>
                        {chartData.map((d, i) => (
                            <div key={i} className="text-center" style={{ flex: 1 }}>
                                <div style={{ height: 150, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                    <div style={{ width: 40, height: `${(d.count / Math.max(...chartData.map(x => x.count || 1))) * 100}%`, background: 'var(--primary-gradient)', borderRadius: 8, minHeight: 10 }}></div>
                                </div>
                                <div style={{ fontSize: 12, marginTop: 8 }}>{d.day}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.count}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass-card p-3">
                    <h3 className="mb-2">🏢 Department Distribution</h3>
                    {deptStats.map((d, i) => (
                        <div key={i} className="d-flex align-center justify-between p-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <span>{d.name}</span>
                            <span className="badge badge-info">{d.employeeCount}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
