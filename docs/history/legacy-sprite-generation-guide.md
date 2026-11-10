# Sprite Generation Guide for Smash Bros Clone

## Overview

This document provides comprehensive specifications for generating sprite assets to enhance the visual quality of the game. All sprites should maintain a cohesive art style while being optimized for real-time rendering in a 2D fighting game.

---

## Art Style Guidelines

### Core Aesthetic
- **Style**: Clean, modern 2D with bold outlines
- **Color Palette**: Vibrant but not oversaturated; high contrast for readability
- **Line Weight**: 2-3px black outlines for all characters and major elements
- **Shading**: Cel-shaded style with 2-3 tone levels (base, shadow, highlight)
- **Resolution**: Design at 2x scale for crisp rendering (will be scaled down in-engine)

### Technical Constraints
- **Format**: PNG with transparency (alpha channel)
- **Color Depth**: 32-bit RGBA
- **Max Sprite Size**: 512x512px per sprite sheet
- **Background**: Fully transparent (alpha = 0)
- **Anti-aliasing**: Minimal on outlines; use pixel-perfect edges where possible

---

## Character Sprites

### Fighter Sprite Sheet Specifications

**Dimensions**: 512x512px sprite sheet  
**Individual Sprite Size**: 64x64px base (can vary by animation)  
**Layout**: Grid-based, organized by animation state

#### Required Animation States

1. **Idle** (4 frames, looping)
   - Subtle breathing animation
   - Weight shift between feet
   - Frame timing: 8 frames per sprite (480ms total loop)

2. **Walk** (6 frames, looping)
   - Full walk cycle
   - Foot placement clear and grounded
   - Frame timing: 4 frames per sprite (360ms total loop)

3. **Run** (6 frames, looping)
   - Dynamic forward lean
   - Speed lines optional
   - Frame timing: 3 frames per sprite (270ms total loop)

4. **Jump Squat** (3 frames, one-shot)
   - Crouch preparation
   - Anticipation pose
   - Frame timing: 2 frames per sprite (90ms total)

5. **Airborne** (2 frames, looping)
   - Neutral air pose
   - Slight rotation/tumble
   - Frame timing: 6 frames per sprite (180ms total loop)

6. **Fast Fall** (1 frame, static)
   - Downward diving pose
   - Speed lines pointing down

7. **Landing** (2 frames, one-shot)
   - Impact crouch
   - Recovery to idle
   - Frame timing: 3 frames per sprite (90ms total)

8. **Shield** (1 frame, static)
   - Defensive crouch
   - Shield bubble (separate layer, 80% opacity)

9. **Hitstun** (3 frames, looping)
   - Impact reaction
   - Tumbling motion
   - Frame timing: 2 frames per sprite (90ms total loop)

10. **Attack Animations** (varies by move)
    - **Jab**: 3 frames (startup, active, recovery)
    - **Forward Tilt**: 4 frames
    - **Up Tilt**: 4 frames
    - **Down Tilt**: 3 frames
    - **Forward Smash**: 6 frames (charge, release, active, recovery)
    - **Up Smash**: 6 frames
    - **Down Smash**: 6 frames
    - **Neutral Air**: 4 frames
    - **Forward Air**: 4 frames
    - **Back Air**: 4 frames
    - **Up Air**: 4 frames
    - **Down Air**: 5 frames (spike emphasis)

11. **Special Moves** (varies)
    - **Neutral Special**: 5 frames
    - **Side Special**: 6 frames
    - **Up Special**: 8 frames (recovery move)
    - **Down Special**: 4 frames (counter)

12. **Grab & Throw** (varies)
    - **Grab**: 3 frames
    - **Pummel**: 2 frames (looping)
    - **Forward Throw**: 5 frames
    - **Back Throw**: 5 frames
    - **Up Throw**: 5 frames
    - **Down Throw**: 5 frames

13. **Ledge Actions**
    - **Ledge Hang**: 2 frames (looping)
    - **Ledge Climb**: 4 frames
    - **Ledge Attack**: 5 frames
    - **Ledge Roll**: 5 frames
    - **Ledge Jump**: 4 frames

#### Character Design Specifications

**Fighter 1: "All-Rounder"**
- **Archetype**: Balanced fighter, medium build
- **Height**: 56px (standing)
- **Color Scheme**: Primary blue, secondary white, accent red
- **Design Notes**:
  - Human-like proportions
  - Athletic build
  - Simple, iconic silhouette
  - Easily distinguishable from distance

**Slot Variations** (for 4-player matches):
- **Slot 1**: Blue/white/red (default)
- **Slot 2**: Red/black/yellow
- **Slot 3**: Green/white/black
- **Slot 4**: Purple/white/gold

Each slot variation should maintain the same silhouette with only color palette changes.

---

## Stage Elements

### Main Platform

**Dimensions**: 1280x100px  
**Style**: Solid, grounded platform with depth

**Layers**:
1. **Top Surface** (1280x20px)
   - Flat, walkable surface
   - Subtle texture (wood grain, metal panels, or stone)
   - Highlight edge for depth

2. **Front Face** (1280x80px)
   - Visible from side view
   - Shading to show depth
   - Optional details (rivets, panels, cracks)

**Color Palette**:
- Base: #3a3a3a (dark gray)
- Highlight: #5a5a5a (medium gray)
- Shadow: #1a1a1a (near black)
- Edge: #ffffff (white, 50% opacity)

### Soft Platforms

**Dimensions**: 300x20px each  
**Quantity**: 2 platforms

**Design**:
- Semi-transparent (70% opacity)
- Floating appearance
- Subtle glow or energy effect
- Pass-through visual indicator (dotted underside)

**Positions**:
- Left platform: x=340, y=350
- Right platform: x=640, y=350

### Background Layers

#### Layer 1: Far Background (Parallax 0.1x)
**Dimensions**: 1920x1080px  
**Content**: Distant scenery
- Mountains, cityscape, or abstract shapes
- Muted colors (desaturated)
- Minimal detail
- Atmospheric perspective (lighter, bluer)

#### Layer 2: Mid Background (Parallax 0.3x)
**Dimensions**: 1920x1080px  
**Content**: Mid-distance elements
- Trees, buildings, or geometric patterns
- Medium saturation
- More detail than far background
- Depth separation clear

#### Layer 3: Near Background (Parallax 0.6x)
**Dimensions**: 1920x1080px  
**Content**: Close environmental elements
- Foreground objects (pillars, walls)
- Full saturation
- High detail
- Frame the action without obscuring

### Blast Zone Indicators

**Visual Style**: Subtle warning zones at screen edges

**Specifications**:
- **Left/Right**: 40px wide vertical gradient
  - Inner edge: transparent
  - Outer edge: red (20% opacity)
- **Top**: 40px tall horizontal gradient
  - Inner edge: transparent
  - Outer edge: red (20% opacity)
- **Bottom**: 40px tall horizontal gradient
  - Inner edge: transparent
  - Outer edge: red (30% opacity, more dangerous)

---

## UI Elements

### HUD Components

#### Damage Percentage Display
**Dimensions**: 80x40px per player  
**Style**: Bold, readable numbers

**Design**:
- Large percentage number (32px font equivalent)
- Player color indicator (4px border)
- Background: semi-transparent black (60% opacity)
- Outline: 2px white stroke on numbers
- Glow effect when damage > 100%

#### Stock Icons
**Dimensions**: 24x24px per stock  
**Quantity**: 3 per player (default)

**Design**:
- Simplified fighter silhouette
- Filled = stock available (player color)
- Outlined = stock lost (gray, 30% opacity)
- Slight spacing between icons (4px)

#### Timer Display
**Dimensions**: 120x50px  
**Position**: Top center

**Design**:
- Digital-style numbers
- Format: MM:SS
- Background: semi-transparent black
- Border: 2px white
- Warning state (< 30s): pulsing red

### Menu UI

#### Button Styles
**Dimensions**: Variable (min 200x60px)

**States**:
1. **Normal**: White border, black fill, white text
2. **Hover**: White fill, black text, subtle glow
3. **Pressed**: Gray fill, white text, inset shadow
4. **Disabled**: Gray border, dark gray fill, gray text (50% opacity)

#### Character Select Portraits
**Dimensions**: 128x128px per character

**Design**:
- Head/upper body shot
- Dramatic angle
- High contrast lighting
- Character name below (16px font)
- Border: 4px (player color when selected)

#### Stage Select Thumbnails
**Dimensions**: 200x112px (16:9 aspect ratio)

**Design**:
- Miniature stage view
- Key landmarks visible
- Platform layout clear
- Border: 2px white
- Hover state: 4px glowing border

---

## Visual Effects (VFX)

### Impact Effects

#### Hit Spark
**Dimensions**: 64x64px sprite sheet (4 frames)  
**Animation**: One-shot, 120ms total

**Design**:
- Explosive burst shape
- Bright white core
- Colored outer ring (based on attack type)
- Frame 1: Small burst (16x16px)
- Frame 2: Peak expansion (64x64px)
- Frame 3: Fade (48x48px, 60% opacity)
- Frame 4: Dissipate (32x32px, 20% opacity)

#### Damage Numbers (Optional)
**Dimensions**: 32x32px per digit  
**Animation**: Pop-up and fade, 500ms

**Design**:
- Bold numbers
- Slight 3D effect (drop shadow)
- Color: white with red outline
- Scale: 100% → 120% → 100% → fade

### Movement Effects

#### Dash Dust
**Dimensions**: 48x32px sprite sheet (3 frames)  
**Animation**: One-shot, 180ms

**Design**:
- Ground-level dust cloud
- Horizontal motion blur
- Frame 1: Small puff
- Frame 2: Expanded cloud
- Frame 3: Dissipating (50% opacity)

#### Jump Dust
**Dimensions**: 48x24px sprite sheet (3 frames)  
**Animation**: One-shot, 150ms

**Design**:
- Ground impact burst
- Upward motion
- Similar to dash dust but vertical emphasis

#### Landing Dust
**Dimensions**: 64x32px sprite sheet (4 frames)  
**Animation**: One-shot, 200ms

**Design**:
- Bilateral dust clouds
- Outward spread from landing point
- Intensity scales with fall speed

#### Air Dodge Trail
**Dimensions**: 80x40px sprite sheet (3 frames)  
**Animation**: One-shot, 150ms

**Design**:
- Motion blur trail
- Directional (follows dodge direction)
- Fades quickly
- Semi-transparent (40% opacity)

### Special Effects

#### Shield Bubble
**Dimensions**: 80x80px (single frame, animated via code)

**Design**:
- Spherical energy shield
- Gradient: opaque center → transparent edge
- Color: light blue (#4da6ff, 60% opacity)
- Hexagonal pattern overlay (subtle)
- Shrinks as shield depletes

#### Counter Flash
**Dimensions**: 96x96px sprite sheet (3 frames)  
**Animation**: One-shot, 90ms

**Design**:
- Bright white flash
- Radiating lines
- Frame 1: Instant bright (100% opacity)
- Frame 2: Expanding (70% opacity)
- Frame 3: Fade (30% opacity)

#### KO Explosion
**Dimensions**: 128x128px sprite sheet (6 frames)  
**Animation**: One-shot, 300ms

**Design**:
- Large burst effect
- Star-shaped explosion
- Bright white core, colored outer
- Frames: expand → peak → fade
- Particle trails optional

---

## Particle Systems

### Specifications for Particle Sprites

#### Generic Particle
**Dimensions**: 8x8px  
**Shapes**: Circle, square, star, spark

**Usage**:
- Hit effects
- Movement trails
- Environmental ambiance
- Victory effects

**Color Variations**:
- White (default)
- Red (fire, damage)
- Blue (ice, energy)
- Yellow (electric, light)
- Green (poison, wind)

#### Smoke Particle
**Dimensions**: 16x16px sprite sheet (4 frames)  
**Animation**: Looping, 400ms

**Design**:
- Soft, billowing shape
- Gradual expansion
- Fade over time
- Gray scale (white → gray → transparent)

---

## Icon Set

### Action Icons (for tutorials/UI)

**Dimensions**: 48x48px each  
**Style**: Simple, bold, high contrast

**Required Icons**:
1. **Movement**: Arrow keys/D-pad
2. **Jump**: Up arrow with arc
3. **Attack**: Fist/sword icon
4. **Special**: Star burst
5. **Shield**: Shield icon
6. **Grab**: Hand icon
7. **Dodge**: Curved arrow
8. **Taunt**: Speech bubble

### Status Icons

**Dimensions**: 32x32px each

**Required Icons**:
1. **Invincible**: Sparkle/star
2. **Stunned**: Dizzy stars
3. **Charging**: Lightning bolt
4. **Grabbed**: Chain/lock
5. **Shielding**: Shield
6. **Dodging**: Blur effect

---

## Animation Timing Reference

### Frame Data Standards

**60 FPS Base**:
- 1 frame = 16.67ms
- 3 frames = 50ms (fast action)
- 6 frames = 100ms (medium action)
- 12 frames = 200ms (slow action)

**Animation Speed Guidelines**:
- **Very Fast**: 2-3 frames per sprite (jabs, dodges)
- **Fast**: 4-5 frames per sprite (tilts, aerials)
- **Medium**: 6-8 frames per sprite (smash attacks, specials)
- **Slow**: 10-12 frames per sprite (idle, walk)
- **Very Slow**: 15+ frames per sprite (taunts, victory poses)

---

## File Naming Conventions

### Character Sprites
```
fighter_[name]_[state]_[frame].png
Examples:
- fighter_allrounder_idle_01.png
- fighter_allrounder_jab_01.png
- fighter_allrounder_nair_03.png
```

### Stage Elements
```
stage_[element]_[variant].png
Examples:
- stage_platform_main.png
- stage_platform_soft_left.png
- stage_background_far.png
```

### VFX Sprites
```
vfx_[effect]_[frame].png
Examples:
- vfx_hitspark_01.png
- vfx_dashdust_02.png
- vfx_shield_bubble.png
```

### UI Elements
```
ui_[component]_[state].png
Examples:
- ui_button_normal.png
- ui_button_hover.png
- ui_stock_icon_filled.png
```

---

## Sprite Sheet Organization

### Recommended Layout

**Character Sprite Sheet** (512x512px):
```
Row 1: Idle (4), Walk (6), Run (6)
Row 2: Jump Squat (3), Airborne (2), Fast Fall (1), Landing (2), Shield (1)
Row 3: Jab (3), F-Tilt (4), U-Tilt (4), D-Tilt (3)
Row 4: F-Smash (6), U-Smash (6)
Row 5: D-Smash (6), N-Air (4), F-Air (4)
Row 6: B-Air (4), U-Air (4), D-Air (5)
Row 7: Specials (varies)
Row 8: Grab/Throw (varies)
```

**VFX Sprite Sheet** (256x256px):
```
Row 1: Hit Sparks (4 frames × 4 variants)
Row 2: Dust Effects (3 frames × 4 variants)
Row 3: Special Effects (varies)
Row 4: Particles (various sizes)
```

---

## Color Palette Reference

### Character Palettes

**Slot 1 (Blue)**:
- Primary: #2E5EAA (blue)
- Secondary: #FFFFFF (white)
- Accent: #D32F2F (red)
- Shadow: #1A3A6B (dark blue)
- Highlight: #5A8FD3 (light blue)

**Slot 2 (Red)**:
- Primary: #D32F2F (red)
- Secondary: #1A1A1A (black)
- Accent: #FFC107 (yellow)
- Shadow: #8B1F1F (dark red)
- Highlight: #FF6659 (light red)

**Slot 3 (Green)**:
- Primary: #388E3C (green)
- Secondary: #FFFFFF (white)
- Accent: #1A1A1A (black)
- Shadow: #1B5E20 (dark green)
- Highlight: #66BB6A (light green)

**Slot 4 (Purple)**:
- Primary: #7B1FA2 (purple)
- Secondary: #FFFFFF (white)
- Accent: #FFD700 (gold)
- Shadow: #4A0072 (dark purple)
- Highlight: #BA68C8 (light purple)

### Stage Palettes

**Neutral Stage**:
- Platform: #3A3A3A (dark gray)
- Background: #1A1A2E (dark blue-gray)
- Accent: #5A5A7A (medium blue-gray)
- Highlight: #FFFFFF (white, subtle)

**Alternate Themes** (for variety):
- **Sunset**: Oranges, purples, pinks
- **Forest**: Greens, browns, earth tones
- **Tech**: Blues, cyans, metallics
- **Void**: Blacks, purples, deep blues

---

## Export Settings

### For Sprite Artists

**Photoshop/GIMP**:
- Format: PNG-24
- Transparency: Yes
- Interlacing: None
- Compression: Maximum (lossless)

**Aseprite**:
- Format: PNG
- Scale: 1x (export at design resolution)
- Trim: No (maintain consistent dimensions)
- Padding: 0px

**Procreate**:
- Format: PNG
- Background: Transparent
- Maximum Resolution

### Quality Checklist

Before finalizing sprites, verify:
- ✅ Transparent background (no white/black artifacts)
- ✅ Consistent line weight across all sprites
- ✅ Proper alignment/registration for animations
- ✅ No stray pixels or artifacts
- ✅ Correct dimensions (power of 2 when possible)
- ✅ Proper naming convention followed
- ✅ Color palette consistency within character
- ✅ Readable at game resolution (test at 1x scale)

---

## Integration Notes

### For Developers

**Current Rendering System**:
- Uses PixiJS v8 for rendering
- Sprites loaded as textures
- Animations controlled via frame timing
- Color tinting available for slot variations

**Sprite Loading**:
```typescript
// Example sprite loading pattern
const texture = await Assets.load('fighter_allrounder_idle_01.png');
const sprite = new Sprite(texture);
```

**Animation System**:
- Frame-based animation
- Controlled by game state (PlayerStateEnum)
- 60 FPS target
- Interpolation for smooth movement

**Recommended Workflow**:
1. Export sprites at 2x resolution
2. Load into game engine
3. Scale down to 1x for rendering
4. Apply color tints for slot variations
5. Test at various screen resolutions

---

## Future Expansion

### Additional Characters

When creating new fighters, maintain:
- Same sprite sheet layout
- Similar animation frame counts
- Consistent art style
- Unique silhouette
- Balanced visual weight

### Stage Variations

Consider creating:
- Different time-of-day versions (day/night/sunset)
- Weather effects (rain, snow, fog)
- Seasonal variants (spring, summer, fall, winter)
- Themed stages (space, underwater, urban, fantasy)

### Cosmetic Enhancements

Potential additions:
- Victory poses (8 frames each)
- Taunt animations (varies)
- Entrance animations (varies)
- Character-specific effects
- Stage hazards (animated)
- Crowd/audience sprites

---

## AI Generation Prompts

### For AI Art Tools (Midjourney, DALL-E, Stable Diffusion)

**Character Sprite Prompt Template**:
```
2D fighting game character sprite, [pose description], clean cel-shaded style, 
bold black outlines, vibrant colors, transparent background, front view, 
64x64 pixels, pixel-perfect, game asset, high contrast, [color palette], 
professional game art, Super Smash Bros inspired
```

**Example - Idle Pose**:
```
2D fighting game character sprite, standing idle pose with subtle breathing 
animation, clean cel-shaded style, bold black outlines, blue and white color 
scheme, transparent background, front view, 64x64 pixels, athletic build, 
balanced fighter archetype, professional game art
```

**Stage Background Prompt Template**:
```
2D fighting game stage background, [theme description], parallax layer, 
[distance: far/mid/near], clean illustrated style, [color palette], 
atmospheric perspective, 1920x1080 pixels, game asset, high detail, 
platform fighter inspired
```

**VFX Prompt Template**:
```
2D game effect sprite, [effect description], transparent background, 
bright colors, motion blur, [frame number] of animation sequence, 
64x64 pixels, impact effect, professional game VFX
```

---

## Reference Materials

### Recommended Study

**Games** (for style reference):
- Super Smash Bros. Ultimate (character design, effects)
- Rivals of Aether (sprite work, clarity)
- Brawlhalla (clean UI, readability)
- Street Fighter (attack animations)
- Guilty Gear (visual effects)

**Art Resources**:
- Lospec (color palettes)
- OpenGameArt (sprite references)
- Spriters Resource (animation studies)
- Game Art 2D (tutorials)

### Color Theory

**Readability Priorities**:
1. High contrast between character and background
2. Distinct silhouettes for each player slot
3. Clear visual hierarchy (character > effects > stage)
4. Colorblind-friendly palette choices

**Contrast Ratios**:
- Character vs Background: Minimum 4.5:1
- UI Text vs Background: Minimum 7:1
- Player 1 vs Player 2: Easily distinguishable

---

## Delivery Format

### Asset Package Structure

```
sprites/
├── characters/
│   ├── allrounder/
│   │   ├── idle/
│   │   ├── walk/
│   │   ├── attacks/
│   │   └── specials/
│   └── [future_characters]/
├── stages/
│   ├── main_platform.png
│   ├── soft_platforms.png
│   └── backgrounds/
├── vfx/
│   ├── impacts/
│   ├── movement/
│   └── special/
├── ui/
│   ├── hud/
│   ├── menus/
│   └── icons/
└── particles/
```

### Documentation

Include with delivery:
- Sprite sheet layout diagrams
- Animation timing charts
- Color palette swatches
- Integration notes
- Source files (PSD, ASE, etc.)

---

## Budget Estimates

### Minimum Viable Sprites (MVP)

**Character** (1 fighter, 4 color slots):
- Core animations: ~80 sprites
- Attack animations: ~60 sprites
- Special moves: ~30 sprites
- **Total**: ~170 sprites per character × 4 colors = 680 sprites

**Stage** (1 stage):
- Platform elements: ~5 sprites
- Background layers: ~3 large images
- **Total**: ~8 assets

**VFX** (essential effects):
- Hit effects: ~20 sprites
- Movement effects: ~15 sprites
- UI effects: ~10 sprites
- **Total**: ~45 sprites

**UI** (complete interface):
- HUD elements: ~15 sprites
- Menu components: ~20 sprites
- Icons: ~30 sprites
- **Total**: ~65 sprites

### Full Production Estimate

**3 Characters**: ~2,040 sprites  
**3 Stages**: ~24 assets  
**Complete VFX Library**: ~150 sprites  
**Complete UI**: ~100 sprites  
**Particles & Misc**: ~50 sprites  

**Grand Total**: ~2,364 individual sprite assets

---

## Contact & Feedback

When delivering sprites, please provide:
- Preview images (assembled sprite sheets)
- Individual sprite files
- Animation preview GIFs
- Technical specifications document
- Revision notes

For questions or clarifications on specifications, refer to:
- Game design document: `README.md`
- Technical architecture: `ROADMAP.md`
- Current visual style: Inspect `apps/client/src/renderer/` directory

---

## Version History

**v1.0** - Initial sprite generation guide  
**Date**: 2026-08-08  
**Author**: Development Team  
**Status**: Ready for artist handoff

---

*This guide is a living document. Update as the game evolves and new sprite requirements emerge.*
