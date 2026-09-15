# Open the Sky

Expo (iOS + Android) prototype of a real-sky viewer: Hipparcos stars, constellations, Sun/Moon/planets, birth-sky facts, a shareable 1080×1920 story, and a Live mode that follows the phone’s rear camera.

## Run

```bash
npm install
npx expo start
```

Then open in Expo Go (SDK 55) or a simulator. Location is requested on first sky open; Live mode needs a physical device (compass).

## Stack

- Expo 55 / React Native
- `@shopify/react-native-skia` for stars and the story poster
- `expo-location`, `expo-sensors` (DeviceMotion + magnetometer)
- Star catalogue bundled in `assets/data/sky.json` (from [d3-celestial](https://github.com/ofrohn/d3-celestial) + HYG distances)

Regenerate the catalogue (optional) from a checkout of d3-celestial:

```bash
CELESTIAL_DATA=/path/to/d3-celestial/data npm run build:sky
```
