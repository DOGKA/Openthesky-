import { Skia, type SkPath } from "@shopify/react-native-skia";

export const ASTROLIC_MARK_D =
  "M0 362.039s212.998.833 288-73.6c75.801-75.227 74.039-288.44 74.039-288.44s-2.818 213.223 73.161 288.44c74.915 74.162 288.877 73.6 288.877 73.6s-213.952-.379-288.877 73.6c-76.262 75.299-73.161 288.438-73.161 288.438S364.084 510.948 288 435.639c-75.013-74.25-288-73.6-288-73.6z";

const VIEWBOX = 725;
let base: SkPath | null = null;

export function makeAstrolicPath(cx: number, cy: number, size: number): SkPath {
  if (!base) {
    base = Skia.Path.MakeFromSVGString(ASTROLIC_MARK_D) ?? Skia.Path.Make();
  }
  const s = size / VIEWBOX;
  const path = base.copy();
  path.transform(Skia.Matrix().translate(cx - size / 2, cy - size / 2).scale(s, s));
  return path;
}
