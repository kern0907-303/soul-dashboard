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
const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/, "");
const CHART_FONT_SCALE = 1.2;

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
  solar: "--", solarKw: "等待計算", flowSolarLv: "-", flowSolarNum: 0,
  solarMonth: "--", solarMonthNum: 0, solarDay: "--", solarDayNum: 0,
  lunar: "--", lunarKw: "等待計算", flowLunarLv: "-", flowLunarNum: 0,
  lunarMonth: "--", lunarMonthNum: 0, lunarDay: "--", lunarDayNum: 0,
  mainSolar: "--/--", mainSolarLv: "-", mainSolarNum: 0,
  mainLunar: "--/--", mainLunarLv: "-", mainLunarNum: 0,
  flowAuditSolar: null, flowAuditLunar: null,
  solarWheel: [], lunarRadar: [],
  matrixData: { solar: { counts: {}, lines: [] }, lunar: { counts: {}, lines: [] } }
};

const CORE_MODULE_MAP = {
  1: "開創模組",
  2: "協調模組",
  3: "表達模組",
  4: "建構模組",
  5: "變革模組",
  6: "承載模組",
  7: "洞察模組",
  8: "實現模組",
  9: "整合模組"
};

const getFinalNum = (pathStr) => {
  if (!pathStr || typeof pathStr !== "string") return 0;
  const tail = pathStr.split("/").pop();
  return parseInt(tail.replace("+", "").replace("-", ""), 10) || 0;
};

const parseDateCode = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return "";
  const m = dateStr.match(/(\d{3,4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!m) return "";
  const y = m[1];
  const mm = m[2].padStart(2, "0");
  const dd = m[3].padStart(2, "0");
  return `${y}${mm}${dd}`;
};

const sumDigitsFromStr = (str) =>
  str
    .split("")
    .filter((c) => /\d/.test(c))
    .reduce((sum, c) => sum + Number(c), 0);

const buildReducedPath = (num) => {
  if (!Number.isFinite(num) || num <= 0) return "-";
  const parts = [num];
  let current = num;
  while (current > 9) {
    current = String(current)
      .split("")
      .reduce((sum, d) => sum + Number(d), 0);
    parts.push(current);
  }
  return parts.join("/");
};

const getThinkingTendencyBySolar = (num) => {
  if ([1, 4, 8].includes(num)) return "結構推進型";
  if ([2, 6, 9].includes(num)) return "關係整合型";
  if ([3, 5, 7].includes(num)) return "探索創新型";
  return "動態調整型";
};

const getActionTendencyByLunar = (num) => {
  if ([1, 8].includes(num)) return "直接行動";
  if ([2, 6].includes(num)) return "情感驅動";
  if ([4, 7].includes(num)) return "審慎評估";
  if ([3, 5, 9].includes(num)) return "彈性推進";
  return "節奏觀察";
};

const formatModuleCircle = ([num, count]) => `${CORE_MODULE_MAP[Number(num)] || `模組${num}`}(${count}圈)`;

const getLineSceneHint = (lineId) => {
  const map = {
    "1-5-9": "事業推進與主導決策",
    "4-5-6": "流程設計與團隊協作",
    "2-5-8": "關係協調與跨部門連動",
    "3-6-9": "知識整合與教學輸出",
    "1-2-3": "創意企劃與內容發想",
    "7-8-9": "資源整合與高壓成長"
  };
  return map[lineId] || "在既有任務中放大穩定輸出";
};

const getRelationCategory = (n) => {
  if ([4, 10].includes(n)) return "一級緊密（守護型）";
  if ([9, 11, 12].includes(n)) return "二級緊密（強烈型）";
  if ([5, 6, 7, 8].includes(n)) return "三級緊密（功能型）";
  if ([2, 3].includes(n)) return "四級緊密（連結型）";
  return "未分類";
};

const getSoulLevelState = (lv) => {
  const n = Number(lv) || 0;
  if (n <= 1) return "基礎探索期";
  if (n === 2) return "模仿學習期";
  if (n === 3) return "同儕建構期";
  if (n === 4) return "轉向覺察期";
  if (n === 5) return "整合成形期";
  if (n === 6) return "專業輸出期";
  return "使命服務期";
};

const DISPLAY_KEY_MAP = {
  name: "名稱",
  score: "分數",
  label: "項目",
  id: "編號",
  type: "類型",
  option_id: "方案編號",
  option_name: "方案名稱",
  option_type: "方案類型",
  fit_score: "適配分",
  time_support_score: "時間支持度",
  relationship_match_score: "關係匹配度",
  energy_cost_score: "能量成本",
  long_term_alignment_score: "長期對齊度",
  summary: "摘要",
  recommendation: "建議"
};

const prettifyDisplayKey = (key) => {
  if (!key) return key;
  const raw = String(key).trim();
  if (DISPLAY_KEY_MAP[raw]) return DISPLAY_KEY_MAP[raw];
  return raw.replaceAll("_", " ");
};

const flattenPanelData = (value, parentKey = "") => {
  if (value === null || value === undefined) {
    return [{ key: parentKey, value: "-" }];
  }

  if (Array.isArray(value)) {
    if (!value.length) return [{ key: parentKey, value: "[]" }];
    if (value.every((v) => typeof v !== "object" || v === null)) {
      return [{ key: parentKey, value: value.join("、") }];
    }
    return value.flatMap((item, idx) => flattenPanelData(item, `${parentKey}[${idx + 1}]`));
  }

  if (typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => {
      const displayKey = prettifyDisplayKey(k);
      const nextKey = parentKey ? `${parentKey}.${displayKey}` : displayKey;
      return flattenPanelData(v, nextKey);
    });
  }

  return [{ key: parentKey, value: String(value) }];
};

const avg = (nums) => {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
};

const getWheelScore = (wheel, name) => {
  const hit = (wheel || []).find((item) => item.name === name);
  return hit ? hit.score || 0 : 0;
};

const getRadarScore = (radar, subject) => {
  const hit = (radar || []).find((item) => item.subject === subject);
  return hit ? hit.A || 0 : 0;
};

const topEntries = (obj, count = 2) =>
  Object.entries(obj || {})
    .filter(([key, value]) => Number(key) > 0 && value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count);

const toDigits = (code) =>
  String(code || "")
    .replace(/\D/g, "")
    .split("")
    .map((d) => Number(d))
    .filter((n) => Number.isFinite(n));

const judgeSoulLevel = (total, mainNumber, innateSet, hasTriple) => {
  const ant1 = total >= 10 ? Math.floor(total / 10) : 0;
  const ant2 = total >= 10 ? total % 10 : total;
  const mainIn = innateSet.has(mainNumber);
  const antHits = (innateSet.has(ant1) ? 1 : 0) + (innateSet.has(ant2) ? 1 : 0);
  if (!mainIn) return ({ 0: 1, 1: 2, 2: 3 }[antHits] || 1);
  if (antHits === 0) return 4;
  if (antHits === 1) return 5;
  return hasTriple ? 6 : 7;
};

const parseLunarBirth = (s) => {
  const m = String(s || "").match(/(\d{3,4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
};

const parseFlowPath = (flowPath) => {
  const nums = String(flowPath || "")
    .replace(/[+-]/g, "")
    .split("/")
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n >= 0);
  if (!nums.length) return null;
  return { total: nums[0], main: nums[nums.length - 1] };
};

const buildFlowPathByYmdDigits = (year, month, day, sign = "+") => {
  const code = `${Number(year)}${String(Number(month)).padStart(2, "0")}${String(Number(day)).padStart(2, "0")}`;
  const digits = toDigits(code);
  if (!digits.length) return { path: "--/--", total: 0, main: 0, code };
  let total = digits.reduce((s, n) => s + n, 0);
  let current = total;
  let path = `${sign}${total}`;
  while (current > 9) {
    current = String(current).split("").reduce((s, d) => s + Number(d), 0);
    path += `/${current}`;
  }
  return { path, total, main: current, code };
};

const calcFlowSoulLevelByBirth = (flowPath, birthCode) => {
  const flow = parseFlowPath(flowPath);
  const birthDigits = toDigits(birthCode);
  if (!flow || !birthDigits.length) return "-";
  const counts = {};
  birthDigits.forEach((d) => { counts[d] = (counts[d] || 0) + 1; });
  const hasTriple = Object.values(counts).some((c) => c >= 3);
  const lv = judgeSoulLevel(flow.total, flow.main, new Set(birthDigits), hasTriple);
  return String(lv);
};

const calcFlowSoulLevelAudit = (flowPath, birthCode) => {
  const flow = parseFlowPath(flowPath);
  const birthDigits = toDigits(birthCode);
  if (!flow || !birthDigits.length) {
    return {
      flow_path: flowPath || "-",
      birth_code: birthCode || "-",
      total: "-",
      main: "-",
      ant1: "-",
      ant2: "-",
      ant_hits: "-",
      main_in_birth: "-",
      has_triple: "-",
      level: "-"
    };
  }
  const counts = {};
  birthDigits.forEach((d) => { counts[d] = (counts[d] || 0) + 1; });
  const hasTriple = Object.values(counts).some((c) => c >= 3);
  const innateSet = new Set(birthDigits);
  const ant1 = flow.total >= 10 ? Math.floor(flow.total / 10) : 0;
  const ant2 = flow.total >= 10 ? flow.total % 10 : flow.total;
  const antHits = (innateSet.has(ant1) ? 1 : 0) + (innateSet.has(ant2) ? 1 : 0);
  const mainIn = innateSet.has(flow.main);
  const lv = judgeSoulLevel(flow.total, flow.main, innateSet, hasTriple);
  return {
    flow_path: flowPath,
    birth_code: birthCode,
    total: flow.total,
    main: flow.main,
    ant1,
    ant2,
    ant_hits: antHits,
    main_in_birth: mainIn ? "yes" : "no",
    has_triple: hasTriple ? "yes" : "no",
    level: String(lv)
  };
};

const correctFlowSoulLevels = (result, birthdayInput, targetYear) => {
  if (!result) return result;
  const solarBirthCode = parseDateCode(result.solarDateStr) || `${Number(birthdayInput?.year)}${String(Number(birthdayInput?.month)).padStart(2, "0")}${String(Number(birthdayInput?.day)).padStart(2, "0")}`;
  const solarBirthMonth = Number(String(solarBirthCode).slice(-4, -2)) || Number(birthdayInput?.month) || 0;
  const solarBirthDay = Number(String(solarBirthCode).slice(-2)) || Number(birthdayInput?.day) || 0;
  const solarFlow = buildFlowPathByYmdDigits(targetYear, solarBirthMonth, solarBirthDay, "+");
  const correctedSolarLv = calcFlowSoulLevelByBirth(solarFlow.path, solarBirthCode);
  const solarAudit = calcFlowSoulLevelAudit(solarFlow.path, solarBirthCode);

  let correctedLunarLv = "-";
  let lunarAudit = calcFlowSoulLevelAudit("-", "");
  let lunarFlow = { path: result.lunar, main: parseFlowPath(result.lunar)?.main ?? 0 };
  const lunarBirth = parseLunarBirth(result.lunarDateStr);
  if (lunarBirth) {
    lunarFlow = buildFlowPathByYmdDigits(targetYear, lunarBirth.month, lunarBirth.day, "-");
    const lunarBirthCode = parseDateCode(result.lunarDateStr) || `${lunarBirth.year}${String(lunarBirth.month).padStart(2, "0")}${String(lunarBirth.day).padStart(2, "0")}`;
    correctedLunarLv = calcFlowSoulLevelByBirth(lunarFlow.path, lunarBirthCode);
    lunarAudit = calcFlowSoulLevelAudit(lunarFlow.path, lunarBirthCode);
  }

  return {
    ...result,
    solar: solarFlow.path,
    lunar: lunarFlow.path,
    flowSolarNum: solarFlow.main,
    flowLunarNum: lunarFlow.main,
    flowSolarLv: correctedSolarLv === "-" ? result.flowSolarLv : correctedSolarLv,
    flowLunarLv: correctedLunarLv === "-" ? result.flowLunarLv : correctedLunarLv,
    flowAuditSolar: solarAudit,
    flowAuditLunar: lunarAudit
  };
};

const PANEL_DATA_WHITELIST = {
  core_personality: ["陽曆", "陰曆", "核心模組", "次核心模組", "思維傾向", "行動傾向", "主命數解析", "靈魂等級狀態", "主要人格摘要"],
  talent_advantages: ["自然優勢", "已開發能力", "潛在可開發能力", "優勢應用場景", "最容易被看見的亮點"],
  current_operation_dimension: ["當前主維度", "次維度", "壓力下反應", "成熟度判讀", "維度轉換提醒", "維度分數", "靈魂等級參考", "流年數參考", "九年週期位置", "是否被模組綁架"],
  inner_drive: ["注意力指向", "熱情來源", "flow場景", "內在渴望", "長期投入主題"],
  expression_consistency: ["內在感受", "外在表達", "他人接收印象", "常見誤解點", "內外一致度分數", "落差提醒", "誤解來源分型", "修正建議"],
  value_ranking: ["價值排序前五名", "當前活出程度", "尚未活出的價值", "價值衝突提醒", "決策優先順序"],
  role_fit: ["適合角色", "適合工作型態", "適合獨立/合作/領導/支持", "高能量場景", "高耗損場景", "適合的發揮位置"],
  current_needs: ["當下核心需求", "次要需求", "第三需求", "現況落差", "當下不宜做的事", "當前優先順序"],
  relationship_pattern: ["關係風格", "吸引類型", "衝突模式", "重複課題", "互動優勢", "關係提醒", "共振關係數"],
  relationship_dynamics: ["感情數", "關係類型", "親密程度", "互動優勢", "互動風險", "建議關係策略", "共振明細", "狀態", "說明"],
  fear_and_defense: ["核心恐懼", "壓力反應", "防衛機制", "容易逃避的情境", "恐懼影響範圍", "恐懼觸發場景"],
  bottleneck_diagnosis: ["主要卡點", "次要卡點", "卡點來源", "卡點類型", "鬆動方向", "調整優先順序"],
  time_rhythm: ["階段數", "流年數", "流月數", "流日數", "當前節奏判讀", "年度主題", "當月提醒", "今日提醒"],
  mission_direction: ["生命主軸一句話", "核心貢獻方向", "發光領域", "使命關鍵詞", "不宜偏離主線"],
  future_blueprint: ["理想生活樣貌", "一年方向", "三階段路徑", "近期行動優先", "長期願景", "風險提醒"],
  decision_matrix: ["決策結論", "決策公式", "三軸分數", "關鍵脈絡", "方案排名_精簡", "首選方案理由", "主要風險提醒"],
  personal_summary_report: ["收斂結論", "我是誰", "我的優勢與場域", "我的當前卡點", "下一步行動", "決策導航"]
};

const filterPanelDataByWhitelist = (panelId, dataObj) => {
  if (!dataObj || typeof dataObj !== "object") return dataObj;
  const allow = PANEL_DATA_WHITELIST[panelId];
  if (!allow?.length) return dataObj;
  const next = {};
  allow.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(dataObj, k)) next[k] = dataObj[k];
  });
  return next;
};

const getDataVal = (obj, key, fallback = "未判定") => {
  if (!obj || typeof obj !== "object") return fallback;
  const v = obj[key];
  if (v === undefined || v === null || v === "") return fallback;
  return v;
};

const PANEL_NARRATIVE_TEMPLATES = {
  core_personality: {
    summary: (d) => `你的底層結構由「${getDataVal(d, "核心模組")}」主導，並以「${getDataVal(d, "次核心模組")}」作為內在配套。`,
    interpretation: (d) => `思維傾向為「${getDataVal(d, "思維傾向")}」，行動傾向為「${getDataVal(d, "行動傾向")}」，這是你的基本運作底盤。`,
    action_prompt: () => "先用同一套做事節奏連續執行 7 天，觀察是否穩定。"
  },
  talent_advantages: {
    summary: (d) => `你最順手的能力集中在「${getDataVal(d, "自然優勢", {}).陽曆規劃能力 ? "規劃" : "核心能力"}」與執行輸出。`,
    interpretation: (d) => `目前已開發能力可直接產出成果，待開發能力適合做下一階段能力擴充。`,
    action_prompt: () => "把本週任務拆成「最順手」與「可補強」兩組配置。"
  },
  inner_drive: {
    summary: (d) => `你目前最容易被點燃的主題是「${getDataVal(d, "注意力指向")}」。`,
    interpretation: (d) => `熱情來源落在「${getDataVal(d, "熱情來源")}」，這是你能長時間投入的驅動來源。`,
    action_prompt: () => "先做一件你真正在意且能完成的小任務，驗證投入感。"
  },
  expression_consistency: {
    summary: (d) => `目前內外一致度為 ${getDataVal(d, "內外一致度分數", 0)} 分。`,
    interpretation: (d) => `主要落差在「${getDataVal(d, "常見誤解點")}」，表示內心訊號與外部接收仍有偏差。`,
    action_prompt: (d) => `${getDataVal(d, "修正建議", "先用一句感受 + 一句需求表達你的真實狀態。")}`
  },
  value_ranking: {
    summary: (d) => `你目前決策最優先守護的是「${String(getDataVal(d, "決策優先順序", ["未判定"])[0] || "未判定").replace(/^\\d+\\./, "")}」。`,
    interpretation: (d) => `${getDataVal(d, "價值衝突提醒", "目前價值排序可作為穩定決策基準。")}`,
    action_prompt: () => "重大選擇先用第一價值篩選，再用第二價值校正。"
  },
  role_fit: {
    summary: (d) => `你目前最適合的發揮位置是「${getDataVal(d, "適合的發揮位置")}」。`,
    interpretation: (d) => `角色與工作型態對齊時，效率與穩定度會明顯提高。`,
    action_prompt: () => "先把本週任務分成「我主導」與「我支援」兩類。"
  },
  current_needs: {
    summary: (d) => `你現在最需要先補的是「${getDataVal(d, "當下核心需求")}」。`,
    interpretation: (d) => `現況落差為 ${getDataVal(d, "現況落差", 0)}，代表資源要先集中在核心補位。`,
    action_prompt: () => "先完成一個能回補核心需求的最小成果。"
  },
  relationship_pattern: {
    summary: (d) => `你在人際中主要呈現「${getDataVal(d, "關係風格")}」模式。`,
    interpretation: (d) => `目前重複課題為「${getDataVal(d, "重複課題")}」，衝突多出現在「${getDataVal(d, "衝突模式")}」。`,
    action_prompt: () => "下一次關鍵互動先說需求，再談事件細節。"
  },
  fear_and_defense: {
    summary: (d) => `你的核心警報點是「${getDataVal(d, "核心恐懼")}」。`,
    interpretation: (d) => `壓力下常見反應為「${getDataVal(d, "壓力反應")}」，防衛型態是「${getDataVal(d, "防衛機制")}」。`,
    action_prompt: () => "做決策前先停 10 分鐘，先辨識你正在保護什麼。"
  },
  bottleneck_diagnosis: {
    summary: (d) => `目前主鎖點在「${getDataVal(d, "主要卡點")}」，次鎖點在「${getDataVal(d, "次要卡點")}」。`,
    interpretation: () => "這是結構性阻力，不是單一事件造成的暫時狀況。",
    action_prompt: (d) => `${getDataVal(d, "鬆動方向", "先固定一個小步驟，連續執行一週。")}`
  },
  mission_direction: {
    summary: (d) => `你的人生主線是：${getDataVal(d, "生命主軸一句話")}`,
    interpretation: (d) => `核心貢獻方向為「${getDataVal(d, "核心貢獻方向")}」，發光領域在「${getDataVal(d, "發光領域")}」。`,
    action_prompt: () => "後續重大決策都用主線一致性做第一檢核。"
  },
  future_blueprint: {
    summary: (d) => `你的未來畫面是：${getDataVal(d, "理想生活樣貌")}`,
    interpretation: (d) => `接下來一年方向為「${getDataVal(d, "一年方向")}」，並依三階段順序落地。`,
    action_prompt: () => "先完成第一階段，再依結果推進第二階段。"
  }
};

const buildFirstBatchPanels = (data, context = {}) => {
  const solarCounts = data?.matrixData?.solar?.counts || {};
  const lunarCounts = data?.matrixData?.lunar?.counts || {};
  const solarLines = data?.matrixData?.solar?.lines || [];
  const lunarLines = data?.matrixData?.lunar?.lines || [];
  const missingCount = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !solarCounts[n] && !lunarCounts[n]).length;

  const mainSolarNum = getFinalNum(data.mainSolar);
  const mainLunarNum = getFinalNum(data.mainLunar);
  const topWheel = [...(data.solarWheel || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
  const topWheelName = topWheel[0]?.name || "未判定";
  const secondaryWheelName = topWheel[1]?.name || "未判定";
  const topRadar = [...(data.lunarRadar || [])].sort((a, b) => (b.A || 0) - (a.A || 0));
  const topRadarName = topRadar[0]?.subject || "未判定";
  const secondaryRadarName = topRadar[1]?.subject || "未判定";

  const innerScore = avg([
    getRadarScore(data.lunarRadar, "情感連結"),
    getRadarScore(data.lunarRadar, "情緒容納"),
    getRadarScore(data.lunarRadar, "核心信念")
  ]);
  const outerScore = avg([
    getWheelScore(data.solarWheel, "社交人際"),
    getWheelScore(data.solarWheel, "家庭關係"),
    getWheelScore(data.solarWheel, "職業成就")
  ]);
  const consistencyScore = Math.max(0, 100 - Math.abs(innerScore - outerScore));

  const dimRaw = {
    "原始驅動層": avg([getWheelScore(data.solarWheel, "休閒娛樂"), getWheelScore(data.solarWheel, "身體健康")]),
    "策略運作層": avg([getWheelScore(data.solarWheel, "職業成就"), getWheelScore(data.solarWheel, "物質財富")]),
    "整合發揮層": avg([getWheelScore(data.solarWheel, "社交人際"), getWheelScore(data.solarWheel, "家庭關係")]),
    "意識穿透層": avg([getWheelScore(data.solarWheel, "心靈成長"), getRadarScore(data.lunarRadar, "核心信念")])
  };
  const sortedDim = Object.entries(dimRaw).sort((a, b) => b[1] - a[1]);
  const dominantDim = sortedDim[0]?.[0] || "未判定";
  const secondDim = sortedDim[1]?.[0] || "未判定";
  const baseMaturity = Math.max(45, Math.min(95, sortedDim[0]?.[1] - sortedDim[1]?.[1] + 65));

  const needsPool = [
    { label: "社交連結", score: getWheelScore(data.solarWheel, "社交人際") },
    { label: "家庭支持", score: getWheelScore(data.solarWheel, "家庭關係") },
    { label: "職涯推進", score: getWheelScore(data.solarWheel, "職業成就") },
    { label: "情緒容納", score: getRadarScore(data.lunarRadar, "情緒容納") },
    { label: "核心穩定", score: getRadarScore(data.lunarRadar, "核心信念") }
  ].sort((a, b) => a.score - b.score);

  const solarLevel = parseInt(data.mainSolarLv, 10) || 0;
  const lunarLevel = parseInt(data.mainLunarLv, 10) || 0;
  const flowSolarNum = parseFlowPath(data.solar)?.main || parseInt(data.flowSolarNum, 10) || 0;
  const flowLunarNum = parseFlowPath(data.lunar)?.main || parseInt(data.flowLunarNum, 10) || 0;
  const formatFlowDisplay = (rawValue, fallbackNum) => {
    if (rawValue && rawValue !== "--" && rawValue !== "--/--") return formatRawNum(rawValue);
    if (!fallbackNum) return "--/--";
    return buildReducedPath(fallbackNum);
  };
  const flowYearSolarDisplay = formatFlowDisplay(data.solar, flowSolarNum);
  const flowYearLunarDisplay = formatFlowDisplay(data.lunar, flowLunarNum);
  const flowMonthSolarDisplay = formatFlowDisplay(data.solarMonth, data.solarMonthNum || 0);
  const flowMonthLunarDisplay = formatFlowDisplay(data.lunarMonth, data.lunarMonthNum || 0);
  const flowDaySolarDisplay = formatFlowDisplay(data.solarDay, data.solarDayNum || 0);
  const flowDayLunarDisplay = formatFlowDisplay(data.lunarDay, data.lunarDayNum || 0);
  const birthYear = context.birthYear || new Date().getFullYear();
  const targetYear = context.targetYear || new Date().getFullYear();
  const ageInTargetYear = Math.max(0, targetYear - birthYear);
  const cyclePosition = ((ageInTargetYear % 9) + 1);
  const relationContext = context.relationContext || null;
  const maturity = Math.max(
    35,
    Math.min(
      99,
      baseMaturity + (solarLevel + lunarLevel - 7) * 2 - Math.abs(flowSolarNum - flowLunarNum)
    )
  );
  const moduleControlState = maturity >= 82 ? "可切換" : maturity >= 65 ? "可選擇" : "忍不住";
  const solarTopCircles = topEntries(solarCounts, 3);
  const lunarTopCircles = topEntries(lunarCounts, 3);
  const planningStrength = Math.min(100, solarLevel * 12 + solarTopCircles.reduce((s, [, c]) => s + c * 8, 0) + solarLines.length * 4);
  const executionStrength = Math.min(100, lunarLevel * 12 + lunarTopCircles.reduce((s, [, c]) => s + c * 8, 0) + lunarLines.length * 4);
  const developedAbilities = [];
  if (solarLevel >= 5) developedAbilities.push("外顯規劃與判斷力");
  if (lunarLevel >= 5) developedAbilities.push("內在感受驅動執行力");
  if (solarTopCircles.some(([, c]) => c >= 2)) developedAbilities.push("規劃模組可穩定輸出");
  if (lunarTopCircles.some(([, c]) => c >= 2)) developedAbilities.push("執行模組具續航能力");
  solarLines.slice(0, 1).forEach((line) => developedAbilities.push(`${line.name}（外顯應用）`));
  lunarLines.slice(0, 1).forEach((line) => developedAbilities.push(`${line.name}（內在驅動）`));

  const potentialModules = [
    ...Object.entries(solarCounts).filter(([, c]) => c === 1).map(([n]) => `陽曆${CORE_MODULE_MAP[Number(n)] || `模組${n}`}`),
    ...Object.entries(lunarCounts).filter(([, c]) => c === 1).map(([n]) => `陰曆${CORE_MODULE_MAP[Number(n)] || `模組${n}`}`)
  ].slice(0, 4);
  const scenarioHints = [
    ...solarLines.slice(0, 2).map((line) => getLineSceneHint(line.id)),
    ...lunarLines.slice(0, 1).map((line) => getLineSceneHint(line.id))
  ].slice(0, 3);
  const driveAlignment = Math.max(0, 100 - Math.abs((topRadar[0]?.A || 0) - (topWheel[0]?.score || 0)));
  const flowSupportScore = Math.max(
    0,
    Math.min(100, 60 + (flowSolarNum + flowLunarNum - 10) * 4 + (cyclePosition >= 7 ? 6 : cyclePosition <= 3 ? -4 : 0))
  );
  const flowSupportHint = flowSupportScore >= 70 ? "流年支持，適合主動推進" : flowSupportScore >= 55 ? "流年中性，適合小步驗證" : "流年偏保守，建議先穩內在節奏";
  const valueMap = [
    {
      name: "自由",
      score: avg([getWheelScore(data.solarWheel, "休閒娛樂"), getWheelScore(data.solarWheel, "心靈成長"), getRadarScore(data.lunarRadar, "頻率共振")])
    },
    {
      name: "穩定",
      score: avg([getWheelScore(data.solarWheel, "身體健康"), getWheelScore(data.solarWheel, "家庭關係"), getRadarScore(data.lunarRadar, "核心信念")])
    },
    {
      name: "影響力",
      score: avg([getWheelScore(data.solarWheel, "職業成就"), getWheelScore(data.solarWheel, "社交人際"), getRadarScore(data.lunarRadar, "生存顯化")])
    },
    {
      name: "愛",
      score: avg([getWheelScore(data.solarWheel, "家庭關係"), getRadarScore(data.lunarRadar, "情感連結"), getRadarScore(data.lunarRadar, "情緒容納")])
    },
    {
      name: "成就",
      score: avg([getWheelScore(data.solarWheel, "職業成就"), getWheelScore(data.solarWheel, "物質財富"), getRadarScore(data.lunarRadar, "核心信念")])
    },
    {
      name: "創造",
      score: avg([getWheelScore(data.solarWheel, "休閒娛樂"), getRadarScore(data.lunarRadar, "頻率共振"), getWheelScore(data.solarWheel, "心靈成長")])
    }
  ];
  const valueSorted = [...valueMap].sort((a, b) => b.score - a.score);
  const valueTop5 = valueSorted.slice(0, 5);
  const valueBottom2 = [...valueSorted].reverse().slice(0, 2);
  const valueGap = valueTop5[0] ? valueTop5[0].score - valueTop5[1].score : 0;
  const valueConflict = valueGap < 6
    ? `${valueTop5[0]?.name || "價值A"} 與 ${valueTop5[1]?.name || "價值B"} 並重，決策時容易拉扯`
    : `${valueTop5[0]?.name || "首要價值"} 優先，其他價值可做次序安排`;
  const roleScores = {
    規劃者: avg([planningStrength, getWheelScore(data.solarWheel, "職業成就"), solarLevel * 10]),
    執行者: avg([executionStrength, getWheelScore(data.solarWheel, "身體健康"), lunarLevel * 10]),
    協調者: avg([getWheelScore(data.solarWheel, "社交人際"), getRadarScore(data.lunarRadar, "情感連結"), getRadarScore(data.lunarRadar, "情緒容納")]),
    創新者: avg([getWheelScore(data.solarWheel, "休閒娛樂"), getRadarScore(data.lunarRadar, "頻率共振"), getWheelScore(data.solarWheel, "心靈成長")]),
    領導者: avg([getWheelScore(data.solarWheel, "職業成就"), getWheelScore(data.solarWheel, "物質財富"), planningStrength]),
    支援者: avg([getWheelScore(data.solarWheel, "家庭關係"), getRadarScore(data.lunarRadar, "情感連結"), executionStrength])
  };
  const roleSorted = Object.entries(roleScores).sort((a, b) => b[1] - a[1]);
  const topRole = roleSorted[0]?.[0] || "規劃者";
  const secondRole = roleSorted[1]?.[0] || "執行者";
  const workStyle = planningStrength >= executionStrength ? "先規劃後推進" : "邊做邊調整";
  const collaborationMode =
    roleScores.領導者 >= 75 ? "領導" :
    roleScores.協調者 >= 72 ? "合作" :
    roleScores.執行者 >= roleScores.規劃者 ? "支持" : "獨立";
  const highEnergyScenes = [
    topRole === "領導者" ? "有明確目標與資源可調度的任務" : "可自主規劃節奏的任務",
    roleScores.協調者 >= 70 ? "需要跨部門協作與關係整合的場景" : "可以深度專注並持續輸出的場景",
    getWheelScore(data.solarWheel, "心靈成長") >= 70 ? "可看見長期意義與成長路徑的場景" : "短中期可見成果的場景"
  ];
  const highDrainScenes = [
    "目標不清楚且責任邊界模糊的任務",
    roleScores.協調者 < 60 ? "高情緒衝突、低結構支持的團隊互動" : "只要求服從、無法提出觀點的合作模式",
    flowSupportScore < 55 ? "流年壓力期同時開多線專案" : "節奏已滿仍持續擴張承諾"
  ];
  const bestPosition =
    topRole === "領導者" ? "目標定義與資源配置核心位" :
    topRole === "規劃者" ? "策略規劃與系統設計位" :
    topRole === "執行者" ? "專案推進與交付位" :
    topRole === "協調者" ? "跨域協作與關係整合位" :
    topRole === "創新者" ? "創意開發與內容研發位" : "支援穩定與品質守門位";
  const relationScores = {
    closeness: avg([getWheelScore(data.solarWheel, "家庭關係"), getRadarScore(data.lunarRadar, "情感連結")]),
    expression: avg([getWheelScore(data.solarWheel, "社交人際"), getRadarScore(data.lunarRadar, "頻率共振")]),
    stability: avg([getRadarScore(data.lunarRadar, "核心信念"), getWheelScore(data.solarWheel, "身體健康")]),
    tension: 100 - avg([getRadarScore(data.lunarRadar, "情緒容納"), getWheelScore(data.solarWheel, "家庭關係")])
  };
  const relationStyle =
    relationScores.closeness >= 75 ? "深度連結型" :
    relationScores.expression >= 72 ? "互動交流型" :
    relationScores.stability >= 70 ? "穩定承諾型" : "觀察保留型";
  const attractionType =
    mainLunarNum >= 7 ? "被有深度與思辨感的人吸引" :
    mainLunarNum >= 4 ? "被穩定可靠、能落地的人吸引" :
    mainLunarNum >= 2 ? "被有情緒理解力與陪伴感的人吸引" :
    "被行動力強、推進快的人吸引";
  const conflictPattern =
    relationScores.tension >= 55
      ? "在壓力下容易進入防衛或沉默，形成誤解累積"
      : "衝突多來自節奏差異，可透過提前對齊期待改善";
  const repeatedTheme =
    relationScores.closeness > relationScores.expression
      ? "內在想靠近，但外在表達不夠直接"
      : relationScores.expression > relationScores.closeness + 8
        ? "互動很熱絡，但深度需求未被充分回應"
        : "關係互動與深度需求大致平衡";
  const relationAdvantage = [
    relationStyle,
    relationScores.expression >= 70 ? "能主動建立互動連結" : "在熟悉關係中能穩定投入",
    relationScores.stability >= 70 ? "具長期關係經營力" : "具關係調整彈性"
  ];
  const relationReminder =
    relationScores.tension >= 55
      ? "先說需求再談對錯，避免情緒先行造成距離。"
      : "維持定期對話節奏，讓關係期待持續對齊。";
  const fearScores = {
    安全感不足: Math.max(0, 100 - avg([getWheelScore(data.solarWheel, "家庭關係"), getWheelScore(data.solarWheel, "身體健康")])),
    失去掌控: Math.max(0, 100 - avg([getWheelScore(data.solarWheel, "職業成就"), getWheelScore(data.solarWheel, "物質財富")])),
    被否定: Math.max(0, 100 - avg([getRadarScore(data.lunarRadar, "核心信念"), getRadarScore(data.lunarRadar, "情感連結")])),
    關係失衡: Math.max(0, 100 - avg([getRadarScore(data.lunarRadar, "情緒容納"), getWheelScore(data.solarWheel, "社交人際")]))
  };
  const fearSorted = Object.entries(fearScores).sort((a, b) => b[1] - a[1]);
  const mainFear = fearSorted[0]?.[0] || "安全感不足";
  const fearImpact = fearSorted[0]?.[1] || 50;
  const defenseStyle =
    fearImpact >= 70 ? "高警戒防衛（先保護自己）" :
    fearImpact >= 55 ? "策略防衛（先觀察再回應）" :
    "低防衛（可維持開放對話）";
  const pressureReaction =
    flowSolarNum <= 3 || flowLunarNum <= 3
      ? "壓力下先收縮、傾向延後決策"
      : flowSolarNum >= 8 || flowLunarNum >= 8
        ? "壓力下先推進、傾向快速定案"
        : "壓力下以評估與調整為主";
  const avoidScenes = [
    mainFear === "安全感不足" ? "規則不明、邊界模糊的合作情境" : "高不確定且無法掌控節奏的任務",
    mainFear === "被否定" ? "需要立即公開表態的場景" : "衝突升溫但無共識機制的互動",
    consistencyScore < 65 ? "內外訊號不一致時的關鍵對話" : "高負荷下連續承諾多個目標"
  ];
  const triggerScenes = [
    `流年數 ${flowYearSolarDisplay}/${flowYearLunarDisplay} 與當下任務壓力重疊時`,
    missingCount >= 4 ? "資源不足或準備不完整時" : "預期成果與實際落差擴大時",
    relationScores.tension >= 55 ? "關係訊號模糊或回應延遲時" : "節奏被打亂且缺乏緩衝時"
  ];
  const bottleneckScores = {
    人格卡點: Math.min(100, missingCount * 15 + Math.max(0, 70 - avg([solarLevel * 10, lunarLevel * 10]))),
    關係卡點: Math.min(100, Math.max(0, 100 - consistencyScore) + Math.round(relationScores.tension * 0.4)),
    價值卡點: Math.min(100, valueGap < 6 ? 72 : Math.max(0, 80 - (valueTop5[0]?.score || 0))),
    時間卡點: Math.min(100, Math.abs(flowSolarNum - flowLunarNum) * 10 + (cyclePosition === 9 || cyclePosition === 1 ? 18 : 8)),
    行動卡點: Math.min(100, solarLines.length < 2 ? 70 : 45 + Math.max(0, 65 - executionStrength) * 0.4)
  };
  const bottleneckSorted = Object.entries(bottleneckScores).sort((a, b) => b[1] - a[1]);
  const bottleneckType = bottleneckSorted[0]?.[0] || "行動卡點";
  const secondaryBottleneck = bottleneckSorted[1]?.[0] || "時間卡點";
  const releaseDirection =
    bottleneckType === "行動卡點" ? "把目標拆成最小可交付，先穩定節奏再擴張。" :
    bottleneckType === "時間卡點" ? "先做節奏校準，讓流年壓力與任務密度對齊。" :
    bottleneckType === "關係卡點" ? "先對齊需求與邊界，再談對錯與情緒反應。" :
    bottleneckType === "價值卡點" ? "先固定一個首要價值當決策第一判準。" :
    "先處理核心安全感，再進入外在推進。";
  const stageNumber = cyclePosition;
  const rhythmMode =
    flowSolarNum >= 8 || flowLunarNum >= 8 ? "衝" :
    flowSolarNum <= 3 || flowLunarNum <= 3 ? "守" :
    stageNumber === 7 ? "修" :
    stageNumber === 9 ? "收" :
    "修";
  const rhythmInterpretation =
    rhythmMode === "衝" ? "環境支持推進與資源擴張，重點在果斷執行。" :
    rhythmMode === "守" ? "環境偏保守，重點在穩定基礎與降低失誤。" :
    rhythmMode === "收" ? "進入收束期，重點是整理成果與結束舊循環。" :
    "進入修整期，重點是調整方法與補齊結構。";
  const annualTheme = {
    1: "啟動與播種",
    2: "連結與耐心",
    3: "表達與創造",
    4: "現實與穩固",
    5: "變動與轉換",
    6: "責任與關係",
    7: "內觀與修正",
    8: "成果與資源",
    9: "總結與釋放"
  }[flowSolarNum] || "節奏調整";
  const monthHint =
    data.solarMonthNum >= 8 ? "本月偏衝刺，適合推進關鍵任務。" :
    data.solarMonthNum <= 3 ? "本月偏保守，先穩定節奏與邊界。" :
    "本月適合修正方法與優化流程。";
  const dayHint =
    data.solarDayNum >= 8 ? "今日可做決策與對外溝通。" :
    data.solarDayNum <= 3 ? "今日適合整理、盤點與收斂。" :
    "今日適合小步推進與驗證。";
  const missionSentence = `以${CORE_MODULE_MAP[mainSolarNum] || "核心模組"}對外推進，結合${CORE_MODULE_MAP[mainLunarNum] || "內在模組"}內在感受，長期在「${valueTop5[0]?.name || "成長"}」價值上創造可持續影響。`;
  const contributionDirection =
    topRole === "領導者" ? "整合資源、帶隊完成高價值目標" :
    topRole === "規劃者" ? "建立方法與系統，讓團隊可複製成果" :
    topRole === "執行者" ? "把策略轉為穩定交付與可衡量進度" :
    topRole === "協調者" ? "串接人與人之間的理解，降低摩擦成本" :
    topRole === "創新者" ? "提出新解法，打開新場景與新可能" :
    "提供穩定支援，維持品質與信任";
  const shineDomain =
    valueTop5[0]?.name === "影響力" ? "策略與管理場域" :
    valueTop5[0]?.name === "愛" ? "關係與助人場域" :
    valueTop5[0]?.name === "創造" ? "內容與創新場域" :
    valueTop5[0]?.name === "成就" ? "商業與成果導向場域" :
    valueTop5[0]?.name === "自由" ? "彈性專案與探索型場域" :
    "穩定經營與系統優化場域";
  const missionKeywords = [valueTop5[0]?.name, topRole, dominantDim].filter(Boolean);
  const offTrackWarning =
    valueGap < 6
      ? "若同時追太多價值，會稀釋主軸動能。"
      : "若長期偏離首要價值，會出現高努力低成就感。";
  const idealLifeShape = `在「${shineDomain}」持續輸出價值，同時維持${valueTop5[0]?.name || "核心價值"}與生活節奏平衡。`;
  const oneYearDirection =
    rhythmMode === "衝" ? "一年內建立可放大的主力成果，形成可複製路徑。" :
    rhythmMode === "守" ? "一年內先穩定基礎盤，優化節奏與核心系統。" :
    rhythmMode === "收" ? "一年內完成舊循環收束，重整資源後再啟新局。" :
    "一年內完成方法升級，讓輸出更穩定且可持續。";
  const threeStagePath = [
    {
      stage: "第一階段（0-30天）",
      focus: "收斂與定位",
      action: `聚焦「${missionKeywords[0] || "核心價值"}」對應的一項關鍵任務，完成最小可驗證成果。`
    },
    {
      stage: "第二階段（31-90天）",
      focus: "穩定與擴展",
      action: "把有效做法流程化，每週固定節奏輸出，開始小範圍擴張。"
    },
    {
      stage: "第三階段（91-365天）",
      focus: "整合與放大",
      action: `以「${contributionDirection}」為主軸，建立可持續的成果結構與長期定位。`
    }
  ];
  const nearTermPriority = [
    `第一步：對齊使命主軸（${missionKeywords.join(" / ")}）`,
    `第二步：以「${rhythmMode}」節奏穩定輸出`,
    "第三步：完成最小成果後再擴張下一階段"
  ];
  const longTermVision = `三年內在${shineDomain}形成穩定影響力，並以${valueTop5[0]?.name || "核心價值"}為決策主軸。`;
  const blueprintRiskNote = [
    offTrackWarning,
    fearImpact >= 65 ? "高恐懼期容易讓計畫反覆重設，需先穩定內在節奏。" : "注意避免因短期順利而過度擴張。",
    relationContext ? `關係動能為${relationContext.primaryCategory}，重要合作需先對齊邊界。` : "關係面尚未連動共振對象，合作決策前建議先補足關係數判讀。"
  ];
  const timeSupportScore = Math.max(35, Math.min(95, flowSupportScore));
  const relationshipMatchScore = relationContext
    ? ([2, 3, 5, 6, 7, 8, 10].includes(relationContext.primaryNum) ? 78 : 58)
    : 52;
  const selfReadinessScore = Math.max(35, Math.min(95, Math.round((maturity + (100 - fearImpact)) / 2)));
  const baseDecisionScore = Math.round((timeSupportScore * relationshipMatchScore * selfReadinessScore) / 10000);

  const binaryOptionA = {
    option_a: "穩健推進（先小規模驗證）",
    option_b: "快速擴張（直接全量投入）",
    decision_type: "timing",
    time_context: `${rhythmMode} / 流年${flowYearSolarDisplay}`,
    relationship_context: relationContext ? `${relationContext.primaryNum} ${relationContext.primaryCategory}` : "未連動共振對象",
    self_readiness: selfReadinessScore,
    recommendation: baseDecisionScore >= 70 ? "適合立即行動" : baseDecisionScore >= 55 ? "適合小規模測試" : "適合觀察後再行動",
    risk_note: baseDecisionScore < 55 ? "先補強節奏與卡點再擴張，避免過度消耗。" : "保持單點聚焦，避免多線同時開展。"
  };

  const multiOptions = [
    { option_id: "A", option_name: "獨立主導方案", option_type: "career", time_weight: 1.05, relation_weight: 0.85, energy_cost: 68, long_term: 82 },
    { option_id: "B", option_name: "合作共創方案", option_type: "collaboration", time_weight: 1.0, relation_weight: 1.1, energy_cost: 60, long_term: 78 },
    { option_id: "C", option_name: "過渡調整方案", option_type: "lifestyle", time_weight: 0.9, relation_weight: 1.0, energy_cost: 45, long_term: 70 }
  ].map((opt) => {
    const fit = Math.round(
      (timeSupportScore * opt.time_weight * 0.35) +
      (relationshipMatchScore * opt.relation_weight * 0.25) +
      (selfReadinessScore * 0.2) +
      (opt.long_term * 0.2) -
      (opt.energy_cost * 0.15)
    );
    const finalFit = Math.max(0, Math.min(100, fit));
    const recommendation =
      finalFit >= 75 ? "適合立即行動" :
      finalFit >= 62 ? "適合小規模測試" :
      finalFit >= 50 ? "適合觀察後再行動" : "目前不建議投入";
    return {
      option_id: opt.option_id,
      option_name: opt.option_name,
      option_type: opt.option_type,
      fit_score: finalFit,
      time_support_score: Math.round(timeSupportScore * opt.time_weight),
      relationship_match_score: Math.round(relationshipMatchScore * opt.relation_weight),
      energy_cost_score: opt.energy_cost,
      long_term_alignment_score: opt.long_term,
      summary: `${opt.option_name}目前適配分數 ${finalFit}`,
      recommendation
    };
  }).sort((a, b) => b.fit_score - a.fit_score);
  const topDecisionOption = multiOptions[0] || null;
  const optionTypeMap = {
    career: "職涯",
    relationship: "關係",
    collaboration: "合作",
    business: "商業",
    learning: "學習",
    relocation: "搬遷",
    lifestyle: "生活",
    timing: "時機",
    custom: "自訂"
  };
  const compactOptionRanking = multiOptions.slice(0, 3).map((opt, idx) => ({
    排名: idx + 1,
    方案: opt.option_name,
    類型: optionTypeMap[opt.option_type] || opt.option_type,
    適配分: opt.fit_score,
    建議: opt.recommendation
  }));
  const decisionPrimaryRecommendation = baseDecisionScore >= 70
    ? "適合立即行動"
    : baseDecisionScore >= 55
      ? "適合小規模測試"
      : "適合觀察後再行動";
  const decisionExecutionHint =
    decisionPrimaryRecommendation === "適合立即行動"
      ? "可直接推進首選方案，維持單線聚焦。"
      : decisionPrimaryRecommendation === "適合小規模測試"
        ? "先以 7 天試行驗證，再決定是否擴張。"
        : "先補強時間節奏與關係對齊，再投入關鍵決策。";
  const topOptionReason = topDecisionOption
    ? `首選「${topDecisionOption.option_name}」：時間支援 ${topDecisionOption.time_support_score}、關係匹配 ${topDecisionOption.relationship_match_score}、長期對齊 ${topDecisionOption.long_term_alignment_score}。`
    : "目前尚無可用方案，請先完成基礎輸入。";
  const topStrengths = [
    `核心模組：${CORE_MODULE_MAP[mainSolarNum] || "未判定"} / ${CORE_MODULE_MAP[mainLunarNum] || "未判定"}`,
    `高適配角色：${topRole}（次適配：${secondRole}）`,
    `首要價值：${valueTop5[0]?.name || "未判定"}`
  ];
  const topRisks = [
    `主卡點：${bottleneckType}`,
    `核心恐懼：${mainFear}`,
    `節奏模式：${rhythmMode}（流年 ${flowYearSolarDisplay}/${flowYearLunarDisplay}）`
  ];
  const next7DayAction = `7天內先完成「${threeStagePath[0]?.focus || "收斂與定位"}」：${threeStagePath[0]?.action || "完成一個最小可驗證成果"}`;
  const next30DayMilestone = threeStagePath[0]?.action || "完成第一階段最小成果";
  const relationSyncSummary = relationContext
    ? `已連動共振對象「${relationContext.partnerName}」，主關係數 ${relationContext.primaryNum}（${relationContext.primaryCategory}）。`
    : "尚未選擇共振對象，建議先到能量共振實驗室 v10.9 選擇對象。";

  const solarCode = parseDateCode(data.solarDateStr);
  const lunarCode = parseDateCode(data.lunarDateStr);
  const solarConsequent = sumDigitsFromStr(solarCode);
  const lunarConsequent = sumDigitsFromStr(lunarCode);
  const solarMainPath = buildReducedPath(solarConsequent);
  const lunarMainPath = buildReducedPath(lunarConsequent);
  const yangDongYinSui = Math.max(0, 100 - Math.abs(outerScore - innerScore));
  const thinkingTendency = getThinkingTendencyBySolar(mainSolarNum);
  const actionTendency = getActionTendencyByLunar(mainLunarNum);

  const panels = [
    {
      panel_id: "core_personality",
      panel_title: "核心人格面板",
      core_question: "我是什麼樣的人？",
      summary: `陽曆主命 ${solarMainPath} 代表對外思考與工作風格；陰曆主命 ${lunarMainPath} 代表內在感受與行動驅動。`,
      interpretation: `你的核心模組是「${CORE_MODULE_MAP[mainSolarNum] || "探索模組"}」，次核心模組是「${CORE_MODULE_MAP[mainLunarNum] || "探索模組"}」。靈魂等級狀態為陽曆 ${getSoulLevelState(data.mainSolarLv)}、陰曆 ${getSoulLevelState(data.mainLunarLv)}，顯示你目前在「對外輸出」與「內在落地」的成熟位置。`,
      action_prompt: "依你的主命數定位一個主場景：外在選擇最能發揮核心模組的任務，內在選擇最能穩定行動節奏的做法。",
      data: {
        陽曆: {
          先天數: solarCode || "待補",
          後天數: solarConsequent || 0,
          主命數: solarMainPath,
          靈魂等級: data.mainSolarLv
        },
        陰曆: {
          先天數: lunarCode || "待補",
          後天數: lunarConsequent || 0,
          主命數: lunarMainPath,
          靈魂等級: data.mainLunarLv
        },
        核心模組: CORE_MODULE_MAP[mainSolarNum] || "探索模組",
        次核心模組: CORE_MODULE_MAP[mainLunarNum] || "探索模組",
        思維傾向: thinkingTendency,
        行動傾向: actionTendency,
        狀態校準分數: yangDongYinSui,
        主命數解析: {
          陽曆數字重點: `${solarMainPath} 對應模組偏向${thinkingTendency}`,
          陰曆數字重點: `${lunarMainPath} 對應模組偏向${actionTendency}`
        },
        靈魂等級狀態: {
          陽曆: getSoulLevelState(data.mainSolarLv),
          陰曆: getSoulLevelState(data.mainLunarLv)
        },
        自我定位建議: `以${CORE_MODULE_MAP[mainSolarNum] || "核心模組"}作為對外定位，並用${CORE_MODULE_MAP[mainLunarNum] || "次核心模組"}校準內在行動節奏`,
        主要人格摘要: `${CORE_MODULE_MAP[mainSolarNum] || "探索"} 對外推進，${CORE_MODULE_MAP[mainLunarNum] || "探索"} 內在驅動`
      },
      tags: ["第一批", "自我辨識"],
      risk_level: yangDongYinSui < 60 ? "high" : yangDongYinSui < 75 ? "medium" : "low",
      priority: 1
    },
    {
      panel_id: "talent_advantages",
      panel_title: "天賦優勢面板",
      core_question: "我的天賦與優勢是什麼？",
      summary: `你的天賦呈現「陽曆規劃 ${planningStrength} / 陰曆執行 ${executionStrength}」雙軸結構。`,
      interpretation: `已開發能力以圈數與靈魂等級共同判讀。陽曆等級 ${solarLevel} 代表外顯能量強度，陰曆等級 ${lunarLevel} 代表感受與執行續航。`,
      action_prompt: "把一個任務拆成「規劃段」與「執行段」，用你的自然強項分段完成。",
      data: {
        自然優勢: {
          陽曆規劃能力: {
            強度分數: planningStrength,
            主要模組: solarTopCircles.map(formatModuleCircle)
          },
          陰曆執行能力: {
            強度分數: executionStrength,
            主要模組: lunarTopCircles.map(formatModuleCircle)
          }
        },
        已開發能力: [...new Set(developedAbilities)].slice(0, 5),
        潛在可開發能力: potentialModules.length ? potentialModules : ["目前圈數偏集中，建議從低圈模組補位"],
        優勢應用場景: scenarioHints.length ? scenarioHints : ["先在單一重點任務建立穩定流程"],
        最容易被看見的亮點: `${CORE_MODULE_MAP[mainSolarNum] || "核心模組"} + ${topWheelName}`
      },
      tags: ["校準中", "自我辨識"],
      risk_level: Math.abs(planningStrength - executionStrength) > 25 ? "medium" : "low",
      priority: 2
    },
    {
      panel_id: "current_operation_dimension",
      panel_title: "當前運作維度面板",
      core_question: "我目前在哪個運作維度？",
      summary: `你目前主維度在「${dominantDim}」，次維度是「${secondDim}」。`,
      interpretation: `分數顯示你現在主要在 ${dominantDim} 出力，遇到壓力時會切回 ${secondDim} 的應對模式。再加上靈魂等級(${solarLevel}/${lunarLevel})與流年數(${flowYearSolarDisplay}/${flowYearLunarDisplay})後，你目前屬於「${moduleControlState}」的運作狀態。`,
      action_prompt: "先把今天任務標成「主維度任務」與「次維度任務」各一件，避免能量混線。",
      data: {
        當前主維度: dominantDim,
        次維度: secondDim,
        壓力下反應: flowSolarNum <= 3 ? "先守再攻" : "先攻後穩",
        成熟度判讀: maturity,
        維度轉換提醒: `${dominantDim} -> ${secondDim}`,
        維度分數: dimRaw,
        靈魂等級參考: { 陽曆: solarLevel, 陰曆: lunarLevel },
        流年數參考: { 陽曆: flowYearSolarDisplay, 陰曆: flowYearLunarDisplay },
        九年週期位置: cyclePosition,
        是否被模組綁架: moduleControlState
      },
      tags: ["第一批", "自我辨識"],
      risk_level: maturity < 60 ? "high" : maturity < 75 ? "medium" : "low",
      priority: 3
    },
    {
      panel_id: "inner_drive",
      panel_title: "內在驅動面板",
      core_question: "我真正喜歡什麼？",
      summary: `內在驅動（陰曆）目前以「${topRadarName}」為主，外在落地（陽曆）以「${topWheelName}」承接。`,
      interpretation: `這代表你真正有感的是 ${topRadarName}，而最容易轉成成果的路徑是 ${topWheelName}。先照顧陰曆驅動，再用陽曆結構落地，動能會更穩定。`,
      action_prompt: "先定一個你真正有感的主題，再安排一個可量化輸出去驗證投入感。",
      data: {
        注意力指向: topRadarName,
        熱情來源: secondaryRadarName,
        flow場景: (data.solarWheel || []).filter((x) => x.hasFlowBuff).map((x) => x.name),
        內在渴望: getRadarScore(data.lunarRadar, "核心信念") >= 70 ? "長期價值實現" : "先建立安全穩定",
        長期投入主題: getWheelScore(data.solarWheel, "心靈成長") >= 70 ? "成長型主軸" : "成果型主軸",
        陽曆驅動: topWheelName,
        陰曆驅動: topRadarName,
        陽動陰隨一致度: driveAlignment
      },
      tags: ["第一批", "自我辨識"],
      risk_level: driveAlignment < 55 ? "high" : driveAlignment < 72 ? "medium" : "low",
      priority: 4
    },
    {
      panel_id: "expression_consistency",
      panel_title: "表達一致性面板",
      core_question: "我的表達方式，真的等於我的內心嗎？",
      summary: `目前內外一致度為 ${consistencyScore} 分。陰曆內在(${innerScore}) 與陽曆外顯(${outerScore})有 ${Math.abs(innerScore - outerScore)} 分落差。`,
      interpretation: innerScore > outerScore
        ? "你內在感受與需求啟動更快，但外在表達偏保守，容易被誤讀成不在意或不表態。"
        : "你外在推進與回應速度更快，但內在消化還在跟上，容易被誤讀成只重效率與結果。",
      action_prompt: innerScore > outerScore
        ? "關鍵對話先說感受與在意點，再提方案，讓對方接收到你的真實內心。"
        : "先說明你的動機與價值，再談行動安排，避免只留下結果導向印象。",
      data: {
        內在感受: innerScore,
        外在表達: outerScore,
        他人接收印象: outerScore >= innerScore ? "行動導向" : "情感導向",
        常見誤解點: outerScore >= innerScore ? "被看成急推進" : "被看成難決定",
        內外一致度分數: consistencyScore,
        落差提醒: Math.abs(innerScore - outerScore),
        陽曆外顯能量: {
          靈魂等級: solarLevel,
          主驅動: topWheelName
        },
        陰曆內在能量: {
          靈魂等級: lunarLevel,
          主驅動: topRadarName
        },
        誤解來源分型: Math.abs(innerScore - outerScore) >= 20
          ? "高落差型：訊號前後不一致"
          : Math.abs(innerScore - outerScore) >= 10
            ? "中落差型：情境變化時容易偏移"
            : "低落差型：整體一致",
        修正建議: outerScore >= innerScore
          ? "表達前加一句內在動機，減少他人把你歸類為只衝結果。"
          : "先把想法具體化成一句需求與一句行動，減少訊息模糊。"
      },
      tags: ["第一批", "自我辨識"],
      risk_level: consistencyScore < 60 ? "high" : consistencyScore < 75 ? "medium" : "low",
      priority: 5
    },
    {
      panel_id: "current_needs",
      panel_title: "當下需求面板",
      core_question: "我現在真正想要的是什麼？",
      summary: `當下最需要補位的是「${needsPool[0]?.label || "核心穩定"}」，接著是「${needsPool[1]?.label || "情緒容納"}」。`,
      interpretation: `目前低分需求集中在 ${needsPool.slice(0, 3).map((x) => x.label).join("、")}，代表你不是做不動，而是資源配置順序要調整。`,
      action_prompt: "先聚焦第一需求做一個可驗證成果，再決定是否擴張下一項目標。",
      data: {
        當下核心需求: needsPool[0]?.label,
        次要需求: needsPool[1]?.label,
        第三需求: needsPool[2]?.label,
        現況落差: needsPool[0] ? 100 - needsPool[0].score : 0,
        當下不宜做的事: flowSolarNum <= 3 ? "同時開新戰線" : "沒有收斂就擴張",
        當前優先順序: needsPool.slice(0, 3)
      },
      tags: ["第一批", "適配性"],
      risk_level: (needsPool[0]?.score || 0) < 55 ? "high" : "medium",
      priority: 6
    },
    {
      panel_id: "bottleneck_diagnosis",
      panel_title: "卡點診斷面板",
      core_question: "我一直跨不過去的人生卡點是什麼？",
      summary: `主要卡點為「${bottleneckType}」，次要卡點為「${secondaryBottleneck}」。目前最需要先鬆動的是主卡點結構。`,
      interpretation: `卡點分數顯示你不是單一問題，而是多層結構重疊。主卡點拉住前進速度，次卡點會在壓力升高時放大阻力。`,
      action_prompt: "先做主卡點 7 天微調，每天同一時段完成一個最小修正動作，再追蹤變化。",
      data: {
        主要卡點: bottleneckType,
        次要卡點: secondaryBottleneck,
        卡點來源: "矩陣缺數、內外一致度、價值排序、流年壓力、行動連線交叉判讀",
        卡點類型: [bottleneckType, secondaryBottleneck],
        鬆動方向: releaseDirection,
        調整優先順序: [bottleneckType, secondaryBottleneck, "時間節奏", "核心需求"],
        卡點分數: bottleneckSorted
      },
      tags: ["第一批", "卡點"],
      risk_level: (bottleneckSorted[0]?.[1] || 0) >= 70 ? "high" : (bottleneckSorted[0]?.[1] || 0) >= 55 ? "medium" : "low",
      priority: 7
    },
    {
      panel_id: "value_ranking",
      panel_title: "價值排序面板",
      core_question: "我最在意的是什麼？",
      summary: `你目前最優先的價值是「${valueTop5[0]?.name || "未判定"}」，前五排序為 ${valueTop5.map((v) => v.name).join("、")}。`,
      interpretation: `${valueConflict}。這代表你在做選擇時，若同時追求互相競爭的價值，會出現拖延或反覆重選。`,
      action_prompt: `本週重大決策先以「${valueTop5[0]?.name || "首要價值"}」作第一判準，再用第二價值做校正。`,
      data: {
        價值排序前五名: valueTop5.map((v, idx) => `${idx + 1}. ${v.name}（${v.score}分）`),
        當前活出程度: avg(valueTop5.map((v) => v.score)),
        尚未活出的價值: valueBottom2.map((v, idx) => `${idx + 1}. ${v.name}（${v.score}分）`),
        價值衝突提醒: valueConflict,
        決策優先順序: valueTop5.map((v, idx) => `${idx + 1}.${v.name}`)
      },
      tags: ["第三週", "適配性"],
      risk_level: valueGap < 6 ? "medium" : "low",
      priority: 8
    },
    {
      panel_id: "role_fit",
      panel_title: "角色適配面板",
      core_question: "我適合什麼樣的角色與工作方式？",
      summary: `你目前最適配角色是「${topRole}」，次適配是「${secondRole}」，建議採用「${workStyle}」的工作節奏。`,
      interpretation: `你的能力結構顯示在「${bestPosition}」最容易穩定輸出。當角色要求長期違反你的能量模式時，會出現效率下降與內耗。`,
      action_prompt: "先把本週任務分成『我主導』與『我支援』兩類，讓角色位置與能量模式對齊。",
      data: {
        適合角色: [topRole, secondRole],
        適合工作型態: workStyle,
        "適合獨立/合作/領導/支持": collaborationMode,
        高能量場景: highEnergyScenes,
        高耗損場景: highDrainScenes,
        適合的發揮位置: bestPosition,
        角色分數: roleSorted
      },
      tags: ["第三週", "適配性"],
      risk_level: roleSorted[0]?.[1] - roleSorted[1]?.[1] < 6 ? "medium" : "low",
      priority: 9
    },
    {
      panel_id: "relationship_pattern",
      panel_title: "關係模式面板",
      core_question: "我的人際與感情模式健康嗎？我總是在重複什麼？",
      summary: `你目前的關係風格偏「${relationStyle}」，最常重複的課題是「${repeatedTheme}」。`,
      interpretation: `你在關係中同時追求連結與穩定。當壓力升高時，容易出現「${conflictPattern}」的互動循環，這是關係節奏與期待未同步。`,
      action_prompt: "下一次重要互動，先說你要的是什麼關係狀態，再討論事件細節。",
      data: {
        關係風格: relationStyle,
        吸引類型: attractionType,
        衝突模式: conflictPattern,
        重複課題: repeatedTheme,
        互動優勢: relationAdvantage,
        關係提醒: relationReminder,
        關係指標: relationScores,
        共振關係數: relationContext || "未連動（請至能量共振實驗室 v10.9 選擇對象）"
      },
      tags: ["第四週", "關係"],
      risk_level: relationScores.tension >= 60 ? "high" : relationScores.tension >= 45 ? "medium" : "low",
      priority: 10
    },
    {
      panel_id: "relationship_dynamics",
      panel_title: "關係動能面板",
      core_question: "這段關係是什麼性質的連線？",
      summary: relationContext
        ? `你與 ${relationContext.partnerName} 的主關係數是 ${relationContext.primaryNum}，屬於「${relationContext.primaryCategory}」。`
        : "尚未選擇共振對象，關係動能面板需先連動能量共振實驗室 v10.9 才能判讀。",
      interpretation: relationContext
        ? `四組共振數（++/+-/-+/--）會呈現關係中的主互動節奏。當主關係數落在 ${relationContext.primaryCategory}，代表此段關係主要學習場景與互動壓力在該層級。`
        : "此面板強制使用共振關係數，不使用單人資料推估，避免失真。",
      action_prompt: relationContext
        ? "先以主關係數對應的互動策略做一週觀察，再依四組共振差異微調溝通方式。"
        : "先到能量共振實驗室 v10.9 選擇對象，再回來查看關係動能判讀。",
      data: relationContext
        ? {
            感情數: relationContext.primaryNum,
            關係類型: relationContext.primaryCategory,
            親密程度: relationContext.primaryCategory.split("（")[0],
            互動優勢: relationContext.primaryNum >= 5 && relationContext.primaryNum <= 8 ? "可透過目標協作形成正向推進" : "高連動，容易快速看見關係課題",
            互動風險: [9, 11, 12].includes(relationContext.primaryNum) ? "情緒強度高，容易極端拉扯" : "若缺乏邊界，容易角色混線",
            建議關係策略: relationContext.primaryNum >= 9 ? "先建立邊界，再談深度承諾" : "先對齊目標，再分配互動節奏",
            共振明細: relationContext.pairs
          }
        : {
            狀態: "待連動",
            說明: "請先在能量共振實驗室 v10.9 選擇共振對象"
          },
      tags: ["第四週", "關係", "強制共振數"],
      risk_level: !relationContext
        ? "high"
        : [9, 11, 12].includes(relationContext.primaryNum)
          ? "high"
          : [5, 6, 7, 8].includes(relationContext.primaryNum)
            ? "medium"
            : "low",
      priority: 11
    },
    {
      panel_id: "fear_and_defense",
      panel_title: "恐懼與防衛面板",
      core_question: "我最害怕的是什麼？這個恐懼怎麼影響我的選擇？",
      summary: `你目前的核心恐懼是「${mainFear}」，影響強度約 ${fearImpact} 分，防衛型態偏向「${defenseStyle}」。`,
      interpretation: `這不是能力不足，而是系統在壓力下優先保護你。當觸發場景出現時，你會進入「${pressureReaction}」的反應路徑，導致選擇變保守或過快。`,
      action_prompt: "遇到關鍵決策先停 10 分鐘，先寫下『我現在在怕什麼』再決定下一步。",
      data: {
        核心恐懼: mainFear,
        壓力反應: pressureReaction,
        防衛機制: defenseStyle,
        容易逃避的情境: avoidScenes,
        恐懼影響範圍: fearImpact,
        恐懼觸發場景: triggerScenes,
        恐懼分數: fearSorted
      },
      tags: ["第五週", "卡點"],
      risk_level: fearImpact >= 70 ? "high" : fearImpact >= 55 ? "medium" : "low",
      priority: 12
    },
    {
      panel_id: "time_rhythm",
      panel_title: "時間節奏面板",
      core_question: "現在適合衝、守、修、還是收？",
      summary: `你目前節奏判讀為「${rhythmMode}」，九年週期位置在第 ${stageNumber} 位。`,
      interpretation: `${rhythmInterpretation} 現在的重點不是做更多，而是做對節奏。`,
      action_prompt: rhythmMode === "衝"
        ? "本週鎖定一個關鍵目標全力推進，避免分散投入。"
        : rhythmMode === "守"
          ? "本週先穩定既有任務，避免新增高風險承諾。"
          : rhythmMode === "收"
            ? "本週先完成收尾與交接，為下一輪啟動預留空間。"
            : "本週先修正一個流程瓶頸，再擴大執行強度。",
      data: {
        階段數: stageNumber,
        流年數: { 陽曆: flowYearSolarDisplay, 陰曆: flowYearLunarDisplay },
        流月數: { 陽曆: flowMonthSolarDisplay, 陰曆: flowMonthLunarDisplay },
        流日數: { 陽曆: flowDaySolarDisplay, 陰曆: flowDayLunarDisplay },
        當前節奏判讀: rhythmMode,
        年度主題: annualTheme,
        當月提醒: monthHint,
        今日提醒: dayHint
      },
      tags: ["第六週", "時間導航"],
      risk_level: rhythmMode === "衝" && fearImpact >= 65 ? "high" : rhythmMode === "守" ? "medium" : "low",
      priority: 13
    },
    {
      panel_id: "mission_direction",
      panel_title: "使命方向面板",
      core_question: "我的人生目標或使命是什麼？",
      summary: `你的生命主軸可收斂為：${missionSentence}`,
      interpretation: `當你在「${shineDomain}」運作時，最容易把天賦轉成可見價值。使命不是單一職稱，而是持續用你的優勢解決特定問題。`,
      action_prompt: `用「${missionKeywords[0] || "核心價值"}」作為主線檢核，讓每個重大選擇都能回到核心貢獻方向。`,
      data: {
        生命主軸一句話: missionSentence,
        核心貢獻方向: contributionDirection,
        發光領域: shineDomain,
        使命關鍵詞: missionKeywords,
        不宜偏離主線: offTrackWarning
      },
      tags: ["第六週", "方向"],
      risk_level: valueGap < 6 ? "medium" : "low",
      priority: 14
    },
    {
      panel_id: "future_blueprint",
      panel_title: "未來藍圖面板",
      core_question: "如果拿掉恐懼，我真正想活出什麼人生？",
      summary: `你的未來藍圖主軸是：${idealLifeShape}`,
      interpretation: `接下來一年重點在「${oneYearDirection}」。藍圖不是一次定案，而是用節奏持續校準方向。`,
      action_prompt: "先啟動第一階段（30天）行動，完成一個最小成果後再擴張到下一階段。",
      data: {
        理想生活樣貌: idealLifeShape,
        一年方向: oneYearDirection,
        三階段路徑: {
          第一階段: {
            期間: "0-30天",
            焦點: threeStagePath[0]?.focus || "收斂與定位",
            行動: threeStagePath[0]?.action || "-"
          },
          第二階段: {
            期間: "31-90天",
            焦點: threeStagePath[1]?.focus || "穩定與擴展",
            行動: threeStagePath[1]?.action || "-"
          },
          第三階段: {
            期間: "91-365天",
            焦點: threeStagePath[2]?.focus || "整合與放大",
            行動: threeStagePath[2]?.action || "-"
          }
        },
        近期行動優先: {
          優先任務: nearTermPriority[0] || "-",
          節奏策略: nearTermPriority[1] || "-",
          關鍵補位: nearTermPriority[2] || "-"
        },
        長期願景: longTermVision,
        風險提醒: {
          風險一: blueprintRiskNote[0] || "-",
          風險二: blueprintRiskNote[1] || "-",
          風險三: blueprintRiskNote[2] || "-"
        }
      },
      tags: ["第六週", "方向"],
      risk_level: fearImpact >= 70 ? "high" : fearImpact >= 55 ? "medium" : "low",
      priority: 15
    },
    {
      panel_id: "decision_matrix",
      panel_title: "決策矩陣面板",
      core_question: "現在適不適合做？適不適合跟這個人做？",
      summary: `目前決策基準分數為 ${baseDecisionScore}（時間 ${timeSupportScore} × 關係 ${relationshipMatchScore} × 自身成熟 ${selfReadinessScore}）。`,
      interpretation: `你的決策關鍵在節奏與關係是否對齊。當關係數未連動或內在成熟度下降時，建議先做小規模測試再擴張。`,
      action_prompt: "先選一個方案做 7 天小測試，收集結果後再決定是否加碼投入。",
      data: {
        決策結論: {
          建議等級: decisionPrimaryRecommendation,
          執行提示: decisionExecutionHint,
          目前風險: baseDecisionScore < 55 ? "高" : baseDecisionScore < 70 ? "中" : "低"
        },
        決策公式: "決策優化分 = 時間支持度 × 關係匹配度 × 自身成熟度",
        三軸分數: {
          時間支持度: timeSupportScore,
          關係匹配度: relationshipMatchScore,
          自身成熟度: selfReadinessScore,
          決策優化分數: baseDecisionScore
        },
        關鍵脈絡: {
          決策類型: binaryOptionA.decision_type,
          時間脈絡: binaryOptionA.time_context,
          關係脈絡: binaryOptionA.relationship_context
        },
        方案排名_精簡: compactOptionRanking,
        首選方案理由: topOptionReason,
        主要風險提醒: binaryOptionA.risk_note
      },
      tags: ["第六週", "決策"],
      risk_level: baseDecisionScore < 55 ? "high" : baseDecisionScore < 70 ? "medium" : "low",
      priority: 16
    },
    {
      panel_id: "personal_summary_report",
      panel_title: "個人總結報告",
      core_question: "我的生命儀表板最終結論是什麼？",
      summary: "六週探索已收斂為可執行的人生導航藍圖，可直接作為下一階段行動基準。",
      interpretation: "這份報告整合了人格、優勢、價值、關係、卡點、時間與決策，不是一次性結論，而是可持續更新的導航系統。",
      action_prompt: "每 30 天回看一次報告，更新分數與行動里程碑。",
      data: {
        收斂結論: {
          生命主軸: missionSentence,
          目前定位: `${CORE_MODULE_MAP[mainSolarNum] || "核心模組"} × ${CORE_MODULE_MAP[mainLunarNum] || "次核心模組"}`,
          方向判讀: oneYearDirection
        },
        我是誰: {
          主命數_陽曆: solarMainPath,
          主命數_陰曆: lunarMainPath,
          核心模組: CORE_MODULE_MAP[mainSolarNum] || "未判定",
          思維傾向: thinkingTendency,
          行動傾向: actionTendency
        },
        我的優勢與場域: {
          三大優勢: topStrengths,
          角色定位: `${topRole}（次適配：${secondRole}）`,
          發光場域: shineDomain
        },
        我的當前卡點: {
          當下需求前三: needsPool.slice(0, 3).map((n) => n.label),
          關係模式: relationStyle,
          核心恐懼: mainFear,
          主要卡點: bottleneckType,
          鬆動方向: releaseDirection
        },
        下一步行動: {
          "7天行動": next7DayAction,
          "30天里程碑": next30DayMilestone
        },
        決策導航: {
          目前建議等級: decisionPrimaryRecommendation,
          首選方案: topDecisionOption ? `${topDecisionOption.option_name}（適配分 ${topDecisionOption.fit_score}）` : "待判讀",
          主要風險: topRisks
        }
      },
      tags: ["第六週", "報告"],
      risk_level: "low",
      priority: 18
    }
  ];
  return panels.map((panel) => {
    const filteredData = filterPanelDataByWhitelist(panel.panel_id, panel.data);
    const tpl = PANEL_NARRATIVE_TEMPLATES[panel.panel_id];
    if (!tpl) {
      return { ...panel, data: filteredData };
    }
    return {
      ...panel,
      data: filteredData,
      summary: tpl.summary(filteredData, panel),
      interpretation: tpl.interpretation(filteredData, panel),
      action_prompt: tpl.action_prompt(filteredData, panel)
    };
  });
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
  const themeStyles = colorClass === 'cyan'
    ? {
        frame: 'border-cyan-900/30',
        corner: 'border-cyan-500/50',
        chipGlowBg: 'bg-cyan-500/20',
        chipGlowBorder: 'border-cyan-500',
        chipFace: 'bg-cyan-900 text-white border-cyan-400',
        badgeBorder: 'border-cyan-500',
        badgeText: 'text-cyan-400',
        lineTag: 'border-cyan-500/30 bg-cyan-950/50 text-cyan-400'
      }
    : {
        frame: 'border-purple-900/30',
        corner: 'border-purple-500/50',
        chipGlowBg: 'bg-purple-500/20',
        chipGlowBorder: 'border-purple-500',
        chipFace: 'bg-purple-900 text-white border-purple-400',
        badgeBorder: 'border-purple-500',
        badgeText: 'text-purple-400',
        lineTag: 'border-purple-500/30 bg-purple-950/50 text-purple-400'
      };
  
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
      <div className={`absolute inset-0 border rounded-xl pointer-events-none ${themeStyles.frame}`}>
          <div className={`absolute top-0 left-0 w-3 h-3 border-t border-l rounded-tl ${themeStyles.corner}`}></div>
          <div className={`absolute top-0 right-0 w-3 h-3 border-t border-r rounded-tr ${themeStyles.corner}`}></div>
          <div className={`absolute bottom-0 left-0 w-3 h-3 border-b border-l rounded-bl ${themeStyles.corner}`}></div>
          <div className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r rounded-br ${themeStyles.corner}`}></div>
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
              {hasNum && (
                <div
                  className={`absolute inset-0 rounded-lg border ${themeStyles.chipGlowBg} ${themeStyles.chipGlowBorder}`}
                  style={{ boxShadow: `0 0 15px ${themeHex}` }}
                ></div>
              )}
              <div className={`w-10 h-10 rounded md:rounded-lg flex items-center justify-center font-mono text-xl font-bold z-10 relative overflow-hidden border ${hasNum ? themeStyles.chipFace : 'bg-slate-900 text-slate-700 border-slate-800'}`} title={`數字 ${num}${hasNum ? ` - 出現 ${count} 次` : ' - 空缺'}`}>{num}</div>
              {count > 1 && (<div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-950 border text-[10px] flex items-center justify-center font-bold z-20 shadow-lg ${themeStyles.badgeBorder} ${themeStyles.badgeText}`} title={`數字 ${num} 出現 ${count} 次`}>x{count}</div>)}
            </div>
          );
      })}
      
      <div className="absolute -bottom-6 w-full flex flex-wrap justify-center gap-2 pointer-events-none">
          {lines.map(line => (
              <span key={line.id} className={`text-[10px] px-2 py-0.5 rounded border ${themeStyles.lineTag}`} title={`${line.name} - 連線能量`}>{line.name}</span>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-shell flex flex-col items-center justify-center">
      <div className="w-full max-w-7xl modal-header shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center shrink-0">
            <Database className="text-cyan-400" size={24} title="生命軌跡資料庫" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-400/70">Overview</p>
            <h2 className="text-xl sm:text-2xl font-bold text-white">生命基礎軌跡</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-700">
            <button onClick={() => setActiveTab('timeline')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'timeline' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`} title="查看時間軌跡">時間軌跡</button>
            <button onClick={() => setActiveTab('matrix')} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'matrix' ? 'bg-purple-600 text-white' : 'text-slate-400'}`} title="查看靈魂晶片">靈魂晶片</button>
          </div>
          <button onClick={onClose} className="modal-close" title="關閉視窗"><X size={22} /></button>
        </div>
      </div>
      
      {loading ? <div className="glass-card rounded-3xl px-8 py-6 flex items-center gap-3 text-cyan-300"><Activity className="animate-spin" title="載入中" /><span className="text-sm">生命軌跡計算中...</span></div> : (
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
             <div className="flex w-full h-full flex-col md:flex-row items-stretch md:items-center justify-start md:justify-center gap-4 md:gap-10 overflow-y-auto md:overflow-visible pb-6">
                 <div className="relative w-full md:w-[340px] min-h-[450px] bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col items-center justify-center shrink-0">
                     <div className="absolute top-6 left-6 flex gap-2 text-cyan-400 font-bold text-lg md:text-xl"><Sun title="陽曆數字能量" /> 陽曆晶片</div>
                     <div className="w-full overflow-x-auto md:overflow-visible px-4 md:px-0">
                         <div className="min-w-[300px] flex justify-center mx-auto">
                             <SoulMatrix data={matrixData.solar} colorClass="cyan"/>
                         </div>
                     </div>
                 </div>
                 <div className="relative w-full md:w-[340px] min-h-[450px] bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col items-center justify-center shrink-0">
                     <div className="absolute top-6 left-6 flex gap-2 text-purple-400 font-bold text-lg md:text-xl"><Moon title="陰曆數字能量" /> 陰曆晶片</div>
                     <div className="w-full overflow-x-auto md:overflow-visible px-4 md:px-0">
                         <div className="min-w-[300px] flex justify-center mx-auto">
                             <SoulMatrix data={matrixData.lunar} colorClass="purple"/>
                         </div>
                     </div>
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-shell flex flex-col items-center justify-center">
            <div className="w-full max-w-4xl modal-header">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl border border-green-500/20 bg-green-500/10 flex items-center justify-center">
                        <Compass className="text-green-400" size={22} title="戰術導航系統" />
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.32em] text-green-400/70">Tactical</p>
                        <h2 className="text-xl sm:text-2xl font-bold text-white">流年戰術導航</h2>
                    </div>
                </div>
                <button onClick={onClose} className="modal-close" title="關閉視窗"><X size={20} /></button>
            </div>
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pb-10">
                <div className="bg-slate-900/50 border border-cyan-900/50 rounded-xl p-6 relative overflow-hidden">
                    <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2"><Sun size={27} title="陽曆外在能量" /> 陽曆 (外在顯化)</h3>
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between bg-black/40 p-3 rounded-lg border border-slate-800" title="本年度陽曆流年"><span className="text-slate-400 text-xs">流年</span><div className="text-2xl font-bold text-white">{formatRawNum(data.solar)}</div></div>
                        <div className="flex justify-between bg-black/40 p-3 rounded-lg border border-slate-800" title="本月份陽曆流月"><span className="text-slate-400 text-xs">流月</span><div className="text-2xl font-bold text-white">{formatRawNum(data.solarMonth)}</div></div>
                        <div className="flex justify-between bg-cyan-950/30 p-3 rounded-lg border border-cyan-500/50" title="今天的陽曆流日能量"><span className="text-cyan-300 text-xs font-bold flex items-center gap-1"><Flame size={12} title="今日能量高峰" /> 今日流日</span><div className="text-3xl font-bold text-white animate-pulse">{formatRawNum(data.solarDay)}</div></div>
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-purple-900/50 rounded-xl p-6 relative overflow-hidden">
                    <h3 className="text-purple-400 font-bold mb-4 flex items-center gap-2"><Moon size={27} title="陰曆內在能量" /> 陰曆 (內在潛影)</h3>
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
const ResonanceModal = ({ isOpen, onClose, myData, history, onCalculate, partner, setPartner }) => {
    if (!isOpen) return null;
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-shell flex flex-col items-center justify-center">
            <div className="w-full max-w-5xl modal-header shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 flex items-center justify-center">
                        <Waves className="text-fuchsia-400" size={22} title="能量共振分析系統" />
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.32em] text-fuchsia-400/70">Resonance</p>
                        <h2 className="text-xl sm:text-2xl font-bold text-white">能量共振實驗室 v10.9</h2>
                    </div>
                </div>
                <button onClick={onClose} className="modal-close" title="關閉視窗"><X size={20} /></button>
            </div>
            
            <div className="w-full max-w-5xl h-full flex flex-col md:flex-row gap-4 items-stretch overflow-y-auto md:overflow-hidden pb-4">
                <div className="w-full overflow-x-auto md:overflow-visible">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center w-full md:w-1/4 min-w-[280px] md:min-w-0 shrink-0 mx-auto">
                        <div className="text-xs text-slate-500 mb-4">{myData.name || 'My'} Energy</div>
                        <div className="text-4xl font-bold text-cyan-400 font-mono mb-2" title="我的陽曆主命數">{formatRawNum(myData.mainSolar)}</div>
                        <div className="text-2xl font-bold text-purple-400 font-mono mb-6" title="我的陰曆主命數">{formatRawNum(myData.mainLunar)}</div>
                        <div className="opacity-50"><User size={64} className="text-slate-600" title="我的能量" /></div>
                    </div>
                </div>
                
                <div className="w-full overflow-x-auto md:overflow-visible">
                    <div className="flex-1 flex items-center justify-center relative min-w-[320px] md:min-w-0 min-h-[320px] mx-auto">
                        {!partner ? (
                            <div className="text-center animate-pulse text-slate-500 z-10">
                                <Users size={32} className="mx-auto mb-2" title="等待選擇共振對象" />
                                <p className="text-sm">請在右側選擇共振對象...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 grid-rows-3 gap-4 w-full max-w-md aspect-square relative z-10 p-4 min-w-[320px]">
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
                </div>

                <div className="w-full overflow-x-auto md:overflow-visible">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col items-center relative w-full md:w-1/4 min-w-[280px] md:min-w-0 shrink-0 mx-auto">
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
            </div>
        </motion.div>
    );
};

const SixWeekCurriculumModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [curriculum, setCurriculum] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/data/six_week_curriculum.json')
      .then((res) => res.json())
      .then((json) => setCurriculum(json))
      .catch((err) => {
        console.error('課程檔載入失敗', err);
        setCurriculum(null);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-shell overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center">
              <GitCommit size={20} className="text-cyan-300" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-cyan-300">六週課程地圖</h2>
              <p className="text-xs text-slate-400 mt-1">12 主題，於第六週整合收攏</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close" title="關閉視窗"><X size={20} /></button>
        </div>

        {loading && <div className="glass-card rounded-3xl px-8 py-6 inline-flex items-center gap-3 text-cyan-300"><Activity className="animate-spin" title="載入中" /><span className="text-sm">課程資料整理中...</span></div>}

        {!loading && curriculum && (
          <div className="space-y-4 pb-8">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="text-sm text-slate-300">{curriculum.program_name}</div>
              <div className="text-xs text-slate-500 mt-1">共 {curriculum.duration_weeks} 週 / {curriculum.topics_total} 主題</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(curriculum.program_goals || []).map((goal, idx) => (
                  <span key={idx} className="text-xs px-2 py-1 rounded border border-cyan-700/40 bg-cyan-900/20 text-cyan-200">{goal}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(curriculum.weeks || []).map((week) => (
                <article key={week.week} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-white">第 {week.week} 週｜{week.theme}</h3>
                    <span className="text-[10px] text-slate-400 border border-slate-700 px-2 py-0.5 rounded">2 主題</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">
                    {(week.topics || []).map((t, i) => <div key={i}>主題 {week.week * 2 - 1 + i}：{t}</div>)}
                  </div>
                  <div className="mb-2">
                    <div className="text-[11px] text-slate-500 mb-1">對應面板</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(week.panel_mapping || []).map((p) => (
                        <span key={p} className="text-[10px] px-2 py-0.5 rounded border border-purple-700/40 bg-purple-900/20 text-purple-200">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-300 leading-relaxed mb-2">{week.weekly_closure}</div>
                  <div className="text-[11px] text-cyan-200">
                    產出：{(week.outputs || []).join("、")}
                  </div>
                </article>
              ))}
            </div>

            <div className="bg-slate-900/60 border border-amber-700/30 rounded-xl p-4 text-sm text-amber-100">
              {curriculum.final_summary_line}
            </div>
          </div>
        )}
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
  const [loadError, setLoadError] = useState("");
  const [showInputModal, setShowInputModal] = useState(true);
  const [userName, setUserName] = useState("");
  const [birthdayInput, setBirthdayInput] = useState({ year: 1990, month: 1, day: 1 });
  const [history, setHistory] = useState([]);
  
  const [showOverview, setShowOverview] = useState(false);
  const [showTactical, setShowTactical] = useState(false);
  const [showResonance, setShowResonance] = useState(false);
  const [resonancePartner, setResonancePartner] = useState(null);
  const [showCurriculum, setShowCurriculum] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  const [showFlowAudit, setShowFlowAudit] = useState(false);
  const [expandedPanels, setExpandedPanels] = useState({});

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

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const requestCalculateWithRetry = async (payload, options = {}) => {
    const retries = options.retries ?? 4;
    const timeoutMs = options.timeoutMs ?? 90000;
    const retryDelays = [1500, 3000, 5000, 8000];
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(`${API_BASE}/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`後端回應錯誤 (${res.status})`);
        return await res.json();
      } catch (error) {
        clearTimeout(timer);
        lastError = error;
        if (attempt < retries) {
          await sleep(retryDelays[Math.min(attempt, retryDelays.length - 1)]);
          continue;
        }
      }
    }
    throw lastError || new Error("計算請求失敗");
  };

  const calculateForPartner = async (bday) => {
      return await requestCalculateWithRetry(
        { year: bday.year, month: bday.month, day: bday.day, targetYear: year },
        { retries: 4, timeoutMs: 90000 }
      );
  };

  const fetchData = async () => {
    setLoading(true);
    setLoadError("");
    setIsWaking(false);
    const wakingTimer = setTimeout(() => setIsWaking(true), 3000);
    try {
      const result = await calculateForPartner(birthdayInput);
      const corrected = correctFlowSoulLevels(result, birthdayInput, year);
      setData({...corrected, name: userName});
    } catch (error) {
      console.error("連線失敗", error);
      setLoadError("啟動計算失敗：後端喚醒中或連線不穩，請稍後重試。");
    } finally {
      clearTimeout(wakingTimer);
      setLoading(false);
      setIsWaking(false);
    }
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

  const relationContext = resonancePartner ? (() => {
    const pp = calcRelationNum(data.mainSolarNum, resonancePartner.mainSolarNum);
    const pm = calcRelationNum(data.mainSolarNum, resonancePartner.mainLunarNum);
    const mp = calcRelationNum(data.mainLunarNum, resonancePartner.mainSolarNum);
    const mm = calcRelationNum(data.mainLunarNum, resonancePartner.mainLunarNum);
    const primaryNum = Number(pp) || 0;
    return {
      partnerName: resonancePartner.name,
      primaryNum,
      primaryCategory: getRelationCategory(primaryNum),
      pairs: {
        "++": { num: pp, category: getRelationCategory(Number(pp) || 0) },
        "+-": { num: pm, category: getRelationCategory(Number(pm) || 0) },
        "-+": { num: mp, category: getRelationCategory(Number(mp) || 0) },
        "--": { num: mm, category: getRelationCategory(Number(mm) || 0) }
      }
    };
  })() : null;

  const firstBatchPanels = buildFirstBatchPanels(data, {
    birthYear: birthdayInput.year,
    targetYear: year,
    relationContext
  });
  const togglePanel = (panelId) => {
    setExpandedPanels((prev) => ({ ...prev, [panelId]: !prev[panelId] }));
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-200 font-sans overflow-x-hidden">
      
      <AnimatePresence>
        {showInputModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050B14]/80 px-4 py-8 backdrop-blur-md"
          >
            <div className="glass-card w-full max-w-lg rounded-[28px] p-6 sm:p-8">
              <div className="text-center mb-6">
                <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-400/70 mb-2">Soul Dashboard</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">靈魂藍圖掃描</h2>
                <p className="text-sm text-slate-400 mt-2">輸入基本資料後，系統會建立你的主命數、流年與生命藍圖。</p>
              </div>

              <div className="space-y-4 mb-6">
                <label className="block">
                  <span className="block text-xs font-semibold tracking-[0.2em] text-slate-400 mb-2">姓名</span>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="輸入姓名或暱稱"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-center text-white placeholder:text-slate-600"
                    title="輸入使用者姓名"
                  />
                </label>

                <div>
                  <span className="block text-xs font-semibold tracking-[0.2em] text-slate-400 mb-2">生日</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="number"
                      value={birthdayInput.year}
                      onChange={(e) => setBirthdayInput({ ...birthdayInput, year: parseInt(e.target.value) })}
                      className="rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-center text-white"
                      title="出生年份"
                    />
                    <input
                      type="number"
                      value={birthdayInput.month}
                      onChange={(e) => setBirthdayInput({ ...birthdayInput, month: parseInt(e.target.value) })}
                      className="rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-center text-white"
                      title="出生月份"
                    />
                    <input
                      type="number"
                      value={birthdayInput.day}
                      onChange={(e) => setBirthdayInput({ ...birthdayInput, day: parseInt(e.target.value) })}
                      className="rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-center text-white"
                      title="出生日期"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartScan}
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-cyan-900/30 transition hover:-translate-y-0.5 hover:shadow-cyan-500/20"
                title="開始分析命盤"
              >
                啟動分析
              </button>

              <div className="mt-5 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3">
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
                  <div>
                    <p className="text-sm font-semibold text-white">最近使用紀錄</p>
                    <p className="text-xs text-slate-500">點一下即可快速帶入資料</p>
                  </div>
                  <span className="text-[11px] text-slate-500">{history.length} 筆</span>
                </div>
                <div className="mt-2 h-36 overflow-y-auto custom-scrollbar pr-1">
                  {history.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">目前還沒有歷史紀錄</div>
                  ) : (
                    history.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => { setUserName(h.name); setBirthdayInput(h.birthday); }}
                        className="w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-800/80"
                        title={`載入 ${h.name} 的資料`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-slate-200 truncate">{h.name}</span>
                          <span className="text-xs text-slate-500 shrink-0">{h.dateStr}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{showOverview && <LifeCycleView isOpen={showOverview} onClose={() => setShowOverview(false)} birthday={birthdayInput} mainSolar={data.mainSolar} matrixData={data.matrixData} />}</AnimatePresence>
      <AnimatePresence>{showTactical && <TacticalModal isOpen={showTactical} onClose={() => setShowTactical(false)} data={data} />}</AnimatePresence>
      <AnimatePresence>{showResonance && <ResonanceModal isOpen={showResonance} onClose={() => setShowResonance(false)} myData={data} history={history} onCalculate={calculateForPartner} partner={resonancePartner} setPartner={setResonancePartner} />}</AnimatePresence>
      <AnimatePresence>{showCurriculum && <SixWeekCurriculumModal isOpen={showCurriculum} onClose={() => setShowCurriculum(false)} />}</AnimatePresence>

      <nav className="fixed top-0 w-full z-50 border-b border-slate-800/80 bg-[#050B14]/78 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300 shrink-0">
                <LayoutDashboard size={20} title="靈魂導航儀主頁" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-400/70">Soul GPS</p>
                <span className="block font-bold tracking-wide text-sm sm:text-base text-slate-100 truncate">
                  {userName ? `${userName} 的靈魂導航儀` : '全息靈魂導航儀 v10.9'}
                </span>
              </div>
            </div>
            <button onClick={() => setShowInputModal(true)} className="icon-action lg:hidden" title="設定 - 切換使用者或修改資料"><Settings size={18} /></button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end lg:flex-1">
            <div className="flex items-center justify-center gap-4 rounded-full border border-slate-700/60 bg-slate-900/65 px-5 py-2.5 shadow-lg shadow-slate-950/20">
              <button onClick={() => setYear(y => y - 1)} className="text-slate-300 hover:text-white transition" title="上一年"><ChevronLeft size={20} /></button>
              <span className="text-xl sm:text-2xl font-mono font-bold text-white flex items-center gap-2">
                {year}
                {loading && <Activity size={14} className="animate-spin text-cyan-500" title="計算中" />}
              </span>
              <button onClick={() => setYear(y => y + 1)} className="text-slate-300 hover:text-white transition" title="下一年"><ChevronRight size={20} /></button>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
              <button onClick={() => setShowTactical(true)} className="icon-action hover:bg-green-900/40 hover:text-green-300" title="流年戰術 - 查看流年、流月、流日"><Compass size={18} /></button>
              <button onClick={() => setShowResonance(true)} className="icon-action hover:bg-pink-900/40 hover:text-pink-300" title="能量共振 - 與他人進行能量分析"><Waves size={18} /></button>
              <button onClick={() => setShowCurriculum(true)} className="icon-action hover:bg-indigo-900/40 hover:text-indigo-300" title="六週課程地圖"><GitCommit size={18} /></button>
              <button onClick={() => setShowFlowAudit(v => !v)} className={`icon-action ${showFlowAudit ? "bg-cyan-900/50 border-cyan-500/30 text-cyan-300" : "hover:bg-cyan-900/40 hover:text-cyan-300"}`} title="驗算模式 - 顯示/隱藏流年驗算資訊"><Cpu size={18} /></button>
              <button onClick={handleSnapshot} className="icon-action hover:bg-cyan-900/40 hover:text-cyan-300" title="截圖 - 儲存當前畫面"><Camera size={18} /></button>
              <button onClick={() => setShowInputModal(true)} className="icon-action hidden lg:inline-flex hover:bg-slate-700/80 hover:text-white" title="設定 - 切換使用者或修改資料"><Settings size={18} /></button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isWaking && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-0 w-full z-40 flex justify-center px-4 pt-2"
          >
            <div className="flex items-center gap-3 bg-slate-900/95 border border-amber-500/50 text-amber-300 text-sm px-5 py-2.5 rounded-full shadow-lg shadow-amber-900/20 backdrop-blur-sm">
              <Activity size={14} className="animate-spin text-amber-400 shrink-0" />
              <span>後端伺服器喚醒中，請稍候約 30～60 秒...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!!loadError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-16 left-0 w-full z-40 flex justify-center px-4 pt-2"
          >
            <div className="flex items-center gap-3 bg-red-950/90 border border-red-500/40 text-red-200 text-sm px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm">
              <span>{loadError}</span>
              <button onClick={fetchData} className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-xs">重新計算</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主畫面 */}
      <main className={`pt-[9.5rem] lg:pt-28 pb-10 px-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.9fr)_minmax(0,1.05fr)] gap-5 lg:gap-6 transition-opacity duration-700 ${showInputModal ? 'opacity-0 filter blur-sm' : 'opacity-100 filter blur-0'}`}>
        {/* 左 */}
        <motion.div className="glass-card rounded-[28px] p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-20"></div>
          <div>
            <div className="flex items-center gap-3 mb-6 text-cyan-300"><Sun size={32} title="陽性能量 - 外在顯化" /><div><h2 className="text-lg font-bold tracking-wide text-white">陽性・顯化</h2><p className="text-xs text-slate-500">外在行動、成果與顯化節奏</p></div></div>
            <div className="surface-card p-4 rounded-2xl relative overflow-hidden mb-3">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-3"><p className="text-slate-400 text-xs uppercase tracking-[0.25em]">外在顯化週期</p><div className="flex items-center gap-1.5 bg-cyan-950/50 px-2 py-1 rounded-full border border-cyan-500/30"><Atom size={14} className="text-cyan-400 animate-pulse" title="流年靈魂等級（1-7）" /><span className="text-sm font-bold text-cyan-300">{data.flowSolarLv}</span></div></div>
              <div className="flex flex-wrap justify-between items-end gap-3"><div className="flex items-center"><span className="text-3xl sm:text-4xl font-bold text-white">{formatRawNum(data.solar)}</span><FlowTriangle flowValue={data.solar} mainValue={data.mainSolar} colorClass="cyan" scale={0.75} /></div><span className="text-cyan-300 text-xs font-bold tracking-[0.25em] px-2.5 py-1 bg-cyan-950/30 rounded-full border border-cyan-500/30 whitespace-nowrap">{data.solarKw}</span></div>
              {showFlowAudit && data.flowAuditSolar && (
                <div className="mt-2 text-[10px] leading-4 text-cyan-200/80 font-mono break-words border border-cyan-900/40 bg-cyan-950/20 rounded p-2">
                  驗算 flow:{data.flowAuditSolar.flow_path} | birth:{data.flowAuditSolar.birth_code} | total:{data.flowAuditSolar.total} | main:{data.flowAuditSolar.main} | ant:{data.flowAuditSolar.ant1}/{data.flowAuditSolar.ant2} | hits:{data.flowAuditSolar.ant_hits} | mainIn:{data.flowAuditSolar.main_in_birth} | triple:{data.flowAuditSolar.has_triple} | lv:{data.flowAuditSolar.level}
                </div>
              )}
            </div>
          </div>
          <div className="min-h-[26rem] w-full relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <p className="text-xs text-slate-500 absolute top-0 left-0 z-10">外在顯化光輪</p>
            <div className="w-full sm:w-2/3 h-64 sm:h-full relative flex items-center justify-center pt-6 sm:pt-0"><div className="absolute w-36 h-36 rounded-full border border-cyan-900/30 animate-spin-slow pointer-events-none"></div><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.solarWheel} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={3} dataKey="angleValue" strokeWidth={2}>{data.solarWheel.map((entry, index) => {
                    const fill  = entry.hasFlowBuff ? '#22d3ee' : entry.fill;
                    const stroke = entry.hasFlowBuff ? '#e0f2fe' : entry.stroke;
                    const glow  = entry.hasFlowBuff
                      ? 'drop-shadow(0 0 18px #22d3ee) drop-shadow(0 0 8px rgba(255,255,255,0.6))'
                      : `drop-shadow(0 0 ${entry.intensity === 'high' ? '6px' : '1px'} ${entry.fill})`;
                    const opacity = entry.hasFlowBuff ? 1 : (entry.intensity === 'high' ? 0.85 : entry.intensity === 'mid' ? 0.55 : 0.3);
                    return <Cell key={`cell-${index}`} fill={fill} stroke={stroke} opacity={opacity} style={{ filter: glow, transition: 'all 0.8s ease' }} />;
                  })}</Pie><RechartsTooltip content={<CustomTooltip />} /></PieChart></ResponsiveContainer><div className="absolute text-center pointer-events-none"><div className="text-[10px] text-cyan-500/50">陽性</div><div className="text-[8px] text-slate-600">核心</div></div></div>
            <div className="w-full sm:w-1/3 flex items-center"><ul className="w-full space-y-2 text-[12px] sm:text-[13px] text-slate-300">{data.solarWheel.map((item, i) => (<li key={i} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800/70 bg-slate-950/25 px-3 py-2"><div className="flex items-center gap-2 min-w-0"><span className="w-2 h-2 rounded-full transition-all duration-700 shrink-0" style={{backgroundColor: item.hasFlowBuff ? '#22d3ee' : item.fill, boxShadow: item.hasFlowBuff ? '0 0 8px #22d3ee, 0 0 3px #fff' : `0 0 3px ${item.fill}`, opacity: item.hasFlowBuff ? 1 : (item.intensity === 'high' ? 0.85 : item.intensity === 'mid' ? 0.55 : 0.3)}} title={`${item.name} - 能量分數: ${item.score}`}></span><span className="truncate">{item.name}</span></div>{item.hasFlowBuff && (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-orange-500 flex items-center gap-1 shrink-0" title="流年加持中 - 該領域受到流年能量加持"><Flame size={12} className="fill-orange-500 animate-pulse" /></motion.div>)}</li>))}</ul></div>
          </div>
        </motion.div>

        {/* 中 */}
        <div className="relative flex flex-col items-center justify-center py-4 sm:py-8">
          <div className="absolute inset-0 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none"></div>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute w-[360px] h-[360px] sm:w-[500px] sm:h-[500px] border border-slate-800/50 rounded-full border-dashed pointer-events-none"></motion.div>
          <motion.div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 w-full">
            <div className="glass-card w-full max-w-[320px] rounded-2xl p-3 backdrop-blur-md flex flex-col items-center gap-2 shadow-lg shadow-cyan-900/10 mb-2">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1 border-b border-slate-700/50 w-full justify-center pb-1"><Calendar size={12} title="出生日期資訊" /> 生日資訊</div>
                <div className="w-full grid grid-cols-[40px_1fr] gap-2 px-2 items-center"><span className="text-[10px] text-cyan-500/70 text-left">陽曆</span><span className="text-sm font-bold text-white font-mono text-right" title="陽曆出生日期">{cleanDateStr(data.solarDateStr)}</span></div>
                <div className="w-full grid grid-cols-[40px_1fr] gap-2 px-2 items-center"><span className="text-[10px] text-purple-500/70 text-left">陰曆</span><span className="text-sm font-bold text-slate-300 font-mono text-right" title="陰曆出生日期">{cleanDateStr(data.lunarDateStr)}</span></div>
            </div>
            <div className="relative group cursor-pointer" onClick={() => setShowInputModal(true)}>
              <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-xl group-hover:opacity-100 transition-opacity duration-500 opacity-60"></div>
              <div className="w-56 h-56 sm:w-60 sm:h-60 bg-[#050B14] border-2 border-slate-700 rounded-full flex flex-col items-center justify-center relative shadow-2xl shadow-cyan-900/20 px-4" title="點擊修改使用者資料">
                <div className="text-xs text-slate-500 tracking-widest mb-4">主命數</div>
                <div className="flex items-center justify-between w-full px-4 mb-2"><span className="text-3xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" title="陽曆主命數">{formatRawNum(data.mainSolar)}</span><motion.div className="flex items-center gap-1" animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}><Atom size={18} className="text-cyan-500/80" title="陽曆靈魂等級" /><span className="text-xl font-bold text-cyan-300">{data.mainSolarLv}</span></motion.div></div>
                <div className="w-full h-[1px] bg-slate-800 my-3"></div>
                <div className="flex items-center justify-between w-full px-4 mt-2"><span className="text-3xl font-bold text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]" title="陰曆主命數">{formatRawNum(data.mainLunar)}</span><motion.div className="flex items-center gap-1" animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}><Atom size={18} className="text-purple-500/80" title="陰曆靈魂等級" /><span className="text-xl font-bold text-purple-300">{data.mainLunarLv}</span></motion.div></div>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full px-2 sm:px-4">
              <button onClick={() => setShowOverview(true)} className="w-full px-6 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.18)] text-white rounded-2xl text-sm tracking-[0.2em] transition-all flex items-center justify-center gap-2 group" title="開啟全息總覽 - 查看生命軌跡與靈魂晶片"><Grid size={16} className="text-cyan-400 group-hover:text-white transition" />開啟全息總覽</button>
              <button onClick={() => setShowInputModal(true)} className="w-full px-6 py-3 border border-slate-800 hover:border-slate-600 hover:bg-slate-900/50 text-slate-400 hover:text-white rounded-2xl text-xs tracking-[0.18em] transition-all flex items-center justify-center gap-2" title="切換使用者或重新輸入生日資料"><ScanFace size={14} />切換使用者 / 重新掃描</button>
            </div>
          </motion.div>
        </div>

        {/* 右 */}
        <motion.div className="glass-card rounded-[28px] p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-20"></div>
          <div>
            <div className="flex items-center gap-3 mb-6 text-purple-300"><Moon size={32} title="陰性能量 - 內在潛影" /><div><h2 className="text-lg font-bold tracking-wide text-white">陰性・潛影</h2><p className="text-xs text-slate-500">內在情緒、感受與靈魂節奏</p></div></div>
            <div className="surface-card p-4 rounded-2xl relative overflow-hidden mb-4">
               <div className="flex flex-wrap justify-between items-center gap-3 mb-3"><p className="text-slate-400 text-xs uppercase tracking-[0.25em]">內在情感潮汐</p><div className="flex items-center gap-1.5 bg-purple-950/50 px-2 py-1 rounded-full border border-purple-500/30"><Atom size={14} className="text-purple-400 animate-pulse" title="流年靈魂等級（1-7）" /><span className="text-sm font-bold text-purple-300">{data.flowLunarLv}</span></div></div>
              <div className="flex flex-wrap justify-between items-end gap-3"><div className="flex items-center"><span className="text-3xl sm:text-4xl font-bold text-white">{formatRawNum(data.lunar)}</span><FlowTriangle flowValue={data.lunar} mainValue={data.mainLunar} colorClass="purple" scale={0.75} /></div><span className="text-purple-300 text-xs font-bold tracking-[0.25em] px-2.5 py-1 bg-purple-950/30 rounded-full border border-purple-500/30 whitespace-nowrap">{data.lunarKw}</span></div>
              {showFlowAudit && data.flowAuditLunar && (
                <div className="mt-2 text-[10px] leading-4 text-purple-200/80 font-mono break-words border border-purple-900/40 bg-purple-950/20 rounded p-2">
                  驗算 flow:{data.flowAuditLunar.flow_path} | birth:{data.flowAuditLunar.birth_code} | total:{data.flowAuditLunar.total} | main:{data.flowAuditLunar.main} | ant:{data.flowAuditLunar.ant1}/{data.flowAuditLunar.ant2} | hits:{data.flowAuditLunar.ant_hits} | mainIn:{data.flowAuditLunar.main_in_birth} | triple:{data.flowAuditLunar.has_triple} | lv:{data.flowAuditLunar.level}
                </div>
              )}
            </div>
          </div>
          <div className="min-h-[24rem] w-full flex flex-col justify-end">
             <p className="text-xs text-slate-500 mb-2">內在靈魂矩陣</p>
             {(() => {
               const radarData = data.lunarRadar.map(item => ({
                 ...item,
                  flowLayer: item.hasFlowBuff ? Math.min((item.A || 0) + 28, 100) : 0,
                }));
               const CustomTick = ({ payload, x, y, textAnchor }) => {
                 const item = radarData.find(d => d.subject === payload?.value);
                 return (
                   <text x={x} y={y} textAnchor={textAnchor} fill={item?.hasFlowBuff ? '#fb923c' : '#c084fc'} fontSize={Math.round(11 * CHART_FONT_SCALE)} fontWeight="bold" style={{ transition: 'fill 0.8s ease' }}>
                     {payload?.value}
                   </text>
                 );
               };
               return (
                 <ResponsiveContainer width="100%" height={320}>
                   <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                     <PolarGrid stroke="#334155" />
                     <PolarAngleAxis dataKey="subject" tick={<CustomTick />} />
                     <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                     <Radar name="基礎" dataKey="A" stroke="#a855f7" strokeWidth={2} fill="#a855f7" fillOpacity={0.3} />
                     <Radar name="流年加持" dataKey="flowLayer" stroke="#f97316" strokeWidth={1.5} strokeDasharray="5 3" fill="#f97316" fillOpacity={0.25} />
                     <RechartsTooltip content={<CustomTooltip />} />
                   </RadarChart>
                 </ResponsiveContainer>
               );
             })()}
          </div>
        </motion.div>

      </main>

      <section className="px-4 pb-14 max-w-7xl mx-auto">
        <div className="glass-card rounded-[28px] p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold text-cyan-200">生命藍圖資料庫</h2>
              <p className="text-sm text-slate-400 mt-1">把核心人格、關係模式、時間節奏與決策建議整理成可展開卡片。</p>
            </div>
            <span className="text-sm text-slate-500">點擊面板名稱可展開完整內容</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {firstBatchPanels.map((panel) => {
              const isExpanded = !!expandedPanels[panel.panel_id];
              return (
                <article key={panel.panel_id} className="surface-card rounded-2xl p-4 transition duration-200 hover:-translate-y-1 hover:border-slate-700 hover:shadow-[0_18px_45px_rgba(2,6,23,0.28)]">
                  <button
                    type="button"
                    onClick={() => togglePanel(panel.panel_id)}
                    className="w-full flex items-center justify-between gap-3 text-left"
                    title={isExpanded ? "收合面板" : "展開面板"}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronRight
                        size={14}
                        className={`text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      />
                      <h3 className="text-sm font-bold text-white truncate">{panel.panel_title}</h3>
                    </div>
                    <span className={`text-[10px] uppercase tracking-[0.22em] px-2.5 py-1 rounded-full border shrink-0 ${
                      panel.risk_level === "high"
                        ? "text-red-300 border-red-700/40 bg-red-900/20"
                        : panel.risk_level === "medium"
                          ? "text-amber-300 border-amber-700/40 bg-amber-900/20"
                          : "text-emerald-300 border-emerald-700/40 bg-emerald-900/20"
                    }`}>
                      {panel.risk_level}
                    </span>
                  </button>
                  {isExpanded && (
                    <>
                      <p className="text-[13px] text-slate-400 mt-3 mb-3 leading-relaxed">{panel.core_question}</p>
                      <div className="mt-3 space-y-2">
                        {flattenPanelData(panel.data).map((item, idx) => (
                          <div key={`${panel.panel_id}-${item.key}-${idx}`} className="grid grid-cols-1 sm:grid-cols-[132px_1fr] gap-1 sm:gap-3 text-[13px] rounded-xl border border-slate-800/70 bg-slate-950/35 px-3 py-2.5">
                            <span className="text-slate-500">{item.key}</span>
                            <span className="text-slate-200 break-words leading-relaxed">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
