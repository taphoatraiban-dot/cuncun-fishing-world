import {initialProgress, awardCatch, xpNeeded} from '../../fishing-progression.js';
export const STATIONS = [
 {id:1,name:'Sàn 01 · Bờ hoa',position:[0,.3425,12.68],yaw:0,depth:2.2},
 {id:2,name:'Sàn 02 · Bờ trúc',position:[15.57,.3425,4.238],yaw:1.305,depth:2.7},
 {id:3,name:'Sàn 03 · Đồi xa',position:[12.21,.3425,-8.94],yaw:2.203,depth:3.1},
 {id:4,name:'Sàn 04 · Bóng cây',position:[-9.614,.3425,-10.415],yaw:-2.396,depth:2.5},
 {id:5,name:'Sàn 05 · Chòi gỗ',position:[-16.03,.3425,3.58],yaw:-1.351,depth:2.8}
];
// Other stations use the same 0.53 m rearward seat offset as the original main deck.
for(const s of STATIONS.slice(1)){s.position[0]+=Math.sin(s.yaw)*.53;s.position[2]+=Math.cos(s.yaw)*.53;}
export const DEFAULT_RIG=Object.freeze({rod:6.3,main:.25,leader:.18,float:2.4,sinker:2.1,hook:6});
export function validateRig(rig){
 const errors=[];
 if(![4.5,5.4,6.3].includes(rig.rod))errors.push('Chiều dài cần không hợp lệ.');
 if(![.20,.25,.30].includes(rig.main)||![.14,.18,.22].includes(rig.leader)||rig.leader>=rig.main)errors.push('Dây thẻo phải nhỏ hơn dây trục.');
 if(![1.8,2.4,3].includes(rig.float)||!Number.isFinite(rig.sinker)||rig.sinker<.5||rig.sinker>3||rig.sinker+.12>rig.float+.05)errors.push('Chì quá nặng so với sức nổi phao.');
 if(![4,6,8].includes(rig.hook))errors.push('Cỡ lưỡi không hợp lệ.');
 return errors;
}
export class PracticeSession {
 constructor(){this.profile=initialProgress();this.coins=0;this.claimed=new Set();this.station=STATIONS[0];this.mode='realistic';this.rig={...DEFAULT_RIG};this.mix=null;this.assembled=false;this.measured=null;this.calibrated=false;this.feedUntil=0;this.elapsed=0;}
 setStation(id){const s=STATIONS.find(s=>s.id===Number(id));if(!s)throw Error('Vị trí câu không hợp lệ.');this.station=s;this.measured=null;this.calibrated=false;this.feedUntil=0;}
 assemble(rig){const errors=validateRig(rig);if(errors.length)throw Error(errors.join(' '));this.rig={...rig};this.assembled=true;this.calibrated=false;return true;}
 mixBait(ingredients,water){if(!Array.isArray(ingredients)||ingredients.length<1||ingredients.length>3||ingredients.some(id=>!['cam','ngo','bot-thom','moi-chep','moi-ro-phi','co-non'].includes(id)))throw Error('Chọn nguyên liệu mồi hợp lệ.');if(!Number.isFinite(water)||water<.4||water>.9)throw Error('Tỷ lệ nước nên từ 40% đến 90%.');this.mix={ingredients:[...new Set(ingredients)],water};return this.mix;}
 measure(){if(!this.assembled)throw Error('Lắp bộ đồ câu trước khi đo đáy.');this.measured=this.station.depth;this.calibrated=false;return this.measured;}
 calibrate(depth){if(this.measured===null)throw Error('Đo đáy trước khi chỉnh phao.');if(!Number.isFinite(depth)||Math.abs(depth-this.measured)>.15)throw Error('Độ sâu đặt phao lệch đáy quá 15 cm.');if(validateRig(this.rig).length)throw Error('Bộ đồ chưa tương thích.');this.floatDepth=depth;this.calibrated=true;return true;}
 feed(){if(!this.mix)throw Error('Trộn mồi trước khi xả ổ.');this.feedUntil=this.elapsed+90;}
 get fed(){return this.elapsed<this.feedUntil;}
 get canCast(){return this.assembled&&!!this.mix&&this.calibrated;}
 quickPrepare(){this.assemble(DEFAULT_RIG);this.mixBait(['cam','bot-thom'],.65);this.measure();this.calibrate(this.station.depth);this.feed();}
 collect(result,turnId){if(!result?.caught||!Number.isSafeInteger(turnId)||turnId<1||this.claimed.has(turnId))return null;const next=awardCatch(this.profile,result.fish.weight);this.profile=next.profile;this.claimed.add(turnId);const coins=Math.max(1,Math.round(result.fish.weight*7));this.coins+=coins;return {xp:next.xpGained,coins};}
 get summary(){return `Cấp ${this.profile.level} · ${this.profile.xp}/${xpNeeded(this.profile.level)} EXP · ${this.coins} xu tập`;}
}
