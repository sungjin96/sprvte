import Link from 'next/link';
import { Asset, AssetStatus } from '@/types/asset';
import { AssetCard, AssetStatus as CardStatus } from '@/components/ui/AssetCard';
import { AssetCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

// Map domain AssetStatus → legacy card status
function toCardStatus(s: AssetStatus): CardStatus {
  if (s === 'completed') return 'done';
  if (s === 'failed') return 'error';
  return 'processing';
}

interface AssetGridProps {
  assets: Asset[];
  loading?: boolean;
  skeletonCount?: number;
  onAssetClick?: (asset: Asset) => void;
  projectId?: string;
}

function AssetGrid({ assets, loading, skeletonCount = 8, onAssetClick, projectId }: AssetGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <AssetCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <EmptyState
        heading="No assets yet"
        body="Generate your first asset using the form above."
      />
    );
  }

  const href = (id: string) =>
    projectId ? `/projects/${projectId}/assets/${id}` : `/assets/${id}`;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {assets.map((asset) => (
        <Link key={asset.id} href={href(asset.id)}>
          <AssetCard
            name={asset.name}
            type={asset.type}
            status={toCardStatus(asset.status)}
            imageUrl={asset.fileUrl ?? undefined}
            createdAt={asset.createdAt.slice(0, 10)}
            onClick={onAssetClick ? () => onAssetClick(asset) : undefined}
          />
        </Link>
      ))}
    </div>
  );
}

export { AssetGrid };
