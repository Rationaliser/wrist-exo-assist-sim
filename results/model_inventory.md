# Model inventory: `MOBL_ARMS_fixed_41.osim`

* OpenSim version: 4.6
* Model name: `Right`
* Gravity: ~[0,-9.80665,0]
* Coordinates: 20, muscles: 50, bodies: 11, joints: 11, constraints: 13, forces: 68
* Moment arms evaluated at the default pose; |r| > 0.1 mm counts as spanning.

## Coordinates

| name | joint | type | default | range | locked | clamped |
|---|---|---|---|---|---|---|
| `sternoclavicular_r2` | sternoclavicular | rot | -7.3° | [-5729572.2°, 5729572.2°] | False | False |
| `sternoclavicular_r3` | sternoclavicular | rot | 3.1° | [-5729572.2°, 5729572.2°] | False | False |
| `unrotscap_r3` | unrotscap | rot | -3.1° | [-5729572.2°, 5729572.2°] | False | False |
| `unrotscap_r2` | unrotscap | rot | 7.3° | [-5729572.2°, 5729572.2°] | False | False |
| `acromioclavicular_r2` | acromioclavicular | rot | -1.5° | [-5729572.2°, 5729572.2°] | False | False |
| `acromioclavicular_r3` | acromioclavicular | rot | 11.9° | [-5729572.2°, 5729572.2°] | False | False |
| `acromioclavicular_r1` | acromioclavicular | rot | 5.3° | [-5729572.2°, 5729572.2°] | False | False |
| `unrothum_r1` | unrothum | rot | -5.3° | [-5729572.2°, 5729572.2°] | False | False |
| `unrothum_r3` | unrothum | rot | -11.9° | [-5729572.2°, 5729572.2°] | False | False |
| `unrothum_r2` | unrothum | rot | 1.5° | [-5729572.2°, 5729572.2°] | False | False |
| `elv_angle` | shoulder0 | rot | 90.0° | [-95.0°, 130.0°] | False | True |
| `shoulder_elv` | shoulder1 | rot | 30.0° | [0.0°, 180.0°] | False | True |
| `shoulder1_r2` | shoulder1 | rot | -90.0° | [-5729572.2°, 5729572.2°] | False | False |
| `shoulder_rot` | shoulder2 | rot | 0.0° | [-90.0°, 120.0°] | False | True |
| `elbow_flexion` | elbow | rot | 0.0° | [0.0°, 130.0°] | False | True |
| `pro_sup` | radioulnar | rot | -0.0° | [-90.0°, 90.0°] | False | True |
| `deviation` | radiocarpal | coupled | 0.0° | [-10.0°, 25.0°] | False | True |
| `flexion` | radiocarpal | coupled | 0.0° | [-70.0°, 70.0°] | False | True |
| `wrist_hand_r1` | wrist_hand | rot | 0.0° | [-5729572.2°, 5729572.2°] | False | False |
| `wrist_hand_r3` | wrist_hand | rot | 0.0° | [-5729572.2°, 5729572.2°] | False | False |

## Muscles

| name | class | F_max (N) | l_opt (m) | l_ts (m) | spans (moment arm) |
|---|---|---|---|---|---|
| `DELT1` | Millard2012EquilibriumMuscle | 1218.9 | 0.0976 | 0.0930 | sternoclavicular_r2 (-180.6 mm); sternoclavicular_r3 (+426.3 mm); unrotscap_r3 (-426.3 mm); unrotscap_r2 (+180.6 mm); acromioclavicular_r2 (-891.7 mm); acromioclavicular_r3 (+110.3 mm); acromioclavicular_r1 (+245.5 mm); unrothum_r1 (-245.5 mm); unrothum_r3 (-110.3 mm); unrothum_r2 (+891.7 mm); elv_angle (+2.8 mm); shoulder_elv (+43.7 mm); shoulder1_r2 (-2.8 mm); shoulder_rot (+5.7 mm) |
| `DELT2` | Millard2012EquilibriumMuscle | 1103.5 | 0.1078 | 0.1095 | sternoclavicular_r2 (-54.2 mm); sternoclavicular_r3 (+128.0 mm); unrotscap_r3 (-128.0 mm); unrotscap_r2 (+54.2 mm); acromioclavicular_r2 (-267.9 mm); acromioclavicular_r3 (+33.1 mm); acromioclavicular_r1 (+73.7 mm); unrothum_r1 (-73.7 mm); unrothum_r3 (-33.1 mm); unrothum_r2 (+267.9 mm); elv_angle (-14.2 mm); shoulder_elv (+13.1 mm); shoulder1_r2 (+14.2 mm); shoulder_rot (+5.2 mm) |
| `DELT3` | Millard2012EquilibriumMuscle | 201.6 | 0.1367 | 0.0380 | sternoclavicular_r2 (+99.7 mm); sternoclavicular_r3 (-235.4 mm); unrotscap_r3 (+235.4 mm); unrotscap_r2 (-99.7 mm); acromioclavicular_r2 (+492.4 mm); acromioclavicular_r3 (-60.9 mm); acromioclavicular_r1 (-135.6 mm); unrothum_r1 (+135.6 mm); unrothum_r3 (+60.9 mm); unrothum_r2 (-492.4 mm); elv_angle (-1.7 mm); shoulder_elv (-24.1 mm); shoulder1_r2 (+1.7 mm); shoulder_rot (-7.1 mm) |
| `SUPSP` | Millard2012EquilibriumMuscle | 499.2 | 0.0682 | 0.0395 | sternoclavicular_r2 (+13.0 mm); sternoclavicular_r3 (-30.6 mm); unrotscap_r3 (+30.6 mm); unrotscap_r2 (-13.0 mm); acromioclavicular_r2 (+64.0 mm); acromioclavicular_r3 (-7.9 mm); acromioclavicular_r1 (-17.6 mm); unrothum_r1 (+17.6 mm); unrothum_r3 (+7.9 mm); unrothum_r2 (-64.0 mm); elv_angle (-14.4 mm); shoulder_elv (-3.1 mm); shoulder1_r2 (+14.4 mm); shoulder_rot (+1.3 mm) |
| `INFSP` | Millard2012EquilibriumMuscle | 1075.8 | 0.0755 | 0.0308 | sternoclavicular_r2 (-21.6 mm); sternoclavicular_r3 (+51.0 mm); unrotscap_r3 (-51.0 mm); unrotscap_r2 (+21.6 mm); acromioclavicular_r2 (-106.7 mm); acromioclavicular_r3 (+13.2 mm); acromioclavicular_r1 (+29.4 mm); unrothum_r1 (-29.4 mm); unrothum_r3 (-13.2 mm); unrothum_r2 (+106.7 mm); elv_angle (-1.3 mm); shoulder_elv (+5.2 mm); shoulder1_r2 (+1.3 mm); shoulder_rot (-22.0 mm) |
| `SUBSC` | Millard2012EquilibriumMuscle | 1306.9 | 0.0873 | 0.0330 | sternoclavicular_r2 (+37.2 mm); sternoclavicular_r3 (-87.7 mm); unrotscap_r3 (+87.7 mm); unrotscap_r2 (-37.2 mm); acromioclavicular_r2 (+183.5 mm); acromioclavicular_r3 (-22.7 mm); acromioclavicular_r1 (-50.5 mm); unrothum_r1 (+50.5 mm); unrothum_r3 (+22.7 mm); unrothum_r2 (-183.5 mm); elv_angle (-9.9 mm); shoulder_elv (-9.0 mm); shoulder1_r2 (+9.9 mm); shoulder_rot (+19.4 mm) |
| `TMIN` | Millard2012EquilibriumMuscle | 269.5 | 0.0741 | 0.0713 | sternoclavicular_r2 (+2.2 mm); sternoclavicular_r3 (-5.2 mm); unrotscap_r3 (+5.2 mm); unrotscap_r2 (-2.2 mm); acromioclavicular_r2 (+11.0 mm); acromioclavicular_r3 (-1.4 mm); acromioclavicular_r1 (-3.0 mm); unrothum_r1 (+3.0 mm); unrothum_r3 (+1.4 mm); unrothum_r2 (-11.0 mm); elv_angle (+7.0 mm); shoulder_elv (-0.5 mm); shoulder1_r2 (-7.0 mm); shoulder_rot (-20.8 mm) |
| `TMAJ` | Millard2012EquilibriumMuscle | 144.0 | 0.1624 | 0.0200 | sternoclavicular_r2 (+134.7 mm); sternoclavicular_r3 (-318.0 mm); unrotscap_r3 (+318.0 mm); unrotscap_r2 (-134.7 mm); acromioclavicular_r2 (+665.1 mm); acromioclavicular_r3 (-82.3 mm); acromioclavicular_r1 (-183.1 mm); unrothum_r1 (+183.1 mm); unrothum_r3 (+82.3 mm); unrothum_r2 (-665.1 mm); elv_angle (+8.7 mm); shoulder_elv (-32.6 mm); shoulder1_r2 (-8.7 mm); shoulder_rot (+9.9 mm) |
| `PECM1` | Millard2012EquilibriumMuscle | 444.3 | 0.1442 | 0.0028 | sternoclavicular_r2 (-55.6 mm); sternoclavicular_r3 (+131.3 mm); unrotscap_r3 (-131.3 mm); unrotscap_r2 (+55.6 mm); acromioclavicular_r2 (-274.7 mm); acromioclavicular_r3 (+34.0 mm); acromioclavicular_r1 (+75.6 mm); unrothum_r1 (-75.6 mm); unrothum_r3 (-34.0 mm); unrothum_r2 (+274.7 mm); elv_angle (+15.6 mm); shoulder_elv (+13.5 mm); shoulder1_r2 (-15.6 mm); shoulder_rot (+16.5 mm) |
| `PECM2` | Millard2012EquilibriumMuscle | 658.3 | 0.1385 | 0.0890 | sternoclavicular_r2 (+45.8 mm); sternoclavicular_r3 (-108.1 mm); unrotscap_r3 (+108.1 mm); unrotscap_r2 (-45.8 mm); acromioclavicular_r2 (+226.2 mm); acromioclavicular_r3 (-28.0 mm); acromioclavicular_r1 (-62.3 mm); unrothum_r1 (+62.3 mm); unrothum_r3 (+28.0 mm); unrothum_r2 (-226.2 mm); elv_angle (+17.3 mm); shoulder_elv (-11.1 mm); shoulder1_r2 (-17.3 mm); shoulder_rot (+14.2 mm) |
| `PECM3` | Millard2012EquilibriumMuscle | 498.1 | 0.1385 | 0.1320 | sternoclavicular_r2 (+129.0 mm); sternoclavicular_r3 (-304.6 mm); unrotscap_r3 (+304.6 mm); unrotscap_r2 (-129.0 mm); acromioclavicular_r2 (+637.2 mm); acromioclavicular_r3 (-78.8 mm); acromioclavicular_r1 (-175.4 mm); unrothum_r1 (+175.4 mm); unrothum_r3 (+78.8 mm); unrothum_r2 (-637.2 mm); elv_angle (+13.8 mm); shoulder_elv (-31.2 mm); shoulder1_r2 (-13.8 mm); shoulder_rot (+10.3 mm) |
| `LAT1` | Millard2012EquilibriumMuscle | 290.5 | 0.2540 | 0.1200 | sternoclavicular_r2 (+117.0 mm); sternoclavicular_r3 (-276.2 mm); unrotscap_r3 (+276.2 mm); unrotscap_r2 (-117.0 mm); acromioclavicular_r2 (+577.8 mm); acromioclavicular_r3 (-71.5 mm); acromioclavicular_r1 (-159.1 mm); unrothum_r1 (+159.1 mm); unrothum_r3 (+71.5 mm); unrothum_r2 (-577.8 mm); elv_angle (+1.7 mm); shoulder_elv (-28.3 mm); shoulder1_r2 (-1.7 mm); shoulder_rot (+11.5 mm) |
| `LAT2` | Millard2012EquilibriumMuscle | 317.5 | 0.2324 | 0.1765 | sternoclavicular_r2 (+131.2 mm); sternoclavicular_r3 (-309.8 mm); unrotscap_r3 (+309.8 mm); unrotscap_r2 (-131.2 mm); acromioclavicular_r2 (+648.1 mm); acromioclavicular_r3 (-80.2 mm); acromioclavicular_r1 (-178.4 mm); unrothum_r1 (+178.4 mm); unrothum_r3 (+80.2 mm); unrothum_r2 (-648.1 mm); elv_angle (+0.3 mm); shoulder_elv (-31.8 mm); shoulder1_r2 (-0.3 mm); shoulder_rot (+10.9 mm) |
| `LAT3` | Millard2012EquilibriumMuscle | 189.0 | 0.2789 | 0.1403 | sternoclavicular_r2 (+187.9 mm); sternoclavicular_r3 (-443.5 mm); unrotscap_r3 (+443.5 mm); unrotscap_r2 (-187.9 mm); acromioclavicular_r2 (+927.8 mm); acromioclavicular_r3 (-114.8 mm); acromioclavicular_r1 (-255.4 mm); unrothum_r1 (+255.4 mm); unrothum_r3 (+114.8 mm); unrothum_r2 (-927.8 mm); elv_angle (-1.2 mm); shoulder_elv (-45.5 mm); shoulder1_r2 (+1.2 mm); shoulder_rot (+10.1 mm) |
| `CORB` | Millard2012EquilibriumMuscle | 208.2 | 0.0932 | 0.0970 | sternoclavicular_r2 (-3.5 mm); sternoclavicular_r3 (+8.2 mm); unrotscap_r3 (-8.2 mm); unrotscap_r2 (+3.5 mm); acromioclavicular_r2 (-17.1 mm); acromioclavicular_r3 (+2.1 mm); acromioclavicular_r1 (+4.7 mm); unrothum_r1 (-4.7 mm); unrothum_r3 (-2.1 mm); unrothum_r2 (+17.1 mm); elv_angle (+12.3 mm); shoulder_elv (+0.8 mm); shoulder1_r2 (-12.3 mm); shoulder_rot (+1.7 mm) |
| `TRIlong` | Millard2012EquilibriumMuscle | 771.8 | 0.1340 | 0.1430 | sternoclavicular_r2 (+86.6 mm); sternoclavicular_r3 (-204.4 mm); unrotscap_r3 (+204.4 mm); unrotscap_r2 (-86.6 mm); acromioclavicular_r2 (+427.5 mm); acromioclavicular_r3 (-52.9 mm); acromioclavicular_r1 (-117.7 mm); unrothum_r1 (+117.7 mm); unrothum_r3 (+52.9 mm); unrothum_r2 (-427.5 mm); elv_angle (+10.6 mm); shoulder_elv (-20.9 mm); shoulder1_r2 (-10.6 mm); shoulder_rot (-3.6 mm); elbow_flexion (-20.1 mm) |
| `TRIlat` | Millard2012EquilibriumMuscle | 717.5 | 0.1138 | 0.0980 | elbow_flexion (-20.1 mm) |
| `TRImed` | Millard2012EquilibriumMuscle | 717.5 | 0.1138 | 0.0908 | elbow_flexion (-20.1 mm) |
| `ANC` | Millard2012EquilibriumMuscle | 283.2 | 0.0270 | 0.0180 | elbow_flexion (-8.1 mm) |
| `SUP` | Millard2012EquilibriumMuscle | 379.6 | 0.0330 | 0.0280 | pro_sup (-10.3 mm) |
| `BIClong` | Millard2012EquilibriumMuscle | 525.1 | 0.1157 | 0.2723 | sternoclavicular_r2 (-27.9 mm); sternoclavicular_r3 (+65.9 mm); unrotscap_r3 (-65.9 mm); unrotscap_r2 (+27.9 mm); acromioclavicular_r2 (-137.8 mm); acromioclavicular_r3 (+17.1 mm); acromioclavicular_r1 (+37.9 mm); unrothum_r1 (-37.9 mm); unrothum_r3 (-17.1 mm); unrothum_r2 (+137.8 mm); elv_angle (-9.8 mm); shoulder_elv (+6.8 mm); shoulder1_r2 (+9.8 mm); shoulder_rot (+8.6 mm); elbow_flexion (+11.2 mm); pro_sup (-7.0 mm) |
| `BICshort` | Millard2012EquilibriumMuscle | 316.8 | 0.1321 | 0.1923 | sternoclavicular_r2 (+30.3 mm); sternoclavicular_r3 (-71.6 mm); unrotscap_r3 (+71.6 mm); unrotscap_r2 (-30.3 mm); acromioclavicular_r2 (+149.7 mm); acromioclavicular_r3 (-18.5 mm); acromioclavicular_r1 (-41.2 mm); unrothum_r1 (+41.2 mm); unrothum_r3 (+18.5 mm); unrothum_r2 (-149.7 mm); elv_angle (+13.8 mm); shoulder_elv (-7.3 mm); shoulder1_r2 (-13.8 mm); shoulder_rot (+5.9 mm); elbow_flexion (+11.2 mm); pro_sup (-7.0 mm) |
| `BRA` | Millard2012EquilibriumMuscle | 1177.4 | 0.0858 | 0.0535 | elbow_flexion (+10.0 mm) |
| `BRD` | Millard2012EquilibriumMuscle | 276.0 | 0.1726 | 0.1330 | elbow_flexion (+13.2 mm); pro_sup (-0.7 mm) |
| `ECRL` | Millard2012EquilibriumMuscle | 337.3 | 0.0810 | 0.2440 | elbow_flexion (+6.7 mm); pro_sup (-2.2 mm); deviation (-21.2 mm); flexion (-9.7 mm); wrist_hand_r1 (-15.6 mm); wrist_hand_r3 (-19.5 mm) |
| `ECRB` | Millard2012EquilibriumMuscle | 252.5 | 0.0585 | 0.2223 | elbow_flexion (+5.7 mm); pro_sup (-1.6 mm); deviation (-13.3 mm); flexion (-13.3 mm); wrist_hand_r1 (-9.8 mm); wrist_hand_r3 (-26.5 mm) |
| `ECU` | Millard2012EquilibriumMuscle | 192.9 | 0.0622 | 0.2285 | elbow_flexion (-6.5 mm); pro_sup (-0.7 mm); deviation (+25.1 mm); flexion (-6.3 mm); wrist_hand_r1 (+18.5 mm); wrist_hand_r3 (-12.6 mm) |
| `FCR` | Millard2012EquilibriumMuscle | 407.9 | 0.0628 | 0.2440 | elbow_flexion (+7.2 mm); pro_sup (+2.7 mm); deviation (-7.5 mm); flexion (+14.9 mm); wrist_hand_r1 (-5.5 mm); wrist_hand_r3 (+29.8 mm) |
| `FCU` | Millard2012EquilibriumMuscle | 479.8 | 0.0509 | 0.2650 | elbow_flexion (+6.7 mm); pro_sup (+1.8 mm); deviation (+21.8 mm); flexion (+14.9 mm); wrist_hand_r1 (+16.1 mm); wrist_hand_r3 (+29.8 mm) |
| `PL` | Millard2012EquilibriumMuscle | 101.0 | 0.0638 | 0.2694 | elbow_flexion (+2.1 mm); pro_sup (+3.9 mm); deviation (-2.7 mm); flexion (+22.7 mm); wrist_hand_r1 (-2.0 mm); wrist_hand_r3 (+45.5 mm) |
| `PT` | Millard2012EquilibriumMuscle | 557.2 | 0.0492 | 0.0980 | elbow_flexion (+6.5 mm); pro_sup (+9.9 mm) |
| `PQ` | Millard2012EquilibriumMuscle | 284.7 | 0.0282 | 0.0050 | pro_sup (+7.3 mm) |
| `FDSL` | Millard2012EquilibriumMuscle | 75.3 | 0.0515 | 0.3386 | elbow_flexion (+3.7 mm); pro_sup (+2.2 mm); deviation (+7.4 mm); flexion (+15.0 mm); wrist_hand_r1 (+5.4 mm); wrist_hand_r3 (+30.0 mm) |
| `FDSR` | Millard2012EquilibriumMuscle | 171.2 | 0.0736 | 0.3280 | elbow_flexion (+2.8 mm); pro_sup (+2.8 mm); deviation (+5.7 mm); flexion (+14.7 mm); wrist_hand_r1 (+4.2 mm); wrist_hand_r3 (+29.4 mm) |
| `FDSM` | Millard2012EquilibriumMuscle | 258.8 | 0.0749 | 0.2950 | pro_sup (+2.9 mm); deviation (-0.7 mm); flexion (+14.7 mm); wrist_hand_r1 (-0.5 mm); wrist_hand_r3 (+29.3 mm) |
| `FDSI` | Millard2012EquilibriumMuscle | 162.5 | 0.0835 | 0.2750 | pro_sup (+3.2 mm); deviation (-2.6 mm); flexion (+14.3 mm); wrist_hand_r1 (-1.9 mm); wrist_hand_r3 (+28.7 mm) |
| `FDPL` | Millard2012EquilibriumMuscle | 236.8 | 0.0749 | 0.2819 | pro_sup (+1.9 mm); deviation (+5.5 mm); flexion (+11.8 mm); wrist_hand_r1 (+4.0 mm); wrist_hand_r3 (+23.7 mm) |
| `FDPR` | Millard2012EquilibriumMuscle | 172.9 | 0.0798 | 0.2915 | pro_sup (+2.0 mm); deviation (+3.7 mm); flexion (+12.1 mm); wrist_hand_r1 (+2.7 mm); wrist_hand_r3 (+24.2 mm) |
| `FDPM` | Millard2012EquilibriumMuscle | 212.4 | 0.0835 | 0.3030 | pro_sup (+2.4 mm); deviation (+1.3 mm); flexion (+12.0 mm); wrist_hand_r1 (+0.9 mm); wrist_hand_r3 (+24.0 mm) |
| `FDPI` | Millard2012EquilibriumMuscle | 197.3 | 0.0749 | 0.3015 | pro_sup (+2.6 mm); deviation (-3.2 mm); flexion (+12.1 mm); wrist_hand_r1 (-2.3 mm); wrist_hand_r3 (+24.3 mm) |
| `EDCL` | Millard2012EquilibriumMuscle | 39.4 | 0.0650 | 0.3350 | elbow_flexion (-7.8 mm); pro_sup (+1.3 mm); deviation (+9.8 mm); flexion (-11.6 mm); wrist_hand_r1 (+7.2 mm); wrist_hand_r3 (-23.2 mm) |
| `EDCR` | Millard2012EquilibriumMuscle | 109.2 | 0.0626 | 0.3650 | elbow_flexion (-9.0 mm); pro_sup (+0.9 mm); deviation (+6.6 mm); flexion (-15.6 mm); wrist_hand_r1 (+4.9 mm); wrist_hand_r3 (-31.2 mm) |
| `EDCM` | Millard2012EquilibriumMuscle | 94.4 | 0.0724 | 0.3650 | elbow_flexion (-7.1 mm); pro_sup (-1.1 mm); deviation (+13.5 mm); flexion (-23.6 mm); wrist_hand_r1 (+9.9 mm); wrist_hand_r3 (-47.1 mm) |
| `EDCI` | Millard2012EquilibriumMuscle | 48.8 | 0.0700 | 0.3650 | elbow_flexion (-6.8 mm); pro_sup (+1.2 mm); deviation (-5.5 mm); flexion (-15.5 mm); wrist_hand_r1 (-4.1 mm); wrist_hand_r3 (-31.0 mm) |
| `EDM` | Millard2012EquilibriumMuscle | 72.4 | 0.0675 | 0.3350 | elbow_flexion (-6.7 mm); pro_sup (-0.6 mm); deviation (+12.3 mm); flexion (-10.3 mm); wrist_hand_r1 (+9.0 mm); wrist_hand_r3 (-20.6 mm) |
| `EIP` | Millard2012EquilibriumMuscle | 47.3 | 0.0589 | 0.2100 | pro_sup (-0.3 mm); deviation (-4.3 mm); flexion (-13.9 mm); wrist_hand_r1 (-3.2 mm); wrist_hand_r3 (-27.7 mm) |
| `EPL` | Millard2012EquilibriumMuscle | 88.3 | 0.0540 | 0.2305 | pro_sup (-1.8 mm); deviation (-9.4 mm); flexion (-6.7 mm); wrist_hand_r1 (-7.0 mm); wrist_hand_r3 (-13.5 mm) |
| `EPB` | Millard2012EquilibriumMuscle | 46.0 | 0.0675 | 0.1155 | deviation (-21.8 mm); flexion (+3.3 mm); wrist_hand_r1 (-16.1 mm); wrist_hand_r3 (+6.7 mm) |
| `FPL` | Millard2012EquilibriumMuscle | 201.0 | 0.0552 | 0.1970 | deviation (-5.8 mm); flexion (+10.9 mm); wrist_hand_r1 (-4.3 mm); wrist_hand_r3 (+21.8 mm) |
| `APL` | Millard2012EquilibriumMuscle | 116.7 | 0.0713 | 0.1295 | deviation (-21.1 mm); flexion (+7.4 mm); wrist_hand_r1 (-15.5 mm); wrist_hand_r3 (+14.8 mm) |

## Bodies

| name | mass (kg) | COM in body frame (m) |
|---|---|---|
| `clavicle` | 0.1560 | (-0.0111, 0.0064, 0.0542) |
| `clavphant` | 0.0001 | (0.0000, 0.0000, 0.0000) |
| `scapula` | 0.7040 | (-0.0547, -0.0350, -0.0437) |
| `scapphant` | 0.0001 | (0.0000, 0.0000, 0.0000) |
| `humphant` | 0.0001 | (0.0000, 0.0000, 0.0000) |
| `humphant1` | 0.0001 | (0.0000, 0.0000, 0.0000) |
| `humerus` | 1.9976 | (0.0181, -0.1401, -0.0127) |
| `ulna` | 1.1053 | (0.0097, -0.0960, 0.0243) |
| `radius` | 0.2336 | (0.0336, -0.1816, 0.0156) |
| `proximal_row` | 0.0001 | (0.0000, 0.0000, 0.0000) |
| `hand` | 0.5819 | (-0.0030, -0.0425, -0.0011) |

## Joints

| name | class | parent | child | coordinates |
|---|---|---|---|---|
| `sternoclavicular` | CustomJoint | ground | clavicle | sternoclavicular_r2, sternoclavicular_r3 |
| `unrotscap` | CustomJoint | clavicle | clavphant | unrotscap_r3, unrotscap_r2 |
| `acromioclavicular` | CustomJoint | clavphant | scapula | acromioclavicular_r2, acromioclavicular_r3, acromioclavicular_r1 |
| `unrothum` | CustomJoint | scapula | scapphant | unrothum_r1, unrothum_r3, unrothum_r2 |
| `shoulder0` | CustomJoint | scapphant | humphant | elv_angle |
| `shoulder1` | CustomJoint | humphant | humphant1 | shoulder_elv, shoulder1_r2 |
| `shoulder2` | CustomJoint | humphant1 | humerus | shoulder_rot |
| `elbow` | CustomJoint | humerus | ulna | elbow_flexion |
| `radioulnar` | CustomJoint | ulna | radius | pro_sup |
| `radiocarpal` | CustomJoint | radius | proximal_row | deviation, flexion |
| `wrist_hand` | CustomJoint | proximal_row | hand | wrist_hand_r1, wrist_hand_r3 |

## Constraints

* `sternoclavicular_r2_con` (CoordinateCouplerConstraint)
* `sternoclavicular_r3_con` (CoordinateCouplerConstraint)
* `unrotscap_r2_con` (CoordinateCouplerConstraint)
* `unrotscap_r3_con` (CoordinateCouplerConstraint)
* `acromioclavicular_r1_con` (CoordinateCouplerConstraint)
* `acromioclavicular_r2_con` (CoordinateCouplerConstraint)
* `acromioclavicular_r3_con` (CoordinateCouplerConstraint)
* `unrothum_r1_con` (CoordinateCouplerConstraint)
* `unrothum_r2_con` (CoordinateCouplerConstraint)
* `unrothum_r3_con` (CoordinateCouplerConstraint)
* `shoulder1_r2_con` (CoordinateCouplerConstraint)
* `wrist_hand_r1_con` (CoordinateCouplerConstraint)
* `wrist_hand_r3_con` (CoordinateCouplerConstraint)

## Other forces

* `s_glenohum` (Ligament)
* `m_glenohum` (Ligament)
* `i_glenohum` (Ligament)
* `coracohum` (Ligament)
* `shoulder_elv_ligaments` (CoordinateLimitForce)
* `shoulder_elv_damping` (CoordinateLimitForce)
* `elv_angle_ligaments` (CoordinateLimitForce)
* `elv_angle_damping` (CoordinateLimitForce)
* `shoulder_rot_ligaments` (CoordinateLimitForce)
* `shoulder_rot_damping` (CoordinateLimitForce)
* `elbow_flexion_ligaments` (CoordinateLimitForce)
* `elbow_flexion_damping` (CoordinateLimitForce)
* `pro_sup_ligaments` (CoordinateLimitForce)
* `pro_sup_damping` (CoordinateLimitForce)
* `deviation_ligaments` (CoordinateLimitForce)
* `deviation_damping` (CoordinateLimitForce)
* `flexion_ligaments` (CoordinateLimitForce)
* `flexion_damping` (CoordinateLimitForce)
