const FULL=2000,CHILD=1000,MAX=4;
const S={step:1,people:[{name:'',age:''}],email:'',errors:{},seats:5,soldOutDemo:false,order:null,conflict:false};
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const price=p=>p.age<14?CHILD:FULL;
const rub=n=>n.toLocaleString('ru-RU')+' ₽';
const total=()=>S.people.reduce((s,p)=>s+price(p),0);
function validate(){const e={};
S.people.forEach((p,i)=>{if(!p.name.trim())e['n'+i]='Укажите имя';
const a=p.age;if(a===''||!/^\d+$/.test(String(a))||+a>120)e['a'+i]='Возраст 0–120'});
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(S.email))e.email='Введите корректный email';
if(!e.a0&&!Object.keys(e).some(k=>k[0]==='a')){
const hasAdult=S.people.some(p=>+p.age>=18);
if(S.people.some(p=>+p.age<14)&&!hasAdult)e.rule='Ребёнок младше 14 лет может попасть на мероприятие только с участником от 18 лет в том же заказе.';}
S.errors=e;return !Object.keys(e).length}
function sync(){S.people.forEach((p,i)=>{p.name=$('#n'+i).value;p.age=$('#a'+i).value});S.email=$('#em')?.value??S.email}
function render(){const a=$('#app');
const steps=['Участники','Проверка','Готово'].map((t,i)=>`<span class="${S.step===i+1?'on':''}">${i+1}. ${t}</span>`).join('');
let h=`<h1>Оформление билетов</h1><div class="steps">${steps}</div>`;
if(S.step===1)h+=form();else if(S.step===2)h+=review();else h+=done();
h+=`<div class="card demo"><b>Демо-панель</b><label><input type="checkbox" id="so" ${S.soldOutDemo?'checked':''}> Места закончатся до подтверждения</label><div class="muted">Свободно мест: ${S.seats}</div></div>`;
a.innerHTML=h;bind()}
function form(){const e=S.errors;
let h=`<div class="card"><h2>Участники (${S.people.length} из ${MAX})</h2>`;
if(e.rule)h+=`<div class="alert">${e.rule}</div>`;
S.people.forEach((p,i)=>{h+=`<div class="row"><div><label>Имя</label><input id="n${i}" class="${e['n'+i]?'bad':''}" value="${esc(p.name)}" autocomplete="off">${e['n'+i]?`<div class="err">${e['n'+i]}</div>`:''}</div>
<div><label>Возраст</label><input id="a${i}" inputmode="numeric" class="${e['a'+i]?'bad':''}" value="${esc(p.age)}">${e['a'+i]?`<div class="err">${e['a'+i]}</div>`:''}</div>
<div><label>&nbsp;</label><button class="x" data-del="${i}" ${S.people.length<2?'disabled':''} aria-label="Удалить">✕</button></div></div>`});
h+=`<button class="sec" id="add" ${S.people.length>=MAX?'disabled':''}>+ Добавить участника</button></div>
<div class="card"><h2>Контакт</h2><label>Email (один на заказ)</label><input id="em" type="email" class="${e.email?'bad':''}" value="${esc(S.email)}">${e.email?`<div class="err">${e.email}</div>`:''}</div>
<div class="total"><span>Итого</span><span>${S.people.every(p=>p.age!==''&&/^\d+$/.test(p.age))?rub(total()):'—'}</span></div>
<div class="actions"><button id="next">Продолжить</button></div>`;return h}
function review(){let h='';
if(S.conflict)h+=`<div class="alert"><b>Места закончились.</b> Пока вы оформляли заказ, свободных мест осталось ${S.seats}, а вам нужно ${S.people.length}. Заказ не создан, оплата не списана. Уменьшите число участников или попробуйте позже.</div>`;
h+=`<div class="card"><h2>Состав заказа</h2><table>${S.people.map(p=>`<tr><td>${esc(p.name)}, ${p.age} л.<div class="muted">${p.age<14?'Детский билет':'Полный билет'}</div></td><td>${rub(price(p))}</td></tr>`).join('')}</table>
<div class="total"><span>Итого</span><span>${rub(total())}</span></div><p class="muted">Email: ${esc(S.email)}</p></div>
<div class="actions"><button class="sec" id="back">Изменить данные</button><button id="confirm" ${S.conflict&&S.seats<S.people.length?'disabled':''}>Подтвердить заказ</button></div>`;return h}
function done(){const o=S.order;return `<div class="card alert ok"><h2>Заказ оформлен ✓</h2><p>Номер: <b>${o.id}</b><br>Подтверждение отправлено на ${esc(o.email)}</p></div>
<div class="card"><table>${o.people.map(p=>`<tr><td>${esc(p.name)}, ${p.age} л.</td><td>${rub(price(p))}</td></tr>`).join('')}</table><div class="total"><span>Итого</span><span>${rub(o.total)}</span></div></div>
<div class="actions"><button id="again">Новый заказ</button></div>`}
function bind(){
$('#so').onchange=e=>{S.soldOutDemo=e.target.checked};
const q=(s,f)=>{const el=$(s);if(el)el.onclick=f};
q('#add',()=>{sync();if(S.people.length<MAX){S.people.push({name:'',age:''});render()}});
document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{sync();S.people.splice(+b.dataset.del,1);render()});
q('#next',()=>{sync();if(validate()){S.conflict=false;S.step=2}render()});
q('#back',()=>{S.step=1;S.conflict=false;render()});
q('#confirm',()=>{if(S.soldOutDemo)S.seats=Math.min(S.seats,S.people.length-1);
if(S.seats<S.people.length){S.conflict=true;render();return}
S.seats-=S.people.length;S.order={id:'T-'+Math.floor(100000+Math.random()*900000),people:S.people.map(p=>({...p})),email:S.email,total:total()};S.step=3;render()});
q('#again',()=>{S.people=[{name:'',age:''}];S.email='';S.errors={};S.order=null;S.conflict=false;S.soldOutDemo=false;S.seats=Math.max(S.seats,5);S.step=1;render()});
}
render();
