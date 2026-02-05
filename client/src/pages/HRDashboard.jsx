import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';
import { dashboardAPI, employeeAPI, departmentAPI, attendanceAPI, leaveAPI, payrollAPI, announcementAPI, hiringAPI, authAPI, passwordResetAPI } from '../services/api';

const menuItems = [
    { path: '/hr', label: 'Dashboard', icon: '🏠', exact: true },
    { path: '/hr/pending-approvals', label: 'Pending Approvals', icon: '✅' },
    { path: '/hr/employees', label: 'Employees', icon: '👥' },
    { path: '/hr/departments', label: 'Departments', icon: '🏢' },
    { path: '/hr/attendance', label: 'Attendance', icon: '📅' },
    { path: '/hr/leaves', label: 'Leave Requests', icon: '🏖️' },
    { path: '/hr/payroll', label: 'Payroll', icon: '💰' },
    { path: '/hr/hiring', label: 'Hiring', icon: '💼' },
    { path: '/hr/announcements', label: 'Announcements', icon: '📢' }
];

export default function HRDashboard() {
    return (
        <div className="app-container">
            <Sidebar role="hr" menuItems={menuItems} />
            <main className="main-content">
                <Routes>
                    <Route index element={<DashboardHome />} />
                    <Route path="pending-approvals" element={<PendingApprovalsPage />} />
                    <Route path="employees" element={<EmployeesPage />} />
                    <Route path="departments" element={<DepartmentsPage />} />
                    <Route path="attendance" element={<AttendancePage />} />
                    <Route path="leaves" element={<LeavesPage />} />
                    <Route path="payroll" element={<PayrollPage />} />
                    <Route path="hiring" element={<HiringPage />} />
                    <Route path="announcements" element={<AnnouncementsPage />} />
                </Routes>
            </main>
        </div>
    );
}

function DashboardHome() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [liveStatus, setLiveStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    // Keep modal only for live status cards (working, onBreak, checkedOut)
    const [activeModal, setActiveModal] = useState(null);
    const [modalData, setModalData] = useState([]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchLiveStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, liveRes] = await Promise.all([
                dashboardAPI.getStats(),
                attendanceAPI.getLiveStatus()
            ]);
            setStats(statsRes.data);
            setLiveStatus(liveRes.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLiveStatus = async () => {
        try {
            const response = await attendanceAPI.getLiveStatus();
            setLiveStatus(response.data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    // Modal handlers - Only for live status cards
    const openModal = (type) => {
        setActiveModal(type);
        let data = [];
        switch (type) {
            case 'working':
                data = liveStatus?.working || [];
                break;
            case 'onBreak':
                data = liveStatus?.onBreak || [];
                break;
            case 'checkedOut':
                data = liveStatus?.checkedOut || [];
                break;
        }
        setModalData(data);
    };

    const closeModal = () => {
        setActiveModal(null);
        setModalData([]);
    };

    const handleLeaveAction = async (id, status) => {
        try {
            await leaveAPI.updateStatus(id, status);
            openModal('leaves');
            fetchData();
        } catch (error) {
            console.error('Error updating leave:', error);
        }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    const cardStyle = { cursor: 'pointer', transition: 'all 0.3s ease' };
    const hoverIn = (e) => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'; };
    const hoverOut = (e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">HR Dashboard 🎯</h1>
                <p className="page-subtitle">Welcome back, {user?.name}</p>
            </div>

            {/* Clickable Stats Cards - Navigate to Pages */}
            <div className="grid grid-4 mb-3">
                <div className="glass-card stat-card card-3d" style={cardStyle} onClick={() => navigate('/hr/employees')} onMouseOver={hoverIn} onMouseOut={hoverOut}>
                    <div className="stat-icon" style={{ background: 'var(--primary-gradient)' }}>👥</div>
                    <div className="stat-value gradient-text">{stats?.totalEmployees || 0}</div>
                    <div className="stat-label">Total Employees</div>
                </div>
                <div className="glass-card stat-card card-3d" style={cardStyle} onClick={() => navigate('/hr/attendance')} onMouseOver={hoverIn} onMouseOut={hoverOut}>
                    <div className="stat-icon" style={{ background: 'var(--success-gradient)' }}>✅</div>
                    <div className="stat-value gradient-text">{stats?.todayAttendance || 0}</div>
                    <div className="stat-label">Present Today</div>
                </div>
                <div className="glass-card stat-card card-3d" style={cardStyle} onClick={() => navigate('/hr/leaves')} onMouseOver={hoverIn} onMouseOut={hoverOut}>
                    <div className="stat-icon" style={{ background: 'var(--warning-gradient)' }}>📝</div>
                    <div className="stat-value gradient-text">{stats?.pendingLeaves || 0}</div>
                    <div className="stat-label">Pending Leaves</div>
                </div>
                <div className="glass-card stat-card card-3d" style={cardStyle} onClick={() => navigate('/hr/employees')} onMouseOver={hoverIn} onMouseOut={hoverOut}>
                    <div className="stat-icon" style={{ background: 'var(--info-gradient)' }}>🆕</div>
                    <div className="stat-value gradient-text">{stats?.newHiresThisMonth || 0}</div>
                    <div className="stat-label">New Hires (Month)</div>
                </div>
            </div>

            {/* Clickable Live Status */}
            <div className="grid grid-3 mb-3">
                <div className="glass-card p-2" style={cardStyle} onClick={() => openModal('working')} onMouseOver={hoverIn} onMouseOut={hoverOut}>
                    <h3 className="mb-1">🟢 Working ({liveStatus?.summary?.working || 0})</h3>
                    <div style={{ maxHeight: 150, overflow: 'auto' }}>
                        {liveStatus?.working?.slice(0, 3).map(emp => (
                            <div key={emp.id} className="d-flex align-center gap-1 p-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{emp.user?.name?.charAt(0)}</div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>{emp.user?.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.user?.position}</div>
                                </div>
                            </div>
                        ))}
                        {(liveStatus?.working?.length || 0) > 3 && (
                            <div className="text-center p-1" style={{ fontSize: 12, color: 'var(--accent-blue)' }}>
                                Click to see all {liveStatus?.working?.length}
                            </div>
                        )}
                        {(!liveStatus?.working || liveStatus?.working?.length === 0) && (
                            <p className="text-muted" style={{ fontSize: 13 }}>No one working yet</p>
                        )}
                    </div>
                </div>
                <div className="glass-card p-2" style={cardStyle} onClick={() => openModal('onBreak')} onMouseOver={hoverIn} onMouseOut={hoverOut}>
                    <h3 className="mb-1">☕ On Break ({liveStatus?.summary?.onBreak || 0})</h3>
                    <div style={{ maxHeight: 150, overflow: 'auto' }}>
                        {liveStatus?.onBreak?.slice(0, 3).map(emp => (
                            <div key={emp.id} className="d-flex align-center gap-1 p-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, background: 'var(--warning-gradient)' }}>{emp.user?.name?.charAt(0)}</div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>{emp.user?.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.user?.position}</div>
                                </div>
                            </div>
                        ))}
                        {(liveStatus?.onBreak?.length || 0) > 3 && (
                            <div className="text-center p-1" style={{ fontSize: 12, color: 'var(--accent-blue)' }}>
                                Click to see all {liveStatus?.onBreak?.length}
                            </div>
                        )}
                        {(!liveStatus?.onBreak || liveStatus?.onBreak?.length === 0) && (
                            <p className="text-muted" style={{ fontSize: 13 }}>No one on break</p>
                        )}
                    </div>
                </div>
                <div className="glass-card p-2" style={cardStyle} onClick={() => openModal('checkedOut')} onMouseOver={hoverIn} onMouseOut={hoverOut}>
                    <h3 className="mb-1">🏠 Checked Out ({liveStatus?.summary?.checkedOut || 0})</h3>
                    <div style={{ maxHeight: 150, overflow: 'auto' }}>
                        {liveStatus?.checkedOut?.slice(0, 3).map(emp => (
                            <div key={emp.id} className="d-flex align-center gap-1 p-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, background: 'var(--danger-gradient)' }}>{emp.user?.name?.charAt(0)}</div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>{emp.user?.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.user?.position}</div>
                                </div>
                            </div>
                        ))}
                        {(liveStatus?.checkedOut?.length || 0) > 3 && (
                            <div className="text-center p-1" style={{ fontSize: 12, color: 'var(--accent-blue)' }}>
                                Click to see all {liveStatus?.checkedOut?.length}
                            </div>
                        )}
                        {(!liveStatus?.checkedOut || liveStatus?.checkedOut?.length === 0) && (
                            <p className="text-muted" style={{ fontSize: 13 }}>No one left yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Dynamic Modals */}
            {activeModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '80vh', overflow: 'auto' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {activeModal === 'employees' && '👥 All Employees'}
                                {activeModal === 'present' && '✅ Present Today'}
                                {activeModal === 'leaves' && '📝 Pending Leaves'}
                                {activeModal === 'newHires' && '🆕 New Hires This Month'}
                                {activeModal === 'working' && '🟢 Currently Working'}
                                {activeModal === 'onBreak' && '☕ On Break'}
                                {activeModal === 'checkedOut' && '🏠 Checked Out'}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>

                        {modalLoading ? (
                            <div className="text-center p-3"><div className="spinner"></div></div>
                        ) : modalData.length === 0 ? (
                            <div className="text-center p-3" style={{ color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                                <p>No data available</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {/* Employees List */}
                                {activeModal === 'employees' && modalData.map(emp => (
                                    <div key={emp.id} className="glass-card p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div className="d-flex align-center gap-2">
                                            <div className="avatar" style={{ width: 40, height: 40 }}>{emp.name?.charAt(0)}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600 }}>{emp.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.position} • {emp.email}</div>
                                            </div>
                                            <span className={`badge badge-${emp.role === 'admin' ? 'danger' : emp.role === 'hr' ? 'success' : emp.role === 'manager' ? 'info' : 'pending'}`}>{emp.role}</span>
                                        </div>
                                    </div>
                                ))}

                                {/* New Hires */}
                                {activeModal === 'newHires' && modalData.map(emp => (
                                    <div key={emp.id} className="glass-card p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div className="d-flex align-center gap-2">
                                            <div className="avatar" style={{ width: 40, height: 40, background: 'var(--success-gradient)' }}>{emp.name?.charAt(0)}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600 }}>{emp.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.position} • {emp.department?.name || 'No Department'}</div>
                                            </div>
                                            <span className="badge badge-success">New</span>
                                        </div>
                                    </div>
                                ))}

                                {/* Present Today */}
                                {activeModal === 'present' && modalData.map(att => (
                                    <div key={att.id} className="glass-card p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div className="d-flex justify-between align-center">
                                            <div className="d-flex align-center gap-2">
                                                <div className="avatar" style={{ width: 36, height: 36 }}>{att.user?.name?.charAt(0)}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{att.user?.name}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{att.user?.position}</div>
                                                </div>
                                            </div>
                                            <div className="text-right" style={{ fontSize: 12 }}>
                                                <div>In: {att.checkIn ? new Date(att.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                                                <div>Out: {att.checkOut ? new Date(att.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Working'}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Pending Leaves with Actions */}
                                {activeModal === 'leaves' && modalData.map(leave => (
                                    <div key={leave.id} className="glass-card p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div className="d-flex justify-between align-center mb-1">
                                            <div className="d-flex align-center gap-2">
                                                <div className="avatar" style={{ width: 36, height: 36 }}>{leave.user?.name?.charAt(0)}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{leave.user?.name}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{leave.type} leave</div>
                                                </div>
                                            </div>
                                            <div className="d-flex gap-1">
                                                <button className="btn btn-sm btn-success" onClick={() => handleLeaveAction(leave.id, 'approved')}>✓ Approve</button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleLeaveAction(leave.id, 'rejected')}>✗ Reject</button>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            📅 {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                            <br />📝 {leave.reason}
                                        </div>
                                    </div>
                                ))}

                                {/* Working/Break/Checked Out */}
                                {(activeModal === 'working' || activeModal === 'onBreak' || activeModal === 'checkedOut') && modalData.map(emp => (
                                    <div key={emp.id} className="glass-card p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div className="d-flex justify-between align-center">
                                            <div className="d-flex align-center gap-2">
                                                <div className="avatar" style={{
                                                    width: 36, height: 36,
                                                    background: activeModal === 'working' ? 'var(--success-gradient)' : activeModal === 'onBreak' ? 'var(--warning-gradient)' : 'var(--danger-gradient)'
                                                }}>{emp.user?.name?.charAt(0)}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{emp.user?.name}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.user?.position}</div>
                                                </div>
                                            </div>
                                            <div className="text-right" style={{ fontSize: 12 }}>
                                                <div>In: {emp.checkIn ? new Date(emp.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                                                {emp.checkOut && <div>Out: {new Date(emp.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>}
                                            </div>
                                        </div>
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
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', position: '', phone: '', salary: '', departmentId: '' });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const limit = 10; // Items per page

    useEffect(() => { fetchData(); }, [currentPage]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [empRes, deptRes] = await Promise.all([
                employeeAPI.getAll({ page: currentPage, limit }),
                departmentAPI.getAll()
            ]);
            setEmployees(empRes.data.employees);
            setTotalPages(empRes.data.pagination?.pages || 1);
            setTotalEmployees(empRes.data.pagination?.total || empRes.data.employees?.length || 0);
            setDepartments(deptRes.data);
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await employeeAPI.update(editingId, form);
            } else {
                await employeeAPI.create(form);
            }
            setShowForm(false);
            setEditingId(null);
            setForm({ name: '', email: '', password: '', role: 'employee', position: '', phone: '', salary: '', departmentId: '' });
            fetchData();
        } catch (error) { alert(error.response?.data?.error || 'Failed'); }
    };

    const handleEdit = (emp) => {
        setForm({ ...emp, password: '' });
        setEditingId(emp.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this employee?')) {
            try { await employeeAPI.delete(id); fetchData(); }
            catch (error) { alert('Failed to delete'); }
        }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header d-flex justify-between align-center">
                <div><h1 className="page-title">Employees 👥</h1><p className="page-subtitle">Manage employee records</p></div>
                {!showForm && (
                    <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm({ name: '', email: '', password: '', role: 'employee', position: '', phone: '', salary: '', departmentId: '' }); setShowForm(true); }}>+ Add Employee</button>
                )}
            </div>

            {showForm ? (
                <div className="animate-fade-in">
                    <div className="d-flex justify-between align-center mb-3">
                        <h2 style={{ margin: 0 }}>👤 {editingId ? 'Edit' : 'Add'} Employee</h2>
                        <button
                            className="btn btn-ghost"
                            onClick={() => { setShowForm(false); setEditingId(null); }}
                            style={{ fontSize: 18 }}
                        >
                            ← Back to Employee List
                        </button>
                    </div>

                    <div className="glass-card p-3">
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                                <div className="input-group">
                                    <label className="input-label">Full Name *</label>
                                    <input
                                        className="input-field"
                                        placeholder="Enter full name"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Email Address *</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        placeholder="Enter email address"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        required
                                    />
                                </div>
                                {!editingId && (
                                    <div className="input-group">
                                        <label className="input-label">Password *</label>
                                        <input
                                            type="password"
                                            className="input-field"
                                            placeholder="Create a password"
                                            value={form.password}
                                            onChange={e => setForm({ ...form, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                )}
                                <div className="input-group">
                                    <label className="input-label">Role</label>
                                    <select className="input-field select-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                        <option value="employee">Employee</option>
                                        <option value="manager">Manager</option>
                                        <option value="hr">HR</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Position</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. Software Developer"
                                        value={form.position || ''}
                                        onChange={e => setForm({ ...form, position: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Phone Number</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. +1 234 567 8900"
                                        value={form.phone || ''}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Salary ($)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="e.g. 50000"
                                        value={form.salary || ''}
                                        onChange={e => setForm({ ...form, salary: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Department</label>
                                    <select className="input-field select-field" value={form.departmentId || ''} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
                                        <option value="">-- Select Department --</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                                <button type="submit" className="btn btn-primary">{editingId ? '💾 Update Employee' : '✅ Create Employee'}</button>
                                <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="glass-card p-2" style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ minWidth: 900 }}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Position</th>
                                <th>Department</th>
                                <th>Salary</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => (
                                <tr key={emp.id}>
                                    <td>{emp.name}</td>
                                    <td>{emp.email}</td>
                                    <td>
                                        <span className={`badge badge-${emp.role === 'admin' ? 'danger' : emp.role === 'hr' ? 'success' : emp.role === 'manager' ? 'info' : 'pending'}`}>
                                            {emp.role}
                                        </span>
                                    </td>
                                    <td>{emp.position || '-'}</td>
                                    <td>{emp.department?.name || '-'}</td>
                                    <td>${emp.salary?.toLocaleString() || '-'}</td>
                                    <td>
                                        <div className="d-flex gap-1">
                                            <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(emp)}>✏️</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(emp.id)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-between align-center" style={{ marginTop: 20, padding: '12px 16px', background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', flexWrap: 'wrap', gap: 12 }}>
                            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                                Showing {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, totalEmployees)} of {totalEmployees} employees
                            </span>

                            <div className="d-flex gap-1 align-center">
                                <button
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                                >
                                    ⏮️ First
                                </button>
                                <button
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                                >
                                    ◀️ Prev
                                </button>

                                {/* Page Numbers */}
                                <div className="d-flex gap-1" style={{ margin: '0 8px' }}>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-ghost'}`}
                                            onClick={() => setCurrentPage(page)}
                                            style={{ minWidth: 36 }}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                                >
                                    Next ▶️
                                </button>
                                <button
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                                >
                                    Last ⏭️
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Total count when single page */}
                    {totalPages <= 1 && totalEmployees > 0 && (
                        <div style={{ marginTop: 16, fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>
                            Showing all {totalEmployees} employees
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function DepartmentsPage() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', description: '' });

    useEffect(() => { fetchDepartments(); }, []);

    const fetchDepartments = async () => {
        try { const res = await departmentAPI.getAll(); setDepartments(res.data); }
        catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try { await departmentAPI.create(form); setShowForm(false); setForm({ name: '', description: '' }); fetchDepartments(); }
        catch (error) { alert(error.response?.data?.error || 'Failed'); }
    };

    const handleDelete = async (id) => {
        if (confirm('Delete department?')) {
            try { await departmentAPI.delete(id); fetchDepartments(); }
            catch (error) { alert(error.response?.data?.error || 'Cannot delete'); }
        }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header d-flex justify-between align-center">
                <div><h1 className="page-title">Departments 🏢</h1><p className="page-subtitle">Manage company departments</p></div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Department</button>
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3 className="modal-title">Add Department</h3><button className="modal-close" onClick={() => setShowForm(false)}>×</button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group"><label className="input-label">Name</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                            <div className="input-group"><label className="input-label">Description</label><textarea className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            <button type="submit" className="btn btn-primary w-full">Create</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-3">
                {departments.map(dept => (
                    <div key={dept.id} className="glass-card p-2 card-3d">
                        <h3 className="mb-1">{dept.name}</h3>
                        <p className="text-muted mb-1">{dept.description || 'No description'}</p>
                        <div className="d-flex justify-between align-center">
                            <span className="badge badge-info">{dept._count?.users || 0} members</span>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(dept.id)}>🗑️</button>
                        </div>
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
            console.error('Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchAttendance(true); }, [date]);

    // Auto-refresh every 3 seconds for real-time updates
    useEffect(() => {
        const interval = setInterval(() => fetchAttendance(false), 3000);
        return () => clearInterval(interval);
    }, [date]);

    return (
        <div className="animate-fade-in">
            <div className="page-header d-flex justify-between align-center">
                <div>
                    <h1 className="page-title">Attendance Records 📅</h1>
                    {lastUpdated && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Last updated: {lastUpdated.toLocaleTimeString()} {refreshing && '🔄'}</p>}
                </div>
                <div className="d-flex gap-1">
                    <button className="btn btn-primary" onClick={() => fetchAttendance(false)} disabled={refreshing}>🔄 Refresh</button>
                    <input type="date" className="input-field" style={{ width: 200 }} value={date} onChange={e => setDate(e.target.value)} />
                </div>
            </div>

            {loading ? <div className="loading-overlay"><div className="spinner"></div></div> : (
                <div className="glass-card p-2">
                    {attendances.length === 0 ? (
                        <div className="text-center p-3" style={{ color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                            <h3>No Attendance Records</h3>
                            <p>No employees have checked in for this date. Records will appear automatically.</p>
                        </div>
                    ) : (
                        <table className="data-table"><thead><tr><th>Employee</th><th>Position</th><th>Check In</th><th>Check Out</th><th>Break Time</th><th>Work Time</th><th>Status</th></tr></thead>
                            <tbody>{attendances.map(att => (
                                <tr key={att.id}><td>{att.user?.name}</td><td>{att.user?.position}</td><td>{att.checkIn ? new Date(att.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td><td>{att.checkOut ? new Date(att.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td><td>{att.totalBreakTime || 0} mins</td><td>{att.totalWorkTime || 0} mins</td><td><span className={`badge badge-${att.status === 'present' ? 'success' : 'warning'}`}>{att.status}</span></td></tr>
                            ))}</tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}

function LeavesPage() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchLeaves(); }, []);

    const fetchLeaves = async () => {
        try { const res = await leaveAPI.getAll(); setLeaves(res.data.leaves); }
        catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const updateStatus = async (id, status) => {
        try { await leaveAPI.updateStatus(id, status); fetchLeaves(); }
        catch (error) { alert('Failed'); }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header"><h1 className="page-title">Leave Requests 🏖️</h1><p className="page-subtitle">Approve or reject leave requests</p></div>

            <div className="glass-card p-2">
                <table className="data-table"><thead><tr><th>Employee</th><th>Type</th><th>Start</th><th>End</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>{leaves.map(leave => (
                        <tr key={leave.id}><td>{leave.user?.name}</td><td style={{ textTransform: 'capitalize' }}>{leave.type}</td><td>{new Date(leave.startDate).toLocaleDateString()}</td><td>{new Date(leave.endDate).toLocaleDateString()}</td><td>{leave.reason}</td><td><span className={`badge badge-${leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'danger' : 'pending'}`}>{leave.status}</span></td>
                            <td>{leave.status === 'pending' && <div className="d-flex gap-1"><button className="btn btn-sm btn-success" onClick={() => updateStatus(leave.id, 'approved')}>✓</button><button className="btn btn-sm btn-danger" onClick={() => updateStatus(leave.id, 'rejected')}>✗</button></div>}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}

function PayrollPage() {
    const [payrolls, setPayrolls] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ userId: '', month: '', basicSalary: '', bonus: '0', deductions: '0' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [payRes, empRes] = await Promise.all([payrollAPI.getAll(), employeeAPI.getAll()]);
            setPayrolls(payRes.data.payrolls);
            setEmployees(empRes.data.employees);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try { await payrollAPI.create(form); setShowForm(false); setForm({ userId: '', month: '', basicSalary: '', bonus: '0', deductions: '0' }); fetchData(); }
        catch (error) { alert(error.response?.data?.error || 'Failed'); }
    };

    const handlePay = async (id) => {
        try { await payrollAPI.pay(id); fetchData(); }
        catch (error) { alert('Failed'); }
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this record?')) {
            try { await payrollAPI.delete(id); fetchData(); }
            catch (error) { alert('Failed'); }
        }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header d-flex justify-between align-center">
                <div><h1 className="page-title">Payroll 💰</h1><p className="page-subtitle">Manage employee salaries</p></div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Record</button>
            </div>

            {showForm ? (
                <div className="animate-fade-in">
                    <div className="d-flex justify-between align-center mb-3">
                        <h2 style={{ margin: 0 }}>💰 Add Payroll Record</h2>
                        <button
                            className="btn btn-ghost"
                            onClick={() => setShowForm(false)}
                            style={{ fontSize: 18 }}
                        >
                            ← Back to Payroll List
                        </button>
                    </div>

                    <div className="glass-card p-3">
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label className="input-label">Select Employee *</label>
                                <select
                                    className="input-field select-field"
                                    value={form.userId}
                                    onChange={e => setForm({ ...form, userId: e.target.value })}
                                    required
                                >
                                    <option value="">-- Choose an employee --</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.position || e.role})</option>)}
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Payroll Month *</label>
                                <input
                                    type="month"
                                    className="input-field"
                                    value={form.month}
                                    onChange={e => setForm({ ...form, month: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                                <div className="input-group">
                                    <label className="input-label">Basic Salary ($) *</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="e.g. 5000"
                                        value={form.basicSalary}
                                        onChange={e => setForm({ ...form, basicSalary: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Bonus ($)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="0"
                                        value={form.bonus}
                                        onChange={e => setForm({ ...form, bonus: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Deductions ($)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="0"
                                        value={form.deductions}
                                        onChange={e => setForm({ ...form, deductions: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="d-flex gap-2" style={{ marginTop: 24 }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '14px' }}>
                                    ✅ Create Payroll Record
                                </button>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ padding: '14px 24px' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <>

                    <div className="glass-card p-2" style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ minWidth: 800 }}>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Month</th>
                                    <th>Basic</th>
                                    <th>Bonus</th>
                                    <th>Deductions</th>
                                    <th>Net Salary</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrolls.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.user?.name}</td>
                                        <td>{p.month}</td>
                                        <td>${p.basicSalary.toLocaleString()}</td>
                                        <td className="text-success">+${p.bonus.toLocaleString()}</td>
                                        <td className="text-danger">-${p.deductions.toLocaleString()}</td>
                                        <td><strong>${p.netSalary.toLocaleString()}</strong></td>
                                        <td>
                                            <span className={`badge badge-${p.status === 'paid' ? 'success' : p.status === 'processed' ? 'info' : 'pending'}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                {p.status !== 'paid' && (
                                                    <button className="btn btn-sm btn-success" onClick={() => handlePay(p.id)}>💸 Pay</button>
                                                )}
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', content: '', priority: 'normal' });

    useEffect(() => { fetchAnnouncements(); }, []);

    const fetchAnnouncements = async () => {
        try { const res = await announcementAPI.getAll({ includeInactive: 'true' }); setAnnouncements(res.data); }
        catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try { await announcementAPI.create(form); setShowForm(false); setForm({ title: '', content: '', priority: 'normal' }); fetchAnnouncements(); }
        catch (error) { alert('Failed'); }
    };

    const handleDelete = async (id) => {
        if (confirm('Delete announcement?')) {
            try { await announcementAPI.delete(id); fetchAnnouncements(); }
            catch (error) { alert('Failed'); }
        }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header d-flex justify-between align-center">
                <div><h1 className="page-title">Announcements 📢</h1><p className="page-subtitle">Create and manage announcements</p></div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Announcement</button>
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3 className="modal-title">New Announcement</h3><button className="modal-close" onClick={() => setShowForm(false)}>×</button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group"><label className="input-label">Title</label><input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                            <div className="input-group"><label className="input-label">Content</label><textarea className="input-field" rows="4" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required /></div>
                            <div className="input-group"><label className="input-label">Priority</label><select className="input-field select-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
                            <button type="submit" className="btn btn-primary w-full">Post</button>
                        </form>
                    </div>
                </div>
            )}

            {announcements.map(ann => (
                <div key={ann.id} className="glass-card p-2 mb-2">
                    <div className="d-flex justify-between align-center mb-1">
                        <h3>{ann.title}</h3>
                        <div className="d-flex gap-1 align-center">
                            <span className={`badge badge-${ann.priority === 'urgent' || ann.priority === 'high' ? 'danger' : ann.priority === 'normal' ? 'info' : 'pending'}`}>{ann.priority}</span>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(ann.id)}>🗑️</button>
                        </div>
                    </div>
                    <p className="text-muted">{ann.content}</p>
                    <p className="text-muted mt-1" style={{ fontSize: 12 }}>{new Date(ann.createdAt).toLocaleDateString()}</p>
                </div>
            ))}
        </div>
    );
}

function HiringPage() {
    const [hirings, setHirings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null); // For viewing job details
    const [form, setForm] = useState({
        title: '',
        department: '',
        location: '',
        type: 'full-time',
        salaryRange: '',
        description: '',
        requirements: ''
    });

    const resetForm = () => {
        setForm({ title: '', department: '', location: '', type: 'full-time', salaryRange: '', description: '', requirements: '' });
        setEditingId(null);
        setShowForm(false);
    };

    useEffect(() => { fetchHirings(); }, []);

    const fetchHirings = async () => {
        try {
            const res = await hiringAPI.getAll();
            setHirings(res.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await hiringAPI.update(editingId, form);
            } else {
                await hiringAPI.create(form);
            }
            resetForm();
            fetchHirings();
        } catch (error) { alert(error.response?.data?.error || 'Failed to save'); }
    };

    const handleEdit = (hiring) => {
        setForm({ ...hiring });
        setEditingId(hiring.id);
        setShowForm(true);
    };

    const handleStatusChange = async (id, status) => {
        try {
            await hiringAPI.update(id, { status });
            fetchHirings();
        } catch (error) { alert('Failed to update status'); }
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this job posting?')) {
            try { await hiringAPI.delete(id); fetchHirings(); }
            catch (error) { alert('Failed to delete'); }
        }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            {/* Page Header - only show when not viewing details or form */}
            {!showForm && !selectedJob && (
                <div className="page-header" style={{ marginBottom: 20 }}>
                    <div className="d-flex justify-between align-center" style={{ flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h1 className="page-title">Hiring 💼</h1>
                            <p className="page-subtitle">Manage job postings and recruitment</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                            + Post New Job
                        </button>
                    </div>
                </div>
            )}

            {/* Form View */}
            {showForm ? (
                <div className="animate-fade-in">
                    <div className="d-flex justify-between align-center mb-3" style={{ flexWrap: 'wrap', gap: 12 }}>
                        <h2 style={{ margin: 0 }}>💼 {editingId ? 'Edit' : 'Post New'} Job</h2>
                        <button className="btn btn-ghost" onClick={resetForm} style={{ fontSize: 18 }}>
                            ← Back to Job Listings
                        </button>
                    </div>

                    <div className="glass-card p-3">
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label className="input-label">Job Title *</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. Senior Developer"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                                <div className="input-group">
                                    <label className="input-label">Department *</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. Engineering"
                                        value={form.department}
                                        onChange={e => setForm({ ...form, department: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Location *</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. Remote, Mumbai"
                                        value={form.location}
                                        onChange={e => setForm({ ...form, location: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Employment Type</label>
                                    <select
                                        className="input-field select-field"
                                        value={form.type}
                                        onChange={e => setForm({ ...form, type: e.target.value })}
                                    >
                                        <option value="full-time">Full Time</option>
                                        <option value="part-time">Part Time</option>
                                        <option value="contract">Contract</option>
                                        <option value="internship">Internship</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Salary Range</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. ₹8-12 LPA"
                                        value={form.salaryRange || ''}
                                        onChange={e => setForm({ ...form, salaryRange: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Job Description *</label>
                                <textarea
                                    className="input-field"
                                    rows="5"
                                    placeholder="Describe the role, responsibilities, and what the day-to-day looks like..."
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Requirements *</label>
                                <textarea
                                    className="input-field"
                                    rows="5"
                                    placeholder="List qualifications, skills, and experience required..."
                                    value={form.requirements}
                                    onChange={e => setForm({ ...form, requirements: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="d-flex gap-2" style={{ marginTop: 20 }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '14px' }}>
                                    {editingId ? '✏️ Update Job' : '🚀 Post Job'}
                                </button>
                                <button type="button" className="btn btn-ghost" onClick={resetForm} style={{ padding: '14px 24px' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                /* Job Detail View */
            ) : selectedJob ? (
                <div className="animate-fade-in">
                    <div className="d-flex justify-between align-center mb-3" style={{ flexWrap: 'wrap', gap: 12 }}>
                        <h2 style={{ margin: 0 }}>📋 Job Details</h2>
                        <button className="btn btn-ghost" onClick={() => setSelectedJob(null)} style={{ fontSize: 18 }}>
                            ← Back to Job Listings
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
                            <span className={`badge badge-${selectedJob.status === 'open' ? 'success' : selectedJob.status === 'closed' ? 'danger' : 'pending'}`} style={{ fontSize: 14, padding: '8px 16px' }}>
                                {selectedJob.status?.toUpperCase()}
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

                        {/* HR Action Buttons */}
                        <div className="d-flex gap-2" style={{ marginTop: 24, flexWrap: 'wrap' }}>
                            {selectedJob.status === 'open' && (
                                <button className="btn btn-warning" onClick={() => { handleStatusChange(selectedJob.id, 'closed'); setSelectedJob({ ...selectedJob, status: 'closed' }); }}>
                                    🔒 Close Job
                                </button>
                            )}
                            {selectedJob.status === 'closed' && (
                                <button className="btn btn-success" onClick={() => { handleStatusChange(selectedJob.id, 'open'); setSelectedJob({ ...selectedJob, status: 'open' }); }}>
                                    🔓 Reopen Job
                                </button>
                            )}
                            <button className="btn btn-ghost" onClick={() => { handleEdit(selectedJob); setSelectedJob(null); }}>
                                ✏️ Edit
                            </button>
                            <button className="btn btn-danger" onClick={() => { handleDelete(selectedJob.id); setSelectedJob(null); }}>
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                </div>

                /* Job List View */
            ) : (
                <>
                    {hirings.length === 0 ? (
                        <div className="glass-card p-3 text-center" style={{ color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
                            <h3>No Job Postings Yet</h3>
                            <p>Create your first job posting to start recruiting!</p>
                        </div>
                    ) : (
                        <div className="grid grid-2">
                            {hirings.map(job => (
                                <div
                                    key={job.id}
                                    className="glass-card p-2 hover-lift"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setSelectedJob(job)}
                                >
                                    <div className="d-flex justify-between align-center mb-1" style={{ flexWrap: 'wrap', gap: 8 }}>
                                        <h3 style={{ margin: 0 }}>{job.title}</h3>
                                        <div className="d-flex gap-1 align-center">
                                            <span className={`badge badge-${job.status === 'open' ? 'success' : job.status === 'closed' ? 'danger' : 'pending'}`}>
                                                {job.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2 mb-1" style={{ flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)' }}>
                                        <span>🏢 {job.department}</span>
                                        <span>📍 {job.location}</span>
                                        <span>⏰ {job.type}</span>
                                        {job.salaryRange && <span>💰 {job.salaryRange}</span>}
                                    </div>
                                    <p className="text-muted mb-1" style={{ fontSize: 13 }}>{job.description.substring(0, 100)}...</p>
                                    <div className="d-flex justify-between align-center" style={{ marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                                        <div className="d-flex gap-1" onClick={e => e.stopPropagation()}>
                                            {job.status === 'open' && (
                                                <button className="btn btn-sm btn-ghost" onClick={() => handleStatusChange(job.id, 'closed')}>Close</button>
                                            )}
                                            {job.status === 'closed' && (
                                                <button className="btn btn-sm btn-ghost" onClick={() => handleStatusChange(job.id, 'open')}>Reopen</button>
                                            )}
                                            <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(job)}>✏️</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(job.id)}>🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// Pending Approvals Page - Approve/Reject new employee registrations & password resets
function PendingApprovalsPage() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [pendingResets, setPendingResets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [approvalData, setApprovalData] = useState({});
    const [resetPasswords, setResetPasswords] = useState({});
    const [activeTab, setActiveTab] = useState('registrations');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [pendingRes, deptRes, resetRes] = await Promise.all([
                authAPI.getPendingRegistrations(),
                departmentAPI.getAll(),
                passwordResetAPI.getPending()
            ]);
            setPendingUsers(pendingRes.data);
            setDepartments(deptRes.data);
            setPendingResets(resetRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            const data = approvalData[userId] || {};
            await authAPI.approveRegistration(userId, {
                department: data.department || null,
                position: data.position || null,
                salary: data.salary || null
            });
            fetchData();
            alert('Registration approved successfully!');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to approve');
        }
    };

    const handleReject = async (userId) => {
        if (!window.confirm('Are you sure you want to reject this registration?')) return;
        try {
            await authAPI.rejectRegistration(userId);
            fetchData();
            alert('Registration rejected.');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to reject');
        }
    };

    const updateApprovalData = (userId, field, value) => {
        setApprovalData(prev => ({
            ...prev,
            [userId]: { ...prev[userId], [field]: value }
        }));
    };

    // Password Reset Handlers
    const handleApproveReset = async (resetId) => {
        try {
            const newPassword = resetPasswords[resetId] || '';
            await passwordResetAPI.approve(resetId, newPassword || 'user123');
            fetchData();
            alert(`Password reset approved! ${newPassword ? 'New password set.' : 'Default password: user123'}`);
            setResetPasswords(prev => ({ ...prev, [resetId]: '' }));
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to approve reset');
        }
    };

    const handleRejectReset = async (resetId) => {
        if (!window.confirm('Are you sure you want to reject this password reset request?')) return;
        try {
            await passwordResetAPI.reject(resetId);
            fetchData();
            alert('Password reset rejected.');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to reject reset');
        }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    const totalPending = pendingUsers.length + pendingResets.length;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Pending Approvals ✅</h1>
                <p className="page-subtitle">Review and approve registrations & password resets ({totalPending} pending)</p>
            </div>

            {/* Tabs */}
            <div className="d-flex gap-1 mb-3">
                <button
                    className={`btn ${activeTab === 'registrations' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveTab('registrations')}
                >
                    👤 Registrations ({pendingUsers.length})
                </button>
                <button
                    className={`btn ${activeTab === 'passwords' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveTab('passwords')}
                >
                    🔑 Password Resets ({pendingResets.length})
                </button>
            </div>

            {/* Registrations Tab */}
            {activeTab === 'registrations' && (
                <>
                    {pendingUsers.length === 0 ? (
                        <div className="glass-card p-3 text-center">
                            <div style={{ fontSize: 48 }}>🎉</div>
                            <h3>No Pending Registrations</h3>
                            <p className="text-muted">All employee registrations have been processed.</p>
                        </div>
                    ) : (
                        <div className="grid grid-2">
                            {pendingUsers.map((user) => (
                                <div key={user.id} className="glass-card p-3">
                                    <div className="d-flex justify-between align-center mb-2">
                                        <h3 style={{ margin: 0 }}>{user.name}</h3>
                                        <span className="badge badge-pending">Pending</span>
                                    </div>

                                    <div className="mb-2" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                                        <p><strong>Email:</strong> {user.email}</p>
                                        <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
                                        <p><strong>Position:</strong> {user.position || 'Not specified'}</p>
                                        <p><strong>Applied:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                                    </div>

                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, marginTop: 16 }}>
                                        <p className="text-muted mb-1" style={{ fontSize: 12 }}>Assign Department & Details (Optional)</p>

                                        <div className="input-group" style={{ marginBottom: 8 }}>
                                            <select
                                                className="input-field select-field"
                                                value={approvalData[user.id]?.department || ''}
                                                onChange={(e) => updateApprovalData(user.id, 'department', e.target.value)}
                                                style={{ padding: 8, fontSize: 13 }}
                                            >
                                                <option value="">Select Department</option>
                                                {departments.map(dept => (
                                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="Position"
                                                value={approvalData[user.id]?.position || user.position || ''}
                                                onChange={(e) => updateApprovalData(user.id, 'position', e.target.value)}
                                                style={{ padding: 8, fontSize: 13 }}
                                            />
                                            <input
                                                type="number"
                                                className="input-field"
                                                placeholder="Salary"
                                                value={approvalData[user.id]?.salary || ''}
                                                onChange={(e) => updateApprovalData(user.id, 'salary', e.target.value)}
                                                style={{ padding: 8, fontSize: 13 }}
                                            />
                                        </div>

                                        <div className="d-flex gap-1">
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleApprove(user.id)}
                                                style={{ flex: 1 }}
                                            >
                                                ✅ Approve
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleReject(user.id)}
                                                style={{ flex: 1 }}
                                            >
                                                ❌ Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Password Resets Tab */}
            {activeTab === 'passwords' && (
                <>
                    {pendingResets.length === 0 ? (
                        <div className="glass-card p-3 text-center">
                            <div style={{ fontSize: 48 }}>🔐</div>
                            <h3>No Pending Password Resets</h3>
                            <p className="text-muted">All password reset requests have been processed.</p>
                        </div>
                    ) : (
                        <div className="grid grid-2">
                            {pendingResets.map((reset) => (
                                <div key={reset.id} className="glass-card p-3">
                                    <div className="d-flex justify-between align-center mb-2">
                                        <div className="d-flex align-center gap-2">
                                            <div className="avatar" style={{ width: 40, height: 40, background: 'var(--warning-gradient)' }}>
                                                {reset.user?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0 }}>{reset.user?.name}</h3>
                                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{reset.user?.email}</p>
                                            </div>
                                        </div>
                                        <span className="badge badge-pending">Pending</span>
                                    </div>

                                    <div className="mb-2" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                                        <p><strong>Position:</strong> {reset.user?.position || 'N/A'}</p>
                                        <p><strong>Requested:</strong> {new Date(reset.createdAt).toLocaleString()}</p>
                                    </div>

                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, marginTop: 16 }}>
                                        <div className="input-group" style={{ marginBottom: 12 }}>
                                            <label className="input-label" style={{ fontSize: 12 }}>New Password (leave blank for default: user123)</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="Enter new password or leave blank"
                                                value={resetPasswords[reset.id] || ''}
                                                onChange={(e) => setResetPasswords(prev => ({ ...prev, [reset.id]: e.target.value }))}
                                                style={{ padding: 10, fontSize: 14 }}
                                            />
                                        </div>

                                        <div className="d-flex gap-1">
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleApproveReset(reset.id)}
                                                style={{ flex: 1 }}
                                            >
                                                ✅ Reset Password
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleRejectReset(reset.id)}
                                                style={{ flex: 1 }}
                                            >
                                                ❌ Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
