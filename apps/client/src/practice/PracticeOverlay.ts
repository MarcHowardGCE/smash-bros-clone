import{Graphics,type Container}from'pixi.js';import type{StateSnapshot}from'@smash/shared';import{collisionShapes}from'./collisionModel.js';
export class PracticeOverlay {
 private graphic=new Graphics();private snapshot:StateSnapshot|null=null;enabled=false;
 constructor(private layer:Container){this.graphic.eventMode='none';layer.addChild(this.graphic);}
 setEnabled(enabled:boolean):void{this.enabled=enabled;this.draw();}
 update(snapshot:StateSnapshot):void{this.snapshot=snapshot;this.draw();}
 private draw():void{this.graphic.clear();this.graphic.visible=this.enabled;if(!this.enabled||!this.snapshot)return;
 const colors={body:0x53e0b5,immune:0xd694ff,shield:0x58b9ff,hit:0xff5678,contact:0xffc05a,platform:0xffe5a0};
 for(const s of collisionShapes(this.snapshot)){if(s.width!==undefined)this.graphic.roundRect(s.x,s.y,s.width,s.height!,s.radius??0);else this.graphic.circle(s.x,s.y,s.radius!);this.graphic.fill({color:colors[s.kind],alpha:s.kind==='platform'?.07:.17}).stroke({color:colors[s.kind],width:2,alpha:1});}
 this.layer.setChildIndex(this.graphic,this.layer.children.length-1);
 }
 destroy():void{this.graphic.destroy();this.snapshot=null;}
}
