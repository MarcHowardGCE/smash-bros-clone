import { Container, Graphics, Point, Sprite } from 'pixi.js';
import { STAGE, type CharacterId, type PlayerState } from '@smash/shared';
import type { FullBodyPilotAssets } from './FullBodyPilot.js';

type Cue = NonNullable<PlayerState['koVisual']>;
type Ghost = {
  layer: Container;
  sprite: Sprite;
  accent?: Graphics;
  start: number;
  cue: Cue;
  character: CharacterId;
  clip: 'ko_launch' | 'ko_screen' | 'ko_star';
  origin: Point;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;
const progress = (elapsed: number, duration: number) => clamp(elapsed / duration, 0, 1);

function createAccent(kind: 'star' | 'screen'): Graphics {
  const accent = new Graphics();
  if (kind === 'star') {
    return accent.poly([0,-24, 4,-5, 20,0, 4,5, 0,24, -4,5, -20,0, -4,-5])
      .fill(0xfffae4).stroke({ color: 0xffbf55, width: 2 });
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

/** Cosmetic copies driven by authoritative KO cues or the Dojo preview. */
export class KOPresentation {
  private seen = new Map<string, number>();
  private ghosts = new Map<string, Ghost>();

  constructor(
    private world: Container,
    private viewport: Container,
    private assets: FullBodyPilotAssets | undefined,
    private newcomerAssets?: FullBodyPilotAssets,
  ) {}

  setAssets(assets?: FullBodyPilotAssets): void { this.assets = assets; }

  private clips(character: CharacterId) {
    return this.newcomerAssets?.characters[character] ?? this.assets?.characters[character];
  }

  private spawn(id: string, character: CharacterId, cue: Cue, now: number): boolean {
    const clip = cue.kind === 'star' ? 'ko_star' : cue.kind === 'screen' ? 'ko_screen' : 'ko_launch';
    if (!this.clips(character)?.[clip]?.frames.length) return false;
    this.ghosts.get(id)?.layer.destroy({ children: true });
    const layer = new Container();
    const sprite = new Sprite();
    sprite.label = clip;
    const accent = cue.kind === 'launch' ? undefined : createAccent(cue.kind);
    if (accent) layer.addChild(accent);
    layer.addChild(sprite);
    const origin = new Point(cue.x, cue.y);
    if (cue.kind === 'launch') this.world.addChild(layer);
    else {
      this.world.toGlobal(origin, origin);
      this.viewport.addChild(layer);
    }
    this.ghosts.set(id, { layer, sprite, accent, start: now, cue, character, clip, origin });
    return true;
  }

  update(players: Iterable<{ id: string; characterId?: CharacterId; koVisual?: PlayerState['koVisual'] }>, now = performance.now()): void {
    for (const player of players) {
      const cue = player.koVisual;
      if (!cue || this.seen.get(player.id) === cue.id) continue;
      this.seen.set(player.id, cue.id);
      this.spawn(player.id, player.characterId ?? 'all-rounder', cue, now);
    }
    this.tick(now);
  }

  preview(kind: 'screen' | 'star', character: CharacterId, position: Pick<Cue, 'x' | 'y' | 'facing'>): boolean {
    const now = performance.now();
    const started = this.spawn('dojo-preview', character, { id: 0, kind, ...position }, now);
    if (started) this.tick(now);
    return started;
  }

  tick(now = performance.now()): void {
    for (const [id, ghost] of this.ghosts) {
      const { sprite, accent, cue, origin } = ghost;
      const clips = this.clips(ghost.character);
      const clip = clips?.[ghost.clip];
      const age = Math.max(0, (now - ghost.start) * 0.06);
      const duration = cue.kind === 'star' ? 85 : cue.kind === 'screen' ? 67 : 24;
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

      const { WIDTH: width, HEIGHT: height } = STAGE;
      let poses = clip;
      let frameIndex: number;
      let renderedHeight: number;
      if (cue.kind === 'star') {
        const tumbleEnd = 66;
        const t = progress(age, tumbleEnd);
        const startX = clamp(origin.x, width * 0.16, width * 0.84);
        const direction = startX <= width / 2 ? 1 : -1;
        const startY = clamp(origin.y, height * 0.23, height * 0.39);
        const x = startX + direction * width * 0.18 * t;
        const y = lerp(startY, height * 0.08, t);
        sprite.position.set(x, y);
        if (age >= 5 && clip.frames.length < 3) poses = clips?.tumble ?? clip;
        const firstTumbleFrame = poses === clip && poses.frames.length > 2 ? 1 : 0;
        frameIndex = age < 5 ? 0 : firstTumbleFrame + Math.floor((age - 5) / 5) % (poses.frames.length - firstTumbleFrame);
        renderedHeight = lerp(height * 0.115, 2, 1 - (1 - t) ** 2);
        sprite.visible = age < tumbleEnd;
        sprite.alpha = 1 - 0.25 * t;

        if (accent) {
          const twinkle = progress(age - tumbleEnd, duration - tumbleEnd);
          accent.visible = age >= tumbleEnd;
          accent.position.set(x, y);
          accent.scale.set(0.35 + Math.sin(twinkle * Math.PI) * 0.65);
          accent.alpha = 1 - twinkle;
        }
      } else {
        const impact = 15;
        const release = 36;
        const approach = progress(age, impact);
        const slide = progress(age - release, duration - release);
        const startX = clamp(origin.x, width * 0.16, width * 0.84);
        const targetX = clamp(startX, width * 0.34, width * 0.66);
        const targetY = height * 0.42;
        sprite.position.set(lerp(startX, targetX, approach), lerp(height * 0.16, targetY, approach) + height * 0.91 * slide ** 2);
        renderedHeight = lerp(height * 0.09, height * 0.46, approach ** 2);
        frameIndex = age < impact ? 0 : age < release ? Math.min(1, clip.frames.length - 1) : clip.frames.length - 1;
        if (accent) {
          const hitFlash = progress(age - impact, 8);
          accent.visible = age >= impact && hitFlash < 1;
          accent.position.set(targetX, targetY);
          accent.scale.set(0.78 + hitFlash * 0.55);
          accent.alpha = 1 - hitFlash;
        }
      }
      const frame = poses.frames[frameIndex]!;
      sprite.texture = frame.texture;
      // Recenter and normalize viewport poses. Atlas roots and crop heights vary by fighter.
      sprite.pivot.set(frame.texture.frame.width / 2, frame.texture.frame.height / 2);
      const scale = renderedHeight / frame.texture.frame.height;
      const facing = cue.kind === 'star' ? cue.facing : 1;
      sprite.scale.set(scale * facing * (poses.mirrorSource ? -1 : 1) * (frame.mirrorSource ? -1 : 1), scale);
    }
  }

  getDiagnostics() {
    return [...this.ghosts.values()].map(({ clip, cue, sprite, accent }) => ({
      clip, kind: cue.kind, visible: sprite.visible, frameRect: [sprite.texture.frame.x, sprite.texture.frame.y].join(','),
      x: sprite.x, y: sprite.y, height: sprite.height, accentVisible: accent?.visible ?? false,
    }));
  }

  clear(): void {
    for (const ghost of this.ghosts.values()) ghost.layer.destroy({ children: true });
    this.ghosts.clear();
    this.seen.clear();
  }
}
