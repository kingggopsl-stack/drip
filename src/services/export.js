import pptxgen from "pptxgenjs";

export const exportToPPTX = async (data) => {
  const pres = new pptxgen();
  
  pres.layout = 'LAYOUT_16x9';

  const titleProps = { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 32, color: '2563EB', fontFace: 'Malgun Gothic', bold: true };
  const getSubPropStyle = (yPos) => ({ x: 0.5, y: yPos, w: '90%', h: 0.5, fontSize: 18, color: '64748B', fontFace: 'Malgun Gothic' });
  const getContentStyle = (yPos) => ({ x: 0.5, y: yPos, w: '90%', h: 'auto', fontSize: 14, color: '0F172A', fontFace: 'Malgun Gothic' });
  
  const bg = { color: 'FFFFFF' };

  // 1. Cover
  let slide1 = pres.addSlide();
  slide1.background = bg;
  slide1.addText(data.strategy?.coreStrategy || "STRATEGIC AD PROPOSAL", { x: 0.5, y: 2, w: '90%', h: 1, fontSize: 36, color: '0F172A', bold: true, align: 'center', fontFace: 'Malgun Gothic' });
  slide1.addText(data.client_name || "", { x: 0.5, y: 3.2, w: '90%', h: 1, fontSize: 24, color: '2563EB', italic: true, align: 'center', fontFace: 'Malgun Gothic' });
  slide1.addText(new Date().toLocaleDateString(), { x: 0.5, y: 4.5, w: '90%', h: 1, fontSize: 14, color: '94A3B8', align: 'center' });

  // 2. Market Intelligence
  let slide2 = pres.addSlide();
  slide2.background = bg;
  slide2.addText('Market Intelligence', titleProps);
  slide2.addText(data.marketAnalysis?.summary || '', { ...getContentStyle(1.4), fontSize: 16, bold: true });
  if (data.marketAnalysis?.points) {
    slide2.addText(
      data.marketAnalysis.points.map(p => ({ text: p, options: { bullet: true } })),
      { ...getContentStyle(2.4), h: 3 }
    );
  }

  // 3. Competitor Intelligence
  let slide3 = pres.addSlide();
  slide3.background = bg;
  slide3.addText('Competitor Intelligence', titleProps);
  slide3.addText("Direct Competitors: " + (data.competitorIntelligence?.directCompetitors?.join(', ') || 'N/A'), { ...getSubPropStyle(1.4), color: '0F172A', bold: true });
  slide3.addText("Analysis", { x: 0.5, y: 2.2, fontSize: 16, color: '2563EB', bold: true });
  slide3.addText(data.competitorIntelligence?.competitorAnalysis || '', { ...getContentStyle(2.7), fontSize: 13 });
  slide3.addText("Our Opportunity", { x: 0.5, y: 3.8, fontSize: 16, color: '2563EB', bold: true });
  slide3.addText(data.competitorIntelligence?.ourOpportunity || '', { ...getContentStyle(4.3), fontSize: 15, bold: true, color: '1E40AF' });

  // 4. Consumer Insight
  let slide4 = pres.addSlide();
  slide4.background = bg;
  slide4.addText('Consumer Insight / Target', titleProps);
  slide4.addText("Core Insight", { ...getSubPropStyle(1.4), color: '2563EB', bold: true });
  slide4.addText(`"${data.consumerInsight?.statement}"`, { ...getContentStyle(1.9), fontSize: 24, italic: true, bold: true });
  
  slide4.addText("Target Persona: " + (data.targetPersona?.name || ''), { x: 0.5, y: 3.3, fontSize: 18, color: '0F172A', bold: true });
  slide4.addText(data.targetPersona?.demographics || '', { x: 0.5, y: 3.8, fontSize: 12, color: '64748B' });

  // 5. Strategy Overview
  let slide5 = pres.addSlide();
  slide5.background = bg;
  slide5.addText('Core Strategy', titleProps);
  slide5.addText(data.strategy?.coreStrategy || '', { ...getContentStyle(1.5), fontSize: 24, bold: true, color: '0F172A', align: 'center' });
  slide5.addText("Media Mix: " + (data.strategy?.mediaMix || ''), { ...getContentStyle(3.5), fontSize: 16, color: '2563EB', align: 'center' });

  // 6. Strategy Pillars
  if (data.strategy?.pillars) {
    let slide6 = pres.addSlide();
    slide6.background = bg;
    slide6.addText('Strategy Pillars', titleProps);
    let yPos = 1.3;
    data.strategy.pillars.forEach((p, idx) => {
      slide6.addText(`0${idx+1}. ${p.title}`, { x: 0.5, y: yPos, fontSize: 18, color: '2563EB', bold: true });
      slide6.addText(p.description, { x: 0.5, y: yPos + 0.4, w: '90%', fontSize: 13 });
      yPos += 1.3;
    });
  }

  // 7. Proposal Slides Breakdown
  if (data.proposalSlides) {
    data.proposalSlides.forEach((slideData, idx) => {
      let s = pres.addSlide();
      s.background = bg;
      s.addText(`Slide Structure ${idx + 1}: ${slideData.title}`, titleProps);
      if (slideData.content) {
        s.addText(
          slideData.content.map(c => ({ text: c, options: { bullet: true } })),
          { ...getContentStyle(1.5), h: 3.5 }
        );
      }
    });
  }

  // 8. KPI
  let sl8 = pres.addSlide();
  sl8.background = bg;
  sl8.addText('Success Metrics (KPI)', titleProps);
  sl8.addText("Primary Goal", { x: 0.5, y: 1.5, fontSize: 18, color: '2563EB', bold: true });
  sl8.addText(data.kpi?.primary || '', { x: 0.5, y: 2, fontSize: 32, bold: true });
  sl8.addText("Secondary Metrics", { x: 0.5, y: 3.5, fontSize: 16, color: '64748B', bold: true });
  sl8.addText(data.kpi?.secondaryMetrics?.join('  |  ') || '', { x: 0.5, y: 4, fontSize: 14 });

  pres.writeFile({ fileName: `${data.strategy?.coreStrategy?.substring(0, 20).replace(/\s+/g, '_') || 'Prop_Strategy'}.pptx` });
};
