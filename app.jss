import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc, query, orderBy, where, addDoc, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA6a4zq7V4K5Q5e4v4a9a0b0c0d0e0f0a0b",
  authDomain: "reservar-b1b1a.firebaseapp.com",
  projectId: "reservar-b1b1a",
  storageBucket: "reservar-b1b1a.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const $ = s => document.querySelector(s);
const grid = $("#grid");
const tabs = document.querySelectorAll(".tab");
const loginBox = $("#loginBox");
const panelBox = $("#panelBox");
const emailI = $("#email");
const passI = $("#pass");
const loginBtn = $("#loginBtn");
const logoutBtn = $("#logoutBtn");
const horasInput = $("#horasPlan");
const guardarHorasBtn = $("#guardarHoras");
const toast = $("#toast");

function showToast(m){
  toast.textContent=m; toast.classList.remove("hidden");
  setTimeout(()=>toast.classList.add("hidden"),3000);
}

let currentTab="planes";
let horasPlanGlobal=48;

onAuthStateChanged(auth, async user=>{
  if(user){
    loginBox.classList.add("hidden");
    panelBox.classList.remove("hidden");
    const cfg = await getDoc(doc(db,"config","global"));
    if(cfg.exists()){ horasPlanGlobal=cfg.data().horasPlan||48; horasInput.value=horasPlanGlobal; }
    loadData();
  }else{
    loginBox.classList.remove("hidden");
    panelBox.classList.add("hidden");
  }
});

loginBtn.onclick=async()=>{
  try{ await signInWithEmailAndPassword(auth,emailI.value,passI.value); }
  catch(e){ $("#loginNote").textContent=e.message; }
};
logoutBtn.onclick=()=>signOut(auth);

guardarHorasBtn.onclick=async()=>{
  const v = parseInt(horasInput.value);
  if(!v) return showToast("Poné horas");
  await setDoc(doc(db,"config","global"),{horasPlan:v},{merge:true});
  horasPlanGlobal=v;
  showToast("Guardado: "+v+"hs");
};

tabs.forEach(t=>t.onclick=()=>{
  tabs.forEach(x=>x.classList.remove("active"));
  t.classList.add("active");
  currentTab=t.dataset.tab;
  loadData();
});

async function loadData(){
  grid.innerHTML="Cargando...";
  if(currentTab==="planes"){
    const snap = await getDocs(query(collection(db,"planes"), orderBy("creadoEn","desc")));
    grid.innerHTML="";
    snap.forEach(d=>{
      const p=d.data();
      const id=d.id;
      const div=document.createElement("div");
      div.className="item"+(p.destacado?" destacado":"");
      div.innerHTML=`
        <div class="row" style="justify-content:space-between">
          <b>${p.nombre||"Sin nombre"}</b>
          <span class="badge ${p.activo?"ok":"no"}">${p.activo?"Activo":"Pausado"}</span>
        </div>
        <small>${p.localidad||""} - ${p.categoria||""} - $${p.precio||0}</small><br>
        <small>Saludo: ${p.saludo? "SI":"NO"} | ByC: ${p.byc? "SI":"NO"}</small><br><br>
        <div class="row">
          <button class="btn small ghost" data-a="toggle">${p.activo?"Pausar":"Activar"}</button>
          <button class="btn small ghost" data-a="dest">${p.destacado?"Quitar destacado":"Destacar"}</button>
          <button class="btn small ghost" data-a="borrar">Borrar</button>
        </div>`;
      div.querySelector('[data-a="toggle"]').onclick=async()=>{ await updateDoc(doc(db,"planes",id),{activo:!p.activo}); loadData(); };
      div.querySelector('[data-a="dest"]').onclick=async()=>{ await updateDoc(doc(db,"planes",id),{destacado:!p.destacado}); loadData(); };
      div.querySelector('[data-a="borrar"]').onclick=async()=>{ if(confirm("¿Borrar?")){ await deleteDoc(doc(db,"planes",id)); loadData(); } };
      grid.appendChild(div);
    });
  }else if(currentTab==="soporte"){
    const snap = await getDocs(query(collection(db,"soporte"), orderBy("fecha","desc")));
    grid.innerHTML="";
    if(snap.empty) grid.innerHTML="<div class='card'>Sin mensajes</div>";
    snap.forEach(d=>{
      const s=d.data(); const id=d.id;
      const div=document.createElement("div"); div.className="item";
      div.innerHTML=`<b>${s.email||""}</b> - ${s.asunto||""}<br><small>${s.mensaje||""}</small><br><small>${s.fecha?.toDate? s.fecha.toDate().toLocaleString(): ""}</small><br><br><button class="btn small ghost">Borrar</button>`;
      div.querySelector("button").onclick=async()=>{ await deleteDoc(doc(db,"soporte",id)); loadData(); };
      grid.appendChild(div);
    });
  }else if(currentTab==="usuarios"){
    const snap = await getDocs(collection(db,"usuarios"));
    grid.innerHTML="";
    snap.forEach(d=>{
      const u=d.data();
      const div=document.createElement("div"); div.className="item";
      div.innerHTML=`<b>${u.email||d.id}</b><br><small>Planes: ${u.planesCount||0}</small>`;
      grid.appendChild(div);
    });
  }
}
