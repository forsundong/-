export enum BadgeLevel {
  LEVEL_0 = "能力进阶之星",
  LEVEL_1 = "潜力爆发小能手",
  LEVEL_2 = "双料突破达人",
  LEVEL_3 = "多维成长先锋",
  LEVEL_4 = "全能进阶王者",
}

export interface PhaseData {
  units: number[];
  completionRate: number; // 0-100
  accuracyRate: number;   // 0-100
  avgDuration: number;    // minutes
  rank: number;           // rank number
}

export interface ComparisonResult {
  metric: string;
  firstValue: number;
  secondValue: number;
  diff: number;
  status: '进步' | '稳定' | '波动';
  unit: string;
}

export interface ReportData {
  studentName: string;
  grade: string;
  teacherName: string;
  firstPhase: PhaseData;
  secondPhase: PhaseData;
  masteredUnitsText: string; // Maps to "单元/讲 名称"
  newUnitsText: string;      // Maps to "学习关联/标签"
  knowledgePointsText: string; // Maps to "知识点总数"
  errorPointsText: string;     // Maps to "易错点总数"
  teacherCommentText: string;
  totalKnowledgePoints: number; // The actual number used in milestone
  totalHighFreqPoints: number;  // The actual number used in milestone
  customInterpretation?: {
    opening?: string;
    completion?: string;
    accuracy?: string;
    rank?: string;
    closing?: string;
  };
}

export interface MilestoneComment {
  ability: string;
  status: '进步' | '稳定' | '波动';
  comment: string;
}

export interface RawExcelRow {
  studentId: string;
  studentName: string;
  unitNumber: number;
  status: '已完成' | '学习中';
  accuracy: number;
  passRate: number;
  timeSpent: number;
  grade: string;
  teacher: string;
}

export interface AggregatedUnitData {
  unitNumber: number;
  totalTimeSpent: number;
  avgAccuracy: number;
  avgPassRate: number;
  isCompleted: boolean;
}

export interface StudentData {
  id: string;
  name: string;
  grade: string;
  teacher: string;
  units: Record<number, AggregatedUnitData>;
}

export interface ClassBenchmark {
  unitNumber: number;
  avgAccuracy: number;
  avgPassRate: number;
}
