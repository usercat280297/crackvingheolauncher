import { useState, useEffect } from 'react';
import { useImageCache } from '../hooks/useCache';

export default function CachedImage({ src, gameId, alt, className, onError, ...props }) {
  const { getCachedImage, cacheImage } = useImageCache();
  const [imageSrc, setImageSrc] = useState(src);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gameId && src) {
      // Kiểm tra cache trước
      const cached = getCachedImage(gameId, null);
      
      if (cached) {
        setImageSrc(cached);
        setLoading(false);
      } else {
        // Cache ảnh mới
        cacheImage(src, gameId).then(cachedUrl => {
          setImageSrc(cachedUrl);
          setLoading(false);
        });
      }
    } else {
      setImageSrc(src);
      setLoading(false);
    }
  }, [src, gameId]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${className} ${loading ? 'opacity-50' : 'opacity-100'} transition-opacity`}
      onError={onError}
      {...props}
    />
  );
}
