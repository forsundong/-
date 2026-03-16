import { BadgeLevel, ComparisonResult, MilestoneComment, PhaseData, ReportData } from "./types";

export const DEFAULT_REPORT_DATA: ReportData = {
  studentName: "张小明",
  grade: "三年级",
  teacherName: "王老师",
  firstPhase: {
    units: [1, 2, 3, 4],
    completionRate: 85,
    accuracyRate: 78,
    avgDuration: 45,
    rank: 15,
  },
  secondPhase: {
    units: [5, 6, 7, 8],
    completionRate: 92,
    accuracyRate: 88,
    avgDuration: 52,
    rank: 8,
  },
  masteredUnitsText: "",
  newUnitsText: "",
  knowledgePointsText: "12\n15",
  errorPointsText: "3\n5",
  teacherCommentText: "宝贝正随着课程进阶稳步成长，每一份努力都在拓宽思维的边界，让我们共同促进、见证这份珍贵的成长与蜕变。",
  totalKnowledgePoints: 45,
  totalHighFreqPoints: 18,
};

export const calculateComparison = (first: PhaseData, second: PhaseData): ComparisonResult[] => {
  const metrics = [
    { name: '综合完课率', key: 'completionRate', unit: '%', inverse: false, threshold: 10 },
    { name: '综合正确率', key: 'accuracyRate', unit: '%', inverse: false, threshold: 10 },
    { name: '平均上课时长', key: 'avgDuration', unit: '分钟', inverse: false, threshold: 60 },
    { name: '班级排名', key: 'rank', unit: '名', inverse: true, threshold: 20 },
  ];

  return metrics.map(m => {
    const v1 = (first as any)[m.key];
    const v2 = (second as any)[m.key];
    let diff = v2 - v1;
    
    // For rank, smaller is better, so diff = v1 - v2
    if (m.inverse) {
      diff = v1 - v2;
    }

    let status: '进步' | '稳定' | '波动' = '稳定';
    
    if (diff > 0) {
      status = '进步';
    } else if (diff <= -m.threshold) {
      status = '波动';
    } else {
      status = '稳定';
    }

    return {
      metric: m.name,
      firstValue: v1,
      secondValue: v2,
      diff,
      status,
      unit: m.unit
    };
  });
};

export const getBadgeInfo = (results: ComparisonResult[]) => {
  const progressPoints = results.filter(r => r.status === '进步').length;
  let level: BadgeLevel;
  let comment: string;
  let tags: string[] = results.filter(r => r.status === '进步').map(r => r.metric);

  switch (progressPoints) {
    case 4:
      level = BadgeLevel.LEVEL_4;
      comment = "你是最闪耀的学习之星，全方位突破，无可挑剔！";
      break;
    case 3:
      level = BadgeLevel.LEVEL_3;
      comment = "多维度的成长证明了你的努力，继续保持，冲刺巅峰！";
      break;
    case 2:
      level = BadgeLevel.LEVEL_2;
      comment = "双重突破，你已经找到了学习的节奏，加油！";
      break;
    case 1:
      level = BadgeLevel.LEVEL_1;
      comment = "潜力正在爆发，一个小小的进步是巨大成功的开始！";
      break;
    default:
      level = BadgeLevel.LEVEL_0;
      comment = "扎实稳健，蓄势待发，期待你的下一次华丽转身！";
  }

  return { level, comment, tags, points: progressPoints };
};

export const getMilestones = (results: ComparisonResult[], studentName: string = "宝贝", showRegression: boolean = true): MilestoneComment[] => {
  const mapping: Record<string, string> = {
    '综合完课率': '学习习惯',
    '综合正确率': '知识掌握程度',
    '平均上课时长': '学习专注度',
    '班级排名': '综合能力',
  };

  const comments: Record<string, Record<'进步' | '稳定' | '波动', string>> = {
    '学习习惯': {
      '进步': '完课率提升了 {X}%，越来越能坚持跟上课程节奏，学习习惯超棒！坚持的样子太亮眼啦～',
      '稳定': '完课率稳稳保持，全程不缺席、不拖沓，规律学习的好习惯直接拉满，太省心了～',
      '波动': '近期完课节奏稍有点波动，咱们稍微调整下时间分配，很快就能找回稳定的学习状态呀！'
    },
    '知识掌握程度': {
      '进步': '解题正确率提升了 {X}%，新知识点吸收越来越扎实，错题越来越少，解题越来越稳，完全“吃透了”',
      '稳定': '正确率保持不错！不管是基础题还是拓展题，都能精准拿捏，知识点掌握得超扎实～',
      '波动': '近期解题正确率有小起伏，大概率是新题型还没适应，多练两道熟悉套路，很快就能重回巅峰！'
    },
    '学习专注度': {
      '进步': '上课平均时长增加了 {X} 分钟，听课越来越专注投入，状态超赞！全程跟着老师思路走，专注度直接拉满～',
      '稳定': '上课状态稳定，全程在线不摸鱼，听课效率超高，这种专注状态太赞了～',
      '波动': '近期上课时长稍有点变化，可能是暂时没找到兴趣点，稍微调整下听课节奏，很快就能重回专注状态呀！'
    },
    '综合能力': {
      '进步': '班级排名前进了 {X} 名，综合表现越来越出色，继续冲呀！',
      '稳定': '在一众同学里实力超稳，即便课程难度增大，也能保持水准，妥妥的潜力之星～',
      '波动': '排名暂时有小波动很正常！可能是暂时没找到适配新内容的方法，调整后很快就能迎头赶上，继续加油～'
    }
  };

  const allRegressed = results.every(r => r.status === '波动');
  if (allRegressed) {
    return [{
      ability: '综合评价',
      status: '波动',
      comment: `${studentName}宝贝在前期学习中已经稳稳打下了扎实基础，这份坚持和吸收能力非常值得点赞！随着课程学习的推进，咱们的学习内容也进入了「进阶提升阶段」—— 知识深度在逐步加深，题型更偏向综合应用，还融入了更多拓展知识点，就是为了帮宝贝拓宽知识边界、锻炼高阶思维～\n\n现阶段宝贝正接触更丰富的知识，每一步都是成长积累！老师看好你的潜力，后续会帮你拆解难点、梳理思路，相信你很快能适应进阶节奏，收获更全面的知识与能力，持续进阶呀～`
    }];
  }

  return results
    .filter(r => showRegression || r.status !== '波动')
    .map(r => {
      const ability = mapping[r.metric];
      let comment = comments[ability][r.status];
      comment = comment.replace('{X}', Math.abs(r.diff).toString());
      
      return {
        ability,
        status: r.status,
        comment
      };
    });
};
