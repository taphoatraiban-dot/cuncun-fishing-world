export const SPECIES = [
 {id:'carp',name:'Cá chép',min:.4,max:7,points:110,length:.48,color:0xc29b48},
 {id:'grass',name:'Cá trắm',min:.8,max:12,points:130,length:.60,color:0x697a63},
 {id:'tilapia',name:'Cá rô phi',min:.25,max:3,points:85,length:.38,color:0x7b8d91},
 {id:'silver',name:'Cá mè',min:.7,max:10,points:100,length:.55,color:0xa5b9b8},
 {id:'mud',name:'Cá trôi',min:.4,max:6,points:105,length:.48,color:0x84978b}
];
export function sampleFish(rng=Math.random){const s=SPECIES[Math.floor(rng()*SPECIES.length)];const weight=Math.round((s.min+(s.max-s.min)*Math.pow(rng(),1.9))*100)/100;return {...s,weight,size:s.length*Math.cbrt(weight),score:Math.round(weight*s.points)};}
