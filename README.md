# Camera Toy

A web page built for disabled children to interact with a screen through movement. Any movement in front of the camera brings up simple colour and sound.

**Try it:** https://moeghaf.github.io/camera-toy/

![Dark screen fills with colour on movement, blends between colours, then fades out](docs/demo.gif)

*Silent demo, captured with a simulated camera. The real page plays gentle music.*

## Use

1. Open the link and allow the camera.
2. Stand the device so the child is inside the dashed box.
3. Press **Calibrate at rest**, then **Start**. Space pauses.

On iPhone, switch silent mode off to hear the music.

## Gentle and private

- Colour and sound only fade and blend. Nothing flashes.
- The adult sets the limits for brightness, volume and session length.
- Video stays on the device. Nothing is recorded or sent.

## How it works

One file, `index.html`, with no libraries. It compares each camera frame with the last and counts the pixels that changed. Music is generated in the browser.

## Limits

- Any movement in the box counts, including other people.
- Changing room light can trigger it.
- It is a toy for supervised play, not a medical device.
