/* Shared camera movement detector for every game.
   Usage:
     var motion = CameraMotion(videoElement, { onError: function (message) { ... }, columns: 4 });
     motion.start();                 // asks for the camera
     var score = motion.measure();   // call each frame; returns % of pixels that changed (0-100) in the middle zone
     motion.cols                     // with `columns` set: % changed in each column, left to right AS SEEN ON SCREEN
                                     // (like a mirror: the child's right hand is the right-hand column)
   Video is analysed on the device only. Nothing is recorded or sent. */
(function () {
  "use strict";
  window.CameraMotion = function (video, opts) {
    opts = opts || {};
    var W = 64, H = 48;
    var zone = opts.zone || { x0: 0.15, x1: 0.85, y0: 0.10, y1: 0.90 };   // matches the dashed box
    var ZX0 = Math.round(W * zone.x0), ZX1 = Math.round(W * zone.x1);
    var Y0 = Math.round(H * zone.y0), Y1 = Math.round(H * zone.y1);
    var NC = opts.columns || 0;
    var PIXEL_DIFF = opts.pixelDiff || 18;   // grey-level change that counts as a changed pixel
    var canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    var prev = null, score = 0, api;
    function fail(message) { if (opts.onError) opts.onError(message); }

    function start() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        fail("This browser cannot use the camera here. Open the page in Chrome, Edge or Safari over https.");
        return;
      }
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false })
        .then(function (stream) { video.srcObject = stream; })
        .catch(function () { fail("Camera blocked. Allow camera access for this page, then reload."); });
    }

    function measure() {
      if (video.readyState < 2) return score;
      ctx.drawImage(video, 0, 0, W, H);
      var d = ctx.getImageData(0, 0, W, H).data;
      var rows = Y1 - Y0, n = W * rows, g = new Float32Array(n), sum = 0, k = 0, x, y, i, c;
      for (y = Y0; y < Y1; y++) for (x = 0; x < W; x++) {
        i = (y * W + x) * 4;
        g[k] = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; sum += g[k]; k++;
      }
      // remove overall brightness so the screen's own glow does not count as movement
      var mean = sum / n;
      for (k = 0; k < n; k++) g[k] -= mean;
      if (prev) {
        var inZone = 0, colChanged = NC ? new Array(NC).fill(0) : null;
        for (k = 0; k < n; k++) {
          if (Math.abs(g[k] - prev[k]) > PIXEL_DIFF) {
            x = k % W;
            if (x >= ZX0 && x < ZX1) inZone++;
            // the image is not mirrored, so image-left is the right-hand side of the screen
            if (NC) colChanged[NC - 1 - Math.min(NC - 1, Math.floor(x * NC / W))]++;
          }
        }
        score = 0.5 * score + 0.5 * (100 * inZone / ((ZX1 - ZX0) * rows));
        if (NC) for (c = 0; c < NC; c++) api.cols[c] = 0.5 * api.cols[c] + 0.5 * (100 * colChanged[c] / (n / NC));
      }
      prev = g;
      return score;
    }
    api = { start: start, measure: measure, cols: NC ? new Array(NC).fill(0) : [] };
    return api;
  };
})();
