# Open the Sky

Expo (iOS + Android) prototype of a real-sky viewer: Hipparcos stars, constellations, Sun/Moon/planets, birth-sky facts, a shareable 1080×1920 story, and a Live mode that follows the phone’s rear camera.

## Run

```bash
npm install
npx expo start
```

Then open in Expo Go (SDK 55) or a simulator. Location is requested on first sky open; Live mode needs a physical device (compass).

## Layout

- `src/i18n` — locale tables
- `src/sky` — catalogue, math, ephemeris, scene projection
- `src/features` — screens (home, open-sky, birth-sky, same-sky, profile)
- `assets/data/sky.json` — bundled star catalogue from [d3-celestial](https://github.com/ofrohn/d3-celestial)

Regenerate the catalogue (optional):

```bash
CELESTIAL_DATA=/path/to/d3-celestial/data npm run build:sky
```
