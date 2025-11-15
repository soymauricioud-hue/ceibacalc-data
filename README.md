# CeibaCalc - Clinical data for app build

This repository contains the clinical reference files required by Jules (or other AIs) to build CeibaCalc.

Structure:
- /farmacos/farmacos.json     -> Presets for drugs, concentrations, bolus and CRI ranges (extracted from the manual)
- /config/guidelines.json     -> Clinical guidelines and validation rules (WSAVA/AAHA/ACVIM/IRIS)
- /protocols/fluidos.json     -> Fluid therapy protocol defaults (maintenance, deficits, GI losses)

Workflow:
1. Upload these files to your GitHub repo.
2. Open each file in GitHub and click "Raw" to obtain the RAW URL.
3. Use the Jules prompt (provided separately) and paste the RAW URLs so Jules can build the app using these authoritative inputs.

Notes:
- The farmacos.json file includes raw lines extracted from the manual. Review and adjust concentrations if your clinic uses different ampoule strengths.
- The guidelines.json file includes default ranges; these are editable via a config UI in the app.

License: MIT recommended.