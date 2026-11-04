import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import {initialProgress,awardCatch,xpNeeded,PRACTICE_EQUIPMENT,equipPracticeItem} from './fishing-progression.js';
const $=id=>document.getElementById(id),canvas=$('lake'),cast=$('cast'),hook=$('hook'),reel=$('reel'),reset=$('reset'),status=$('status'),meter=$('tension');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9bd5f0);scene.fog=new THREE.Fog(0x9bd5f0,70,210);
const camera=new THREE.PerspectiveCamera(52,720/620,.1,250);camera.position.set(3.7,8.5,18);camera.lookAt(0,0,-12);
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'})}catch(error){document.getElementById('render-error').hidden=false;document.getElementById('status').textContent='Không thể khởi tạo hồ 3D trên thiết bị này.';throw error}
const pixelRatio=Math.min(window.devicePixelRatio||1,1.5);renderer.setPixelRatio(pixelRatio);
function resize(){const width=Math.max(240,Math.round(canvas.getBoundingClientRect().width||720));const height=Math.round(width*620/720);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()}
window.addEventListener('resize',resize,{passive:true});resize();
scene.add(new THREE.HemisphereLight(0xe9f7ff,0x345638,2.1));const sun=new THREE.DirectionalLight(0xffffff,2.1);sun.position.set(-20,32,12);scene.add(sun);
const mat=(c,extra={})=>new THREE.MeshStandardMaterial({color:c,roughness:.8,...extra});
function mesh(geometry,material,x=0,y=0,z=0){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);scene.add(o);return o}
const ground=mesh(new THREE.PlaneGeometry(180,180),mat(0x659a57),0,-.22,-25);ground.rotation.x=-Math.PI/2;
const water=mesh(new THREE.PlaneGeometry(54,90),new THREE.MeshPhongMaterial({color:0x268ba5,transparent:true,opacity:.92,shininess:120,side:THREE.DoubleSide}),0,.02,-25);water.rotation.x=-Math.PI/2;
for(const side of [-1,1]){const bank=mesh(new THREE.BoxGeometry(2,.3,90),mat(0xb3a17a),side*28,-.02,-25);for(let i=0;i<22;i++){const z=12-i*3.7,x=side*(31+(i%3)*1.8);const trunk=mesh(new THREE.CylinderGeometry(.15,.2,2,6),mat(0x765238),x,.8,z);mesh(new THREE.ConeGeometry(1.2,3,7),mat(0x347b49),x,3,z)}}
const pier=mesh(new THREE.BoxGeometry(5,.28,9),mat(0x966b43),-8,.18,8);
for(let i=0;i<5;i++)mesh(new THREE.BoxGeometry(4.9,.05,.07),mat(0xb98b58),-8,.35,4.4+i*1.8);
const chair=mesh(new THREE.BoxGeometry(1.1,.7,1.2),mat(0x775235),-9,1,8);
const avatarBody=mesh(new THREE.CylinderGeometry(.55,.5,1.5,10),mat(0x168fa6),-8.9,1.8,8);
mesh(new THREE.SphereGeometry(.48,12,10),mat(0xe3b68e),-8.9,2.85,8);
// Stylized angler and lakeside scenery, built only from local Three.js primitives.
const outfit=mat(0x172b42),skin=mat(0xf0bb8c),hair=mat(0xe9edf5),cap=mat(0x111a27);
avatarBody.material=outfit;
const head=scene.children.find(o=>o.isMesh&&o.geometry.type==='SphereGeometry'&&Math.abs(o.position.x+8.9)<.01&&Math.abs(o.position.y-2.85)<.01);
if(head)head.material=skin;
mesh(new THREE.SphereGeometry(.5,12,10),hair,-8.9,3.2,8.05);
mesh(new THREE.CylinderGeometry(.52,.52,.19,12),cap,-8.9,3.48,8.06);
mesh(new THREE.BoxGeometry(.72,.08,.3),cap,-8.9,3.43,7.7);
for(const side of [-1,1]){
  const arm=mesh(new THREE.CapsuleGeometry(.16,.75,4,8),outfit,-8.9+side*.66,2.04,7.8);
  arm.rotation.x=-.48;arm.rotation.z=side*.3;
  mesh(new THREE.SphereGeometry(.16,8,8),skin,-8.9+side*.8,1.6,7.52);
  const leg=mesh(new THREE.CapsuleGeometry(.22,.78,4,8),mat(0x233447),-8.9+side*.32,.83,7.45);
  leg.rotation.x=-.85;
  mesh(new THREE.BoxGeometry(.48,.22,.7),mat(0xf2f5fa),-8.9+side*.32,.48,7.0);
}
const lanternMat=new THREE.MeshStandardMaterial({color:0xffc875,emissive:0xf5a33c,emissiveIntensity:.55});
for(const x of [-10.3,-5.8]){
  mesh(new THREE.CylinderGeometry(.09,.11,2.5,7),mat(0x68452d),x,1.45,4.1);
  mesh(new THREE.BoxGeometry(.55,.72,.55),lanternMat,x,2.7,4.1);
}
const foliage=[0xf1a6d0,0xf5bfdc,0xe98fbe,0x4b9e66];
for(const side of [-1,1]){
  for(let i=0;i<9;i++){
    const z=-2-i*7.4,x=side*(29+i%3*2.2);
    const trunk=mesh(new THREE.CylinderGeometry(.24,.38,4.4,7),mat(0x694b35),x,2,z);
    for(let j=0;j<3;j++)mesh(new THREE.IcosahedronGeometry(2.2+(j%2)*.4,1),mat(foliage[(i+j)%foliage.length]),x+(j-1)*1.15,4.6+j*.45,z+(j%2)*.8);
  }
}
for(let i=0;i<7;i++){
  const x=-22+i*7.2,z=-62-(i%3)*4;
  const cliff=mesh(new THREE.ConeGeometry(6+i%3*2,16+i%2*6,5),mat(0x648e89),x,7,z);
  cliff.rotation.y=i*.8;
}
for(let i=0;i<9;i++){
  const x=-23+i*5.5,z=-20-(i%4)*9;
  const fish=mesh(new THREE.SphereGeometry(.33,7,6),mat(i%2?0xe0bc57:0x7db4a4),x,-.18,z);
  fish.scale.set(1.8,.45,.7);
}
// Lightweight animated neighboring anglers; decorative only, no fake online players.
const visitorAnglers=[];
for(let i=0;i<5;i++){
  const x=-21+i*8,z=-7-(i%2)*10;
  const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
  const colors=[0xd85f64,0x3978bb,0xe9b94f,0x8a67b8,0x3c9e82];
  const shirt=new THREE.Mesh(new THREE.BoxGeometry(.95,1.15,.62),mat(colors[i]));shirt.position.y=1.7;group.add(shirt);
  const face=new THREE.Mesh(new THREE.BoxGeometry(.64,.68,.64),skin);face.position.y=2.65;group.add(face);
  const hairMesh=new THREE.Mesh(new THREE.BoxGeometry(.7,.2,.7),mat(i%2?0x3a302b:0x293344));hairMesh.position.y=3.06;group.add(hairMesh);
  for(const side of [-1,1]){
    const arm=new THREE.Mesh(new THREE.BoxGeometry(.25,.8,.3),mat(colors[i]));arm.position.set(side*.62,1.75,-.18);arm.rotation.x=-.45;group.add(arm);
    const leg=new THREE.Mesh(new THREE.BoxGeometry(.3,.85,.35),mat(0x253b56));leg.position.set(side*.23,.65,0);group.add(leg);
  }
  const rodGeo=new THREE.CylinderGeometry(.018,.055,4,6);
  const rodMesh=new THREE.Mesh(rodGeo,mat(0x2a343b));rodMesh.position.set(.4,2.75,-1.4);rodMesh.rotation.x=-.75;group.add(rodMesh);
  visitorAnglers.push({group,shirt,offset:i*1.7});
}
const rodPoints=[new THREE.Vector3(-8.4,2.1,7.8),new THREE.Vector3(-6.2,3.8,4),new THREE.Vector3(-3.4,4.4,-1)];
const rodCurve=new THREE.CatmullRomCurve3(rodPoints),rod=mesh(new THREE.TubeGeometry(rodCurve,20,.065,7,false),mat(0x303b41));
const lineMaterial=new THREE.LineBasicMaterial({color:0xf6f5d9});let line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([rodPoints[2],new THREE.Vector3(-2.7,.1,-8)]),lineMaterial);scene.add(line);
const lineCoords=new Float32Array(6);line.geometry.dispose();line.geometry=new THREE.BufferGeometry();line.geometry.setAttribute('position',new THREE.BufferAttribute(lineCoords,3));
const bob=mesh(new THREE.SphereGeometry(.23,12,10),mat(0xf2f5ec),-2.7,.24,-8);const bobTop=mesh(new THREE.ConeGeometry(.12,.45,10),mat(0xf04c38),-2.7,.55,-8);
const rippleMat=new THREE.MeshBasicMaterial({color:0xd5f6ff,transparent:true,opacity:.35,side:THREE.DoubleSide});
const ripples=[];for(let i=0;i<3;i++){const r=mesh(new THREE.RingGeometry(.4,.46,40),rippleMat.clone(),-2.7,.06,-8);r.rotation.x=-Math.PI/2;ripples.push(r)}
let phase='idle',biteAt=0,biteUntil=0,progress=0,tension=0,last=performance.now(),fishKg=0,fishName='',reeling=false,fishBurst=0,fishDirection=1;
const cameraButton=$('camera'),soundButton=$('sound');let cameraMode='auto',audioContext=null,soundOn=false,lastAlert=0;
function beep(freq=540,duration=.13){if(!soundOn||!audioContext)return;try{const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.065,audioContext.currentTime+.012);gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+duration);osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration+.02)}catch{}}
cameraButton.addEventListener('click',()=>{cameraMode=cameraMode==='auto'?'float':cameraMode==='float'?'wide':'auto';cameraButton.textContent='📷 Camera: '+({auto:'Tự động',float:'Cận phao',wide:'Toàn cảnh'})[cameraMode]});
soundButton.addEventListener('click',async()=>{if(!soundOn){const AudioCtor=window.AudioContext||window.webkitAudioContext;if(!AudioCtor){tell('Thiết bị chưa hỗ trợ âm thanh.');return}audioContext ||=new AudioCtor();try{await audioContext.resume()}catch{return}soundOn=true;beep(650)}else soundOn=false;soundButton.textContent=soundOn?'🔊 Âm thanh: Bật':'🔇 Âm thanh: Tắt'});
let practiceProgress=initialProgress();
function showPracticeProgress(){const p=practiceProgress;document.getElementById('practice-level').textContent='Cấp '+p.level+' · '+p.xp+'/'+xpNeeded(p.level)+' EXP · '+p.catches+' cá';document.getElementById('practice-xp').style.width=(xpNeeded(p.level)?100*p.xp/xpNeeded(p.level):100)+'%'}
const fishes=['cá rô phi','cá chép','cá trắm','cá trôi','cá lóc'];
function tell(s){status.textContent=s}
function buttons(){cast.disabled=phase!=='idle'&&phase!=='done';hook.disabled=phase!=='bite';reel.disabled=phase!=='fight'}
function start(){phase='waiting';const now=performance.now();biteAt=now+2200+Math.random()*4000;progress=0;tension=0;fishBurst=0;fishDirection=1;reeling=false;fishKg=+(0.4+Math.random()*5.6).toFixed(1);fishName=fishes[Math.floor(Math.random()*fishes.length)];tell('Đã thả câu. Nhìn phao giữa hồ nhé!');buttons()}
function clear(){phase='idle';progress=0;tension=0;reeling=false;tell('Sẵn sàng tập câu.');buttons()}
function strike(){if(phase!=='bite')return;phase='fight';progress=0;tension=15;fishBurst=0;tell('Dính cá! Giữ Kéo cá, thả nút nếu dây quá căng.');beep(620,.16);buttons()}
cast.addEventListener('click',start);reset.addEventListener('click',clear);hook.addEventListener('click',strike);
reel.addEventListener('pointerdown',e=>{if(phase!=='fight')return;e.preventDefault();reeling=true;reel.setPointerCapture(e.pointerId)});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])reel.addEventListener(ev,()=>reeling=false);
window.addEventListener('blur',()=>reeling=false);canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();reeling=false;tell('Đồ họa 3D bị gián đoạn. Hãy tải lại trang để tiếp tục.');document.getElementById('render-error').hidden=false},{passive:false});document.addEventListener('visibilitychange',()=>{if(document.hidden)reeling=false});
const fishModel=new THREE.Group();const body=new THREE.Mesh(new THREE.SphereGeometry(.65,14,10),mat(0xe1b85a));body.scale.set(1.7,.8,.65);fishModel.add(body);const tail=new THREE.Mesh(new THREE.ConeGeometry(.45,.9,3),mat(0xbd8439));tail.rotation.z=Math.PI/2;tail.position.x=-1.1;fishModel.add(tail);const fin=new THREE.Mesh(new THREE.ConeGeometry(.32,.65,3),mat(0xc38c3d));fin.position.set(0,.55,0);fishModel.add(fin);fishModel.position.set(-2.7,-.45,-8);scene.add(fishModel);
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;
if(phase==='waiting'&&now>=biteAt){phase='bite';biteUntil=now+1600;tell('⚡ PHAO CHÌM! Bấm Giật cần!');beep(820,.2);buttons()}
if(phase==='bite'&&now>biteUntil){phase='idle';tell('Cá đã nhả mồi. Thả lại nhé!');buttons()}
if(phase==='fight'){fishBurst+=dt;const surge=Math.sin(now*.0032+fishKg)*Math.sin(now*.0017)*fishKg*.7;tension=Math.max(0,Math.min(100,tension+(reeling?(31+fishKg*2.4+Math.max(0,surge)*3):-(30+fishKg))*dt));if(reeling)progress+=dt*Math.max(4,15-fishKg*.9);
if(tension>=100){phase='done';reeling=false;tell('💥 Đứt dây! Cá chạy mất rồi.');beep(220,.32);buttons()}
else if(progress>=100){phase='done';reeling=false;const result=awardCatch(practiceProgress,fishKg);practiceProgress=result.profile;showPracticeProgress();tell('🎉 Tập thành công: '+fishName+' '+fishKg+' kg · +'+result.xpGained+' EXP luyện tập (không lưu).');beep(940,.3);buttons()}}
visitorAnglers.forEach(({group,shirt,offset})=>{shirt.rotation.z=Math.sin(now*.0013+offset)*.035;group.rotation.y=Math.sin(now*.0005+offset)*.07});
const active=phase==='waiting'||phase==='bite'||phase==='fight';
const closeUp=cameraMode==='float'||(cameraMode==='auto'&&(phase==='bite'||phase==='fight'));
const targetPos=closeUp?new THREE.Vector3(-.6,3.2,2.5):cameraMode==='wide'?new THREE.Vector3(3.7,8.5,18):new THREE.Vector3(-6.8,5.2,16.8);
const lookAt=closeUp?new THREE.Vector3(-2.7,.15,-8):cameraMode==='wide'?new THREE.Vector3(0,0,-12):new THREE.Vector3(-5,1.1,-3);
camera.position.lerp(targetPos,Math.min(1,dt*2.4));camera.lookAt(lookAt);
bob.visible=bobTop.visible=active;line.visible=active;fishModel.visible=phase==='fight';
const dip=phase==='bite'?.35:0;const wave=Math.sin(now*.005)*.06;bob.position.y=.24+wave-dip;bobTop.position.y=.55+wave-dip;
const fishFight=phase==='fight'?Math.sin(now*.008+fishKg)*(.6+fishKg*.15):0;
const approach=phase==='fight'?Math.min(1,progress/100):0;
fishModel.position.set(-2.7+fishFight,-.45+approach*.9,-8+Math.sin(now*.006)*.6+approach*2);fishModel.rotation.y=Math.sin(now*.008)*.7;fishModel.rotation.z=Math.sin(now*.018)*.18;tail.rotation.y=Math.sin(now*.025)*.7;
const splash=phase==='fight'&&tension>55;
if(splash&&now-lastAlert>1200){lastAlert=now;if(tension>82)tell('⚠️ Dây quá căng! Thả nút kéo cá một chút.')} 
const bent=phase==='fight'?(tension/100)*1.2:0;
if(rod.userData.lastBend===undefined||Math.abs(rod.userData.lastBend-bent)>.035){rod.geometry.dispose();const tipShape=new THREE.Vector3(-3.4-bent,4.4-bent*1.3,-1);rod.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([rodPoints[0],rodPoints[1],tipShape]),20,.065,7,false);rod.userData.lastBend=bent}
const tip=new THREE.Vector3(-3.4-bent,4.4-bent*1.3,-1);
lineCoords.set([tip.x,tip.y,tip.z,bob.position.x,bob.position.y,bob.position.z]);line.geometry.attributes.position.needsUpdate=true;
ripples.forEach((r,i)=>{r.visible=active;r.position.x=phase==='fight'?fishModel.position.x:bob.position.x;r.position.z=phase==='fight'?fishModel.position.z:bob.position.z;const scale=.8+((now*(splash?.0014:.0006)+i/3)%1.7);r.scale.setScalar(scale);r.material.opacity=(splash?.6:.25)*(1-(scale-.8)/1.7)});
water.material.color.setHSL(.52,.6,.4+Math.sin(now*.001)*.012);
meter.style.width=tension+'%';meter.style.background=tension>75?'#ef6258':'#eab65c';
renderer.render(scene,camera);requestAnimationFrame(frame)}
showPracticeProgress();buttons();requestAnimationFrame(frame);

// Practice-only inventory: never syncs or persists to accounts.
for (const slot of Object.keys(PRACTICE_EQUIPMENT)) {
  const select=document.getElementById('equip-'+slot);
  if (!select) continue;
  for (const item of PRACTICE_EQUIPMENT[slot]) {
    const option=document.createElement('option');
    option.value=item;
    option.textContent=item;
    select.appendChild(option);
  }
  select.value=practiceProgress.equipment[slot];
  select.addEventListener('change',()=>{
    try {
      practiceProgress=equipPracticeItem(practiceProgress,slot,select.value);
      document.getElementById('equipment-status').textContent='Đã thay '+slot+': '+select.value+' (chỉ phiên tập câu).';
    } catch(error) {
      select.value=practiceProgress.equipment[slot];
      document.getElementById('equipment-status').textContent='Trang bị không hợp lệ.';
    }
  });
}
