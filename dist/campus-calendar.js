// Simplified game calendars, not a university's exact dates or grant deadlines.
// The U.S. edition follows a September academic year with January spring classes
// and May finals: https://registrar.fas.harvard.edu/calendars
const policy = value => Object.freeze(Object.fromEntries(Object.entries(value).map(([key,entry])=>[key,Array.isArray(entry)?Object.freeze(entry):entry])));
const POLICIES = Object.freeze({
 ko:policy({startMonth:3,stipendMonth:3,breakMonths:[1,2,7,8],midtermMonths:[4,10],finalMonths:[6,12],conferenceMonths:[4,10],grantMonths:[3,9],abstractMonths:[1,7],travelMonths:[2,8],workshopMonths:[1,7],termStartMonths:[3,9]}),
 en:policy({startMonth:9,stipendMonth:9,breakMonths:[6,7,8],midtermMonths:[3,10],finalMonths:[5,12],conferenceMonths:[4,10],grantMonths:[3,9],abstractMonths:[6,7],travelMonths:[7,8],workshopMonths:[6,7],termStartMonths:[9,1]}),
});
const localeOf = localeOrState => (typeof localeOrState==='string'?localeOrState:localeOrState?.locale)==='en'?'en':'ko';
export const campusPolicy = localeOrState => POLICIES[localeOf(localeOrState)];
// `month` is the run's normalized zero-based month, as in state.month.
export function campusMonth(month,localeOrState='ko'){return ((month+campusPolicy(localeOrState).startMonth-1)%12+12)%12+1;}
export const isCampusBreak = (month,localeOrState='ko') => campusPolicy(localeOrState).breakMonths.includes(campusMonth(month,localeOrState));
export function campusSemester(month,localeOrState='ko'){
 const actual=campusMonth(month,localeOrState);
 if(localeOf(localeOrState)==='en')return actual>=9?'Fall semester':actual<=5?'Spring semester':'Summer break';
 return actual>=3&&actual<=6?'1학기':actual>=9?'2학기':actual<=2?'겨울방학':'여름방학';
}
