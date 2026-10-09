// Original fictional venues. IF and tiers are game metrics, never actual journal statistics.
export const JOURNALS=Object.freeze({standard:{label:'기초 연구 저널',impactFactor:1.8,work:1,acceptance:0},established:{label:'분야 전문 저널',impactFactor:4.2,work:1.15,acceptance:-.09},leading:{label:'선도 연구 저널',impactFactor:8,work:1.3,acceptance:-.18}});
export const CONFERENCE_TIERS=Object.freeze({regular:{label:'분야 학술대회 · C',work:1,acceptance:0,learning:1},selective:{label:'선별 학술대회 · B',work:1.18,acceptance:-.09,learning:1.15},flagship:{label:'주요 학술대회 · A',work:1.4,acceptance:-.18,learning:1.3}});
export const DEFAULT_PUBLICATION=Object.freeze({journal:'standard',conference:'regular'});
export const validPublication=p=>p&&Object.keys(p).length===2&&Object.hasOwn(JOURNALS,p.journal)&&Object.hasOwn(CONFERENCE_TIERS,p.conference);
