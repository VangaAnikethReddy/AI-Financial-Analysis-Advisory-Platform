import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Sidebar from '../components/dashboard/Sidebar';
import { uploadAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { CloudUpload, X, Loader, Upload } from 'lucide-react';

const INDUSTRIES = ['Manufacturing','Retail','Services','Technology','Agriculture','E-commerce','Logistics'];

export default function UploadPage() {
  const [file, setFile]         = useState(null);
  const [industry, setIndustry] = useState('Manufacturing');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const navigate = useNavigate();

  const onDrop = useCallback(accepted => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDropRejected: () => toast.error('Only CSV, XLSX, and PDF files allowed'),
  });

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file first');
    setUploading(true);
    setProgress('Uploading file...');

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('industry', industry);

      const { data } = await uploadAPI.upload(form);
      const reportId = data.report_id;

      setProgress('Analyzing your financial data with AI...');

      // Poll every 2 seconds until done
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const status = await uploadAPI.getStatus(reportId);
        if (status.data.status === 'completed') {
          toast.success('Analysis complete!');
          navigate(`/report/${reportId}`);
          return;
        }
        if (status.data.status === 'failed') {
          throw new Error(status.data.error || 'Analysis failed');
        }
      }
      throw new Error('Timed out. Please try again.');
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Upload failed');
      setUploading(false);
      setProgress('');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar/>
      <main className="main-content">
        <h1 style={{fontSize:22,fontWeight:700,color:'#fff',marginBottom:4}}>Upload Financial Data</h1>
        <p style={{color:'#64748b',fontSize:14,marginBottom:28}}>Upload your financial file to get an AI-powered health assessment</p>

        <div style={{maxWidth:600}}>
          {/* Industry selector */}
          <div className="card" style={{marginBottom:16}}>
            <p style={{color:'#94a3b8',fontSize:13,marginBottom:12,fontWeight:500}}>Select Your Industry</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {INDUSTRIES.map(ind => (
                <button key={ind} onClick={() => setIndustry(ind)}
                  style={{padding:'7px 14px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',border:'1px solid',
                    background: industry===ind ? 'rgba(16,185,129,.15)' : '#0f172a',
                    color:      industry===ind ? '#10b981' : '#64748b',
                    borderColor: industry===ind ? 'rgba(16,185,129,.35)' : '#334155',
                  }}>
                  {ind}
                </button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div {...getRootProps()} style={{
            border: `2px dashed ${isDragActive ? '#10b981' : '#334155'}`,
            background: isDragActive ? 'rgba(16,185,129,.05)' : '#1e293b',
            borderRadius: 16, padding: 40, textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.2s', marginBottom: 16,
          }}>
            <input {...getInputProps()} />
            <div style={{width:56,height:56,background:isDragActive?'rgba(16,185,129,.15)':'#0f172a',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
              <CloudUpload color={isDragActive?'#10b981':'#475569'} size={28}/>
            </div>
            {isDragActive ? (
              <p style={{color:'#10b981',fontWeight:600}}>Drop it here!</p>
            ) : (
              <>
                <p style={{color:'#e2e8f0',fontWeight:600,marginBottom:6}}>Drag & drop your financial file here</p>
                <p style={{color:'#475569',fontSize:13,marginBottom:12}}>or click to browse</p>
                <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                  {['CSV','XLSX','PDF'].map(t => (
                    <span key={t} style={{background:'#0f172a',color:'#64748b',padding:'3px 10px',borderRadius:6,fontSize:12,border:'1px solid #334155'}}>{t}</span>
                  ))}
                  <span style={{color:'#334155',fontSize:12,alignSelf:'center'}}>· Max 10MB</span>
                </div>
              </>
            )}
          </div>

          {/* Selected file */}
          {file && !uploading && (
            <div className="card" style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,borderColor:'rgba(16,185,129,.3)'}}>
              <div style={{flex:1}}>
                <p style={{color:'#fff',fontSize:13,fontWeight:500}}>{file.name}</p>
                <p style={{color:'#64748b',fontSize:11,marginTop:2}}>{(file.size/1024).toFixed(0)} KB · {industry}</p>
              </div>
              <button onClick={() => setFile(null)} style={{background:'none',border:'none',color:'#64748b',cursor:'pointer'}}><X size={16}/></button>
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="card" style={{marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <Loader size={18} color="#10b981" style={{animation:'spin 0.8s linear infinite'}}/>
                <span style={{color:'#e2e8f0',fontSize:14}}>{progress}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{width:'70%',background:'#10b981',animation:'pulse 1.5s ease-in-out infinite'}}/>
              </div>
              <p style={{color:'#475569',fontSize:12,marginTop:8}}>AI analysis takes 15–30 seconds…</p>
            </div>
          )}

          {/* Upload button */}
          {!uploading && (
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'14px'}} onClick={handleUpload} disabled={!file}>
              <Upload size={17}/>
              {file ? `Analyze "${file.name}"` : 'Select a file to continue'}
            </button>
          )}

          {/* CSV format hint */}
          <div className="card" style={{marginTop:16}}>
            <p style={{color:'#94a3b8',fontSize:13,fontWeight:500,marginBottom:10}}>📋 Expected CSV Format</p>
            <div style={{background:'#0f172a',borderRadius:8,padding:12,overflowX:'auto'}}>
              <code style={{fontSize:11,color:'#10b981',whiteSpace:'pre'}}{...{}}>{`month,revenue,operating_expenses,net_profit,cash_flow
Jan-2024,850000,500000,160000,95000
Feb-2024,920000,540000,183000,110000
Mar-2024,1050000,620000,225000,145000`}</code>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
