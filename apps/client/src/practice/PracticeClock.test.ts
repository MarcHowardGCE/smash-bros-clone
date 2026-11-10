import{it,expect,vi,afterEach}from'vitest';import{LocalMatch}from'../local/LocalMatch.js';import{INPUT_BITS as B}from'@smash/shared';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
function match(practice=true){let tick=0,last=0;const human={playerId:'local-p1',slotIndex:0,setTick:(n:number)=>{tick=n;},destroy:()=>{},pollInput:()=>{const held=tick>=5&&tick<10?B.JUMP:tick===20?B.ATTACK:0;const input={playerId:'local-p1',tick,seq:tick,held,pressed:held&~last,released:last&~held};last=held;return input;}},dummy={playerId:'local-p2',slotIndex:1,setTick:()=>{},destroy:()=>{},pollInput:()=>null};return new LocalMatch([human,dummy],undefined,'stage1',practice);}
function clock(){vi.stubGlobal('requestAnimationFrame',vi.fn(()=>1));vi.stubGlobal('cancelAnimationFrame',vi.fn());}
it('slow scheduling reaches identical states after equal simulation time', () => {
  vi.spyOn(performance, 'now').mockReturnValue(0);
  const scheduleFrame = vi.fn((_callback: FrameRequestCallback) => 1);
  vi.stubGlobal('requestAnimationFrame', scheduleFrame);
  vi.stubGlobal('cancelAnimationFrame', vi.fn());

  const run = (speed: number) => {
    const localMatch = match();
    localMatch.setPracticeSpeed(speed);
    localMatch.start();
    const frame = scheduleFrame.mock.lastCall![0];
    // Sample just inside the 60-tick interval to avoid floating-point ambiguity at 1 s.
    frame(1001 / speed);
    const snapshot = localMatch.getLatestSnapshot()!;
    localMatch.cleanup();
    expect(snapshot.tick).toBe(60);
    return snapshot.players;
  };

  const normal = run(1);
  expect(run(0.5)).toEqual(normal);
  expect(run(0.25)).toEqual(normal);
});
it('freeze preserves pending buffers and each step advances exactly one tick without scheduling playback',()=>{clock();const m=match();m.start();const engine=(m as any).engine;engine.state.players['local-p1'].actionBuffer={pressed:B.ATTACK,expiresTick:100};m.freezePractice();expect(engine.state.players['local-p1'].actionBuffer).toBeDefined();engine.state.players['local-p1'].actionBuffer=undefined;engine.state.players['local-p1'].hitlagFramesRemaining=5;const tick=m.practiceTick;const scheduled=vi.mocked(requestAnimationFrame).mock.calls.length;expect(m.stepPractice()).toBe(true);expect(m.practiceTick).toBe(tick+1);expect(m.getLatestSnapshot()!.players['local-p1']!.hitlagFramesRemaining).toBe(4);expect(m.paused).toBe(true);expect(vi.mocked(requestAnimationFrame).mock.calls.length).toBe(scheduled);expect(m.stepPractice()).toBe(true);expect(m.practiceTick).toBe(tick+2);m.cleanup();});
it('practice tools reject normal matches and invalid speeds',()=>{clock();const normal=match(false);expect(normal.setPracticeSpeed(.5)).toBe(false);expect(normal.freezePractice()).toBe(false);expect(normal.stepPractice()).toBe(false);normal.cleanup();const p=match();expect(p.setPracticeSpeed(.1)).toBe(false);expect(p.stepPractice()).toBe(false);p.cleanup();});

