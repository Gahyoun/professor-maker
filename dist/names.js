// Source-limited fictional names. Counts are facts; the sampling policy is game design.
// This is NOT a complete 1995–2005 birth-cohort distribution.
export const NAME_PROVENANCE = {
  givenNames: {
    cohort: 1995,
    scope: 'Top ten names for each recorded sex among 1995-born people, as reported in 2014',
    status: 'Supreme Court figures reported by news outlets; primary archive not retrieved',
    sources: [
      'https://news.sbs.co.kr/news/endPage.do?news_id=N1002506958',
      'https://www.mk.co.kr/news/society/6207963',
    ],
    limitation: '1996–2005 annual frequency tables are not verified. Counts are restricted to the listed names, not all births or STEM students.',
  },
  surnames: {
    year: 2015,
    scope: 'Top ten surnames in the all-age Korean-national population census',
    status: 'Official KOSIS publication',
    sources: ['https://kosis.kr/webtoon/images/idx103/103.html'],
    limitation: 'Not a birth cohort or STEM sample. Rounded proportions cover 63.9% of the population.',
  },
  sampling: 'Select among listed surnames using their published proportions, then among listed given names using reported counts; normalize each limited pool. Draws are independent game assumptions, not an observed full-name distribution.',
};

const entries = values => values.map(([name, weight]) => Object.freeze({ name, weight }));
export const KOREAN_NAME_POOLS = {
  male: entries([
    ['지훈', 2790], ['동현', 2422], ['현우', 2253], ['준영', 1828], ['재현', 1746],
    ['성민', 1704], ['성현', 1693], ['승현', 1685], ['준호', 1668], ['민수', 1643],
  ]),
  female: entries([
    ['유진', 4208], ['민지', 4199], ['지은', 4140], ['지현', 3748], ['지원', 3370],
    ['수진', 3240], ['지혜', 3170], ['은지', 3133], ['수빈', 3104], ['지영', 3028],
  ]),
  surname: entries([
    ['김', 21.5], ['이', 14.7], ['박', 8.4], ['최', 4.7], ['정', 4.3],
    ['강', 2.4], ['조', 2.1], ['윤', 2.1], ['장', 2.0], ['임', 1.7],
  ]),
};

function unit(seed, namespace) {
  let n = 2166136261;
  for (const c of `${seed}:name:${namespace}`) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  // Final avalanche avoids short numeric seeds sharing nearly identical draws.
  n ^= n >>> 16; n = Math.imul(n, 0x7feb352d); n ^= n >>> 15;
  n = Math.imul(n, 0x846ca68b); n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
function weighted(pool, draw) {
  let remaining = draw * pool.reduce((sum, x) => sum + x.weight, 0);
  for (const x of pool) { remaining -= x.weight; if (remaining < 0) return x.name; }
  return pool[pool.length - 1].name;
}

// Never consumes the engine RNG or changes a student's attributes.
// Gender affects the historical name pool only; it does not infer personality.
export function generateNameRecord(seed, gender = 'unspecified') {
  const poolGender = gender === 'male' || gender === 'female'
    ? gender : unit(seed, 'pool') < 0.5 ? 'male' : 'female';
  const surname = weighted(KOREAN_NAME_POOLS.surname, unit(seed, 'surname'));
  const givenName = weighted(KOREAN_NAME_POOLS[poolGender], unit(seed, 'given'));
  return { name: surname + givenName, surname, givenName, poolGender, sourceCohort: 1995 };
}
export function generateKoreanName(seed, gender = 'unspecified') {
  return generateNameRecord(seed, gender).name;
}
export const generateStudentName = generateKoreanName;
