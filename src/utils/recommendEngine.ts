import { coffeeBeans, CoffeeBean } from '../data/coffeeBeanDB';

export interface SurveyAnswers {
  0: string; // brewMethod: hand_drip | espresso | cold_brew | capsule
  1: string; // tasteProfile: bright | balanced | bold | sweet
  2: string; // situation: morning | study | relax | social | after_meal | workout
  3: string; // caffeine: decaf | low | medium | high
  4: string; // origin: ethiopia | colombia | brazil | guatemala | any
}

export interface RecommendedBean extends CoffeeBean {
  matchScore: number;
  matchPercent: number;
}

const WEIGHTS = {
  brewMethod: 25,
  taste: 30,
  situation: 15,
  caffeine: 15,
  origin: 15,
};

// 맛 취향 유사도 매핑 (부분 점수)
const tasteSimilarity: Record<string, Record<string, number>> = {
  bright:   { bright: 1.0, balanced: 0.4, sweet: 0.3, bold: 0.0 },
  balanced: { bright: 0.4, balanced: 1.0, sweet: 0.5, bold: 0.4 },
  bold:     { bright: 0.0, balanced: 0.4, sweet: 0.3, bold: 1.0 },
  sweet:    { bright: 0.3, balanced: 0.5, sweet: 1.0, bold: 0.3 },
};

function scoreBean(bean: CoffeeBean, answers: SurveyAnswers): number {
  let score = 0;

  // 1) 추출방식 (25점)
  if (bean.brewMethods.includes(answers[0])) {
    score += WEIGHTS.brewMethod;
  } else {
    // 부분 점수: 추출 방식이 다르지만 다용도인 원두
    score += WEIGHTS.brewMethod * 0.2 * Math.min(bean.brewMethods.length, 3) / 3;
  }

  // 2) 맛 취향 (30점)
  const similarity = tasteSimilarity[answers[1]]?.[bean.tasteProfile] ?? 0;
  score += WEIGHTS.taste * similarity;

  // 3) 상황 (15점)
  if (bean.situations.includes(answers[2])) {
    score += WEIGHTS.situation;
  } else {
    // 부분 점수
    score += WEIGHTS.situation * 0.15;
  }

  // 4) 카페인 (15점)
  if (bean.caffeine === answers[3]) {
    score += WEIGHTS.caffeine;
  } else {
    // 한 단계 차이면 부분 점수
    const caffeineOrder = ['decaf', 'low', 'medium', 'high'];
    const diff = Math.abs(caffeineOrder.indexOf(bean.caffeine) - caffeineOrder.indexOf(answers[3]));
    if (diff === 1) score += WEIGHTS.caffeine * 0.5;
    else if (diff === 2) score += WEIGHTS.caffeine * 0.15;
  }

  // 5) 산지 (15점)
  if (answers[4] === 'any') {
    // "상관없어요" → 모든 원두에 기본 5점
    score += WEIGHTS.origin * 0.35;
  } else if (bean.origin === answers[4]) {
    score += WEIGHTS.origin;
  } else if (bean.origin === 'any') {
    // 원두가 특정 산지에 속하지 않으면 부분 점수
    score += WEIGHTS.origin * 0.2;
  }

  return score;
}

export function getRecommendations(answers: Partial<SurveyAnswers>): RecommendedBean[] {
  // 기본값 채우기
  const fullAnswers: SurveyAnswers = {
    0: answers[0] || 'hand_drip',
    1: answers[1] || 'balanced',
    2: answers[2] || 'morning',
    3: answers[3] || 'medium',
    4: answers[4] || 'any',
  };

  const scored = coffeeBeans.map(bean => ({
    ...bean,
    matchScore: scoreBean(bean, fullAnswers),
    matchPercent: 0,
  }));

  // 점수 내림차순 정렬
  scored.sort((a, b) => b.matchScore - a.matchScore);

  // 최고 점수 기준 퍼센트 계산
  const maxPossible = Object.values(WEIGHTS).reduce((a, b) => a + b, 0); // 100
  scored.forEach(bean => {
    bean.matchPercent = Math.round((bean.matchScore / maxPossible) * 100);
  });

  // 상위 3개 반환 (같은 산지 중복 최소화)
  const results: RecommendedBean[] = [];
  const usedOrigins = new Set<string>();

  for (const bean of scored) {
    if (results.length >= 3) break;

    // 첫 번째(메인 추천)는 무조건 선택
    if (results.length === 0) {
      results.push(bean);
      usedOrigins.add(bean.id);
      continue;
    }

    // 2~3번째는 가능하면 다른 원두 선호
    if (!usedOrigins.has(bean.id)) {
      results.push(bean);
      usedOrigins.add(bean.id);
    }
  }

  // 3개가 안 채워졌으면 나머지로 채움
  if (results.length < 3) {
    for (const bean of scored) {
      if (results.length >= 3) break;
      if (!results.find(r => r.id === bean.id)) {
        results.push(bean);
      }
    }
  }

  return results;
}

export function getRandomRecommendations(): RecommendedBean[] {
  const shuffled = [...coffeeBeans].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((bean, i) => ({
    ...bean,
    matchScore: 85 - i * 8,
    matchPercent: 85 - i * 8,
  }));
}

// 추출방식 한글 매핑
export const brewMethodLabels: Record<string, string> = {
  hand_drip: '핸드드립',
  espresso: '에스프레소',
  cold_brew: '콜드브루',
  capsule: '캡슐머신',
};

// 로스팅 레벨 활성 도트 배열
export function getRoastDots(level: string): number[] {
  switch (level) {
    case 'light': return [1, 0, 0];
    case 'medium': return [1, 1, 0];
    case 'dark': return [1, 1, 1];
    default: return [1, 0, 0];
  }
}
