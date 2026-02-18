import { useState, useEffect } from 'react'
import api from '../api/axios'

const Payment = () => {
  const [taxAccounts, setTaxAccounts] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentData, setPaymentData] = useState({
    tax_account: '',
    amount: '',
    payment_method: 'Mobile Money'
  })
  const [paymentError, setPaymentError] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState('')

  useEffect(() => {
    fetchPaymentData()
  }, [])

  const fetchPaymentData = async () => {
    try {
      const [accountsRes, paymentsRes] = await Promise.all([
        api.get('/tax-accounts/'),
        api.get('/payments/')
      ])
      
      setTaxAccounts(accountsRes.data.results || accountsRes.data)
      setPayments(paymentsRes.data.results || paymentsRes.data)
    } catch (error) {
      console.error('Error fetching payment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    setPaymentError('')
    setPaymentSuccess('')

    try {
      const response = await api.post('/payments/', paymentData)
      setPaymentSuccess(`Payment request created! ${response.data.control_number ? `Control Number: ${response.data.control_number}` : `Reference: ${response.data.payment.provider_reference}`}`)
      setPaymentData({
        tax_account: '',
        amount: '',
        payment_method: 'Mobile Money'
      })
      fetchPaymentData()
    } catch (error) {
      setPaymentError(error.response?.data?.detail || 'Payment request failed')
    }
  }

  const handleMarkAsPaid = async (paymentId) => {
    try {
      await api.post(`/payments/${paymentId}/mark_paid/`)
      fetchPaymentData()
    } catch (error) {
      console.error('Error marking payment as paid:', error)
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
    <div className="container-fluid p-3">
      <h2 className="mb-4">Payments</h2>
      
      {/* Make Payment Section */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Make Payment</h4>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowPaymentForm(!showPaymentForm)}
            >
              {showPaymentForm ? 'Cancel' : 'New Payment'}
            </button>
          </div>
        </div>
        
        <div className="card-body">
          {showPaymentForm && (
            <form onSubmit={handlePaymentSubmit}>
              {paymentError && <div className="alert alert-danger">{paymentError}</div>}
              {paymentSuccess && <div className="alert alert-success">{paymentSuccess}</div>}
              
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Select Tax Account</label>
                  <select
                    className="form-select"
                    value={paymentData.tax_account}
                    onChange={(e) => setPaymentData({...paymentData, tax_account: e.target.value ? parseInt(e.target.value) : ''})}
                    required
                  >
                    <option value="">Select Account</option>
                    {taxAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.tax_type_name} - TZS {parseFloat(account.outstanding_balance).toLocaleString()} outstanding
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-6">
                  <label className="form-label">Amount to Pay</label>
                  <input
                    type="number"
                    className="form-control"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                    required
                    min="1"
                  />
                </div>
                
                <div className="col-12">
                  <label className="form-label">Payment Method</label>
                  <div className="d-flex flex-wrap gap-3">
                    <div className="form-check">
                      <input
                        type="radio"
                        name="payment_method"
                        value="Mobile Money"
                        checked={paymentData.payment_method === 'Mobile Money'}
                        onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
                        className="form-check-input"
                        id="paymentMobile"
                      />
                      <label className="form-check-label" htmlFor="paymentMobile">
                        Mobile Money (M-Pesa, Tigo Pesa, Airtel Money)
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        type="radio"
                        name="payment_method"
                        value="Pesapal"
                        checked={paymentData.payment_method === 'Pesapal'}
                        onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
                        className="form-check-input"
                        id="paymentPesapal"
                      />
                      <label className="form-check-label" htmlFor="paymentPesapal">
                        Pesapal
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        type="radio"
                        name="payment_method"
                        value="Generate Control Number"
                        checked={paymentData.payment_method === 'Generate Control Number'}
                        onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
                        className="form-check-input"
                        id="paymentControl"
                      />
                      <label className="form-check-label" htmlFor="paymentControl">
                        Generate Control Number
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <button type="submit" className="btn btn-success mt-3">Submit Payment</button>
            </form>
          )}
          
          {/* Payment History */}
          <div className="mt-4">
            <h5 className="mb-3">Payment History</h5>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Reference</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length > 0 ? payments.map(payment => (
                    <tr key={payment.id}>
                      <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                      <td>TZS {parseFloat(payment.amount).toLocaleString()}</td>
                      <td>{payment.payment_method}</td>
                      <td>
                        <span className={`badge ${payment.status === 'Completed' ? 'bg-success' : payment.status === 'Pending' ? 'bg-warning' : 'bg-danger'}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td>{payment.control_number || payment.provider_reference || '-'}</td>
                      <td>
                        {payment.status === 'Pending' && (
                          <button 
                            className="btn btn-success btn-sm" 
                            onClick={() => handleMarkAsPaid(payment.id)}
                          >
                            Mark as Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="text-center">No payment history</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payment
