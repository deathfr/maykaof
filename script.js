const PB_URL="https://acg.baby/pb";
const PB_COLLECTION="majka";
const PB_PASS="martyna123";
const CLOUD_NAME="dwwvvrjwx";
const UPLOAD_PRESET="web_unsigned";

const isCreator=new URLSearchParams(location.search).get("edit")==="true";

const postsEl=document.getElementById("posts");
const addBox=document.getElementById("addPostBox");
const creatorBar=document.getElementById("creatorBar");
const fullscreen=document.getElementById("fullscreen");

const editModal=document.getElementById("editModal");
const editTitle=document.getElementById("editTitle");
const editDesc=document.getElementById("editDesc");

let posts=[],editIndex=null;

if(isCreator) creatorBar.style.display="flex";

function toggleAdd(){
  addBox.style.display=addBox.style.display==="block"?"none":"block";
}

function preload(src){
  const i=new Image();
  i.src=src;
}

/* ===== LOAD ===== */
async function loadPosts(){
  const r=await fetch(`${PB_URL}/api/collections/${PB_COLLECTION}/records?sort=-created`);
  const d=await r.json();
  posts=d.items.map(p=>({...p,images:JSON.parse(p.images||"[]")}));
  render();
}

/* ===== ADD ===== */
async function addPost(){
  const files=[...imageInput.files];
  if(!files.length) return;

  const post={title:titleInput.value,desc:descInput.value,images:[]};

  for(const f of files){
    const type=f.type.startsWith("video")?"video":"image";
    const fd=new FormData();
    fd.append("file",f);
    fd.append("upload_preset",UPLOAD_PRESET);

    const r=await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`,
      {method:"POST",body:fd}
    );
    const d=await r.json();
    post.images.push({url:d.secure_url,type});
  }

  await fetch(`${PB_URL}/api/collections/${PB_COLLECTION}/records`,{
    method:"POST",
    headers:{"Content-Type":"application/json","pass":PB_PASS},
    body:JSON.stringify(post)
  });

  addBox.style.display="none";
  loadPosts();
}

/* ===== EDIT ===== */
function openEdit(i){
  editIndex=i;
  editTitle.value=posts[i].title;
  editDesc.value=posts[i].desc;
  editModal.style.display="flex";
}
function closeModal(){editModal.style.display="none";}
async function saveEdit(){
  const p=posts[editIndex];
  await fetch(`${PB_URL}/api/collections/${PB_COLLECTION}/records/${p.id}`,{
    method:"PATCH",
    headers:{"Content-Type":"application/json","pass":PB_PASS},
    body:JSON.stringify({title:editTitle.value,desc:editDesc.value})
  });
  closeModal(); loadPosts();
}
async function deletePost(i){
  if(!confirm("Usunąć post?"))return;
  await fetch(`${PB_URL}/api/collections/${PB_COLLECTION}/records/${posts[i].id}`,{
    method:"DELETE",headers:{pass:PB_PASS}
  });
  loadPosts();
}

/* ===== FULLSCREEN ===== */
function openFullscreen(item){
  fullscreen.innerHTML="";
  fullscreen.style.display="flex";

  if(item.type==="video"){
    const v=document.createElement("video");
    v.src=item.url;
    v.controls=true;
    v.autoplay=true;
    fullscreen.append(v);
  } else {
    const img=document.createElement("img");
    img.src=item.url;
    fullscreen.append(img);
  }
}
fullscreen.onclick=()=>fullscreen.style.display="none";

/* ===== RENDER ===== */
function render(){
  postsEl.innerHTML="";
  posts.forEach((p,idx)=>{
    let i=0,startX=0;

    const post=document.createElement("div");
    post.className="post";

    const slider=document.createElement("div");
    slider.className="slider";

    const counter=document.createElement("div");
    counter.className="counter";

    function update(){
      slider.innerHTML="";
      const item=p.images[i];

      if(item.type==="video"){
        const v=document.createElement("video");
        v.src=item.url;
        v.controls=true;
        v.muted=true;
        slider.append(v);
      } else {
        const img=document.createElement("img");
        img.src=item.url;
        slider.append(img);
        preload(p.images[(i+1)%p.images.length]?.url);
        preload(p.images[(i-1+p.images.length)%p.images.length]?.url);
      }

      counter.textContent=`${i+1}/${p.images.length}`;
      slider.onclick=()=>openFullscreen(item);
    }
    update();

    slider.addEventListener("touchstart",e=>startX=e.touches[0].clientX);
    slider.addEventListener("touchend",e=>{
      const d=startX-e.changedTouches[0].clientX;
      if(Math.abs(d)>50){
        i=d>0?(i+1)%p.images.length:(i-1+p.images.length)%p.images.length;
        update();
      }
    });

    const t=document.createElement("div");
    t.className="post-title"; t.textContent=p.title;

    const d=document.createElement("div");
    d.className="post-desc"; d.textContent=p.desc;

    const a=document.createElement("div");
    a.className="actions";

    if(isCreator){
      const e=document.createElement("button");
      e.textContent="✏️ Edytuj";
      e.onclick=()=>openEdit(idx);

      const x=document.createElement("button");
      x.textContent="🗑 Usuń";
      x.onclick=()=>deletePost(idx);

      a.append(e,x);
    }

    slider.append(counter);
    post.append(slider,t,d,a);
    postsEl.append(post);
  });
}

loadPosts();
