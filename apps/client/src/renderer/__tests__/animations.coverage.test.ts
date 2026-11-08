import { MoveId, PlayerStateEnum } from '@smash/shared';
import { describe, expect, it } from 'vitest';
import {
  ANIMATIONS,
  ATTACK_MOVE_ANIMATIONS,
  DEFAULT_POSE,
  getAnimationPose,
  type JointPose,
} from '../animations';

const ALL_PLAYER_STATES = Object.values(PlayerStateEnum);
const ALL_MOVE_IDS = Object.values(MoveId);

const EXCLUDED_MOVE_IDS = new Set<MoveId>([MoveId.LEDGE_ATTACK]);
const ATTACK_MOVE_IDS = ALL_MOVE_IDS.filter((moveId) => !EXCLUDED_MOVE_IDS.has(moveId));

const DIRECT_MAPPED_STATE_NAMES = new Set<string>([
  'IDLE',
  'WALK',
  'RUN',
  'JUMPSQUAT',
  'AIRBORNE',
  'DOUBLE_JUMP',
  'ATTACK',
  'SHIELD',
  'ROLL',
  'SPOT_DODGE',
  'AIR_DODGE',
  'HITSTUN',
  'GRAB',
  'GRAB_HOLDING',
  'LEDGE_APPROACH',
  'LEDGE_TRUMP',
  'LEDGE_HANG',
  'LEDGE_CLIMB',
  'LEDGE_ATTACK',
  'LEDGE_ROLL',
  'LEDGE_JUMP',
]);

const FALLBACK_TO_IDLE_STATE_NAMES = new Set<string>([
  'DASH',
  'RUN_BRAKE',
  'RUN_TURN',
  'TECH_NEUTRAL',
  'TECH_ROLL',
  'HARD_LANDING',
  'LANDING_LAG',
  'CROUCH','TAUNT','HELPLESS','HELPLESS_LAND','TRIP_FALL','TRIP_PRONE','TRIP_GETUP','TRIP_ROLL','JAB_LOCK','GETUP','GETUP_ROLL',
]);

const REPRESENTATIVE_STATE_FRAMES = [0, 9, 15, 23] as const;
const REPRESENTATIVE_MOVE_FRAMES = [0, 9, 15, 23] as const;

type Classification = {
  readonly directMapped: number;
  readonly aliasMapped: number;
  readonly idleFallback: number;
};

function assertFinitePose(pose: JointPose): void {
  expect(Number.isFinite(pose.leftArmAngle)).toBe(true);
  expect(Number.isFinite(pose.rightArmAngle)).toBe(true);
  expect(Number.isFinite(pose.leftLegAngle)).toBe(true);
  expect(Number.isFinite(pose.rightLegAngle)).toBe(true);
  expect(Number.isFinite(pose.bodyScaleX)).toBe(true);
  expect(Number.isFinite(pose.bodyScaleY)).toBe(true);
  expect(Number.isFinite(pose.headOffsetX)).toBe(true);
  expect(Number.isFinite(pose.headOffsetY)).toBe(true);
}

function posesDiffer(left: JointPose, right: JointPose): boolean {
  return (
    left.leftArmAngle !== right.leftArmAngle
    || left.rightArmAngle !== right.rightArmAngle
    || left.leftLegAngle !== right.leftLegAngle
    || left.rightLegAngle !== right.rightLegAngle
    || left.bodyScaleX !== right.bodyScaleX
    || left.bodyScaleY !== right.bodyScaleY
    || left.headOffsetX !== right.headOffsetX
    || left.headOffsetY !== right.headOffsetY
  );
}

function classifyStateCoverage(states: readonly string[]): Classification {
  let directMapped = 0;
  let aliasMapped = 0;
  let idleFallback = 0;

  for (const stateName of states) {
    if (DIRECT_MAPPED_STATE_NAMES.has(stateName)) {
      directMapped += 1;
      continue;
    }

    if (stateName === PlayerStateEnum.AIR_ATTACK) {
      aliasMapped += 1;
      continue;
    }

    idleFallback += 1;
  }

  return { directMapped, aliasMapped, idleFallback };
}

// Legacy polygon tables intentionally retain fallback poses; full-body coverage has separate tests.
describe('legacy polygon animations exact coverage', () => {
  it('Given exported enums, When deriving coverage sets, Then 40 states + 30 attack moves = 70 with LEDGE_ATTACK excluded by name', () => {
    expect(ALL_PLAYER_STATES).toHaveLength(40);
    expect(ALL_MOVE_IDS).toHaveLength(31);

    expect(EXCLUDED_MOVE_IDS.has(MoveId.LEDGE_ATTACK)).toBe(true);
    expect(ATTACK_MOVE_IDS).toHaveLength(30);
    expect(ATTACK_MOVE_IDS).not.toContain(MoveId.LEDGE_ATTACK);

    expect(Object.keys(ATTACK_MOVE_ANIMATIONS)).toHaveLength(22);

    const totalCases = ALL_PLAYER_STATES.length + ATTACK_MOVE_IDS.length;
    expect(totalCases).toBe(70);
  });

  it('Given all PlayerStateEnum values, When classifying mapping behavior, Then classification is exactly 21 direct + 1 alias + 18 idle fallback = 40', () => {
    const classification = classifyStateCoverage(ALL_PLAYER_STATES);
    const sum = classification.directMapped + classification.aliasMapped + classification.idleFallback;

    expect(classification.directMapped).toBe(21);
    expect(classification.aliasMapped).toBe(1);
    expect(classification.idleFallback).toBe(18);
    expect(sum).toBe(40);

    expect(FALLBACK_TO_IDLE_STATE_NAMES.size).toBe(18);
    for (const fallbackStateName of FALLBACK_TO_IDLE_STATE_NAMES) {
      const fallbackPose = getAnimationPose(fallbackStateName, 15, null);
      const idlePose = getAnimationPose(PlayerStateEnum.IDLE, 15, null);
      expect(fallbackPose).toEqual(idlePose);
    }
  });

  it('Given animation tables, When executing representative keyframes, Then every one of the 70 derived cases executes and AIR_ATTACK table entry is explicitly exercised', () => {
    const executedStateCases = new Set<string>();
    const executedMoveCases = new Set<MoveId>();

    for (const stateName of ALL_PLAYER_STATES) {
      for (const frame of REPRESENTATIVE_STATE_FRAMES) {
        const pose = getAnimationPose(stateName, frame, null);
        assertFinitePose(pose);
      }
      executedStateCases.add(stateName);
    }

    for (const moveId of ATTACK_MOVE_IDS) {
      for (const frame of REPRESENTATIVE_MOVE_FRAMES) {
        const pose = getAnimationPose(PlayerStateEnum.ATTACK, frame, moveId);
        assertFinitePose(pose);
      }
      executedMoveCases.add(moveId);
    }

    const executedCaseCount = executedStateCases.size + executedMoveCases.size;
    expect(executedCaseCount).toBe(70);

    const airAttackTable = ANIMATIONS.AIR_ATTACK;
    expect(airAttackTable).toBeDefined();
    if (!airAttackTable) {
      throw new Error('AIR_ATTACK animation table missing');
    }
    expect(airAttackTable.length).toBeGreaterThanOrEqual(2);

    const representativeAirAttackFrame = airAttackTable[1] ?? DEFAULT_POSE;
    expect(posesDiffer(representativeAirAttackFrame, DEFAULT_POSE)).toBe(true);

    const airAttackAliasPose = getAnimationPose(PlayerStateEnum.AIR_ATTACK, 15, null);
    const attackPose = getAnimationPose(PlayerStateEnum.ATTACK, 15, null);
    expect(airAttackAliasPose).toEqual(attackPose);

    // Explicitly record as dead-via-alias in current implementation contract.
    expect(ANIMATIONS.AIR_ATTACK).not.toEqual(ANIMATIONS.ATTACK);
  });

  it('Given temporary derivation regressions, When one move is removed or a fake state is added, Then guardrail counts fail (QA sentinel simulation)', () => {
    const intentionallyMissingOneMove = ATTACK_MOVE_IDS.slice(0, ATTACK_MOVE_IDS.length - 1);
    expect(intentionallyMissingOneMove).toHaveLength(29);
    expect(ALL_PLAYER_STATES.length + intentionallyMissingOneMove.length).toBe(69);

    const withFakeState = [...ALL_PLAYER_STATES, 'FAKE_41ST_STATE'];
    const classification = classifyStateCoverage(withFakeState);
    const sum = classification.directMapped + classification.aliasMapped + classification.idleFallback;
    expect(sum).toBe(41);
    expect(sum).not.toBe(40);
  });
});
