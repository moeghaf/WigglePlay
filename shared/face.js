/* Shared face tracker for games that follow where a child is looking.
   Usage (from a <script type="module">):
     import { createFaceTracker } from "../../shared/face.js";
     const tracker = await createFaceTracker(videoElement);
     const f = tracker.read();   // call each frame
   read() returns:
     present  true when a face is found
     head     head turn, about -0.3 to 0.3; positive = turned towards the right side of the screen
     eyes     eye direction, about -1 to 1; positive = looking towards the right side of the screen
     closed   0 (eyes open) to 1 (eyes closed)
   Everything runs on the device. Nothing is recorded or sent. */
import { FaceLandmarker, FilesetResolver } from "./mediapipe/vision_bundle.mjs";

const BASE = new URL("./mediapipe/", import.meta.url).href;
const NOSE = 1, SIDE_A = 234, SIDE_B = 454;   // nose tip and the two sides of the face

export async function createFaceTracker(video) {
  const fileset = await FilesetResolver.forVisionTasks(BASE + "wasm");
  const make = (delegate) => FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: BASE + "face_landmarker.task", delegate: delegate },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true
  });
  let landmarker;
  try { landmarker = await make("GPU"); } catch (e) { landmarker = await make("CPU"); }

  const none = { present: false, head: 0, eyes: 0, closed: 0 };
  let last = none, lastTs = -1;

  function read() {
    if (video.readyState < 2 || !video.videoWidth) return last;
    const ts = performance.now();
    if (ts - lastTs < 30) return last;          // about 30 readings a second
    lastTs = ts;
    let r;
    try { r = landmarker.detectForVideo(video, ts); } catch (e) { return last; }
    if (!r || !r.faceLandmarks || !r.faceLandmarks.length) { last = none; return last; }

    const p = r.faceLandmarks[0];
    const width = Math.abs(p[SIDE_B].x - p[SIDE_A].x);
    const mid = (p[SIDE_A].x + p[SIDE_B].x) / 2;
    // The camera image is not mirrored: turning towards screen-right moves the nose to image-left.
    const head = width > 0 ? -(p[NOSE].x - mid) / width : 0;

    const s = {};
    const shapes = r.faceBlendshapes && r.faceBlendshapes[0] ? r.faceBlendshapes[0].categories : [];
    for (const c of shapes) s[c.categoryName] = c.score;
    const g = (k) => s[k] || 0;
    // "Left" and "Right" in these names are the child's own left and right.
    const lookRight = (g("eyeLookOutRight") + g("eyeLookInLeft")) / 2;
    const lookLeft = (g("eyeLookOutLeft") + g("eyeLookInRight")) / 2;
    last = {
      present: true,
      head: head,
      eyes: lookRight - lookLeft,
      closed: (g("eyeBlinkLeft") + g("eyeBlinkRight")) / 2
    };
    return last;
  }
  return { read: read };
}
