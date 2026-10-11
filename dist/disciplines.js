// Classification labels and codes transcribed from the user-supplied Ministry of Education classification workbook.
// Lab tracks and degree targets below are fictional game rules, not national degree regulations.
import {publicationPaceProfile} from './publication-pace.js';
export const DISCIPLINES = [
  {
    "id": "058",
    "label": "작물ㆍ원예학",
    "major": "자연과학",
    "group": "농림ㆍ수산",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "059",
    "label": "산림학",
    "major": "자연과학",
    "group": "농림ㆍ수산",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "060",
    "label": "축산학",
    "major": "자연과학",
    "group": "농림ㆍ수산",
    "labModes": [
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "061",
    "label": "수산학",
    "major": "자연과학",
    "group": "농림ㆍ수산",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "062",
    "label": "농림수산환경생태학",
    "major": "자연과학",
    "group": "농림ㆍ수산",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "063",
    "label": "농림수산바이오시스템공학",
    "major": "자연과학",
    "group": "농림ㆍ수산",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "064",
    "label": "식품공학",
    "major": "자연과학",
    "group": "농림ㆍ수산",
    "labModes": [
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "055",
    "label": "화학",
    "major": "자연과학",
    "group": "화학ㆍ생명과학ㆍ환경",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "056",
    "label": "생명과학",
    "major": "자연과학",
    "group": "화학ㆍ생명과학ㆍ환경",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "057",
    "label": "환경학",
    "major": "자연과학",
    "group": "화학ㆍ생명과학ㆍ환경",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "156",
    "label": "바이오테크놀로지학",
    "major": "자연과학",
    "group": "화학ㆍ생명과학ㆍ환경",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "066",
    "label": "식품영양학",
    "major": "자연과학",
    "group": "생활과학",
    "labModes": [
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "067",
    "label": "조리과학",
    "major": "자연과학",
    "group": "생활과학",
    "labModes": [
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "068",
    "label": "의류ㆍ의상학",
    "major": "자연과학",
    "group": "생활과학",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "069",
    "label": "주거학",
    "major": "자연과학",
    "group": "생활과학",
    "labModes": [
      "dry"
    ],
    "graduation": "paper"
  },
  {
    "id": "048",
    "label": "수학",
    "major": "자연과학",
    "group": "수학ㆍ물리ㆍ천문ㆍ지구",
    "labModes": [
      "dry"
    ],
    "graduation": "paper"
  },
  {
    "id": "049",
    "label": "통계학",
    "major": "자연과학",
    "group": "수학ㆍ물리ㆍ천문ㆍ지구",
    "labModes": [
      "dry"
    ],
    "graduation": "paper"
  },
  {
    "id": "050",
    "label": "물리학",
    "major": "자연과학",
    "group": "수학ㆍ물리ㆍ천문ㆍ지구",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "051",
    "label": "천문ㆍ대기과학",
    "major": "자연과학",
    "group": "수학ㆍ물리ㆍ천문ㆍ지구",
    "labModes": [
      "dry"
    ],
    "graduation": "paper"
  },
  {
    "id": "052",
    "label": "지구ㆍ지질학",
    "major": "자연과학",
    "group": "수학ㆍ물리ㆍ천문ㆍ지구",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "053",
    "label": "해양학",
    "major": "자연과학",
    "group": "수학ㆍ물리ㆍ천문ㆍ지구",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "112",
    "label": "간호학",
    "major": "자연과학",
    "group": "간호",
    "labModes": [
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "113",
    "label": "보건학",
    "major": "자연과학",
    "group": "보건",
    "labModes": [
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "114",
    "label": "재활치료",
    "major": "자연과학",
    "group": "보건",
    "labModes": [
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "115",
    "label": "임상보건",
    "major": "자연과학",
    "group": "보건",
    "labModes": [
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "116",
    "label": "보건관리",
    "major": "자연과학",
    "group": "보건",
    "labModes": [
      "dry"
    ],
    "graduation": "paper"
  },
  {
    "id": "118",
    "label": "피부미용",
    "major": "자연과학",
    "group": "보건",
    "labModes": [
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "163",
    "label": "동물보건",
    "major": "자연과학",
    "group": "보건",
    "labModes": [
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "110",
    "label": "약학",
    "major": "자연과학",
    "group": "약학",
    "labModes": [
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "111",
    "label": "한약학",
    "major": "자연과학",
    "group": "약학",
    "labModes": [
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "084",
    "label": "전기공학",
    "major": "공학",
    "group": "전기ㆍ전자ㆍ컴퓨터",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "mixed"
  },
  {
    "id": "085",
    "label": "전자공학",
    "major": "공학",
    "group": "전기ㆍ전자ㆍ컴퓨터",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "mixed"
  },
  {
    "id": "086",
    "label": "제어계측공학",
    "major": "공학",
    "group": "전기ㆍ전자ㆍ컴퓨터",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "mixed"
  },
  {
    "id": "087",
    "label": "광학공학",
    "major": "공학",
    "group": "전기ㆍ전자ㆍ컴퓨터",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "088",
    "label": "의공학",
    "major": "공학",
    "group": "전기ㆍ전자ㆍ컴퓨터",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "mixed"
  },
  {
    "id": "089",
    "label": "응용소프트웨어공학",
    "major": "공학",
    "group": "전기ㆍ전자ㆍ컴퓨터",
    "labModes": [
      "dry"
    ],
    "graduation": "conference"
  },
  {
    "id": "090",
    "label": "전산학ㆍ컴퓨터공학",
    "major": "공학",
    "group": "전기ㆍ전자ㆍ컴퓨터",
    "labModes": [
      "dry"
    ],
    "graduation": "conference"
  },
  {
    "id": "091",
    "label": "정보ㆍ통신공학",
    "major": "공학",
    "group": "전기ㆍ전자ㆍ컴퓨터",
    "labModes": [
      "dry"
    ],
    "graduation": "mixed"
  },
  {
    "id": "157",
    "label": "인공지능공학",
    "major": "공학",
    "group": "전기ㆍ전자ㆍ컴퓨터",
    "labModes": [
      "dry"
    ],
    "graduation": "conference"
  },
  {
    "id": "072",
    "label": "건축학",
    "major": "공학",
    "group": "건설",
    "labModes": [
      "dry"
    ],
    "graduation": "paper"
  },
  {
    "id": "073",
    "label": "건축공학",
    "major": "공학",
    "group": "건설",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "074",
    "label": "조경학",
    "major": "공학",
    "group": "건설",
    "labModes": [
      "dry"
    ],
    "graduation": "paper"
  },
  {
    "id": "075",
    "label": "토목공학",
    "major": "공학",
    "group": "건설",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "076",
    "label": "도시공학",
    "major": "공학",
    "group": "건설",
    "labModes": [
      "dry"
    ],
    "graduation": "paper"
  },
  {
    "id": "077",
    "label": "환경공학",
    "major": "공학",
    "group": "건설",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "102",
    "label": "산업공학",
    "major": "공학",
    "group": "산업ㆍ안전",
    "labModes": [
      "dry"
    ],
    "graduation": "mixed"
  },
  {
    "id": "103",
    "label": "안전공학",
    "major": "공학",
    "group": "산업ㆍ안전",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "104",
    "label": "방재공학",
    "major": "공학",
    "group": "산업ㆍ안전",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "092",
    "label": "금속공학",
    "major": "공학",
    "group": "재료",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "093",
    "label": "반도체공학",
    "major": "공학",
    "group": "재료",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "094",
    "label": "신소재공학",
    "major": "공학",
    "group": "재료",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "095",
    "label": "세라믹공학",
    "major": "공학",
    "group": "재료",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "096",
    "label": "재료공학",
    "major": "공학",
    "group": "재료",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "078",
    "label": "기계공학",
    "major": "공학",
    "group": "기계",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "079",
    "label": "메카트로닉스공학",
    "major": "공학",
    "group": "기계",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "080",
    "label": "조선ㆍ해양공학",
    "major": "공학",
    "group": "기계",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "081",
    "label": "항공ㆍ우주공학",
    "major": "공학",
    "group": "기계",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "082",
    "label": "철도공학",
    "major": "공학",
    "group": "기계",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "083",
    "label": "자동차공학",
    "major": "공학",
    "group": "기계",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "097",
    "label": "화학공학",
    "major": "공학",
    "group": "화공ㆍ고분자ㆍ에너지",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "098",
    "label": "에너지공학",
    "major": "공학",
    "group": "화공ㆍ고분자ㆍ에너지",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "099",
    "label": "고분자공학",
    "major": "공학",
    "group": "화공ㆍ고분자ㆍ에너지",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "100",
    "label": "생명공학",
    "major": "공학",
    "group": "화공ㆍ고분자ㆍ에너지",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "101",
    "label": "섬유공학",
    "major": "공학",
    "group": "화공ㆍ고분자ㆍ에너지",
    "labModes": [
      "dry",
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "158",
    "label": "교통시스템공학",
    "major": "공학",
    "group": "교통ㆍ수송",
    "labModes": [
      "dry"
    ],
    "graduation": "paper"
  },
  {
    "id": "159",
    "label": "철도운전제어학",
    "major": "공학",
    "group": "교통ㆍ수송",
    "labModes": [
      "dry"
    ],
    "graduation": "paper"
  },
  {
    "id": "160",
    "label": "선박운항학",
    "major": "공학",
    "group": "교통ㆍ수송",
    "labModes": [
      "dry"
    ],
    "graduation": "paper"
  },
  {
    "id": "161",
    "label": "항공운항학",
    "major": "공학",
    "group": "교통ㆍ수송",
    "labModes": [
      "dry"
    ],
    "graduation": "paper"
  },
  {
    "id": "162",
    "label": "무인항공기(운항)학",
    "major": "공학",
    "group": "교통ㆍ수송",
    "labModes": [
      "dry"
    ],
    "graduation": "paper"
  },
  {
    "id": "065",
    "label": "수의학",
    "major": "의학",
    "group": "의료",
    "labModes": [
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "107",
    "label": "의학",
    "major": "의학",
    "group": "의료",
    "labModes": [
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "108",
    "label": "치의학",
    "major": "의학",
    "group": "의료",
    "labModes": [
      "wet"
    ],
    "graduation": "paper"
  },
  {
    "id": "109",
    "label": "한의학",
    "major": "의학",
    "group": "의료",
    "labModes": [
      "wet"
    ],
    "graduation": "paper"
  }
];
// English labels are presentation metadata; original classification codes and labels stay intact.
const ENGLISH_DISCIPLINES=Object.freeze({"058": "Crop and Horticultural Science", "059": "Forestry", "060": "Animal Science", "061": "Fisheries and Aquaculture", "062": "Agricultural and Aquatic Ecology", "063": "Agricultural Biosystems Engineering", "064": "Food Engineering", "055": "Chemistry", "056": "Life Sciences", "057": "Environmental Science", "156": "Biotechnology", "066": "Nutrition and Food Science", "067": "Culinary Science", "068": "Textiles and Apparel", "069": "Housing and Living Environments", "048": "Mathematics", "049": "Statistics", "050": "Physics", "051": "Astronomy and Atmospheric Science", "052": "Earth Science and Geology", "053": "Oceanography", "112": "Nursing", "113": "Public Health", "114": "Rehabilitation Sciences", "115": "Clinical Health Sciences", "116": "Health Administration", "118": "Cosmetic Science", "163": "Animal Health", "110": "Pharmaceutical Sciences", "111": "Herbal Pharmacology", "084": "Electrical Engineering", "085": "Electronic Engineering", "086": "Control and Instrumentation Engineering", "087": "Optical Engineering", "088": "Biomedical Engineering", "089": "Software Engineering", "090": "Computer Science and Engineering", "091": "Information and Communications Engineering", "157": "Artificial Intelligence Engineering", "072": "Architecture", "073": "Architectural Engineering", "074": "Landscape Architecture", "075": "Civil Engineering", "076": "Urban Planning", "077": "Environmental Engineering", "102": "Industrial Engineering", "103": "Safety Engineering", "104": "Disaster Prevention Engineering", "092": "Metallurgical Engineering", "093": "Semiconductor Engineering", "094": "Advanced Materials Engineering", "095": "Ceramic Engineering", "096": "Materials Science and Engineering", "078": "Mechanical Engineering", "079": "Mechatronics", "080": "Naval Architecture and Ocean Engineering", "081": "Aerospace Engineering", "082": "Railway Engineering", "083": "Automotive Engineering", "097": "Chemical Engineering", "098": "Energy Engineering", "099": "Polymer Engineering", "100": "Bioengineering", "101": "Textile Engineering", "158": "Transportation Systems Engineering", "159": "Rail Operations and Control", "160": "Maritime Operations", "161": "Aviation Operations", "162": "Uncrewed Aircraft Systems", "065": "Veterinary Science", "107": "Medical Sciences", "108": "Dental Sciences", "109": "Traditional Medicine Research"});
const ENGLISH_GROUPS=Object.freeze({"자연과학": "Natural Sciences", "공학": "Engineering", "의학": "Medical Sciences", "농림ㆍ수산": "Agriculture, Forestry and Aquatic Sciences", "화학ㆍ생명과학ㆍ환경": "Chemistry, Life Sciences and Environment", "생활과학": "Human Ecology", "수학ㆍ물리ㆍ천문ㆍ지구": "Mathematical and Physical Sciences", "간호": "Nursing", "보건": "Health Sciences", "약학": "Pharmaceutical Sciences", "전기ㆍ전자ㆍ컴퓨터": "Electrical Engineering and Computing", "건설": "Built Environment", "산업ㆍ안전": "Industrial and Safety Engineering", "재료": "Materials", "기계": "Mechanical Engineering", "화공ㆍ고분자ㆍ에너지": "Chemical, Polymer and Energy Engineering", "교통ㆍ수송": "Transportation", "의료": "Medical Sciences"});
for(const discipline of DISCIPLINES)Object.assign(discipline,{labelEn:ENGLISH_DISCIPLINES[discipline.id],majorEn:ENGLISH_GROUPS[discipline.major],groupEn:ENGLISH_GROUPS[discipline.group]});
export function disciplineLabel(value,locale='ko'){const discipline=typeof value==='object'?value:getDiscipline(value);return locale==='en'?discipline.labelEn:discipline.label;}
export function getDiscipline(id="050"){return DISCIPLINES.find(d=>d.id===id)||DISCIPLINES.find(d=>d.id==="050");}
export function degreeTargets(fieldId,stage){const d=getDiscipline(fieldId),masters=stage==="masters",pace=publicationPaceProfile(d.id);if(stage==="undergrad")return {submissions:0,papers:0,conferences:0};if(d.graduation==="conference")return {submissions:masters?0:1,papers:masters?0:1,conferences:masters?2:pace.doctorateConferences??5};if(d.graduation==="mixed")return {submissions:masters?1:2,papers:masters?0:2,conferences:masters?1:4};const papers=pace.doctoratePapers??3;return {submissions:masters?1:papers,papers:masters?0:papers,conferences:masters?1:3};}
