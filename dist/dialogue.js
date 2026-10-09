// Original bilingual student voices. Abilities never appear as numeric dialogue.
const lines = text => text.trim().split('\n').map(row => { const [ko, en] = row.trim().split(' | '); return { ko, en }; });
export const DIALOGUES = {
  intro: lines(`
교수님, 실험 노트는 어느 정도 자세히 쓰면 될까요? 아직 첫 장을 못 넘겼어요. | Professor, how detailed should my notebook be? I still have not made it past the first page.
논문 제목은 읽었는데요, 모르는 단어가 제목보다 많아요. | I read the paper title. There are more unfamiliar words than words I understand.
연구실 문을 열기 전에 한 번 더 노크했어요. 들어와도 되는 시간인지 몰라서요. | I knocked once more before opening the door. I was not sure when it was okay to come in.
이번 달에는 우선, 제가 뭘 모르는지부터 알아보고 싶어요. | This month I would like to work out what I do not know yet.
수업 과제에는 정답이 있었는데, 여기서는 질문부터 만들어야 하네요. | My coursework had answers. Here I have to start by making a question.
계획은 적어 왔어요. 실험 시간을 얼마나 잡아야 할지는 아직 모르겠어요. | I brought a plan. I am still unsure how much time to allow for experiments.
장비 사용 교육부터 받고 싶어요. 괜히 만졌다가 고장 낼까 봐요. | I would like the equipment training first. I am worried I might break something.
선배가 읽어 보라고 준 논문이 있어요. 교수님도 이 방법을 쓰셨나요? | A senior student gave me a paper. Have you used this method too?
연구실에 제 이름이 붙은 자리가 생기니까 조금 실감이 나요. | Seeing my name on a desk makes being here feel a little more real.
제가 해도 되는 일과 먼저 여쭤봐야 하는 일을 구분해 보고 싶어요. | I would like to learn what I can do on my own and what I should ask about first.
`),
  success: lines(`
교수님, 이번에는 같은 조건에서 비슷한 결과가 나왔어요. 한 번만 나온 건 아니에요. | Professor, I got similar results under the same conditions this time. It was not just one lucky run.
지난번에 짚어 주신 부분을 바꾸니 그래프가 설명되기 시작했어요. | After changing the part you pointed out, the plot started to make sense.
원하는 모양이 나왔다고 끝내지 않고, 대조군도 다시 봤어요. | I did not stop when the plot looked right. I checked the controls again.
결과를 보여 드리러 오는 길이 오늘은 조금 짧게 느껴졌어요. | The walk to show you the results felt a little shorter today.
이번에는 제가 다음 실험도 제안해 봐도 될까요? | Could I suggest the next experiment this time?
설명하다 보니 제가 이 결과를 이해하고 있다는 게 느껴져요. | Explaining this makes me realize I understand the result.
잘된 이유를 알아야 다음에도 할 수 있을 것 같아서 노트를 다시 정리했어요. | I reorganized my notes. I need to know why it worked if I am to do it again.
지난달에는 안 보이던 차이가 이번에는 보여요. 측정 조건이 중요했네요. | I can see a difference I missed last month. The measurement conditions mattered.
오늘은 실패한 실험 얘기도 같이 드릴 수 있을 것 같아요. | Today I think I can talk about the failed experiments too.
기쁘긴 한데요, 이 결과가 말해 주지 않는 것도 적어 왔어요. | I am happy, but I also wrote down what this result cannot tell us.
`),
  failure: lines(`
계획한 만큼은 못 했어요. 어떤 단계에서 막혔는지부터 말씀드릴게요. | I did not finish what I planned. Let me start with where I got stuck.
실험은 했는데, 이번 결과로 주장을 해도 되는지는 모르겠어요. | I ran the experiments, but I am not sure these results support a claim.
같은 실수를 반복한 것 같아서 노트를 다시 읽어 봤어요. | I think I repeated a mistake, so I went back through my notebook.
잘 안 된 걸 설명하려니 말이 길어져요. 핵심부터 다시 정리할게요. | I keep giving a long explanation of what went wrong. Let me try the main point again.
결과가 없는 게 아니라 해석을 아직 못 한 건지, 같이 봐 주실 수 있나요? | Could we check whether the result is missing or whether I have not understood it yet?
이번 주에는 조건을 너무 많이 바꿨어요. 다음에는 하나씩 바꿔 볼게요. | I changed too many conditions this week. Next time I will change one at a time.
진도보다 원인을 먼저 확인하고 싶어요. 같은 일을 더 해도 달라질 것 같지 않아서요. | I want to check the cause before pushing ahead. More of the same may not help.
지난번 조언대로 했는데 다른 문제가 생겼어요. 어디서 달라졌는지 가져왔어요. | I followed the last suggestion, but a different problem appeared. I brought the point where it changed.
아쉬운 결과도 숨기지 않고 넣었어요. 이걸 보고 방향을 정하고 싶어요. | I included the disappointing results too. I would like to use them to decide our direction.
지금은 제가 못 하는 건지, 방법이 맞지 않는 건지 구분하기가 어려워요. | Right now it is hard to tell whether I am struggling or whether the method is wrong.
`),
  tired: lines(`
계획표에는 할 수 있을 것 같았는데, 막상 한 주를 보내니 너무 빡빡했어요. | The plan looked manageable on paper, but the week turned out to be too full.
같은 문장을 세 번 읽고도 기억이 안 나요. 이번 주는 조금 줄여도 될까요? | I read the same sentence three times and cannot recall it. Could we reduce this week’s load?
밤을 늦추는 것보다 실수를 줄이는 쪽으로 일정을 바꾸고 싶어요. | I would like a schedule that reduces mistakes rather than extends the night.
장비 예약을 잡기 전에 쉬는 날부터 하나 넣어 두고 싶어요. | I would like to put one rest day in before booking the instrument.
다 할 수 있다고 말씀드렸는데, 그때 제 상태를 잘 몰랐던 것 같아요. | I said I could do everything. I do not think I understood my own condition then.
실험 중간에 집중이 끊겨서 체크리스트를 다시 만들었어요. | I lost focus during the experiment, so I made another checklist.
주말에는 연구실 생각을 잠깐 내려놓고 싶어요. 월요일에 다시 볼 수 있도록요. | I would like to put the lab aside over the weekend so I can return to it on Monday.
이번 주에 한 가지를 제대로 한다면 무엇부터 하는 게 좋을까요? | If I do one thing properly this week, what should it be?
결과 얘기는 준비했어요. 그 전에 일정이 조금 버겁다는 말씀을 드리고 싶어요. | I prepared the results, but first I need to say the schedule has become difficult.
쉬고 나면 괜찮을 줄 알았는데 아직 회복이 덜 된 것 같아요. | I thought a break would be enough, but I do not think I have recovered yet.
`),
  lowTrust: lines(`
보고할 내용은 여기까지예요. 다른 건… 조금 정리한 다음 말씀드릴게요. | That is everything for the report. The rest… I will tell you when I have organized it.
질문은 있었는데요, 지금 해도 되는 건지 모르겠어요. | I had a question, but I am not sure whether I should ask it now.
이번에는 계획을 바꾼 이유도 적어 왔어요. 먼저 설명드려도 될까요? | I wrote down why I changed the plan. Could I explain that first?
결과가 좋지 않을 때도 연락드려도 되는지 확인하고 싶어요. | I want to know whether I can contact you when the results are not good.
교수님이 기대하시는 게 정확히 뭔지 다시 여쭤보고 싶어요. | I would like to ask again what exactly you expect from me.
괜찮다고 답했지만, 사실 일정에 동의한 건 아니었어요. | I said it was fine, but I had not actually agreed with the schedule.
지난번에 말을 못 끝낸 부분이 있어요. 오늘은 끝까지 말씀드려도 될까요? | There was something I could not finish saying last time. Could I finish it today?
노트에는 다 적었어요. 직접 말씀드리는 건 아직 조금 어려워요. | Everything is in the notebook. Saying it aloud is still a little difficult.
어떤 기준으로 피드백을 받는지 알면 준비하기가 덜 두려울 것 같아요. | Knowing the feedback criteria might make preparing less frightening.
이번 면담에서는 먼저 제 설명을 들어 주셨으면 해요. | In this meeting, I would like you to hear my explanation first.
`),
  anxious: lines(`
졸업 요건을 다시 읽어 봤어요. 지금 방향으로 가면 맞출 수 있을까요? | I reread the degree requirements. Can I meet them if I continue in this direction?
다른 사람들 진도가 자꾸 눈에 들어와요. 제 일정부터 봐야 하는데요. | I keep noticing other people’s progress when I should be looking at my own plan.
이번 결과가 안 나오면 다음 단계도 밀릴까 봐 걱정돼요. | I worry that if this result does not come through, the next stage will slip too.
질의응답에서 모른다고 말해도 괜찮을까요? | Is it okay to say I do not know during questions?
계획이 틀어졌을 때 다시 정할 수 있다는 걸 알면 마음이 좀 놓일 것 같아요. | It would help to know that we can revise the plan if it goes wrong.
제가 준비됐는지 모르겠어요. 무엇을 더 확인하면 될까요? | I do not know whether I am ready. What else should I check?
좋은 결과를 얻고도 다음 실험이 먼저 걱정됐어요. | Even after a good result, I worried about the next experiment first.
이건 작은 질문인데, 계속 혼자 생각하니 점점 커졌어요. | It was a small question, but thinking about it alone made it grow.
시험 준비와 연구를 같이 하려니 어느 쪽도 충분하지 않은 느낌이에요. | Preparing for the exam alongside research makes neither feel sufficient.
오늘은 무엇을 안 해도 되는지도 정하고 싶어요. | Today I would also like us to decide what I do not need to do.
`),
  independent: lines(`
두 방법을 비교해 봤어요. 저는 두 번째를 먼저 시험하고 싶어요. 이유도 가져왔어요. | I compared two methods. I would like to test the second first, and I brought my reasoning.
지난번 제안과 조금 다르게 해 봤어요. 조건을 바꾼 근거부터 설명드릴게요. | I tried something slightly different from the last suggestion. Let me explain why I changed the conditions.
이번에는 결론보다 반례를 먼저 찾아봤어요. | This time I looked for a counterexample before writing the conclusion.
다음 실험은 제가 일정까지 잡아 봤어요. 놓친 게 있는지만 봐 주세요. | I drafted the schedule for the next experiment too. Could you check what I missed?
이 해석에는 아직 동의가 안 돼요. 다른 설명을 한 번 검토해 보고 싶어요. | I am not convinced by this interpretation yet. I would like to examine another explanation.
제가 정한 질문이니까 안 됐을 때도 끝까지 확인해 보고 싶어요. | It is a question I chose, so I would like to follow it through even if it fails.
교수님 의견을 듣고 싶어요. 다만 결정은 제가 한 번 내려 보고 싶어요. | I would like your view, but I also want to try making the decision myself.
공동연구자에게 먼저 물어보고 답변을 정리해 왔어요. | I asked our collaborator first and brought a summary of the reply.
이제는 잘 모르는 부분도 구체적으로 질문할 수 있을 것 같아요. | I think I can ask more specific questions about what I do not understand now.
이번 계획은 제가 책임지고 조정해 볼게요. 어려워지면 바로 말씀드리고요. | I will take responsibility for adjusting this plan, and tell you promptly if it becomes difficult.
`),
  curious: lines(`
계획한 실험 옆에 작은 질문 하나를 더 적었어요. 연결될 것 같아서요. | I added one small question beside the planned experiment. I think they might connect.
이 논문의 방법을 우리 데이터에도 써 보면 어떨까요? | What if we tried this paper’s method on our data?
예상과 다르게 나왔는데, 오히려 그 부분이 더 궁금해졌어요. | The result was unexpected, but that is the part I am most curious about.
읽던 논문에서 참고문헌으로 갔다가 다른 분야까지 왔어요. | I followed references from the paper and ended up in another field.
이 질문을 지금 다 풀 수는 없겠지만, 작은 테스트는 가능할 것 같아요. | We cannot answer the whole question now, but I think we can run a small test.
다들 당연하다고 쓰는 가정이 있는데, 왜 그런지 모르겠어요. | Everyone treats this assumption as obvious, but I do not know why it holds.
방법은 배웠는데요, 처음 이 방법을 생각한 이유도 알고 싶어요. | I learned the method, but I want to know why someone first chose it.
별로 중요하지 않을 수도 있는데, 그래프 끝부분이 자꾸 눈에 밟혀요. | It may not matter, but I keep noticing the tail of the plot.
계획 밖의 질문이라서 메모만 했어요. 조금 시간을 써 봐도 될까요? | It is outside the plan, so I only made a note. Could I spend a little time on it?
답을 찾았는데 질문이 하나 더 생겼어요. 연구가 원래 이런 건가요? | I found an answer and gained another question. Is research always like this?
`),
  methodical: lines(`
조건표와 원자료를 같이 가져왔어요. 어느 순서로 볼까요? | I brought the conditions table and raw data together. Which should we look at first?
지난주와 바뀐 부분만 따로 표시했어요. | I marked only the parts that changed since last week.
이 단계는 재현했고, 다음 단계는 아직 확인 중이에요. | I reproduced this stage. The next one is still being checked.
잘된 실험도 실패한 실험도 같은 형식으로 기록했어요. | I recorded the successful and failed runs in the same format.
결론을 쓰기 전에 표본을 나누는 기준부터 정하고 싶어요. | Before writing the conclusion, I would like to define how we divide the samples.
그림을 예쁘게 고치다가 원래 데이터와 달라질까 봐 점검했어요. | I checked that improving the figure’s appearance did not change what the data shows.
이번 분석은 처음부터 다시 돌려도 같은 파일이 나오도록 정리했어요. | I organized the analysis so rerunning it from the start produces the same files.
설명하지 못하는 점은 따로 표시했어요. 그냥 넘기면 다음에도 걸릴 것 같아서요. | I marked what I cannot explain. I think it will return later if we ignore it now.
제가 이해한 방법을 말로 설명해 볼게요. 틀린 데가 있으면 짚어 주세요. | Let me explain the method as I understand it. Please point out any mistakes.
오늘은 진도가 조금 느려도 확인한 것과 추측한 것을 나누고 싶어요. | Even if progress is slower today, I want to separate what we verified from what we guessed.
`),
  social: lines(`
옆 연구실 학생과 얘기해 보니 비슷한 문제를 겪었대요. | A student in the next lab told me they had a similar problem.
선배에게 설명하다가 제가 놓친 가정을 발견했어요. | Explaining it to a senior student helped me notice an assumption I had missed.
세미나 끝나고 질문을 하나 했어요. 답보다 다시 만날 수 있다는 게 좋았어요. | I asked a question after the seminar. It was good to know we could talk again, even beyond the answer.
동료가 실험을 도와줬어요. 다음에는 제가 그쪽 분석을 봐 주기로 했고요. | A labmate helped with the experiment. I offered to help with their analysis next.
모임에 다 나가고 싶지만 연구 시간도 남겨야겠어요. | I would like to join every gathering, but I need to protect some research time too.
다른 분야 사람에게 설명하니 어디가 불명확한지 보였어요. | Explaining it to someone from another field showed me what was unclear.
공동연구 미팅에서 제가 맡은 부분은 직접 말해 보고 싶어요. | I would like to present my own part at the collaboration meeting.
실험 예약이 겹쳐서 이야기하고 시간을 바꿨어요. 다음에는 규칙이 있으면 좋겠어요. | We talked through a booking clash and changed times. A clear rule would help next time.
연구 얘기만 하다가 점심도 같이 먹었어요. 질문하기가 조금 편해졌어요. | We usually only discuss work, but we had lunch together. Asking questions feels easier now.
새로 온 학생에게 노트 쓰는 법을 알려 줬어요. 제 첫 노트는 안 보여 줬지만요. | I showed the new student how to keep a notebook. I did not show them my first one, though.
`),
  paper: lines(`
결과는 있는데 문단으로 연결하려니 어렵네요. 제일 중요한 문장부터 써 볼게요. | I have the results, but linking them into paragraphs is difficult. I will start with the main sentence.
초록을 줄였어요. 줄이고 나니 우리가 한 일이 더 잘 보이는 것 같아요. | I shortened the abstract. Now I think it is clearer what we actually did.
방법 부분은 처음 읽는 사람도 따라 할 수 있는지 확인하고 싶어요. | I want to check whether a new reader could follow the methods.
이 문장은 자신 있게 썼다가 지웠어요. 데이터가 거기까지 말해 주지는 않아서요. | I wrote this sentence confidently and then deleted it. The data does not go that far.
그림 순서를 바꿨는데 이야기가 더 자연스러워졌는지 봐 주세요. | I changed the order of the figures. Could you check whether the argument flows better?
리뷰 답변에 감정이 들어간 것 같아서 하루 두고 다시 읽었어요. | I thought emotion had crept into my review response, so I read it again a day later.
원고 파일에 최종이 벌써 여러 번 붙었어요. 아직 진짜 마지막은 아니네요. | Several drafts already say “final.” None has been the actual last one yet.
인용한 논문을 다시 확인하다가 제 설명도 바꿔야 한다는 걸 알았어요. | Checking a cited paper made me realize my own explanation needed to change.
저자 기여를 정리했어요. 이름을 쓰기 전에 함께 확인하고 싶어요. | I wrote a contribution statement. I would like us to check it before listing names.
논문을 냈다고 이 질문이 끝난 건 아닌 것 같아요. 다음에 확인할 것도 적었어요. | Submitting the paper does not feel like the end of the question. I wrote down what to check next.
`),
  conference: lines(`
발표 시간에 맞춰 줄였는데, 버린 슬라이드가 더 많아요. | I cut the talk to fit the time. There are more discarded slides than slides left.
첫 질문이 제일 무서울 것 같아요. 못 알아들으면 다시 여쭤볼게요. | I think the first question will be the hardest. If I miss it, I will ask again.
포스터 앞에 아무도 안 오면 어쩌죠? 제가 먼저 설명을 시작해 봐도 될까요? | What if no one comes to the poster? Could I try starting a conversation myself?
제 연구를 처음 듣는 사람에게 설명해 보니 제목부터 어렵더라고요. | Explaining my work to a new listener showed me that even the title was difficult.
발표할 때는 떨렸는데, 질문을 받으니 이야기할 게 생겨서 좋았어요. | I was nervous during the talk, but the questions gave me something to discuss.
학회에서 메모한 질문을 가져왔어요. 다음 실험에 연결될 것 같아요. | I brought the questions I noted at the conference. They may help shape the next experiment.
영어 문장을 다 외우는 대신 핵심을 다른 말로 설명하는 연습을 했어요. | Instead of memorizing every English sentence, I practiced explaining the main point another way.
발표를 마치고 나서야 제 이름표를 제대로 봤어요. | I only really looked at my name badge after the talk was over.
다른 발표를 듣다 보니 우리 결과의 장점과 한계가 둘 다 보였어요. | Listening to other talks helped me see both the strengths and limits of our results.
상보다 기억에 남는 질문이 있어요. 그 질문은 다시 생각해 보고 싶어요. | There is a question I remember more than the award. I want to think about it again.
`),
  graduate: lines(`
남은 요건을 정리해 왔어요. 논문 다음에는 발표 일정부터 잡으려고요. | I summarized the remaining requirements. After the paper, I plan to arrange the presentation.
졸업 뒤에 하고 싶은 일을 적어 보니, 하고 싶지 않은 일도 보이네요. | Writing down what I want after graduation also showed me what I do not want.
연구실을 떠난 뒤에도 이 방법을 써 보고 싶어요. | I would like to keep using this method after leaving the lab.
학위 논문에 넣을 결과와 후속 연구로 남길 결과를 나누고 있어요. | I am separating results for the dissertation from results for later work.
제 연구를 짧게 소개하려니 처음의 질문으로 돌아가게 되네요. | Trying to explain my work briefly brings me back to the original question.
추천서 부탁드리는 메일을 여러 번 고쳤어요. 직접 여쭤보는 게 낫겠다고 생각했어요. | I revised the email asking for a recommendation several times, then decided to ask you directly.
처음 들어왔을 때 적은 계획을 다시 봤어요. 예상과 다른 길을 꽤 오래 왔네요. | I reread my first plan. We have traveled quite a way along a path I did not expect.
자료를 넘겨줄 때 다음 사람이 덜 헤매게 설명도 남겨 두고 싶어요. | I want to leave explanations with the files so the next person gets lost less often.
어디에 가든 제가 어떤 일을 잘하는지는 이제 조금 알 것 같아요. | Wherever I go, I think I now understand a little better what work I do well.
졸업 날짜만 보다가, 여기서 배운 걸 돌아볼 시간이 생겼어요. | I used to look only at the graduation date. Now I have a moment to look at what I learned here.
`),
  sabbatical: lines(`
교수님, 화면 공유로 보여 드릴게요. 말로만 설명하니 자꾸 길어지네요. | Professor, I will share my screen. Explaining without it keeps getting too long.
시차 때문에 바로 답을 못 받아도 언제쯤 볼 수 있는지 알면 괜찮을 것 같아요. | I can manage the time difference if I know roughly when I can expect a reply.
작은 질문은 모아 뒀어요. 큰 질문은 먼저 메일로 보냈고요. | I saved the small questions for our meeting and emailed the bigger ones first.
교수님 안 계신 동안 결정한 내용을 따로 적어 놨어요. | I kept a separate record of decisions made while you were away.
공동 지도해 주시는 분께는 방법을 묻고, 방향은 오늘 같이 정하고 싶어요. | I asked the co-mentor about methods. I would like us to discuss direction today.
영상 면담 끝나고 나면 다음 할 일이 분명해져요. 이 시간을 계속 정해 두면 좋겠어요. | After our video meeting, the next steps are clearer. I would like to keep this time fixed.
혼자 해결한 문제도 있고 오래 끌었던 문제도 있어요. 둘 다 말씀드릴게요. | I solved some problems on my own and stayed stuck on others. I will tell you about both.
방문 연구실에서는 이런 측정을 어떻게 하는지 궁금해요. | I wonder how they make this measurement at your host lab.
교수님 돌아오시기 전에 노트는 읽기 쉽게 정리해 둘게요. | I will make the notebook easier to read before you return.
떨어져 있으니 작은 보고를 더 자주 해야겠더라고요. | Being apart made me realize that smaller, more frequent updates help.
`),
  personal: lines(`
이번 주에는 개인적인 일정이 있어요. 자세한 얘기보다 가능한 시간을 먼저 말씀드려도 될까요? | I have a personal commitment this week. Could I tell you my available hours before going into details?
오늘은 연구 얘기가 조금 늦게 시작돼도 괜찮을까요? 정리할 일이 있었어요. | Could we start the research discussion a little later today? There was something I needed to sort out.
집에서 해야 할 일이 생겼어요. 맡은 일은 어떤 순서로 조정하면 좋을까요? | Something at home needs my attention. How should I reorder the tasks I am responsible for?
몸은 괜찮아졌는데 지난주 일정을 바로 따라가기는 어려워요. | I am feeling better, but I cannot immediately catch up with last week’s schedule.
인건비가 언제 들어오는지 알면 이번 달 계획을 세울 수 있을 것 같아요. | Knowing when the stipend arrives would help me plan this month.
연구 외의 일을 말해도 되는지 몰라서 미뤘어요. 이번에는 미리 말씀드리려고요. | I put this off because I was not sure I could discuss something outside research. This time I want to tell you early.
당분간 저녁에는 연락이 늦을 수 있어요. 낮에 답할 시간을 따로 정해 둘게요. | I may be slow to reply in the evenings for a while. I will set aside time during the day.
일정을 바꿔 주셔서 감사해요. 돌아오면 어디부터 시작할지도 정해 두고 싶어요. | Thank you for adjusting the schedule. I also want to agree on where to restart when I return.
괜찮다는 말만 하기보다 이번 주에 가능한 일을 정확히 말씀드리고 싶어요. | Rather than just saying I am fine, I want to tell you exactly what I can do this week.
문제를 해결해 달라는 뜻은 아니에요. 계획을 같이 조정할 수 있으면 좋겠어요. | I am not asking you to solve the problem. I would appreciate adjusting the plan together.
`),
  ordinary: lines(`
이번 달 계획을 가져왔어요. 먼저 지난주에 실제로 한 것부터 볼까요? | I brought this month’s plan. Shall we first look at what I actually did last week?
실험 두 번과 논문 읽기를 넣었어요. 중간에 하루는 비워 뒀고요. | I planned two experiments and some reading, with one day left open between them.
지난번 미팅 뒤에 질문이 생겨서 오늘 가져왔어요. | A question came up after our last meeting, so I brought it today.
이번에는 예상보다 오래 걸린 작업을 표시했어요. 다음 계획에 반영하려고요. | I marked the tasks that took longer than expected so we can account for them next time.
연구 노트를 정리하다가 아직 확인하지 않은 조건을 찾았어요. | While organizing the notebook, I found a condition we have not checked yet.
계획대로 된 부분과 바꾼 부분을 나눠서 말씀드릴게요. | I will separate what went to plan from what I changed.
다음 주 일정에 여유가 조금 있어요. 공부를 더 넣을지 실험을 넣을지 고민했어요. | There is a little room next week. I wondered whether to add study or experiments.
오늘은 질문 세 가지예요. 제일 오래 막힌 것부터 여쭤볼게요. | I have three questions today. I will start with the one that has kept me stuck longest.
진도는 많지 않지만 확인한 것은 있어요. 그것부터 보여 드릴게요. | Progress was modest, but I verified a few things. I will show those first.
제가 짠 계획을 보시고 너무 낙관적인 부분이 있는지 말씀해 주세요. | Could you look at my plan and tell me where I have been too optimistic?
`),
  recoveringTrust: lines(`
지난번에 끝까지 들어 주셔서요. 오늘은 그 뒤의 얘기도 가져왔어요. | You heard me out last time, so today I brought what happened afterward too.
안 된 결과도 가져와도 된다고 하셨죠. 그래서 이번에는 빼지 않았어요. | You said I could bring unsuccessful results too. This time I did not leave them out.
일정을 같이 바꾸고 나니까 질문을 조금 빨리 드릴 수 있었어요. | After we changed the schedule together, I could ask my questions a little sooner.
교수님도 모르는 부분이 있다고 말씀하시니까, 저도 말하기가 편해졌어요. | Hearing you say there are things you do not know made it easier for me to speak too.
이번에는 제 생각을 먼저 말씀드려 볼게요. 맞는지 같이 봐 주세요. | This time I will give my own view first. Could we check it together?
생각을 바꿔도 괜찮다고 하셔서 두 계획을 가져왔어요. | Since you said it was okay to change my mind, I brought two plans.
지난번 지적은 어디를 고쳐야 하는지 알 수 있어서 도움이 됐어요. | The last criticism helped because I could see exactly what to change.
칭찬해 주신 부분은 다음 실험에서도 유지해 봤어요. | I tried to keep the part you praised in the next experiment too.
계획을 못 지켰을 때 미리 말씀드리는 게 조금 덜 어려워졌어요. | It is getting a little easier to tell you early when I cannot keep the plan.
오늘 질문은 메일로 보내다 지우지 않았어요. 직접 말씀드리려고 가져왔어요. | I did not type today’s question into an email and delete it. I brought it to ask you directly.
`),
  guarded: lines(`
틀린 부분부터 고치겠습니다. 다만 그 조건을 고른 이유도 설명드리고 싶어요. | I will correct the mistake first, but I would also like to explain why I chose that condition.
지난번에 말씀하신 기준에 맞춰 준비했어요. 이번에는 기준이 같은가요? | I prepared using the criteria from last time. Are we using the same criteria today?
혼날까 봐 결과를 늦게 말씀드렸어요. 늦춘 건 제가 고쳐야 할 것 같아요. | I delayed showing the results because I feared being scolded. I know that delay needs to change.
잘된 부분도 확인받고 싶어요. 전부 다시 해야 하는 건지 모르겠어서요. | I would also like to check what worked. I do not know whether everything needs redoing.
지적받은 게 방법인지 저 자신인지 헷갈렸어요. 방법부터 다시 보겠습니다. | I was unsure whether the criticism was of the method or of me. I will start with the method.
바로 답을 못 드리면 메모하고 다음 면담까지 확인해 와도 될까요? | If I cannot answer immediately, could I make a note and check it before the next meeting?
오늘은 틀릴 수 있어도 질문을 해 보려고요. 혼자 두면 더 오래 걸릴 것 같아서요. | Today I want to ask even if I might be wrong. Keeping it to myself will probably take longer.
일단 하겠다고 답했는데, 가능한 일정인지는 다시 봐야 할 것 같아요. | I said I would do it, but I think we need to check whether the schedule is possible.
결과만 보고 판단하시기 전에 실험 기록도 봐 주셨으면 해요. | Before judging only the result, I would like you to look at the experiment record too.
말씀하신 걸 다 받아 적었어요. 제가 이해한 순서로 다시 말해 봐도 될까요? | I wrote down everything you said. Could I repeat it in the order I understood?
`),
  polite: lines(`
먼저 지난 면담에서 받은 조언을 어떻게 적용했는지 말씀드려도 될까요? | May I first explain how I applied the advice from our last meeting?
제가 쓰고 난 장비는 다음 사람 조건에 맞춰 정리해 뒀습니다. | I left the equipment ready for the next person after using it.
공동연구자께 질문을 보내기 전에 제가 확인한 내용을 정리했습니다. | I summarized what I checked before sending our collaborator a question.
오늘 오래 걸릴 질문이 있습니다. 시간이 괜찮으신지 먼저 여쭤보고 싶어요. | One question may take a while today. I wanted to check whether you have time.
의견이 조금 다릅니다만, 제가 생각한 근거부터 보여 드리겠습니다. | I see it a little differently, but let me show my reasons first.
실험을 도와준 동료 이름도 발표 자료에 넣었습니다. | I included the colleague who helped with the experiment in the slides.
`),
  direct: lines(`
이 일정은 못 맞출 것 같아요. 실험 시간이 너무 짧아요. | I do not think I can meet this schedule. There is not enough experiment time.
결론부터 말하면 아직 모르겠어요. 확인할 실험은 생각했어요. | The short answer is that I do not know yet. I have an experiment in mind to check it.
그 설명은 제가 이해한 데이터랑 안 맞아요. 같이 다시 볼까요? | That explanation does not fit my reading of the data. Could we look again together?
메일을 너무 짧게 쓴 것 같아요. 빠진 조건은 지금 설명드릴게요. | I think my email was too brief. I will explain the missing conditions now.
제가 말이 급했어요. 반대하는 이유는 따로 있어요. | I spoke too quickly. There is a reason behind my disagreement.
이번에는 돌려 말하지 않을게요. 지금 계획은 바꿔야 할 것 같아요. | I will be direct this time. I think we need to change the current plan.
`),
  resilient: lines(`
처음에는 속상했는데, 하루 지나니 확인할 게 보이더라고요. | I was upset at first, but a day later I could see what to check.
이번 결과가 전부를 결정하진 않을 것 같아요. 다음 조건을 준비했어요. | I do not think this result decides everything. I prepared the next condition.
지난번 거절 의견에서 고칠 수 있는 부분을 골라 왔어요. | I picked out the parts of the rejection that we can address.
안 된 기록도 남겨 두니 다음 시작이 조금 빨랐어요. | Keeping the unsuccessful attempts made the next start a little quicker.
잠깐 쉬고 나니까 같은 그래프를 다르게 볼 수 있었어요. | After a short break, I could see the same graph differently.
다시 해 볼 수는 있어요. 이번에는 범위를 조금 줄이고 싶어요. | I can try again. This time I would like to narrow the scope a little.
`),
  vulnerable: lines(`
결과가 안 나오면 지난번 지적까지 같이 떠올라요. 하나씩 나눠서 볼 수 있을까요? | When results fail, I remember the last criticism too. Could we separate the problems?
괜찮아진 줄 알았는데 다시 시작하는 게 생각보다 어렵네요. | I thought I had recovered, but starting again is harder than I expected.
어느 부분부터 다시 하면 되는지 작은 단계로 정하고 싶어요. | I would like to decide on small steps for restarting.
오늘은 큰 계획보다 이번 주에 할 수 있는 것부터 얘기하고 싶어요. | Today I would rather discuss what I can do this week than a large plan.
실패한 실험을 열어 보는 데 시간이 좀 걸렸어요. 이제 같이 볼 수 있을 것 같아요. | It took me a while to open the failed experiment. I think I can look at it with you now.
한 번 쉬면 뒤처질까 봐 쉬지도 못했어요. 일정부터 다시 잡고 싶어요. | I feared falling behind if I rested, so I could not rest either. I want to reset the schedule.
`),
  inventive: lines(`
방법을 조금 바꿔 봤어요. 비교 조건은 그대로 남겨 뒀고요. | I changed the method a little while keeping the comparison condition.
다른 분야 논문에서 쓰는 방법을 여기에도 시험해 보고 싶어요. | I would like to test a method from another field here.
정답은 아닐 수 있는데, 이 현상을 다르게 설명하는 가설을 생각했어요. | It may not be right, but I thought of another hypothesis for this pattern.
새 아이디어가 있어요. 하루짜리 작은 실험으로 먼저 걸러 보고 싶어요. | I have a new idea. I would like to screen it with a small one-day experiment.
기존 방법이 편하긴 한데, 지금 질문에는 다른 접근이 더 맞을지도 몰라요. | The usual method is convenient, but another approach may fit this question better.
관련 없어 보이던 두 결과를 같이 보니까 연결할 만한 질문이 생겼어요. | Looking at two seemingly unrelated results together gave me a connecting question.
`),
  disciplined: lines(`
실험 시작 전에 끝내는 시간을 정했어요. 그 뒤에는 기록만 정리했어요. | I set a stopping time before the experiment and only organized notes afterward.
이번 주에는 욕심내서 더 넣지 않고 정한 일을 마무리했어요. | This week I finished the agreed tasks without adding more out of ambition.
조금씩 읽은 논문이 쌓여서 오늘은 비교표를 가져올 수 있었어요. | The papers I read little by little added up, so I could bring a comparison table today.
매일 같은 시간에 기록했더니 빠진 조건을 빨리 찾았어요. | Recording at the same time each day helped me spot a missing condition quickly.
오늘 못 끝낸 일은 다음 주 첫 칸으로 옮겼어요. 밤까지 늘리지는 않았어요. | I moved unfinished work to the first slot next week instead of extending into the night.
계획을 지키려면 휴식도 일정에 적어야 하겠더라고요. | I realized that keeping a plan means putting rest in it too.
`),
  overworking: lines(`
정한 일은 다 했는데, 끝나고 나니까 아무것도 읽히지 않았어요. | I finished the agreed work, but afterward I could not take in any reading.
쉬는 날에도 기록을 확인했어요. 그래서인지 이번 주 실수가 늘었어요. | I checked records on my day off too. Perhaps that is why I made more mistakes this week.
조금만 더 하면 된다고 생각하다가 며칠을 늦게 잤어요. | I kept thinking just a little more would finish it and went to bed late for several days.
계획을 못 줄이겠어서 잠을 줄였어요. 지금은 그게 잘못된 선택 같아요. | I cut sleep because I could not cut the plan. Now I think that was the wrong choice.
열심히 했다는 말보다 이번 주는 멈춰도 된다는 말을 듣고 싶어요. | More than hearing that I worked hard, I would like to hear that I can stop this week.
할 일 목록은 지웠는데 몸이 따라오지 않아요. 다음 일정은 줄이고 싶어요. | I cleared the to-do list, but my body has not caught up. I want a lighter next schedule.
`),
  selfManaging: lines(`
오래 붙들고 있으면 집중이 흐려져요. 짧게 나눠서 해 보려고요. | My concentration fades when I work on one thing too long. I want to split it into shorter blocks.
계획을 촘촘히 채우기보다 오늘 끝낼 한 가지를 정했어요. | Instead of filling the plan tightly, I chose one thing to finish today.
미루게 되는 일을 동료와 같이 시작했더니 조금 나았어요. | Starting the task I kept postponing with a colleague helped a little.
이번에는 시간보다 완성할 작은 결과를 기준으로 계획했어요. | This time I planned around a small result to finish rather than hours to spend.
일정에 빈칸이 있어야 갑자기 생기는 일도 감당할 수 있더라고요. | Leaving gaps in the schedule helps me handle things that come up unexpectedly.
제가 잘 집중하는 시간에 어려운 실험을 옮겨도 될까요? | Could we move the difficult experiment to the time when I focus best?
`),
  distantTrust: lines(`
개인적인 이야기는 아직 어색하지만, 연구에서 막힌 건 먼저 말씀드릴 수 있어요. | Personal talk still feels awkward, but I can tell you early when research gets stuck.
자주 얘기하지는 않아도 정한 기준은 지켜 주실 거라고 생각해요. | We do not talk often, but I believe you will keep the agreed criteria.
말씀은 짧으셔도 기록을 보고 판단해 주시는 건 알고 있어요. | Your answers are brief, but I know you judge after checking the records.
오늘은 연구 질문만 가져왔어요. 그 부분은 솔직하게 말씀드릴게요. | I brought only research questions today. I will speak openly about those.
제가 다른 의견을 내도 불이익은 없을 거라고 생각해서 가져왔어요. | I brought a different view because I believe disagreeing will not count against me.
사적인 얘기를 많이 하지는 않아도, 도움을 요청할 수 있는 관계면 좋겠어요. | Even without much personal talk, I would like a relationship where I can ask for help.
`),
  closeUncertain: lines(`
커피 마시면서는 편한데, 결과를 보여 드리기 전에는 아직 긴장돼요. | Coffee together feels easy, but I still get tense before showing results.
지난번엔 농담인 줄 알았는데, 일정은 정말 바뀐 건가요? | I thought it was a joke last time. Did the schedule really change?
편하게 말씀하라고 하셨지만, 이 결과까지 말해도 되는지는 망설였어요. | You told me to speak freely, but I hesitated over whether that included this result.
대화는 편해졌는데 평가 기준도 미리 알면 더 좋겠어요. | Talking has become easier. Knowing the evaluation criteria beforehand would help too.
교수님과 웃고 나서도 메일은 몇 번 고쳐 쓰게 되네요. | Even after laughing with you, I still rewrite my emails several times.
친하게 지내는 것과 다른 의견을 말하는 건 아직 다르게 느껴져요. | Being close and voicing a different opinion still feel like different things.
`),
  introvert: lines(`
미팅 전에 생각을 글로 정리해 왔어요. 읽고 나서 설명드려도 될까요? | I wrote down my thoughts before the meeting. Could I explain after you read them?
사람 많은 세션보다 작은 토론에서 질문이 잘 나오더라고요. | I find it easier to ask questions in small discussions than crowded sessions.
학회에서는 하루에 한 분께만 길게 질문해 보려고요. | At the conference, I plan to have one longer conversation each day.
말을 바로 꺼내기보다 잠깐 생각할 시간이 있으면 좋겠어요. | I would like a little time to think before speaking.
혼자 정리한 뒤에 동료와 비교했더니 빠진 부분을 찾았어요. | Organizing it alone before comparing with a colleague helped me find what I missed.
오늘은 말이 짧아도 질문은 있어요. 메모한 것부터 말씀드릴게요. | I may be brief today, but I have questions. I will start with my notes.
`),
  fortunate: lines(`
마침 장비 예약이 비어서 계획을 조금 앞당길 수 있었어요. | An equipment slot happened to open, so I could move the plan forward a little.
우연히 들은 세미나가 막힌 부분을 생각하는 데 도움이 됐어요. | A seminar I happened to attend helped me think about the part where I was stuck.
동료와 점심 먹다가 필요한 방법 이야기가 나왔어요. 기록해 뒀어요. | The method I needed came up over lunch with a colleague. I wrote it down.
일이 잘 풀려서 기쁘지만, 같은 조건에서도 되는지 다시 확인하고 싶어요. | I am happy things worked out, but I want to check whether they work under the same conditions again.
좋은 기회가 생겼어요. 준비한 게 없었다면 놓쳤을 것 같아요. | A good opportunity came up. I think I would have missed it without preparation.
예상 밖의 도움을 받았어요. 어디까지 제 결과인지 구분해 두려고요. | I received unexpected help. I want to keep clear which parts are my own results.
`),
  unfortunate: lines(`
예약을 잡았는데 점검일이랑 겹쳤어요. 가능한 다른 일을 먼저 할게요. | My reservation overlapped with maintenance. I will first do what is still possible.
준비한 날에 필요한 재료가 안 왔어요. 다음 계획에는 여유를 넣고 싶어요. | The material did not arrive on the day I prepared. I want a buffer in the next plan.
계획대로 했는데 바깥 일정이 바뀌었어요. 제 실수와 나눠서 보고 싶어요. | I followed the plan, but an outside schedule changed. I want to distinguish that from my mistakes.
비슷한 문제가 겹쳐서 속상해요. 그래도 이번에 확인한 기록은 남겨 뒀어요. | It is upsetting that similar problems piled up. I still kept the records of what I checked.
오늘 안 풀린 일이 제 능력 전부를 말하는 건 아니겠죠. | What went wrong today does not say everything about my ability, does it?
일정이 또 밀렸어요. 무리해서 따라잡기보다 조정할 수 있을까요? | The schedule slipped again. Could we adjust it instead of pushing too hard to catch up?
`),
};

function hash(text) {
  let n = 2166136261;
  for (const c of String(text)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0;
}
function value(source, key, fallback = 50) { const n = source?.[key]; return Number.isFinite(n) ? n : fallback; }
// Pure and deterministic: rendering, switching locale and reloading never consume RNG.
export function studentLine(s, lang = 'ko') {
  const month = value(s, 'month', 0), h = s.hidden || {}, t = s.temperament || {}, b = s.behavior || {};
  const report = s.lastReport || {}, phase = s.project?.phase;
  let performance = report.completion ?? report.performance;
  if (typeof performance === 'number' && performance > 1) performance /= 100;
  const rapport = value(h, 'rapport', 0), trust = value(h, 'trust', 0), stress = value(h, 'stress', 0), motivation = value(h, 'motivation');
  const stamina = value(h, 'stamina', 500), confidence = value(h, 'confidence'), autonomy = value(h, 'autonomy');
  const resilience = value(h, 'resilience', 500), manners = value(h, 'manners', 500);
  const creativity = value(h, 'creativity', 0), diligence = value(h, 'diligence', 0), social = value(h, 'social', 0);
  const curiosity = value(t, 'curiosity') + value(h, 'curiosity', 0), caution = value(t, 'caution');
  const expression = value(t, 'expression');
  const listen = value(b, 'listen', 0), harsh = value(b, 'harsh', 0), praise = value(b, 'praise', 0), critique = value(b, 'critique', 0);
  let groups = ['ordinary'];
  if (month === 0) groups = ['intro'];
  else if (trust < -46) groups = ['lowTrust', ...(harsh > listen ? ['guarded'] : []), ...(rapport > 25 ? ['closeUncertain'] : [])];
  else if (stamina < 250) groups = ['tired', ...(diligence > 40 ? ['overworking'] : [])];
  else {
    if (stamina < 480) groups.push('tired');
    if (stress > 67 || confidence < 35) groups.push('anxious');
    if (motivation < 35) groups.push('failure', 'anxious');
    if ((typeof performance === 'number' && performance < 0.5) || report.scienceFailures > 0) groups.push('failure');
    if (typeof performance === 'number' && performance >= 0.65 && report.progress > 0) groups.push('success');
    if (autonomy > 62 && confidence > 52) groups.push('independent');
    if (curiosity > 66 && motivation > 40) groups.push('curious');
    if (value(h, 'learning', 500) > 600 || value(h, 'research', 500) > 630 || caution > 64) groups.push('methodical');
    if (social > 24 && expression > 42 && rapport > -10) groups.push('social');
    if (social < -35) groups.push('introvert');
    if (manners > 700) groups.push('polite');
    if (manners < 320 && trust > -30) groups.push('direct');
    if (resilience > 650 && (report.scienceFailures > 0 || performance < 0.65)) groups.push('resilient');
    if (resilience < 340 && stress > 45) groups.push('vulnerable');
    if (creativity > 35 && motivation > 40) groups.push('inventive');
    if (diligence > 35 && stamina >= 480) groups.push('disciplined');
    if (diligence > 40 && stamina < 480) groups.push('overworking');
    if (diligence < -30 && autonomy > 45) groups.push('selfManaging');
    if (trust > 35 && rapport < -15) groups.push('distantTrust');
    if (rapport > 30 && trust < 5) groups.push('closeUncertain');
    if (value(h, 'luck', 0) > 40 && performance >= 0.65) groups.push('fortunate');
    if (value(h, 'luck', 0) < -40 && report.scienceFailures > 0) groups.push('unfortunate');
    if (phase === 'draft' || phase === 'review' || phase === 4 || phase === 5 || report.published > 0) groups.push('paper');
    if ((report.conferences || report.conference || report.presented) && value(h, 'language', 500) > 350) groups.push('conference');
    const mastersReview = s.route === 'masters' && month >= 42 && month <= 54;
    if (month > 84 || mastersReview) groups.push('graduate');
    if ((s.sabbatical?.active && s.sabbatical.mode === 'away') || s.sabbaticalActive || s.onSabbatical) groups.push('sabbatical');
    if (['caregiving', 'illness', 'stipend-delay'].includes(s.lastEventId || report.eventId)) groups.push('personal');
    if (harsh >= 3 && harsh > listen && trust < 14) groups.push('guarded', 'guarded');
    if (listen >= 3 && trust > -10) groups.push('recoveringTrust');
    if (praise > critique && confidence > 62 && motivation > 55) groups.push('success');
    if (critique > 2 && value(h, 'research', 500) > 550 && trust > -10) groups.push('methodical');
  }
  const key = groups[hash(`${s.seed}:${month}:voice`) % groups.length];
  const pool = DIALOGUES[key];
  const index = (hash(`${s.seed}:${key}:line`) + month * 3 + Math.floor(month / pool.length)) % pool.length;
  return pool[index][lang === 'en' ? 'en' : 'ko'];
}
