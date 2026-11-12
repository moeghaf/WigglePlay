<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.png">
  <img src="assets/logo-light.png" alt="WigglePlay" width="360">
</picture>

Free games built for disabled children to interact with a screen through movement. Any movement in front of the camera brings up simple colour and sound.

**Play:** https://moeghaf.github.io/camera-toy/

![Dark screen fills with colour on movement, blends between colours, then fades out](docs/demo.gif)

*Silent demo of Colours, captured with a simulated camera.*

## Games

| Game | What happens | Play |
| --- | --- | --- |
| **Colours** | Movement fills the screen with slowly blending colour and gentle music | [Open](https://moeghaf.github.io/camera-toy/games/colours/) |
| **Animal Walk** | An animal walks towards the side the child looks at, and sleeps when their eyes close | [Open](https://moeghaf.github.io/camera-toy/games/animal-walk/) |

More to come.

## Collaborate

Want to work on this together? That would be great. Email [moeghaf@gmail.com](mailto:moeghaf@gmail.com) or [open an issue](https://github.com/moeghaf/camera-toy/issues) to say hello, or to ask for a specific game to be built for your child.

You could even try vibe coding a game yourself. It is very easy to do:

1. Copy `games/colours/` to a new folder under `games/`.
2. Ask an AI coding assistant to change what happens on movement.
3. Add your game to the list on `index.html` and in this README.

`shared/motion.js` detects movement and `shared/face.js` tracks head turns, eye direction and eye closing, for any game to use.

## Gentle and private

- Colour and sound only fade and blend. Nothing flashes.
- The adult sets the limits for brightness, volume and session length.
- Video stays on the device. Nothing is recorded or sent.

These are toys for supervised play, not medical devices.
