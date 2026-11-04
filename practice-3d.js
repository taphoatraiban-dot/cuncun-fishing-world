import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const $=id=>document.getElementById(id),canvas=$('lake'),cast=$('cast'),hook=$('hook'),reel=$('reel'),reset=$('reset'),status=$('status'),meter=$('tension');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9bd5f0);scene.fog=new THREE.Fog(0x9bd5f0,70,210);
const camera=new THREE.PerspectiveCamera(52,720/620,.1,250);camera.position.set(3.7,8.5,18);camera.lookAt(0,0,-12);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
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
const fishes=['cá rô phi','cá chép','cá trắm','cá trôi','cá lóc'];
function tell(s){status.textContent=s}
function buttons(){cast.disabled=phase!=='idle'&&phase!=='done';hook.disabled=phase!=='bite';reel.disabled=phase!=='fight'}
function start(){phase='waiting';const now=performance.now();biteAt=now+2200+Math.random()*4000;progress=0;tension=0;fishBurst=0;fishDirection=1;reeling=false;fishKg=+(0.4+Math.random()*5.6).toFixed(1);fishName=fishes[Math.floor(Math.random()*fishes.length)];tell('Đã thả câu. Nhìn phao giữa hồ nhé!');buttons()}
function clear(){phase='idle';progress=0;tension=0;reeling=false;tell('Sẵn sàng tập câu.');buttons()}
function strike(){if(phase!=='bite')return;phase='fight';progress=0;tension=15;fishBurst=0;tell('Dính cá! Giữ Kéo cá, thả nút nếu dây quá căng.');beep(620,.16);buttons()}
cast.addEventListener('click',start);reset.addEventListener('click',clear);hook.addEventListener('click',strike);
reel.addEventListener('pointerdown',e=>{if(phase!=='fight')return;e.preventDefault();reeling=true;reel.setPointerCapture(e.pointerId)});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])reel.addEventListener(ev,()=>reeling=false);
window.addEventListener('blur',()=>reeling=false);document.addEventListener('visibilitychange',()=>{if(document.hidden)reeling=false});
const fishModel=new THREE.Group();const body=new THREE.Mesh(new THREE.SphereGeometry(.65,14,10),mat(0xe1b85a));body.scale.set(1.7,.8,.65);fishModel.add(body);const tail=new THREE.Mesh(new THREE.ConeGeometry(.45,.9,3),mat(0xbd8439));tail.rotation.z=Math.PI/2;tail.position.x=-1.1;fishModel.add(tail);const fin=new THREE.Mesh(new THREE.ConeGeometry(.32,.65,3),mat(0xc38c3d));fin.position.set(0,.55,0);fishModel.add(fin);fishModel.position.set(-2.7,-.45,-8);scene.add(fishModel);
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;
if(phase==='waiting'&&now>=biteAt){phase='bite';biteUntil=now+1600;tell('⚡ PHAO CHÌM! Bấm Giật cần!');beep(820,.2);buttons()}
if(phase==='bite'&&now>biteUntil){phase='idle';tell('Cá đã nhả mồi. Thả lại nhé!');buttons()}
if(phase==='fight'){fishBurst+=dt;const surge=Math.sin(now*.0032+fishKg)*Math.sin(now*.0017)*fishKg*.7;tension=Math.max(0,Math.min(100,tension+(reeling?(31+fishKg*2.4+Math.max(0,surge)*3):-(30+fishKg))*dt));if(reeling)progress+=dt*Math.max(4,15-fishKg*.9);
if(tension>=100){phase='done';reeling=false;tell('💥 Đứt dây! Cá chạy mất rồi.');beep(220,.32);buttons()}
else if(progress>=100){phase='done';reeling=false;tell('🎉 Tập thành công: '+fishName+' '+fishKg+' kg (mô phỏng, không tính điểm).');beep(940,.3);buttons()}}
const active=phase==='waiting'||phase==='bite'||phase==='fight';
const closeUp=cameraMode==='float'||(cameraMode==='auto'&&(phase==='bite'||phase==='fight'));
const targetPos=closeUp?new THREE.Vector3(-.6,3.2,2.5):new THREE.Vector3(3.7,8.5,18);
const lookAt=closeUp?new THREE.Vector3(-2.7,.15,-8):new THREE.Vector3(0,0,-12);
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
buttons();requestAnimationFrame(frame);
