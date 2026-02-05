import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';
import { dashboardAPI, attendanceAPI, leaveAPI, performanceAPI, taskAPI, employeeAPI, announcementAPI, teamAPI, hiringAPI } from '../services/api';

const menuItems = [
    { path: '/manager', label: 'Dashboard', icon: '🏠', exact: true },
    { path: '/manager/team', label: 'My Team', icon: '👥' },
    { path: '/manager/leaves', label: 'Leave Approvals', icon: '🏖️' },
    { path: '/manager/tasks', label: 'Task Assignment', icon: '📋' },
    { path: '/manager/performance', label: 'Performance', icon: '⭐' }
];

export default function ManagerDashboard() {
    return (
        <div className="app-container">
            <Sidebar role="manager" menuItems={menuItems} />
            <main className="main-content">
                <Routes>
                    <Route index element={<DashboardHome />} />
                    <Route path="team" element={<TeamPage />} />
                    <Route path="leaves" element={<LeavesPage />} />
                    <Route path="tasks" element={<TasksPage />} />
                    <Route path="performance" element={<PerformancePage />} />
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

    // Modal states
    const [activeModal, setActiveModal] = useState(null);
    const [modalData, setModalData] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    // Announcement states
    const [announcements, setAnnouncements] = useState([]);
    const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
    const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', priority: 'normal' });
    const [openHirings, setOpenHirings] = useState([]);

    const fetchData = async () => {
        try {
            const [s, l, a] = await Promise.all([
                dashboardAPI.getStats(),
                attendanceAPI.getLiveStatus(),
                announcementAPI.getAll()
            ]);
            setStats(s.data);
            setLiveStatus(l.data);
            setAnnouncements(a.data.announcements || a.data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchHirings();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    // Fetch open hiring posts
    const fetchHirings = async () => {
        try {
            const res = await hiringAPI.getAll({ status: 'open' });
            setOpenHirings(res.data);
        } catch (error) {
            console.error('Error fetching hirings:', error);
        }
    };

    // Modal handlers
    const openModal = async (type) => {
        setActiveModal(type);
        setModalLoading(true);
        try {
            let data = [];
            switch (type) {
                case 'team':
                    const teamRes = await employeeAPI.getAll();
                    data = teamRes.data.employees || [];
                    break;
                case 'present':
                    const attendRes = await attendanceAPI.getAll({ date: new Date().toISOString().split('T')[0] });
                    data = attendRes.data.attendances || [];
                    break;
                case 'leaves':
                    const leavesRes = await leaveAPI.getAll({ status: 'pending' });
                    data = leavesRes.data.leaves || leavesRes.data || [];
                    break;
                case 'tasks':
                    const tasksRes = await taskAPI.getAssigned();
                    data = tasksRes.data || [];
                    break;
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
        } catch (error) {
            console.error('Error fetching modal data:', error);
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => {
        setActiveModal(null);
        setModalData([]);
    };

    const handleLeaveAction = async (id, status) => {
        try {
            await leaveAPI.updateStatus(id, status);
            openModal('leaves'); // Refresh
            fetchData();
        } catch (error) {
            console.error('Error updating leave:', error);
        }
    };

    const handleCreateAnnouncement = async (e) => {
        e.preventDefault();
        try {
            await announcementAPI.create(announcementForm);
            setShowAnnouncementForm(false);
            setAnnouncementForm({ title: '', content: '', priority: 'normal' });
            fetchData();
        } catch (error) {
            console.error('Error creating announcement:', error);
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        try {
            await announcementAPI.delete(id);
            fetchData();
        } catch (error) {
            console.error('Error deleting announcement:', error);
        }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    const cardStyle = { cursor: 'pointer', transition: 'all 0.3s ease' };
    const hoverIn = (e) => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'; };
    const hoverOut = (e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Manager Dashboard 👔</h1>
                <p className="page-subtitle">Welcome back, {user?.name}</p>
            </div>

            {/* Stats Cards - Clickable */}
            <div className="grid grid-4 mb-3">
                <div className="glass-card stat-card card-3d" style={cardStyle} onClick={() => openModal('team')} onMouseOver={hoverIn} onMouseOut={hoverOut}>
                    <div className="stat-icon" style={{ background: 'var(--primary-gradient)' }}>👥</div>
                    <div className="stat-value gradient-text">{stats?.teamSize || 0}</div>
                    <div className="stat-label">Team Members</div>
                </div>
                <div className="glass-card stat-card card-3d" style={cardStyle} onClick={() => openModal('present')} onMouseOver={hoverIn} onMouseOut={hoverOut}>
                    <div className="stat-icon" style={{ background: 'var(--success-gradient)' }}>✅</div>
                    <div className="stat-value gradient-text">{stats?.teamPresent || liveStatus?.totalPresent || 0}</div>
                    <div className="stat-label">Present Today</div>
                </div>
                <div className="glass-card stat-card card-3d" style={cardStyle} onClick={() => openModal('leaves')} onMouseOver={hoverIn} onMouseOut={hoverOut}>
                    <div className="stat-icon" style={{ background: 'var(--warning-gradient)' }}>📝</div>
                    <div className="stat-value gradient-text">{stats?.pendingLeaves || 0}</div>
                    <div className="stat-label">Pending Leaves</div>
                </div>
                <div className="glass-card stat-card card-3d" style={cardStyle} onClick={() => openModal('tasks')} onMouseOver={hoverIn} onMouseOut={hoverOut}>
                    <div className="stat-icon" style={{ background: 'var(--info-gradient)' }}>📋</div>
                    <div className="stat-value gradient-text">{stats?.pendingTasks || 0}</div>
                    <div className="stat-label">Active Tasks</div>
                </div>
            </div>

            {/* Live Attendance Status - Clickable */}
            <div className="grid grid-3 mb-3">
                <div className="glass-card p-2" style={cardStyle} onClick={() => openModal('working')} onMouseOver={hoverIn} onMouseOut={hoverOut}>
                    <h3 className="mb-1">🟢 Working ({liveStatus?.summary?.working || 0})</h3>
                    <div style={{ maxHeight: 150, overflow: 'auto' }}>
                        {liveStatus?.working?.slice(0, 3).map(emp => (
                            <div key={emp.id} className="d-flex align-center gap-1 p-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{emp.user?.name?.charAt(0)}</div>
                                <div style={{ fontSize: 12 }}>{emp.user?.name}</div>
                            </div>
                        ))}
                        {(!liveStatus?.working || liveStatus.working.length === 0) && <p className="text-muted" style={{ fontSize: 12 }}>No one working yet</p>}
                        {liveStatus?.working?.length > 3 && <p style={{ fontSize: 11, color: 'var(--primary)', marginTop: 8 }}>+{liveStatus.working.length - 3} more... Click to view all</p>}
                    </div>
                </div>
                <div className="glass-card p-2" style={cardStyle} onClick={() => openModal('onBreak')} onMouseOver={hoverIn} onMouseOut={hoverOut}>
                    <h3 className="mb-1">☕ On Break ({liveStatus?.summary?.onBreak || 0})</h3>
                    <div style={{ maxHeight: 150, overflow: 'auto' }}>
                        {liveStatus?.onBreak?.slice(0, 3).map(emp => (
                            <div key={emp.id} className="d-flex align-center gap-1 p-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: 'var(--warning-gradient)' }}>{emp.user?.name?.charAt(0)}</div>
                                <div style={{ fontSize: 12 }}>{emp.user?.name}</div>
                            </div>
                        ))}
                        {(!liveStatus?.onBreak || liveStatus.onBreak.length === 0) && <p className="text-muted" style={{ fontSize: 12 }}>No one on break</p>}
                        {liveStatus?.onBreak?.length > 3 && <p style={{ fontSize: 11, color: 'var(--primary)', marginTop: 8 }}>+{liveStatus.onBreak.length - 3} more... Click to view all</p>}
                    </div>
                </div>
                <div className="glass-card p-2" style={cardStyle} onClick={() => openModal('checkedOut')} onMouseOver={hoverIn} onMouseOut={hoverOut}>
                    <h3 className="mb-1">🏠 Checked Out ({liveStatus?.summary?.checkedOut || 0})</h3>
                    <div style={{ maxHeight: 150, overflow: 'auto' }}>
                        {liveStatus?.checkedOut?.slice(0, 3).map(emp => (
                            <div key={emp.id} className="d-flex align-center gap-1 p-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: 'var(--danger-gradient)' }}>{emp.user?.name?.charAt(0)}</div>
                                <div style={{ fontSize: 12 }}>{emp.user?.name}</div>
                            </div>
                        ))}
                        {(!liveStatus?.checkedOut || liveStatus.checkedOut.length === 0) && <p className="text-muted" style={{ fontSize: 12 }}>No one left yet</p>}
                        {liveStatus?.checkedOut?.length > 3 && <p style={{ fontSize: 11, color: 'var(--primary)', marginTop: 8 }}>+{liveStatus.checkedOut.length - 3} more... Click to view all</p>}
                    </div>
                </div>
            </div>

            {/* Announcements Section */}
            <div className="glass-card p-3 mb-3">
                <div className="d-flex justify-between align-center mb-2">
                    <h3>📢 Announcements</h3>
                    <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => setShowAnnouncementForm(true)}>+ New Announcement</button>
                </div>
                {announcements.length === 0 ? (
                    <div className="text-center p-2" style={{ color: 'var(--text-muted)' }}>
                        <p>No announcements yet. Create one to notify your team!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflow: 'auto' }}>
                        {announcements.map(a => (
                            <div key={a.id} className="glass-card p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <div className="d-flex justify-between align-center mb-1">
                                    <strong>{a.title}</strong>
                                    <div className="d-flex gap-1 align-center">
                                        <span className={`badge badge-${a.priority === 'high' ? 'danger' : a.priority === 'medium' ? 'warning' : 'info'}`} style={{ fontSize: 10 }}>
                                            {a.priority}
                                        </span>
                                        <button onClick={() => handleDeleteAnnouncement(a.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>🗑️</button>
                                    </div>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{a.content}</p>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                                    📅 {new Date(a.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Open Positions - Hiring Posts */}
            {openHirings.length > 0 && (
                <div className="glass-card p-3 mb-3">
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

            {/* Create Announcement Modal */}
            {showAnnouncementForm && (
                <div className="modal-overlay" onClick={() => setShowAnnouncementForm(false)}>
                    <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header d-flex justify-between align-center mb-2">
                            <h2 style={{ margin: 0 }}>📢 New Announcement</h2>
                            <button onClick={() => setShowAnnouncementForm(false)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-primary)' }}>×</button>
                        </div>
                        <form onSubmit={handleCreateAnnouncement}>
                            <div className="input-group">
                                <label className="input-label">Title</label>
                                <input className="input-field" value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} placeholder="Announcement title" required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Content</label>
                                <textarea className="input-field" rows={4} value={announcementForm.content} onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })} placeholder="Write your announcement..." required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Priority</label>
                                <select className="input-field select-field" value={announcementForm.priority} onChange={e => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}>
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary w-full">Post Announcement</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Dynamic Modals for Stats */}
            {activeModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '80vh', overflow: 'auto' }}>
                        <div className="modal-header d-flex justify-between align-center mb-2">
                            <h2 style={{ margin: 0 }}>
                                {activeModal === 'team' && '👥 Team Members'}
                                {activeModal === 'present' && '✅ Present Today'}
                                {activeModal === 'leaves' && '📝 Pending Leaves'}
                                {activeModal === 'tasks' && '📋 Active Tasks'}
                                {activeModal === 'working' && '🟢 Currently Working'}
                                {activeModal === 'onBreak' && '☕ On Break'}
                                {activeModal === 'checkedOut' && '🏠 Checked Out'}
                            </h2>
                            <button onClick={closeModal} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-primary)' }}>×</button>
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
                                {/* Team Members */}
                                {activeModal === 'team' && modalData.map(emp => (
                                    <div key={emp.id} className="glass-card p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div className="d-flex align-center gap-2">
                                            <div className="avatar" style={{ width: 40, height: 40 }}>{emp.name?.charAt(0)}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600 }}>{emp.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.position} • {emp.email}</div>
                                            </div>
                                            <span className="badge badge-info">{emp.role}</span>
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
                                            <div style={{ textAlign: 'right', fontSize: 12 }}>
                                                <div>In: {att.checkIn ? new Date(att.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                                                <div>Out: {att.checkOut ? new Date(att.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Pending Leaves */}
                                {activeModal === 'leaves' && modalData.map(leave => (
                                    <div key={leave.id} className="glass-card p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div className="d-flex justify-between align-center mb-1">
                                            <div>
                                                <strong>{leave.user?.name}</strong>
                                                <span className="badge badge-primary" style={{ marginLeft: 8, fontSize: 10 }}>{leave.type}</span>
                                            </div>
                                            <span className={`badge badge-${leave.status === 'pending' ? 'warning' : leave.status === 'approved' ? 'success' : 'danger'}`}>{leave.status}</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                                            <div>📅 {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</div>
                                            <div>📝 {leave.reason}</div>
                                        </div>
                                        {leave.status === 'pending' && (
                                            <div className="d-flex gap-1">
                                                <button className="btn btn-success" style={{ padding: '6px 16px', fontSize: 12 }} onClick={() => handleLeaveAction(leave.id, 'approved')}>✓ Approve</button>
                                                <button className="btn btn-danger" style={{ padding: '6px 16px', fontSize: 12 }} onClick={() => handleLeaveAction(leave.id, 'rejected')}>✗ Reject</button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Active Tasks */}
                                {activeModal === 'tasks' && modalData.map(task => (
                                    <div key={task.id} className="glass-card p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div className="d-flex justify-between mb-1">
                                            <strong>{task.title}</strong>
                                            <div className="d-flex gap-1">
                                                <span className={`badge badge-${task.priority === 'high' ? 'danger' : 'warning'}`}>{task.priority}</span>
                                                <span className={`badge badge-${task.status === 'completed' ? 'success' : 'pending'}`}>{task.status}</span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            <div>👤 Assigned to: {task.assignee?.name}</div>
                                            {task.description && <div>📝 {task.description}</div>}
                                        </div>
                                    </div>
                                ))}

                                {/* Working / On Break / Checked Out */}
                                {(activeModal === 'working' || activeModal === 'onBreak' || activeModal === 'checkedOut') && modalData.map(emp => (
                                    <div key={emp.id} className="glass-card p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <div className="d-flex align-center gap-2">
                                            <div className="avatar" style={{ width: 40, height: 40, background: activeModal === 'working' ? 'var(--success-gradient)' : activeModal === 'onBreak' ? 'var(--warning-gradient)' : 'var(--danger-gradient)' }}>{emp.user?.name?.charAt(0)}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600 }}>{emp.user?.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.user?.position}</div>
                                            </div>
                                            <div style={{ textAlign: 'right', fontSize: 12 }}>
                                                <div>Check In: {emp.checkIn ? new Date(emp.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                                                {activeModal === 'checkedOut' && <div>Check Out: {emp.checkOut ? new Date(emp.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>}
                                                {activeModal === 'onBreak' && <div style={{ color: '#f97316' }}>Break: {emp.totalBreakTime || 0}m</div>}
                                                {activeModal === 'working' && <div style={{ color: '#38ef7d' }}>Working: {emp.totalWorkTime || 0}m</div>}
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

function TeamPage() {
    const [employees, setEmployees] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [showAddMember, setShowAddMember] = useState(null); // team id
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teamForm, setTeamForm] = useState({ name: '', description: '', memberIds: [] });

    // Pagination state for employees
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const limit = 10;

    const fetchData = async () => {
        setLoading(true);
        try {
            const [empRes, teamRes] = await Promise.all([
                employeeAPI.getAll({ page: currentPage, limit }),
                teamAPI.getAll()
            ]);
            setEmployees(empRes.data.employees || []);
            setTotalPages(empRes.data.pagination?.pages || 1);
            setTotalEmployees(empRes.data.pagination?.total || empRes.data.employees?.length || 0);
            setTeams(teamRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentPage]);

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        try {
            await teamAPI.create({
                name: teamForm.name,
                description: teamForm.description,
                memberIds: teamForm.memberIds
            });
            setShowCreateTeam(false);
            setTeamForm({ name: '', description: '', memberIds: [] });
            fetchData();
        } catch (error) {
            console.error('Error creating team:', error);
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (window.confirm('Are you sure you want to delete this team?')) {
            try {
                await teamAPI.delete(teamId);
                fetchData();
            } catch (error) {
                console.error('Error deleting team:', error);
                alert('Failed to delete team');
            }
        }
    };

    const handleAddMember = async (userId) => {
        try {
            await teamAPI.addMember(showAddMember, userId);
            setShowAddMember(null);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (teamId, memberId) => {
        try {
            await teamAPI.removeMember(teamId, memberId);
            fetchData();
        } catch (error) {
            console.error('Error removing member:', error);
        }
    };

    const toggleMemberSelection = (empId) => {
        setTeamForm(prev => ({
            ...prev,
            memberIds: prev.memberIds.includes(empId)
                ? prev.memberIds.filter(id => id !== empId)
                : [...prev.memberIds, empId]
        }));
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    // Get employees not in any team for the "All Employees" section
    const employeesInTeams = teams.flatMap(t => t.members?.map(m => m.userId) || []);
    const unassignedEmployees = employees.filter(e => !employeesInTeams.includes(e.id));

    return (
        <div className="animate-fade-in">
            {/* Page Header - only show when not creating team */}
            {!showCreateTeam && (
                <div className="page-header d-flex justify-between align-center">
                    <h1 className="page-title">My Team 👥</h1>
                    <button className="btn btn-primary" onClick={() => setShowCreateTeam(true)}>+ Create Team</button>
                </div>
            )}

            {/* Create Team Form - Inline Layout */}
            {showCreateTeam ? (
                <div className="animate-fade-in">
                    <div className="d-flex justify-between align-center mb-3">
                        <h2 style={{ margin: 0 }}>📋 Create New Team</h2>
                        <button
                            className="btn btn-ghost"
                            onClick={() => { setShowCreateTeam(false); setTeamForm({ name: '', description: '', memberIds: [] }); }}
                            style={{ fontSize: 18 }}
                        >
                            ← Back to Team List
                        </button>
                    </div>

                    <div className="glass-card p-3">
                        <form onSubmit={handleCreateTeam}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                                <div className="input-group">
                                    <label className="input-label">Team Name *</label>
                                    <input
                                        className="input-field"
                                        value={teamForm.name}
                                        onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                                        placeholder="e.g., Project Alpha Team"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Description</label>
                                    <input
                                        className="input-field"
                                        value={teamForm.description}
                                        onChange={e => setTeamForm({ ...teamForm, description: e.target.value })}
                                        placeholder="Brief description of the team..."
                                    />
                                </div>
                            </div>

                            <div className="input-group" style={{ marginTop: 16 }}>
                                <label className="input-label">Select Team Members ({teamForm.memberIds.length} selected)</label>
                                <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 12, background: 'var(--surface-light)' }}>
                                    <div className="grid grid-3" style={{ gap: 8 }}>
                                        {employees.map(emp => (
                                            <div
                                                key={emp.id}
                                                onClick={() => toggleMemberSelection(emp.id)}
                                                className="d-flex align-center gap-2 p-2"
                                                style={{
                                                    cursor: 'pointer',
                                                    borderRadius: 'var(--radius-md)',
                                                    background: teamForm.memberIds.includes(emp.id) ? 'rgba(102, 126, 234, 0.15)' : 'rgba(255,255,255,0.05)',
                                                    border: teamForm.memberIds.includes(emp.id) ? '2px solid var(--primary)' : '2px solid transparent',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{
                                                    width: 22, height: 22, borderRadius: 6,
                                                    border: '2px solid var(--primary)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: teamForm.memberIds.includes(emp.id) ? 'var(--primary)' : 'transparent',
                                                    flexShrink: 0
                                                }}>
                                                    {teamForm.memberIds.includes(emp.id) && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
                                                </div>
                                                <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{emp.name?.charAt(0)}</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.position}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                                <button type="submit" className="btn btn-primary">✅ Create Team</button>
                                <button type="button" className="btn btn-ghost" onClick={() => { setShowCreateTeam(false); setTeamForm({ name: '', description: '', memberIds: [] }); }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <>

                    {/* Teams Section */}
                    {teams.length > 0 && (
                        <div className="mb-3">
                            <h3 className="mb-2">📋 My Teams ({teams.length})</h3>
                            <div className="grid grid-2">
                                {teams.map(team => (
                                    <div key={team.id} className="glass-card p-3" style={{ borderLeft: '4px solid var(--primary)' }}>
                                        <div className="d-flex justify-between align-center mb-2">
                                            <div>
                                                <h4 style={{ margin: 0 }}>{team.name}</h4>
                                                {team.description && <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>{team.description}</p>}
                                            </div>
                                            <div className="d-flex gap-1">
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ padding: '6px 12px', fontSize: 12 }}
                                                    onClick={() => setShowAddMember(team.id)}
                                                >
                                                    + Add
                                                </button>
                                                <button
                                                    className="btn btn-danger"
                                                    style={{ padding: '6px 12px', fontSize: 12 }}
                                                    onClick={() => handleDeleteTeam(team.id)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        <div className="d-flex gap-1 flex-wrap mb-2">
                                            <span className="badge badge-info">{team.members?.length || 0} members</span>
                                        </div>

                                        {/* Team Members */}
                                        {team.members?.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {team.members.map(member => (
                                                    <div key={member.id} className="d-flex align-center justify-between p-1" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>
                                                        <div className="d-flex align-center gap-2">
                                                            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{member.user?.name?.charAt(0)}</div>
                                                            <div>
                                                                <div style={{ fontSize: 13, fontWeight: 500 }}>{member.user?.name}</div>
                                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{member.user?.position}</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveMember(team.id, member.id)}
                                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}
                                                            title="Remove from team"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted" style={{ fontSize: 12, textAlign: 'center' }}>No members yet. Click "+ Add" to add members.</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Employees Section */}
                    <div>
                        <h3 className="mb-2">👤 All Employees ({totalEmployees})</h3>
                        <div className="grid grid-3">
                            {employees.map(emp => {
                                const memberOfTeams = teams.filter(t => t.members?.some(m => m.userId === emp.id));
                                return (
                                    <div key={emp.id} className="glass-card p-2 card-3d">
                                        <div className="d-flex align-center gap-2 mb-1">
                                            <div className="avatar avatar-lg role-employee">{emp.name?.charAt(0)}</div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{emp.name}</div>
                                                <div className="text-muted" style={{ fontSize: 12 }}>{emp.position}</div>
                                            </div>
                                        </div>
                                        <p className="text-muted" style={{ fontSize: 13, marginBottom: 8 }}>📧 {emp.email}</p>
                                        {memberOfTeams.length > 0 && (
                                            <div className="d-flex gap-1 flex-wrap">
                                                {memberOfTeams.map(t => (
                                                    <span key={t.id} className="badge badge-primary" style={{ fontSize: 10 }}>{t.name}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
                </>
            )}


            {/* Add Member Modal */}
            {showAddMember && (
                <div className="modal-overlay" onClick={() => setShowAddMember(null)}>
                    <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 450, maxHeight: '80vh', overflow: 'auto' }}>
                        <div className="modal-header d-flex justify-between align-center mb-2">
                            <h2 style={{ margin: 0 }}>➕ Add Team Member</h2>
                            <button onClick={() => setShowAddMember(null)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-primary)' }}>×</button>
                        </div>
                        <p className="text-muted mb-2" style={{ fontSize: 13 }}>Click on an employee to add them to the team</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {employees.filter(emp => {
                                const team = teams.find(t => t.id === showAddMember);
                                return !team?.members?.some(m => m.userId === emp.id);
                            }).map(emp => (
                                <div
                                    key={emp.id}
                                    onClick={() => handleAddMember(emp.id)}
                                    className="d-flex align-center gap-2 p-2 glass-card"
                                    style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}
                                >
                                    <div className="avatar" style={{ width: 36, height: 36 }}>{emp.name?.charAt(0)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500 }}>{emp.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.position}</div>
                                    </div>
                                    <span className="badge badge-success" style={{ fontSize: 11 }}>+ Add</span>
                                </div>
                            ))}
                            {employees.filter(emp => {
                                const team = teams.find(t => t.id === showAddMember);
                                return !team?.members?.some(m => m.userId === emp.id);
                            }).length === 0 && (
                                    <p className="text-center text-muted">All employees are already in this team</p>
                                )}
                        </div>
                    </div>
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
        try { const res = await leaveAPI.getAll(); setLeaves(res.data.leaves); } finally { setLoading(false); }
    };

    const updateStatus = async (id, status) => {
        await leaveAPI.updateStatus(id, status); fetchLeaves();
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header"><h1 className="page-title">Leave Approvals 🏖️</h1></div>
            <div className="glass-card p-2">
                <table className="data-table"><thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>{leaves.map(l => (
                        <tr key={l.id}><td>{l.user?.name}</td><td>{l.type}</td><td>{new Date(l.startDate).toLocaleDateString()}</td><td><span className={`badge badge-${l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'danger' : 'pending'}`}>{l.status}</span></td>
                            <td>{l.status === 'pending' && <div className="d-flex gap-1"><button className="btn btn-sm btn-success" onClick={() => updateStatus(l.id, 'approved')}>✓</button><button className="btn btn-sm btn-danger" onClick={() => updateStatus(l.id, 'rejected')}>✗</button></div>}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}

function TasksPage() {
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [assignmentType, setAssignmentType] = useState('individual'); // 'individual' or 'team'
    const [form, setForm] = useState({
        title: '',
        description: '',
        assigneeId: '',
        teamMembers: [],
        teamName: '',
        priority: 'medium',
        dueDate: ''
    });

    useEffect(() => {
        Promise.all([taskAPI.getAssigned(), employeeAPI.getAll()])
            .then(([t, e]) => { setTasks(t.data); setEmployees(e.data.employees); })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (assignmentType === 'individual') {
            // Assign to single person
            await taskAPI.create({
                title: form.title,
                description: form.description,
                assigneeId: form.assigneeId,
                priority: form.priority,
                dueDate: form.dueDate
            });
        } else {
            // Assign to team - create separate tasks for each member with team tag
            const teamTitle = form.teamName ? `[Team: ${form.teamName}] ${form.title}` : form.title;
            for (const memberId of form.teamMembers) {
                await taskAPI.create({
                    title: teamTitle,
                    description: `${form.description}\n\n👥 Team Members: ${form.teamMembers.map(id => employees.find(e => e.id === id)?.name).join(', ')}`,
                    assigneeId: memberId,
                    priority: form.priority,
                    dueDate: form.dueDate
                });
            }
        }

        setShowForm(false);
        setForm({ title: '', description: '', assigneeId: '', teamMembers: [], teamName: '', priority: 'medium', dueDate: '' });
        setAssignmentType('individual');
        const res = await taskAPI.getAssigned();
        setTasks(res.data);
    };

    const toggleTeamMember = (empId) => {
        setForm(prev => ({
            ...prev,
            teamMembers: prev.teamMembers.includes(empId)
                ? prev.teamMembers.filter(id => id !== empId)
                : [...prev.teamMembers, empId]
        }));
    };

    const selectAllMembers = () => {
        setForm(prev => ({
            ...prev,
            teamMembers: employees.map(e => e.id)
        }));
    };

    const clearAllMembers = () => {
        setForm(prev => ({ ...prev, teamMembers: [] }));
    };

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    // Group tasks by team name for display
    const teamTasks = tasks.filter(t => t.title?.includes('[Team:'));
    const individualTasks = tasks.filter(t => !t.title?.includes('[Team:'));

    return (
        <div className="animate-fade-in">
            {/* Page Header - only show when not assigning tasks */}
            {!showForm && (
                <div className="page-header d-flex justify-between align-center">
                    <h1 className="page-title">Task Assignment 📋</h1>
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Assign Task</button>
                </div>
            )}

            {/* Assign Task Form - Inline Layout */}
            {showForm ? (
                <div className="animate-fade-in">
                    <div className="d-flex justify-between align-center mb-3">
                        <h2 style={{ margin: 0 }}>📋 Assign New Task</h2>
                        <button
                            className="btn btn-ghost"
                            onClick={() => { setShowForm(false); setForm({ title: '', description: '', assigneeId: '', teamMembers: [], teamName: '', priority: 'medium', dueDate: '' }); setAssignmentType('individual'); }}
                            style={{ fontSize: 18 }}
                        >
                            ← Back to Tasks
                        </button>
                    </div>

                    <div className="glass-card p-3">
                        {/* Assignment Type Toggle */}
                        <div className="mb-3">
                            <label className="input-label mb-1">Assignment Type</label>
                            <div className="d-flex gap-1">
                                <button
                                    type="button"
                                    className={`btn ${assignmentType === 'individual' ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1, padding: '12px' }}
                                    onClick={() => setAssignmentType('individual')}
                                >
                                    👤 Individual Task
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${assignmentType === 'team' ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1, padding: '12px' }}
                                    onClick={() => setAssignmentType('team')}
                                >
                                    👥 Team Task
                                </button>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                                {assignmentType === 'individual'
                                    ? '📌 Assign task to a single team member'
                                    : '📌 Create a team and assign the same task to all selected members'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                                {/* Team Name - Only for team tasks */}
                                {assignmentType === 'team' && (
                                    <div className="input-group">
                                        <label className="input-label">Team Name (Optional)</label>
                                        <input
                                            className="input-field"
                                            value={form.teamName}
                                            onChange={e => setForm({ ...form, teamName: e.target.value })}
                                            placeholder="e.g., Project Alpha Team"
                                        />
                                    </div>
                                )}

                                <div className="input-group">
                                    <label className="input-label">Task Title *</label>
                                    <input
                                        className="input-field"
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        placeholder="Enter task title"
                                        required
                                    />
                                </div>

                                {/* Individual Assignment */}
                                {assignmentType === 'individual' && (
                                    <div className="input-group">
                                        <label className="input-label">Assign To *</label>
                                        <select
                                            className="input-field select-field"
                                            value={form.assigneeId}
                                            onChange={e => setForm({ ...form, assigneeId: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Employee</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name} - {emp.position}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="input-group">
                                    <label className="input-label">Priority</label>
                                    <select
                                        className="input-field select-field"
                                        value={form.priority}
                                        onChange={e => setForm({ ...form, priority: e.target.value })}
                                    >
                                        <option value="low">🟢 Low</option>
                                        <option value="medium">🟡 Medium</option>
                                        <option value="high">🔴 High</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Due Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={form.dueDate}
                                        onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="input-group" style={{ marginTop: 16 }}>
                                <label className="input-label">Description</label>
                                <textarea
                                    className="input-field"
                                    rows={3}
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Enter task description..."
                                />
                            </div>

                            {/* Team Assignment - Multi-select */}
                            {assignmentType === 'team' && (
                                <div className="input-group" style={{ marginTop: 16 }}>
                                    <div className="d-flex justify-between align-center mb-1">
                                        <label className="input-label" style={{ margin: 0 }}>Select Team Members * ({form.teamMembers.length} selected)</label>
                                        <div className="d-flex gap-1">
                                            <button type="button" onClick={selectAllMembers} className="btn btn-sm btn-primary">Select All</button>
                                            <button type="button" onClick={clearAllMembers} className="btn btn-sm btn-danger">Clear</button>
                                        </div>
                                    </div>
                                    <div style={{ maxHeight: 250, overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 12, background: 'var(--surface-light)' }}>
                                        <div className="grid grid-3" style={{ gap: 8 }}>
                                            {employees.map(emp => (
                                                <div
                                                    key={emp.id}
                                                    onClick={() => toggleTeamMember(emp.id)}
                                                    className="d-flex align-center gap-2 p-2"
                                                    style={{
                                                        cursor: 'pointer',
                                                        borderRadius: 'var(--radius-md)',
                                                        background: form.teamMembers.includes(emp.id) ? 'rgba(102, 126, 234, 0.15)' : 'rgba(255,255,255,0.05)',
                                                        border: form.teamMembers.includes(emp.id) ? '2px solid var(--primary)' : '2px solid transparent',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: 22, height: 22, borderRadius: 6,
                                                        border: '2px solid var(--primary)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: form.teamMembers.includes(emp.id) ? 'var(--primary)' : 'transparent',
                                                        flexShrink: 0
                                                    }}>
                                                        {form.teamMembers.includes(emp.id) && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
                                                    </div>
                                                    <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{emp.name?.charAt(0)}</div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.position}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={assignmentType === 'team' && form.teamMembers.length === 0}
                                >
                                    {assignmentType === 'individual' ? '✅ Assign Task' : `✅ Assign to ${form.teamMembers.length} Team Members`}
                                </button>
                                <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setForm({ title: '', description: '', assigneeId: '', teamMembers: [], teamName: '', priority: 'medium', dueDate: '' }); setAssignmentType('individual'); }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <>

                    {/* Team Tasks Section */}
                    {teamTasks.length > 0 && (
                        <div className="mb-3">
                            <h3 className="mb-2">👥 Team Tasks</h3>
                            <div className="grid grid-3">
                                {teamTasks.map(t => (
                                    <div key={t.id} className="glass-card p-2" style={{ borderLeft: '3px solid var(--primary)' }}>
                                        <div className="d-flex justify-between mb-1">
                                            <span className={`badge badge-${t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'info'}`}>{t.priority}</span>
                                            <span className={`badge badge-${t.status === 'completed' ? 'success' : 'pending'}`}>{t.status}</span>
                                        </div>
                                        <h4 style={{ fontSize: 14 }}>{t.title}</h4>
                                        <p className="text-muted" style={{ fontSize: 12 }}>👤 {t.assignee?.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Individual Tasks Section */}
                    <div>
                        <h3 className="mb-2">👤 Individual Tasks</h3>
                        {individualTasks.length === 0 ? (
                            <div className="glass-card p-3 text-center" style={{ color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                                <p>No individual tasks assigned yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-3">
                                {individualTasks.map(t => (
                                    <div key={t.id} className="glass-card p-2">
                                        <div className="d-flex justify-between mb-1">
                                            <span className={`badge badge-${t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'info'}`}>{t.priority}</span>
                                            <span className={`badge badge-${t.status === 'completed' ? 'success' : 'pending'}`}>{t.status}</span>
                                        </div>
                                        <h4 style={{ fontSize: 14 }}>{t.title}</h4>
                                        <p className="text-muted" style={{ fontSize: 12 }}>👤 {t.assignee?.name}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function PerformancePage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        performanceAPI.getAll().then(res => setReviews(res.data.reviews)).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header"><h1 className="page-title">Performance Reviews ⭐</h1></div>
            <div className="glass-card p-2">
                <table className="data-table"><thead><tr><th>Employee</th><th>Period</th><th>Rating</th><th>Feedback</th></tr></thead>
                    <tbody>{reviews.map(r => (<tr key={r.id}><td>{r.user?.name}</td><td>{r.period}</td><td>{'⭐'.repeat(r.rating)}</td><td>{r.feedback?.substring(0, 50)}</td></tr>))}</tbody>
                </table>
            </div>
        </div>
    );
}
