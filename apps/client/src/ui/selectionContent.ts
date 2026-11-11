import { isPack03PilotId } from '@smash/shared';

/** Presentation only. Fighter histories remain open for collaborative writing. */
export const FIGHTER_PRESENTATION: Record<string,{id:string;name:string;role:string;pitch:string;style:string;strength:string;trade:string}> = {
  "all-rounder": {
    "id": "all-rounder",
    "name": "All-Rounder",
    "role": "Balanced",
    "pitch": "A versatile fighter built around the fundamentals.",
    "style": "Balanced movement and a familiar starting point for learning the roster.",
    "strength": "Versatility",
    "trade": "Baseline mobility"
  },
  "abe-lincoln": {
    "id": "abe-lincoln",
    "name": "Abe Lincoln",
    "role": "Heavyweight",
    "pitch": "A towering presence with deliberate, heavy movement.",
    "style": "A heavier fighter with slower movement and a larger body. Make your positioning count.",
    "strength": "Heavyweight survival",
    "trade": "Slower movement"
  },
  "swift": {
    "id": "swift",
    "name": "Swift",
    "role": "Lightweight",
    "pitch": "Quick movement, high jumps, and a lighter touch.",
    "style": "A mobile fighter with faster running and higher jumps. Stay elusive: a lighter fighter is easier to launch.",
    "strength": "Mobility",
    "trade": "Lighter weight"
  },
  "moonshine": {
    id: "moonshine",
    name: "Moonshine",
    role: "Mobile brawler",
    pitch: "Close the gap with a fast dash attack and keep the pressure on in the air.",
    style: "Quick grounded pokes and aerial follow-ups reward staying mobile.",
    strength: "Fast approaches and follow-ups",
    trade: "Lighter weight and lower launch power"
  },
  "hulk-hoagie": {
    id: "hulk-hoagie",
    name: "“Hulk” Hoagie",
    role: "Grappler",
    pitch: "Find a clean grab and turn it into a heavy throw.",
    style: "A sturdy wrestler with strong forward and back throws and a higher up-special launch.",
    strength: "Grab and throw payoff",
    trade: "Slower movement and longer grab recovery"
  },
  "mr-wrong": {
    id: "mr-wrong",
    name: "Mr. Wrong",
    role: "Long-reach trickster",
    pitch: "Threaten space with elastic tentacle strikes.",
    style: "Quick movement and long-reaching attacks give him room to vary his approach.",
    strength: "Reach and mobility",
    trade: "Lighter than average"
  },
  "loopy": {
    id: "loopy",
    name: "Loopy",
    role: "Lightweight speedster",
    pitch: "Use speed and quick jumps to change the angle of attack.",
    style: "Fast running and strong aerial mobility reward quick approaches and retreats.",
    strength: "Run speed and aerial movement",
    trade: "Low weight"
  },
  "mrs-tasselbottom": {
    id: "mrs-tasselbottom",
    name: "Mrs. Tasselbottom",
    role: "Super heavyweight",
    pitch: "Hold your ground and make every opening count.",
    style: "A wide, heavy fighter with powerful attacks and deliberate movement.",
    strength: "Weight and launch power",
    trade: "Low jump and slower movement"
  }
};
export const WORLD_STORIES: Record<string,{name:string;short:string;hook:string;text:string;story:string}> = {
  "stage1": {
    "name": "The Neighborhood That Ate Itself",
    "short": "The Neighborhood",
    "hook": "A friendly street with a taste for its neighbors.",
    "text": "In this crooked cul-de-sac, windows blink, lawns twitch and two rival houses have spent centuries trying to swallow each other. The sun smiles through far too many teeth.",
    "story": "The lawns are living tongues, maintained by tiny homeowners mowing their taste buds. Mailboxes give birth to envelopes with legs. A distant school bus swallows children-shaped balloons, and picket fences have fingers instead of posts. Beneath all this everyday activity, two neighboring houses stretch their wooden jaws toward each other. They have been quietly trying to eat one another for centuries."
  },
  "stage2": {
    "name": "The Drowned Cathedral of Teeth",
    "short": "The Drowned Cathedral",
    "hook": "Faith survives in the mouth of something immense.",
    "text": "Deep beneath the sea, worship continues inside a sleeping creature. Teeth form the columns, jellyfish tend the sanctuary, and the rose window watches through a living iris.",
    "story": "Thousands of feet beneath the sea, a colossal sleeping creature shelters a cathedral within its partially open mouth. Gothic arches rise from its gums; a tongue serves as the altar. Robed jellyfish priests drift above pews of rib bone while blind, human-nosed fish attend a perpetual funeral. Beyond the sanctuary pass silhouettes larger than the cathedral itself. Farther down the throat waits a second, smaller cathedral, inside another immense mouth."
  },
  "stage3": {
    "name": "The Factory That Manufactures Mothers",
    "short": "The Mother Factory",
    "hook": "Affection, assembled and quality-controlled.",
    "text": "Machines attach smiles and pour artificial affection into porcelain bodies. Defective dolls repair their replacements beneath the gaze of an exhausted maternal face.",
    "story": "Doll heads travel one conveyor while bodies with too many arms travel another. Mechanical hands attach smiles, sometimes upside down, and glowing pink affection fills hollow porcelain. The supervisor has the body of a sewing machine and the face of an exhausted grandmother. Between sips of coffee from an oil can, she stamps a red heart onto every finished creation. On the rear wall an enormous maternal face watches the machinery. When she sneezes, hundreds of dolls tumble from a production chute."
  },
  "stage4": {
    "name": "The Circus at the End of Time",
    "short": "The Cosmic Circus",
    "hook": "The universe is ending. The show must go on.",
    "text": "A collapsing circus drifts above a sea of stars. Cosmic spectators watch impossible performers while reality peels away to reveal another circus behind it.",
    "story": "Canvas stitched from fragments of night sky hangs from nervous, human-faced tent poles. A planet-sized clown attempts to squeeze through a tiny door. A fourteen-legged ringmaster conducts an orchestra of screaming moons before an audience of clocks, transparent beings and fashionable eyeballs. Between two galaxies, a tiny unicyclist crosses a tightrope. Nearby, a moon cracks like an egg and releases a miniature sun wearing clown shoes."
  },
  "stage5": {
    "name": "The Banquet of Things That Shouldn't Eat",
    "short": "The Impossible Banquet",
    "hook": "You are cordially invited. So is your appetite.",
    "text": "At a banquet without an end, the roast carves itself and the soup tries to hide. The hostess opens her mouth onto another dinner, hosted by a smaller version of herself.",
    "story": "Monumental guests in evening dress gather around a table stretching beyond the horizon. One dignified guest is a chair in a wig. A roast chicken sits upright to carve itself; terrified frosting creatures occupy tiny rooms inside a tower of cakes. Forks fight over knives beneath a chandelier of glowing eyes. At the far end, the hostess opens her mouth to reveal a second banquet, complete with a smaller version of herself."
  },
  "stage6": {
    "name": "The Library of Unborn Yesterdays",
    "short": "The Unborn Library",
    "hook": "Every fight has been written. None has happened yet.",
    "text": "Inside a sleeping god’s skull, books shelter tiny cities and clocks disagree with time. A many-armed librarian tends shelves that fold back into themselves.",
    "story": "Bookshelves twist upward into clouds and doorways lead back into the same room. Within books, tiny cities live instead of printed words; one open volume contains people reenacting a fight that has not happened yet. Clocks with skeletal arms disagree above a floor of photographs showing events that never existed. A librarian with a face of tightly packed library cards reaches the highest shelves with dozens of jointed arms. Behind her, a giant book reveals the library from a new impossible perspective on every page."
  },
  "stage7": {
    "name": "The Day Gravity Resigned",
    "short": "Gravity Resigned",
    "hook": "The floor used to have a very simple job.",
    "text": "Railways loop through floating islands while a waterfall pours sideways past an upside-down city.",
    "story": "Gravity left before the morning trains. By noon, the houses were hanging from their chimneys and the river was pouring past the station sideways. The conductor still announces the next stop. Nobody can agree whether it is above or below them."
  },
  "stage8": {
    "name": "The Tuesday That Happened Twice",
    "short": "Tuesday Twice",
    "hook": "At 3:17, everyone gets another first chance.",
    "text": "A broken clock folds different eras over the same afternoon. The station keeps punching the same ticket.",
    "story": "The birthday candles went out at 3:17. At 3:17 they were lit again. Outside, a trolley rattled past a dinosaur while film strips unspooled across the sky. The station clerk punched two identical tickets and wondered which one had already been used."
  },
  "stage10": {
    "name": "Zanda Infinity", "short": "Zanda Infinity",
    "hook": "Where the music becomes the world.",
    "text": "The studio is recording. The archive is open. The signal is live.",
    "story": "Every world begins somewhere. Some begin with a melody, a story, or an idea that refuses to stay where it belongs. At Zanda, the work does not always end when the recording stops. A studio. An archive. A transmission. Three sides of the same operation. The equipment is functioning. The masters are accounted for. The signal remains active. Everything appears to be in order. Probably."
  },
  "stage9": {
    "name": "The World That Forgot Its Shape",
    "short": "Forgot Its Shape",
    "hook": "Someone is still drawing the far side of the world.",
    "text": "A painted city peels back into pencil lines, and the unfinished pages hang over the rooftops.",
    "story": "A hand peeled back the afternoon to see how it was drawn. The towers lost their colors first. Then a man walked past his own penciled outline, which kept going after he stopped. Somewhere below, a painter is trying to remember what belongs in the empty space."
  }
};
export function escapeHtml(value:string):string{return value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
export function fighterPortrait(id:string):string{const base=import.meta.env.BASE_URL||'/';
 if(isPack03PilotId(id))return base+'fighter-art-pack-03-v1/'+id+'-idle.png';
 return FIGHTER_PRESENTATION[id]?base+'menu-art/'+id+'.png':''; }
