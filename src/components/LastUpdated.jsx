import { useState, useEffect } from 'react';

export default function LastUpdated({ timestamp, label = "Last updated" }) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!timestamp) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const updated = new Date(timestamp);
      const diffMs = now - updated;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) {
        setTimeAgo('just now');
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins}m ago`);
      } else if (diffHours < 24) {
        setTimeAgo(`${diffHours}h ago`);
      } else {
        setTimeAgo(updated.toLocaleDateString());
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000);

    return () => clearInterval(interval);
  }, [timestamp]);

  if (!timestamp) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span>{label}: {timeAgo}</span>
    </div>
  );
}