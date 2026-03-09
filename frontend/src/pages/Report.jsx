import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import Sidebar from '../components/dashboard/Sidebar';
import { reportsAPI } from '../utils/api';
import { ArrowLeft, Lightbulb, AlertTriangle, TrendingUp, Scissors, BarChart2, CreditCard, Loader, ExternalLink } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const CHART_OPTS = {
  responsive: true,
  plugins: { legend: { labels: { color: '#64748b', font: { size: 11 } } } },
  scales: {
    x: { ticks: { color: '#475569' }, grid: { color: '#1e293b' } },
    y: { ticks: { color: '#475569', callback: v => `₹${(v/100000).toFixed(0)}L` }, grid: { color: '#1e293b' } },
  }
};

function RiskBadge({ level }) {
  const cls = level === 'Low Risk' ? 'badge-green' : level === 'Medium Risk' ? 'badge-amber' : 'badge-red';
  return <span className={`badge ${cls}`}>{level}</span>;
}

function MetricRow({ label, value, unit, good }) {
  const color = good ? '#10b981' : value > 0 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #1e293b'}}>
      <span style={{color:'#94a3b8',fontSize:13}}>{label}</span>
      <span style={{fontWeight:700,fontSize:15,color}}>{value?.toFixed(1)}{unit}</span>
    </div>
  );
}

function InsightBox({ icon: Icon, title, text, color }) {
  const colors = { blue:'rgba(59,130,246,.08)', red:'rgba(239,68,68,.08)', green:'rgba(16,185,129,.08)', amber:'rgba(245,158,11,.08)' };
  const borders = { blue:'rgba(59,130,246,.2)', red:'rgba(239,68,68,.2)', green:'rgba(16,185,129,.2)', amber:'rgba(245,158,11,.2)' };
  const icons  = { blue:'#60a5fa', red:'#f87171', green:'#10b981', amber:'#f59e0b' };
  return (
    <div style={{background:colors[color], border:`1px solid ${borders[color]}`, borderRadius:14, padding:20}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <Icon size={15} color={icons[color]}/>
        <span style={{color:'#e2e8f0',fontSize:14,fontWeight:600}}>{title}</span>
      </div>
      <p style={{color:'#94a3b8',fontSize:13,lineHeight:1.7}}>{text || 'Loading...'}</p>
    </div>
  );
}

export default function Report() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError]   = useState(null);
  const [tab, setTab]       = useState('overview');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await reportsAPI.get(id);
        setReport(data);
      } catch (err) {
        if (err.response?.status === 202) { setTimeout(load, 3000); return; }
        setError(err.response?.data?.detail || 'Failed to load report');
      }
    };
    load();
  }, [id]);

  if (error) return (
    <div className="app-layout"><Sidebar/>
      <main className="main-content" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center'}}>
          <AlertTriangle color="#ef4444" size={40} style={{marginBottom:16}}/>
          <p style={{color:'#fff',fontWeight:600,marginBottom:8}}>Failed to Load Report</p>
          <p style={{color:'#64748b',fontSize:13}}>{error}</p>
          <Link to="/upload" style={{color:'#10b981',fontSize:13,marginTop:16,display:'block'}}>← Try uploading again</Link>
        </div>
      </main>
    </div>
  );

  if (!report) return (
    <div className="app-layout"><Sidebar/>
      <main className="main-content" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center'}}>
          <Loader color="#10b981" size={36} style={{animation:'spin 0.8s linear infinite',marginBottom:16}}/>
          <p style={{color:'#94a3b8'}}>AI is analyzing your financial data…</p>
          <p style={{color:'#475569',fontSize:12,marginTop:6}}>This takes 15–30 seconds</p>
        </div>
      </main>
    </div>
  );

  const m = report.metrics || {};
  const months = (report.monthly_data || []).map(d => d.month);

  // Chart datasets
  const revenueExpChart = {
    labels: months,
    datasets: [
      { label: 'Revenue',  data: (report.monthly_data||[]).map(d=>d.revenue),  backgroundColor: 'rgba(16,185,129,.8)',  borderRadius: 4 },
      { label: 'Expenses', data: (report.monthly_data||[]).map(d=>d.expenses), backgroundColor: 'rgba(239,68,68,.7)',   borderRadius: 4 },
    ]
  };

  const profitChart = {
    labels: months,
    datasets: [{ label:'Net Profit', data:(report.monthly_data||[]).map(d=>d.profit), borderColor:'#10b981', backgroundColor:'rgba(16,185,129,.1)', fill:true, tension:0.4, pointRadius:3 }]
  };

  const cashflowChart = {
    labels: months,
    datasets: [{ label:'Cash Flow', data:(report.monthly_data||[]).map(d=>d.cash_flow), borderColor:'#38bdf8', backgroundColor:'rgba(56,189,248,.1)', fill:true, tension:0.4, pointRadius:3 }]
  };

  const scoreChart = {
    labels: ['Profitability','Revenue Growth','Expense Control','Cash Flow','Debt Mgmt'],
    datasets: [{ data: Object.values(m.sub_scores||{profitability:0,revenue_growth:0,expense_control:0,cash_flow:0,debt_mgmt:0}),
      backgroundColor:['rgba(16,185,129,.85)','rgba(59,130,246,.85)','rgba(245,158,11,.85)','rgba(56,189,248,.85)','rgba(167,139,250,.85)'],
      borderColor:'#0f172a', borderWidth:2 }]
  };

  const scoreColor = report.health_score >= 70 ? '#10b981' : report.health_score >= 45 ? '#f59e0b' : '#ef4444';

  const TABS = [
    { id:'overview', label:'Overview',    icon: BarChart2 },
    { id:'charts',   label:'Charts',      icon: TrendingUp },
    { id:'insights', label:'AI Insights', icon: Lightbulb },
    { id:'loans',    label:'Loan Products', icon: CreditCard },
  ];

  return (
    <div className="app-layout">
      <Sidebar/>
      <main className="main-content">
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
          <Link to="/reports" style={{color:'#64748b',display:'flex',alignItems:'center'}}><ArrowLeft size={18}/></Link>
          <div>
            <h1 style={{fontSize:20,fontWeight:700,color:'#fff'}}>{report.filename}</h1>
            <p style={{color:'#64748b',fontSize:13}}>{report.industry} · {new Date(report.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map(({id,label,icon:Icon}) => (
            <button key={id} className={`tab ${tab===id?'active':''}`} onClick={() => setTab(id)}>
              <Icon size={14}/> {label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ───────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="grid-2" style={{alignItems:'start'}}>
            {/* Score card */}
            <div className="card" style={{textAlign:'center'}}>
              <p style={{color:'#94a3b8',fontSize:13,marginBottom:16}}>Financial Health Score</p>
              <div style={{fontSize:64,fontWeight:800,color:scoreColor,lineHeight:1}}>{report.health_score?.toFixed(0)}</div>
              <div style={{color:'#64748b',fontSize:14,marginBottom:16}}>out of 100</div>
              <RiskBadge level={report.risk_level}/>

              {/* Sub-score bars */}
              {m.sub_scores && (
                <div style={{marginTop:24,textAlign:'left'}}>
                  {Object.entries(m.sub_scores).map(([k,v]) => {
                    const lbl = k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
                    const col = v>=70?'#10b981':v>=45?'#f59e0b':'#ef4444';
                    return (
                      <div key={k} style={{marginBottom:10}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                          <span style={{color:'#64748b'}}>{lbl}</span>
                          <span style={{color:col,fontWeight:600}}>{v?.toFixed(0)}</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width:`${v}%`,background:col}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Metrics */}
            <div className="card">
              <p style={{color:'#fff',fontWeight:600,fontSize:14,marginBottom:4}}>Key Financial Metrics</p>
              <MetricRow label="Profit Margin"       value={m.profit_margin}  unit="%" good={m.profit_margin >= 10}/>
              <MetricRow label="Revenue Growth"      value={m.growth_rate}    unit="%" good={m.growth_rate >= 5}/>
              <MetricRow label="Expense Ratio"       value={m.expense_ratio}  unit="%" good={m.expense_ratio <= 75}/>
              <MetricRow label="Debt Ratio"          value={m.debt_ratio}     unit="%" good={m.debt_ratio <= 40}/>
              <MetricRow label="Cash Flow Stability" value={m.cashflow_score} unit="%" good={m.cashflow_score >= 70}/>
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0'}}>
                <span style={{color:'#94a3b8',fontSize:13}}>Annual Revenue</span>
                <span style={{fontWeight:700,color:'#fff'}}>₹{((m.total_revenue||0)/100000).toFixed(1)}L</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0'}}>
                <span style={{color:'#94a3b8',fontSize:13}}>Annual Profit</span>
                <span style={{fontWeight:700,color:'#10b981'}}>₹{((m.total_profit||0)/100000).toFixed(1)}L</span>
              </div>
            </div>
          </div>
        )}

        {/* ── CHARTS ─────────────────────────────────────────── */}
        {tab === 'charts' && (
          <div className="grid-2">
            <div className="card"><p style={{color:'#fff',fontWeight:600,fontSize:13,marginBottom:16}}>Revenue vs Expenses</p><Bar data={revenueExpChart} options={CHART_OPTS}/></div>
            <div className="card"><p style={{color:'#fff',fontWeight:600,fontSize:13,marginBottom:16}}>Profit Trend</p><Line data={profitChart} options={CHART_OPTS}/></div>
            <div className="card"><p style={{color:'#fff',fontWeight:600,fontSize:13,marginBottom:16}}>Cash Flow Trend</p><Line data={cashflowChart} options={{...CHART_OPTS,scales:{...CHART_OPTS.scales,y:{...CHART_OPTS.scales.y,ticks:{color:'#475569',callback:v=>`₹${(v/100000).toFixed(0)}L`}}}}}/></div>
            <div className="card"><p style={{color:'#fff',fontWeight:600,fontSize:13,marginBottom:16}}>Score Breakdown</p><Doughnut data={scoreChart} options={{responsive:true,cutout:'60%',plugins:{legend:{position:'right',labels:{color:'#64748b',font:{size:11},padding:10,boxWidth:12}}}}}/></div>
          </div>
        )}

        {/* ── AI INSIGHTS ─────────────────────────────────────── */}
        {tab === 'insights' && (
          <div className="grid-2">
            <InsightBox icon={Lightbulb}      title="Key Financial Insights"      text={report.ai_insights}      color="blue"/>
            <InsightBox icon={AlertTriangle}  title="Financial Risks"             text={report.ai_risks}         color="red"/>
            <InsightBox icon={TrendingUp}     title="Growth Opportunities"        text={report.ai_opportunities} color="green"/>
            <InsightBox icon={Scissors}       title="Cost Optimization Tips"      text={report.ai_cost_tips}     color="amber"/>
          </div>
        )}

        {/* ── LOANS ───────────────────────────────────────────── */}
        {tab === 'loans' && (
          <div>
            <p style={{color:'#64748b',fontSize:13,marginBottom:20}}>
              Based on your {report.risk_level} financial profile, here are matched loan products:
            </p>
            <div className="grid-3">
              {(report.recommendations||[]).map((r,i) => {
                const typeColor = r.product_type==='Business Loan'?'badge-blue':r.product_type==='Working Capital'?'badge-amber':r.product_type==='Mudra Loan'?'badge-green':'badge-blue';
                return (
                  <div key={i} className="card" style={{display:'flex',flexDirection:'column',gap:12}}>
                    <div>
                      <span className={`badge ${typeColor}`} style={{marginBottom:8,display:'inline-block'}}>{r.product_type}</span>
                      <p style={{color:'#fff',fontWeight:600,fontSize:14}}>{r.product_name}</p>
                      <p style={{color:'#64748b',fontSize:12,marginTop:4}}>{r.provider}</p>
                    </div>

                    {/* Match score bar */}
                    <div>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#64748b',marginBottom:4}}>
                        <span>Match Score</span><span>{r.match_score?.toFixed(0)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{width:`${r.match_score}%`, background: r.match_score>=75?'#10b981':r.match_score>=50?'#f59e0b':'#64748b'}}/>
                      </div>
                    </div>

                    <div className="grid-2" style={{gap:8}}>
                      <div style={{background:'#0f172a',borderRadius:8,padding:10}}>
                        <p style={{color:'#475569',fontSize:11}}>Interest Rate</p>
                        <p style={{color:'#fff',fontWeight:700,fontSize:13}}>{r.rate_min}%–{r.rate_max}%</p>
                      </div>
                      <div style={{background:'#0f172a',borderRadius:8,padding:10}}>
                        <p style={{color:'#475569',fontSize:11}}>Max Amount</p>
                        <p style={{color:'#fff',fontWeight:700,fontSize:13}}>₹{(r.max_amount/100000).toFixed(0)}L</p>
                      </div>
                    </div>

                    <p style={{color:'#64748b',fontSize:12,lineHeight:1.5}}>{r.reason}</p>

                    <a href={r.apply_url} target="_blank" rel="noreferrer"
                      style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,background:'#0f172a',border:'1px solid #334155',borderRadius:8,padding:'9px',color:'#94a3b8',fontSize:13,textDecoration:'none',transition:'all 0.15s',marginTop:'auto'}}
                      onMouseEnter={e=>{e.currentTarget.style.background='#1e293b';e.currentTarget.style.color='#fff'}}
                      onMouseLeave={e=>{e.currentTarget.style.background='#0f172a';e.currentTarget.style.color='#94a3b8'}}>
                      Apply Now <ExternalLink size={12}/>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
