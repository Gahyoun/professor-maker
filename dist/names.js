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


// Version 2 is a hand-curated fictional cast, not census frequencies. Every
// given name is an authored whole name; syllables are never randomly combined.
export const CURRENT_NAMING_VERSION=2;
export const CURRENT_US_NAMING_VERSION=3;
export const currentNamingVersion=locale=>locale==='en'?CURRENT_US_NAMING_VERSION:CURRENT_NAMING_VERSION;
export const CURATED_NAME_PROVENANCE=Object.freeze({
 version:2,status:'Hand-curated plausible fictional Korean student names',
 sampling:'Given names are sampled uniformly within authored pools. Surname weights are author-assigned game variety choices, not measured demographic frequencies.',
 limitation:'Not an exhaustive name list, birth-cohort distribution, or gender-identity classifier. All original version-1 names and share codes remain available.'
});
export const CURATED_KOREAN_NAME_POOLS=Object.freeze({
 male:Object.freeze(["지훈", "동현", "현우", "준영", "재현", "성민", "성현", "승현", "준호", "민수", "민준", "서준", "하준", "도윤", "예준", "시우", "은우", "지호", "주원", "지후", "이준", "윤우", "건우", "우진", "현준", "선우", "유준", "정우", "승우", "준서", "지한", "민재", "은호", "수호", "연우", "태오", "시윤", "유찬", "지율", "시온", "도현", "지환", "태윤", "태민", "재윤", "재민", "준혁", "민규", "준우", "진우", "지성", "성준", "승민", "태준", "현수", "재원", "도원", "수현", "규민", "한결", "하람", "우현", "서진", "현석", "태현", "건희", "찬우", "민석", "영민", "영준", "주영", "동하", "동우", "수민", "기현", "재영", "재호", "태영", "정민", "준수", "지섭", "세준", "세현", "성훈", "영훈", "승훈", "우성", "승준", "기훈", "경민", "상우", "상현", "정현", "원준", "원우", "성우", "유건", "찬영", "하진", "태경", "동준", "성빈", "정훈", "대현", "경준", "태웅", "지안"].map(name=>Object.freeze({name,weight:1}))),
 female:Object.freeze(["유진", "민지", "지은", "지현", "지원", "수진", "지혜", "은지", "수빈", "지영", "서연", "서윤", "지우", "서현", "민서", "하은", "하윤", "윤서", "지민", "채원", "지유", "예은", "수아", "소윤", "지아", "예린", "다은", "서영", "예원", "수연", "하린", "나은", "가은", "주아", "시아", "소연", "유나", "채은", "민아", "윤아", "다인", "가영", "혜원", "은서", "다현", "소현", "나윤", "연서", "예나", "채윤", "지수", "은채", "소은", "유정", "수지", "정은", "승아", "세은", "시은", "아영", "나연", "도연", "소영", "정민", "선영", "선아", "세영", "혜진", "은영", "주연", "유빈", "효진", "혜림", "연우", "하연", "예진", "소희", "가연", "가희", "보경", "다영", "하영", "채린", "지연", "민경", "수정", "현지", "서진", "수현", "재은", "유림", "해원", "은솔", "한별", "하늘", "보라", "다솜", "슬기", "아름", "하나", "샛별", "나래", "설아", "로아", "서하", "지안", "하경", "혜윤", "민정", "세연", "예슬", "희원", "유리"].map(name=>Object.freeze({name,weight:1}))),
 surname:Object.freeze([["김", 10], ["이", 8], ["박", 6], ["최", 4], ["정", 4], ["강", 3], ["조", 3], ["윤", 3], ["장", 2], ["임", 2], ["한", 2], ["오", 2], ["서", 2], ["신", 2], ["권", 2], ["황", 2], ["안", 2], ["송", 2], ["전", 2], ["홍", 2], ["유", 2], ["고", 2], ["문", 2], ["양", 2], ["손", 2], ["배", 2], ["백", 2], ["허", 2], ["남", 2], ["심", 2], ["노", 1], ["하", 1], ["곽", 1], ["성", 1], ["차", 1], ["주", 1], ["우", 1], ["구", 1], ["민", 1], ["진", 1], ["지", 1], ["엄", 1], ["채", 1], ["원", 1], ["천", 1], ["방", 1], ["공", 1], ["현", 1], ["함", 1], ["변", 1], ["염", 1], ["여", 1], ["추", 1], ["도", 1], ["소", 1], ["석", 1], ["설", 1], ["선", 1], ["모", 1]].map(([name,weight])=>Object.freeze({name,weight})))
});
export const validNamingVersion=value=>value===1||value===2||value===3;

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
export function generateNameRecord(seed, gender = 'unspecified', namingVersion = 1, variant = 0) {
  if(![1,2].includes(namingVersion)||!Number.isInteger(variant)||variant<0)throw new Error('Invalid naming version or variant.');
  if(namingVersion===2){
    const suffix=variant?`:${variant}`:'',poolGender=gender==='male'||gender==='female'?gender:unit(seed,'v2-pool'+suffix)<.5?'male':'female';
    const surname=weighted(CURATED_KOREAN_NAME_POOLS.surname,unit(seed,'v2-surname'+suffix)),givenName=weighted(CURATED_KOREAN_NAME_POOLS[poolGender],unit(seed,'v2-given'+suffix));
    return {name:surname+givenName,surname,givenName,poolGender,namingVersion:2,sourceCohort:null};
  }
  const poolGender = gender === 'male' || gender === 'female'
    ? gender : unit(seed, 'pool') < 0.5 ? 'male' : 'female';
  const surname = weighted(KOREAN_NAME_POOLS.surname, unit(seed, 'surname'));
  const givenName = weighted(KOREAN_NAME_POOLS[poolGender], unit(seed, 'given'));
  return { name: surname + givenName, surname, givenName, poolGender, sourceCohort: 1995 };
}
export function generateKoreanName(seed, gender = 'unspecified', namingVersion = 1, variant = 0) {
  return generateNameRecord(seed, gender, namingVersion, variant).name;
}
// Fictional English-language name pool: not a demographic sample or a prediction.
const ENGLISH_SURNAMES=['Morgan','Patel','Chen','Williams','Rivera','Kim','Reed','Nguyen','Brooks','Singh','Bennett','Diaz'];
const ENGLISH_GIVEN={male:['Ethan','Noah','Oliver','Lucas','Daniel','Miles','Henry','Adrian','Julian','Leo'],female:['Maya','Olivia','Sofia','Amelia','Chloe','Nora','Zoe','Isabel','Leah','Audrey'],unspecified:['Alex','Jordan','Taylor','Casey','Riley','Sam','Avery','Morgan','Cameron','Quinn']};
export function generateEnglishName(seed,gender='unspecified',variant=0){
 if(!Number.isInteger(variant)||variant<0)throw new Error('Invalid name variant.');
 const suffix=variant?`:${variant}`:'';
 const pool=ENGLISH_GIVEN[gender]??ENGLISH_GIVEN.unspecified;
 return `${pool[Math.floor(unit(seed,'english-given'+suffix)*pool.length)]} ${ENGLISH_SURNAMES[Math.floor(unit(seed,'english-surname'+suffix)*ENGLISH_SURNAMES.length)]}`;
}
export function generateStudentName(seed,gender='unspecified',locale='ko',namingVersion=currentNamingVersion(locale),variant=0){if(!validNamingVersion(namingVersion)||locale!=='en'&&namingVersion===3)throw new Error('Invalid naming version for this edition.');return locale==='en'?(namingVersion===3?generateMulticulturalEnglishName(seed,gender,variant):generateEnglishName(seed,gender,variant)):generateKoreanName(seed,gender,namingVersion,variant);}

// Authored preferred full names for the North American fictional cast. No entry
// carries a race, nationality, citizenship or immigration-status classification.
// Names do not select a skin tone, background, ability, temperament or outcome.
export const US_NAME_PROVENANCE=Object.freeze({version:3,status:'Hand-curated multicultural fictional preferred names',sampling:'Uniform sampling of authored whole-name entries. Not a census distribution or a name-to-identity classifier.',limitation:'The spelling of a preferred name does not establish race, nationality, legal status, language proficiency or academic ability.'});
const fullNames=text=>Object.freeze(text.split('|').map(name=>name.trim()).filter(Boolean));
export const MULTICULTURAL_ENGLISH_NAME_POOLS=Object.freeze({
 male:fullNames('Ethan Morgan|Noah Williams|Oliver Reed|Lucas Bennett|Daniel Brooks|Miles Carter|Henry Anderson|Adrian Rivera|Julian Torres|Leo Martinez|Mateo Garcia|Gabriel Ortiz|Diego Flores|Nicolas Ramos|Andres Vega|Rafael Silva|Miguel Santos|Thiago Costa|Hugo Pereira|Luca Romano|Marco Rossi|Nico Weber|Jonas Fischer|Felix Laurent|Louis Moreau|Theo Martin|Maxim Novak|Ivan Petrov|Aleksander Nowak|Luka Kovac|Omar Hassan|Amir Rahman|Yusuf Ali|Adam Khalil|Samir Haddad|Karim Mansour|Rami Saleh|Zain Ahmed|Aarav Patel|Arjun Shah|Rohan Singh|Dev Mehta|Kiran Rao|Ravi Nair|Nikhil Desai|Ishaan Kapoor|Anish Joshi|Akash Iyer|Wei Chen|Ming Li|Jian Wang|Daniel Huang|Alex Lin|Kevin Wu|Jun Park|Minho Kim|Jiho Lee|Taehyun Choi|Kenji Tanaka|Hiro Sato|Ren Nakamura|Haruto Ito|Minh Nguyen|Khoa Tran|Anh Pham|Nam Le|Duy Hoang|Paolo Reyes|Luis Mendoza|Miguel Cruz|Jose Bautista|Rizky Pratama|Arif Rahman|Dimas Putra|Andre Wijaya|Emeka Okafor|Chidi Obi|Tunde Adeyemi|Kofi Mensah|Kwame Boateng|Daniel Adebayo|Samuel Ndlovu|Thabo Mokoena|Malik Johnson|Isaiah Brown|Elijah Washington|Jordan Robinson|Jalen Thompson|Micah Davis|Andre Jackson|Darius Walker|Kai Wilson|Owen Thomas|Caleb White|Isaac Lewis|Elias Scott'),
 female:fullNames('Maya Morgan|Olivia Williams|Amelia Reed|Chloe Bennett|Nora Brooks|Zoe Carter|Audrey Anderson|Isabel Rivera|Leah Torres|Sofia Martinez|Camila Garcia|Valentina Ortiz|Lucia Flores|Elena Ramos|Gabriela Vega|Beatriz Silva|Mariana Santos|Ana Costa|Clara Pereira|Giulia Romano|Alessia Rossi|Lena Weber|Mila Fischer|Amelie Laurent|Emma Moreau|Alice Martin|Anya Novak|Sofia Petrov|Zofia Nowak|Mia Kovac|Amina Hassan|Leila Rahman|Maryam Ali|Noor Khalil|Lina Haddad|Salma Mansour|Dalia Saleh|Zara Ahmed|Ananya Patel|Priya Shah|Simran Singh|Anika Mehta|Aditi Rao|Meera Nair|Kavya Desai|Isha Kapoor|Riya Joshi|Maya Iyer|Yue Chen|Lina Li|Jia Wang|Emma Huang|Grace Lin|Alice Wu|Minji Park|Jiyoon Kim|Soojin Lee|Yuna Choi|Hana Tanaka|Mei Sato|Rin Nakamura|Aiko Ito|Linh Nguyen|Mai Tran|Thao Pham|An Le|Chi Hoang|Isabel Reyes|Sofia Mendoza|Gabrielle Cruz|Andrea Bautista|Nadia Pratama|Aisha Rahman|Ayu Putra|Dewi Wijaya|Ada Okafor|Chiamaka Obi|Bola Adeyemi|Akua Mensah|Abena Boateng|Folasade Adebayo|Thandi Ndlovu|Lerato Mokoena|Aaliyah Johnson|Imani Brown|Naomi Washington|Jada Robinson|Brianna Thompson|Nia Davis|Jasmine Jackson|Amara Walker|Avery Wilson|Harper Thomas|Lucy White|Eva Lewis|Layla Scott'),
 unspecified:fullNames('Alex Morgan|Jordan Williams|Taylor Reed|Casey Bennett|Riley Brooks|Sam Carter|Avery Anderson|Morgan Rivera|Cameron Torres|Quinn Martinez|Alex Garcia|Dani Ortiz|Ari Flores|Andy Ramos|Angel Vega|Robin Silva|Charlie Santos|Noel Costa|Sasha Pereira|Luca Romano|Andrea Rossi|Kim Weber|Mika Fischer|Camille Laurent|Dominique Moreau|Claude Martin|Sasha Novak|Val Petrov|Alex Nowak|Niko Kovac|Noor Hassan|Sami Rahman|Amal Ali|Iman Khalil|Nour Haddad|Salam Mansour|Rayan Saleh|Zain Ahmed|Kiran Patel|Arya Shah|Harpreet Singh|Devin Mehta|Kiran Rao|Amrit Nair|Daksh Desai|Shaan Kapoor|Anmol Joshi|Sai Iyer|Wei Chen|Lin Li|Jin Wang|Alex Huang|Jamie Lin|Chris Wu|Jimin Park|Min Kim|Jiwoo Lee|Jisoo Choi|Haru Tanaka|Sora Sato|Ren Nakamura|Aoi Ito|Anh Nguyen|Minh Tran|An Pham|Thanh Le|Hai Hoang|Alex Reyes|Dani Mendoza|Sam Cruz|Lou Bautista|Ari Pratama|Dian Rahman|Ade Putra|Dwi Wijaya|Chidi Okafor|Nkem Obi|Bola Adeyemi|Sena Mensah|Esi Boateng|Toni Adebayo|Lindo Ndlovu|Lesedi Mokoena|Jordan Johnson|Taylor Brown|Avery Washington|Casey Robinson|Riley Thompson|Skyler Davis|Jules Jackson|Reese Walker|Kai Wilson|Rowan Thomas|Sage White|River Lewis|Quinn Scott')
});
export function generateMulticulturalEnglishName(seed,gender='unspecified',variant=0){
 if(!Number.isInteger(variant)||variant<0)throw new Error('Invalid name variant.');
 const pool=MULTICULTURAL_ENGLISH_NAME_POOLS[gender]??MULTICULTURAL_ENGLISH_NAME_POOLS.unspecified,suffix=variant?`:${variant}`:'';
 return pool[Math.floor(unit(seed,'english-v3-full-name'+suffix)*pool.length)];
}
