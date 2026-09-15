import { Group, Line, Path, Rect, Text as SkText, vec, type SkFont } from "@shopify/react-native-skia";
import { SKY } from "@/theme";
import { makeAstrolicPath } from "@/astrolic-mark";
import type { SkyFrame } from "@/sky/frame";
import type { Locale, TFn } from "@/i18n";
import { formatDate, formatLatLon, formatLightYears, formatLst, formatTime } from "@/format";
import { constellationName, zodiacName } from "@/sky/insights";
import type { BirthProfile, City } from "@/profiles";
import { OpenSkyRadarGraphic } from "@/features/open-sky/radar/radar-graphic";
import type { BirthSkyFacts } from "./use-birth-sky";

export const POSTER_W = 1080;
export const POSTER_H = 1920;

export type PosterFonts = {
  eyebrow: SkFont;
  title: SkFont;
  body: SkFont;
  small: SkFont;
  big: SkFont;
  compass: SkFont;
};

type Props = {
  profile: BirthProfile;
  city: City;
  frame: SkyFrame;
  facts: BirthSkyFacts;
  fonts: PosterFonts;
  locale: Locale;
  tag: string;
  t: TFn;
};

const M = 96;
const CX = POSTER_W / 2;

export function BirthSkyPoster({ profile, city, frame, facts, fonts, locale, tag, t }: Props) {
  const date = frame.date;
  const centered = (font: SkFont, text: string, y: number, color: string) => (
    <SkText x={CX - font.getTextWidth(text) / 2} y={y} text={text} font={font} color={color} />
  );
  const zenith = facts.zenith;
  const zenithSub = zenith
    ? [
        zenith.star.desig,
        facts.zenithConstellation ? constellationName(facts.zenithConstellation, locale) : null,
        zenith.star.ly ? t("light_years", { n: formatLightYears(zenith.star.ly) }) : null,
      ]
        .filter(Boolean)
        .join("  ·  ")
    : "";
  const moonLine = facts.moon
    ? `${t("moon")} ${Math.round(facts.moon.illumination * 100)}%  ·  ${
        facts.moon.waxing ? t("waxing") : t("waning")
      }  ·  ${zodiacName(facts.moon.sign, locale)}`
    : "";
  const rising = facts.rising ? `${t("rising_east")}: ${constellationName(facts.rising, locale)}` : "";
  const mark = makeAstrolicPath(CX, POSTER_H - 120, 26);

  return (
    <Group>
      <Rect x={0} y={0} width={POSTER_W} height={POSTER_H} color={SKY.bg} />
      {centered(fonts.eyebrow, t("home_eyebrow").toUpperCase(), 150, SKY.fg35)}
      {centered(fonts.title, `${profile.name}`, 230, SKY.fg)}
      {centered(fonts.body, t("poster_title"), 285, SKY.fg50)}
      <OpenSkyRadarGraphic
        frame={frame}
        cx={CX}
        cy={820}
        R={400}
        magLimit={4.5}
        scale={2.6}
        compassFont={fonts.compass}
      />
      {centered(fonts.body, `${formatDate(date, tag, city.tz)}  ·  ${formatTime(date, tag, city.tz)}`, 1330, SKY.fg)}
      {centered(
        fonts.small,
        `${city.name.toUpperCase()}  ·  ${formatLatLon(city.latitude, city.longitude)}  ·  LST ${formatLst(frame.lstDeg)}`,
        1378,
        SKY.fg50
      )}
      {moonLine ? centered(fonts.small, moonLine, 1422, SKY.fg50) : null}
      <Line p1={vec(M, 1478)} p2={vec(POSTER_W - M, 1478)} strokeWidth={1.5} color={SKY.fg12} />
      {zenith ? (
        <>
          {centered(fonts.eyebrow, t("zenith_star").toUpperCase(), 1540, SKY.fg35)}
          {centered(fonts.big, zenith.label, 1630, SKY.fg)}
          {centered(fonts.small, zenithSub, 1680, SKY.fg50)}
        </>
      ) : null}
      {rising ? centered(fonts.small, rising, 1730, SKY.fg35) : null}
      <Path path={mark} style="stroke" strokeWidth={2} strokeJoin="round" color={SKY.fg50} />
      {centered(fonts.small, t("poster_footer"), POSTER_H - 60, SKY.fg35)}
    </Group>
  );
}
