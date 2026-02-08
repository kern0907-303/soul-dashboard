import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
// 🔥 注意:這裡已經移除了 'Heart'，如果瀏覽器還顯示愛心，代表它讀取的絕對不是這份檔案！
import { 
  Sun, Moon, Activity, ChevronLeft, ChevronRight, 
  LayoutDashboard, Brain, Waves, Atom, Settings, ScanFace, User, Save, Grid, Flame, X, Database, MapPin, GitCommit, Cpu, Zap, History, Trash2, Camera, Calendar, Users, Compass
} from 'lucide-react';
import html2canvas from 'html2canvas';

// ==========================================
// 0. 系統設定
// ==========================================
const API_BASE = 'https://soul-dashboard.onrender.com';

// ==========================================
// 1. 全域變數 & 工具函式
// ==========================================

const getColor = (score) => {
  if (score >= 80) return { fill: '#22d3ee', stroke: '#cffafe', intensity: 'high' };
  if (score >= 60) return { fill: '#06b6d4', stroke: '#67e8f9', intensity: 'mid' };
  return { fill: '#0e7490', stroke: '#164e63', intensity: 'low' };
};

const calcRelationNum = (n1, n2) => {
    if (!n1 || !n2) return "-";
    let sum = n1 + n2;
    if (sum > 12) {
        let s_str = sum.toString();
        let reduced = 0;
        for(let char of s_str) reduced += parseInt(char);
        return reduced;
    }
    return sum;
};

// 顯示後端完整格式 (保留符號與中間過程)
const formatRawNum = (rawStr) => {
    if (!rawStr || rawStr === "--/--") return "--/--";
    return rawStr;
};

const cleanDateStr = (dateStr) => {
    if (!dateStr) return "----";
    return dateStr.replace("陽曆 ", "").replace("陰曆 ", "");
};

const DEFAULT_DATA = {
  year: 2026,
  solarDateStr: "----年--月--日", lunarDateStr: "----年--月--日",
  todayDateStr: "----/--/--", lunarTodayStr: "----/--/--",
  solar: "--", solarKw: "等待計算", flowSolarLv: "-",
  solarMonth: "--", solarMonthNum: 0, solarDay: "--", solarDayNum: 0,
  lunar: "--", lunarKw: "等待計算", flowLunarLv: "-",
  lunarMonth: "--", lunarMonthNum: 0, lunarDay: "--", lunarDayNum: 0,
  mainSolar: "--/--", mainSolarLv: "-", mainSolarNum: 0,
  mainLunar: "--/--", mainLunarLv: "-", mainLunarNum: 0,
  solarWheel: [], lunarRadar: [],
  matrixData: { solar: { counts: {}, lines: [] }, lunar: { counts: {}, lines: [] } }
};

// ==========================================
// 2. 元件定義
// ==========================================

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const title = data.name || data.subject || "項目";
    let value = data.score !== undefined ? data.score : (data.A !== undefined ? data.A : 0);
    const color = data.fill || '#a855f7'; 
    return (
      <div className="bg-slate-900/90 border border-cyan-500/30 p-3 rounded-lg shadow-xl backdrop-blur-sm z-50">
        <p className="text-cyan-300 text-sm font-bold mb-1">{title}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
          <p className="text-white text-lg font-mono">{value} <span className="text-xs text-slate-400">/ 100</span></p>
          {data.hasFlowBuff && (<span className="ml-2 text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/50 flex items-center gap-1"><Flame size={8} title="流年加持效果" /> 流年加持</span>)}
        </div>
      </div>
    );
  }
  return null;
};

const FlowTriangle = ({ flowValue, mainValue, colorClass, scale = 1 }) => {
  const currentFlow = parseInt(flowValue.toString().split('/').pop()) || 0;
  const rootLifePath = parseInt(mainValue.toString().split('/').pop()) || 0;
  const activeColor = colorClass === 'cyan' ? 'bg-cyan-200 shadow-[0_0_15px_#22d3ee] border border-white' : 'bg-purple-200 shadow-[0_0_15px_#a855f7] border border-white';
  const baseColor = 'bg-slate-800 border border-slate-700';
  const labelColor = colorClass === 'cyan' ? 'text-cyan-500' : 'text-purple-500';
  const positions = [
    { left: '20%', top: '85%', rotate: '-60deg', label: '身' }, { left: '30%', top: '60%', rotate: '-60deg' }, { left: '40%', top: '35%', rotate: '-60deg' },
    { left: '60%', top: '35%', rotate: '60deg', label: '心' }, { left: '70%', top: '60%', rotate: '60deg' }, { left: '80%', top: '85%', rotate: '60deg' },
    { left: '70%', top: '95%', rotate: '0deg', label: '靈' }, { left: '50%', top: '95%', rotate: '0deg' }, { left: '30%', top: '95%', rotate: '0deg' },
  ];
  return (
    <div className="relative w-28 h-24 ml-4 shrink-0 select-none" style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }} title="身心靈流年指示器">
      {positions.map((pos, index) => {
        const capsuleNum = ((rootLifePath - 1 + index) % 9) + 1;
        const isActive = capsuleNum === currentFlow;
        return (
          <React.Fragment key={index}>
             {pos.label && <div className={`absolute text-[9px] font-bold ${labelColor} opacity-70`} style={{left: pos.left, top: pos.top, transform: `translate(${index === 0 ? '-200%' : index === 3 ? '100%' : '0'}, ${index === 6 ? '80%' : '-50%'})`}}>{pos.label}</div>}
            <div className={`absolute w-3 h-1.5 rounded-full transition-all duration-700 ${isActive ? `${activeColor} scale-150 z-10 animate-pulse` : baseColor}`} style={{left: pos.left, top: pos.top, transform: `translate(-50%, -50%) rotate(${pos.rotate})`}}></div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// SoulMatrix: 強制長方形 (300px 寬 x 400px 高)
const SoulMatrix = ({ data, colorClass }) => {
  if (!data) return null;
  const { counts, lines } = data;
  const gridNums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  const themeHex = colorClass === 'cyan' ? '#22d3ee' : '#a855f7';
  const themeTailwind = colorClass === 'cyan' ? 'cyan' : 'purple';
  
  const WIDTH = 300;
  const HEIGHT = 400; 

  const getPos = (num) => { 
      if (num === 0) return { x: 150, y: 340 };
      const row = Math.ceil(num / 3); 
      const col = num - (row - 1) * 3; 
      return { x: col * 80 - 10, y: row * 80 + 10 }; 
  };

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: WIDTH, height: HEIGHT }} title="靈魂數字矩陣 - 顯示生命中的數字能量">
      <div className={`absolute inset-0 border border-${themeTailwind}-900/30 rounded-xl pointer-events-none`}>
          <div className={`absolute top-0 left-0 w-3 h-3 border-t border-l border-${themeTailwind}-500/50 rounded-tl`}></div>
          <div className={`absolute top-0 right-0 w-3 h-3 border-t border-r border-${themeTailwind}-500/50 rounded-tr`}></div>
          <div className={`absolute bottom-0 left-0 w-3 h-3 border-b border-l border-${themeTailwind}-500/50 rounded-bl`}></div>
          <div className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r border-${themeTailwind}-500/50 rounded-br`}></div>
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
        {lines.map((line) => {
            const parts = line.id.split('-').map(Number);
            const startNum = parts[0];
            const endNum = parts[parts.length - 1]; 
            const p1 = getPos(startNum);
            const p2 = getPos(endNum);
            return (<line key={line.id} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={themeHex} strokeWidth="4" strokeLinecap="round" strokeDasharray="6 4" strokeOpacity="0.9" style={{ filter: `drop-shadow(0 0 4px ${themeHex})` }}/>);
        })}
      </svg>

      {gridNums.map((num) => {
          const count = counts[num] || 0;
          const pos = getPos(num);
          const hasNum = count > 0;
          return (
            <div key={num} className="absolute w-14 h-14 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2" style={{ left: pos.x, top: pos.y }}>
              {hasNum && (<div className={`absolute inset-0 rounded-lg border border-${themeTailwind}-500 bg-${themeTailwind}-500/20 shadow-[0_0_15px_${themeHex}]`}></div>)}
              <div className={`w-10 h-10 rounded md:rounded-lg flex items-center justify-center font-mono text-xl font-bold z-10 relative overflow-hidden border ${hasNum ? `bg-${themeTailwind}-900 text-white border-${themeTailwind}-400` : 'bg-slate-900 text-slate-700 border-slate-800'}`} title={`數字 ${num}${hasNum ? ` - 出現 ${count} 次` : ' - 空缺'}`}>{num}</div>
              {count > 1 && (<div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-950 border border-${themeTailwind}-500 text-${themeTailwind}-400 text-[10px] flex items-center justify-center font-bold z-20 shadow-lg`} title={`數字 ${num} 出現 ${count} 次`}>x{count}</div>)}
            </div>
          );
      })}
      
      <div className="absolute -bottom-6 w-full flex flex-wrap justify-center gap-2 pointer-events-none">
          {lines.map(line => (
              <span key={line.id} className={`text-[10px] px-2 py-0.5 rounded border border-${themeTailwind}-500/30 bg-${themeTailwind}-950/50 text-${themeTailwind}-400`} title={`${line.name} - 連線能量`}>{line.name}</span>
          ))}
      </div>
    </div>
  );
};

// ==========================================
// 3. 視窗頁面 (Modals)
// ==========================================

const LifeCycleView = ({ isOpen, onClose, birthday, mainSolar, matrixData }) => {
  const [loading, setLoading] = useState(false);
  const [lifeData, setLifeData] = useState([]);
  const [cycleIndex, setCycleIndex] = useState(0); 
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    if (isOpen && birthday) {
      setLoading(true);
      fetch(`${API_BASE}/calculate_lifecycle`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(birthday)
      }).then(res => res.json()).then(data => {
        setLifeData(data); setLoading(false);
        const age = new Date().getFullYear() - birthday.year;
        setCycleIndex(Math.floor(age / 9) >= 0 ? Math.floor(age / 9) : 0);
      }).catch(err => { console.error(err); setLoading(false); });
    }
  }, [isOpen, birthday]);

  if (!isOpen) return null;
  const currentCycleData = lifeData.slice(cycleIndex * 9, (cycleIndex + 1) * 9);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#050B14]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-7xl flex justify-between items-center mb-4 border-b border-slate-800 pb-4 shrink-0">
        <div className="flex items-center gap-3"><Database className="text-cyan-400" size={24} title="生命軌跡資料庫" /><h2 className="text-2xl font-bold text-white">生命基礎軌跡</h2></div>
        <div className="flex gap-2"><div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700"><button onClick={() => setActiveTab('timeline')} className={`px-4 py-2 rounded text-sm font-bold ${activeTab === 'timeline' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`} title="查看時間軌跡">時間軌跡</button><button onClick={() => setActiveTab('matrix')} className={`px-4 py-2 rounded text-sm font-bold ${activeTab === 'matrix' ? 'bg-purple-600 text-white' : 'text-slate-400'}`} title="查看靈魂晶片">靈魂晶片</button></div><button onClick={onClose} title="關閉視窗"><X size={28} className="text-slate-400 hover:text-white" /></button></div>
      </div>
      
      {loading ? <Activity className="animate-spin text-cyan-400" title="載入中" /> : (
        <div className="w-full max-w-7xl h-[85vh] overflow-hidden flex flex-col">
          
          {activeTab === 'timeline' && (
            <div className="flex flex-col gap-6 h-full">
               <div className="flex items-center justify-center gap-6 shrink-0"><button onClick={()=>setCycleIndex(Math.max(0, cycleIndex-1))} title="上一個9年週期"><ChevronLeft className="text-white" size={32}/></button><h3 className="text-3xl font-bold text-white font-mono">CYCLE {cycleIndex+1}</h3><button onClick={()=>setCycleIndex(Math.min(10, cycleIndex+1))} title="下一個9年週期"><ChevronRight className="text-white" size={32}/></button></div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pr-2 pb-10">
                  {currentCycleData.map((item, idx) => (
                      <div key={idx} className={`border ${item.year === new Date().getFullYear() ? 'border-cyan-500 bg-slate-900' : 'border-slate-800 bg-slate-900/50'} rounded-2xl p-6 relative`}>
                          <div className="absolute -right-2 -top-5 opacity-70"><FlowTriangle flowValue={item.solarFlow} mainValue={mainSolar} colorClass="cyan" scale={0.75} /></div>
                          <div className="text-3xl font-bold text-white mb-4">{item.year} <span className="text-sm text-slate-500">{item.age}歲</span></div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-black/30 p-3 rounded border border-slate-700/50" title="陽曆流年數字"><div className="text-xs text-cyan-500 mb-1">陽曆</div><div className="text-2xl text-white font-mono font-bold">{formatRawNum(item.solarFlow)}</div></div>
                              <div className="bg-black/30 p-3 rounded border border-slate-700/50" title="陰曆流年數字"><div className="text-xs text-purple-500 mb-1">陰曆</div><div className="text-2xl text-white font-mono font-bold">{formatRawNum(item.lunarFlow)}</div></div>
                          </div>
                          <div className="mt-4 text-center text-sm text-slate-400 bg-slate-950/50 py-1 rounded border border-slate-800" title="該年度的關鍵主題">{item.insight}</div>
                      </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'matrix' && matrixData && (
             <div className="flex w-full h-full items-center justify-center gap-10">
                 <div className="relative w-[340px] h-[450px] bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col items-center justify-center">
                     <div className="absolute top-6 left-6 flex gap-2 text-cyan-400 font-bold text-xl"><Sun title="陽曆數字能量" /> 陽曆晶片</div>
                     <SoulMatrix data={matrixData.solar} colorClass="cyan"/>
                 </div>
                 <div className="relative w-[340px] h-[450px] bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col items-center justify-center">
                     <div className="absolute top-6 left-6 flex gap-2 text-purple-400 font-bold text-xl"><Moon title="陰曆數字能量" /> 陰曆晶片</div>
                     <SoulMatrix data={matrixData.lunar} colorClass="purple"/>
                 </div>
             </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

const TacticalModal = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null;
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#050B14]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl border-b border-slate-800 pb-4 mb-4 flex justify-between items-center">
                <div className="flex items-center gap-3"><Compass className="text-green-400" title="戰術導航系統" /><h2 className="text-2xl font-bold text-white">流年戰術導航</h2></div>
                <button onClick={onClose} title="關閉視窗"><X size={24} className="text-slate-400 hover:text-white" /></button>
            </div>
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pb-10">
                <div className="bg-slate-900/50 border border-cyan-900/50 rounded-xl p-6 relative overflow-hidden">
                    <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2"><Sun size={18} title="陽曆外在能量" /> 陽曆 (外在顯化)</h3>
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between bg-black/40 p-3 rounded-lg border border-slate-800" title="本年度陽曆流年"><span className="text-slate-400 text-xs">流年</span><div className="text-2xl font-bold text-white">{formatRawNum(data.solar)}</div></div>
                        <div className="flex justify-between bg-black/40 p-3 rounded-lg border border-slate-800" title="本月份陽曆流月"><span className="text-slate-400 text-xs">流月</span><div className="text-2xl font-bold text-white">{formatRawNum(data.solarMonth)}</div></div>
                        <div className="flex justify-between bg-cyan-950/30 p-3 rounded-lg border border-cyan-500/50" title="今天的陽曆流日能量"><span className="text-cyan-300 text-xs font-bold flex items-center gap-1"><Flame size={12} title="今日能量高峰" /> 今日流日</span><div className="text-3xl font-bold text-white animate-pulse">{formatRawNum(data.solarDay)}</div></div>
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-purple-900/50 rounded-xl p-6 relative overflow-hidden">
                    <h3 className="text-purple-400 font-bold mb-4 flex items-center gap-2"><Moon size={18} title="陰曆內在能量" /> 陰曆 (內在潛影)</h3>
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between bg-black/40 p-3 rounded-lg border border-slate-800" title="本年度陰曆流年"><span className="text-slate-400 text-xs">流年</span><div className="text-2xl font-bold text-white">{formatRawNum(data.lunar)}</div></div>
                        <div className="flex justify-between bg-black/40 p-3 rounded-lg border border-slate-800" title="本月份陰曆流月"><span className="text-slate-400 text-xs">流月</span><div className="text-2xl font-bold text-white">{formatRawNum(data.lunarMonth)}</div></div>
                        <div className="flex justify-between bg-purple-950/30 p-3 rounded-lg border border-purple-500/50" title="今天的陰曆流日能量"><span className="text-purple-300 text-xs font-bold flex items-center gap-1"><Flame size={12} title="今日能量高峰" /> 今日流日</span><div className="text-3xl font-bold text-white animate-pulse">{formatRawNum(data.lunarDay)}</div></div>
                    </div>
                </div>
                <div className="col-span-1 md:col-span-2 text-center text-xs text-slate-500">基準日期: {data.todayDateStr} (陽) | {data.lunarTodayStr} (陰)</div>
            </div>
        </motion.div>
    );
};

// 🔥 修正：共振實驗室 (絕對去心版)
const ResonanceModal = ({ isOpen, onClose, myData, history, onCalculate }) => {
    const [partner, setPartner] = useState(null);
    if (!isOpen) return null;
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#050B14]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-5xl border-b border-slate-800 pb-4 mb-4 flex justify-between items-center shrink-0">
                {/* 標題：Wave 圖示，顯示版本 v10.9 以供驗證 */}
                <div className="flex items-center gap-3"><Waves className="text-fuchsia-500" title="能量共振分析系統" /><h2 className="text-2xl font-bold text-white">能量共振實驗室 v10.9</h2></div>
                <button onClick={onClose} title="關閉視窗"><X size={24} className="text-slate-400 hover:text-white" /></button>
            </div>
            
            <div className="w-full max-w-5xl h-full flex gap-4 items-stretch overflow-hidden pb-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center w-1/4 shrink-0">
                    <div className="text-xs text-slate-500 mb-4">{myData.name || 'My'} Energy</div>
                    <div className="text-4xl font-bold text-cyan-400 font-mono mb-2" title="我的陽曆主命數">{formatRawNum(myData.mainSolar)}</div>
                    <div className="text-2xl font-bold text-purple-400 font-mono mb-6" title="我的陰曆主命數">{formatRawNum(myData.mainLunar)}</div>
                    <div className="opacity-50"><User size={64} className="text-slate-600" title="我的能量" /></div>
                </div>
                
                <div className="flex-1 flex items-center justify-center relative">
                    {!partner ? (
                        <div className="text-center animate-pulse text-slate-500 z-10">
                            <Users size={32} className="mx-auto mb-2" title="等待選擇共振對象" />
                            <p className="text-sm">請在右側選擇共振對象...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 grid-rows-3 gap-4 w-full max-w-md aspect-square relative z-10 p-4">
                            <div className="col-start-2 row-start-1 bg-gradient-to-b from-fuchsia-950/50 to-slate-900/50 border border-fuchsia-500/50 rounded-xl flex flex-col items-center justify-center p-2 shadow-[0_0_15px_rgba(232,79,255,0.2)]" title="雙方陽曆能量共鳴">
                                <div className="text-[10px] text-fuchsia-300 mb-1">++ (陽陽共鳴)</div>
                                <div className="text-4xl font-bold text-white">{calcRelationNum(myData.mainSolarNum, partner.mainSolarNum)}</div>
                            </div>
                            <div className="col-start-1 row-start-2 bg-gradient-to-r from-cyan-950/50 to-slate-900/50 border border-cyan-500/50 rounded-xl flex flex-col items-center justify-center p-2" title="我陽曆 vs 對方陰曆">
                                <div className="text-[10px] text-cyan-300 mb-1">+- (我陽他陰)</div>
                                <div className="text-3xl font-bold text-white">{calcRelationNum(myData.mainSolarNum, partner.mainLunarNum)}</div>
                            </div>
                            {/* 中間核心：Waves 圖示 + 共振數 (絕無愛心) */}
                            <div className="col-start-2 row-start-2 z-20 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md border-2 border-slate-600 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.05)] aspect-square">
                                 <div className="text-sm font-bold text-cyan-400 mb-1">{myData.name}</div>
                                 <Waves size={24} className="text-fuchsia-400 animate-pulse my-1" title="能量共振核心" />
                                 <div className="text-sm font-bold text-purple-400 mt-1">{partner.name}</div>
                                 <div className="text-[10px] text-slate-500 mt-2 border-t border-slate-700 pt-1 w-3/4 text-center">共振數</div>
                            </div>
                            <div className="col-start-3 row-start-2 bg-gradient-to-l from-purple-950/50 to-slate-900/50 border border-purple-500/50 rounded-xl flex flex-col items-center justify-center p-2" title="我陰曆 vs 對方陽曆">
                                <div className="text-[10px] text-purple-300 mb-1">-+ (我陰他陽)</div>
                                <div className="text-3xl font-bold text-white">{calcRelationNum(myData.mainLunarNum, partner.mainSolarNum)}</div>
                            </div>
                            <div className="col-start-2 row-start-3 bg-gradient-to-t from-purple-950/50 to-slate-900/50 border border-purple-500/50 rounded-xl flex flex-col items-center justify-center p-2" title="雙方陰曆能量共鳴">
                                <div className="text-[10px] text-purple-300 mb-1">-- (陰陰共鳴)</div>
                                <div className="text-4xl font-bold text-white">{calcRelationNum(myData.mainLunarNum, partner.mainLunarNum)}</div>
                            </div>
                        </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-30">
                        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-500 to-transparent absolute"></div>
                        <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-slate-500 to-transparent absolute"></div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col items-center relative w-1/4 shrink-0">
                    {partner ? (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            <div className="text-sm text-slate-500 mb-4">{partner.name} Energy</div>
                            <div className="text-4xl font-bold text-cyan-400 font-mono mb-2" title="對方的陽曆主命數">{formatRawNum(partner.mainSolar)}</div>
                            <div className="text-2xl font-bold text-purple-400 font-mono mb-6" title="對方的陰曆主命數">{formatRawNum(partner.mainLunar)}</div>
                            <button onClick={() => setPartner(null)} className="absolute top-4 right-4 text-slate-600 hover:text-red-400 p-1 bg-slate-800 rounded-full" title="移除此對象"><X size={20}/></button>
                            <User size={64} className="text-slate-600 opacity-50" title="對方的能量" />
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col gap-2 overflow-hidden">
                            <div className="text-sm text-center font-bold text-slate-400 mb-4">從歷史紀錄選擇對象</div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2">
                                {history.filter(h => h.name !== myData.name).length === 0 ? (
                                    <div className="text-center py-10 opacity-50"><p className="text-sm text-slate-600">無其他紀錄</p><p className="text-xs text-slate-700 mt-2">請先關閉視窗<br/>掃描第二位使用者的命盤</p></div>
                                ) : (
                                    history.filter(h => h.name !== myData.name).map(h => (
                                        <button key={h.id} onClick={() => { onCalculate(h.birthday).then(res => { setPartner({ ...h, mainSolar: res.mainSolar, mainLunar: res.mainLunar, mainSolarNum: res.mainSolarNum, mainLunarNum: res.mainLunarNum }); }); }} className="p-3 bg-slate-800/50 border border-slate-700 hover:bg-cyan-900/30 hover:border-cyan-500/30 rounded-lg text-sm text-slate-300 text-left truncate transition flex justify-between items-center group shrink-0" title={`選擇 ${h.name} 進行共振分析`}>
                                            <div className="flex flex-col"><span className="font-bold">{h.name}</span><span className="text-[10px] text-slate-500">{h.dateStr}</span></div>
                                            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" title="選擇此對象" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ==========================================
// 4. 主應用程式
// ==========================================
export default function SoulDashboard() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(DEFAULT_DATA); 
  const [loading, setLoading] = useState(false);
  const [showInputModal, setShowInputModal] = useState(true);
  const [userName, setUserName] = useState("");
  const [birthdayInput, setBirthdayInput] = useState({ year: 1990, month: 1, day: 1 });
  const [history, setHistory] = useState([]);
  
  const [showOverview, setShowOverview] = useState(false);
  const [showTactical, setShowTactical] = useState(false);
  const [showResonance, setShowResonance] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('soulHistory');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    const savedUser = localStorage.getItem('soulUser');
    if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUserName(parsed.name || "");
        setBirthdayInput(parsed.birthday || { year: 1990, month: 1, day: 1 });
    }
  }, []);

  const calculateForPartner = async (bday) => {
      const res = await fetch(`${API_BASE}/calculate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ year: bday.year, month: bday.month, day: bday.day, targetYear: year })
      });
      return await res.json();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await calculateForPartner(birthdayInput);
      setData({...result, name: userName});
    } catch (error) { console.error("連線失敗", error); } finally { setLoading(false); }
  };

  useEffect(() => { if (!showInputModal) fetchData(); }, [year, showInputModal]);

  const handleStartScan = () => {
    const userProfile = { name: userName, birthday: birthdayInput };
    localStorage.setItem('soulUser', JSON.stringify(userProfile));
    const newHistoryEntry = { id: Date.now(), name: userName || "未命名", birthday: birthdayInput, dateStr: `${birthdayInput.year}/${birthdayInput.month}/${birthdayInput.day}` };
    setHistory(prev => {
        const filtered = prev.filter(h => !(h.name === newHistoryEntry.name && h.birthday.year === newHistoryEntry.birthday.year));
        const updated = [newHistoryEntry, ...filtered].slice(0, 20); 
        localStorage.setItem('soulHistory', JSON.stringify(updated));
        return updated;
    });
    setShowInputModal(false); 
  };

  const handleSnapshot = () => {
    html2canvas(document.body, { backgroundColor: '#050B14', scale: 2 }).then((canvas) => {
        const link = document.createElement('a');
        link.download = `SoulGPS_Dashboard_${new Date().getTime()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
    });
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      
      <AnimatePresence>{showInputModal && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050B14]/80 backdrop-blur-md"><div className="bg-slate-900 border border-cyan-500/30 p-8 rounded-2xl shadow-2xl shadow-cyan-500/20 max-w-md w-[95%] flex flex-col"><div className="text-center mb-6"><h2 className="text-2xl font-bold">靈魂藍圖掃描</h2></div><div className="space-y-4 mb-6"><input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="姓名" className="w-full bg-slate-950 border border-slate-700 rounded px-4 py-2 text-center" title="輸入使用者姓名" /><div className="grid grid-cols-3 gap-2"><input type="number" value={birthdayInput.year} onChange={(e) => setBirthdayInput({...birthdayInput, year: parseInt(e.target.value)})} className="bg-slate-950 border border-slate-700 rounded px-2 py-2 text-center" title="出生年份" /><input type="number" value={birthdayInput.month} onChange={(e) => setBirthdayInput({...birthdayInput, month: parseInt(e.target.value)})} className="bg-slate-950 border border-slate-700 rounded px-2 py-2 text-center" title="出生月份" /><input type="number" value={birthdayInput.day} onChange={(e) => setBirthdayInput({...birthdayInput, day: parseInt(e.target.value)})} className="bg-slate-950 border border-slate-700 rounded px-2 py-2 text-center" title="出生日期" /></div></div><button onClick={handleStartScan} className="w-full bg-cyan-600 p-3 rounded font-bold text-white" title="開始分析命盤">啟動分析</button><div className="mt-4 border-t border-slate-800 pt-2 h-32 overflow-y-auto custom-scrollbar">{history.map(h => <div key={h.id} onClick={()=>{setUserName(h.name);setBirthdayInput(h.birthday)}} className="p-2 hover:bg-slate-800 cursor-pointer flex justify-between" title={`載入 ${h.name} 的資料`}><span>{h.name}</span><span>{h.dateStr}</span></div>)}</div></div></motion.div>)}</AnimatePresence>

      <AnimatePresence>{showOverview && <LifeCycleView isOpen={showOverview} onClose={() => setShowOverview(false)} birthday={birthdayInput} mainSolar={data.mainSolar} matrixData={data.matrixData} />}</AnimatePresence>
      <AnimatePresence>{showTactical && <TacticalModal isOpen={showTactical} onClose={() => setShowTactical(false)} data={data} />}</AnimatePresence>
      <AnimatePresence>{showResonance && <ResonanceModal isOpen={showResonance} onClose={() => setShowResonance(false)} myData={data} history={history} onCalculate={calculateForPartner} />}</AnimatePresence>

      <nav className="fixed top-0 w-full z-50 border-b border-slate-800 bg-[#050B14]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400"><LayoutDashboard size={20} title="靈魂導航儀主頁" /><span className="font-bold tracking-widest text-sm">{userName ? `${userName} 的靈魂導航儀` : '全息靈魂導航儀 v10.9'}</span></div>
          <div className="flex items-center gap-6 bg-slate-900/50 px-6 py-2 rounded-full border border-slate-700/50"><button onClick={() => setYear(y => y - 1)} title="上一年"><ChevronLeft size={20} /></button><span className="text-2xl font-mono font-bold text-white flex items-center gap-2">{year}{loading && <Activity size={14} className="animate-spin text-cyan-500" title="計算中"/>}</span><button onClick={() => setYear(y => y + 1)} title="下一年"><ChevronRight size={20} /></button></div>
          <div className="flex items-center gap-2">
              <button onClick={() => setShowTactical(true)} className="p-2 bg-slate-800 hover:bg-green-900 rounded-full text-slate-400 hover:text-green-400 transition" title="流年戰術 - 查看流年、流月、流日"><Compass size={18} /></button>
              <button onClick={() => setShowResonance(true)} className="p-2 bg-slate-800 hover:bg-pink-900 rounded-full text-slate-400 hover:text-pink-400 transition" title="能量共振 - 與他人進行能量分析"><Waves size={18} /></button>
              <button onClick={handleSnapshot} className="p-2 bg-slate-800 hover:bg-cyan-900 rounded-full text-slate-400 hover:text-cyan-400 transition" title="截圖 - 儲存當前畫面"><Camera size={18} /></button>
              <button onClick={() => setShowInputModal(true)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition" title="設定 - 切換使用者或修改資料"><Settings size={18} /></button>
          </div>
        </div>
      </nav>

      {/* 主畫面 */}
      <main className={`pt-24 pb-12 px-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 transition-opacity duration-1000 ${showInputModal ? 'opacity-0 filter blur-sm' : 'opacity-100 filter blur-0'}`}>
        {/* 左 */}
        <motion.div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-20"></div>
          <div>
            <div className="flex items-center gap-3 mb-6 text-cyan-400"><Sun size={24} title="陽性能量 - 外在顯化" /><h2 className="text-lg font-bold tracking-wide">陽性・顯化 (外在)</h2></div>
            <div className="bg-[#0A121E] p-4 rounded-xl border border-slate-800 relative overflow-hidden mb-2">
              <div className="flex justify-between items-center mb-2"><p className="text-slate-400 text-xs">外在顯化週期</p><div className="flex items-center gap-1.5 bg-cyan-950/50 px-2 py-1 rounded-full border border-cyan-500/30"><Atom size={14} className="text-cyan-400 animate-pulse" title="流年能量等級" /><span className="text-sm font-bold text-cyan-300">{data.flowSolarLv}</span></div></div>
              <div className="flex justify-between items-end"><div className="flex items-center"><span className="text-4xl font-bold text-white">{formatRawNum(data.solar)}</span><FlowTriangle flowValue={data.solar} mainValue={data.mainSolar} colorClass="cyan" scale={0.75} /></div><span className="text-cyan-400 text-xs font-bold tracking-widest px-2 py-1 bg-cyan-950/30 rounded border border-cyan-500/30 whitespace-nowrap">{data.solarKw}</span></div>
            </div>
          </div>
          <div className="h-64 w-full relative flex items-center justify-between">
            <p className="text-xs text-slate-500 absolute top-0 left-0 z-10">外在顯化光輪</p>
            <div className="w-2/3 h-full relative flex items-center justify-center"><div className="absolute w-36 h-36 rounded-full border border-cyan-900/30 animate-spin-slow pointer-events-none"></div><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.solarWheel} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={3} dataKey="angleValue" strokeWidth={2}>{data.solarWheel.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.stroke} style={{ filter: `drop-shadow(0 0 ${entry.intensity === 'high' ? '10px' : '2px'} ${entry.fill})` }} />)}</Pie><RechartsTooltip content={<CustomTooltip />} /></PieChart></ResponsiveContainer><div className="absolute text-center pointer-events-none"><div className="text-[10px] text-cyan-500/50">陽性</div><div className="text-[8px] text-slate-600">核心</div></div></div>
            <div className="w-1/3 flex items-center"><ul className="space-y-2 text-[11px] text-slate-300">{data.solarWheel.map((item, i) => (<li key={i} className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{backgroundColor: item.fill, boxShadow: `0 0 5px ${item.fill}`}} title={`${item.name} - 能量分數: ${item.score}`}></span>{item.name}</div>{item.hasFlowBuff && (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-orange-500 flex items-center gap-1" title="流年加持中 - 該領域受到流年能量加持"><Flame size={12} className="fill-orange-500 animate-pulse" /></motion.div>)}</li>))}</ul></div>
          </div>
        </motion.div>

        {/* 中 */}
        <div className="relative flex flex-col items-center justify-center py-10">
          <div className="absolute inset-0 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none"></div>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute w-[500px] h-[500px] border border-slate-800/50 rounded-full border-dashed pointer-events-none"></motion.div>
          <motion.div className="relative z-10 flex flex-col items-center gap-8 w-full">
            <div className="w-full max-w-[280px] bg-slate-900/80 border border-slate-700/50 rounded-lg p-3 backdrop-blur-md flex flex-col items-center gap-2 shadow-lg shadow-cyan-900/10 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1 border-b border-slate-700/50 w-full justify-center pb-1"><Calendar size={12} title="出生日期資訊" /> 生日資訊</div>
                <div className="w-full grid grid-cols-[40px_1fr] gap-2 px-2 items-center"><span className="text-[10px] text-cyan-500/70 text-left">陽曆</span><span className="text-sm font-bold text-white font-mono text-right" title="陽曆出生日期">{cleanDateStr(data.solarDateStr)}</span></div>
                <div className="w-full grid grid-cols-[40px_1fr] gap-2 px-2 items-center"><span className="text-[10px] text-purple-500/70 text-left">陰曆</span><span className="text-sm font-bold text-slate-300 font-mono text-right" title="陰曆出生日期">{cleanDateStr(data.lunarDateStr)}</span></div>
            </div>
            <div className="relative group cursor-pointer" onClick={() => setShowInputModal(true)}>
              <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-xl group-hover:opacity-100 transition-opacity duration-500 opacity-60"></div>
              <div className="w-60 h-60 bg-[#050B14] border-2 border-slate-700 rounded-full flex flex-col items-center justify-center relative shadow-2xl shadow-cyan-900/20 px-4" title="點擊修改使用者資料">
                <div className="text-xs text-slate-500 tracking-widest mb-4">主命數</div>
                <div className="flex items-center justify-between w-full px-4 mb-2"><span className="text-3xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" title="陽曆主命數">{formatRawNum(data.mainSolar)}</span><motion.div className="flex items-center gap-1" animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}><Atom size={18} className="text-cyan-500/80" title="陽曆靈魂等級" /><span className="text-xl font-bold text-cyan-300">{data.mainSolarLv}</span></motion.div></div>
                <div className="w-full h-[1px] bg-slate-800 my-3"></div>
                <div className="flex items-center justify-between w-full px-4 mt-2"><span className="text-3xl font-bold text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]" title="陰曆主命數">{formatRawNum(data.mainLunar)}</span><motion.div className="flex items-center gap-1" animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}><Atom size={18} className="text-purple-500/80" title="陰曆靈魂等級" /><span className="text-xl font-bold text-purple-300">{data.mainLunarLv}</span></motion.div></div>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full px-4">
              <button onClick={() => setShowOverview(true)} className="w-full px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] text-white rounded-lg text-sm tracking-widest transition-all flex items-center justify-center gap-2 group" title="開啟全息總覽 - 查看生命軌跡與靈魂晶片"><Grid size={16} className="text-cyan-400 group-hover:text-white transition" />開啟全息總覽</button>
              <button onClick={() => setShowInputModal(true)} className="w-full px-6 py-2 border border-slate-800 hover:border-slate-600 hover:bg-slate-900/50 text-slate-400 hover:text-white rounded-lg text-xs tracking-widest transition-all flex items-center justify-center gap-2" title="切換使用者或重新輸入生日資料"><ScanFace size={14} />切換使用者 / 重新掃描</button>
            </div>
          </motion.div>
        </div>

        {/* 右 */}
        <motion.div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-20"></div>
          <div>
            <div className="flex items-center gap-3 mb-6 text-purple-400"><Moon size={24} title="陰性能量 - 內在潛影" /><h2 className="text-lg font-bold tracking-wide">陰性・潛影 (內在)</h2></div>
            <div className="bg-[#0A121E] p-4 rounded-xl border border-slate-800 relative overflow-hidden mb-4">
               <div className="flex justify-between items-center mb-2"><p className="text-slate-400 text-xs">內在情感潮汐</p><div className="flex items-center gap-1.5 bg-purple-950/50 px-2 py-1 rounded-full border border-purple-500/30"><Atom size={14} className="text-purple-400 animate-pulse" title="流年能量等級" /><span className="text-sm font-bold text-purple-300">{data.flowLunarLv}</span></div></div>
              <div className="flex justify-between items-end"><div className="flex items-center"><span className="text-4xl font-bold text-white">{formatRawNum(data.lunar)}</span><FlowTriangle flowValue={data.lunar} mainValue={data.mainLunar} colorClass="purple" scale={0.75} /></div><span className="text-purple-400 text-xs font-bold tracking-widest px-2 py-1 bg-purple-950/30 rounded border border-purple-500/30 whitespace-nowrap">{data.lunarKw}</span></div>
            </div>
          </div>
          <div className="h-64 w-full -ml-4 flex flex-col justify-end">
             <p className="text-xs text-slate-500 mb-0 pl-4">內在靈魂矩陣</p>
             <ResponsiveContainer width="100%" height="100%"><RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.lunarRadar}><PolarGrid stroke="#334155" /><PolarAngleAxis dataKey="subject" tick={{ fill: '#c084fc', fontSize: 11, fontWeight: 'bold' }} /><PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} /><Radar name="Personality" dataKey="A" stroke="#a855f7" strokeWidth={2} fill="#a855f7" fillOpacity={0.4} /><RechartsTooltip content={<CustomTooltip />} /></RadarChart></ResponsiveContainer>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
