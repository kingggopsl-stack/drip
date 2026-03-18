const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// 업로드할 제안서 데이터들을 여기에 추가하세요
const documents = [
  {
    title: "성공적인 카페 브랜딩 및 인스타그램 마케팅 사례",
    category: "F&B / 카페",
    content: "2024년 상반기 진행된 테이크아웃 전문 카페의 브랜딩 사례입니다. 핵심 타겟은 인근 직장인이며, '오늘의 기분'을 색깔로 표현하는 컵홀더 이벤트를 통해 인스타그램 태그 수가 전월 대비 300% 상승했습니다. 미디어 전략으로는 지역 기반 인스타그램 광고(Geo-targeting)를 5km 이내로 제한하여 효율을 극대화했습니다."
  },
  {
    title: "친환경 화장품 브랜드 런칭 캠페인",
    category: "뷰티 / 라이프스타일",
    content: "지속 가능한 소비를 지향하는 2030 여성을 타겟으로 한 제안서입니다. '지구를 생각하는 아름다움'이라는 컨셉 하에 종이 패키징의 우수성을 강조하는 숏폼 챌린지를 전개했습니다. 카카오톡 선물하기 채널을 주력으로 활용하여 전환율 12%를 달성했습니다."
  }
  // 추가하고 싶은 제안서가 있다면 같은 형식으로 더 넣으세요
];

async function uploadAll() {
  console.log('🚀 제안서 업로드를 시작합니다...');
  
  for (const doc of documents) {
    try {
      const response = await fetch('http://localhost:3001/upload-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
      });
      
      const result = await response.json();
      if (result.success) {
        console.log(`✅ 성공: [${doc.title}]`);
      } else {
        console.error(`❌ 실패: [${doc.title}] - ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ 서버 연결 오류: ${error.message}`);
    }
  }
  
  console.log('🏁 모든 작업이 완료되었습니다.');
}

uploadAll();
