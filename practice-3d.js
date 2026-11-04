import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {initialProgress,awardCatch,xpNeeded,PRACTICE_EQUIPMENT,equipPracticeItem} from './fishing-progression.js';
const $=id=>document.getElementById(id),canvas=$('lake'),cast=$('cast'),hook=$('hook'),reel=$('reel'),reset=$('reset'),status=$('status'),meter=$('tension');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9bd5f0);scene.fog=new THREE.Fog(0x9bd5f0,70,210);
const camera=new THREE.PerspectiveCamera(52,720/620,.1,250);camera.position.set(3.7,8.5,18);camera.lookAt(0,0,-12);
let renderer;
try{
  // Mobile Safari can refuse a high-memory antialiased context; request a lean
  // context first, then let Three.js initialize against that exact context.
  const mobile=/iPhone|iPad|iPod/i.test(navigator.userAgent);
  const options={canvas,antialias:!mobile,alpha:false,powerPreference:'low-power',preserveDrawingBuffer:false};
  renderer=new THREE.WebGLRenderer(options);
}catch(error){
  const panel=document.getElementById('render-error');
  const reason=String(error?.message||error||'Lỗi WebGL không xác định').slice(0,240);
  panel.hidden=false;
  panel.textContent='Không khởi tạo được WebGL: '+reason+' — Hãy đóng các tab 3D khác, tải lại trang hoặc mở trong Safari.';
  status.textContent='Hồ 3D không khởi động được. Chi tiết lỗi hiển thị trong khung đỏ.';
  throw error;
}
const pixelRatio=Math.min(window.devicePixelRatio||1,/iPhone|iPad|iPod/i.test(navigator.userAgent)?1:1.5);renderer.setPixelRatio(pixelRatio);
function resize(){const width=Math.max(240,Math.round(canvas.getBoundingClientRect().width||720));const height=Math.max(300,Math.round(canvas.getBoundingClientRect().height||width*620/720));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()}
window.addEventListener('resize',resize,{passive:true});resize();
scene.add(new THREE.HemisphereLight(0xe9f7ff,0x345638,2.1));const sun=new THREE.DirectionalLight(0xffffff,2.1);sun.position.set(-20,32,12);scene.add(sun);
const mat=(c,extra={})=>new THREE.MeshStandardMaterial({color:c,roughness:.8,...extra});
function mesh(geometry,material,x=0,y=0,z=0){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);scene.add(o);return o}
const ground=mesh(new THREE.PlaneGeometry(180,180),mat(0x659a57),0,-.22,-25);ground.rotation.x=-Math.PI/2;
// Atmospheric sky dome: soft horizon gradient and warm sunlight, no external assets.
const sky=new THREE.Mesh(
 new THREE.SphereGeometry(185,32,16),
 new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{topColor:{value:new THREE.Color(0x317ec5)},horizonColor:{value:new THREE.Color(0xd3f3f4)},warmColor:{value:new THREE.Color(0xffe0ae)}},
  vertexShader:'varying vec3 vWorld; void main(){vec4 w=modelMatrix*vec4(position,1.0);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'varying vec3 vWorld;uniform vec3 topColor;uniform vec3 horizonColor;uniform vec3 warmColor;void main(){float h=clamp(normalize(vWorld).y,0.0,1.0);vec3 col=mix(horizonColor,topColor,pow(h,0.72));float glow=pow(max(0.0,dot(normalize(vWorld),normalize(vec3(-0.45,0.36,-0.82)))),14.0);col=mix(col,warmColor,glow*0.5);gl_FragColor=vec4(col,1.0);}'
 })
);
sky.frustumCulled=false;scene.add(sky);
const sunDisc=mesh(new THREE.SphereGeometry(3.8,18,12),new THREE.MeshBasicMaterial({color:0xfff1cf,fog:false}),-70,58,-105);
const cloudMat=new THREE.MeshBasicMaterial({color:0xf5fbff,transparent:true,opacity:.68,depthWrite:false,fog:false});
for(let i=0;i<9;i++){
 const cloud=new THREE.Group();
 const x=-66+(i%5)*34,z=-95-Math.floor(i/5)*29,y=31+(i%3)*5;
 cloud.position.set(x,y,z);scene.add(cloud);
 for(let j=0;j<4;j++){
  const puff=new THREE.Mesh(new THREE.SphereGeometry(1,10,7),cloudMat);
  puff.position.set((j-1.5)*3,Math.sin(j*2.1)*.6,0);
  puff.scale.set(3.5+(j%2),1.1+(j%3)*.2,1.4);cloud.add(puff);
 }
}

// Lightweight animated lake surface: actual moving waves rather than a flat blue sheet.
const lakeGeometry=new THREE.PlaneGeometry(54,90,42,54);
const lakePositions=lakeGeometry.attributes.position;
const lakeBase=new Float32Array(lakePositions.array);
// Fresnel water with moving caustic highlights, deep-water color and soft sky reflection.
const waterMaterial=new THREE.ShaderMaterial({
 transparent:true,side:THREE.DoubleSide,depthWrite:true,
 uniforms:{uTime:{value:0},uDeep:{value:new THREE.Color(0x07586d)},uShallow:{value:new THREE.Color(0x32a6a4)},uSky:{value:new THREE.Color(0xc7e8f2)}},
 vertexShader:`varying vec3 vWorld;varying vec3 vNormalW;varying vec2 vUv;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;vNormalW=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`uniform float uTime;uniform vec3 uDeep,uShallow,uSky;varying vec3 vWorld,vNormalW,vUv;void main(){vec3 V=normalize(cameraPosition-vWorld);float fresnel=pow(1.-abs(dot(normalize(vNormalW),V)),2.4);float ripple=sin(vWorld.x*1.8+uTime*1.3+sin(vWorld.z*.7))*sin(vWorld.z*2.2-uTime*.9);float fine=sin(vWorld.x*8.+uTime*2.1)*sin(vWorld.z*6.-uTime*1.6);float glitter=pow(max(0.,ripple*.5+fine*.22+.18),9.)*.65;vec3 col=mix(uDeep,uShallow,clamp(.3+ripple*.11+vUv.y*.22,0.,1.));col=mix(col,uSky,clamp(fresnel*.67,0.,.75));col+=vec3(.65,.76,.72)*glitter;gl_FragColor=vec4(col,.96);}`
});
const water=mesh(lakeGeometry,waterMaterial,0,.02,-25);
water.rotation.x=-Math.PI/2;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
function animateLake(t){
 waterMaterial.uniforms.uTime.value=t;
 const a=lakePositions.array;
 for(let i=0;i<a.length;i+=3){
  const x=lakeBase[i],z=lakeBase[i+1];
  a[i+2]=Math.sin(x*.42+t*1.5+z*.12)*.07+Math.cos(z*.27-t*1.1+x*.18)*.055;
 }
 lakePositions.needsUpdate=true;
 lakeGeometry.computeVertexNormals();
}
// Layered foliage silhouettes instead of single triangular placeholder trees.
const foliage=[mat(0x245e3d),mat(0x36764a),mat(0x4b8851),mat(0x28563b)];
const bark=mat(0x68503b);
for(const side of [-1,1]){
 mesh(new THREE.BoxGeometry(3,.3,90),mat(0x9a9870),side*28,-.02,-25);
 for(let i=0;i<22;i++){
  const z=12-i*3.7,x=side*(30.5+(i%3)*1.7),h=3.6+(i%5)*.5;
  mesh(new THREE.CylinderGeometry(.13,.24,h*.65,8),bark,x,h*.32,z);
  for(let tier=0;tier<4;tier++){
   const yy=h*.35+tier*h*.18,rad=(1.55-tier*.29)*(1+(i%3)*.07);
   for(let j=0;j<5;j++){
    const angle=j*Math.PI*2/5+tier*.35+i*.7;
    const crown=mesh(new THREE.IcosahedronGeometry(1,1),foliage[(i+j+tier)%foliage.length],x+Math.cos(angle)*rad*.44,yy,z+Math.sin(angle)*rad*.44);
    crown.scale.set(rad*.65,h*.18,rad*.68);
   }
  }
 }
}
// Distant forested ridgelines add depth and natural silhouettes to the horizon.
const ridgeMats=[mat(0x769c8c,{roughness:1}),mat(0x507b70,{roughness:1}),mat(0x365e51,{roughness:1})];
for(let layer=0;layer<3;layer++){
 const z=-103+layer*12,verts=[],indices=[];
 const width=165,segments=55,base=-1.1-layer*.2;
 for(let i=0;i<=segments;i++){
  const x=-width/2+i*width/segments;
  const height=5+layer*2+Math.sin(i*.39+layer)*2.6+Math.sin(i*.17+layer*1.8)*3.4;
  verts.push(x,base,z,x,height,z);
  if(i<segments){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2)}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();
 const ridge=mesh(geo,ridgeMats[layer]);ridge.material.side=THREE.DoubleSide;
}
// Reeds and uneven shoreline break up the straight artificial bank.
const reedGreen=[mat(0x537e4a),mat(0x71945a),mat(0x426d46)];
for(const side of [-1,1])for(let i=0;i<110;i++){
 const z=10-i*.77,x=side*(26.8+(i%7)*.18),h=.3+(i%5)*.13;
 const reed=mesh(new THREE.CylinderGeometry(.009,.018,h,5),reedGreen[i%3],x,h*.5,z);
 reed.rotation.z=Math.sin(i*1.7)*.22;
}
const pier=mesh(new THREE.BoxGeometry(5,.28,9),mat(0x966b43),-8,.18,8);
for(let i=0;i<5;i++)mesh(new THREE.BoxGeometry(4.9,.05,.07),mat(0xb98b58),-8,.35,4.4+i*1.8);
// Shoreline environment pass: natural paths, boulders, bushes and a lakeside shelter.
// Deterministic, low-poly geometry with shared materials; no downloads or gameplay changes.
const shoreSand=mat(0xc5b28b),shoreSoil=mat(0x82694e),rockMats=[mat(0x7b8580),mat(0x9ba39b),mat(0x626f69)];
const bushMats=[mat(0x315d36),mat(0x497c3e),mat(0x6c9246)];
const shorePatches=[];
for(const side of [-1,1]){
  for(let i=0;i<20;i++){
    const z=11-i*4.1;
    const bank=mesh(new THREE.SphereGeometry(1,10,6),i%3?shoreSand:shoreSoil,side*(27.1+(i%3)*.22),-.14,z);
    bank.scale.set(.85,.12,2.8);shorePatches.push(bank);
  }
  // Curved walking path behind the fishing spots.
  for(let i=0;i<21;i++){
    const z=13-i*4.0;
    const path=mesh(new THREE.BoxGeometry(2.1,.035,3.8),shoreSand,side*(33.7+Math.sin(i*.48)*.9),-.174,z);
    path.rotation.y=side*Math.sin(i*.48)*.11;
  }
  // Irregular clusters of stones, shrubs and small flowering plants.
  for(let i=0;i<42;i++){
    const z=12-i*1.93;
    const x=side*(28.8+(i%5)*1.18);
    if(i%3===0){
      const stone=mesh(new THREE.DodecahedronGeometry(.48+(i%4)*.12,0),rockMats[i%3],x,.16,z);
      stone.scale.set(1.4,.55,.9);stone.rotation.y=i*1.71;
    }else{
      for(let j=0;j<3;j++){
        const shrub=mesh(new THREE.IcosahedronGeometry(.42+(j%2)*.12,1),bushMats[(i+j)%3],x+(j-1)*.38,.22+(j%2)*.13,z+(j-1)*.22);
        shrub.scale.set(1.25,.75,1);
      }
    }
    if(i%8===2){
      const flowerMat=mat(i%2?0xe6b4c0:0xe7d67a,{emissive:i%2?0x2b1115:0x25200b});
      for(let j=0;j<4;j++)mesh(new THREE.SphereGeometry(.055,6,5),flowerMat,x+(j-1.5)*.14,.51,z+.25);
    }
  }
}
// Timber lakeside pavilion on the right bank, far from the player's dock.
const shelterWood=mat(0x795538),shelterRoof=mat(0x4c5553),shelterAccent=mat(0xc3a47a);
const shelterX=37,shelterZ=-19;
mesh(new THREE.BoxGeometry(7,.22,6),shelterWood,shelterX,.03,shelterZ);
for(const dx of [-3,3])for(const dz of [-2.5,2.5]){
  mesh(new THREE.CylinderGeometry(.13,.16,3.5,8),shelterWood,shelterX+dx,1.8,shelterZ+dz);
}
for(const sign of [-1,1]){
  const roof=mesh(new THREE.BoxGeometry(4.8,.18,7.2),shelterRoof,shelterX+sign*1.75,3.7,shelterZ);
  roof.rotation.z=sign*.32;
}
mesh(new THREE.BoxGeometry(2.8,.14,.8),shelterAccent,shelterX,.75,shelterZ);
for(const dx of [-1.2,1.2])mesh(new THREE.BoxGeometry(.14,.75,.7),shelterWood,shelterX+dx,.36,shelterZ);
// A few distant warm lamps help distinguish the developed shore from the forest.
const lampPost=mat(0x514c3d),lampGlass=new THREE.MeshBasicMaterial({color:0xffd99a});
for(const side of [-1,1])for(const z of [-6,-38,-68]){
  const x=side*34.4;
  mesh(new THREE.CylinderGeometry(.065,.09,2.6,8),lampPost,x,1.13,z);
  mesh(new THREE.SphereGeometry(.22,10,8),lampGlass,x,2.53,z);
}
// External CC0 PBR glTF asset pilot (Khronos Lantern, CC0).
// This loads asynchronously and is entirely optional: failures never stop fishing.
// Attribution/license: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Lantern
const modelLoader=new GLTFLoader();
modelLoader.load(
 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Lantern/glTF-Binary/Lantern.glb',
 gltf=>{
  const model=gltf.scene;
  const bounds=new THREE.Box3().setFromObject(model);
  const size=bounds.getSize(new THREE.Vector3());
  if(!Number.isFinite(size.y)||size.y<=0)return;
  model.scale.setScalar(1.15/size.y);
  model.updateMatrixWorld(true);
  const scaled=new THREE.Box3().setFromObject(model);
  const center=scaled.getCenter(new THREE.Vector3());
  model.position.set(-10.25-center.x,.44-scaled.min.y,6.25-center.z);
  model.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true}});
  scene.add(model);
 },
 undefined,
 error=>console.warn('Optional CC0 lantern model unavailable; fishing continues.',error)
);
// Fishing station rebuilt around a seated angler facing negative Z (the lake).
// Rod rest is physically attached to the seat box, not planted separately in water.
const seatShell=mat(0x233b49),seatEdge=mat(0x70b6b4,{metalness:.45}),seatCushion=mat(0x1b2932);
const chair=mesh(new THREE.BoxGeometry(1.5,.72,1.45),seatShell,-8.9,.99,8.15);
mesh(new THREE.BoxGeometry(1.55,.17,1.49),seatCushion,-8.9,1.41,8.15);
for(const x of [-9.5,-8.3])for(const z of [7.55,8.75]){
 mesh(new THREE.CylinderGeometry(.065,.085,1.05,10),seatEdge,x,.64,z);
 mesh(new THREE.CylinderGeometry(.14,.14,.075,10),seatShell,x,.17,z);
}
// Side rail and clamp, visible from both behind and first-person views.
mesh(new THREE.BoxGeometry(.15,.16,1.2),seatEdge,-8.09,1.08,7.96);
mesh(new THREE.BoxGeometry(.34,.35,.35),mat(0x171f28),-8.04,1.23,7.66);
mesh(new THREE.CylinderGeometry(.09,.09,.15,12),mat(0xc8d3da),-7.83,1.27,7.66).rotation.z=Math.PI/2;
// Forward cantilever tube: aligned with the direction of the rod and lake.
function tubeBetween(a,b,r,material){
 const d=new THREE.Vector3().subVectors(b,a);
 const m=mesh(new THREE.CylinderGeometry(r,r,d.length(),10),material);
 m.position.copy(a).add(b).multiplyScalar(.5);
 m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
 return m;
}
const restSteel=mat(0x9eb8c2,{metalness:.65,roughness:.3}),restGrip=mat(0x1d2934);
tubeBetween(new THREE.Vector3(-8.04,1.25,7.66),new THREE.Vector3(-8.12,1.88,6.55),.085,restSteel);
tubeBetween(new THREE.Vector3(-8.12,1.88,6.55),new THREE.Vector3(-8.18,2.23,5.1),.065,restSteel);
tubeBetween(new THREE.Vector3(-8.18,2.23,5.1),new THREE.Vector3(-8.21,2.35,4.55),.048,restGrip);
// U/V rest at the end of the long cantilever.
const vPoint=new THREE.Vector3(-8.21,2.35,4.55);
tubeBetween(vPoint,new THREE.Vector3(-8.43,2.58,4.49),.055,restGrip);
tubeBetween(vPoint,new THREE.Vector3(-7.99,2.58,4.49),.055,restGrip);
// Bait tray and bowl sit in reach, on the opposite side of the seat.
const baitTray=mat(0x405d65),baitMix=mat(0xb78b52),baitRim=mat(0xc7d5d8,{metalness:.35});
mesh(new THREE.BoxGeometry(.24,.2,.28),seatEdge,-9.7,1.18,7.78);
mesh(new THREE.BoxGeometry(.96,.09,.83),baitTray,-10.05,1.52,7.33);
mesh(new THREE.CylinderGeometry(.37,.31,.2,18),baitRim,-10.05,1.66,7.33);
mesh(new THREE.CylinderGeometry(.3,.3,.027,18),baitMix,-10.05,1.77,7.33);
for(let i=0;i<7;i++){
 const a=i*Math.PI*2/7;
 mesh(new THREE.SphereGeometry(.065,8,6),baitMix,-10.05+Math.cos(a)*.18,1.8,7.33+Math.sin(a)*.18);
}
mesh(new THREE.BoxGeometry(.38,.08,.45),mat(0x253c42),-9.58,1.57,7.05);
// First-person foreground: visible seat, knees, bait and rod rest in the player's view.
// These are camera-local visual proxies for the same world-space fishing station.
const eyeRig=new THREE.Group();camera.add(eyeRig);scene.add(camera);
function eyeMesh(geometry,material,x,y,z){
 const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);eyeRig.add(o);return o;
}
function eyeTube(a,b,r,material){
 const direction=new THREE.Vector3().subVectors(b,a);
 const o=eyeMesh(new THREE.CylinderGeometry(r,r,direction.length(),10),material,0,0,0);
 o.position.copy(a).add(b).multiplyScalar(.5);
 o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
 return o;
}
const eyeFabric=mat(0x273447),eyeMetal=mat(0x9eb8c2,{metalness:.55,roughness:.35}),eyeRod=mat(0x1d2834),eyeRed=mat(0xe33c42),eyeBlue=mat(0x1963a3);
// Keep knees low in the viewport so the lake and fishing float remain visible.
for(const x of [-.65,.65]){
 const knee=eyeMesh(new THREE.SphereGeometry(.38,16,12),eyeFabric,x,-1.38,-1.72);
 knee.scale.set(.9,.82,1.25);
}
eyeMesh(new THREE.BoxGeometry(1.12,.15,.7),seatShell,0,-1.68,-1.7);
// Bait bowl is fully within a portrait iPhone field of view.
eyeMesh(new THREE.BoxGeometry(.78,.09,.63),eyeBlue,-.92,-.95,-2.18);
eyeMesh(new THREE.CylinderGeometry(.38,.33,.2,20),eyeBlue,-.92,-.8,-2.18);
eyeMesh(new THREE.CylinderGeometry(.31,.31,.035,20),baitMix,-.92,-.68,-2.18);
eyeMesh(new THREE.CylinderGeometry(.21,.19,.15,16),baitRim,-.49,-.78,-2.39);
eyeMesh(new THREE.CylinderGeometry(.16,.16,.03,16),mat(0xe6b842),-.49,-.69,-2.39);
// A slim telescopic rest projects forward from the right side of the tackle box.
// Its small rubber V is below the rod, not a second fishing pole.
eyeTube(new THREE.Vector3(.79,-1.46,-1.65),new THREE.Vector3(.91,-1.13,-2.18),.042,eyeMetal);
eyeTube(new THREE.Vector3(.91,-1.13,-2.18),new THREE.Vector3(.91,-.71,-4.12),.029,eyeMetal);
// Only two short rubber prongs form the V. The rod runs BETWEEN them.
eyeTube(new THREE.Vector3(.91,-.71,-4.12),new THREE.Vector3(.80,-.48,-4.20),.022,eyeRed);
eyeTube(new THREE.Vector3(.91,-.71,-4.12),new THREE.Vector3(1.02,-.48,-4.20),.022,eyeRed);
// One continuous tapered fishing rod: handle in the right hand, blank in the V,
// and the fine tip reaching down toward the lake.
const firstPersonRod=new THREE.Group();
firstPersonRod.position.set(.77,-.91,-1.78);eyeRig.add(firstPersonRod);
function mountedRodTube(a,b,r,material){
 const part=eyeTube(a,b,r,material);
 // Preserve its camera-local position when reparenting under the animated rod.
 part.position.sub(firstPersonRod.position);
 firstPersonRod.add(part);
 return part;
}
// Tapered carbon blank with an actual grip, ferrules and ceramic guide rings.
const carbon=mat(0x111923,{metalness:.24,roughness:.3});
const gripRubber=mat(0x202326,{roughness:.96});
const ferrule=mat(0xb0b7bb,{metalness:.82,roughness:.22});
const winding=mat(0x97272c,{metalness:.32,roughness:.36});
const rodNodes=[
 new THREE.Vector3(.77,-.91,-1.78),
 new THREE.Vector3(.86,-.65,-3.15),
 new THREE.Vector3(.91,-.49,-4.20),
 new THREE.Vector3(.90,-.72,-6.65),
 new THREE.Vector3(.87,-1.13,-9.0),
 new THREE.Vector3(.85,-1.81,-12)
];
for(let i=0;i<rodNodes.length-1;i++){
 const a=rodNodes[i],b=rodNodes[i+1],d=new THREE.Vector3().subVectors(b,a);
 const radius0=.062*Math.pow(.65,i),radius1=.062*Math.pow(.65,i+1);
 const segment=new THREE.Mesh(new THREE.CylinderGeometry(radius1,radius0,d.length(),12),carbon);
 segment.position.copy(a).add(b).multiplyScalar(.5).sub(firstPersonRod.position);
 segment.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
 firstPersonRod.add(segment);
}
mountedRodTube(new THREE.Vector3(.77,-.91,-1.78),new THREE.Vector3(.81,-.81,-2.32),.069,gripRubber);
for(let i=0;i<4;i++){
 const z=-2.36-i*.21;
 const ring=eyeMesh(new THREE.TorusGeometry(.055-i*.009,.012,8,16),winding,.82+i*.01,-.8+i*.04,z);
 ring.rotation.x=Math.PI/2;ring.position.sub(firstPersonRod.position);firstPersonRod.add(ring);
}
for(let i=2;i<rodNodes.length;i++){
 const pt=rodNodes[i];
 const guide=eyeMesh(new THREE.TorusGeometry(.07-(i-2)*.01,.009,7,14),ferrule,pt.x,pt.y-.075,pt.z);
 guide.rotation.x=Math.PI/2;guide.position.sub(firstPersonRod.position);firstPersonRod.add(guide);
}
// Detailed first-person tackle: food pellets, molded tray edges and gripping hands.
const eyeSkin=mat(0xd9a47f,{roughness:.91}),eyeBaitDark=mat(0x8b663c),eyeGold=mat(0xf0c76b);
for(let i=0;i<12;i++){
 const a=i*2.399,rr=.1+(i%4)*.065;
 const pellet=eyeMesh(new THREE.SphereGeometry(.048+(i%3)*.012,8,6),i%3?baitMix:eyeBaitDark,-.92+Math.cos(a)*rr,-.59,-2.18+Math.sin(a)*rr);
 pellet.scale.y=.72;
}
for(const x of [-.92,-.49]){
 const z=x===-.92?-2.18:-2.39,r=x===-.92?.4:.22;
 eyeMesh(new THREE.TorusGeometry(r,.035,8,24),eyeMetal,x,-.66,z).rotation.x=Math.PI/2;
}
// Sculpted forearms and articulated gripping fingers. Right-hand grip is bound
// to the rod group so it follows the rod during a strike.
const firstPersonHands=[];
function eyeLimb(a,b,r0,r1,material,parent=eyeRig){
 const d=new THREE.Vector3().subVectors(b,a);
 const part=new THREE.Mesh(new THREE.CylinderGeometry(r1,r0,d.length(),12),material);
 part.position.copy(a).add(b).multiplyScalar(.5);
 part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
 parent.add(part);return part;
}
const rightHandGroup=new THREE.Group();
rightHandGroup.position.set(0,0,0);firstPersonRod.add(rightHandGroup);
const rightSkin=eyeSkin;
eyeLimb(new THREE.Vector3(1.0,-1.55,-1.06),new THREE.Vector3(.82,-1.02,-1.66),.22,.16,eyeFabric,rightHandGroup);
const palm=new THREE.Mesh(new THREE.SphereGeometry(.19,18,14),rightSkin);
palm.position.set(.79,-.94,-1.77);palm.scale.set(.85,.75,1.3);rightHandGroup.add(palm);
for(let i=0;i<4;i++){
 const z=-1.72-i*.095;
 eyeLimb(new THREE.Vector3(.68,-.93,z),new THREE.Vector3(.81,-1.035,z-.035),.045,.035,rightSkin,rightHandGroup);
 eyeLimb(new THREE.Vector3(.81,-1.035,z-.035),new THREE.Vector3(.89,-.94,z-.065),.035,.025,rightSkin,rightHandGroup);
}
eyeLimb(new THREE.Vector3(.66,-.91,-1.66),new THREE.Vector3(.78,-.81,-1.83),.066,.042,rightSkin,rightHandGroup);
eyeLimb(new THREE.Vector3(-.73,-1.4,-1.3),new THREE.Vector3(-.6,-.89,-1.96),.21,.15,eyeFabric);
const leftPalm=eyeMesh(new THREE.SphereGeometry(.16,16,12),eyeSkin,-.59,-.78,-2.02);
leftPalm.scale.set(.9,.7,1.25);
firstPersonHands.push({sleeve:null,hand:leftPalm,side:-1});
eyeMesh(new THREE.BoxGeometry(.5,.06,.08),eyeGold,-.94,-1.02,-1.74);
eyeRig.visible=false;
// Wooden dock supports, side rails and fishing-station details.
const dockWood=mat(0x62422d),dockTrim=mat(0xc99b61),metal=mat(0x33434b);
for(const z of [4.3,8.1,12.1]){
  for(const x of [-10.3,-5.7]){
    mesh(new THREE.CylinderGeometry(.15,.19,2.2,7),dockWood,x,-.72,z);
    mesh(new THREE.BoxGeometry(.35,.11,.35),metal,x,.4,z);
  }
}
for(const x of [-10.42,-5.58]){
  mesh(new THREE.BoxGeometry(.14,.12,8.7),dockTrim,x,.39,8);
}
for(let i=0;i<9;i++){
  mesh(new THREE.BoxGeometry(4.8,.018,.055),dockWood,-8,.36,4.2+i*.95);
}
mesh(new THREE.BoxGeometry(.68,.24,.55),mat(0x277c89),-7.0,.57,9.1);
mesh(new THREE.BoxGeometry(.62,.09,.49),metal,-7.0,.74,9.1);
mesh(new THREE.CylinderGeometry(.18,.22,.4,9),mat(0xb6c3c9),-6.6,.62,7.4);
// Subtle concentric ripples near the float; decorative and lightweight.
const lakeRipples=[];
for(let i=0;i<3;i++){
  const ring=new THREE.Mesh(new THREE.RingGeometry(.72, .79, 32),new THREE.MeshBasicMaterial({color:0xd3faff,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}));
  ring.rotation.x=-Math.PI/2;ring.position.set(-6,.055,-12);scene.add(ring);
  lakeRipples.push({ring,offset:i/3});
}

const proceduralAnglerStart=scene.children.length;
// Human-proportioned fishing character (procedural preview; no third-party assets).
// The angler is seated on the dock. Anatomy and clothing use layered, tapered forms.
const skin=mat(0xc99572,{roughness:.93}),hair=mat(0x24201d),cap=mat(0x334b43),
 jacket=mat(0x4c695e),hood=mat(0x344e48),trim=mat(0xb9a67d),
 pants=mat(0x343e42),shoes=mat(0x282e30);
const avatarX=-8.9, avatarZ=8.0;
const anglerArms=[],anglerLegs=[];
const avatarBody=mesh(new THREE.CylinderGeometry(.39,.34,.88,14),jacket,avatarX,1.75,avatarZ);
avatarBody.scale.z=.7;
mesh(new THREE.CylinderGeometry(.13,.15,.19,12),skin,avatarX,2.30,avatarZ-.025);
const head=mesh(new THREE.SphereGeometry(.32,24,18),skin,avatarX,2.64,avatarZ-.055);
head.scale.set(.85,1.15,.85);
for(const side of [-1,1]){
  const ear=mesh(new THREE.SphereGeometry(.073,12,10),skin,avatarX+side*.28,2.62,avatarZ-.035);
  ear.scale.set(.6,1,.6);
}
mesh(new THREE.SphereGeometry(.317,20,12),hair,avatarX,2.83,avatarZ-.02).scale.set(.86,.49,.85);
mesh(new THREE.CylinderGeometry(.295,.31,.13,20),cap,avatarX,2.95,avatarZ-.055);
mesh(new THREE.BoxGeometry(.43,.04,.25),cap,avatarX,2.89,avatarZ-.32);
const eyeWhite=mat(0xe9e0d2),iris=mat(0x242b2a),cheek=mat(0x9e6a58);
for(const side of [-1,1]){
 const dx=side*.125;
 mesh(new THREE.SphereGeometry(.043,12,8),eyeWhite,avatarX+dx,2.66,avatarZ-.31).scale.set(1,.55,.35);
 mesh(new THREE.SphereGeometry(.024,10,8),iris,avatarX+dx,2.66,avatarZ-.327);
 mesh(new THREE.BoxGeometry(.12,.025,.025),hair,avatarX+dx,2.75,avatarZ-.309);
}
mesh(new THREE.SphereGeometry(.055,12,8),skin,avatarX,2.55,avatarZ-.325).scale.set(.7,1,.8);
mesh(new THREE.BoxGeometry(.105,.014,.02),cheek,avatarX,2.43,avatarZ-.312);
// Fishing vest, center zipper, shoulder straps and utility pockets.
const vest=mat(0x3e574f),vestPocket=mat(0x293f39),zipper=mat(0xc4c4ad,{metalness:.35}),strap=mat(0x9a8664);
mesh(new THREE.CylinderGeometry(.405,.35,.68,14),vest,avatarX,1.78,avatarZ-.005).scale.z=.74;
mesh(new THREE.BoxGeometry(.025,.61,.025),zipper,avatarX,1.78,avatarZ-.307);
for(const side of [-1,1]){
 const pocket=mesh(new THREE.BoxGeometry(.22,.20,.07),vestPocket,avatarX+side*.19,1.58,avatarZ-.305);
 pocket.rotation.z=side*.08;
 mesh(new THREE.BoxGeometry(.2,.025,.075),strap,avatarX+side*.19,1.67,avatarZ-.31);
 const shoulder=mesh(new THREE.BoxGeometry(.12,.51,.045),strap,avatarX+side*.29,2.02,avatarZ-.265);
 shoulder.rotation.z=side*.18;
 // Bent sleeves, forearms and hands are independently animatable.
 const arm=mesh(new THREE.CapsuleGeometry(.135,.37,6,10),jacket,avatarX+side*.48,1.79,avatarZ-.12);
 arm.rotation.x=-.58;arm.rotation.z=side*.3;anglerArms.push(arm);
 const forearm=mesh(new THREE.CapsuleGeometry(.105,.28,5,10),jacket,avatarX+side*.52,1.43,avatarZ-.39);
 forearm.rotation.x=-.85;
 const glove=mesh(new THREE.SphereGeometry(.115,12,10),skin,avatarX+side*.5,1.30,avatarZ-.58);
 glove.scale.set(.8,.72,1.25);
 // Seated thigh and shin are visibly separated instead of one chibi capsule.
 const thigh=mesh(new THREE.CapsuleGeometry(.19,.55,6,12),pants,avatarX+side*.23,1.05,avatarZ-.36);
 thigh.rotation.x=-1.25;anglerLegs.push(thigh);
 const shin=mesh(new THREE.CapsuleGeometry(.155,.48,6,12),pants,avatarX+side*.23,.63,avatarZ-.85);
 shin.rotation.x=-.15;
 const boot=mesh(new THREE.BoxGeometry(.36,.23,.67),shoes,avatarX+side*.23,.23,avatarZ-1.19);
 boot.rotation.y=side*.09;
 mesh(new THREE.BoxGeometry(.37,.055,.7),mat(0x1c2021),avatarX+side*.23,.105,avatarZ-1.19);
}
// Belt pouch behind the right hip, deliberately small to keep silhouette realistic.
const bag=mesh(new THREE.BoxGeometry(.33,.28,.21),vestPocket,avatarX+.4,1.34,avatarZ+.23);
bag.rotation.z=-.1;
// Optional Blender-exported character. The procedural avatar remains fully playable
// until the local GLB loads successfully. No external service or paid asset required.
const proceduralAnglerMeshes=scene.children.slice(proceduralAnglerStart);
let riggedAngler=null,riggedMixer=null,riggedAction=null;
const riggedClips=new Map();
let riggedClipName='';
const riggedLoader=new GLTFLoader();
riggedLoader.load('./assets/characters/CUNCUN_Angler_Rig.glb',gltf=>{
  if(!gltf.scene||!gltf.scene.children.length) return;
  const bounds=new THREE.Box3().setFromObject(gltf.scene);
  const height=bounds.getSize(new THREE.Vector3()).y;
  if(!Number.isFinite(height)||height<.1) return;
  riggedAngler=gltf.scene;
  riggedAngler.scale.setScalar(2.85/height);
  riggedAngler.position.set(avatarX,.12,avatarZ);
  riggedAngler.rotation.y=0;
  riggedAngler.traverse(obj=>{if(obj.isMesh){obj.frustumCulled=false;obj.castShadow=false;}});
  scene.add(riggedAngler);
  riggedMixer=new THREE.AnimationMixer(riggedAngler);
  for(const clip of gltf.animations||[])riggedClips.set(clip.name.toLowerCase(),riggedMixer.clipAction(clip));
  proceduralAnglerMeshes.forEach(obj=>obj.visible=false);
  console.info('CUNCUN rigged angler loaded with clips:',[...riggedClips.keys()]);
},undefined,()=>{
  // Expected on early staging builds: the optional GLB is not exported yet.
  console.info('CUNCUN rigged GLB not installed; using procedural angler.');
});
function playRiggedClip(name){
  if(!riggedMixer)return;
  const key=name.toLowerCase();
  if(riggedClipName===key)return;
  const next=riggedClips.get(key)||riggedClips.get('idle');
  if(!next)return;
  next.reset().fadeIn(.18).play();
  if(riggedAction&&riggedAction!==next)riggedAction.fadeOut(.18);
  riggedAction=next;riggedClipName=key;
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
// Five human-proportioned neighboring anglers; decorative only, not live users.
// Shared geometries/materials and small silhouettes keep mobile rendering affordable.
const visitorAnglers=[];
const visitorColors=[0x576a59,0x4b677b,0x806a4b,0x746575,0x4d786d];
const visitorSkin=mat(0xc79b7a),visitorPants=mat(0x343c3e),visitorHair=mat(0x2e2a25);
const visitorHeadGeo=new THREE.SphereGeometry(.24,12,10);
const visitorLimbGeo=new THREE.CapsuleGeometry(.095,.32,4,8);
const visitorLegGeo=new THREE.CapsuleGeometry(.13,.48,4,8);
const visitorBootGeo=new THREE.BoxGeometry(.27,.17,.43);
function visitorPart(group,geo,material,x,y,z){
 const obj=new THREE.Mesh(geo,material);obj.position.set(x,y,z);group.add(obj);return obj;
}
for(let i=0;i<5;i++){
 const x=-21+i*8,z=-7-(i%2)*10;
 const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
 const jacketMat=mat(visitorColors[i]),hatMat=mat([0x394d63,0x334b79,0x6a4c3c,0x4b395c,0x2c5d53][i]);
 const torso=visitorPart(group,new THREE.CylinderGeometry(.29,.25,.7,10),jacketMat,0,1.45,0);
 torso.scale.z=.8;
 visitorPart(group,new THREE.CylinderGeometry(.1,.1,.15,8),visitorSkin,0,1.88,-.02);
 const face=visitorPart(group,visitorHeadGeo,visitorSkin,0,2.1,-.03);
 face.scale.set(.85,1.12,.9);
 const hairMesh=visitorPart(group,visitorHeadGeo,visitorHair,0,2.24,.005);
 hairMesh.scale.set(.9,.45,.95);
 visitorPart(group,new THREE.CylinderGeometry(.24,.24,.10,12),hatMat,0,2.34,-.03);
 visitorPart(group,new THREE.BoxGeometry(.35,.035,.17),hatMat,0,2.29,-.26);
 for(const side of [-1,1]){
   visitorPart(group,new THREE.SphereGeometry(.022,8,6),visitorHair,side*.095,2.11,-.255);
   const arm=visitorPart(group,visitorLimbGeo,jacketMat,side*.37,1.43,-.18);
   arm.rotation.x=-.75;arm.rotation.z=side*.24;
   visitorPart(group,new THREE.SphereGeometry(.075,8,6),visitorSkin,side*.39,1.09,-.48);
   const thigh=visitorPart(group,visitorLegGeo,visitorPants,side*.17,.73,-.25);
   thigh.rotation.x=-.85;
   visitorPart(group,visitorBootGeo,hatMat,side*.17,.16,-.57);
 }
 visitorPart(group,new THREE.BoxGeometry(.2,.16,.06),hatMat,0,1.36,-.24);
 const rod=visitorPart(group,new THREE.CylinderGeometry(.01,.032,3.7,6),mat(0x26323b),.35,2.12,-1.52);
 rod.rotation.x=-.95;
 visitorAnglers.push({group,torso,rod,offset:i*1.7});
}
// Decorative festival area: local 3D scenery, not a LIVE or gift integration.
const stageBase=mesh(new THREE.BoxGeometry(9,.7,5),mat(0x29394f),18,.45,-10);
mesh(new THREE.BoxGeometry(9.5,.35,1),mat(0x7441a5),18,3.6,-12.5);
for(const x of [14,22]){
  mesh(new THREE.CylinderGeometry(.18,.18,4.1,8),mat(0x273e57),x,2,-12.3);
  mesh(new THREE.SphereGeometry(.48,10,8),new THREE.MeshStandardMaterial({color:0x75e5fa,emissive:0x1592c1,emissiveIntensity:.7}),x,4,-12.3);
}
const stageScreen=mesh(new THREE.BoxGeometry(4.5,2.2,.22),new THREE.MeshStandardMaterial({color:0x502b81,emissive:0x6a2a9b,emissiveIntensity:.4}),18,2.35,-12.4);
const dancers=[];
for(let i=0;i<2;i++){
  const dancer=new THREE.Group();dancer.position.set(16.6+i*2.8,1,-10);scene.add(dancer);
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.35,.9,4,8),mat(i?0xf2ba49:0xec5ca7));torso.position.y=1.15;dancer.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.33,10,8),skin);head.position.y=2.05;dancer.add(head);
  dancers.push({dancer,offset:i*Math.PI});
}
// Small VIP dock and boat; visual landmarks only, no paid access.
mesh(new THREE.BoxGeometry(7,.35,8),mat(0x9b754f),21,.24,8);
for(const x of [17.8,24.2])for(const z of [4.7,11.2]){
  mesh(new THREE.CylinderGeometry(.12,.14,2.2,7),mat(0xcaa46d),x,1.3,z);
  mesh(new THREE.SphereGeometry(.28,8,6),lanternMat,x,2.5,z);
}
const boat=new THREE.Group();boat.position.set(9,.15,-18);scene.add(boat);
const hull=new THREE.Mesh(new THREE.BoxGeometry(4,.65,1.8),mat(0xede7d7));hull.position.y=.22;boat.add(hull);
const bow=new THREE.Mesh(new THREE.ConeGeometry(.95,1.4,4),mat(0xede7d7));bow.rotation.z=-Math.PI/2;bow.position.set(2.5,.22,0);boat.add(bow);
const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.65,1.2,1.5),mat(0x65c6dc));cabin.position.set(-.5,1.08,0);boat.add(cabin);
const roof=new THREE.Mesh(new THREE.BoxGeometry(2,.2,1.85),mat(0xf9d77b));roof.position.set(-.5,1.77,0);boat.add(roof);
// Animated shoal: lightweight local fish models, purely visual.
// Decorative distant waterfalls, with no physics or network dependencies.
const waterfalls=[];
for(let i=0;i<3;i++){
  const x=-17+i*17,z=-66-i%2*4;
  const fall=mesh(new THREE.PlaneGeometry(2.5+i*.5,10+i%2*3),new THREE.MeshBasicMaterial({color:0x9de6f2,transparent:true,opacity:.68,side:THREE.DoubleSide}),x,5,z);
  fall.rotation.y=.14+i*.2;
  const foam=mesh(new THREE.CircleGeometry(2+i*.25,16),new THREE.MeshBasicMaterial({color:0xe3faff,transparent:true,opacity:.65,side:THREE.DoubleSide}),x,.13,z+1);
  foam.rotation.x=-Math.PI/2;
  waterfalls.push({fall,foam,phase:i*1.9});
}
// Gentle moving light reflections on the lake surface.
const waterGlints=[];
for(let i=0;i<18;i++){
  const glint=mesh(new THREE.PlaneGeometry(.5+(i%4)*.25,.045),new THREE.MeshBasicMaterial({color:0xdafaff,transparent:true,opacity:.25,depthWrite:false,side:THREE.DoubleSide}),-21+(i%6)*8,.045,-9-Math.floor(i/6)*19);
  glint.rotation.x=-Math.PI/2;waterGlints.push({glint,phase:i*1.4});
}
const shoal=[];
for(let i=0;i<14;i++){
  const swimmer=new THREE.Group();
  const tint=[0xe5bd67,0x8fc7be,0xc8a7e2,0xe58f72][i%4];
  const body=new THREE.Mesh(new THREE.SphereGeometry(.28,8,6),mat(tint));
  body.scale.set(1.8,.65,.8);swimmer.add(body);
  const tail=new THREE.Mesh(new THREE.ConeGeometry(.22,.5,3),mat(tint));
  tail.rotation.z=Math.PI/2;tail.position.x=-.6;swimmer.add(tail);
  swimmer.position.set(-16+(i%7)*5,-.12,-18-Math.floor(i/7)*15);
  scene.add(swimmer);shoal.push({swimmer,tail,baseX:swimmer.position.x,baseZ:swimmer.position.z,phase:i*1.7});
}
// Animate the local angler only: a subtle breathing pose and reactive arm movement.
const rodPoints=[new THREE.Vector3(-8.75,2.04,7.5),new THREE.Vector3(-8.2,2.39,4.55),new THREE.Vector3(-2.7,.09,-8)];
const rodCurve=new THREE.CatmullRomCurve3(rodPoints),rod=mesh(new THREE.TubeGeometry(rodCurve,20,.065,7,false),mat(0x303b41));
const lineMaterial=new THREE.LineBasicMaterial({color:0xf6f5d9});let line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([rodPoints[2],new THREE.Vector3(-2.7,.1,-8)]),lineMaterial);scene.add(line);
const lineCoords=new Float32Array(6);line.geometry.dispose();line.geometry=new THREE.BufferGeometry();line.geometry.setAttribute('position',new THREE.BufferAttribute(lineCoords,3));
const bob=mesh(new THREE.SphereGeometry(.18,14,12),mat(0xf2f5ec),-2.7,.24,-8);
const bobTop=mesh(new THREE.CylinderGeometry(.035,.06,.52,10),mat(0xe9413c),-2.7,.55,-8);
const floatBands=[];
for(let i=0;i<7;i++){
 const band=mesh(new THREE.CylinderGeometry(.037,.037,.075,10),mat(i%2===0?0xf34b35:0xf4e54e),-2.7,.39+i*.075,-8);
 floatBands.push(band);
}
const droplets=[];
const dropletMaterial=new THREE.MeshBasicMaterial({color:0xd5f5ff,transparent:true,opacity:.8});
for(let i=0;i<12;i++){
  const drop=mesh(new THREE.SphereGeometry(.065,6,4),dropletMaterial.clone(),-2.7,-3,-8);
  drop.visible=false;droplets.push({drop,phase:i*.83});
}
// A celebratory catch ring, shown briefly after landing a fish.
const catchGlow=new THREE.Mesh(new THREE.TorusGeometry(.8,.09,8,32),new THREE.MeshBasicMaterial({color:0xffd86c,transparent:true,opacity:.9}));
catchGlow.rotation.x=-Math.PI/2;catchGlow.position.set(-2.7,.4,-8);catchGlow.visible=false;scene.add(catchGlow);
let catchGlowUntil=0;
const catchBanner=$('catch-banner');
let catchBannerUntil=0;
function showCatchBanner(name,kg,xp,now){
  if(!catchBanner)return;
  catchBanner.replaceChildren();
  const heading=document.createElement('div');heading.textContent='🎉 CÂU THÀNH CÔNG!';
  const detail=document.createElement('small');detail.textContent=name+' · '+kg+' kg · +'+xp+' EXP tập';
  catchBanner.append(heading,detail);catchBanner.hidden=false;catchBannerUntil=now+2600;
}

const rippleMat=new THREE.MeshBasicMaterial({color:0xd5f6ff,transparent:true,opacity:.35,side:THREE.DoubleSide});
// A pulsing bite marker makes the short hook window visible on mobile.
const biteMarker=new THREE.Group();biteMarker.position.set(-2.7,1.3,-8);scene.add(biteMarker);
const markerRing=new THREE.Mesh(new THREE.TorusGeometry(.38,.055,6,24),new THREE.MeshBasicMaterial({color:0xffe27d}));biteMarker.add(markerRing);
const markerCore=new THREE.Mesh(new THREE.SphereGeometry(.12,8,8),new THREE.MeshBasicMaterial({color:0xff6b42}));biteMarker.add(markerCore);
biteMarker.visible=false;
const ripples=[];for(let i=0;i<3;i++){const r=mesh(new THREE.RingGeometry(.4,.46,40),rippleMat.clone(),-2.7,.06,-8);r.rotation.x=-Math.PI/2;ripples.push(r)}
let phase='idle',biteAt=0,biteUntil=0,progress=0,tension=0,last=performance.now(),fishKg=0,fishName='',reeling=false,fishBurst=0,fishDirection=1;
const cameraButton=$('camera'),soundButton=$('sound');let cameraMode='eyes',audioContext=null,soundOn=false,lastAlert=0;
function beep(freq=540,duration=.13){if(!soundOn||!audioContext)return;try{const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.065,audioContext.currentTime+.012);gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+duration);osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration+.02)}catch{}}
const cameraModes=['behind','float','eyes','aerial'];const cameraLabels={behind:'Sau lưng',float:'Nhìn phao',eyes:'Từ mắt',aerial:'Trên cao'};cameraButton.textContent='📷 '+cameraLabels[cameraMode];cameraButton.addEventListener('click',()=>{cameraMode=cameraModes[(cameraModes.indexOf(cameraMode)+1)%cameraModes.length];cameraButton.textContent='📷 '+cameraLabels[cameraMode]});
soundButton.addEventListener('click',async()=>{if(!soundOn){const AudioCtor=window.AudioContext||window.webkitAudioContext;if(!AudioCtor){tell('Thiết bị chưa hỗ trợ âm thanh.');return}audioContext ||=new AudioCtor();try{await audioContext.resume()}catch{return}soundOn=true;beep(650)}else soundOn=false;soundButton.textContent=soundOn?'🔊 Âm thanh: Bật':'🔇 Âm thanh: Tắt'});
let practiceProgress=initialProgress();
function showPracticeProgress(){const p=practiceProgress;document.getElementById('practice-level').textContent='Cấp '+p.level+' · '+p.xp+'/'+xpNeeded(p.level)+' EXP · '+p.catches+' cá';document.getElementById('practice-xp').style.width=(xpNeeded(p.level)?100*p.xp/xpNeeded(p.level):100)+'%'}
const fishes=['cá rô phi','cá chép','cá trắm','cá trôi','cá lóc'];
function tell(s){status.textContent=s}
function hideCatchCelebration(){catchGlowUntil=0;catchBannerUntil=0;catchGlow.visible=false;if(catchBanner)catchBanner.hidden=true}
function buttons(){cast.disabled=phase!=='idle'&&phase!=='done';hook.disabled=phase!=='bite';reel.disabled=phase!=='fight'}
function start(){if(phase!=='idle'&&phase!=='done')return;hideCatchCelebration();phase='waiting';const now=performance.now();biteAt=now+2200+Math.random()*4000;progress=0;tension=0;fishBurst=0;fishDirection=1;reeling=false;fishKg=+(0.4+Math.random()*5.6).toFixed(1);fishName=fishes[Math.floor(Math.random()*fishes.length)];tell('Đã thả câu. Nhìn phao giữa hồ nhé!');buttons()}
function clear(){hideCatchCelebration();phase='idle';biteAt=0;biteUntil=0;progress=0;tension=0;fishBurst=0;reeling=false;tell('Sẵn sàng tập câu.');buttons()}
function strike(){if(phase!=='bite')return;phase='fight';progress=0;tension=15;fishBurst=0;tell('Dính cá! Giữ Kéo cá, thả nút nếu dây quá căng.');beep(620,.16);buttons()}
cast.addEventListener('click',start);reset.addEventListener('click',clear);hook.addEventListener('click',strike);
reel.addEventListener('pointerdown',e=>{if(phase!=='fight')return;e.preventDefault();reeling=true;reel.setPointerCapture(e.pointerId)});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])reel.addEventListener(ev,()=>reeling=false);
// Desktop accessibility: keyboard controls mirror the on-screen actions.
const isTypingTarget=element=>element?.matches?.('input,textarea,select,[contenteditable="true"]');
document.addEventListener('keydown',event=>{
  if(event.repeat||isTypingTarget(event.target)||event.altKey||event.ctrlKey||event.metaKey)return;
  const key=event.key.toLowerCase();
  if(key==='c'&&!cast.disabled){event.preventDefault();start()}
  else if(key==='h'&&!hook.disabled){event.preventDefault();strike()}
  else if(key==='r'&&!reset.disabled){event.preventDefault();clear()}
  else if(event.code==='Space'&&!reel.disabled){event.preventDefault();reeling=true}
});
document.addEventListener('keyup',event=>{if(event.code==='Space')reeling=false});
window.addEventListener('blur',()=>reeling=false);canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();reeling=false;tell('Đồ họa 3D bị gián đoạn. Hãy tải lại trang để tiếp tục.');document.getElementById('render-error').hidden=false},{passive:false});document.addEventListener('visibilitychange',()=>{
  if(!document.hidden)return;
  reeling=false;
  // Browser background throttling can skip the bite window or create an unfair
  // line-tension jump. Safely end the active attempt when leaving the page.
  if(phase==='waiting'||phase==='bite'||phase==='fight'){
    clear();
    tell('Đã tạm dừng vì rời màn hình. Bấm Thả câu để chơi lại.');
  }
});
const fishModel=new THREE.Group();const body=new THREE.Mesh(new THREE.SphereGeometry(.65,14,10),mat(0xe1b85a));body.scale.set(1.7,.8,.65);fishModel.add(body);const tail=new THREE.Mesh(new THREE.ConeGeometry(.45,.9,3),mat(0xbd8439));tail.rotation.z=Math.PI/2;tail.position.x=-1.1;fishModel.add(tail);const fin=new THREE.Mesh(new THREE.ConeGeometry(.32,.65,3),mat(0xc38c3d));fin.position.set(0,.55,0);fishModel.add(fin);fishModel.position.set(-2.7,-.45,-8);scene.add(fishModel);
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;
if(!document.hidden)animateLake(now*.001);
if(riggedMixer){
  const clip=phase==='fight'?'Reel':phase==='bite'?'Cast':'Sit';
  playRiggedClip(clip);
  riggedMixer.update(dt);
  if(riggedAngler)riggedAngler.visible=cameraMode!=='eyes';
}

if(document.hidden&&(phase==='waiting'||phase==='bite'||phase==='fight')){clear();tell('Đã tạm dừng vì rời màn hình. Bấm Thả câu để chơi lại.')}
if(phase==='waiting'&&now>=biteAt){phase='bite';biteUntil=now+1600;tell('⚡ PHAO CHÌM! Bấm Giật cần!');beep(820,.2);buttons()}
if(phase==='bite'&&now>biteUntil){phase='idle';reeling=false;tell('Cá đã nhả mồi. Thả lại nhé!');buttons()}
if(phase==='fight'){fishBurst+=dt;const surge=Math.sin(now*.0032+fishKg)*Math.sin(now*.0017)*fishKg*.7;tension=Math.max(0,Math.min(100,tension+(reeling?(31+fishKg*2.4+Math.max(0,surge)*3):-(30+fishKg))*dt));if(reeling)progress+=dt*Math.max(4,15-fishKg*.9);
if(tension>=100){phase='done';reeling=false;tension=100;tell('💥 Đứt dây! Cá chạy mất rồi.');beep(220,.32);buttons()}
else if(progress>=100){phase='done';reeling=false;const result=awardCatch(practiceProgress,fishKg);practiceProgress=result.profile;showPracticeProgress();catchGlowUntil=now+1600;showCatchBanner(fishName,fishKg,result.xpGained,now);tell('🎉 Tập thành công: '+fishName+' '+fishKg+' kg · +'+result.xpGained+' EXP luyện tập (không lưu).');beep(940,.3);buttons()}}
visitorAnglers.forEach(({group,torso,rod,offset})=>{torso.rotation.z=Math.sin(now*.0013+offset)*.012;group.rotation.y=Math.sin(now*.0005+offset)*.045;rod.rotation.x=-.95+Math.sin(now*.0011+offset)*.025});
dancers.forEach(({dancer,offset})=>{dancer.position.y=1+Math.abs(Math.sin(now*.002+offset))*.18;dancer.rotation.y=Math.sin(now*.0014+offset)*.3});
stageScreen.material.emissiveIntensity=.3+Math.sin(now*.002)*.16;
boat.position.y=.15+Math.sin(now*.0018)*.07;boat.rotation.z=Math.sin(now*.0013)*.018;
waterGlints.forEach(({glint,phase})=>{glint.material.opacity=.12+Math.max(0,Math.sin(now*.0017+phase))*.3;glint.position.x+=Math.sin(now*.0008+phase)*.0006});
waterfalls.forEach(({fall,foam,phase})=>{fall.material.opacity=.55+Math.sin(now*.003+phase)*.12;foam.scale.setScalar(1+Math.sin(now*.002+phase)*.08)});
shoal.forEach(({swimmer,tail,baseX,baseZ,phase})=>{const t=now*.00055+phase;swimmer.position.x=baseX+Math.sin(t)*2.4;swimmer.position.z=baseZ+Math.cos(t*.8)*1.8;swimmer.rotation.y=Math.cos(t)*.8;tail.rotation.y=Math.sin(now*.009+phase)*.65});
biteMarker.visible=phase==='bite';
if(biteMarker.visible){biteMarker.position.y=1.3+Math.sin(now*.014)*.22;biteMarker.scale.setScalar(1+Math.sin(now*.02)*.18)}
// Lift both arms towards the rod handle while striking and fighting.
const holdingRod=phase==='fight';
// Keep the human-sized seated rig anchored to its own shoulders and hips.
anglerArms.forEach((arm,i)=>{
 const side=i===0?-1:1;
 const target=holdingRod?-.9:phase==='bite'?-.7:-.58;
 arm.rotation.x+=(target-arm.rotation.x)*Math.min(1,dt*8);
 arm.rotation.z=side*(holdingRod?.2:.3);
 arm.position.set(avatarX+side*.48,1.79+(holdingRod?.055:0),avatarZ-.12-(holdingRod?.09:0));
});
anglerLegs.forEach((leg,i)=>{leg.rotation.x=-1.25+Math.sin(now*.0015+i)*.012});
if(catchBanner&&!catchBanner.hidden&&now>=catchBannerUntil)catchBanner.hidden=true;
catchGlow.visible=now<catchGlowUntil;
if(catchGlow.visible){const t=1-(catchGlowUntil-now)/1600;catchGlow.scale.setScalar(.7+t*2);catchGlow.material.opacity=Math.max(0,1-t)}
const active=phase==='waiting'||phase==='bite'||phase==='fight';
const targetPos=cameraMode==='float'?new THREE.Vector3(-1.4,2.4,-3):cameraMode==='eyes'?new THREE.Vector3(-8.9,2.94,7.15):cameraMode==='aerial'?new THREE.Vector3(-5,28,15):new THREE.Vector3(-6.8,5.2,16.8);
const lookAt=cameraMode==='float'?new THREE.Vector3(-2.7,.22,-8):cameraMode==='eyes'?new THREE.Vector3(-8.9,1.65,-12):cameraMode==='aerial'?new THREE.Vector3(-4,0,-8):new THREE.Vector3(-5,1.1,-3);
camera.position.lerp(targetPos,Math.min(1,dt*2.4));camera.lookAt(lookAt);
eyeRig.visible=cameraMode==='eyes';
// Raise only the rod when striking; keep the seat, bait tray and V support fixed.
const eyeFight=phase==='fight'?Math.min(1,(20+tension)/65):phase==='bite'?.12:0;
firstPersonRod.rotation.x=eyeFight*.36;
firstPersonRod.rotation.z=Math.sin(now*.009)*eyeFight*.055;
eyeRig.rotation.x=0;eyeRig.rotation.z=0;
// The right hand is parented to the rod; the left stays at the bait tray.
rightHandGroup.rotation.x=0;
rod.visible=cameraMode!=='eyes';
line.visible=cameraMode!=='eyes';
head.visible=cameraMode!=='eyes';
const desiredFov=cameraMode==='eyes'?70:52;
if(Math.abs(camera.fov-desiredFov)>.01){camera.fov=desiredFov;camera.updateProjectionMatrix()}
bob.visible=bobTop.visible=active;line.visible=active;fishModel.visible=phase==='fight';
// Seven-band float: distinct nibble, sinking bite and fight motions.
const bitePulse=phase==='bite'?Math.max(0,Math.sin(now*.018))*.18:0;
const dip=phase==='bite'?.26+bitePulse:phase==='fight'?.12:0;
const wave=Math.sin(now*.005)*.055;
bob.position.y=.24+wave-dip;bobTop.position.y=.55+wave-dip;
floatBands.forEach((band,i)=>{band.position.y=.39+i*.075+wave-dip;band.visible=active});
const fishFight=phase==='fight'?Math.sin(now*.008+fishKg)*(.6+fishKg*.15):0;
const approach=phase==='fight'?Math.min(1,progress/100):0;
fishModel.position.set(-2.7+fishFight,-.45+approach*.9,-8+Math.sin(now*.006)*.6+approach*2);fishModel.rotation.y=Math.sin(now*.008)*.7;fishModel.rotation.z=Math.sin(now*.018)*.18;tail.rotation.y=Math.sin(now*.025)*.7;
// Splash particles are pooled and reused to avoid allocations each frame.
const splash=phase==='fight'&&tension>55;
droplets.forEach(({drop,phase:offset})=>{
  drop.visible=splash;
  if(!splash)return;
  const t=(now*.0027+offset)%1;
  const angle=offset*2.399;
  drop.position.set(fishModel.position.x+Math.cos(angle)*t*.95,.08+Math.sin(t*Math.PI)*(.5+fishKg*.05),fishModel.position.z+Math.sin(angle)*t*.95);
  drop.material.opacity=.8*(1-t);
});
if(splash&&now-lastAlert>1200){lastAlert=now;if(tension>82)tell('⚠️ Dây quá căng! Thả nút kéo cá một chút.')} 
const fighting=phase==='fight';
const lift=fighting?Math.min(1,(15+tension)/55):0;
const bent=fighting?(tension/100)*1.2:0;
if(rod.userData.lastBend===undefined||Math.abs(rod.userData.lastBend-bent)>.035||Math.abs((rod.userData.lastLift||0)-lift)>.035){
 rod.geometry.dispose();
 const middle=new THREE.Vector3(-8.2,2.39+lift*.45,4.55);
 const tipShape=new THREE.Vector3(-2.7-bent,.09+lift*2.4+bent*.3,-8);
 rod.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([rodPoints[0],middle,tipShape]),20,.065,7,false);
 rod.userData.lastBend=bent;rod.userData.lastLift=lift;
}
const tip=new THREE.Vector3(-2.7-bent,.09+lift*2.4+bent*.3,-8);
lineCoords.set([tip.x,tip.y,tip.z,bob.position.x,bob.position.y,bob.position.z]);line.geometry.attributes.position.needsUpdate=true;
ripples.forEach((r,i)=>{r.visible=active;r.position.x=phase==='fight'?fishModel.position.x:bob.position.x;r.position.z=phase==='fight'?fishModel.position.z:bob.position.z;const scale=.8+((now*(splash?.0014:.0006)+i/3)%1.7);r.scale.setScalar(scale);r.material.opacity=(splash?.6:.25)*(1-(scale-.8)/1.7)});
lakeRipples.forEach(({ring,offset})=>{const cycle=(now*.00032+offset)%1;ring.visible=active;ring.position.x=bob.position.x;ring.position.z=bob.position.z;ring.scale.setScalar(.65+cycle*3.1);ring.material.opacity=(1-cycle)*(phase==='bite'?.48:phase==='fight'?.34:.2);});
// Water is a ShaderMaterial; its animated color is driven by shader uniforms.
meter.style.width=tension+'%';meter.style.background=tension>75?'#ef6258':'#eab65c';
document.getElementById('tension-value').textContent=Math.round(tension)+'%';
document.getElementById('catch-progress').style.width=Math.min(100,progress)+'%';
document.getElementById('catch-progress-value').textContent=Math.round(Math.min(100,progress))+'%';
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
