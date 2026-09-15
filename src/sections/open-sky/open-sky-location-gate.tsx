import { ActivityIndicator, Linking, Pressable, View } from "react-native";
import { MonoText } from "@/components/mono-text";
import { SKY } from "@/lib/theme";
import type { StringKey } from "@/lib/i18n";
import type { LocationStatus } from "@/hooks/use-observer-location";

type Props = {
  status: LocationStatus;
  t: (k: StringKey) => string;
  onRequest: () => void;
  onFallback: () => void;
  onRetry: () => void;
};

/** Explains why we need the location and hosts the permission button. */
export function OpenSkyLocationGate({
  status,
  t,
  onRequest,
  onFallback,
  onRetry,
}: Props) {
  const denied = status === "denied" || status === "unavailable";
  const busy = status === "checking" || status === "requesting";

  return (
    <View style={{ flex: 1, justifyContent: "flex-end", padding: 24, gap: 28 }}>
      <View style={{ gap: 14 }}>
        <MonoText size={10} dim="faint" upper>
          {t("title")}
        </MonoText>
        <MonoText size={22} dim="none" medium tracking={-0.2}>
          {denied ? t("loc_denied_title") : t("loc_title")}
        </MonoText>
        <MonoText size={12} dim="muted" tracking={0.2} style={{ lineHeight: 19 }}>
          {denied ? t("loc_denied_body") : t("loc_body")}
        </MonoText>
      </View>

      <View style={{ gap: 10 }}>
        {denied ? (
          <>
            <Button
              label={t("loc_retry")}
              onPress={status === "denied" ? () => Linking.openSettings() : onRetry}
            />
            <Button label={t("loc_fallback")} onPress={onFallback} secondary />
          </>
        ) : (
          <Button
            label={busy ? t("loc_requesting") : t("loc_button")}
            onPress={onRequest}
            disabled={busy}
            busy={busy}
          />
        )}
      </View>
    </View>
  );
}

function Button({
  label,
  onPress,
  secondary,
  disabled,
  busy,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        height: 52,
        borderRadius: 6,
        borderCurve: "continuous",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 10,
        backgroundColor: secondary ? "transparent" : SKY.fg,
        borderWidth: 1,
        borderColor: secondary ? SKY.fg22 : SKY.fg,
        opacity: pressed || disabled ? 0.6 : 1,
      })}
    >
      {busy ? <ActivityIndicator size="small" color={SKY.bg} /> : null}
      <MonoText
        size={12}
        medium
        upper
        tracking={1}
        style={{ color: secondary ? SKY.fg70 : SKY.bg }}
      >
        {label}
      </MonoText>
    </Pressable>
  );
}
