import ParableIsolatedStackBanner from "@/components/broadcast/ParableIsolatedStackBanner";
import ProductionPathBanner from "@/components/ops/ProductionPathBanner";

type BroadcastPathBannerProps = {
  platformIsLive: boolean;
};

export default function BroadcastPathBanner({ platformIsLive }: BroadcastPathBannerProps) {
  if (platformIsLive) {
    return <ProductionPathBanner isLive />;
  }

  return <ParableIsolatedStackBanner />;
}
