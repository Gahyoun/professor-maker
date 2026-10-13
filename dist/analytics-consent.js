import {ANALYTICS_RETENTION_YEARS} from './analytics-policy.js';
// Match the collection transport exactly; downloaded/local and GitHub builds
// must never describe their device-only analytics as automatic server upload.
export const isServerAnalyticsHost=hostname=>hostname==='professor-maker.gahyoun.chatgpt.site';
export function analyticsConsentCopy(locale='ko',hostname=globalThis.location?.hostname??''){
 const server=isServerAnalyticsHost(hostname),en=locale==='en';
 return {
  scope:server?'server':'device',
  sharing:en?'Anonymous data may be shared with research collaborators.':'익명 데이터가 연구 협력자와 공유될 수 있음',
  label:en?(server?`Allow anonymous analytics to be sent to the creator’s server, retained for up to ${ANALYTICS_RETENTION_YEARS} years and shared with research collaborators (optional).`:'Allow anonymous analytics to be stored on this device (optional).'):(server?`익명 분석 기록을 제작자 서버로 전송하고 최대 ${ANALYTICS_RETENTION_YEARS}년 보관 및 연구 협력자와 공유하는 데 동의합니다 (선택).`:'익명 분석 기록을 이 기기에 저장하는 데 동의합니다 (선택).'),
  summary:en?'What is recorded and where':'기록 범위·저장 위치 안내',
  paragraphs:en?[
   'For game balance analysis by Gahyoun Gim: a random run ID, edition (Korea or North America), field, institution and lab type, monthly choices, fictional game statistics, research outcomes and endings. Names and contact details are excluded.',
   server?'Sites edition: only with this consent, analytics are stored on this device and automatically sent to the creator’s Cloudflare D1 database. Without consent, analytics are neither recorded nor sent.':'GitHub and downloaded/local editions: only with this consent, analytics are stored in this browser. They are not automatically sent to the creator. You choose whether to export a file and share it.',
   server?'Failed uploads wait on this device and retry on reopening the site or reconnecting. You can view the status and retry in Save manager. If device storage is unavailable, server upload is still attempted, but pending records and deletion credentials may not survive closing the page.':'Device analytics can be exported as a file; exporting does not send the file to the creator.',
   'Sharing applies to anonymous data sent to the Sites server or voluntarily provided to the creator. Device-only GitHub/local records are not automatically shared.',
   'Your game progress, letters and checkpoints stay in this browser in either edition. Analytics are not a cloud save. Use game JSON export/import to move progress; each site address and language edition keeps separate saves.',
   server?`Newly consented server analytics are retained for up to ${ANALYTICS_RETENTION_YEARS} years from run registration. They are deleted earlier if the analysis purpose is completed. At the deadline they leave the analysis dataset; a daily cloud task at 3:00 a.m. Korea time deletes expired rows, even when nobody visits or calls the game API. Physical deletion occurs in the next daily sweep (normally within 24 hours), with retries for failures. The five-year policy requires fresh consent: previous 90-day consent is not carried over, and records collected under the previous policy are discarded. Turning consent off deletes device analytics and requests deletion of server records, even if their upload token has expired. Failed server deletion needs a retry. You can play without consent.`:'The updated policy requires fresh consent; previous analytics are discarded. Turning consent off deletes analytics on this device. It does not delete game progress. You can play without consent.'
  ]:[
   '제작자 김가현의 게임 밸런스 분석용: 무작위 실행 ID·한국판/북미판 구분·전공·학교 유형·연구 방식·월별 선택·가상 게임 수치·연구 성과·엔딩. 이름·연락처는 제외합니다.',
   server?'Sites판: 이 동의가 있을 때만 분석 기록을 이 기기에 저장하고 제작자의 Cloudflare D1 서버로 자동 전송합니다. 동의하지 않으면 분석 기록을 수집·전송하지 않습니다.':'GitHub판·다운로드한 로컬판: 이 동의가 있을 때만 분석 기록을 이 브라우저에 저장합니다. 제작자에게 자동 전송하지 않습니다. 파일을 내보내 직접 제공할지는 유저가 결정합니다.',
   server?'전송 실패 기록은 이 기기에 대기시키고 재접속·온라인 복귀 때 다시 보냅니다. 저장 관리에서 상태 확인과 재시도가 가능합니다. 기기 저장이 불가능해도 서버 전송은 시도하지만 페이지를 닫으면 대기 기록·삭제 토큰을 보존하지 못할 수 있습니다.':'기기 분석 기록은 파일로 내보낼 수 있으며, 내보내기만으로 제작자에게 전달되지 않습니다.',
   '공유 대상은 Sites 서버로 전송하거나 제작자에게 직접 제공한 익명 데이터입니다. GitHub·로컬 기기에만 남은 기록은 자동으로 공유되지 않습니다.',
   '게임 진행·편지·월별 저장점은 두 버전 모두 이 브라우저에 남습니다. 분석 기록은 클라우드 세이브가 아닙니다. 진행을 옮기려면 게임 JSON 내보내기·불러오기를 사용하세요. 사이트 주소와 언어판마다 저장은 별도입니다.',
   server?`새로 동의한 서버 분석 기록은 회차 등록일로부터 최대 ${ANALYTICS_RETENTION_YEARS}년 보관하며, 분석 목적이 끝나면 더 일찍 삭제합니다. 만료일에는 분석 대상에서 제외하고 매일 한국 시간 새벽 3시 클라우드 예약 작업으로 만료 행을 삭제합니다. 방문·게임 API 요청이 없어도 실행하며 실제 삭제는 다음 일일 정리 때 이루어집니다(정상 실행 시 최대 24시간 이내, 실패 시 재시도). 5년 정책에는 새 동의가 필요하며 이전 90일 동의를 이어받지 않고 이전 정책의 분석 기록은 폐기합니다. 동의를 해제하면 기기 내 분석 기록을 삭제하고 업로드 토큰이 만료된 서버 기록도 삭제 요청합니다. 서버 삭제가 실패하면 재시도가 필요합니다. 동의하지 않아도 플레이할 수 있습니다.`:'정책 변경으로 새 동의가 필요하며 이전 분석 기록은 폐기합니다. 동의를 해제하면 이 기기의 분석 기록이 삭제되며 게임 진행은 유지됩니다. 동의하지 않아도 플레이할 수 있습니다.'
  ],
  enabledStatus:en?(server?'Consented analytics: saved on this device and sent to the creator’s server.':'Consented analytics: device-only storage; no automatic upload.'):(server?'동의한 분석 기록: 기기 저장 및 제작자 서버 전송.':'동의한 분석 기록: 기기 저장 · 자동 전송 없음.'),
  disabledStatus:en?'Analytics off · game progress stays on this device.':'분석 기록 동의 안 함 · 게임 진행은 기기에 저장됩니다.'
 };
}
