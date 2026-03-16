/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BookOpen, 
  Target, 
  MessageSquare, 
  Settings, 
  CheckCircle2,
  Star,
  Award,
  BarChart3,
  LayoutDashboard,
  Upload,
  User,
  Search,
  FileSpreadsheet,
  X,
  CheckSquare,
  Square,
  Zap,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LabelList,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { ReportData, ComparisonResult, StudentData, ClassBenchmark, AggregatedUnitData, RawExcelRow } from './types';
import { 
  DEFAULT_REPORT_DATA, 
  calculateComparison, 
  getBadgeInfo, 
  getMilestones 
} from './constants';
import { processExcelFile } from './excelUtils';

// --- Components ---

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle?: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
      <Icon size={24} />
    </div>
    <div>
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
  </div>
);

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 ${className}`}
  >
    {children}
  </motion.div>
);

const ConfigModal = ({ 
  isOpen, 
  onClose, 
  data, 
  onUpdate, 
  onPhaseUpdate, 
  availableUnits,
  excelData,
  selectedStudent
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  data: ReportData, 
  onUpdate: (d: Partial<ReportData>) => void,
  onPhaseUpdate: (phase: 'firstPhase' | 'secondPhase', units: number[]) => void,
  availableUnits: number[],
  excelData: any,
  selectedStudent: string
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">课程元数据设置</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Metadata Configuration</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-8 overflow-y-auto space-y-8">
          {/* Unit Selection */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <BookOpen size={18} />
                <span className="text-sm font-bold">第一阶段单元范围</span>
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-100">
                {availableUnits.map(unit => (
                  <button
                    key={`p1-${unit}`}
                    onClick={() => {
                      const current = data.firstPhase.units;
                      const next = current.includes(unit) 
                        ? current.filter(u => u !== unit)
                        : [...current, unit].sort((a, b) => a - b);
                      onPhaseUpdate('firstPhase', next);
                    }}
                    className={`flex items-center justify-center p-2 rounded-lg text-xs font-bold transition-all ${
                      data.firstPhase.units.includes(unit)
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white text-slate-400 border border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <BookOpen size={18} />
                <span className="text-sm font-bold">第二阶段单元范围</span>
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-100">
                {availableUnits.map(unit => (
                  <button
                    key={`p2-${unit}`}
                    onClick={() => {
                      const current = data.secondPhase.units;
                      const next = current.includes(unit) 
                        ? current.filter(u => u !== unit)
                        : [...current, unit].sort((a, b) => a - b);
                      onPhaseUpdate('secondPhase', next);
                    }}
                    className={`flex items-center justify-center p-2 rounded-lg text-xs font-bold transition-all ${
                      data.secondPhase.units.includes(unit)
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white text-slate-400 border border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Metadata Text Areas - Now in a single row */}
          <div className="flex items-center justify-between mt-8 mb-4">
            <h3 className="text-sm font-bold text-slate-800">元数据文本配置</h3>
            <button
              onClick={() => {
                const totalUnits = data.firstPhase.units.length + data.secondPhase.units.length;
                const generateRandomNumbers = () => Array.from({ length: totalUnits }, () => Math.floor(Math.random() * 10) + 1).join('\n');
                onUpdate({
                  knowledgePointsText: generateRandomNumbers(),
                  errorPointsText: generateRandomNumbers()
                });
              }}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
              title="根据当前选择的单元总数，随机生成1-10之间的数字"
            >
              <Zap size={14} />
              随机生成里程碑数据
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-500">
                <BookOpen size={18} />
                <span className="text-xs font-bold">第一阶段单元内容</span>
              </div>
              <textarea 
                value={data.masteredUnitsText}
                onChange={(e) => onUpdate({ masteredUnitsText: e.target.value })}
                className="w-full h-32 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="第1单元&#10;第2单元&#10;..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-rose-500">
                <Zap size={18} />
                <span className="text-xs font-bold">第二阶段单元内容</span>
              </div>
              <textarea 
                value={data.newUnitsText}
                onChange={(e) => onUpdate({ newUnitsText: e.target.value })}
                className="w-full h-32 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                placeholder="高频易错&#10;思维拓展&#10;..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-500">
                <Target size={18} />
                <span className="text-xs font-bold">知识点总数 (里程碑)</span>
              </div>
              <textarea 
                value={data.knowledgePointsText}
                onChange={(e) => onUpdate({ knowledgePointsText: e.target.value })}
                className="w-full h-32 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="12&#10;15&#10;..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertCircle size={18} />
                <span className="text-xs font-bold">易错点总数 (里程碑)</span>
              </div>
              <textarea 
                value={data.errorPointsText}
                onChange={(e) => onUpdate({ errorPointsText: e.target.value })}
                className="w-full h-32 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                placeholder="3&#10;5&#10;..."
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-4 bg-slate-50/50">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-slate-500 font-bold hover:text-slate-700 transition-colors"
          >
            取消修改
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <CheckSquare size={18} />
            保存配置
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [data, setData] = useState<ReportData>(DEFAULT_REPORT_DATA);
  const [isEditing, setIsEditing] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStudentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [excelData, setExcelData] = useState<{ 
    students: Record<string, StudentData>, 
    benchmarks: Record<number, ClassBenchmark>,
    rawRows: RawExcelRow[]
  } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [showRegressionComments, setShowRegressionComments] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived data
  const comparisonResults = useMemo(() => calculateComparison(data.firstPhase, data.secondPhase), [data]);
  const badgeInfo = useMemo(() => getBadgeInfo(comparisonResults), [comparisonResults]);
  const milestones = useMemo(() => 
    getMilestones(comparisonResults, data.studentName, showRegressionComments), 
    [comparisonResults, data.studentName, showRegressionComments]
  );

  const cumulativeStats = useMemo(() => {
    let totalTime = 0;
    
    if (excelData && selectedStudent) {
      const student = excelData.students[selectedStudent];
      const units = Object.values(student.units) as AggregatedUnitData[];
      // Sum of all first_cost_seconds (totalTimeSpent) in minutes
      totalTime = Math.round(units.reduce((sum, u) => sum + u.totalTimeSpent, 0) / 60);
    } else {
      // Fallback calculation based on current phase data
      totalTime = Math.round(data.firstPhase.avgDuration + data.secondPhase.avgDuration);
    }

    const sumText = (text: string) => {
      return text.split('\n')
        .map(line => parseInt(line.trim()))
        .filter(num => !isNaN(num))
        .reduce((sum, num) => sum + num, 0);
    };

    return {
      totalTime,
      totalUnits: sumText(data.knowledgePointsText) || data.totalKnowledgePoints,
      highFrequencyPoints: sumText(data.errorPointsText) || data.totalHighFreqPoints
    };
  }, [excelData, selectedStudent, data.firstPhase.avgDuration, data.secondPhase.avgDuration, data.totalKnowledgePoints, data.totalHighFreqPoints, data.knowledgePointsText, data.errorPointsText]);

  // Chart data
  const qualityData = useMemo(() => {
    return comparisonResults
      .filter(res => ['综合完课率', '综合正确率'].includes(res.metric))
      .map(res => ({
        metric: res.metric.replace('综合', ''),
        '第一个月': res.firstValue,
        '本月': res.secondValue,
        diff: res.diff,
        status: res.status,
        unit: res.unit
      }));
  }, [comparisonResults]);

  const dataInterpretation = useMemo(() => {
    const getTrend = (metricName: string) => {
      const res = comparisonResults.find(r => r.metric === metricName);
      if (!res) return 'stable' as const;
      
      if (metricName === '综合完课率' || metricName === '综合正确率') {
        if (res.secondValue > res.firstValue) return 'up' as const;
        if (res.firstValue - res.secondValue <= 5) return 'stable' as const;
        return 'down' as const;
      }
      
      if (metricName === '班级排名') {
        if (res.secondValue < res.firstValue) return 'up' as const;
        if (res.secondValue - res.firstValue <= 2) return 'stable' as const;
        return 'down' as const;
      }
      
      return 'stable' as const;
    };

    const completionTrend = getTrend('综合完课率');
    const accuracyTrend = getTrend('综合正确率');
    const rankTrend = getTrend('班级排名');

    const interpretations = {
      completion: {
        up: "本月完课率环比提升，孩子能紧跟每周课程解析节奏完成学习，学习主动性和时间规划能力进步明显，也养成了更稳定的数学学习习惯。",
        stable: "本月完课率始终保持平稳，孩子能按计划完成每一期课程学习，没有出现知识点断档的情况，为持续进阶打下了扎实的基础。",
        down: "本月课程难度大幅增大，知识点抽象度显著提升，叠加校内学业任务加重，孩子的完课率有小幅回落，学习节奏受到了一定影响。"
      },
      accuracy: {
        up: "与此同时，本月答题正确率环比提升，孩子对本月知识点的掌握更扎实，课上教的解题方法能灵活运用，审题和答题的细节习惯也有了明显进步。",
        stable: "与此同时，本月答题正确率保持稳定，孩子对课程核心知识点的掌握非常牢固，基础功底扎实，没有出现学完就忘的情况。",
        down: "与此同时，本月答题正确率有小幅波动，核心原因是本月题目难度和综合度大幅提升，不再是单一知识点考察，需要跨模块联动解题，孩子的综合应用能力还在适应期，基础题型的发挥依然很稳定。"
      },
      rank: {
        up: "横向对比班级整体情况来看，本月孩子的班级排名环比前进，在同期学员中进步幅度位居前列，学习效果远超大部分同龄孩子，数学学习的竞争力持续提升。",
        stable: "横向对比班级整体情况来看，本月孩子的班级排名保持稳定，始终处于班级中上梯队，哪怕本月课程难度升级，也依然稳住了自己的学习节奏，在同期学员中具备稳定的竞争力。",
        down: "横向对比班级整体情况来看，本月孩子的班级排名有小幅波动，核心是本月课程难度升级后，学员之间的学习分层更明显，同班学员整体都在发力进步，孩子本身也在持续成长，只是进步幅度暂时略缓，后续有很大的追赶空间。"
      }
    };

    const overallTrend = (() => {
      const trends = [completionTrend, accuracyTrend, rankTrend];
      if (trends.every(t => t === 'up')) return 'allUp';
      if (trends.every(t => t === 'stable')) return 'allStable';
      if (trends.every(t => t === 'down')) return 'allDown';
      return 'mixed';
    })();

    const opening = {
      allUp: "本月孩子的整体学习状态有非常亮眼的进步，各项数据均有正向提升，具体学习情况如下：",
      allStable: "本月孩子的整体学习状态保持得非常稳定，各项数据均无大幅波动，始终保持着良好的学习节奏：",
      allDown: "本月受课程难度大幅升级的影响，孩子的各项学习数据有小幅波动，具体情况我给您同步一下：",
      mixed: "本月孩子的学习有非常突出的亮点，也有需要我们一起帮孩子提升的地方，各项数据的具体表现如下："
    };

    const closing = {
      allUp: "后续我们继续保持这个良好的学习节奏，带着孩子稳步进阶，攻克更多重难点。",
      allStable: "后续我会针对孩子的可提升点做专项训练，帮孩子突破现有瓶颈，实现新的进步。",
      allDown: "接下来我会给孩子定制专属的补学计划和重难点专项提升方案，带着孩子一步步跟上节奏，把基础打扎实。",
      mixed: "后续我会针对性给孩子制定个性化学习规划，继续放大孩子的优势，同时补齐薄弱点，帮孩子实现稳定的进步。"
    };

    return {
      opening: opening[overallTrend],
      completion: interpretations.completion[completionTrend],
      accuracy: interpretations.accuracy[accuracyTrend],
      rank: interpretations.rank[rankTrend],
      closing: closing[overallTrend]
    };
  }, [comparisonResults]);

  const CustomBarLabel = (props: any) => {
    if (!props) return null;
    const { x, y, width, value, dataKey, payload } = props;
    
    // Recharts sometimes nests the data item in payload.payload
    const item = payload?.payload || payload;
    if (!item) return null;

    const unit = item.unit || '';
    
    // For "第一个月" (Previous month), just show the value
    if (dataKey !== '本月') return (
      <text x={x + width / 2} y={y - 10} fill="#94a3b8" fontSize={11} fontWeight="600" textAnchor="middle">
        {value}{unit}
      </text>
    );

    // For "本月" (Current month), show value + indicator
    const diff = item.diff ?? 0;
    const status = item.status || '稳定';
    
    let color = '#94a3b8'; // Stable (Gray)
    let arrow = '→';
    if (status === '进步') {
      color = '#10b981'; // Green
      arrow = '↑';
    } else if (status === '波动') {
      color = '#3b82f6'; // Blue
      arrow = '↓';
    }

    const diffText = status === '稳定' ? '0' : (status === '进步' ? `+${Math.abs(diff)}` : `-${Math.abs(diff)}`);

    return (
      <g>
        <text x={x + width / 2} y={y - 26} fill={color} fontSize={10} fontWeight="bold" textAnchor="middle">
          {arrow} {diffText}{unit}
        </text>
        <text x={x + width / 2} y={y - 10} fill="#4f46e5" fontSize={11} fontWeight="bold" textAnchor="middle">
          {value}{unit}
        </text>
      </g>
    );
  };

  const allAvailableUnits = useMemo(() => {
    const defaultRange = Array.from({ length: 10 }, (_, i) => i + 1);
    if (!excelData) return defaultRange;
    
    const units = new Set<number>(defaultRange);
    Object.values(excelData.students).forEach((s: any) => {
      Object.keys(s.units).forEach(u => units.add(parseInt(u)));
    });
    return Array.from(units).sort((a, b) => a - b);
  }, [excelData]);

  const calculatePhaseData = (unitRange: number[], studentName: string, sourceData: any) => {
    if (!sourceData || !studentName || !sourceData.rawRows) return { units: unitRange, completionRate: 0, accuracyRate: 0, avgDuration: 0, rank: 0 };
    
    const student = sourceData.students[studentName];
    if (!student) return { units: unitRange, completionRate: 0, accuracyRate: 0, avgDuration: 0, rank: 0 };

    // 1. Filter rows for selected unit range
    const rangeSet = new Set(unitRange);
    const relevantRows = sourceData.rawRows.filter((row: RawExcelRow) => rangeSet.has(row.unitNumber));

    // 2. Calculate stats for current student
    const currentStudentRows = relevantRows.filter((row: RawExcelRow) => row.studentName === studentName);
    if (currentStudentRows.length === 0) return { units: unitRange, completionRate: 0, accuracyRate: 0, avgDuration: 0, rank: 0 };

    // Total records for completion rate
    const N_total_current = currentStudentRows.length;
    const C_current = currentStudentRows.filter((row: RawExcelRow) => row.status === '已完成').length;
    const completionRate_current = (C_current / N_total_current) * 100;

    // Active records (duration > 0) for accuracy and duration
    const activeStudentRows = currentStudentRows.filter((row: RawExcelRow) => row.timeSpent > 0);
    const N_active_current = activeStudentRows.length;
    
    const avgAccuracy_current = N_active_current > 0 
      ? activeStudentRows.reduce((sum: number, row: RawExcelRow) => sum + row.accuracy, 0) / N_active_current 
      : 0;

    const totalDuration = activeStudentRows.reduce((sum: number, row: RawExcelRow) => sum + row.timeSpent, 0);
    const avgDuration = N_active_current > 0 
      ? Math.round(totalDuration / N_active_current / 60)
      : 0;

    // 3. Calculate stats for all students for ranking
    const studentStatsMap: Record<string, { name: string, C: number, N_total: number, N_active: number, S: number }> = {};
    
    relevantRows.forEach((row: RawExcelRow) => {
      if (!studentStatsMap[row.studentName]) {
        studentStatsMap[row.studentName] = { name: row.studentName, C: 0, N_total: 0, N_active: 0, S: 0 };
      }
      const stats = studentStatsMap[row.studentName];
      stats.N_total += 1;
      if (row.status === '已完成') stats.C += 1;
      
      if (row.timeSpent > 0) {
        stats.N_active += 1;
        stats.S += row.accuracy;
      }
    });

    const allStudentStats = Object.values(studentStatsMap).map(stats => ({
      name: stats.name,
      completionRate: (stats.C / stats.N_total) * 100,
      avgAccuracy: stats.N_active > 0 ? stats.S / stats.N_active : 0,
      isCurrent: stats.name === studentName
    }));

    // 4. Sorting logic (Priority chain)
    allStudentStats.sort((a, b) => {
      // Priority 1: Completion Rate (Descending)
      if (Math.abs(b.completionRate - a.completionRate) > 0.0001) return b.completionRate - a.completionRate;
      
      // Priority 2: Identity Boost (Current student first)
      if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
      
      // Priority 3: Avg Accuracy (Descending)
      return b.avgAccuracy - a.avgAccuracy;
    });

    const rank = allStudentStats.findIndex(s => s.isCurrent) + 1;

    return {
      units: unitRange,
      completionRate: Math.round(completionRate_current),
      accuracyRate: Math.round(avgAccuracy_current),
      avgDuration: avgDuration,
      rank: rank
    };
  };

  const handleUpdateData = (newData: Partial<ReportData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const handlePhaseUpdate = (phase: 'firstPhase' | 'secondPhase', units: number[]) => {
    if (excelData && selectedStudent) {
      const phaseData = calculatePhaseData(units, selectedStudent, excelData);
      setData(prev => ({
        ...prev,
        [phase]: phaseData
      }));
    } else {
      setData(prev => ({
        ...prev,
        [phase]: { ...prev[phase], units }
      }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const processed = await processExcelFile(file);
      setExcelData(processed);
      const studentNames = Object.keys(processed.students);
      if (studentNames.length > 0) {
        handleStudentSelect(studentNames[0], processed);
      }
    } catch (err) {
      console.error('Error processing file:', err);
      alert('解析文件失败，请检查格式是否正确');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStudentSelect = (name: string, sourceData = excelData) => {
    if (!sourceData) return;
    const student = sourceData.students[name];
    if (!student) return;

    setSelectedStudent(name);

    // Calculate phases based on student data
    const firstPhase = calculatePhaseData(data.firstPhase.units, name, sourceData);
    const secondPhase = calculatePhaseData(data.secondPhase.units, name, sourceData);

    // Initial values for manual inputs based on current data
    const totalCompletedUnits = (Object.values(student.units) as AggregatedUnitData[]).filter(u => u.isCompleted).length;
    const suggestedHighFreq = Math.floor(totalCompletedUnits * 0.4);

    setData(prev => ({
      ...prev,
      studentName: student.name,
      grade: student.grade,
      teacherName: student.teacher,
      firstPhase,
      secondPhase,
      totalKnowledgePoints: totalCompletedUnits,
      totalHighFreqPoints: suggestedHighFreq,
      teacherCommentText: prev.teacherCommentText || "宝贝正随着课程进阶稳步成长，每一份努力都在拓宽思维的边界，让我们共同促进、见证这份珍贵的成长与蜕变。",
    }));
  };

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      // Small delay to ensure any UI updates (like hiding buttons) are rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      const dataUrl = await toPng(reportRef.current, { 
        quality: 1.0, 
        backgroundColor: '#f8fafc',
        pixelRatio: 2 // Higher resolution
      });
      const link = document.createElement('a');
      link.download = `${data.studentName || '学员'}-学情报告.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
      alert('导出图片失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <ConfigModal 
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        data={data}
        onUpdate={handleUpdateData}
        onPhaseUpdate={handlePhaseUpdate}
        availableUnits={allAvailableUnits}
        excelData={excelData}
        selectedStudent={selectedStudent}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <LayoutDashboard className="text-indigo-600" />
            <h1 className="font-bold text-lg hidden sm:block">学情报告生成器</h1>
          </div>

          {/* Student Search in Header */}
          {excelData && (
            <div className="relative flex-1 max-w-md" ref={dropdownRef}>
              <button 
                onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm hover:bg-slate-100 transition-all"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <User size={16} className="text-indigo-600 shrink-0" />
                  <span className="font-bold text-slate-700 truncate">
                    {selectedStudent || '选择学员'}
                  </span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isStudentDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isStudentDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-slate-100">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="搜索学员..."
                          value={searchTerm}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSearchTerm(val);
                            
                            // Auto-select if ID matches exactly
                            if (val.trim()) {
                              const matchedStudent = (Object.values(excelData.students) as StudentData[]).find(
                                s => s.id && s.id.toString().toLowerCase() === val.trim().toLowerCase()
                              );
                              if (matchedStudent) {
                                handleStudentSelect(matchedStudent.name);
                                setIsStudentDropdownOpen(false);
                                setSearchTerm(''); // Clear search after auto-select
                              }
                            }
                          }}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
                      {(Object.values(excelData.students) as StudentData[])
                        .filter(s => 
                          s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.id && s.id.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .map(student => (
                          <button
                            key={student.name}
                            onClick={() => {
                              handleStudentSelect(student.name);
                              setIsStudentDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all mb-1 ${
                              selectedStudent === student.name 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold ${
                                selectedStudent === student.name ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {student.name.substring(0, 1)}
                              </div>
                              <span className="font-medium">{student.name}</span>
                            </div>
                            {student.id && <span className={`text-[10px] ${selectedStudent === student.name ? 'text-indigo-200' : 'text-slate-400'}`}>ID: {student.id}</span>}
                          </button>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {/* Show Regression Toggle in Header */}
            <label className="relative inline-flex items-center cursor-pointer mr-2" title="是否显示退步评语">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={showRegressionComments}
                onChange={(e) => setShowRegressionComments(e.target.checked)}
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-2 text-xs font-medium text-slate-600 hidden md:inline">是否显示退步</span>
            </label>

            <button 
              onClick={() => setIsConfigModalOpen(true)}
              className="p-2 sm:px-4 sm:py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-all flex items-center gap-2"
              title="全局配置"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">全局配置</span>
            </button>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                isEditing 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title={isEditing ? '预览报告' : '修改数据'}
            >
              {isEditing ? <CheckCircle2 size={16} /> : <BarChart3 size={16} />}
              <span className="hidden sm:inline">{isEditing ? '预览报告' : '修改数据'}</span>
            </button>
            {!isEditing && (
              <button 
                onClick={handleExportImage}
                disabled={isExporting}
                className="p-2 sm:px-4 sm:py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                title="导出图片"
              >
                <BarChart3 size={16} />
                <span className="hidden sm:inline">{isExporting ? '导出中...' : '导出图片'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {isEditing && (
          <div className="space-y-6 mb-8 print:hidden">
            {/* Upload Section */}
            <Card className="border-dashed border-2 border-indigo-200 bg-indigo-50/30">
              <div className="flex flex-col items-center justify-center py-4">
                <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                  <Upload className="text-indigo-600" size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">上传学情数据</h3>
                <p className="text-sm text-slate-500 mb-4 text-center max-w-md">
                  支持 Excel 文件上传，系统将自动解析学员数据、计算完课率及准确率。
                </p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isUploading ? '正在解析...' : '选择文件'}
                </button>
              </div>
            </Card>

            {/* Student Selection - Moved to Header */}
          </div>
        )}

        {/* 1. 阶段成长勋章 & 学员信息 */}
        <div ref={reportRef} className="bg-slate-50 p-4 sm:p-8 rounded-2xl">
          <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />
          <SectionHeader icon={Trophy} title="阶段成长勋章" subtitle="见证你的每一次突破" />
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-4">
            {/* 学员信息板块 */}
            <div className="md:col-span-4 flex flex-col gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">学员姓名</p>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={data.studentName} 
                      onChange={(e) => handleUpdateData({ studentName: e.target.value })}
                      className="text-sm font-bold text-slate-800 bg-transparent border-b border-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-800">{data.studentName}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <BookOpen size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">当前年级</p>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={data.grade} 
                      onChange={(e) => handleUpdateData({ grade: e.target.value })}
                      className="text-sm font-bold text-slate-800 bg-transparent border-b border-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-800">{data.grade}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                  <Star size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">老师名称</p>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={data.teacherName} 
                      onChange={(e) => handleUpdateData({ teacherName: e.target.value })}
                      className="text-sm font-bold text-slate-800 bg-transparent border-b border-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-800">{data.teacherName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 勋章展示 */}
            <div className="md:col-span-8 flex flex-col md:flex-row items-center gap-8">
              <motion.div 
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="relative shrink-0"
              >
                <div className="w-40 h-40 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-orange-200">
                  <Award size={80} className="text-white" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full shadow-md border border-orange-100">
                  <span className="text-orange-600 font-bold whitespace-nowrap">{badgeInfo.level}</span>
                </div>
              </motion.div>

              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">{badgeInfo.level}</h3>
                <p className="text-slate-600 mb-4">{badgeInfo.comment}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {badgeInfo.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100 flex items-center gap-1">
                      <TrendingUp size={12} />
                      {tag}进步
                    </span>
                  ))}
                  {badgeInfo.tags.length === 0 && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full">
                      稳扎稳打
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 2. 学习数据对比 & 图表 */}
        <Card>
          <SectionHeader icon={BarChart3} title="学习数据对比" subtitle="核心指标阶段性变化" />
          
          <div className="flex flex-col gap-8">
            {/* 上部：数据表格或编辑 */}
            <div className="w-full">
              {isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs">A</span>
                        第一个月 (阶段A)
                      </h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-500">
                          <p>单元范围: <span className="font-bold text-slate-700">{data.firstPhase.units.join(', ') || '未选择'}</span></p>
                          <p className="mt-1">完课率: <span className="font-bold text-indigo-600">{data.firstPhase.completionRate}%</span></p>
                          <p>正确率: <span className="font-bold text-indigo-600">{data.firstPhase.accuracyRate}%</span></p>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">* 完课率与正确率由系统根据单元范围自动计算</p>
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                      <h4 className="font-bold text-indigo-700 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-xs">B</span>
                        本月 (阶段B)
                      </h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-white rounded-lg border border-indigo-200 text-xs text-slate-500">
                          <p>单元范围: <span className="font-bold text-slate-700">{data.secondPhase.units.join(', ') || '未选择'}</span></p>
                          <p className="mt-1">完课率: <span className="font-bold text-indigo-600">{data.secondPhase.completionRate}%</span></p>
                          <p>正确率: <span className="font-bold text-indigo-600">{data.secondPhase.accuracyRate}%</span></p>
                        </div>
                        <p className="text-[10px] text-indigo-400 italic">* 完课率与正确率由系统根据单元范围自动计算</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-4 font-semibold text-slate-500 text-sm">指标</th>
                        <th className="py-4 font-semibold text-slate-500 text-sm">第一个月</th>
                        <th className="py-4 font-semibold text-slate-500 text-sm">本月</th>
                        <th className="py-4 font-semibold text-slate-500 text-sm">变化</th>
                        <th className="py-4 font-semibold text-slate-500 text-sm">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonResults.map((res, idx) => (
                        <motion.tr 
                          key={res.metric}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-4 font-medium text-slate-700">{res.metric}</td>
                          <td className="py-4 text-slate-600">{res.firstValue}{res.unit}</td>
                          <td className="py-4 font-bold text-slate-900">{res.secondValue}{res.unit}</td>
                          <td className="py-4">
                            <div className={`flex items-center gap-1 font-bold ${
                              res.status === '进步' ? 'text-green-600' : 
                              res.status === '波动' ? 'text-blue-600' : 'text-slate-400'
                            }`}>
                              {res.diff > 0 ? '+' : ''}{res.diff}{res.unit}
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${
                              res.status === '进步' ? 'bg-green-100 text-green-700' : 
                              res.status === '波动' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {res.status === '进步' && <TrendingUp size={12} />}
                              {res.status === '波动' && <TrendingDown size={12} />}
                              {res.status === '稳定' && <Minus size={12} />}
                              {res.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 下部：可视化图表 */}
            <div className="grid grid-cols-1 gap-6">
              {/* 学习质量表现 */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">学习质量表现</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-slate-300" />
                      <span className="text-xs text-slate-500">第一个月</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-indigo-600" />
                      <span className="text-xs text-slate-500">本月</span>
                    </div>
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={qualityData} 
                      layout="vertical"
                      margin={{ top: 5, right: 40, left: 40, bottom: 5 }}
                      barGap={8}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis 
                        type="number"
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8' }} 
                        domain={[0, 100]} 
                        ticks={[0, 25, 50, 75, 100]}
                      />
                      <YAxis 
                        dataKey="metric" 
                        type="category"
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                        width={60}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="第一个月" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={20}>
                        <LabelList dataKey="第一个月" position="right" style={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} formatter={(v: any) => `${v}%`} />
                      </Bar>
                      <Bar dataKey="本月" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20}>
                        <LabelList dataKey="本月" position="right" style={{ fill: '#4f46e5', fontSize: 11, fontWeight: 700 }} formatter={(v: any) => `${v}%`} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 数据解读模块 */}
              <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                  <h4 className="font-bold text-slate-800">数据解读</h4>
                </div>
                <div className="space-y-4">
                  {isEditing ? (
                    <textarea
                      value={data.customInterpretation?.opening ?? dataInterpretation.opening}
                      onChange={(e) => handleUpdateData({ customInterpretation: { ...data.customInterpretation, opening: e.target.value } })}
                      className="w-full text-sm text-slate-700 font-medium leading-relaxed bg-white border border-indigo-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[80px]"
                    />
                  ) : (
                    <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                      {data.customInterpretation?.opening ?? dataInterpretation.opening}
                    </p>
                  )}
                  
                  <div className="space-y-3 pl-4 border-l-2 border-indigo-100">
                    {isEditing ? (
                      <textarea
                        value={data.customInterpretation?.completion ?? dataInterpretation.completion}
                        onChange={(e) => handleUpdateData({ customInterpretation: { ...data.customInterpretation, completion: e.target.value } })}
                        className="w-full text-sm text-slate-600 leading-relaxed bg-white border border-indigo-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[80px]"
                      />
                    ) : (
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {data.customInterpretation?.completion ?? dataInterpretation.completion}
                      </p>
                    )}
                    
                    {isEditing ? (
                      <textarea
                        value={data.customInterpretation?.accuracy ?? dataInterpretation.accuracy}
                        onChange={(e) => handleUpdateData({ customInterpretation: { ...data.customInterpretation, accuracy: e.target.value } })}
                        className="w-full text-sm text-slate-600 leading-relaxed bg-white border border-indigo-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[80px]"
                      />
                    ) : (
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {data.customInterpretation?.accuracy ?? dataInterpretation.accuracy}
                      </p>
                    )}
                    
                    {isEditing ? (
                      <textarea
                        value={data.customInterpretation?.rank ?? dataInterpretation.rank}
                        onChange={(e) => handleUpdateData({ customInterpretation: { ...data.customInterpretation, rank: e.target.value } })}
                        className="w-full text-sm text-slate-600 leading-relaxed bg-white border border-indigo-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[80px]"
                      />
                    ) : (
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {data.customInterpretation?.rank ?? dataInterpretation.rank}
                      </p>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <textarea
                      value={data.customInterpretation?.closing ?? dataInterpretation.closing}
                      onChange={(e) => handleUpdateData({ customInterpretation: { ...data.customInterpretation, closing: e.target.value } })}
                      className="w-full text-sm text-slate-700 font-medium leading-relaxed bg-white border border-indigo-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[80px]"
                    />
                  ) : (
                    <p className="text-sm text-slate-700 font-medium leading-relaxed pt-2 whitespace-pre-wrap">
                      {data.customInterpretation?.closing ?? dataInterpretation.closing}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 3. 学习知识点呈现 */}
        <Card>
          <SectionHeader icon={BookOpen} title="学习知识点呈现" subtitle="掌握情况一目了然" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100">
              <h4 className="text-indigo-800 font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 size={18} />
                已熟练运用
              </h4>
              <ul className="space-y-3">
                {data.masteredUnitsText.split('\n').filter(t => t.trim()).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100">
              <h4 className="text-emerald-800 font-bold mb-4 flex items-center gap-2">
                <Star size={18} />
                全新掌握
              </h4>
              <ul className="space-y-3">
                {data.newUnitsText.split('\n').filter(t => t.trim()).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-red-500 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-slate-400 italic">
            * 持续的学习与练习是通往成功的唯一路径
          </p>
        </Card>

        {/* 4. 雪球成长里程碑 */}
        <Card>
          <SectionHeader icon={Target} title="雪球成长里程碑" subtitle="点滴进步汇聚成海" />
          
          <div className="space-y-4">
            {/* 累计学习概览 */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 mb-2"
            >
              <p className="text-sm text-indigo-900 leading-relaxed">
                截止目前，你累计学习 <span className="font-bold text-indigo-600">【{cumulativeStats.totalTime}】</span>分钟，完成<span className="font-bold text-indigo-600">【{cumulativeStats.totalUnits}】</span>知识点，相当于攻克了<span className="font-bold text-indigo-600">【{cumulativeStats.highFrequencyPoints}】</span>个高频易错点，持续进阶数学思维，提升逻辑能力。
              </p>
              <p className="text-sm text-indigo-900 leading-relaxed mt-2">
                每一分耕耘，皆化薄弱为所长。
              </p>
              <p className="text-sm text-indigo-900 leading-relaxed mt-2">
                随着课程进度深入，面临的挑战也越来越大，你的点滴成长和进步，老师都看在眼里，记录在册📝
              </p>
            </motion.div>

            {milestones.map((m, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className={`p-2 rounded-lg shrink-0 ${
                  m.status === '进步' ? 'bg-green-100 text-green-600' : 
                  m.status === '波动' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                }`}>
                  {m.status === '进步' ? <TrendingUp size={20} /> : 
                   m.status === '波动' ? <TrendingDown size={20} /> : <Minus size={20} />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{m.ability}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{m.comment}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* 5. 老师寄语 */}
        <AnimatePresence>
          {(data.teacherCommentText || isEditing) && (
            <Card>
              <SectionHeader icon={MessageSquare} title="老师寄语" />
              
              {isEditing ? (
                <textarea 
                  value={data.teacherCommentText}
                  onChange={(e) => handleUpdateData({ teacherCommentText: e.target.value })}
                  className="w-full h-32 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  placeholder="输入对孩子的鼓励和建议..."
                />
              ) : (
                <div className="relative p-6 bg-indigo-600 rounded-2xl text-white">
                  <div className="absolute top-4 left-4 opacity-20">
                    <MessageSquare size={40} />
                  </div>
                  <p className="relative z-10 text-lg italic leading-relaxed font-medium">
                    "{data.teacherCommentText}"
                  </p>
                  <div className="mt-4 flex justify-end">
                    <span className="text-sm font-bold opacity-80">— {data.teacherName}</span>
                  </div>
                </div>
              )}
            </Card>
          )}
        </AnimatePresence>

        <footer className="mt-12 text-center text-slate-400 text-sm">
          <p>报告生成时间：{new Date().toLocaleDateString()}</p>
        </footer>
        </div>
      </main>
    </div>
  );
}
