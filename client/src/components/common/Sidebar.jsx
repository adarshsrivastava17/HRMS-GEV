import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ role, menuItems }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 767) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const roleColors = {
    admin: 'role-admin',
    manager: 'role-manager',
    hr: 'role-hr',
    employee: 'role-employee'
  };

  const roleLabels = {
    admin: 'Administrator',
    manager: 'Manager',
    hr: 'HR Manager',
    employee: 'Employee'
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'show' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/gev-logo.png" alt="GEV Logo" className="logo-img" />
            <span className="logo-text gradient-text">GEV</span>
          </div>
        </div>

        <div className="sidebar-user">
          <div className={`avatar ${roleColors[role]}`}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{roleLabels[role]}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>

        <style>{`
        .sidebar {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          backdrop-filter: blur(10px);
          border-right: 1px solid rgba(100, 116, 139, 0.12);
        }

        .sidebar-header {
          padding: 24px 20px;
          border-bottom: 1px solid rgba(100, 116, 139, 0.12);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sidebar-logo .logo-img {
          width: 36px;
          height: 36px;
          object-fit: contain;
        }

        .sidebar-logo .logo-text {
          font-size: 24px;
          font-weight: 800;
        }

        .sidebar-user {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(100, 116, 139, 0.12);
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 600;
          font-size: 14px;
          color: #1e293b;
        }

        .user-role {
          font-size: 12px;
          color: #64748b;
        }

        .sidebar-nav {
          padding: 16px 12px;
          flex: 1;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: var(--radius-md);
          color: #475569;
          font-size: 14px;
          font-weight: 500;
          transition: all var(--transition-normal);
          margin-bottom: 4px;
        }

        .nav-item:hover {
          background: rgba(102, 126, 234, 0.08);
          color: #1e293b;
        }

        .nav-item.active {
          background: var(--primary-gradient);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .nav-icon {
          font-size: 18px;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid rgba(100, 116, 139, 0.12);
        }

        .logout-btn {
          width: 100%;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: var(--radius-md);
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          transition: all var(--transition-normal);
        }

        .logout-btn:hover {
          background: rgba(235, 51, 73, 0.1);
          color: #ef4444;
        }
      `}</style>
      </aside>
    </>
  );
}
