# Model inventory: `planar_wrist_fallbackB.osim`

* OpenSim version: 4.6
* Model name: `planar_wrist_fallbackB`
* Gravity: ~[0,-9.80665,0]
* Coordinates: 1, muscles: 2, bodies: 2, joints: 2, constraints: 0, forces: 2
* Moment arms evaluated at the default pose; |r| > 0.1 mm counts as spanning.

## Coordinates

| name | joint | type | default | range | locked | clamped |
|---|---|---|---|---|---|---|
| `wrist_flexion` | wrist | rot | 0.0° | [-60.0°, 70.0°] | False | False |

## Muscles

| name | class | F_max (N) | l_opt (m) | l_ts (m) | spans (moment arm) |
|---|---|---|---|---|---|
| `EXT_lumped` | Millard2012EquilibriumMuscle | 782.4 | 0.0700 | 0.2250 | wrist_flexion (-11.8 mm) |
| `FLX_lumped` | Millard2012EquilibriumMuscle | 887.7 | 0.0600 | 0.2350 | wrist_flexion (+18.5 mm) |

## Bodies

| name | mass (kg) | COM in body frame (m) |
|---|---|---|
| `forearm` | 1.2000 | (-0.1500, 0.0000, 0.0000) |
| `hand` | 0.4500 | (0.0560, 0.0000, 0.0000) |

## Joints

| name | class | parent | child | coordinates |
|---|---|---|---|---|
| `ground_forearm` | WeldJoint | ground | forearm |  |
| `wrist` | PinJoint | forearm | hand | wrist_flexion |
