import { useState, useEffect } from 'react'
import api from '../api/axios'

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null)
  const [users, setUsers] = useState([])
  const [unpaidUsers, setUnpaidUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [metricsRes, usersRes, unpaidRes] = await Promise.all([
        api.get('/admin/metrics/'),
        api.get('/admin/users/'),
        api.get('/admin/unpaid-users/')
      ])
      
      setMetrics(metricsRes.data)
      setUsers(usersRes.data.results || usersRes.data)
      setUnpaidUsers(unpaidRes.data.results || unpaidRes.data)
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    try {
      const response = await api.get(`/admin/users/?search=${searchTerm}`)
      setUsers(response.data.results || response.data)
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid p-3">
      <h2 className="mb-4">Admin Dashboard</h2>
      
      {/* Tab Navigation */}
      <div className="mb-4">
        <div className="btn-group" role="group">
          <button 
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
          <button 
            className={`btn ${activeTab === 'unpaid' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('unpaid')}
          >
            Unpaid Users
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics && (
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">Total Registered Taxpayers</h6>
                <h4 className="mb-0">{metrics.total_registered_taxpayers}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">Total Properties/Businesses</h6>
                <h4 className="mb-0">{metrics.total_properties_businesses}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">Total Tax Assessed</h6>
                <h4 className="mb-0">TZS {parseFloat(metrics.total_tax_assessed).toLocaleString()}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">Total Revenue Collected</h6>
                <h4 className="mb-0 text-success">TZS {parseFloat(metrics.total_revenue_collected).toLocaleString()}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">Outstanding Tax Amount</h6>
                <h4 className="mb-0 text-danger">TZS {parseFloat(metrics.outstanding_tax_amount).toLocaleString()}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">Overdue Accounts</h6>
                <h4 className="mb-0 text-danger">{metrics.overdue_accounts}</h4>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3">
            <h4 className="mb-0">User Management</h4>
          </div>
          <div className="card-body">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-3">
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ maxWidth: '300px' }}
                />
                <button type="submit" className="btn btn-primary">Search</button>
              </div>
            </form>
            
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Account Status</th>
                    <th>Last Login</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? users.map(user => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        <span className={`badge ${user.account_status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                          {user.account_status}
                        </span>
                      </td>
                      <td>{user.last_login_time ? new Date(user.last_login_time).toLocaleString() : 'Never'}</td>
                      <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="text-center">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Unpaid Users Tab */}
      {activeTab === 'unpaid' && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Unpaid Users</h4>
              <button className="btn btn-primary no-print" onClick={handlePrint}>
                <i className="fas fa-print me-2"></i>Print
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Tax Type</th>
                    <th>Total Due</th>
                    <th>Paid</th>
                    <th>Outstanding</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidUsers.length > 0 ? unpaidUsers.map(account => (
                    <tr key={account.id}>
                      <td>{account.email}</td>
                      <td>{account.tax_type_name}</td>
                      <td>TZS {parseFloat(account.total_tax_due).toLocaleString()}</td>
                      <td>TZS {parseFloat(account.paid_amount).toLocaleString()}</td>
                      <td className="text-danger fw-bold">
                        TZS {parseFloat(account.outstanding_balance).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${account.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                          {account.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="text-center">No unpaid accounts</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Summary Footer */}
            {unpaidUsers.length > 0 && (
              <div className="mt-4 p-3 bg-light rounded">
                <h5>Summary</h5>
                <p className="mb-1">Total Unpaid Accounts: {unpaidUsers.length}</p>
                <p className="mb-0">Total Outstanding: TZS {unpaidUsers.reduce((sum, acc) => sum + parseFloat(acc.outstanding_balance || 0), 0).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
