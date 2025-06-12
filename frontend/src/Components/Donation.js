import React, { useEffect, useState } from 'react';
import { fundService, donationService } from '../services/api';
import './Adash.css';
import './DonationModern.css';
import Header from './Header';

const QR_CODE_URL = '/QR.jpg';
const UPI_ID = 'prathameshbembre01@oksbi';
const ACCOUNT_HOLDER = 'Prathamesh Kailash Bembre';

const Donation = () => {
  const [userRole, setUserRole] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', amount: '', upiRef: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [notifying, setNotifying] = useState(false);
  const [editingRaisedId, setEditingRaisedId] = useState(null);
  const [raisedInput, setRaisedInput] = useState(0);
  const [updatingRaised, setUpdatingRaised] = useState(false);
  const [selectedPayCampaign, setSelectedPayCampaign] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setUserRole(user?.role || null);
    fetchCampaigns();
    if (user?.role === 'admin') fetchTransactions();
    if (user?.role === 'alumni') fetchMyDonations();
    if (user?.role === 'alumni') setForm(f => ({ ...f, name: user?.name || '', email: user?.email || '' }));
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fundService.getFunds();
      setCampaigns(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load campaigns');
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await donationService.getTransactions();
      setTransactions(res.data);
    } catch (err) {
      setError('Failed to load transactions');
    }
  };

  const fetchMyDonations = async () => {
    try {
      const res = await donationService.getMyDonations();
      setMyDonations(res.data);
    } catch (err) {
      setError('Failed to load your donations');
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNotifyAdmin = async (e) => {
    e.preventDefault();
    setNotifying(true);
    setError(null);
    setSuccess(null);
    try {
      await donationService.notifyAdmin({
        name: form.name,
        email: form.email,
        amount: form.amount
      });
      setSuccess('Thank you! Your donation has been reported. The admin will verify and contact you if needed.');
      setForm({ name: '', email: '', amount: '' });
    } catch (err) {
      setError('Failed to notify admin. Please try again.');
    }
    setNotifying(false);
  };

  const handleAlumniDonation = async (campaignId, amount, upiRef) => {
    setError(null);
    setSuccess(null);
    setReceiptUrl(null);
    try {
      const res = await donationService.submitDonation({ campaignId, amount, upiRef });
      setSuccess('Thank you! Your donation has been received.');
      setReceiptUrl(res.data.receiptUrl);
      await fetchCampaigns();
      console.log('[DEBUG] Campaigns after donation:', campaigns);
    } catch (err) {
      // If the error response contains a transaction, treat as success
      if (err.response && err.response.data && err.response.data.transaction) {
        setSuccess('Thank you! Your donation has been received.');
        if (err.response.data.receiptUrl) setReceiptUrl(err.response.data.receiptUrl);
        await fetchCampaigns();
        return;
      }
      setError('Failed to submit donation. Please try again.');
    }
  };

  if (loading) return <div className="container py-5 text-center"><div className="spinner-border text-primary" /></div>;

  // Admin view: show all campaigns and all transactions
  if (userRole === 'admin') {
    return (
      <>
        <Header />
        <div className="container py-5">
          <h2 className="mb-4 text-primary fw-bold" style={{ letterSpacing: 1 }}>Donation Campaigns</h2>
          {campaigns.length === 0 && <div>No campaigns found.</div>}
          <div className="row g-4">
            {campaigns.map(camp => {
              const myContribution = myDonations.filter(tx => tx.campaign?._id === camp._id && tx.status === 'confirmed').reduce((sum, tx) => sum + Number(tx.amount), 0);
              const percent = camp.amount ? Math.min(100, Math.round((camp.raised / camp.amount) * 100)) : 0;
              const goalAchieved = camp.raised >= camp.amount;
              return (
                <div key={camp._id} className="col-md-6 col-lg-4">
                  <div className={`modern-donation-card card border-0 shadow-lg h-100 position-relative ${goalAchieved ? 'goal-achieved' : ''}`}
                    style={{ background: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)', transition: 'transform 0.2s', fontFamily: 'Poppins, Arial, sans-serif' }}>
                    {goalAchieved && (
                      <span className="badge bg-success position-absolute top-0 end-0 m-3 fs-6 px-3 py-2 shadow">Goal Achieved!</span>
                    )}
                    <div className="card-body d-flex flex-column justify-content-between">
                      <div className="d-flex align-items-center mb-3">
                        <div className="rounded-circle bg-gradient text-white d-flex align-items-center justify-content-center me-3 shadow"
                          style={{ width: 54, height: 54, fontSize: 28, background: 'linear-gradient(135deg, #4e54c8, #8f94fb)' }}>
                          <i className="fa fa-hand-holding-heart" />
                        </div>
                        <div>
                          <h4 className="card-title mb-0 text-primary fw-bold" style={{ fontSize: 22 }}>{camp.title}</h4>
                          <small className="text-muted">Target: <span className="fw-semibold">₹{camp.amount}</span></small>
                        </div>
                      </div>
                      <p className="mb-3 text-secondary" style={{ minHeight: 48 }}>{camp.description}</p>
                      <div className="d-flex align-items-center mb-3">
                        <span className="fw-bold text-success fs-5">Raised: ₹{camp.raised}</span>
                      </div>
                      <div className="progress modern-progress mb-2" style={{ height: 22, background: '#e9ecef', borderRadius: 12, overflow: 'hidden' }}>
                        <div className="progress-bar bg-success progress-bar-animated" role="progressbar" style={{ width: `${percent}%`, fontWeight: 600, fontSize: 16, transition: 'width 0.7s cubic-bezier(.4,2,.6,1)' }} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>{percent}%</div>
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.95rem' }}>Your Contribution: ₹{myContribution}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // Alumni view: show campaigns, donate, see own donations
  if (userRole === 'alumni') {
    return (
      <>
        <Header />
        <div className="container py-5">
          <h2 className="mb-4 text-primary fw-bold text-center" style={{ letterSpacing: 1, fontSize: '2.2rem' }}>Support Our Mission</h2>
          {/* Campaign Cards with Progress Bar */}
          {!selectedPayCampaign ? (
            campaigns.length === 0 ? <div className="text-center text-muted mb-5">No campaigns available.</div> : (
              <div className="row g-4 mb-5">
                {campaigns.map(camp => {
                  const myContribution = myDonations.filter(tx => tx.campaign?._id === camp._id && tx.status === 'confirmed').reduce((sum, tx) => sum + Number(tx.amount), 0);
                  const percent = camp.amount ? Math.min(100, Math.round((camp.raised / camp.amount) * 100)) : 0;
                  const goalAchieved = camp.raised >= camp.amount;
                  return (
                    <div key={camp._id} className="col-md-6 col-lg-4">
                      <div className={`modern-donation-card card border-0 shadow-lg h-100 position-relative ${goalAchieved ? 'goal-achieved' : ''}`}
                        style={{ background: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)', transition: 'transform 0.2s', fontFamily: 'Poppins, Arial, sans-serif' }}>
                        {goalAchieved && (
                          <span className="badge bg-success position-absolute top-0 end-0 m-3 fs-6 px-3 py-2 shadow">Goal Achieved!</span>
                        )}
                        <div className="card-body d-flex flex-column justify-content-between">
                          <div className="d-flex align-items-center mb-3">
                            <div className="rounded-circle bg-gradient text-white d-flex align-items-center justify-content-center me-3 shadow"
                              style={{ width: 54, height: 54, fontSize: 28, background: 'linear-gradient(135deg, #4e54c8, #8f94fb)' }}>
                              <i className="fa fa-hand-holding-heart" />
                            </div>
                            <div>
                              <h4 className="card-title mb-0 text-primary fw-bold" style={{ fontSize: 22 }}>{camp.title}</h4>
                              <small className="text-muted">Target: <span className="fw-semibold">₹{camp.amount}</span></small>
                            </div>
                          </div>
                          <p className="mb-3 text-secondary" style={{ minHeight: 48 }}>{camp.description}</p>
                          <div className="d-flex align-items-center mb-3">
                            <span className="fw-bold text-success fs-5">Raised: ₹{camp.raised}</span>
                          </div>
                          <div className="progress modern-progress mb-2" style={{ height: 22, background: '#e9ecef', borderRadius: 12, overflow: 'hidden' }}>
                            <div className="progress-bar bg-success progress-bar-animated" role="progressbar" style={{ width: `${percent}%`, fontWeight: 600, fontSize: 16, transition: 'width 0.7s cubic-bezier(.4,2,.6,1)' }} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>{percent}%</div>
                          </div>
                          <div className="text-muted mb-3" style={{ fontSize: '0.95rem' }}>Your Contribution: ₹{myContribution}</div>
                          <button className="btn btn-primary btn-lg w-100 rounded-pill shadow" style={{ fontWeight: 600, fontSize: '1.1rem', letterSpacing: 1 }} onClick={() => setSelectedPayCampaign(camp)}>Pay</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="row justify-content-center align-items-stretch g-4 mb-5">
              <div className="col-lg-6 d-flex align-items-center justify-content-center">
                <div className="modern-donation-card card border-0 shadow-lg p-4 w-100" style={{ maxWidth: 420, background: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)', borderRadius: '2rem' }}>
                  <h4 className="mb-3 text-primary text-center fw-bold">Scan & Donate via UPI</h4>
                  <div className="d-flex flex-column align-items-center">
                    <img src={QR_CODE_URL} alt="UPI QR Code" style={{ width: 220, height: 220, objectFit: 'contain', border: '1px solid #eee', borderRadius: 16, boxShadow: '0 4px 16px rgba(78,84,200,0.10)' }} />
                    <div className="mt-4 mb-2 text-center">
                      <div className="fw-semibold" style={{ fontSize: '1.1rem' }}><span className="text-secondary">UPI ID:</span> <span className="text-dark">{UPI_ID}</span></div>
                      <div className="fw-semibold"><span className="text-secondary">Account Holder:</span> <span className="text-dark">{ACCOUNT_HOLDER}</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6 d-flex align-items-center justify-content-center">
                <div className="modern-donation-card card border-0 shadow-lg p-4 w-100" style={{ maxWidth: 420, background: 'linear-gradient(135deg, #e0e7ff 60%, #f8fafc 100%)', borderRadius: '2rem' }}>
                  <h4 className="mb-3 text-primary text-center fw-bold">Notify Admin of Your Donation</h4>
                  <form onSubmit={e => {
                    e.preventDefault();
                    if (!form.amount || !form.name || !form.email || !form.upiRef) {
                      setError('All fields are required.');
                      return;
                    }
                    setNotifying(true);
                    setError(null);
                    setSuccess(null);
                    handleAlumniDonation(selectedPayCampaign._id, form.amount, form.upiRef).then(() => {
                      setNotifying(false);
                      setForm({ ...form, amount: '', upiRef: '' });
                    });
                  }} className="text-start">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Your Name</label>
                      <input type="text" name="name" className="form-control form-control-lg rounded-pill shadow-sm" value={form.name} onChange={handleFormChange} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Your Email</label>
                      <input type="email" name="email" className="form-control form-control-lg rounded-pill shadow-sm" value={form.email} onChange={handleFormChange} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Amount Donated (INR)</label>
                      <input type="number" name="amount" className="form-control form-control-lg rounded-pill shadow-sm" value={form.amount} onChange={handleFormChange} required min="1" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">UPI Reference</label>
                      <input type="text" name="upiRef" className="form-control form-control-lg rounded-pill shadow-sm" value={form.upiRef || ''} onChange={handleFormChange} required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg w-100 rounded-pill shadow" disabled={notifying} style={{ fontWeight: 600, fontSize: '1.1rem', letterSpacing: 1 }}>{notifying ? 'Submitting...' : 'I have paid via UPI'}</button>
                    {success && (
                      <div className="alert alert-success mt-3">
                        {success}
                        {receiptUrl && (
                          <div className="mt-4 text-center">
                            <a href={receiptUrl} className="btn btn-success btn-lg" target="_blank" rel="noopener noreferrer">
                              <i className="fa fa-download me-2" />Download Your Donation Receipt
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {error && <div className="alert alert-danger mt-3 rounded-pill text-center">{error}</div>}
                  </form>
                  <button className="btn btn-outline-secondary btn-lg w-100 rounded-pill mt-3" onClick={() => setSelectedPayCampaign(null)}>Back to Campaigns</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // Fallback for other roles
  return <div className="container py-5 text-center">You do not have access to this page.</div>;
};

export default Donation;

