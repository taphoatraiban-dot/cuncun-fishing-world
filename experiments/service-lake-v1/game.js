import {sampleFish} from './species.js';
export class FishingGame {
 constructor({rng=Math.random,onEvent=()=>{},beforeCast=()=>true}={}){this.beforeCast=beforeCast;this.mode="realistic";this.attraction=1;this.turnId=0;this.lineFactor=1;this.rng=rng;this.onEvent=onEvent;this.totalScore=0;this.catches=0;this.reset();}
 emit(type,data={}){this.onEvent({type,...data});}
 setState(state){this.state=state;this.elapsed=0;this.emit('state',{state});}
 reset(){this.state='READY';this.elapsed=0;this.time=0;this.tension=.18;this.stamina=1;this.distance=6.5;this.pull=false;this.steer=0;this.overload=0;this.fish=null;this.result=null;this.biteWindow=1.45;this.fightTime=0;}
 cast(){if(!this.beforeCast())return false;if(!['READY','RESULT'].includes(this.state))return false;this.reset();this.turnId++;this.distance=this.castDistance||6.5;this.fish=sampleFish(this.rng,this.baitIds||[]);this.waitTime=(4+this.rng()*7)/this.attraction;this.nibbleTime=.65+this.rng()*.75;this.biteWindow=this.mode==='easy'?3.0:1.35+this.rng()*.4;this.setState('PREPARE');return true;}
 strike(){if(this.state==='BITE'){this.tension=.33;this.setState('HOOKED');this.emit('hook');return true;}if(['WAIT','NIBBLE','CAST','PREPARE'].includes(this.state)){this.finish('early');return false;}return false;}
 setPull(pull,steer=this.steer){this.pull=!!pull;this.steer=Math.max(-1,Math.min(1,steer));}
 finish(reason){this.pull=false;const caught=reason==='caught';if(caught){this.totalScore+=this.fish.score;this.catches++;}this.result={reason,caught,fish:this.fish,totalScore:this.totalScore,catches:this.catches};this.setState('RESULT');this.emit('result',this.result);}
 get fishDirection(){return Math.sin(this.fightTime*1.7+this.fish.weight)*.9;}
 update(dt){if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.1);this.elapsed+=dt;this.time+=dt;
  switch(this.state){
   case 'PREPARE':if(this.elapsed>.65)this.setState('CAST');break;
   case 'CAST':if(this.elapsed>1.1){this.setState('WAIT');this.emit('splash');}break;
   case 'WAIT':if(this.elapsed>=this.waitTime)this.setState('NIBBLE');break;
   case 'NIBBLE':if(this.elapsed>=this.nibbleTime){this.setState('BITE');this.emit('bite');}break;
   case 'BITE':if(this.elapsed>this.biteWindow)this.finish('late');break;
   case 'HOOKED':if(this.elapsed>.65)this.setState('FIGHT');break;
   case 'FIGHT':{
    this.fightTime+=dt;const force=(.8+Math.sqrt(this.fish.weight)*.24)*(this.mode==='easy'?.8:1)*this.lineFactor;const surge=Math.max(0,Math.sin(this.fightTime*2.4+this.fish.weight));const balance=1-Math.abs(this.steer+this.fishDirection)/2;
    this.tension+=dt*(this.pull?(.21*force+surge*.18-balance*.10):(-.42+surge*.12));this.tension=Math.max(.04,Math.min(1.2,this.tension));
    this.stamina=Math.max(0,Math.min(1,this.stamina+dt*(this.pull?-(.13+.07*balance)/force:.009)));
    this.distance=Math.max(2.15,this.distance+dt*(this.pull?-(1.4+balance*.8)*(1-this.stamina*.45)/force:.23*force));
    this.overload=this.tension>.97?this.overload+dt:Math.max(0,this.overload-dt*2);
    if(this.overload>.6){this.finish('broken');break;}
    if(this.fightTime>115||this.distance>14){this.finish('escaped');break;}
    if(this.stamina<.08&&this.distance<2.2){this.pull=false;this.setState('SURFACE');this.emit('splash');}
    break;
   }
   case 'SURFACE':if(this.elapsed>1.1)this.setState('LANDING');break;
   case 'LANDING':if(this.elapsed>2.5){this.setState('CELEBRATE');this.emit('catch');}break;
   case 'CELEBRATE':if(this.elapsed>2.4)this.finish('caught');break;
  }
 }
}
