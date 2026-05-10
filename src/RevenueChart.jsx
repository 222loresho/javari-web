import { useState, useEffect } from "react";
import api from "./api";

export default function RevenueChart() {
  const [data,    setData]    = useState(null);
  const [period,  setPeriod]  = useState("weekly");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try { const r = await api.get(`/reports/revenue?period=${period}`); setData(r.data); }
    catch { setData(null); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [period]);

  const fmtLabel = (l) => {
    if (period==="daily") return l;
    if (period==="yearly") { const [y,m]=l.split("-"); return new Date(y,m-1).toLocaleDateString("en-KE",{month:"short"}); }
    return new Date(l).toLocaleDateString("en-KE",{month:"short",day:"numeric"});
  };

  const renderChart = () => {
    if (!data?.data?.length) return null;
    const maxVal = Math.max(...data.data.map(d => d.revenue), 1);
    const chartH = 180;
    const gap    = period==="daily"?28:period==="monthly"?22:52;
    const barW   = period==="daily"?18:period==="monthly"?14:36;
    const chartW = data.data.length * gap;
    return (
      <div style={{overflowX:"auto",paddingBottom:"8px"}}>
        <svg width={chartW+40} height={chartH+60} style={{display:"block"}}>
          {[0,.25,.5,.75,1].map((pct,i) => (
            <g key={i}>
              <line x1={30} y1={chartH-pct*chartH+10} x2={chartW+30} y2={chartH-pct*chartH+10} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={0} y={chartH-pct*chartH+14} fill="#666" fontSize="9">{Math.round(maxVal*pct/1000)}k</text>
            </g>
          ))}
          {data.data.map((d,i) => {
            const x    = 30+i*gap+(gap-barW)/2;
            const barH = Math.max((d.revenue/maxVal)*chartH,d.revenue>0?4:0);
            const y    = chartH-barH+10;
            const peak = data.peak&&d.label===data.peak.label;
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={barH} rx="4" fill={peak?"var(--green)":d.revenue>0?"var(--accent)":"rgba(255,255,255,0.08)"} />
                {d.revenue>0&&<text x={x+barW/2} y={y-5} fill="#aaa" fontSize="8" textAnchor="middle">{d.revenue>=1000?`${(d.revenue/1000).toFixed(1)}k`:d.revenue}</text>}
                <text x={x+barW/2} y={chartH+26} fill="#666" fontSize="9" textAnchor="middle">{fmtLabel(d.label)}</text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div style={{padding:"14px"}}>
      <div className="flex-between" style={{marginBottom:"16px"}}>
        <div className="section-title" style={{padding:0,margin:0}}>📈 Revenue Chart</div>
        <button className="btn btn-ghost btn-sm" onClick={fetchData}>🔄</button>
      </div>
      <div className="tabs" style={{marginBottom:"12px",padding:0}}>
        {[["daily","Today"],["weekly","7 Days"],["monthly","30 Days"],["yearly","12 Months"]].map(([p,l]) => (
          <button key={p} className={`tab-btn ${period===p?"active":"inactive"}`} onClick={() => setPeriod(p)}>{l}</button>
        ))}
      </div>
      {loading && <div className="loading-bar" />}
      {data && (
        <>
          <div className="stats-grid" style={{marginBottom:"16px"}}>
            <div className="stat-card">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value text-green">KSh {data.total.toLocaleString()}</div>
            </div>
            {data.peak?.revenue>0 && (
              <div className="stat-card">
                <div className="stat-label">Peak Period</div>
                <div className="stat-value" style={{fontSize:"14px"}}>{fmtLabel(data.peak.label)}</div>
                <div className="stat-sub text-green">KSh {data.peak.revenue.toLocaleString()}</div>
              </div>
            )}
          </div>
          <div className="card card-dark">
            {data.data.every(d=>d.revenue===0)
              ? <div className="empty-state"><div className="empty-icon">📊</div><div className="empty-text">No revenue data</div></div>
              : renderChart()}
          </div>
        </>
      )}
    </div>
  );
}