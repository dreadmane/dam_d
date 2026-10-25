// The rules snapshot's manifest (data/rules/, the D&D SRD 5.2.1's public
// tier, synced from the workspace's domains/dnd-rules/data/). Only the
// manifest is in the startup bundle; the rules themselves load when a sheet
// first needs them (load.ts).

import manifestJson from '../../data/rules/manifest.json'

// What a saved character records as its gameDataVersion.
export const rulesVersion: string = manifestJson.rulesVersion

// The SRD's licence statement, which CC-BY-4.0 asks the app to carry where it
// shows the SRD's text (Settings shows it).
export const rulesAttribution: string = manifestJson.attribution
