// State and scheduling shared by the UI, backup import, and validation.
const plain = value => value && typeof value === 'object' && !Array.isArray(value);
const dateOkay = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !Number.isNaN(new Date(s+'T12:00:00Z').valueOf()) && new Date(s+'T12:00:00Z').toISOString().slice(0,10) === s;
const questionOkay = s => /^w(?:[1-9]|1\d|2[0-4])-e[1-6]$/.test(s);
const cardOkay = s => /^w(?:[1-9]|1\d|2[0-4])-c[1-4]$/.test(s);
const strings = (map, limit=20000) => Object.fromEntries(Object.entries(plain(map)?map:{}).filter(([k,v]) => questionOkay(k) && typeof v === 'string').slice(0,144).map(([k,v]) => [k,v.slice(0,limit)]));
export function emptyExtension() {
  return {reviews:{},reviewLog:[],readLessons:{},bookmarks:{},examHistory:[],activeExam:null,labHistory:[],labDraft:null,labMode:'treino',resourceReports:{}};
}
export function normalizeExtension(input={}) {
  const out=emptyExtension();
  out.labDraft=typeof input.labDraft==='string'?input.labDraft.slice(0,20000):null;out.labMode=input.labMode==='avaliacao_final'?'avaliacao_final':'treino';
  for(const [id,r] of Object.entries(plain(input.reviews)?input.reviews:{})) {
    if(!cardOkay(id)||!plain(r)||!dateOkay(r.due))continue;
    out.reviews[id]={due:r.due,interval:Math.max(0,Math.min(365,Math.floor(Number(r.interval)||0))),reps:Math.max(0,Math.min(10000,Math.floor(Number(r.reps)||0))),lastReview:dateOkay(r.lastReview)?r.lastReview:null};
  }
  out.reviewLog=(Array.isArray(input.reviewLog)?input.reviewLog:[]).filter(r=>plain(r)&&cardOkay(r.id)&&dateOkay(r.date)&&['again','hard','good','easy'].includes(r.rating)).slice(-1000).map(r=>({id:r.id,date:r.date,rating:r.rating}));
  for(const name of ['readLessons','bookmarks'])for(const [k,v] of Object.entries(plain(input[name])?input[name]:{}))if(/^(?:[1-9]|1\d|2[0-4])$/.test(k)&&v===true)out[name][k]=true;
  out.labHistory=(Array.isArray(input.labHistory)?input.labHistory:[]).filter(r=>plain(r)&&typeof r.query==='string'&&dateOkay(r.date)).slice(-20).map(r=>({query:r.query.slice(0,20000),mode:r.mode==='avaliacao_final'?'avaliacao_final':'treino',date:r.date}));
  const reportValues=['available','login','private','unavailable'];
  for(const [k,v] of Object.entries(plain(input.resourceReports)?input.resourceReports:{}))if(/^[\w-]{1,64}$/.test(k)&&plain(v)&&reportValues.includes(v.status)&&dateOkay(v.date))out.resourceReports[k]={status:v.status,date:v.date};
  out.examHistory=(Array.isArray(input.examHistory)?input.examHistory:[]).filter(e=>plain(e)&&dateOkay(e.date)&&Array.isArray(e.ids)).slice(-20).map(e=>{
    const ids=[...new Set(e.ids.filter(questionOkay))].slice(0,30);
    const correctIds=[...new Set((Array.isArray(e.correctIds)?e.correctIds:[]).filter(id=>ids.includes(id)))];
    return {date:e.date,ids,correctIds,answers:strings(e.answers),duration:Math.max(0,Math.min(14400,Number(e.duration)||0)),subject:typeof e.subject==='string'?e.subject.slice(0,30):'Todos'};
  }).filter(e=>e.ids.length);
  const e=input.activeExam;
  if(plain(e)&&Array.isArray(e.ids)&&Number.isFinite(e.startedAt)&&Number.isFinite(e.endsAt)&&e.endsAt>e.startedAt&&e.endsAt-e.startedAt<=14400000) {
    const ids=[...new Set(e.ids.filter(questionOkay))].slice(0,30);
    if(ids.length)out.activeExam={ids,answers:strings(e.answers),startedAt:e.startedAt,endsAt:e.endsAt,position:Math.max(0,Math.min(ids.length-1,Math.floor(Number(e.position)||0))),subject:typeof e.subject==='string'?e.subject.slice(0,30):'Todos'};
  }
  return out;
}
export function scheduleReview(previous, rating, today) {
  if(!dateOkay(today)||!['again','hard','good','easy'].includes(rating))throw new Error('Revisão inválida.');
  const prior=Math.max(0,Number(previous?.interval)||0);
  const interval=rating==='again'?0:rating==='hard'?1:rating==='easy'?Math.max(4,Math.min(365,Math.ceil(prior*2.5))):prior===0?1:prior===1?3:Math.min(365,Math.ceil(prior*2));
  const d=new Date(today+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+interval);
  return {due:d.toISOString().slice(0,10),interval,reps:(Number(previous?.reps)||0)+1,lastReview:today};
}
export function reviewQueue(cards, reviews, today, {subject='Todos',week=0,all=false,newLimit=12}={}) {
  const pool=cards.filter(c=>(subject==='Todos'||c.subject===subject)&&(!week||c.week===week));
  if(all)return pool;
  const due=pool.filter(c=>reviews[c.id]&&reviews[c.id].due<=today).sort((a,b)=>reviews[a.id].due.localeCompare(reviews[b.id].due));
  return [...due,...pool.filter(c=>!reviews[c.id]).slice(0,newLimit)];
}
export function pickExam(exercises, weeks, count=20, subject='Todos',random=Math.random) {
  const shuffle=list=>{const out=[...list];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};
  const groups=new Map();
  for(const q of exercises){const s=weeks[q.week-1]?.subject;if(q.kind==='sql'||!s||(subject!=='Todos'&&s!==subject))continue;if(!groups.has(s))groups.set(s,[]);groups.get(s).push(q);}
  const buckets=shuffle([...groups.values()]).map(shuffle),result=[];
  while(result.length<count&&buckets.some(b=>b.length))for(const b of buckets)if(b.length&&result.length<count)result.push(b.pop());
  return shuffle(result).map(q=>q.id);
}
export function scoreExam(exam,exercises,grader){
  const bank=new Map(exercises.map(q=>[q.id,q]));
  const ids=exam.ids.filter(id=>bank.has(id));
  const correctIds=ids.filter(id=>grader(bank.get(id),exam.answers[id]??''));
  return {ids,correctIds,total:ids.length,correct:correctIds.length,percent:ids.length?Math.round(correctIds.length/ids.length*100):0};
}
export function csvText(result){
  // Quote every field, and prevent formula execution in spreadsheet programs.
  const cell=v=>{let s=v===null?'':String(v);if(/^[\s]*[=+@-]/.test(s)&&typeof v!=='number')s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  return '\uFEFF'+[result.columns,...result.values].map(row=>row.map(cell).join(';')).join('\r\n');
}
