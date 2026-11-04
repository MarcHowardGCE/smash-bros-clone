import{GenericInputBits as G,STANDARD_BUTTON_INDEX as I}from'@smash/gamepad-input';
import{INPUT_BITS as B}from'@smash/shared';
/** Ultimate Switch Pro default physical positions translated to Xbox labels. */
export const XBOX360_PROFILE={id:'ultimate-xbox360-v1',name:'Ultimate — Xbox 360',confirm:G.B,cancel:G.A,pause:G.START,
 bindings:[{action:'ATTACK',index:I.B,mask:G.B,bit:B.ATTACK,label:'B'},{action:'SPECIAL',index:I.A,mask:G.A,bit:B.SPECIAL,label:'A'},{action:'JUMP',index:I.X,mask:G.X,bit:B.JUMP,label:'X / Y'},{action:'JUMP',index:I.Y,mask:G.Y,bit:B.JUMP,label:'X / Y'},{action:'SHIELD',index:I.LT,mask:G.LT,bit:B.SHIELD,label:'LT / RT'},{action:'SHIELD',index:I.RT,mask:G.RT,bit:B.SHIELD,label:'LT / RT'},{action:'GRAB',index:I.LB,mask:G.LB,bit:B.GRAB,label:'LB / RB'},{action:'GRAB',index:I.RB,mask:G.RB,bit:B.GRAB,label:'LB / RB'}],
 labels:{LEFT:'Left stick',RIGHT:'Left stick',UP:'Left stick / stick jump',DOWN:'Left stick',TAUNT_UP:'D-pad Up',TAUNT_SIDE:'D-pad Left / Right',TAUNT_DOWN:'D-pad Down'},
 defaults:{stickJump:true,abSmash:true,rightStick:'smash',sensitivity:'normal'}
}as const;
export function xboxBindingLabel(action:string):string{return XBOX360_PROFILE.bindings.find(b=>b.action===action)?.label??(XBOX360_PROFILE.labels as Record<string,string>)[action]??'—';}
