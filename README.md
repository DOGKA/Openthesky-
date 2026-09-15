# Open the Sky

An iOS and Android app that computes the real sky — not an illustration of it. Give it a place and a moment and it puts 5044 Hipparcos stars, 88 constellations, the Sun, the Moon and five planets where they actually stood, then lets you point a telescope at any patch of it, look up the sky of the minute you were born, and compare that sky with someone else's.

Everything is drawn with Skia from a bundled catalogue. No tiles, no network, no astrology service: the app does its own astronomy.

## What it does

### Home

Your profiles and your friends', a live count of how long the light from a given star has been travelling, the sky as it is right now for your location, and a language switch. Friend profiles scroll as a carousel.

### Open the sky

The sky is cut into 17 sectors: one zenith cap above 70°, then eight compass directions in a high band (35°–70°) and eight in a low band (horizon–35°). The overview draws them as an azimuthal-equidistant radar — the horizon as the outer circle, the zenith at the centre — with the stars, constellation lines and planets of that moment. Tap a sector and it opens as a telescope:

- **Pan and pinch** to aim and zoom, the way a photo app behaves. A tighter field earns fainter stars: the magnitude limit slides from 4.2 at 75° down to 6.0 at 6°.
- **Star rendering** follows brightness — a coloured disc from the star's B−V index, a glow that grows with magnitude, and diffraction spikes on the brightest few, so a wide field reads as a dusting and a tight one as a real eyepiece.
- **Live mode** takes the aim from the phone's compass and motion sensors, so holding the phone up shows what is behind it. Needs a physical device.
- **Time scrubber** drags the whole sky forward and backward, with jumps to your birth minute, now, and your next birthday.
- **HUD** reads out altitude, azimuth, field of view, magnitude limit, local sidereal time and whatever object is currently centred in the reticle.

### Birth sky

The sky over your birthplace at your birth minute: the star that stood at your zenith and how far its light has travelled, the constellation rising in the east, the Moon's phase and sign, which planets were up, and whether it was night.

### Poster

The same sky composed as a 1080×1920 image you can share — the star field, the horizon, your name, the date and the coordinates.

### Same sky

Two profiles side by side: how much of their sky overlapped as a percentage, each one's zenith star and the angle between them, what was rising for each, both Moons with their real phase drawn, and the constellations split into shared, only-yours and only-theirs. Each constellation carries its own stick figure, projected from the catalogue lines rather than picked from an icon set.

## How the sky is computed

| Step | Where | What happens |
| --- | --- | --- |
| Catalogue | `src/sky/catalog.ts` | 5044 stars to magnitude 6, 215 named, 88 constellations with 893 line vertices. Each star's equatorial unit vector is computed once at load. |
| Sidereal time | `src/sky/math/time.ts` | Julian day, then Greenwich mean sidereal time plus longitude. |
| Equatorial → horizontal | `src/sky/math/equatorial.ts` | One rotation built from local sidereal time and latitude, applied to the precomputed vectors. Returns altitude, azimuth and the horizontal unit vector. |
| Telescope | `src/sky/scene/build.ts` | Gnomonic (tangent plane) projection: the view direction becomes a basis and each star is three dot products, with points behind the tangent plane culled by sign. |
| Radar | `src/features/open-sky/radar` | Azimuthal equidistant: radius linear in 90° − altitude. |
| Sun, Moon, planets | `src/sky/ephemeris` | Kepler elements solved per date for the planets, a low-order lunar series for the Moon's position, phase and illumination, and the ecliptic longitude reduced to a zodiac sign. |

## Stack

Expo SDK 55 on React Native 0.83, `@shopify/react-native-skia` for all 2D drawing, Gesture Handler and Reanimated for the interactions, `expo-location` for the observer, `expo-sensors` (DeviceMotion and Magnetometer) for Live mode, `expo-sharing` for the poster. TypeScript throughout, path alias `@/` to `src`.

## Run it

```bash
npm install
npx expo start
```

Press `i` for the iOS simulator or `a` for Android.

### On a real phone

```bash
npx expo start
```

Scan the QR code with Expo Go (SDK 55) on the same Wi-Fi. A physical device is the only way to try Live mode, since the simulator has no compass. For a fair read on speed, start the server the way a shipped build behaves:

```bash
npx expo start --no-dev --minify
```

## Languages

English, Turkish, German and Spanish, switchable from the home screen. Constellation, star, planet and zodiac names all come from the catalogue per locale; dates and numbers go through `Intl`.

## Regenerating the catalogue

`assets/data/sky.json` (208 KB) is built from [d3-celestial](https://github.com/ofrohn/d3-celestial)'s data. Clone it next to this project and the script finds it:

```bash
git clone https://github.com/ofrohn/d3-celestial.git ../d3-celestial
npm run build:sky
```

Anywhere else, point it there explicitly:

```bash
CELESTIAL_DATA=/path/to/d3-celestial/data npm run build:sky
```

Stars are stored as compact tuples — `[ra, dec, mag, bv, lightYears, name, designation]` — to keep the bundle small.

## Layout

```
src/
  sky/          catalogue, math, ephemeris, scene projection, insights
  features/     home, open-sky, birth-sky, same-sky, profile
  components/   mono text, panels, drawn glyphs
  i18n/         locale tables for en, tr, de, es
  profiles/     profile model, cities, example people
  providers/    locale and profile context
scripts/
  build-sky-data.js
assets/data/sky.json
```

## Performance notes

The heavy work is the sky frame: every star and constellation vertex placed for one instant. Two measurements shaped the current code.

- **The frame costs 0.5 ms, not 11.6 ms.** Building each star as `{ ...star, ...horizontal }` spent ~11 ms per frame on 5044 objects; writing the fields out explicitly brought the same work to 0.25 ms, and the whole frame from 11.6 ms to 0.52 ms — measured on desktop V8, with the results agreeing to 1.65e-13 degrees. Object spread, not trigonometry, was the cost.
- **Projection is vector algebra.** Stars carry their horizontal unit vector, so the telescope projects with dot products and rejects everything behind the tangent plane with a sign test instead of trigonometry per star per frame.
- **Gestures don't wake the JS thread.** Pan and pinch run as worklets and move the drawn sky on the UI thread; the scene is rebuilt once, when the finger lifts. The scene is built with a margin around the viewport so a drag reveals real stars rather than empty edges.
- **The time scrubber separates label from sky.** The date label and ruler follow the finger exactly while the sky frame is recomputed on a throttled value, so a fast drag doesn't queue dozens of full sky rebuilds.
- **The HUD readout is throttled** to ~100 ms and the telescope is memoized, so aiming doesn't re-render the panels around it.

Dev mode is the slowest thing in the loop; anything measured through Expo Go with the dev server attached is not the speed of the app.

## Credits

Star and constellation data from [d3-celestial](https://github.com/ofrohn/d3-celestial) (Hipparcos catalogue, IAU constellation boundaries).
