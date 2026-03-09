import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { TrendingUp } from 'lucide-react';

const INDUSTRIES = ['Manufacturing','Retail','Services','Technology','Agriculture','E-commerce','Logistics'];

export default function Register() {
  const [form, setForm] = useState({ full_name:'', email:'', password:'', company:'', industry:'Services' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const change = e => setForm({...form, [e.target.name]: e.target.value});

  const submit = async e => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be 6+ characters'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:52,height:52,background:'rgba(16,185,129,.15)',borderRadius:14,border:'1px solid rgba(16,185,129,.3)',marginBottom:12}}>
            <TrendingUp color="#10b981" size={24}/>
          </div>
          <div style={{fontSize:22,fontWeight:700,color:'#fff'}}>FinInsight AI</div>
          <div style={{fontSize:13,color:'#64748b',marginTop:4}}>Create your free account</div>
        </div>

        <div className="card">
          <div className="auth-title">Get Started</div>
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" name="full_name" placeholder="Rahul Sharma"
                value={form.full_name} onChange={change} required />
            </div>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input className="form-input" name="company" placeholder="ABC Pvt Ltd"
                value={form.company} onChange={change} />
            </div>
            <div className="form-group">
              <label className="form-label">Industry</label>
              <select className="form-input" name="industry" value={form.industry} onChange={change}>
                {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" name="email" placeholder="you@company.com"
                value={form.email} onChange={change} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password (min 6 characters)</label>
              <input className="form-input" type="password" name="password" placeholder="Create a password"
                value={form.password} onChange={change} required />
            </div>
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <div className="auth-footer">
            Have an account? <Link to="/login" className="auth-link">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
