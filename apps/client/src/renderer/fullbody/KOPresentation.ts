import { Container, Graphics, Point, Sprite } from 'pixi.js';
import { STAGE, type CharacterId, type PlayerState } from '@smash/shared';
import type { FullBodyPilotAssets } from './FullBodyPilot.js';

type Cue = NonNullable<PlayerState['koVisual']>;
type StarHandoff = {
  frameIndex: number;
  rotation: number;
  scale: number;
  mirror: number;
  velocityY: number;
};

type Ghost = {
  layer: Container;
  sprite: Sprite;
  accent?: Graphics;
  blast?: Graphics;
  start: number;
  cue: Cue;
  character: CharacterId;
  clip: 'ko_launch' | 'ko_screen' | 'ko_star';
  origin: Point;
  screenLead: number;
  star?: StarHandoff;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;
const progress = (elapsed: number, duration: number) => clamp(elapsed / duration, 0, 1);
const smooth = (t: number) => t * t * (3 - 2 * t);
const retreatPath = (start: number, lead: number, end: number, t: number) =>
  end + (start - end) * (1 - t) ** 3 + 3 * lead * (1 - t) ** 2 * t;
const smoother = (t: number) => t ** 3 * (10 + t * (6 * t - 15));
// Approximate 60 Hz presentation cues sampled from the Ultimate captures.
const starTwinkle = 101;
const starEnd = 120;
const screenImpact = 20;
const screenRelease = 42;
const screenExit = 59;
const screenBlast = 79;
const screenEnd = 104;

function exitSlope(cue: Cue): number {
  const velocity = cue.exitVelocity;
  if (!velocity || velocity.y >= 0) return 0;
  return clamp(velocity.x / -velocity.y, -1, 1);
}

function createAccent(kind: 'star' | 'screen'): Graphics {
  const accent = new Graphics();
  if (kind === 'star') {
    return accent.poly([0,-24, 4,-5, 20,0, 4,5, 0,24, -4,5, -20,0, -4,-5])
      .fill(0xfff4ff).stroke({ color: 0xc48cff, width: 2 });
  }
  for (let index = 0; index < 10; index++) {
    const angle = (index + 0.15) * Math.PI / 5;
    const inner = 102 + (index % 3) * 11;
    const outer = inner + 26 + (index % 2) * 26;
    accent.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      .lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
  }
  return accent.stroke({ color: 0xfff3cb, width: 3 });
}

function createBottomBlast(): Graphics {
  return new Graphics()
    .poly([-126, 4, -78, -42, -58, -258, -32, -120, -17, -436,
      23, -418, 43, -137, 69, -280, 87, -38, 126, 4])
    .fill({ color: 0x487dfa, alpha: 0.42 })
    .poly([-73, 4, -49, -87, -40, -350, -22, -242, -10, -501,
      22, -488, 30, -237, 49, -332, 57, -49, 80, 4])
    .fill({ color: 0x7adfff, alpha: 0.76 })
    .poly([-43, 4, -25, -139, -14, -414, 12, -451, 25, -148, 42, 4])
    .fill(0xf3fbff);
}

/** Cosmetic copies driven by authoritative KO cues or the Dojo preview. */
export class KOPresentation {
  private seen = new Map<string, number>();
  private ghosts = new Map<string, Ghost>();

  constructor(
    private world: Container,
    private viewport: Container,
    private assets: FullBodyPilotAssets | undefined,
    private viewportSize: { width: number; height: number } = { width: STAGE.WIDTH, height: STAGE.HEIGHT },
    private outgoingTumble?: (id: string) => Sprite | undefined,
  ) {}

  setAssets(assets?: FullBodyPilotAssets): void { this.assets = assets; }

  private clips(character: CharacterId) {
    return this.assets?.characters[character];
  }

  private spawn(id: string, character: CharacterId, cue: Cue, now: number, source?: Sprite, preview = false): boolean {
    const clip = cue.kind === 'star' ? 'ko_star' : cue.kind === 'screen' ? 'ko_screen' : 'ko_launch';
    if (!this.clips(character)?.[clip]?.frames.length) return false;
    this.ghosts.get(id)?.layer.destroy({ children: true });
    const layer = new Container();
    const sprite = new Sprite();
    sprite.label = clip;
    const accent = cue.kind === 'launch' ? undefined : createAccent(cue.kind);
    if (accent) layer.addChild(accent);
    layer.addChild(sprite);
    const blast = cue.kind === 'screen' ? createBottomBlast() : undefined;
    if (blast) {
      blast.visible = false;
      blast.position.set(this.viewportSize.width / 2, this.viewportSize.height);
      layer.addChild(blast);
    }
    const origin = new Point(cue.x, cue.y);
    if (cue.kind === 'launch') this.world.addChild(layer);
    else {
      this.viewport.toLocal(origin, this.world, origin);
      this.viewport.addChild(layer);
    }
    const screenLead = cue.kind === 'screen' && cue.exitVelocity && origin.y >= -STAGE.HEIGHT * 0.06
      ? Math.max(5, Math.min(12, Math.ceil((origin.y + STAGE.HEIGHT * 0.14) / 22))) : 0;
    let star: StarHandoff | undefined;
    if (cue.kind === 'star') {
      const tumble = this.clips(character)?.tumble;
      const velocityY = cue.exitVelocity
        ? this.viewport.toLocal(new Point(cue.x, cue.y + cue.exitVelocity.y), this.world).y - origin.y
        : 0;
      const frameIndex = source ? tumble?.frames.findIndex(frame => frame.texture === source.texture) ?? -1 : -1;
      if (source && source.parent && frameIndex >= 0) {
        const { width, height } = source.texture.frame;
        const center = this.viewport.toLocal(new Point(width / 2, height / 2), source);
        const root = this.viewport.toLocal(new Point(), source.parent);
        const right = this.viewport.toLocal(new Point(width / 2 + 1, height / 2), source);
        const down = this.viewport.toLocal(new Point(width / 2, height / 2 + 1), source);
        const dx = down.x - center.x;
        const dy = down.y - center.y;
        origin.x += center.x - root.x;
        origin.y += center.y - root.y;
        star = {
          frameIndex, velocityY, rotation: Math.atan2(-dx, dy), scale: Math.hypot(dx, dy),
          mirror: Math.sign((right.x - center.x) * dy - (right.y - center.y) * dx),
        };
      } else {
        if (preview) origin.y = this.viewportSize.height * 0.19;
        const frame = (tumble ?? this.clips(character)?.ko_star)?.frames[0];
        const scale = frame ? STAGE.HEIGHT * 0.115 / frame.texture.frame.height : 0.5;
        star = { frameIndex: 0, velocityY, rotation: 0, scale, mirror: cue.facing };
      }
    }
    this.ghosts.set(id, { layer, sprite, accent, blast, start: now, cue, character, clip, origin, screenLead, star });
    return true;
  }

  update(players: Iterable<{ id: string; characterId?: CharacterId; koVisual?: PlayerState['koVisual'] }>, now = performance.now()): void {
    for (const player of players) {
      const cue = player.koVisual;
      if (!cue || this.seen.get(player.id) === cue.id) continue;
      this.seen.set(player.id, cue.id);
      this.spawn(player.id, player.characterId ?? 'all-rounder', cue, now,
        cue.kind === 'star' ? this.outgoingTumble?.(player.id) : undefined);
    }
    this.tick(now);
  }

  preview(kind: 'screen' | 'star', character: CharacterId, position: Pick<Cue, 'x' | 'y' | 'facing' | 'exitVelocity'>, fighterId?: string): boolean {
    const now = performance.now();
    const started = this.spawn('dojo-preview', character, { id: 0, kind, ...position }, now,
      kind === 'star' && fighterId ? this.outgoingTumble?.(fighterId) : undefined, !position.exitVelocity);
    if (started) this.tick(now);
    return started;
  }

  tick(now = performance.now()): void {
    for (const [id, ghost] of this.ghosts) {
      const { sprite, accent, blast, cue, origin } = ghost;
      const clips = this.clips(ghost.character);
      const clip = clips?.[ghost.clip];
      const age = Math.max(0, (now - ghost.start) * 0.06) - ghost.screenLead;
      const duration = cue.kind === 'star' ? starEnd : cue.kind === 'screen' ? screenEnd : 24;
      if (!clip?.frames.length || age >= duration) {
        ghost.layer.destroy({ children: true });
        this.ghosts.delete(id);
        continue;
      }

      if (cue.kind === 'launch') {
        const frame = clip.frames[Math.min(clip.frames.length - 1, Math.floor(age / 4))]!;
        sprite.texture = frame.texture;
        sprite.pivot.set(frame.root[0], frame.root[1]);
        sprite.scale.set(clip.scale * cue.facing * (clip.mirrorSource ? -1 : 1) * (frame.mirrorSource ? -1 : 1), clip.scale);
        sprite.position.set(cue.x + cue.facing * 50 * age / duration, cue.y + frame.offsetY);
        sprite.alpha = 1 - age / duration * 0.85;
        continue;
      }

      const { width, height } = this.viewportSize;
      const portraitHeight = Math.min(height, STAGE.HEIGHT);
      let poses = clip;
      let frameIndex: number;
      let scale: number;
      let verticalScale: number;
      const entryFrame = clip.frames[0]!;
      const startX = clamp(origin.x, width * 0.06, width * 0.94);
      if (cue.kind === 'star' && ghost.star) {
        const handoff = ghost.star;
        const t = progress(age, starTwinkle);
        const depth = 1 - (1 - t) ** 3;
        const endX = clamp(origin.x + portraitHeight * 0.055 * exitSlope(cue), width * 0.04, width * 0.96);
        const endY = height * 0.08;
        const x = retreatPath(origin.x, (endX - origin.x) * 0.5, endX, depth);
        const y = retreatPath(origin.y, clamp(handoff.velocityY * 0.2, -60, 0), endY, depth);
        sprite.position.set(x, y);
        poses = clips?.tumble?.frames.length ? clips.tumble : clip;
        frameIndex = (handoff.frameIndex + Math.floor(age / 5)) % poses.frames.length;
        const reference = poses.frames[handoff.frameIndex]!.texture.frame;
        const frame = poses.frames[frameIndex]!.texture.frame;
        // The bounding diagonal stays comparable when a pose turns or tucks.
        const diameter = Math.hypot(reference.width, reference.height);
        scale = verticalScale = lerp(handoff.scale * diameter, 2, depth) / Math.hypot(frame.width, frame.height);
        sprite.rotation = handoff.rotation + (poses.rotationPeriod ? age * Math.PI * 2 / 30 : 0);
        sprite.visible = age < starTwinkle;
        sprite.alpha = 1 - 0.25 * t;

        if (accent) {
          const twinkle = progress(age - starTwinkle, duration - starTwinkle);
          accent.visible = age >= starTwinkle;
          accent.position.set(x, y);
          accent.scale.set(0.35 + Math.sin(twinkle * Math.PI) * 0.65);
          accent.alpha = 1 - twinkle;
        }
      } else {
        const approach = progress(age, screenImpact);
        const fall = progress(age - screenRelease, screenExit - screenRelease);
        const targetX = width / 2;
        const targetY = height * 0.53;
        const entryY = -portraitHeight * 0.14;
        const offscreen = ghost.screenLead > 0 || origin.y < -portraitHeight * 0.06;
        const startY = offscreen ? entryY : Math.min(origin.y, targetY);
        const exitLane = clamp(startX + (origin.y - entryY) * exitSlope(cue), width * 0.04, width * 0.96);
        const approachX = ghost.screenLead ? exitLane : startX;
        // Line up the approach in depth before the sprite reaches the visible edge.
        const lateral = smooth(progress(approach, offscreen ? 0.28 : 1));
        const depth = smoother(offscreen ? progress(approach - 0.16, 0.84) : approach);
        const impactScale = portraitHeight * 0.51 / clip.frames[Math.min(1, clip.frames.length - 1)]!.texture.frame.height;
        const fallBack = ghost.character === 'hulk-hoagie';
        const recession = fallBack ? lerp(1, 0.64, smooth(fall)) : 1;
        const pitch = fallBack ? lerp(1, 0.77, smooth(fall)) : 1;
        scale = lerp(portraitHeight * 0.09 / entryFrame.texture.frame.height, impactScale, depth) * recession;
        verticalScale = scale * pitch;
        const lastFrame = clip.frames[clip.frames.length - 1]!;
        const exitY = height + lastFrame.texture.frame.height * impactScale * (fallBack ? 0.64 * 0.77 : 1) / 2;
        const y = lerp(startY, targetY, depth) + (exitY - targetY) * fall ** 2;
        if (age < 0) {
          const lead = progress(age + ghost.screenLead, ghost.screenLead);
          sprite.position.set(lerp(startX, exitLane, lead), lerp(origin.y, entryY, lead));
        } else {
          sprite.position.set(lerp(approachX, targetX, lateral), y);
        }
        frameIndex = age < screenImpact ? 0 : age < screenRelease ? Math.min(1, clip.frames.length - 1) : clip.frames.length - 1;
        sprite.visible = age < screenExit;
        if (accent) {
          const hitFlash = progress(age - screenImpact, 8);
          accent.visible = age >= screenImpact && hitFlash < 1;
          accent.position.set(targetX, targetY);
          accent.scale.set(0.78 + hitFlash * 0.55);
          accent.alpha = 1 - hitFlash;
        }
        if (blast) {
          const burst = progress(age - screenBlast, screenEnd - screenBlast);
          blast.position.set(targetX, height);
          blast.visible = age >= screenBlast;
          blast.scale.set(lerp(1, 0.22, burst), lerp(1.14, 0.24, burst));
          blast.alpha = 1 - burst;
        }
      }
      const frame = poses.frames[frameIndex]!;
      sprite.texture = frame.texture;
      // Keep the perspective scale continuous across trimmed atlas drawings.
      sprite.pivot.set(frame.texture.frame.width / 2, frame.texture.frame.height / 2);
      const mirror = ghost.star?.mirror ?? (poses.mirrorSource ? -1 : 1) * (frame.mirrorSource ? -1 : 1);
      sprite.scale.set(scale * mirror, verticalScale);
    }
  }

  hasSpecialKO(): boolean {
    for (const ghost of this.ghosts.values()) {
      if (ghost.cue.kind !== 'launch') return true;
    }
    return false;
  }

  hasScreenKOOverHUD(): boolean {
    for (const { cue, sprite, blast } of this.ghosts.values()) {
      if (cue.kind === 'screen' && (blast?.visible || sprite.y + sprite.height / 2 >= this.viewportSize.height * 0.8)) return true;
    }
    return false;
  }

  getDiagnostics() {
    return [...this.ghosts.values()].map(({ clip, cue, sprite, accent, blast, character }) => ({
      clip, character, kind: cue.kind, visible: sprite.visible, frameRect: [sprite.texture.frame.x, sprite.texture.frame.y].join(','),
      x: sprite.x, y: sprite.y, width: sprite.width, height: sprite.height, alpha: sprite.alpha, scale: sprite.scale.y,
      accentVisible: accent?.visible ?? false, blastVisible: blast?.visible ?? false, blastY: blast?.y,
    }));
  }

  clear(): void {
    for (const ghost of this.ghosts.values()) ghost.layer.destroy({ children: true });
    this.ghosts.clear();
    this.seen.clear();
  }
}
