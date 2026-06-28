# Video Hub Live Integration Blueprint

### Hardware & Ingest Strategy:

* Capture: `navigator.mediaDevices.getUserMedia()` to enumerate local cameras.
* Ingest: Use the IVS Web Broadcast SDK when available for direct in-browser RTMPS streaming.
* Dynamic Swap: Use SDK track exchange methods, when available, to perform mid-stream camera changes without disconnecting the outgoing broadcast.

### Key Component Implementation Tasks:

1. Build the camera operator switcher panel with a 3x2 grid. Each grid cell binds a real `navigator.mediaDevices` source to a video element.
2. Implement isolated in-app mixer state to switch the Master Program Output without touching the existing HLS/live attendee pipeline.
3. Bind the Start Broadcast / Cloud Relay card to owner ingest credentials and IVS SDK availability.
4. Keep operational toggles in local dashboard state until they are intentionally wired to production chat/DVR services.
