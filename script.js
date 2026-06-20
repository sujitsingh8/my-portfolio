function openPyModal(){document.getElementById('pyModal').classList.add('open');document.body.style.overflow='hidden'}
function closePyModal(e){if(e&&e.target.id!=='pyModal'&&!e.target.closest('.modal-close'))return;document.getElementById('pyModal').classList.remove('open');document.body.style.overflow=''}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePyModal()});

const nav=document.getElementById('nav');
window.addEventListener('scroll',()=>{nav.classList.toggle('scrolled',scrollY>24)},{passive:true});

const revealObs=new IntersectionObserver(entries=>{
  entries.forEach((e,i)=>{
    if(e.isIntersecting){
      setTimeout(()=>e.target.classList.add('shown'),i*60);
      revealObs.unobserve(e.target);
    }
  });
},{threshold:.15,rootMargin:'0px 0px -50px 0px'});
document.querySelectorAll('.reveal').forEach(el=>revealObs.observe(el));

document.querySelectorAll('.nav-links a').forEach(a=>{
  a.addEventListener('click',()=>document.getElementById('navLinks').classList.remove('open'));
});

async function handleForm(e){
  e.preventDefault();
  const btn=e.target.querySelector('button[type="submit"]');
  const data=Object.fromEntries(new FormData(e.target));

  // --- Lightweight anti-junk checks (deters casual fakes; bots are caught by the honeypot + Web3Forms) ---
  const email=String(data.email||'').trim().toLowerCase();
  const name=String(data.name||'').trim();
  const domain=email.split('@')[1]||'';
  const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const disposable=['mailinator.com','10minutemail.com','guerrillamail.com','guerrillamail.info','sharklasers.com','grr.la','temp-mail.org','tempmail.com','tempmail.dev','throwawaymail.com','yopmail.com','getnada.com','nada.email','trashmail.com','maildrop.cc','dispostable.com','fakeinbox.com','mintemail.com','mailnesia.com','emailondeck.com','mohmal.com','1secmail.com','moakt.com','tmail.io','mail7.io','spambog.com','discard.email','tempr.email','trbvm.com','byom.de'];
  const flash=msg=>{const o=btn.innerHTML;btn.innerHTML=msg;btn.style.background='#991b1b';btn.disabled=true;setTimeout(()=>{btn.innerHTML=o;btn.style.background='';btn.disabled=false},3000);};
  if(name.length<2){return flash('✗ Please enter your name');}
  if(!validEmail){return flash('✗ Enter a valid email');}
  if(disposable.includes(domain)){return flash('✗ Please use a permanent email');}

  const original=btn.innerHTML;
  btn.innerHTML='Sending… <i class="fas fa-spinner fa-spin"></i>';
  btn.disabled=true;
  try{
    const res=await fetch('https://api.web3forms.com/submit',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(data)
    });
    const json=await res.json();
    if(json.success){
      btn.innerHTML='✓ Message sent';
      btn.style.background='var(--green-dark)';
      e.target.reset();
    }else throw new Error();
  }catch{
    btn.innerHTML='✗ Failed — try emailing directly';
    btn.style.background='#991b1b';
  }
  setTimeout(()=>{btn.innerHTML=original;btn.style.background='';btn.disabled=false},3500);
}

/* Internship count — auto-syncs with the number of cards in the Experience section */
(function(){
  const n=document.querySelectorAll('#experience .exp-card').length;
  const num=document.getElementById('internCount');
  const lbl=document.getElementById('internLabel');
  if(num){num.textContent=n;}
  if(lbl){lbl.textContent=n===1?'Internship':'Internships';}
})();

/* Resume "Python Projects" link → land on the section and open the projects modal */
(function(){
  function openPyFromHash(){
    if(location.hash==='#basic-python-projects'){openPyModal();}
  }
  window.addEventListener('hashchange',openPyFromHash);
  window.addEventListener('load',openPyFromHash);
})();

/* Content protection — soft deterrent against casual copying */
(function(){
  const isField=t=>t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA');
  const stop=e=>{e.preventDefault();e.stopPropagation();return false;};
  // Right-click menu
  document.addEventListener('contextmenu',stop);
  // Selection / copy / cut / drag (form fields stay usable)
  ['selectstart','copy','cut','dragstart'].forEach(ev=>
    document.addEventListener(ev,e=>{if(isField(e.target))return;return stop(e);})
  );
  // Devtools & view-source / save / print shortcuts
  document.addEventListener('keydown',e=>{
    const k=(e.key||'').toUpperCase();
    if(k==='F12')return stop(e);
    if((e.ctrlKey||e.metaKey)&&e.shiftKey&&['I','J','C'].includes(k))return stop(e);
    if((e.ctrlKey||e.metaKey)&&['U','S','P'].includes(k)&&!isField(e.target))return stop(e);
  });
})();