import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import { reportsAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Upload, TrendingUp, FileText, AlertTriangle } from 'lucide-react';

function RiskBadge({ level }) {
  const cls = level === 'Low Risk' ? 'badge-green' : level === 'Medium Risk' ? 'badge-amber' : 'badge-red';
  return <span className={`badge ${cls}`}>{level || '—'}</span>;
}

function ScoreCircle({ score }) {
  const color = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
  const c = 2 * Math.PI * 52;
  const offset = c - (score / 100) * c * 0.75;
  return (
    <div style={{position:'relative',display:'inline-block'}}>
      <svg width="140" height="96" viewBox="0 0 140 96">
        <circle cx="70" cy="86" r="52" fill="none" stroke="#1e293b" strokeWidth="10"
          strokeDasharray={c} strokeDashoffset={c*0.25} strokeLinecap="round" transform="rotate(-225 70 86)"/>
        <circle cx="70" cy="86" r="52" fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-225 70 86)" style={{transition:'stroke-dashoffset 1s ease', filter:`drop-shadow(0 0 6px ${color}80)`}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',paddingBottom:4}}>
        <span style={{fontSize:28,fontWeight:800,color:'#fff'}}>{score?.toFixed(0)}</span>
        <span style={{fontSize:11,color:'#64748b'}}>/ 100</span>
      </div>
    </div>
  );
}

export default function Home() {
  const { user }       = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsAPI.summary().then(r => setData(r.data)).catch(()=>setData({total:0,reports:[]})).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  return (
    <div className="app-layout">
      <Sidebar/>
      <main className="main-content">
        <h1 style={{fontSize:22,fontWeight:700,color:'#fff',marginBottom:4}}>
          Hello, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p style={{color:'#64748b',fontSize:14,marginBottom:28}}>
          {user?.company ? `${user.company} · ` : ''}Financial Health Dashboard
        </p>

        {data?.total === 0 ? (
          <div style={{textAlign:'center',marginTop:80}}>
            <div style={{width:72,height:72,background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.2)',borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
              <TrendingUp color="#10b981" size={32}/>
            </div>
            <h2 style={{color:'#fff',fontSize:18,marginBottom:10}}>Start Your Financial Assessment</h2>
            <p style={{color:'#64748b',fontSize:14,maxWidth:380,margin:'0 auto 24px'}}>
              Upload your financial data file (CSV or Excel) to get an AI-powered health score and insights.
            </p>
            <Link to="/upload" className="btn btn-primary">
              <Upload size={16}/> Upload Financial Data
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid-4" style={{marginBottom:24}}>
              {[
                {label:'Latest Score',    value: data.latest_score ? `${data.latest_score.toFixed(0)}/100` : '—'},
                {label:'Risk Level',      value: <RiskBadge level={data.latest_risk}/>},
                {label:'Total Reports',   value: data.total},
                {label:'Average Score',   value: data.avg_score ? `${data.avg_score}/100` : '—'},
              ].map(({label,value}) => (
                <div key={label} className="card-sm">
                  <div style={{fontSize:12,color:'#64748b',marginBottom:8}}>{label}</div>
                  <div style={{fontSize:24,fontWeight:700,color:'#fff'}}>{value}</div>
                </div>
              ))}
            </div>

            {/* Score visual + recent reports */}
            <div className="grid-2">
              <div className="card" style={{textAlign:'center'}}>
                <p style={{color:'#94a3b8',fontSize:13,marginBottom:16}}>Financial Health Score</p>
                <ScoreCircle score={data.latest_score || 0}/>
                <div style={{marginTop:12}}>
                  <RiskBadge level={data.latest_risk}/>
                </div>
                <Link to="/upload" className="btn btn-primary" style={{marginTop:20,justifyContent:'center',width:'100%'}}>
                  <Upload size={15}/> Upload New Data
                </Link>
              </div>

              <div className="card" style={{padding:0,overflow:'hidden'}}>
                <div style={{padding:'16px 20px',borderBottom:'1px solid #334155',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:600,color:'#fff',fontSize:14}}>Recent Reports</span>
                  <Link to="/reports" style={{fontSize:12,color:'#10b981',textDecoration:'none'}}>View all →</Link>
                </div>
                {data.reports.map(r => (
                  <Link key={r.id} to={`/report/${r.id}`} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 20px',borderBottom:'1px solid #1e293b',textDecoration:'none',transition:'background 0.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#1a2744'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:36,height:36,background:'#0f172a',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <FileText size={16} color="#64748b"/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{color:'#e2e8f0',fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.filename}</div>
                      <div style={{color:'#475569',fontSize:11,marginTop:2}}>{r.industry} · {new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
                    </div>
                    {r.health_score && <span style={{color:'#fff',fontWeight:700,fontSize:14}}>{r.health_score.toFixed(0)}</span>}
                    {r.risk_level && <RiskBadge level={r.risk_level}/>}
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
