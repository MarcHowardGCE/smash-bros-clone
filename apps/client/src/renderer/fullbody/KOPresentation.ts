import{Sprite,type Container}from'pixi.js';import type{CharacterId,PlayerState}from'@smash/shared';import type{FullBodyPilotAssets}from'./FullBodyPilot.js';
type Ghost={sprite:Sprite;start:number;cue:NonNullable<PlayerState['koVisual']>;character:CharacterId;clip:'ko_launch'|'ko_screen'|'ko_star'};
/** Cosmetic copies only: stock loss and respawn remain immediate server decisions. */
export class KOPresentation{
 private seen=new Map<string,number>();private ghosts=new Map<string,Ghost>();
 constructor(private parent:Container,private assets:FullBodyPilotAssets|undefined,private newcomerAssets?:FullBodyPilotAssets){}
 setNewcomerAssets(assets?:FullBodyPilotAssets):void{this.newcomerAssets=assets;}
 private clips(character:CharacterId){return this.newcomerAssets?.characters[character]??this.assets?.characters[character];}
 update(players:Iterable<{id:string;characterId?:CharacterId;koVisual?:PlayerState['koVisual']}>,now=performance.now()):void{for(const p of players){const cue=p.koVisual;if(!cue||this.seen.get(p.id)===cue.id)continue;this.seen.set(p.id,cue.id);const character=p.characterId??'all-rounder',clip=cue.kind==='star'?'ko_star':cue.kind==='screen'?'ko_screen':'ko_launch';if(!this.clips(character)?.[clip])continue;this.ghosts.get(p.id)?.sprite.destroy();const sprite=new Sprite();sprite.label=clip;this.parent.addChild(sprite);this.ghosts.set(p.id,{sprite,start:now,cue,character,clip});}this.tick(now);}
 tick(now=performance.now()):void{for(const[id,g]of this.ghosts){const c=this.clips(g.character)?.[g.clip],t=Math.max(0,(now-g.start)*.06),duration=g.clip==='ko_launch'?24:16;if(!c||t>=duration){g.sprite.destroy();this.ghosts.delete(id);continue;}const f=c.frames[Math.min(c.frames.length-1,Math.floor(t/4))]!;const progress=t/duration,zoom=g.clip==='ko_screen'?1+progress*1.8:g.clip==='ko_star'?1-progress*.85:1;g.sprite.texture=f.texture;g.sprite.pivot.set(f.root[0],f.root[1]);g.sprite.scale.set(c.scale*zoom*g.cue.facing*(c.mirrorSource?-1:1)*(f.mirrorSource?-1:1),c.scale*zoom);g.sprite.position.set(g.cue.x+(g.clip==='ko_star'?90*progress:g.clip==='ko_launch'?g.cue.facing*50*progress:0),g.cue.y+f.offsetY-(g.clip==='ko_star'?70*progress:0));g.sprite.alpha=1-progress*.85;}}
 getDiagnostics(){return[...this.ghosts.values()].map(g=>({clip:g.clip,kind:g.cue.kind,visible:g.sprite.visible,frameRect:[g.sprite.texture.frame.x,g.sprite.texture.frame.y].join(',')}));}
 clear():void{for(const g of this.ghosts.values())g.sprite.destroy();this.ghosts.clear();this.seen.clear();}
}
