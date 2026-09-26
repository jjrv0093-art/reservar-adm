import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4vXWnSW2dX-rjm1Lc93LEh09oE6ftdgc",
  authDomain: "reservar-adm.firebaseapp.com",
  projectId: "reservar-adm",
  storageBucket: "reservar-adm.firebasestorage.app",
  messagingSenderId: "557571104394",
  appId: "1:557571104394:web:18c596d6190b2d013fd773"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = s => document.querySelector(s);
const toast = (m) => { const t=$("#toast"); t.textContent=m; t.classList.remove("hidden"); setTimeout(()=>t.classList.add("hidden"),2500); };

let currentTab = "planes";

$("#loginBtn").onclick = async () => {
  const email = $("#email").value.trim();
  const pass = $("#pass").value.trim();
  $("#msg").textContent = "Entrando...";
  try{
    await signInWithEmailAndPassword(auth, email, pass);
    $("#msg").textContent = "";
  }catch(e){
    $("#msg").textContent = e.code + ": " + e.message;
  }
};
$("#logoutBtn").onclick = ()=> signOut(auth);

onAuthStateChanged(auth, async (user)=>{
  if(!user){
    $("#loginWrap").classList.remove("hidden");
    $("#panelBox").classList.add("hidden");
    return;
  }
  $("#loginWrap").classList.add("hidden");
  $("#panelBox").classList.remove("hidden");
  loadAll();
});

document.querySelectorAll(".tab").forEach(b=>{
  b.onclick = ()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    currentTab = b.dataset.tab;
    loadAll();
  };
});

$("#guardarHoras").onclick = async ()=>{
  const h = parseInt($("#horasPlan").value);
  if(!h) return toast("Horas inválidas");
  await setDoc(doc(db,"config","planes"), { horasDefault: h }, {merge:true});
  toast("Guardado "+h+"h");
};

async function loadAll(){
  const grid = $("#grid");
  grid.innerHTML = "Cargando...";
  try{
    if(currentTab==="planes"){
      const horasDoc = await getDoc(doc(db,"config","planes"));
      if(horasDoc.exists()) $("#horasPlan").value = horasDoc.data().horasDefault || 48;
      const snap = await getDocs(collection(db,"planes"));
      if(snap.empty){ grid.innerHTML="<div class='card'>No hay planes todavía. Cuando alguien pague, aparece acá.</div>"; return; }
      grid.innerHTML="";
      snap.forEach(d=>{
        const p=d.data();
        const div=document.createElement("div");
        div.className="card";
        div.innerHTML=`<b>${p.nombre||d.id}</b><br>$${p.monto||0} - ${p.estado||"pendiente"}<br><small>${p.userId||""}</small><div style="margin-top:10px;display:flex;gap:6px"><button class="btn btn-small ok">Aprobar</button><button class="btn btn-small warn">Rechazar</button></div>`;
        div.querySelector(".ok").onclick=async()=>{ await updateDoc(doc(db,"planes",d.id), {estado:"aprobado"}); toast("Aprobado"); loadAll(); };
        div.querySelector(".warn").onclick=async()=>{ await updateDoc(doc(db,"planes",d.id), {estado:"rechazado"}); toast("Rechazado"); loadAll(); };
        grid.appendChild(div);
      });
    } else if(currentTab==="soporte"){
      const snap = await getDocs(collection(db,"soporte"));
      if(snap.empty){ grid.innerHTML="<div class='card'>Sin tickets</div>"; return; }
      grid.innerHTML=""; snap.forEach(d=>{
        const s=d.data(); const div=document.createElement("div"); div.className="card";
        div.innerHTML=`<b>${s.asunto||"Consulta"}</b><p>${s.mensaje||""}</p><small>${s.email||""}</small><br><button class="btn btn-small ok">Resolver</button>`;
        div.querySelector("button").onclick=async()=>{ await updateDoc(doc(db,"soporte",d.id), {estado:"resuelto"}); loadAll(); };
        grid.appendChild(div);
      });
    } else if(currentTab==="usuarios"){
      const snap = await getDocs(collection(db,"users"));
      if(snap.empty){ grid.innerHTML="<div class='card'>No hay usuarios en ADM. Tus usuarios reales están en el proyecto reservar original. Si querés, migramos todo a este proyecto.</div>"; return; }
      grid.innerHTML=""; snap.forEach(d=>{
        const u=d.data(); const div=document.createElement("div"); div.className="card";
        div.innerHTML=`<b>${u.email||d.id}</b><br>Plan: ${u.plan||"free"}<br><button class="btn btn-small warn">Borrar</button>`;
        div.querySelector("button").onclick=async()=>{ if(confirm("Borrar?")){ await deleteDoc(doc(db,"users",d.id)); loadAll(); } };
        grid.appendChild(div);
      });
    }
  }catch(e){ grid.innerHTML="Error: "+e.message; console.error(e); }
}
