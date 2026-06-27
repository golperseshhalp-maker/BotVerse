const firebaseConfig = {
    apiKey: "AIzaSyCBSXPnNlB6BTeTCyNrsZkLm-Dq6_f6J0k",
    authDomain: "nexwabapp.firebaseapp.com",
    databaseURL: "https://nexwabapp-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "nexwabapp",
    storageBucket: "nexwabapp.firebasestorage.app",
    messagingSenderId: "288890799429",
    appId: "1:288890799429:web:ea5061d7b9784e786d2a2c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let allApps = [], allPrompts = [], allCoding = [], allPresets = [], allVideos = [];
let telegramGlobalLink = "#", adminAvatarUrl = "https://i.ibb.co/L9p6p5f/admin-avatar.png"; 
let clickCount = 0;

db.ref('settings').on('value', snap => {
    const d = snap.val();
    if(d) {
        telegramGlobalLink = d.tg || "#";
        document.getElementById('fbLink').href = d.fb || "#";
        document.getElementById('tgLinkSidebar').href = telegramGlobalLink;
        document.getElementById('ytLinkSidebar').href = d.yt || "#";
        if(d.adminAvatar) adminAvatarUrl = d.adminAvatar; 
        if(d.adImg) document.getElementById('ad-image').src = d.adImg;
        if(d.adLink) document.getElementById('ad-link').href = d.adLink;
    }
});

db.ref('slider').on('value', snap => {
    const d = snap.val();
    if(d) {
        if(d.s1) document.getElementById('slideImg1').src = d.s1;
        if(d.s2) document.getElementById('slideImg2').src = d.s2;
        if(d.s3) document.getElementById('slideImg3').src = d.s3;
    }
});

function getAdminMeta() {
    return `<div class="admin-meta">
                <img class="admin-avatar" src="${adminAvatarUrl}"/>
                <div class="admin-text">Admin <i class="fas fa-check-circle verified-badge"></i></div>
            </div>`;
}

function loadData(path, array, renderFn) {
    db.ref(path).on('value', snap => {
        array.length = 0; 
        snap.forEach(child => { array.push({ key: child.key, ...child.val() }); });
        renderFn(array);
        renderHomeFeed();
    });
}

loadData('apps', allApps, data => renderList('firebase-apps', data, 'openAppDetail'));
loadData('presets', allPresets, data => renderList('firebase-presets', data, 'openPresetDetail'));
loadData('videos', allVideos, data => renderList('firebase-videos', data, 'openVideoDetail'));
loadData('prompts', allPrompts, data => renderPrompts('firebase-prompts', data));
loadData('coding', allCoding, data => renderCoding('firebase-coding', data));

function renderList(id, data, clickFn) {
    document.getElementById(id).innerHTML = data.map(v => `
        <div class='card' onclick='${clickFn}("${v.key}")'>
            <img src='${v.img}'/>
            <div class='card-title'>${v.title}</div>
            ${getAdminMeta()}
        </div>`).join('');
}

function renderPrompts(id, data) {
    document.getElementById(id).innerHTML = data.map(v => `
        <div class='card' style='padding:10px;' onclick='openPromptDetail("${v.key}")'>
            <h3 style='font-size:14px;color:var(--accent-color);'>${v.title}</h3>
            <img src='${v.img}' style='width:100%;border-radius:10px;'/>
            ${getAdminMeta()}
        </div>`).join('');
}

function renderCoding(id, data) {
    document.getElementById(id).innerHTML = data.map(v => `
        <div class='card' style='padding:15px;' onclick='openCodeDetail("${v.key}")'>
            <span><i class='fas fa-file-code'></i> &nbsp; ${v.title}</span>
            ${getAdminMeta()}
        </div>`).join('');
}

function renderHomeFeed() {
    const container = document.getElementById('firebase-home');
    if (document.getElementById('searchInput').value.trim() !== "") return;
    let combined = [...allApps.map(i=>({...i,type:'app'})),...allPresets.map(i=>({...i,type:'preset'})),...allPrompts.map(i=>({...i,type:'prompt'})),...allVideos.map(i=>({...i,type:'video'}))].sort((a,b)=>a.key<b.key?1:-1);
    container.innerHTML = combined.map(v=>{
        const click = v.type==='app'?`openAppDetail("${v.key}")`:v.type==='preset'?`openPresetDetail("${v.key}")`:v.type==='video'?`openVideoDetail("${v.key}")`:`openPromptDetail("${v.key}")`;
        if(v.type === 'prompt') return `<div class='card' style='padding:10px;' onclick='${click}'><h3 style='font-size:14px;color:var(--accent-color);'>${v.title}</h3><img src='${v.img}' style='width:100%;border-radius:10px;'/>${getAdminMeta()}</div>`;
        return `<div class='card' onclick='${click}'><img src='${v.img}'/><div class='card-title'>${v.title}</div>${getAdminMeta()}</div>`;
    }).join('');
}

// Navigation & Global UI
function toggleNav(){ document.getElementById('sidebar').classList.toggle('active'); }

function triggerLoading(cb) { 
    const l = document.getElementById('site-loader'); 
    l.classList.add('active'); 
    setTimeout(()=>{ if(cb)cb(); setTimeout(()=>l.classList.remove('active'),250); },400); 
}

function showCategory(cat){ 
    triggerLoading(()=>{ 
        document.getElementById('sidebar').classList.remove('active'); 
        hideAllDetails(); 
        hideAllCategories(); 
        if(cat==='all'){
            document.getElementById('firebase-home').style.display='block';
            document.getElementById('mainSlider').style.display='block';
        } else {
            document.getElementById('mainSlider').style.display='none'; 
            document.getElementById('firebase-'+cat).style.display='grid';
        }
    }); 
}

function hideAllCategories() { 
    ['firebase-home','firebase-apps','firebase-prompts','firebase-coding','firebase-presets','firebase-videos'].forEach(id=> {
        const el = document.getElementById(id);
        if(el) el.style.display='none';
    }); 
}

function hideAllDetails() {
    ['app-detail-view','prompt-detail-view','code-detail-view','preset-detail-view','video-detail-view'].forEach(id=> {
        const el = document.getElementById(id);
        if(el) el.style.display='none';
    });
}

function closeAd() { document.getElementById('interstitial-ad').style.display = 'none'; }

// Slider logic
let curSlide = 0; 
setInterval(()=>{
    const t=document.getElementById('slideTrack');
    if(t){
        curSlide=(curSlide+1)%3;
        t.style.transform=`translateX(-${curSlide*33.333}%)`;
    }
}, 4000);

// Search
document.getElementById('searchBtn').onclick=()=>{ 
    const sw=document.getElementById('searchWrapper'); 
    sw.classList.toggle('active'); 
    if(sw.classList.contains('active'))document.getElementById('searchInput').focus(); 
};