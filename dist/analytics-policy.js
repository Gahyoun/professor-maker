// Consent is versioned separately from the game schema. A previous opt-in
// must never silently authorize a longer retention period.
export const ANALYTICS_POLICY_VERSION='anonymous-gameplay-five-years-v2';
export const ANALYTICS_EXPORT_FORMAT='professor-maker-anonymous-v2';
export const ANALYTICS_RETENTION_YEARS=5;
export const ANALYTICS_TOKEN_DAYS=90;

export function analyticsRetentionUntil(createdAt){
 if(!Number.isSafeInteger(createdAt)||createdAt<0)throw new RangeError('Invalid analytics registration time');
 const created=new Date(createdAt);
 if(!Number.isFinite(created.getTime()))throw new RangeError('Invalid analytics registration time');
 const year=created.getUTCFullYear()+ANALYTICS_RETENTION_YEARS,month=created.getUTCMonth();
 const lastDay=new Date(Date.UTC(year,month+1,0)).getUTCDate();
 const expiry=new Date(createdAt);
 // Clamp February 29 to February 28 instead of JavaScript's March rollover.
 expiry.setUTCDate(1);expiry.setUTCFullYear(year);expiry.setUTCMonth(month);
 expiry.setUTCDate(Math.min(created.getUTCDate(),lastDay));
 if(!Number.isFinite(expiry.getTime()))throw new RangeError('Invalid analytics retention deadline');
 return expiry.getTime();
}
