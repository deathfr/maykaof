/* ===== CONFIG ===== */
const PB_URL = "https://acg.baby/pb";
const PB_COLLECTION = "majka";
const PB_PASS = "martyna123";
const CLOUD_NAME = "dwwvvrjwx";
const UPLOAD_PRESET = "web_unsigned";

const isCreator = new URLSearchParams(location.search).get("edit") === "true";

let posts = [];
let editIndex = null;
let fsImages = [];
let fsIndex = 0;

const postsEl = document.getElementById("posts");
const addBox = document.getElementById("addPostBox");
const creatorBar = document.getElementById("creatorBar");

if(!isCreator) creatorBar.style.display = "none";

function toggleAdd(){
  addBox.style.display = addBox.style.display === "block" ? "none" : "block";
}

/* ===== LOAD POSTS ===== */
async function loadPosts(){
	console.log(posts);

  const r = await fetch(
    `${PB_URL}/api/collections/${PB_COLLECTION}/records?sort=-created`
  );
  const d = await r.json();

  posts = d.items.map(p => {
    let images = [];

    if (Array.isArray(p.images)) {
      images = p.images;
    } else if (typeof p.images === "string") {
      try {
        images = JSON.parse(p.images);
      } catch {
        images = [];
      }
    }

    return {
      ...p,
      images
    };
  }).filter(p => p.images.length);

  render();
}

/* ===== ADD POST ===== */
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
      { method: "POST", body: fd }
    );
    const d = await r.json();
    post.images.push(d.secure_url);
  }

  const save = await fetch(
    `${PB_URL}/api/collections/${PB_COLLECTION}/records`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "pass": PB_PASS
      },
      body: JSON.stringify(post)
    }
  );

  if(!save.ok){
    alert("Błąd zapisu posta ❌");
    return;
  }

  titleInput.value = "";
  descInput.value = "";
  imageInput.value = "";
  addBox.style.display = "none";

  loadPosts();
}

/* ===== DELETE / EDIT ===== */
async function deletePost(i){
  await fetch(
    `${PB_URL}/api/collections/${PB_COLLECTION}/records/${posts[i].id}`,
    {
      method: "DELETE",
      headers: { pass: PB_PASS }
    }
  );
  posts.splice(i,1);
  render();
}

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
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "pass": PB_PASS
      },
      body: JSON.stringify({
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

/* ===== RENDER ===== */
function render(){
  postsEl.innerHTML = "";

  posts.forEach((p, idx) => {

    if(!Array.isArray(p.images) || !p.images.length) return;

    let i = 0;

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
    }
    update();

    const prev = document.createElement("button");
    prev.className = "nav prev";
    prev.textContent = "◀";

    const next = document.createElement("button");
    next.className = "nav next";
    next.textContent = "▶";

    prev.onclick = e => {
      e.stopPropagation();
      i = (i - 1 + p.images.length) % p.images.length;
      update();
    };

    next.onclick = e => {
      e.stopPropagation();
      i = (i + 1) % p.images.length;
      update();
    };

    slider.onclick = () => {
      fsImages = p.images;
      fsIndex = i;
      fullscreen.style.display = "flex";
      fsImg.src = fsImages[fsIndex];
    };

    slider.append(img, prev, next, counter);

    const t = document.createElement("div");
    t.className = "post-title";
    t.textContent = p.title;

    const d = document.createElement("div");
    d.className = "post-desc";
    d.textContent = p.desc;

    const a = document.createElement("div");
    a.className = "actions";

    if(isCreator){
      const e = document.createElement("button");
      e.textContent = "✏️";
      e.onclick = () => openEdit(idx);

      const x = document.createElement("button");
      x.textContent = "🗑";
      x.onclick = () => deletePost(idx);

      a.append(e, x);
    }

    post.append(slider, t, d, a);
    postsEl.append(post);
  });
}

fullscreen.onclick = () => fullscreen.style.display = "none";

loadPosts();
