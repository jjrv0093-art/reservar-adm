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

const ADMIN_EMAIL = "jjrv.0093@gmail.com";

let currentTab = "planes";

// LOGIN
$("#loginBtn").onclick = async () => {
  const email = $("#email").value.trim();
  const pass = $("#pass").value.trim();
  if(!email || !pass) return toast("Completa email y pass");
  try{
    await signInWithEmailAndPassword(auth, email, pass);
  }catch(e){
    $("#loginNote").textContent = e.message;
    toast("Error login");
  }
};

$("#logoutBtn").onclick = ()=> signOut(auth);

onAuthStateChanged(auth, async (user)=>{
  if(!user){ $("#loginBox").classList.remove("hidden"); $("#panelBox").classList.add("hidden"); return; }
  if(user.email !== ADMIN_EMAIL){ toast("No sos admin"); await signOut(auth); return; }
  $("#loginBox").classList.add("hidden");
  $("#panelBox").classList.remove("hidden");
  loadAll();
});

// TABS
document.querySelectorAll(".tab").forEach(b=>{
  b.onclick = ()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    currentTab = b.dataset.tab;
    loadAll();
  };
});

// HORAS PLAN
$("#guardarHoras").onclick = async ()=>{
  const h = parseInt($("#horasPlan").value);
  if(!h) return toast("Horas inválidas");
  await setDoc(doc(db,"config","planes"), { horasDefault: h }, {merge:true});
  toast("Horas guardadas: "+h);
};

async function loadAll(){
  const grid = $("#grid");
  grid.innerHTML = "Cargando...";
  try{
    if(currentTab==="planes"){
      const horasDoc = await getDoc(doc(db,"config","planes"));
      if(horasDoc.exists()) $("#horasPlan").value = horasDoc.data().horasDefault || 48;
      const snap = await getDocs(collection(db,"planes"));
      if(snap.empty){ grid.innerHTML="<div class='card'>No hay planes aún. Crea planes desde la app principal o acá se verán los pagos.</div>"; return; }
      grid.innerHTML="";
      snap.forEach(d=>{
        const p=d.data();
        const div=document.createElement("div");
        div.className="card";
        div.innerHTML=`<b>${p.nombre||d.id}</b><br>Monto: $${p.monto||0}<br>Estado: ${p.estado||"pendiente"}<br><small>${p.userId||""}</small><br><br>
        <button class="btn small ok">Aprobar</button> <button class="btn small warn">Rechazar</button>`;
        div.querySelector(".ok").onclick=async()=>{ await updateDoc(doc(db,"planes",d.id), {estado:"aprobado"}); toast("Aprobado"); loadAll(); };
        div.querySelector(".warn").onclick=async()=>{ await updateDoc(doc(db,"planes",d.id), {estado:"rechazado"}); toast("Rechazado"); loadAll(); };
        grid.appendChild(div);
      });
    } else if(currentTab==="soporte"){
      const snap = await getDocs(collection(db,"soporte"));
      if(snap.empty){ grid.innerHTML="<div class='card'>Sin tickets</div>"; return; }
      grid.innerHTML="";
      snap.forEach(d=>{
        const s=d.data();
        const div=document.createElement("div");
        div.className="card";
        div.innerHTML=`<b>${s.asunto||"Consulta"}</b><br>${s.mensaje||""}<br><small>${s.email||""}</small><br><br><button class="btn small">Resolver</button>`;
        div.querySelector("button").onclick=async()=>{ await updateDoc(doc(db,"soporte",d.id), {estado:"resuelto
