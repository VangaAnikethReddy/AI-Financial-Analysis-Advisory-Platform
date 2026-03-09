import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { TrendingUp } from 'lucide-react';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Wrong email or password');
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
          <div style={{fontSize:13,color:'#64748b',marginTop:4}}>Financial Analysis & Advisory Platform</div>
        </div>

        <div className="card">
          <div className="auth-title">Sign In</div>
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@company.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Your password"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="auth-footer">
            No account? <Link to="/register" className="auth-link">Create one free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
