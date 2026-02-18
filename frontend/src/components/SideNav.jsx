import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const SideNav = ({ closeSideNav }) => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.pathname === path ? 'active' : ''

  const isAdmin = user?.role === 'Administrator'

  const handleLogout = () => {
    logout()
  }

  const handleNavClick = () => {
    if (closeSideNav) {
      closeSideNav()
    }
  }

  return (
    <div className="d-flex flex-column bg-white border-end" style={{ width: '250px', minHeight: '100vh' }}>
      {/* Header */}
      <div className="my-3 text-center">
       <i className="fas fa-user me-2 fs-2"></i><br/>
        <small className="text-muted">{user?.full_name || user?.email}</small>
        <br/>
        <span className="badge bg-secondary rounded-0">{user?.role}</span>
      </div><hr className="my-0" />
      
      {/* Menu */}
      <div className=" my-3 ">
        {isAdmin ? (
          <Link 
            to="/admin" 
            className={`d-flex align-items-center px-3 py-2 text-decoration-none ${isActive('/admin') ? 'bg-primary text-white' : 'text-dark'}`}
            onClick={handleNavClick}
          >
            <i className="fas fa-chart-line me-3"></i>
            Dashboard
          </Link>
          
          
        ) : (
          <>
            <Link 
              to="/summary" 
              className={`d-flex align-items-center px-3 py-2 text-decoration-none ${isActive('/summary') ? 'bg-primary text-white' : 'text-dark'}`}
              onClick={handleNavClick}
            >
              <i className="fas fa-chart-bar me-3"></i>
              Dashboard
            </Link>
            <Link 
              to="/profile" 
              className={`d-flex align-items-center px-3 py-2 text-decoration-none ${isActive('/profile') ? 'bg-primary text-white' : 'text-dark'}`}
              onClick={handleNavClick}
            >
              <i className="fas fa-user me-3"></i>
              My Profile
            </Link>
            <Link 
              to="/payment" 
              className={`d-flex align-items-center px-3 py-2 text-decoration-none ${isActive('/payment') ? 'bg-primary text-white' : 'text-dark'}`}
              onClick={handleNavClick}
            >
              <i className="fas fa-credit-card me-3"></i>
              Payments
            </Link>
          </>
        )}
      </div>
      
    </div>
  )
}

export default SideNav
