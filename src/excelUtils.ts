import * as XLSX from 'xlsx';
import { RawExcelRow, AggregatedUnitData, StudentData, ClassBenchmark } from './types';

const parseRate = (value: any): number => {
  if (value === undefined || value === null || value === '') return 0;
  let str = String(value).trim();
  if (str.endsWith('%')) {
    return parseFloat(str.replace('%', ''));
  }
  let num = parseFloat(str);
  if (isNaN(num)) return 0;
  if (num <= 1) return num * 100;
  return num;
};

const parseTime = (value: any): number => {
  if (value === undefined || value === null || value === '') return 0;
  let str = String(value).trim();
  
  let totalSeconds = 0;
  let hasMatch = false;

  const minMatch = str.match(/(\d+)分/);
  if (minMatch) {
    totalSeconds += parseInt(minMatch[1]) * 60;
    hasMatch = true;
  }

  const secMatch = str.match(/(\d+)秒/);
  if (secMatch) {
    totalSeconds += parseInt(secMatch[1]);
    hasMatch = true;
  }

  if (hasMatch) return totalSeconds;

  let num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const parseGrade = (grade: string): string => {
  const mapping: Record<string, string> = {
    'one': '一年级',
    'two': '二年级',
    'three': '三年级',
    'four': '四年级',
    'five': '五年级',
    'six': '六年级',
  };
  return mapping[grade.toLowerCase()] || grade;
};

export const processExcelFile = async (file: File): Promise<{ 
  students: Record<string, StudentData>, 
  benchmarks: Record<number, ClassBenchmark>,
  rawRows: RawExcelRow[]
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const rawRows: RawExcelRow[] = jsonData.map((row: any) => ({
          studentId: String(row.student_id || row.uid || row.user_id || ''),
          studentName: String(row.real_name || ''),
          unitNumber: parseInt(row.level_sequence) || 0,
          status: row.unit_finish_status === '完课' ? '已完成' : '学习中',
          accuracy: parseRate(row.answer_right_rate),
          passRate: parseRate(row.pass_rate),
          timeSpent: parseTime(row.first_cost_seconds),
          grade: parseGrade(String(row.package_grade || '')),
          teacher: String(row.counselor_name || ''),
        }));

        // Aggregation
        const students: Record<string, StudentData> = {};
        const unitGroups: Record<number, { accuracySum: number, passRateSum: number, count: number }> = {};

        rawRows.forEach(row => {
          if (!students[row.studentName]) {
            students[row.studentName] = {
              id: row.studentId,
              name: row.studentName,
              grade: row.grade,
              teacher: row.teacher,
              units: {}
            };
          }

          const student = students[row.studentName];
          if (!student.units[row.unitNumber]) {
            student.units[row.unitNumber] = {
              unitNumber: row.unitNumber,
              totalTimeSpent: 0,
              avgAccuracy: 0,
              avgPassRate: 0,
              isCompleted: false,
              // Temporary storage for averaging
              _accSum: 0,
              _passSum: 0,
              _count: 0
            } as any;
          }

          const unit = student.units[row.unitNumber] as any;
          unit.totalTimeSpent += row.timeSpent;
          unit._accSum += row.accuracy;
          unit._passSum += row.passRate;
          unit._count += 1;
          if (row.status === '已完成') unit.isCompleted = true;

          // For benchmarks
          if (!unitGroups[row.unitNumber]) {
            unitGroups[row.unitNumber] = { accuracySum: 0, passRateSum: 0, count: 0 };
          }
          unitGroups[row.unitNumber].accuracySum += row.accuracy;
          unitGroups[row.unitNumber].passRateSum += row.passRate;
          unitGroups[row.unitNumber].count += 1;
        });

        // Finalize student averages
        Object.values(students).forEach(student => {
          Object.values(student.units).forEach((unit: any) => {
            unit.avgAccuracy = Math.round(unit._accSum / unit._count);
            unit.avgPassRate = Math.round(unit._passSum / unit._count);
            delete unit._accSum;
            delete unit._passSum;
            delete unit._count;
          });
        });

        // Finalize benchmarks
        const benchmarks: Record<number, ClassBenchmark> = {};
        Object.entries(unitGroups).forEach(([unitNum, data]) => {
          benchmarks[parseInt(unitNum)] = {
            unitNumber: parseInt(unitNum),
            avgAccuracy: Math.round(data.accuracySum / data.count),
            avgPassRate: Math.round(data.passRateSum / data.count)
          };
        });

        resolve({ students, benchmarks, rawRows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
