# Partial-charge abilities
Both powers can activate with any nonzero recovered charge, rather than waiting for 100%.
Available duration = full duration x current charge fraction.
- Egghead: 50% charge gives 2.5 seconds of lift fuel.
- Captain: 50% charge gives a 0.275-second cannonball charge (full duration 0.55 seconds).
Speed, damage and movement are unchanged; duration is the scaled property.
Activation consumes the available recharge into an active-use budget. No recharge occurs during use.
Flight fuel still drains only while supplying lift; landing begins a fresh five-second recharge.
Cannonball completion begins a fresh five-second recharge.
An empty bar cannot activate; any recovered amount can.
A different power-up pickup still equips immediately at full charge.
HUD shows charge percentage and indicates partial power is ready.
Supersedes any earlier requirement to wait for full cooldown completion.
Validation: 20 unit tests and browser smoke with partially charged flight and cannonball activation.
