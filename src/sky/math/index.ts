export { DEG2RAD, RAD2DEG, TWO_PI, clamp, normalizeAz, lerp, lerpAz, angularDistance } from "./angles";
export { getLocalSiderealTime, julianDay, obliquity } from "./time";
export { makeHorizontalTransform, type Horizontal, type HorizontalVec } from "./equatorial";
export { focalScale, magLimitForFov } from "./fov";
export {
  STAR_BUCKETS,
  BUCKET_SIZE,
  BUCKET_OPACITY,
  starBucket,
  starColor,
  type StarBucket,
} from "./stars";
export { COMPASS_8, compassLabel, fmtDeg, fmtAlt, type CompassPoint } from "./labels";
export { FEATURE_MAG, starDisc, withAlpha, type StarDisc } from "./appearance";
