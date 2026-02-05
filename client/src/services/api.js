import axios from 'axios';

// Use environment variable for API URL, fallback to /api for local development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('hrms_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('hrms_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// API Helper Functions

// Auth
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (data) => api.post('/auth/register', data),
    me: () => api.get('/auth/me'),
    changePassword: (data) => api.post('/auth/change-password', data),
    getPendingRegistrations: () => api.get('/auth/pending-registrations'),
    approveRegistration: (id, data) => api.put(`/auth/approve-registration/${id}`, data),
    rejectRegistration: (id) => api.put(`/auth/reject-registration/${id}`)
};

// Dashboard
export const dashboardAPI = {
    getStats: () => api.get('/dashboard/stats'),
    getAttendanceChart: () => api.get('/dashboard/attendance-chart'),
    getDepartmentStats: () => api.get('/dashboard/department-stats'),
    getRecentActivities: () => api.get('/dashboard/recent-activities')
};

// Employees
export const employeeAPI = {
    getAll: (params) => api.get('/employees', { params }),
    getById: (id) => api.get(`/employees/${id}`),
    create: (data) => api.post('/employees', data),
    update: (id, data) => api.put(`/employees/${id}`, data),
    delete: (id) => api.delete(`/employees/${id}`)
};

// Attendance
export const attendanceAPI = {
    getMy: () => api.get('/attendance/my'),
    getToday: () => api.get('/attendance/today'),
    checkIn: () => api.post('/attendance/check-in'),
    checkOut: () => api.post('/attendance/check-out'),
    breakStart: () => api.post('/attendance/break-start'),
    breakEnd: () => api.post('/attendance/break-end'),
    getAll: (params) => api.get('/attendance', { params }),
    getLiveStatus: () => api.get('/attendance/live-status')
};

// Departments
export const departmentAPI = {
    getAll: () => api.get('/departments'),
    getById: (id) => api.get(`/departments/${id}`),
    create: (data) => api.post('/departments', data),
    update: (id, data) => api.put(`/departments/${id}`, data),
    delete: (id) => api.delete(`/departments/${id}`)
};

// Leave Requests
export const leaveAPI = {
    getMy: () => api.get('/leaves/my'),
    getAll: (params) => api.get('/leaves', { params }),
    create: (data) => api.post('/leaves', data),
    updateStatus: (id, status) => api.put(`/leaves/${id}/status`, { status }),
    delete: (id) => api.delete(`/leaves/${id}`)
};

// Payroll
export const payrollAPI = {
    getMy: () => api.get('/payroll/my'),
    getAll: (params) => api.get('/payroll', { params }),
    create: (data) => api.post('/payroll', data),
    update: (id, data) => api.put(`/payroll/${id}`, data),
    process: (id) => api.post(`/payroll/${id}/process`),
    pay: (id) => api.post(`/payroll/${id}/pay`),
    delete: (id) => api.delete(`/payroll/${id}`),
    getSummary: (month) => api.get(`/payroll/summary/${month}`)
};

// Performance
export const performanceAPI = {
    getMy: () => api.get('/performance/my'),
    getAll: (params) => api.get('/performance', { params }),
    create: (data) => api.post('/performance', data),
    update: (id, data) => api.put(`/performance/${id}`, data),
    delete: (id) => api.delete(`/performance/${id}`)
};

// Tasks
export const taskAPI = {
    getMy: (params) => api.get('/tasks/my', { params }),
    getAssigned: (params) => api.get('/tasks/assigned', { params }),
    getAll: (params) => api.get('/tasks', { params }),
    create: (data) => api.post('/tasks', data),
    updateStatus: (id, status) => api.put(`/tasks/${id}/status`, { status }),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`)
};

// Announcements
export const announcementAPI = {
    getAll: (params) => api.get('/announcements', { params }),
    create: (data) => api.post('/announcements', data),
    update: (id, data) => api.put(`/announcements/${id}`, data),
    delete: (id) => api.delete(`/announcements/${id}`)
};

// Password Reset
export const passwordResetAPI = {
    request: (email) => api.post('/password-reset/request', { email }),
    getPending: () => api.get('/password-reset/pending'),
    approve: (id, newPassword) => api.put(`/password-reset/${id}`, { status: 'approved', newPassword }),
    reject: (id) => api.put(`/password-reset/${id}`, { status: 'rejected' })
};

// Teams
export const teamAPI = {
    getAll: () => api.get('/teams'),
    getById: (id) => api.get(`/teams/${id}`),
    create: (data) => api.post('/teams', data),
    update: (id, data) => api.put(`/teams/${id}`, data),
    delete: (id) => api.delete(`/teams/${id}`),
    addMember: (teamId, userId, role) => api.post(`/teams/${teamId}/members`, { userId, role }),
    removeMember: (teamId, memberId) => api.delete(`/teams/${teamId}/members/${memberId}`),
    removeUserFromTeam: (teamId, userId) => api.delete(`/teams/${teamId}/users/${userId}`)
};

// Hiring / Job Postings
export const hiringAPI = {
    getAll: (params) => api.get('/hiring', { params }),
    getById: (id) => api.get(`/hiring/${id}`),
    create: (data) => api.post('/hiring', data),
    update: (id, data) => api.put(`/hiring/${id}`, data),
    delete: (id) => api.delete(`/hiring/${id}`)
};
