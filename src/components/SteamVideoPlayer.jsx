import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

export default function SteamVideoPlayer({ appId }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [trailer, setTrailer] = useState(null);

  useEffect(() => {
    // Fetch trailer
    fetch(`http://localhost:3000/api/games/${appId}/trailer`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.trailer) {
          setTrailer(data.trailer);
        }
      })
      .catch(console.error);
  }, [appId]);

  useEffect(() => {
    if (!trailer?.hls || !videoRef.current) return;

    // Initialize video.js player
    playerRef.current = videojs(videoRef.current, {
      controls: true,
      autoplay: false,
      preload: 'auto',
      fluid: true,
      poster: trailer.thumbnail,
      sources: [{
        src: trailer.hls,
        type: 'application/x-mpegURL'
      }]
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [trailer]);

  if (!trailer) return <div>Loading trailer...</div>;

  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js vjs-big-play-centered" />
    </div>
  );
}
