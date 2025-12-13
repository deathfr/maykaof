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
let fsImages=[],fsIndex=0;
let scale=1,startDist=0,startScale=1,startX=0,isPinching=false;

if(isCreator) creatorBar.style.display="flex";

function toggleAdd(){
  addBox.style.display=addBox.style.display==="block"?"none":"block";
}

function preload(src){
  if(!src) return;
  const i=new Image();
  i.src=src;
}

/* LOAD */
async function loadPosts(){
  const r=await fetch(`${PB_URL}/api/collections/${PB_COLLECTION}/records?sort=-created`);
  const d=await r.json();
  posts=d.items.map(p=>({...p,images:JSON.parse(p.images||"[]")}));
  render();
}

/* ADD */
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

/* EDIT / DELETE */
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
  if(!confirm("Usunąć post?")) return;
  await fetch(`${PB_URL}/api/collections/${PB_COLLECTION}/records/${posts[i].id}`,{
    method:"DELETE",headers:{pass:PB_PASS}
  });
  loadPosts();
}

/* FULLSCREEN */
function openFullscreen(images,index){
  fsImages=images;
  fsIndex=index;
  scale=1;
  fullscreen.innerHTML="";
  fullscreen.style.display="flex";
  renderFS();
}

function renderFS(){
  fullscreen.innerHTML="";
  const item=fsImages[fsIndex];

  if(item.type==="video"){
    const v=document.createElement("video");
    v.src=item.url;
    v.controls=true;
    v.autoplay=true;
    fullscreen.append(v);
  } else {
    const img=document.createElement("img");
    img.src=item.url;
    img.style.transform=`scale(${scale})`;
    fullscreen.append(img);
  }
}

fullscreen.onclick=()=>fullscreen.style.display="none";

/* PINCH + SWIPE FS */
fullscreen.addEventListener("touchstart",e=>{
  if(e.touches.length===2){
    isPinching=true;
    const dx=e.touches[0].clientX-e.touches[1].clientX;
    const dy=e.touches[0].clientY-e.touches[1].clientY;
    startDist=Math.hypot(dx,dy);
    startScale=scale;
  } else {
    startX=e.touches[0].clientX;
  }
});

fullscreen.addEventListener("touchmove",e=>{
  if(e.touches.length===2){
    const dx=e.touches[0].clientX-e.touches[1].clientX;
    const dy=e.touches[0].clientY-e.touches[1].clientY;
    scale=Math.min(4,Math.max(1,startScale*(Math.hypot(dx,dy)/startDist)));
    fullscreen.querySelector("img")?.style.setProperty("transform",`scale(${scale})`);
  }
});

fullscreen.addEventListener("touchend",e=>{
  if(isPinching){isPinching=false;return;}
  if(scale>1) return;

  const diff=startX-e.changedTouches[0].clientX;
  if(Math.abs(diff)>60){
    fsIndex=diff>0?(fsIndex+1)%fsImages.length:(fsIndex-1+fsImages.length)%fsImages.length;
    renderFS();
  }
});

/* RENDER */
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

    const prev=document.createElement("button");
    prev.className="nav prev";
    prev.textContent="◀";

    const next=document.createElement("button");
    next.className="nav next";
    next.textContent="▶";

    function update(){
      slider.innerHTML="";
      const item=p.images[i];

      slider.style.setProperty("--bg-img",item.type==="image"?`url(${item.url})`:"none");

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
      slider.onclick=()=>openFullscreen(p.images,i);
    }

    update();

    prev.onclick=e=>{e.stopPropagation();i=(i-1+p.images.length)%p.images.length;update();}
    next.onclick=e=>{e.stopPropagation();i=(i+1)%p.images.length;update();}

    slider.addEventListener("touchstart",e=>startX=e.touches[0].clientX);
    slider.addEventListener("touchend",e=>{
      const diff=startX-e.changedTouches[0].clientX;
      if(Math.abs(diff)>50){
        i=diff>0?(i+1)%p.images.length:(i-1+p.images.length)%p.images.length;
        update();
      }
    });

    slider.append(prev,next,counter);

    const t=document.createElement("div");
    t.className="post-title";
    t.textContent=p.title;

    const d=document.createElement("div");
    d.className="post-desc";
    d.textContent=p.desc;

    const a=document.createElement("actions");

    if(isCreator){
      const e=document.createElement("button");
      e.textContent="✏️ Edytuj";
      e.onclick=()=>openEdit(idx);
      const x=document.createElement("button");
      x.textContent="🗑 Usuń";
      x.onclick=()=>deletePost(idx);
      a.append(e,x);
    }

    post.append(slider,t,d,a);
    postsEl.append(post);
  });
}

loadPosts();
