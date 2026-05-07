// ═══════════════════════════════════════════════════════════════
// tools-app.js — Boîte à outils forensique CAS-IN
//
// Extrait de tools.html v3.0 → fichier séparé pour :
//   • Cache navigateur séparé du HTML
//   • Versioning indépendant via le Service Worker
//   • Lisibilité (le HTML descend de 1223 → ~512 lignes)
//
// Bit-pour-bit identique au bloc <script> original.
// Toutes les fonctions appelées par onclick/oninput/onchange
// (calcCluster, calcFAT, calcHash, decodeMFT, decodeSFN, etc.)
// restent globales (window.*).
//
// Outils exposés :
//   • Convertisseur hex/ASCII/Base64
//   • Calculateurs FAT/NTFS (cluster, run-list, timestamps)
//   • Decoders : MFT, SFN (FAT short name), FILETIME
//   • ROT13/Caesar
//   • Hash (MD5, SHA-1, SHA-256)
//   • File signature parser (magic bytes)
// ═══════════════════════════════════════════════════════════════


// ── Raccourci Entrée pour calculer ───────────────────────────
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (e.target.tagName === 'BUTTON') return;
  const panel = document.querySelector('.tool-panel.on');
  if (!panel) return;
  const map = {
    'tool-ts': calcTS, 'tool-rl': calcRL,
    'tool-fat': calcFAT, 'tool-ntfs': calcNTFS,
    'tool-sfn': decodeSFN, 'tool-magic': identifyMagic,
    'tool-bitmap': decodeBitmap, 'tool-hashid': identifyHash,
    'tool-cluster': calcCluster, 'tool-mft': decodeMFT
  };
  if (map[panel.id]) { e.preventDefault(); map[panel.id](); }
});

// ── Tool nav ─────────────────────────────────────────────────
function showTool(id, btn) {
  document.querySelectorAll('.tool-panel').forEach(p=>p.classList.remove('on'));
  document.getElementById('tool-'+id).classList.add('on');
  document.querySelectorAll('.tnav-btn').forEach(b=>{
    b.classList.remove('on');
    b.setAttribute('aria-selected', 'false');
    b.setAttribute('tabindex', '-1');  // v2.59 — roving tabindex pour a11y
  });
  btn.classList.add('on');
  btn.setAttribute('aria-selected', 'true');
  btn.setAttribute('tabindex', '0');
}

// v2.59 — Navigation clavier ARIA pour le tablist (←/→/Home/End)
document.addEventListener('DOMContentLoaded', function () {
  const tabs = Array.from(document.querySelectorAll('.tnav-btn[role="tab"]'));
  if (!tabs.length) return;
  tabs.forEach(function (tab, idx) {
    tab.addEventListener('keydown', function (e) {
      let target = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        target = tabs[(idx + 1) % tabs.length];
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        target = tabs[(idx - 1 + tabs.length) % tabs.length];
      } else if (e.key === 'Home') {
        target = tabs[0];
      } else if (e.key === 'End') {
        target = tabs[tabs.length - 1];
      } else {
        return;
      }
      e.preventDefault();
      target.focus();
      target.click();  // active l'onglet
    });
  });
});

// ── Helpers ───────────────────────────────────────────────────
function showResult(id, html) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!html) { el.innerHTML=''; el.classList.add('empty'); return; }
  const isErr = html.includes('alert-box');
  const copyBtn = isErr ? '' :
    '<button type="button" onclick="copyResult(\'' + id + '\')" '
    + 'style="float:right;margin:-.1rem 0 .5rem .5rem;font-size:.68rem;'
    + 'font-family:var(--mono);padding:.18rem .55rem;border-radius:4px;'
    + 'border:1px solid var(--border);background:transparent;'
    + 'color:var(--muted);cursor:pointer" '
    + 'onmouseover="this.style.color=\'var(--cyan)\'" '
    + 'onmouseout="this.style.color=\'var(--muted)\'">📋 Copier</button>';
  el.innerHTML = '<div class="rb-title">Résultat</div>' + copyBtn + html;
  el.classList.remove('empty');
}
function row(lbl,val,cls=''){return`<div class="rb-row"><span class="rb-lbl">${lbl}</span><span class="rb-val ${cls}">${val}</span></div>`;}
function step(lbl,val){return`<div class="step" style="margin-top:.5rem"><div class="step-lbl">${lbl}</div><div class="step-val">${val}</div></div>`;}

// ── TIMESTAMPS ───────────────────────────────────────────────
const UNIX_TO_FILETIME = 11644473600n; // seconds between 1601 and 1970

function setTS(fmt, val) {
  document.getElementById('ts-fmt').value=fmt;
  document.getElementById('ts-val').value=val;
}

function calcTS() {
  const fmt = document.getElementById('ts-fmt').value;
  const val = document.getElementById('ts-val').value.trim().replace(/\s/g,'');
  if (!val) return;
  let unixMs;
  try {
    if (fmt==='unix') {
      unixMs = parseFloat(val)*1000;
    } else if (fmt==='filetime') {
      const ft = BigInt('0x'+val);
      const unixSec = (ft/10000000n) - UNIX_TO_FILETIME;
      unixMs = Number(unixSec)*1000;
    } else if (fmt==='fat-date') {
      const d = parseInt(val,16);
      const y=1980+((d>>9)&0x7F), m=((d>>5)&0x0F), dd=(d&0x1F);
      unixMs = new Date(y,m-1,dd).getTime();
    } else if (fmt==='fat-time') {
      const t = parseInt(val,16);
      const h=(t>>11)&0x1F, mn=(t>>5)&0x3F, s=(t&0x1F)*2;
      const now=new Date(); now.setHours(h,mn,s,0); unixMs=now.getTime();
      // FAT Time seul → avertissement injecté après le résultat
    } else if (fmt==='apfs') {
      const ns = BigInt(val);
      const APFS_EPOCH = BigInt(978307200)*1000000000n;
      unixMs = Number((ns + APFS_EPOCH)/1000000n);
    } else if (fmt==='chrome') {
      const us = BigInt(val);
      const CHROME_EPOCH = UNIX_TO_FILETIME * 1000000n;
      unixMs = Number((us - CHROME_EPOCH)/1000n);
    } else if (fmt==='human') {
      unixMs = new Date(val).getTime();
    }
    if (isNaN(unixMs)) throw new Error('NaN');
  } catch(e) { showResult('ts-result','<div class="alert-box">Valeur invalide pour ce format.</div>'); return; }

  const d = new Date(unixMs);
  const unix = Math.round(unixMs/1000);
  const ft = (BigInt(unix)+UNIX_TO_FILETIME)*10000000n;
  const apfs = BigInt(unix-978307200)*1000000000n;
  const chrome = (BigInt(unix)+UNIX_TO_FILETIME)*1000000n;
  const fatDate = ((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  const fatTime = (d.getHours()<<11)|(d.getMinutes()<<5)|Math.floor(d.getSeconds()/2);

  const extraWarn = fmt==='fat-time' ? `<div class="alert-box" style="margin-bottom:.6rem">⚠ FAT Time seul — la date affichée utilise <strong>aujourd'hui</strong> comme référence. Pour un timestamp complet, combiner FAT Date + FAT Time.</div>` : '';
  showResult('ts-result', extraWarn +
    row('Date lisible (UTC)', d.toISOString(), 'highlight') +
    row('Unix (secondes)', unix) +
    row('FILETIME Windows (hex)', '0x'+ft.toString(16).toUpperCase().padStart(16,'0')) +
    row('FAT Date (hex)', '0x'+fatDate.toString(16).toUpperCase().padStart(4,'0')) +
    row('FAT Time (hex)', '0x'+fatTime.toString(16).toUpperCase().padStart(4,'0')) +
    row('APFS (nanosecondes)', apfs.toString()) +
    row('Chrome/WebKit (µs)', chrome.toString()) +
    row('HFS+ (secondes depuis 1904-01-01)', (unix + 2082844800).toLocaleString() + ' s — Epoch Mac classique')
  );
}

// ── RUN LIST ─────────────────────────────────────────────────
function calcRL() {
  const raw = document.getElementById('rl-val').value.trim().toUpperCase().replace(/[^0-9A-F\s]/g,'');
  const bytes = raw.split(/\s+/).filter(Boolean).map(h=>parseInt(h,16));
  const bpc = parseInt(document.getElementById('rl-bpc').value)||4096;
  if (!bytes.length) return;
  let html = '', i=0, prevLCN=0n, runNum=0;
  while (i<bytes.length) {
    const header = bytes[i++];
    if (header===0x00) { html+=step('Fin de liste','Octet 0x00 — Run list terminée'); break; }
    const lenSize = header & 0x0F;
    const offSize = (header>>4) & 0x0F;
    if (i+lenSize+offSize>bytes.length) { html+='<div class="alert-box">Données tronquées — run list incomplète</div>'; break; }
    // Length (unsigned LE)
    let length=0n;
    for(let j=lenSize-1;j>=0;j--) length=(length<<8n)|BigInt(bytes[i+j]);
    i+=lenSize;
    // Offset (signed LE)
    let offset=0n;
    for(let j=offSize-1;j>=0;j--) offset=(offset<<8n)|BigInt(bytes[i+j]);
    i+=offSize;
    // Sign-extend — offSize=0 = sparse/virtuel (pas de LCN physique)
    let lcn;
    if (offSize === 0) {
      lcn = null; // cluster virtuel non alloué
    } else {
      const signBit = 1n<<(BigInt(offSize)*8n-1n);
      if (offset & signBit) offset = offset - (1n<<(BigInt(offSize)*8n));
      lcn = prevLCN + offset;
      prevLCN = lcn;
    }
    html += step(
      `Run ${++runNum} — header 0x${header.toString(16).toUpperCase().padStart(2,'0')}`,
      lcn === null
        ? `Longueur : ${length} clusters · LCN : SPARSE — cluster virtuel (pas de stockage physique)`
        : `Longueur : ${length} clusters (${(length*BigInt(bpc)).toLocaleString()} octets) · LCN : ${lcn} · Offset : 0x${(lcn*BigInt(bpc)).toString(16).toUpperCase()}`
    );
  }
  showResult('rl-result', html);
}

// ── FAT ──────────────────────────────────────────────────────
function loadFATPreset(p) {
  const presets={
    fat12:{bps:512,spc:1,res:1,nf:2,spf:9,rec:224},
    fat16:{bps:512,spc:4,res:4,nf:2,spf:16,rec:512},
    fat32:{bps:512,spc:8,res:32,nf:2,spf:128,rec:0}
  };
  const v=presets[p];
  document.getElementById('fat-bps').value=v.bps;
  document.getElementById('fat-spc').value=v.spc;
  document.getElementById('fat-res').value=v.res;
  document.getElementById('fat-nf').value=v.nf;
  document.getElementById('fat-spf').value=v.spf;
  document.getElementById('fat-rec').value=v.rec;
}

function calcFAT() {
  const bps=+document.getElementById('fat-bps').value||512;
  const spc=+document.getElementById('fat-spc').value||8;
  const res=+document.getElementById('fat-res').value||32;
  const nf=+document.getElementById('fat-nf').value||2;
  const spf=+document.getElementById('fat-spf').value||128;
  const rec=+document.getElementById('fat-rec').value||0;
  const cl=+document.getElementById('fat-cl').value||2;
  if (cl < 2) {
    showResult('fat-result','<div class="alert-box">⚠ Cluster invalide — les clusters 0 et 1 sont réservés. Le premier cluster de données est le cluster 2.</div>');
    return;
  }
  const bpc=bps*spc;
  const rootSectors=Math.ceil((rec*32)/bps);
  const dataStart=(res+nf*spf+rootSectors)*bps;
  const clusterOffset=dataStart+(cl-2)*bpc;
  showResult('fat-result',
    row('Bytes per Cluster', bpc.toLocaleString()+' octets') +
    row('Début zone FAT', (res*bps).toLocaleString()+' octets (0x'+(res*bps).toString(16).toUpperCase()+')') +
    row('Début Root Directory', ((res+nf*spf)*bps).toLocaleString()+' octets') +
    row('Début Zone de Données', dataStart.toLocaleString()+' octets (0x'+dataStart.toString(16).toUpperCase()+')','highlight') +
    row('Offset Cluster '+cl, clusterOffset.toLocaleString()+' octets', 'highlight') +
    row('Offset hex', '0x'+clusterOffset.toString(16).toUpperCase(),'ok')
  );
}

function calcFAT12() {
  const b = [0,1,2].map(i=>parseInt(document.getElementById('fat12-b'+i).value||'0',16));
  const e0=(b[0])|((b[1]&0x0F)<<8);
  const e1=(b[1]>>4)|(b[2]<<4);
  const fmtVal=(v)=>{
    let cls='';
    if(v===0x000) return '<span style="color:var(--green)">0x000 — Cluster LIBRE</span>';
    if(v===0xFF7) return '<span style="color:var(--red)">0xFF7 — BAD CLUSTER</span>';
    if(v>=0xFF8) return '<span style="color:var(--cyan)">0x'+v.toString(16).toUpperCase()+' — FIN DE FICHIER (EOF)</span>';
    return '0x'+v.toString(16).toUpperCase()+' → Cluster suivant : '+v;
  };
  showResult('fat12-result',
    row('Octets bruts', b.map(x=>'0x'+x.toString(16).padStart(2,'0').toUpperCase()).join(' ')) +
    row('Entrée 0 (paire)', fmtVal(e0),'') +
    row('Entrée 1 (impaire)', fmtVal(e1),'') +
    step('Calcul entrée 0','byte[0] | ((byte[1] & 0x0F) << 8) = 0x'+e0.toString(16).toUpperCase()) +
    step('Calcul entrée 1','(byte[1] >> 4) | (byte[2] << 4) = 0x'+e1.toString(16).toUpperCase())
  );
}

// ── NTFS OFFSET ──────────────────────────────────────────────
function calcNTFS() {
  const bps=+document.getElementById('ntfs-bps').value||512;
  const spc=+document.getElementById('ntfs-spc').value||8;
  const mftLCN=+document.getElementById('ntfs-mft').value||2;
  const mes=+document.getElementById('ntfs-mes').value||1024;
  const entry=+document.getElementById('ntfs-entry').value||0;
  const lcn=+document.getElementById('ntfs-lcn').value||100;
  const bpc=bps*spc;
  const mftOffset=mftLCN*bpc;
  const entryOffset=mftOffset+entry*mes;
  const clusterOffset=lcn*bpc;
  showResult('ntfs-result',
    row('Bytes per Cluster', bpc.toLocaleString()+' octets') +
    row('Offset $MFT (cluster '+mftLCN+')', mftOffset.toLocaleString()+' octets (0x'+mftOffset.toString(16).toUpperCase()+')') +
    row('Offset entrée MFT #'+entry, entryOffset.toLocaleString()+' octets (0x'+entryOffset.toString(16).toUpperCase()+')', 'highlight') +
    row('Offset LCN '+lcn, clusterOffset.toLocaleString()+' octets (0x'+clusterOffset.toString(16).toUpperCase()+')', 'ok')
  );
}

// ── HEX ↔ ASCII ──────────────────────────────────────────────
let cvLock=false;
function cvFrom(src) {
  if(cvLock) return; cvLock=true;
  try {
    const hEl=document.getElementById('cv-hex'), aEl=document.getElementById('cv-asc');
    const dEl=document.getElementById('cv-dec'), bEl=document.getElementById('cv-bin');
    let bytes=[];
    if(src==='hex'){
      const h=hEl.value.replace(/\s+/g,' ').trim();
      bytes=h.split(/\s+/).filter(Boolean).map(x=>parseInt(x,16)).filter(x=>!isNaN(x));
      aEl.value=bytes.map(b=>b>=0x20&&b<=0x7E?String.fromCharCode(b):'.').join('');
      dEl.value=bytes.join(' ');
      bEl.value=bytes.map(b=>b.toString(2).padStart(8,'0')).join(' ');
    } else if(src==='asc'){
      bytes=[...aEl.value].map(c=>c.charCodeAt(0));
      hEl.value=bytes.map(b=>b.toString(16).padStart(2,'0').toUpperCase()).join(' ');
      dEl.value=bytes.join(' ');
      bEl.value=bytes.map(b=>b.toString(2).padStart(8,'0')).join(' ');
    } else if(src==='dec'){
      bytes=dEl.value.trim().split(/\s+/).filter(Boolean).map(Number).filter(x=>!isNaN(x));
      hEl.value=bytes.map(b=>b.toString(16).padStart(2,'0').toUpperCase()).join(' ');
      aEl.value=bytes.map(b=>b>=0x20&&b<=0x7E?String.fromCharCode(b):'.').join('');
      bEl.value=bytes.map(b=>b.toString(2).padStart(8,'0')).join(' ');
    } else if(src==='bin'){
      bytes=bEl.value.trim().split(/\s+/).filter(Boolean).map(b=>parseInt(b,2));
      hEl.value=bytes.map(b=>b.toString(16).padStart(2,'0').toUpperCase()).join(' ');
      aEl.value=bytes.map(b=>b>=0x20&&b<=0x7E?String.fromCharCode(b):'.').join('');
      dEl.value=bytes.join(' ');
    }
  } catch(e){}
  cvLock=false;
}
function cvSet(src,val){document.getElementById('cv-hex').value=val;cvFrom('hex');}
function cpField(id){navigator.clipboard&&navigator.clipboard.writeText(document.getElementById(id).value).then(()=>{});}

// ASCII table
(function(){
  const t=document.getElementById('ascii-table');
  if(!t) return;
  let h='<table class="hex-table"><tr><th></th>';
  for(let c=0;c<16;c++) h+='<th>+'+c.toString(16).toUpperCase()+'</th>';
  h+='</tr>';
  for(let r=2;r<=7;r++){
    h+=`<tr><th>${r.toString(16).toUpperCase()}x</th>`;
    for(let c=0;c<16;c++){
      const code=r*16+c;
      if(code<0x20||code>0x7E){h+='<td style="color:var(--border)">·</td>';continue;}
      const ch=String.fromCharCode(code);
      const hx=code.toString(16).toUpperCase().padStart(2,'0');
      h+=`<td title="0x${hx} / ${code}" onclick="cvSet('hex','${hx}');showTool('hex',document.getElementById('tab-hex'))" data-hex="${hx}">${ch==' '?'SP':ch}</td>`;
    }
    h+='</tr>';
  }
  h+='</table>';
  t.innerHTML=h;
})();

// ── ROT-N ────────────────────────────────────────────────────
function calcROT() {
  const txt = document.getElementById('rot-in').value;
  const n = ((parseInt(document.getElementById('rot-n').value) || 13) % 26 + 26) % 26;
  if (!txt.trim()) { document.getElementById('rot-result').classList.add('empty'); return; }
  const applyRot = (s, shift) => s.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode((c.charCodeAt(0) - base + shift) % 26 + base);
  });
  const encoded = applyRot(txt, n);
  const decoded = applyRot(txt, 26 - n);
  showResult('rot-result',
    row('Décodé (ROT-'+(26-n)+')', decoded, 'highlight') +
    row('Encodé (ROT-'+n+')', encoded, 'ok') +
    row('Original', txt)
  );
}

// ── Base64 ───────────────────────────────────────────────────
function calcB64() {
  const val = document.getElementById('b64-in').value.trim();
  const mode = document.querySelector('[name=b64m]:checked')?.value || 'text';
  if (!val) { document.getElementById('b64-result').classList.add('empty'); return; }
  try {
    // Encode
    let bytes;
    if (mode === 'hex') {
      bytes = val.split(/\s+/).filter(Boolean).map(h => parseInt(h, 16));
    } else {
      bytes = Array.from(new TextEncoder().encode(val));
    }
    const b64encoded = btoa(String.fromCharCode(...bytes));

    // Decode attempt (suppose l'entrée est du Base64)
    let decodedText = '', decodedHex = '';
    try {
      const raw = atob(val.replace(/\s/g, ''));
      decodedText = [...raw].map(c => c.charCodeAt(0) >= 0x20 && c.charCodeAt(0) <= 0x7E ? c : '.').join('');
      decodedHex = [...raw].map(c => c.charCodeAt(0).toString(16).padStart(2,'0').toUpperCase()).join(' ');
    } catch(e) {}

    showResult('b64-result',
      row('Base64 encodé', b64encoded, 'highlight') +
      (decodedText ? row('Décodé (texte)', decodedText, 'ok') : '') +
      (decodedHex  ? row('Décodé (hex)',   decodedHex) : '') +
      row('Longueur', bytes.length + ' octets → ' + b64encoded.length + ' chars Base64')
    );
  } catch(e) {
    showResult('b64-result', '<div class="alert-box">Erreur : ' + e.message + '</div>');
  }
}

// ── Hash (Web Crypto API + MD5 JS) ───────────────────────────
async function calcHash() {
  const val = document.getElementById('hash-in').value.trim();
  const mode = document.querySelector('[name=hashm]:checked')?.value || 'text';
  if (!val) return;
  let buf;
  if (mode === 'hex') {
    buf = new Uint8Array(val.split(/\s+/).filter(Boolean).map(h => parseInt(h,16)));
  } else {
    buf = new TextEncoder().encode(val);
  }
  const toHex = b => Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
  const [h256, h1] = await Promise.all([
    crypto.subtle.digest('SHA-256', buf),
    crypto.subtle.digest('SHA-1', buf)
  ]);
  const md5res = computeMD5(buf);
  showResult('hash-result',
    row('SHA-256', toHex(h256), 'highlight') +
    row('SHA-1',   toHex(h1),  'warn') +
    row('MD5',     md5res,     'warn') +
    row('Taille input', buf.byteLength + ' octets · ' + (buf.byteLength*8) + ' bits')
  );
}

function computeMD5(buffer) {
  const bytes = Array.from(buffer);
  const len = bytes.length;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const lo = (len * 8) & 0xFFFFFFFF, hi = Math.floor(len / 0x20000000);
  bytes.push(lo&0xFF,(lo>>8)&0xFF,(lo>>16)&0xFF,(lo>>24)&0xFF,hi&0xFF,(hi>>8)&0xFF,(hi>>16)&0xFF,(hi>>24)&0xFF);
  function add(a,b){return(a+b)&0xFFFFFFFF}
  function rol(x,n){return(x<<n)|(x>>>(32-n))}
  function cmn(q,a,b,x,s,t){return add(rol(add(add(a,q),add(x,t)),s),b)}
  function ff(a,b,c,d,x,s,t){return cmn((b&c)|(~b&d),a,b,x,s,t)}
  function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&~d),a,b,x,s,t)}
  function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t)}
  function ii(a,b,c,d,x,s,t){return cmn(c^(b|~d),a,b,x,s,t)}
  let [a,b,c,d]=[0x67452301,0xEFCDAB89,0x98BADCFE,0x10325476];
  const T=[0,0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391];
  for (let i=0;i<bytes.length;i+=64){
    const M=[];for(let j=0;j<16;j++)M[j]=bytes[i+j*4]|(bytes[i+j*4+1]<<8)|(bytes[i+j*4+2]<<16)|(bytes[i+j*4+3]<<24);
    let [A,B,C,D]=[a,b,c,d];
    A=ff(A,B,C,D,M[0],7,T[1]);D=ff(D,A,B,C,M[1],12,T[2]);C=ff(C,D,A,B,M[2],17,T[3]);B=ff(B,C,D,A,M[3],22,T[4]);A=ff(A,B,C,D,M[4],7,T[5]);D=ff(D,A,B,C,M[5],12,T[6]);C=ff(C,D,A,B,M[6],17,T[7]);B=ff(B,C,D,A,M[7],22,T[8]);A=ff(A,B,C,D,M[8],7,T[9]);D=ff(D,A,B,C,M[9],12,T[10]);C=ff(C,D,A,B,M[10],17,T[11]);B=ff(B,C,D,A,M[11],22,T[12]);A=ff(A,B,C,D,M[12],7,T[13]);D=ff(D,A,B,C,M[13],12,T[14]);C=ff(C,D,A,B,M[14],17,T[15]);B=ff(B,C,D,A,M[15],22,T[16]);
    A=gg(A,B,C,D,M[1],5,T[17]);D=gg(D,A,B,C,M[6],9,T[18]);C=gg(C,D,A,B,M[11],14,T[19]);B=gg(B,C,D,A,M[0],20,T[20]);A=gg(A,B,C,D,M[5],5,T[21]);D=gg(D,A,B,C,M[10],9,T[22]);C=gg(C,D,A,B,M[15],14,T[23]);B=gg(B,C,D,A,M[4],20,T[24]);A=gg(A,B,C,D,M[9],5,T[25]);D=gg(D,A,B,C,M[14],9,T[26]);C=gg(C,D,A,B,M[3],14,T[27]);B=gg(B,C,D,A,M[8],20,T[28]);A=gg(A,B,C,D,M[13],5,T[29]);D=gg(D,A,B,C,M[2],9,T[30]);C=gg(C,D,A,B,M[7],14,T[31]);B=gg(B,C,D,A,M[12],20,T[32]);
    A=hh(A,B,C,D,M[5],4,T[33]);D=hh(D,A,B,C,M[8],11,T[34]);C=hh(C,D,A,B,M[11],16,T[35]);B=hh(B,C,D,A,M[14],23,T[36]);A=hh(A,B,C,D,M[1],4,T[37]);D=hh(D,A,B,C,M[4],11,T[38]);C=hh(C,D,A,B,M[7],16,T[39]);B=hh(B,C,D,A,M[10],23,T[40]);A=hh(A,B,C,D,M[13],4,T[41]);D=hh(D,A,B,C,M[0],11,T[42]);C=hh(C,D,A,B,M[3],16,T[43]);B=hh(B,C,D,A,M[6],23,T[44]);A=hh(A,B,C,D,M[9],4,T[45]);D=hh(D,A,B,C,M[12],11,T[46]);C=hh(C,D,A,B,M[15],16,T[47]);B=hh(B,C,D,A,M[2],23,T[48]);
    A=ii(A,B,C,D,M[0],6,T[49]);D=ii(D,A,B,C,M[7],10,T[50]);C=ii(C,D,A,B,M[14],15,T[51]);B=ii(B,C,D,A,M[5],21,T[52]);A=ii(A,B,C,D,M[12],6,T[53]);D=ii(D,A,B,C,M[3],10,T[54]);C=ii(C,D,A,B,M[10],15,T[55]);B=ii(B,C,D,A,M[1],21,T[56]);A=ii(A,B,C,D,M[8],6,T[57]);D=ii(D,A,B,C,M[15],10,T[58]);C=ii(C,D,A,B,M[6],15,T[59]);B=ii(B,C,D,A,M[13],21,T[60]);A=ii(A,B,C,D,M[4],6,T[61]);D=ii(D,A,B,C,M[11],10,T[62]);C=ii(C,D,A,B,M[2],15,T[63]);B=ii(B,C,D,A,M[9],21,T[64]);
    a=add(a,A);b=add(b,B);c=add(c,C);d=add(d,D);
  }
  // Sortie little-endian correcte : extraire les 4 octets dans l'ordre LE
  return [a,b,c,d].map(n => [
    (n>>>0)&0xFF, (n>>>8)&0xFF, (n>>>16)&0xFF, (n>>>24)&0xFF
  ].map(b=>b.toString(16).padStart(2,'0')).join('')).join('');
}


// ── Copier résultats ──────────────────────────────────────────
function copyResult(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const text = el.innerText || el.textContent;
  const btn = document.querySelector('[onclick*="copyResult(\''+id+'\')"]');
  navigator.clipboard.writeText(text).then(() => {
    if (btn) { const o = btn.textContent; btn.textContent = '✓ Copié !';
      setTimeout(() => btn.textContent = o, 1500); }
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
  });
}

// ── Persistance légère des dernières valeurs ──────────────────
function _ls(k,v){try{if(v!==undefined)localStorage.setItem(k,v);else return localStorage.getItem(k);}catch(_){return null;}}
function restoreLastVals() {
  [['sfn-in','sfn'],['magic-in','magic'],['bm-in','bm'],['bm-start','bm'],
   ['hashid-in','hashid'],['cl-size','cl'],['cl-num','cl'],['mft-in','mft'],
   ['ts-val','ts'],['rl-raw','rl']].forEach(([id,pfx]) => {
    const v = _ls('cas_'+id);
    const el = document.getElementById(id);
    if (v && el && el.tagName !== 'SELECT') el.value = v;
  });
}
function saveLastVal(id) {
  const el = document.getElementById(id);
  if (el) _ls('cas_'+id, el.value);
}
document.addEventListener('DOMContentLoaded', restoreLastVals);


// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════
function le16(b,o){return b[o]|(b[o+1]<<8);}
function le32(b,o){return(b[o]|(b[o+1]<<8)|(b[o+2]<<16)|((b[o+3]>>>0)<<24))>>>0;}
function parseFatDate(w){
  if(!w)return'—';
  const d=w&0x1F,mo=(w>>5)&0xF,yr=(w>>9&0x7F)+1980;
  return mo>=1&&mo<=12&&d>=1&&d<=31?yr+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0'):'(invalide)';
}
function parseFatTime(w){
  if(!w)return'—';
  return String((w>>11)&0x1F).padStart(2,'0')+':'+String((w>>5)&0x3F).padStart(2,'0')+':'+String((w&0x1F)*2).padStart(2,'0');
}
function hexRow(b,label,from,to,color){
  const bytes=b.slice(from,to+1).map(x=>x.toString(16).toUpperCase().padStart(2,'0')).join(' ');
  return '<tr><td style="color:var(--dim);padding:.3rem .5rem;font-size:.7rem;white-space:nowrap">'+label+'</td>'
    +'<td style="font-family:var(--mono);font-size:.73rem;padding:.3rem .5rem;color:'+(color||'var(--cyan)')+'">'+bytes+'</td></tr>';
}

// ════════════════════════════════════════════════════════════
// SFN FAT DECODER
// ════════════════════════════════════════════════════════════
const FAT_ATTRS={0x01:'Lecture seule',0x02:'Caché',0x04:'Système',0x08:'Label volume',0x10:'Répertoire',0x20:'Archive',0x0F:'LFN'};

function decodeSFN(){
  const hex=document.getElementById('sfn-in').value.replace(/[^0-9a-fA-F]/g,' ').trim().split(/\s+/).filter(Boolean);
  const res=document.getElementById('sfn-result');
  if(hex.length<32){showResult('sfn-result', '<div class="alert-box">⚠ '+hex.length+'/32 octets saisis</div>');return;}
  const b=hex.slice(0,32).map(h=>parseInt(h,16));
  const first=b[0];
  const ok=first!==0x00&&first!==0xE5;
  const status=first===0x00?'<span style="color:var(--dim)">⬜ Fin de répertoire</span>':
    first===0xE5?'<span style="color:var(--red)">🗑 Supprimé (0xE5)</span>':'<span style="color:var(--green)">✅ Entrée active</span>';
  const name=b.slice(0,8).map(x=>x>=0x20&&x<0x7F?String.fromCharCode(x):'.').join('').trimEnd();
  const ext=b.slice(8,11).map(x=>x>=0x20&&x<0x7F?String.fromCharCode(x):'.').join('').trimEnd();
  const fullName=ext?name+'.'+ext:name;
  const attr=b[0x0B];
  const attrStr=attr===0x0F?'LFN':Object.entries(FAT_ATTRS).filter(([k])=>(attr&+k)&&+k!==0x0F).map(([,v])=>v).join(', ')||'—';
  const cluster=((le16(b,0x14)<<16)|le16(b,0x1A))>>>0;
  const size=le32(b,0x1C);
  const sizeStr=size>=1048576?(size/1048576).toFixed(2)+' Mo':size>=1024?(size/1024).toFixed(1)+' Ko':size+' o';
  res.innerHTML=status+'<br><br>'
    +row('Nom complet','<strong>'+(first===0xE5?'?'+fullName.slice(1):fullName)+'</strong>')
    +row('Attributs (0x'+attr.toString(16).toUpperCase().padStart(2,'0')+')',attrStr)
    +row('Cluster départ','<span style="font-family:var(--mono);color:var(--cyan)">'+cluster+' (0x'+cluster.toString(16).toUpperCase()+')</span>')
    +row('Taille','<strong>'+sizeStr+'</strong> ('+size.toLocaleString('fr-CH')+' o)')
    +row('Créé',parseFatDate(le16(b,0x10))+' '+parseFatTime(le16(b,0x0E)))
    +row('Modifié',parseFatDate(le16(b,0x18))+' '+parseFatTime(le16(b,0x16)))
    +row('Accédé',parseFatDate(le16(b,0x12)))
    +'<br><div style="font-size:.7rem;color:var(--dim);margin-bottom:.35rem">Carte des octets :</div>'
    +'<div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:.72rem;width:100%;border:1px solid rgba(255,255,255,.06)">'
    +hexRow(b,'0x00–07 Nom',0,7)
    +hexRow(b,'0x08–0A Extension',8,10,'var(--purple)')
    +hexRow(b,'0x0B Attributs',11,11,'var(--gold)')
    +hexRow(b,'0x0E–0F Heure création',14,15,'var(--green)')
    +hexRow(b,'0x10–11 Date création',16,17,'var(--green)')
    +hexRow(b,'0x12–13 Date accès',18,19,'var(--muted)')
    +hexRow(b,'0x14–15 Cluster hi',20,21,'var(--orange)')
    +hexRow(b,'0x16–17 Heure modif',22,23,'var(--green)')
    +hexRow(b,'0x18–19 Date modif',24,25,'var(--green)')
    +hexRow(b,'0x1A–1B Cluster lo',26,27,'var(--cyan)')
    +hexRow(b,'0x1C–1F Taille (LE32)',28,31,'var(--gold)')
    +'</table></div>';
  res.style.display='block';
}

// ════════════════════════════════════════════════════════════
// MAGIC BYTES IDENTIFIER
// ════════════════════════════════════════════════════════════
const MAGIC_DB=[
  {sig:'FF D8 FF',ext:'jpg',desc:'Image JPEG',note:'Standard photo — EXIF souvent présent'},
  {sig:'89 50 4E 47 0D 0A 1A 0A',ext:'png',desc:'Image PNG',note:'Sans perte'},
  {sig:'47 49 46 38',ext:'gif',desc:'Image GIF',note:'GIF87a ou GIF89a'},
  {sig:'25 50 44 46',ext:'pdf',desc:'Document PDF',note:'"%PDF"'},
  {sig:'50 4B 03 04',ext:'zip/docx/xlsx/apk',desc:'Archive ZIP / Office 2007+',note:'"PK" = Phil Katz'},
  {sig:'52 61 72 21 1A 07',ext:'rar',desc:'Archive RAR',note:'"Rar!"'},
  {sig:'1F 8B',ext:'gz',desc:'Archive GZip',note:'Compression Deflate'},
  {sig:'42 5A 68',ext:'bz2',desc:'Archive BZip2',note:'"BZh"'},
  {sig:'4D 5A',ext:'exe/dll',desc:'Exécutable Windows PE',note:'"MZ" = Mark Zbikowski'},
  {sig:'7F 45 4C 46',ext:'elf',desc:'Exécutable Linux ELF',note:'Pas un PE Windows !'},
  {sig:'CA FE BA BE',ext:'class',desc:'Bytecode Java',note:'"Café babe"'},
  {sig:'CF FA ED FE',ext:'macho64',desc:'macOS Mach-O 64-bit',note:'Little-endian'},
  {sig:'42 4D',ext:'bmp',desc:'Image Bitmap Windows',note:'"BM"'},
  {sig:'49 49 2A 00',ext:'tiff',desc:'TIFF Little-Endian',note:'"II" = Intel'},
  {sig:'4D 4D 00 2A',ext:'tiff',desc:'TIFF Big-Endian',note:'"MM" = Motorola'},
  {sig:'52 49 46 46',ext:'wav/avi',desc:'Audio WAV ou Vidéo AVI',note:'"RIFF"'},
  {sig:'D0 CF 11 E0',ext:'doc/xls/ppt',desc:'Office 97-2003 (OLE2)',note:'Compound Document'},
  {sig:'EB 52 90 4E 54 46 53',ext:'img',desc:'Volume NTFS',note:'OEM "NTFS    "'},
  {sig:'EB 58 90 4D 53 57 49',ext:'img',desc:'Volume FAT32',note:'OEM "MSWIN4.1"'},
  {sig:'48 2B 00 04',ext:'img',desc:'Volume HFS+',note:'"H+" Apple'},
  {sig:'45 6C 66 46 69 6C 65',ext:'evtx',desc:'Journal EVTX Vista+',note:'"ElfFile"'},
  {sig:'4D 44 4D 50',ext:'dmp',desc:'Memory Dump Windows',note:'"MDMP"'},
  {sig:'52 45 47 46',ext:'dat',desc:'Registre Windows',note:'"REGF"'},
  {sig:'45 57 46',ext:'E01',desc:'Image forensique EWF/E01',note:'"EWF" EnCase/FTK'},
  {sig:'41 46 46',ext:'AFF',desc:'Image forensique AFF',note:'"AFF"'},
  {sig:'4F 67 67 53',ext:'ogg',desc:'Audio/Vidéo OGG',note:'"OggS"'},
  {sig:'38 42 50 53',ext:'psd',desc:'Document Photoshop',note:'"8BPS"'},
];

function identifyMagic(){
  const input=document.getElementById('magic-in').value.trim().toUpperCase().replace(/[^0-9A-F]/g,' ').replace(/\s+/g,' ').trim();
  const res=document.getElementById('magic-result');
  if(input.replace(/\s/g,'').length<4){res.style.display='none';return;}
  const matches=MAGIC_DB.filter(m=>{
    const sig=m.sig.toUpperCase();
    return input.startsWith(sig)||input.replace(/\s/g,'').startsWith(sig.replace(/\s/g,''));
  }).sort((a,b)=>b.sig.length-a.sig.length);
  let html;
  if(matches.length){
    html=matches.map(m=>
      '<div style="padding:.6rem .75rem;background:var(--surface2);border-radius:7px;margin-bottom:.4rem;border-left:3px solid var(--cyan)">'
      +'<div style="font-weight:700;color:var(--text);font-size:.85rem">'+m.desc+'</div>'
      +'<div style="font-family:var(--mono);color:var(--cyan);font-size:.72rem">.'+m.ext+'</div>'
      +'<div style="color:var(--dim);font-size:.75rem;margin-top:.2rem">'+m.note+'</div>'
      +'<div style="font-family:var(--mono);color:var(--muted);font-size:.68rem">Sig: '+m.sig+'</div></div>'
    ).join('');
  } else {
    html="<div style='color:var(--dim);font-size:.8rem'>Aucune correspondance — essaie avec plus d'octets.</div>";
  }
  showResult('magic-result', html);
}
function initMagicRef(){
  const el=document.getElementById('magic-ref');
  if(!el)return;
  el.innerHTML=MAGIC_DB.slice(0,12).map(m=>
    '<div style="padding:2px 4px;background:rgba(255,255,255,.03);border-radius:3px"><span style="color:var(--cyan)">'
    +m.sig.split(' ').slice(0,3).join(' ')+'…</span><span style="color:var(--dim)"> → .'+m.ext.split('/')[0]+'</span></div>'
  ).join('')+'<div style="color:var(--dim);padding:2px 4px">et '+(MAGIC_DB.length-12)+' autres…</div>';
}
document.addEventListener('DOMContentLoaded',initMagicRef);

// ════════════════════════════════════════════════════════════
// BITMAP DECODER
// ════════════════════════════════════════════════════════════
function decodeBitmap(){
  const raw=document.getElementById('bm-in').value.trim();
  const start=parseInt(document.getElementById('bm-start').value)||2;
  const res=document.getElementById('bm-result');
  if(!raw){res.innerHTML='';return;}
  const bytes=raw.replace(/[^0-9a-fA-F]/g,' ').trim().split(/\s+/).filter(Boolean).map(h=>parseInt(h,16));
  if(!bytes.length||bytes.some(isNaN)){res.innerHTML='<div class="alert-box">⚠ Octets invalides</div>';return;}
  const occ=[],free=[];
  for(let i=0;i<bytes.length;i++)for(let b=0;b<8;b++){const c=start+i*8+b;((bytes[i]>>b)&1?occ:free).push(c);}
  let grid='<div style="display:flex;flex-wrap:wrap;gap:2px;margin:.5rem 0;font-family:var(--mono);font-size:.6rem">';
  for(let i=0;i<bytes.length;i++)for(let b=0;b<8;b++){
    const c=start+i*8+b,o=(bytes[i]>>b)&1;
    grid+='<div title="Cluster '+c+': '+(o?'occupé':'libre')+'" style="width:28px;height:24px;border-radius:3px;display:flex;align-items:center;justify-content:center;background:'+(o?'rgba(255,64,96,.2)':'rgba(48,232,138,.1)')+';border:1px solid '+(o?'rgba(255,64,96,.4)':'rgba(48,232,138,.25)')+';color:'+(o?'var(--red)':'var(--green)')+'">'+c+'</div>';
  }
  grid+='</div>';
  let freeRanges='',cur=null,prev=null;
  for(const c of free){if(prev===null||c!==prev+1){if(cur!==null)freeRanges+=cur+(prev!==cur?'–'+prev:'')+', ';cur=c;}prev=c;}
  if(cur!==null)freeRanges+=cur+(prev!==cur?'–'+prev:'');
  showResult('bm-result','<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-bottom:.75rem;font-size:.8rem">'
    +row('Clusters analysés',bytes.length*8)+row('Occupés','<span style="color:var(--red)">'+occ.length+'</span>')
    +row('Libres','<span style="color:var(--green)">'+free.length+'</span>')+'</div>'
    +grid+'<div style="font-size:.75rem;color:var(--dim)"><strong>Plages libres:</strong> '+(freeRanges||'(aucune)')+'</div>');
}

// ════════════════════════════════════════════════════════════
// HASH IDENTIFIER
// ════════════════════════════════════════════════════════════
const HASH_INFO=[
  {algo:'MD5',bits:128,chars:32,safe:false,usage:'Collisions connues (2004). Compatibilité legacy uniquement — toujours doubler avec SHA-256.'},
  {algo:'SHA-1',bits:160,chars:40,safe:false,usage:'SHAttered (2017). Déprécié pour les nouvelles acquisitions.'},
  {algo:'SHA-256',bits:256,chars:64,safe:true,usage:'Standard actuel — ISO/IEC 27037, NIST SP 800-86. Aucune collision connue.'},
  {algo:'SHA-512',bits:512,chars:128,safe:true,usage:'Haute sécurité — archivage long terme.'},
  {algo:'SHA-384',bits:384,chars:96,safe:true,usage:'Variante SHA-512 tronquée.'},
  {algo:'SHA-224',bits:224,chars:56,safe:true,usage:'Variante SHA-256 — rare en forensique.'},
  {algo:'RIPEMD-160',bits:160,chars:40,safe:true,usage:'Utilisé en cryptomonnaies (Bitcoin).'},
  {algo:'CRC32',bits:32,chars:8,safe:false,usage:'Somme de contrôle non cryptographique (ZIP, PNG, NTFS USN).'},
  {algo:'TLSH',bits:null,chars:70,safe:null,usage:'Hash flou — commence par "T1". Velociraptor/KAPE.'},
];
function initHashRefTable(){
  const tb=document.getElementById('hash-ref-table');
  if(!tb)return;
  tb.innerHTML=HASH_INFO.filter(h=>h.chars).map(h=>
    '<tr style="border-bottom:1px solid rgba(255,255,255,.04)">'
    +'<td style="padding:.3rem .5rem;font-family:var(--mono);font-weight:700;color:var(--text)">'+h.algo+'</td>'
    +'<td style="padding:.3rem .5rem;color:var(--dim)">'+(h.bits||'var.')+'</td>'
    +'<td style="padding:.3rem .5rem;font-family:var(--mono);color:'+(h.safe===false?'var(--red)':h.safe?'var(--green)':'var(--gold)')+'">'+h.chars+'</td>'
    +'<td style="padding:.3rem .5rem;color:var(--dim);font-size:.7rem">'+h.usage.split('.')[0]+'</td></tr>'
  ).join('');
}
function identifyHash(){
  const val=document.getElementById('hashid-in').value.trim();
  const res=document.getElementById('hashid-result');
  if(val.length<4){res.style.display='none';return;}
  const matches=HASH_INFO.filter(h=>{
    if(h.chars&&h.chars===val.length)return true;
    if(h.algo==='TLSH'&&val.toUpperCase().startsWith('T1')&&val.length===70)return true;
    return false;
  });
  showResult('hashid-result', matches.length?matches.map(m=>
    '<div style="padding:.75rem 1rem;background:var(--surface2);border-radius:8px;margin-bottom:.5rem;border-left:3px solid '+(m.safe===false?'var(--red)':m.safe?'var(--green)':'var(--gold)')+'">'
    +'<div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.35rem">'
    +'<strong style="color:var(--text)">'+m.algo+'</strong>'
    +'<span style="font-family:var(--mono);font-size:.68rem;color:var(--dim)">'+(m.bits||'variable')+' bits · '+m.chars+' chars</span>'
    +(m.safe===false?'<span style="font-size:.68rem;color:var(--red);background:rgba(255,64,96,.1);padding:.1rem .4rem;border-radius:3px">⚠ Déprécié</span>':m.safe?'<span style="font-size:.68rem;color:var(--green);background:rgba(48,232,138,.1);padding:.1rem .4rem;border-radius:3px">✓ Recommandé</span>':'')
    +'</div><div style="font-size:.78rem;color:var(--muted)">'+m.usage+'</div></div>'
  ).join('')
  :'<div style="color:var(--dim)">Aucune correspondance pour '+val.length+' caractères.</div>');
}
document.addEventListener('DOMContentLoaded',initHashRefTable);

// ════════════════════════════════════════════════════════════
// CLUSTER CALCULATOR
// ════════════════════════════════════════════════════════════
function calcCluster(){
  const bps=parseInt(document.getElementById('cl-bps').value)||512;
  const spc=parseInt(document.getElementById('cl-spc').value)||8;
  const szMB=parseFloat(document.getElementById('cl-size').value)||4096;
  const clN=parseInt(document.getElementById('cl-num').value)||5;
  const res=document.getElementById('cl-result');
  const cs=bps*spc;
  const nCl=Math.floor(szMB*1024*1024/cs);
  const fatType=nCl<4085?'FAT12':nCl<65525?'FAT16':'FAT32';
  const offset=(clN-2)*cs;
  showResult('cl-result', '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem;margin-bottom:.75rem">'
    +row('Taille cluster','<strong style="color:var(--cyan);font-size:1.05rem">'+cs.toLocaleString('fr-CH')+' o</strong>')
    +row('Hex','<span style="font-family:var(--mono);color:var(--gold)">0x'+cs.toString(16).toUpperCase()+'</span>')
    +row('Nb clusters','<span style="color:var(--green)">~'+nCl.toLocaleString('fr-CH')+'</span>')+'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">'
    +row('Type FAT estimé','<strong>'+fatType+'</strong>')
    +row('Offset cluster '+clN+' (relatif zone données)',clN>=2?'<span style="font-family:var(--mono);color:var(--cyan)">0x'+offset.toString(16).toUpperCase()+' ('+offset.toLocaleString('fr-CH')+' o)</span>':'⚠ cluster ≥ 2 requis')
    +'</div>'
    +'<div style="margin-top:.75rem;padding:.5rem .85rem;background:rgba(0,229,204,.04);border:1px solid rgba(0,229,204,.15);border-radius:7px;font-size:.75rem;color:var(--dim)">'
    +'<strong style="color:var(--cyan)">Formule FAT32 :</strong> offset = (RsvdSec + NumFATs×FATsize)×BPS + (cluster−2)×ClusterSize</div>');
}
document.addEventListener('DOMContentLoaded',calcCluster);

// ════════════════════════════════════════════════════════════
// MFT DECODER
// ════════════════════════════════════════════════════════════
const NTFS_ATTRS={0x10:'$STANDARD_INFORMATION',0x20:'$ATTRIBUTE_LIST',0x30:'$FILE_NAME',
  0x40:'$OBJECT_ID',0x50:'$SECURITY_DESCRIPTOR',0x60:'$VOLUME_NAME',0x70:'$VOLUME_INFORMATION',
  0x80:'$DATA',0x90:'$INDEX_ROOT',0xA0:'$INDEX_ALLOCATION',0xB0:'$BITMAP',0xC0:'$REPARSE_POINT',0xFF:'EOF'};
const NTFS_FLAGS={0x01:'En cours utilisation',0x02:'Répertoire',0x04:'Extension',0x08:'Vue spéciale'};

function decodeMFT(){
  const hex=document.getElementById('mft-in').value.replace(/[^0-9a-fA-F]/g,' ').trim().split(/\s+/).filter(Boolean);
  const res=document.getElementById('mft-result');
  if(hex.length<56){showResult('mft-result', '<div class="alert-box">⚠ Minimum 56 octets ('+hex.length+' saisis)</div>');return;}
  const b=hex.map(h=>parseInt(h,16));
  const sig=b.slice(0,4).map(x=>x>=0x20&&x<0x7F?String.fromCharCode(x):'·').join('');
  const sigOk=sig==='FILE',sigBad=sig==='BAAD';
  const seqNum=le16(b,16),linkCnt=le16(b,18),attrOff=le16(b,20),flags=le16(b,22);
  const usedSz=le32(b,24),allocSz=le32(b,28),mftNum=le32(b,44);
  const flagStr=Object.entries(NTFS_FLAGS).filter(([k])=>flags&+k).map(([,v])=>v).join(', ')||'—';
  const attrs=[];
  if(sigOk&&attrOff<b.length){
    let pos=attrOff;
    while(pos+4<=b.length){
      const at=le32(b,pos);if(at===0xFFFFFFFF)break;
      const al=pos+4<b.length?le32(b,pos+4):0;if(al<8||al>4096)break;
      attrs.push({type:at,len:al,nonRes:b[pos+8]===1,name:NTFS_ATTRS[at]||('0x'+at.toString(16).toUpperCase().padStart(2,'0'))});
      pos+=al;if(pos>=b.length)break;
    }
  }
  res.innerHTML='<div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">'
    +'<div style="padding:.35rem .85rem;border-radius:6px;font-family:var(--mono);font-weight:700;background:'+(sigOk?'rgba(48,232,138,.12)':sigBad?'rgba(255,64,96,.12)':'rgba(240,192,64,.1)')+';color:'+(sigOk?'var(--green)':sigBad?'var(--red)':'var(--gold)')+';border:1px solid '+(sigOk?'rgba(48,232,138,.35)':sigBad?'rgba(255,64,96,.3)':'rgba(240,192,64,.3)')+'">"'+sig+'"</div>'
    +'<span style="color:'+(sigOk?'var(--green)':sigBad?'var(--red)':'var(--dim)')+'"> '+(sigOk?'✅ Valide':sigBad?'❌ BAAD — fixup échoué':'⚠ Signature inconnue')+'</span></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.75rem">'
    +row('Numéro MFT','<span style="font-family:var(--mono)">'+(mftNum||'—')+'</span>')
    +row('Numéro séquence',seqNum)+row('Hard links',linkCnt)
    +row('Flags (0x'+flags.toString(16).toUpperCase()+')',flagStr)
    +row('Offset 1er attribut','0x'+attrOff.toString(16).toUpperCase())
    +row('Taille utilisée/allouée',usedSz+' / '+allocSz+' o')+'</div>'
    +(attrs.length?'<div style="font-size:.72rem;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.4rem">Attributs ('+attrs.length+')</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:.4rem">'+attrs.map(a=>
      '<div style="padding:.35rem .75rem;border-radius:6px;font-size:.75rem;font-family:var(--mono);background:rgba(0,229,204,.07);border:1px solid rgba(0,229,204,.2);color:var(--cyan)">'
      +a.name+'<span style="color:var(--dim);font-size:.65rem"> '+(a.nonRes?'non-rés.':'résid.')+' · '+a.len+'o</span></div>'
    ).join('')+'</div>'
    :'<div style="color:var(--dim);font-size:.8rem">Attributs non lisibles (données insuffisantes)</div>');
}

