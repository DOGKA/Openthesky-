import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View, useWindowDimensions } from "react-native";
import {
  Canvas,
  Image as SkImage,
  drawAsImage,
  useFont,
  type SkImage as SkImageType,
} from "@shopify/react-native-skia";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { GeistMono_400Regular, GeistMono_500Medium } from "@expo-google-fonts/geist-mono";
import { MonoText } from "@/components/mono-text";
import { OutlineButton, ScreenHeader } from "@/components/ui";
import { SKY } from "@/lib/theme";
import { useProfiles } from "@/lib/profiles";
import { useLocale } from "@/providers/locale-provider";
import { useNavigation } from "@/navigation/navigator";
import { useBirthSky } from "../use-birth-sky";
import { BirthSkyPoster, POSTER_H, POSTER_W, type PosterFonts } from "../birth-sky-poster";

/**
 * Renders the 1080×1920 birth-sky story offscreen, previews it, and hands the
 * PNG to the OS share sheet (Instagram / WhatsApp / save).
 */
export function BirthSkyPosterView({ profileId }: { profileId: string }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { locale, tag, t } = useLocale();
  const nav = useNavigation();
  const { byId, me } = useProfiles();
  const profile = byId(profileId) ?? me;
  const { city, frame, facts } = useBirthSky(profile, profile.name);

  const eyebrow = useFont(GeistMono_500Medium, 28);
  const title = useFont(GeistMono_500Medium, 56);
  const body = useFont(GeistMono_400Regular, 34);
  const small = useFont(GeistMono_400Regular, 28);
  const big = useFont(GeistMono_500Medium, 76);
  const compass = useFont(GeistMono_400Regular, 30);
  const fonts: PosterFonts | null =
    eyebrow && title && body && small && big && compass
      ? { eyebrow, title, body, small, big, compass }
      : null;

  const [image, setImage] = useState<SkImageType | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fonts || !frame || !facts) return;
    let cancelled = false;
    (async () => {
      try {
        const img = await drawAsImage(
          <BirthSkyPoster
            profile={profile}
            city={city}
            frame={frame}
            facts={facts}
            fonts={fonts}
            locale={locale}
            tag={tag}
            t={t}
          />,
          { width: POSTER_W, height: POSTER_H }
        );
        if (!cancelled) setImage(img);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fonts != null, frame, facts, profile, city, locale, tag]);

  const share = useCallback(async () => {
    if (!image) return;
    setBusy(true);
    try {
      const bytes = image.encodeToBytes();
      const file = new File(Paths.cache, `astrolic-birth-sky-${profile.id}.png`);
      if (file.exists) file.delete();
      file.create();
      file.write(bytes);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: "image/png", UTI: "public.png" });
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }, [image, profile.id]);

  // preview fitted to the screen, 9:16
  const availH = height - insets.top - insets.bottom - 200;
  const previewH = Math.min(availH, ((width - 40) * POSTER_H) / POSTER_W);
  const previewW = (previewH * POSTER_W) / POSTER_H;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: SKY.bg,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: 20,
        gap: 16,
      }}
    >
      <StatusBar style="light" />
      <ScreenHeader
        eyebrow={`${POSTER_W} × ${POSTER_H} · PNG`}
        title={t("share_story")}
        onBack={nav.pop}
        backLabel={t("back")}
      />

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {image ? (
          <View style={{ borderWidth: 1, borderColor: SKY.fg12 }}>
            <Canvas style={{ width: previewW, height: previewH }}>
              <SkImage image={image} x={0} y={0} width={previewW} height={previewH} fit="contain" />
            </Canvas>
          </View>
        ) : (
          <View style={{ alignItems: "center", gap: 12 }}>
            <ActivityIndicator color={SKY.fg50} />
            <MonoText size={10} dim="faint" upper>
              {error ?? t("saving")}
            </MonoText>
          </View>
        )}
      </View>

      <OutlineButton label={busy ? t("saving") : t("share")} onPress={share} primary disabled={!image || busy} />
      {error ? (
        <MonoText size={9} dim="faint">
          {error}
        </MonoText>
      ) : null}
    </View>
  );
}
