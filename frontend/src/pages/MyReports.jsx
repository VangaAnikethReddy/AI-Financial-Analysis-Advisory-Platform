import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import { reportsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { FileText, Upload, Trash2, ChevronRight, Loader, AlertCircle, CheckCircle } from 'lucide-react';

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsAPI.list().then(r => setReports(r.data)).catch(() => toast.error('Failed to load reports')).finally(() => setLoading(false));
  }, []);

  const del = async (id, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!window.confirm('Delete this report?')) return;
    try {
      await reportsAPI.delete(id);
      setReports(prev => prev.filter(r => r.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const RiskBadge = ({ level }) => {
    const cls = level==='Low Risk'?'badge-green':level==='Medium Risk'?'badge-amber':'badge-red';
    return level ? <span className={`badge ${cls}`}>{level}</span> : null;
  };

  const StatusIcon = ({ s }) => {
    if (s==='completed')  return <CheckCircle size={15} color="#10b981"/>;
    if (s==='processing') return <Loader size={15} color="#60a5fa" style={{animation:'spin 0.8s linear infinite'}}/>;
    return <AlertCircle size={15} color="#ef4444"/>;
  };

  return (
    <div className="app-layout">
      <Sidebar/>
      <main className="main-content">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:'#fff'}}>My Reports</h1>
            <p style={{color:'#64748b',fontSize:14,marginTop:4}}>{reports.length} report{reports.length!==1?'s':''}</p>
          </div>
          <Link to="/upload" className="btn btn-primary"><Upload size={15}/> Upload New</Link>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:60}}><div className="spinner" style={{margin:'0 auto'}}/></div>
        ) : reports.length === 0 ? (
          <div style={{textAlign:'center',padding:60}}>
            <FileText color="#334155" size={40} style={{margin:'0 auto 16px'}}/>
            <p style={{color:'#64748b'}}>No reports yet.</p>
            <Link to="/upload" style={{color:'#10b981',fontSize:13,marginTop:8,display:'block'}}>Upload your first file →</Link>
          </div>
        ) : (
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            {reports.map((r, i) => (
              <Link key={r.id} to={r.status==='completed'?`/report/${r.id}`:'#'}
                style={{display:'flex',alignItems:'center',gap:14,padding:'14px 20px',borderBottom:i<reports.length-1?'1px solid #1e293b':'none',textDecoration:'none',transition:'background 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#1a2744'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>

                <div style={{width:36,height:36,background:'#0f172a',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <FileText size={16} color="#475569"/>
                </div>

                <div style={{flex:1,minWidth:0}}>
                  <p style={{color:'#e2e8f0',fontSize:14,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.filename}</p>
                  <p style={{color:'#475569',fontSize:12,marginTop:2}}>{r.industry} · {new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                </div>

                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <StatusIcon s={r.status}/>
                  {r.health_score && <span style={{color:'#fff',fontWeight:700,fontSize:14}}>{r.health_score.toFixed(0)}</span>}
                  <RiskBadge level={r.risk_level}/>
                  <button onClick={e=>del(r.id,e)} style={{background:'none',border:'none',color:'#334155',cursor:'pointer',padding:4,borderRadius:6,transition:'all 0.15s'}}
                    onMouseEnter={e=>{e.currentTarget.style.color='#ef4444';e.currentTarget.style.background='rgba(239,68,68,.1)'}}
                    onMouseLeave={e=>{e.currentTarget.style.color='#334155';e.currentTarget.style.background='none'}}>
                    <Trash2 size={14}/>
                  </button>
                  <ChevronRight size={14} color="#334155"/>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
