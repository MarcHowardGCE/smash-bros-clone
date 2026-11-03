# Underwater character art — first pass

Generated with the built-in image generator using the two November 2 diving studies as references. Exact prompts: assets/underwater-v1/prompts.json. Original generated sources are preserved in each character folder.

Each hero has 30 transparent frames: adult, teenage, baby; idle, six walking strides, jump, punch, kick. Runtime exports per hero: diving-atlas.png (256×192), diving-walk-atlas.png (576×192), diving-attacks.png (192×192). Visible standing/walking heights are 60, 50, and 36 pixels; feet align to source row 62. Frame metadata is in each manifest.json. Run node scripts/pack-diving.mjs bonney or luffy to rebuild.

Luffy retains red/navy/gold, straw hat, air tank, bubble helmet, yellow fins. Bonney retains pink/mint/gold, air tank, bubble helmet, pink fins. Both have opaque sleeves, full-length legs, gloves, closed boots, and covered torsos.

Bonney is a Devil Fruit user: https://one-piece.com/character/Jewelry_Bonney/ lists Toshi Toshi no Mi. Sealed protective equipment is a fan-game explanation, not a claim of a canonical exemption to sea weakness.

## Review status

Initial artwork and packed exports only; not loaded by the game yet. Bonney's hair still extends below the helmet collar in the generated artwork. Correct the helmet/hair enclosure before treating this as final sealed equipment. Review animation proportions at gameplay scale before integration. No underwater route or physics changes are included in this art pass.

## Integration plan

Use an environmental suit appearance independent of equipped powers and age damage. Losing a power must never remove sealed coverage. Preserve the selected hero and age. Harbor water entry should load an underwater route without taking fall damage. Build slower weighted walking, reduced gravity and higher grounded jumps, without free swimming. Keep cloud-to-harbor falls unchanged. Validate safe return locations, checkpoint persistence, attacks, roof/platform collision, and both heroes at all three ages.
