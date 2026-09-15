import { View } from "react-native";
import { Divider, Panel } from "@/components/ui";
import { useLocale } from "@/providers/locale-provider";
import type { SkyComparison } from "@/sky/insights";
import { ConstellationGrid, GroupHeader } from "./constellation-grid";

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
      <GroupHeader label={t("shared_constellations")} count={cmp.sharedConstellations.length} size={10} />
      <ConstellationGrid items={cmp.sharedConstellations} limit={8} />

      {cmp.onlyA.length ? (
        <View style={{ gap: 8 }}>
          <Divider />
          <GroupHeader label={t("only_name", { name: aName })} count={cmp.onlyA.length} />
          <ConstellationGrid items={cmp.onlyA} limit={4} quiet />
        </View>
      ) : null}

      {cmp.onlyB.length ? (
        <View style={{ gap: 8 }}>
          <Divider />
          <GroupHeader label={t("only_name", { name: bName })} count={cmp.onlyB.length} />
          <ConstellationGrid items={cmp.onlyB} limit={4} quiet />
        </View>
      ) : null}
    </Panel>
  );
}
