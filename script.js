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