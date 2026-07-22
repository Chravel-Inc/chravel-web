import React from 'react';
import { Skeleton } from './skeleton';

interface TripCardSkeletonProps {
  count?: number;
}

export const TripCardSkeleton = ({ count = 3 }: TripCardSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-card rounded-enterprise p-6 border border-border">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-16 w-16 rounded-lg" />
          </div>

          <div className="flex items-center gap-2 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-full" />
            ))}
            <Skeleton className="h-4 w-16" />
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      ))}
    </>
  );
};

export const TripDetailHeaderSkeleton = () => {
  return (
    <div className="mb-8" aria-hidden="true">
      <Skeleton className="mb-4 h-64 rounded-3xl bg-white/[0.03]" />
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 md:rounded-3xl md:p-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-5 w-2/3 bg-white/[0.04]" />
            <Skeleton className="h-4 w-1/2 bg-white/[0.04]" />
          </div>
          <Skeleton className="h-[120px] rounded-2xl border border-white/[0.05] bg-white/[0.02]" />
        </div>
      </div>
    </div>
  );
};

export const TripDetailContentSkeleton = () => (
  <Skeleton className="my-12 h-48 rounded-2xl bg-white/[0.03]" aria-hidden="true" />
);
