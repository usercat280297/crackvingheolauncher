import React from 'react';
import { Loader } from 'lucide-react';

export const LoadingSpinner = ({ size = 'md', fullscreen = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const spinner = (
    <Loader className={`${sizeClasses[size]} animate-spin text-red-500`} />
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
        <div className="bg-gray-900 rounded-lg p-8 shadow-xl border border-gray-700">
          {spinner}
          <p className="text-gray-300 mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return spinner;
};

export const SkeletonLoader = ({ count = 1, height = 'h-12' }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-lg animate-pulse`}
        />
      ))}
    </div>
  );
};

export const GridSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-video bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-lg animate-pulse" />
          <div className="h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded animate-pulse" />
          <div className="h-3 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded animate-pulse w-3/4" />
        </div>
      ))}
    </div>
  );
};
