// Match the collection transport exactly; downloaded/local and GitHub builds
// must never describe their device-only analytics as automatic server upload.
export const isServerAnalyticsHost=hostname=>hostname==='professor-maker.gahyoun.chatgpt.site';
export function analyticsConsentCopy(locale='ko',hostname=globalThis.location?.hostname??''){
 const server=isServerAnalyticsHost(hostname),en=locale==='en';
 return {
  scope:server?'server':'device',
  sharing:en?'Anonymous data may be shared with research collaborators.':'익명 데이터가 연구 협력자와 공유될 수 있음',
  label:en?(server?'Allow anonymous analytics to be sent to the creator’s server and shared with research collaborators (optional).':'Allow anonymous analytics to be stored on this device (optional).'):(server?'익명 분석 기록을 제작자 서버로 전송하고 연구 협력자와 공유하는 데 동의합니다 (선택).':'익명 분석 기록을 이 기기에 저장하는 데 동의합니다 (선택).'),
  summary:en?'What is recorded and where':'기록 범위·저장 위치 안내',
  paragraphs:en?[
   'For game balance analysis by Gahyoun Gim: a random run ID, field, institution and lab type, monthly choices, fictional game statistics, research outcomes and endings. Names and contact details are excluded.',
   server?'Sites edition: only with this consent, analytics are stored on this device and automatically sent to the creator’s Cloudflare D1 database. Without consent, analytics are neither recorded nor sent.':'GitHub and downloaded/local editions: only with this consent, analytics are stored in this browser. They are not automatically sent to the creator. You choose whether to export a file and share it.',
   'Sharing applies to anonymous data sent to the Sites server or voluntarily provided to the creator. Device-only GitHub/local records are not automatically shared.',
   'Your game progress, letters and checkpoints stay in this browser in either edition. Analytics are not a cloud save. Use game JSON export/import to move progress; each site address and language edition keeps separate saves.',
   server?'Server analytics leave the analysis dataset 90 days after run registration; expired rows are then deleted in batches on later run-registration or administrator requests. Turning consent off deletes device analytics and requests deletion of server records. A failed server deletion needs a retry. You can play without consent.':'Turning consent off deletes analytics on this device. It does not delete game progress. You can play without consent.'
  ]:[
   '제작자 김가현의 게임 밸런스 분석용: 무작위 실행 ID·전공·학교 유형·연구 방식·월별 선택·가상 게임 수치·연구 성과·엔딩. 이름·연락처는 제외합니다.',
   server?'Sites판: 이 동의가 있을 때만 분석 기록을 이 기기에 저장하고 제작자의 Cloudflare D1 서버로 자동 전송합니다. 동의하지 않으면 분석 기록을 수집·전송하지 않습니다.':'GitHub판·다운로드한 로컬판: 이 동의가 있을 때만 분석 기록을 이 브라우저에 저장합니다. 제작자에게 자동 전송하지 않습니다. 파일을 내보내 직접 제공할지는 유저가 결정합니다.',
   '공유 대상은 Sites 서버로 전송하거나 제작자에게 직접 제공한 익명 데이터입니다. GitHub·로컬 기기에만 남은 기록은 자동으로 공유되지 않습니다.',
   '게임 진행·편지·월별 저장점은 두 버전 모두 이 브라우저에 남습니다. 분석 기록은 클라우드 세이브가 아닙니다. 진행을 옮기려면 게임 JSON 내보내기·불러오기를 사용하세요. 사이트 주소와 언어판마다 저장은 별도입니다.',
   server?'서버 분석 기록은 회차 등록 후 90일이 지나면 분석 대상에서 제외하고, 이후 신규 회차 등록·관리자 요청 때 순차 삭제합니다. 동의를 해제하면 기기 내 분석 기록을 삭제하고 서버 기록의 삭제를 요청합니다. 서버 삭제가 실패하면 재시도가 필요합니다. 동의하지 않아도 플레이할 수 있습니다.':'동의를 해제하면 이 기기의 분석 기록이 삭제되며 게임 진행은 유지됩니다. 동의하지 않아도 플레이할 수 있습니다.'
  ],
  enabledStatus:en?(server?'Consented analytics: saved on this device and sent to the creator’s server.':'Consented analytics: device-only storage; no automatic upload.'):(server?'동의한 분석 기록: 기기 저장 및 제작자 서버 전송.':'동의한 분석 기록: 기기 저장 · 자동 전송 없음.'),
  disabledStatus:en?'Analytics off · game progress stays on this device.':'분석 기록 동의 안 함 · 게임 진행은 기기에 저장됩니다.'
 };
}
