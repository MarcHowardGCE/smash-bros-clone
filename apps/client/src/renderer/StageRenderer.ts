/** Stage artwork is registered to the same geometry used by authoritative collision. */
import {Assets,Container,Graphics,Sprite,type Texture} from 'pixi.js';
import {getStageLayout,type StageLayout} from '@smash/shared';

export class StageRenderer {
  private container:Container;
  private disposed=false;
  private stage:StageLayout;
  constructor(parentContainer:Container,stageId:string='stage1'){
    this.stage=getStageLayout(stageId);
    this.container=new Container();parentContainer.addChildAt(this.container,0);
    this.draw();
    const base=import.meta.env.BASE_URL||'/';
    Promise.all([Assets.load<Texture>(base+'platform-art/'+this.stage.id+'-main.png'),Assets.load<Texture>(base+'platform-art/'+this.stage.id+'-soft.png')])
      .then(([main,soft])=>{if(!this.disposed)this.draw(main,soft);})
      .catch(()=>{ /* The readable collision-aligned fallback remains visible. */ });
  }
  destroy():void {if(this.disposed)return;this.disposed=true;this.container.destroy({children:true});}
  private draw(main?:Texture,soft?:Texture):void {
    for(const child of this.container.removeChildren())child.destroy();
    const stage=this.stage;
    const palette:Record<string,number>={stage1:0xd9c699,stage2:0xa9e0d0,stage3:0xd2ac57,stage4:0xe2bb6c,stage5:0xf2dec0,stage6:0xe2bf78};
    const lip=palette[stage.id]??0xe2bf78;
    const add=(platform:StageLayout['mainPlatform'],texture:Texture|undefined,isMain:boolean)=>{
      if(texture){const sprite=new Sprite(texture);sprite.position.set(platform.x,platform.y);sprite.width=platform.width;sprite.height=isMain?Math.min(105,platform.width*texture.height/texture.width):Math.max(platform.height,Math.min(40,platform.width*texture.height/texture.width));this.container.addChild(sprite);}
      else{const fallback=new Graphics().rect(platform.x,platform.y,platform.width,isMain?55:20).fill({color:0x493342});this.container.addChild(fallback);}
      // The flat rim is the exact landing surface; decorative depth below it is non-colliding.
      const rim=new Graphics().rect(platform.x,platform.y,platform.width,2.5).fill({color:lip}).rect(platform.x,platform.y+2.5,platform.width,1).fill({color:0x261d26});this.container.addChild(rim);
    };
    add(stage.mainPlatform,main,true);for(const platform of stage.platforms)add(platform,soft,false);
    if(new URLSearchParams(window.location.search).get('stageDebug')==='1'){
      const debug=new Graphics();for(const p of[stage.mainPlatform,...stage.platforms])debug.rect(p.x,p.y,p.width,p.height).stroke({color:0xff46d7,width:1});
      for(const ledge of stage.ledges)debug.circle(ledge.x,ledge.y,5).stroke({color:0x49f0e4,width:1});this.container.addChild(debug);
    }
  }
}
