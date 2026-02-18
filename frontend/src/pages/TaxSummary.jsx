import { useState, useEffect } from 'react'
import api from '../api/axios'

const TaxSummary = () => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [])
  const fetchSummary = async () => {
    try {
      const response = await api.get('/dashboard/summary/')
      setSummary(response.data)
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setLoading(false)
    }
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
    <div className="container-fluid p-3 border rounded-0 bg-light">
      <h2 className="mb-4 fw-light">Dashboard</h2>
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg">
          <div className="card bg-transparent h-100 border rounded-0">
            <div className="card-body">
              <h6 className="text-muted mb-2 text-center">Total Tax Due</h6><br />
              <h4 className="mb-0">{summary?.total_tax_due ? `TZS ${parseFloat(summary.total_tax_due).toLocaleString()}` : 'TZS 0'}</h4>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg">
          <div className="card bg-transparent h-100 border rounded-0">
            <div className="card-body">
              <h6 className="text-muted mb-2 text-center">Paid Amount</h6><br />
              <h4 className="mb-0 text-success">{summary?.paid_amount ? `TZS ${parseFloat(summary.paid_amount).toLocaleString()}` : 'TZS 0'}</h4>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg">
          <div className="card bg-transparent h-100 border rounded-0">
            <div className="card-body">
              <h6 className="text-muted mb-2 text-center">Outstanding </h6><br />
              <h4 className="mb-0 text-danger">{summary?.outstanding_balance ? `TZS ${parseFloat(summary.outstanding_balance).toLocaleString()}` : 'TZS 0'}</h4>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg">
          <div className="card bg-transparent h-100 border rounded-0">
            <div className="card-body">
              <h6 className="text-muted mb-2 text-center">Next Payment Due</h6><br />
              <h5 className="mb-0 text-center">
                {summary?.next_payment_due_date
                  ? new Date(summary.next_payment_due_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }).replace(/\//g, ' - ')
                  : 'N/A'}
              </h5>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg">
          <div className="card bg-transparent h-100 border rounded-0">
            <div className="card-body">
              <h6 className="text-muted mb-2 text-center">Account Status</h6><br />
              <h5 className="mb-0 text-center" style={{ color: summary?.status === 'Active' ? '#22c55e' : '#ef4444' }}>
                {summary?.status || 'Active'}
              </h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default TaxSummary
