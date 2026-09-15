import { View } from "react-native";
import { Divider, Panel } from "@/components/ui";
import { useLocale } from "@/providers/locale-provider";
import type { SkyComparison } from "@/sky/insights";
import { ChipsHeader, ConstellationChips } from "./constellation-chips";

export function SharedConstellations({
  cmp,
  aName,
  bName,
}: {
  cmp: SkyComparison;
  aName: string;
  bName: string;
}) {
  const { t } = useLocale();

  return (
    <Panel>
      <ChipsHeader label={t("shared_constellations")} count={cmp.sharedConstellations.length} size={10} />
      <ConstellationChips items={cmp.sharedConstellations} limit={9} />

      {cmp.onlyA.length ? (
        <View style={{ gap: 8 }}>
          <Divider />
          <ChipsHeader label={t("only_name", { name: aName })} count={cmp.onlyA.length} />
          <ConstellationChips items={cmp.onlyA} limit={6} quiet />
        </View>
      ) : null}

      {cmp.onlyB.length ? (
        <View style={{ gap: 8 }}>
          <Divider />
          <ChipsHeader label={t("only_name", { name: bName })} count={cmp.onlyB.length} />
          <ConstellationChips items={cmp.onlyB} limit={6} quiet />
        </View>
      ) : null}
    </Panel>
  );
}
