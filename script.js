/* ================= CONFIG ================= */
const PB_URL = "https://acg.baby/pb";
const PB_COLLECTION = "majka";
const PB_PASS = "martyna123";

const CLOUD_NAME = "dwwvvrjwx";
const UPLOAD_PRESET = "web_unsigned";

const isCreator = new URLSearchParams(location.search).get("edit") === "true";
const isTouch = window.matchMedia("(pointer: coarse)").matches;

/* ================= STATE ================= */
let posts = [];
let editIndex = null;
let fsImages = [];
let fsIndex = 0;

/* ================= ELEMENTS ================= */
const postsEl = document.getElementById("posts");
const addBox = document.getElementById("addPostBox");
const creatorBar = document.getElementById("creatorBar");
const fullscreen = document.getElementById("fullscreen");
const fsImg = document.getElementById("fsImg");

/* ================= UI ================= */
if(!isCreator && creatorBar) creatorBar.style.display = "none";

function toggleAdd(){
  if(addBox) addBox.style.display =
    addBox.style.display === "block" ? "none" : "block";
}

/* ================= LOAD ================= */
async function loadPosts(){
  const r = await fetch(
    `${PB_URL}/api/collections/${PB_COLLECTION}/records?sort=-created`
  );
  const d = await r.json();

  posts = d.items.map(p => {
    let images = [];
    if(typeof p.images === "string"){
      try{ images = JSON.parse(p.images); }catch{}
    } else if(Array.isArray(p.images)){
      images = p.images;
    }
    return { ...p, images };
  }).filter(p => p.images.length);

  render();
}

/* ================= ADD ================= */
async function addPost(){
  const files = [...imageInput.files];
  if(!files.length) return alert("Dodaj zdjęcia");

  const post = {
    title: titleInput.value,
    desc: descInput.value,
    images: []
  };

  for(const f of files){
    const fd = new FormData();
    fd.append("file", f);
    fd.append("upload_preset", UPLOAD_PRESET);

    const r = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method:"POST", body: fd }
    );
    const d = await r.json();
    post.images.push(d.secure_url);
  }

  await fetch(`${PB_URL}/api/collections/${PB_COLLECTION}/records`,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "pass":PB_PASS
    },
    body:JSON.stringify(post)
  });

  titleInput.value = "";
  descInput.value = "";
  imageInput.value = "";
  if(addBox) addBox.style.display = "none";

  loadPosts();
}

/* ================= DELETE ================= */
async function deletePost(i){
  if(!confirm("Usunąć post?")) return;

  await fetch(
    `${PB_URL}/api/collections/${PB_COLLECTION}/records/${posts[i].id}`,
    { method:"DELETE", headers:{ pass:PB_PASS } }
  );

  posts.splice(i,1);
  render();
}

/* ================= EDIT ================= */
function openEdit(i){
  editIndex = i;
  editTitle.value = posts[i].title;
  editDesc.value = posts[i].desc;
  editModal.style.display = "flex";
}

function closeModal(){
  editModal.style.display = "none";
}

async function saveEdit(){
  const p = posts[editIndex];

  await fetch(
    `${PB_URL}/api/collections/${PB_COLLECTION}/records/${p.id}`,
    {
      method:"PATCH",
      headers:{
        "Content-Type":"application/json",
        "pass":PB_PASS
      },
      body:JSON.stringify({
        title: editTitle.value,
        desc: editDesc.value
      })
    }
  );

  p.title = editTitle.value;
  p.desc = editDesc.value;
  render();
  closeModal();
}

/* ================= RENDER ================= */
function render(){
  postsEl.innerHTML = "";

  posts.forEach((p, idx) => {
    let i = 0;
    let startX = 0;

    const post = document.createElement("div");
    post.className = "post";

    const slider = document.createElement("div");
    slider.className = "slider";

    const img = document.createElement("img");
    const counter = document.createElement("div");
    counter.className = "counter";

    function update(){
      img.src = p.images[i];
      counter.textContent = `${i+1}/${p.images.length}`;
      img.classList.remove("zoomed");
    }
    update();

    /* desktop fullscreen */
    if(!isTouch){
      slider.onclick = () => {
        fullscreen.style.display = "flex";
        fsImg.src = p.images[i];
      };
    }

    /* mobile tap zoom */
    if(isTouch){
      img.onclick = e => {
        e.stopPropagation();
        img.classList.toggle("zoomed");
      };
    }

    /* swipe */
    slider.addEventListener("touchstart", e=>{
      startX = e.touches[0].clientX;
    });

    slider.addEventListener("touchend", e=>{
      const diff = startX - e.changedTouches[0].clientX;
      if(Math.abs(diff) > 50){
        i = diff > 0
          ? (i+1)%p.images.length
          : (i-1+p.images.length)%p.images.length;
        update();
      }
    });

    /* arrows (desktop) */
    const prev = document.createElement("button");
    prev.className = "nav prev";
    prev.textContent = "◀";
    prev.onclick = e => {
      e.stopPropagation();
      i = (i-1+p.images.length)%p.images.length;
      update();
    };

    const next = document.createElement("button");
    next.className = "nav next";
    next.textContent = "▶";
    next.onclick = e => {
      e.stopPropagation();
      i = (i+1)%p.images.length;
      update();
    };

    slider.append(img, prev, next, counter);

    const t = document.createElement("div");
    t.className = "post-title";
    t.textContent = p.title;

    const d = document.createElement("div");
    d.className = "post-desc";
    d.textContent = p.desc;

    const actions = document.createElement("div");
    actions.className = "actions";

    if(isCreator){
      const eBtn = document.createElement("button");
      eBtn.textContent = "✏️";
      eBtn.onclick = () => openEdit(idx);

      const xBtn = document.createElement("button");
      xBtn.textContent = "🗑";
      xBtn.onclick = () => deletePost(idx);

      actions.append(eBtn, xBtn);
    }

    post.append(slider, t, d, actions);
    postsEl.append(post);
  });
}

/* ================= FULLSCREEN ================= */
fullscreen.onclick = () => fullscreen.style.display = "none";

loadPosts();
