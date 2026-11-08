import { launchWorldSpeed } from '@smash/engine';
import { PHYSICS, type GameState, type HitEventData, type KOEventData, type PlayerId } from '@smash/shared';

type Launch = {
  hit: HitEventData;
  percent: number;
  tick: number;
  hitstun: number;
  baseHitstun?: number;
  impact?: GameState['players'][string]['launchImpact'];
  tumble: boolean;
  distance: number;
  active: boolean;
};

export class PracticeLaunchReadout {
  private launches = new Map<PlayerId, Launch>();
  private exits = new Map<PlayerId, KOEventData>();

  clear(): void {
    this.launches.clear();
    this.exits.clear();
  }

  observe(state: GameState, hits: HitEventData[], exits: KOEventData[]): void {
    for (const hit of hits) {
      const target = state.players[hit.defenderId];
      if (!target || target.state !== 'HITSTUN' || hit.knockbackMagnitude <= 0) continue;
      this.launches.set(hit.defenderId, {
        hit, percent: target.percent, tick: state.tick, hitstun: target.hitstunFramesRemaining,
        tumble: target.isTumbling, baseHitstun: target.launchTiming?.end, distance: 0, active: true,
      });
    }

    for (const exit of exits) {
      this.exits.set(exit.playerId, exit);
      const launch = this.launches.get(exit.playerId);
      if (!launch?.active) continue;
      if (exit.exitPosition) this.measure(launch, exit.exitPosition.x, exit.exitPosition.y);
      launch.active = false;
    }

    for (const [id, launch] of this.launches) {
      const target = state.players[id];
      if (!launch.active || !target) continue;
      this.measure(launch, target.x, target.y);
      if(target.launchImpact)launch.impact=target.launchImpact;
      launch.active = target.state === 'HITSTUN' && !target.isGrounded;
    }
  }

  private measure(launch: Launch, x: number, y: number): void {
    launch.distance = Math.max(launch.distance, Math.hypot(x - launch.hit.worldX, y - launch.hit.worldY));
  }

  describe(id: PlayerId): string {
    const launch = this.launches.get(id);
    const exit = this.exits.get(id);
    const move = launch?.hit.moveId.toLowerCase().replace(/_/g, ' ');
    const contact = launch
      ? `Tick ${launch.tick} · ${move} at ${launch.percent}%\nKnockback ${launch.hit.knockbackMagnitude.toFixed(1)} · ${launch.baseHitstun ? launch.baseHitstun+' → ' : ''}${launch.hitstun} ticks hitstun · ${launch.tumble ? 'Tumble' : 'No tumble'}\nBase launch speed ${launchWorldSpeed(launch.hit.knockbackMagnitude).toFixed(1)} units/tick · max displacement ${launch.distance.toFixed(1)} units`
      : 'No launch recorded.';
    const impact=launch?.impact;
    const detail=impact?`\n${impact.surface} · ${impact.teched?'tech':impact.blockedByHitbox?'rebound (hitbox blocks tech)':'rebound'} · ${impact.freeze} ticks contact freeze · ${impact.before} → ${impact.after} ticks hitstun`:'';
    const recovery=impact?.teched&&impact.surface==='ceiling'?`\nCeiling recovery · ${PHYSICS.CEILING_TECH_FRAMES} ticks · ${PHYSICS.CEILING_TECH_INTANGIBILITY_FRAMES} intangible`:'';
    return exit ? `${contact}${detail}${recovery}\nLast KO · ${exit.boundary} blast zone · tick ${exit.tick}` : contact+detail+recovery;
  }
}

