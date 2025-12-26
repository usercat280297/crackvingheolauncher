/**
 * 🚀 WebTorrent Optimization Config
 * 
 * Tối ưu cho:
 * - Tốc độ download cao (128kb cocccoc files → download nhanh)
 * - Multi-source (DHT, tracker, PEX)
 * - Memory efficient
 * - Network bandwidth optimization
 * - Smart peer selection
 */

module.exports = {
  // ===== CONNECTION SETTINGS =====
  
  // Số lượng kết nối tối đa (peers) - tăng để download nhanh hơn
  maxConnections: 100,
  
  // Số peers tối đa per torrent
  maxPeers: 60,
  
  // Request timeout (ms) - giảm để phát hiện peer chết nhanh hơn
  requestTimeout: 3000,
  
  // Handshake timeout
  handshakeTimeout: 5000,

  // ===== PERFORMANCE TUNING =====
  
  // Upload speed cap (bytes/s) - Unlimited by default
  // Set to -1 for unlimited
  uploadSpeed: -1,
  
  // Download speed cap (bytes/s) - Unlimited
  downloadSpeed: -1,
  
  // Block size (16KB - optimal for most files)
  blockSize: 16384,
  
  // Request pipeline (số requests pending) - tăng để cải thiện throughput
  requestPipeline: 16,
  
  // Số pieces để fetch simultaneously
  pipelineSize: 5,

  // ===== TRACKER SETTINGS =====
  
  // Tracker URLs - đa dạng để tìm peers nhanh hơn
  trackers: [
    'ws://tracker.openwebtorrent.com:80',
    'ws://tracker.btorrent.xyz:80',
    'udp://tracker.openbittorrent.com:80',
    'udp://open.demonii.com:1337',
    'udp://tracker.publicbt.com:80',
    'udp://tracker.istole.it:6969',
    'udp://tracker.torrent.eu.org:451',
    'udp://tracker.cyberia.is:6969'
  ],
  
  // DHT enabled - để tìm peers qua distributed hash table
  dht: true,
  
  // PEX (Peer Exchange) enabled - để nhận peers từ peers khác
  pex: true,
  
  // Tracker timeout (ms)
  trackerTimeout: 2000,

  // ===== MEMORY & DISK OPTIMIZATION =====
  
  // Streaming chunk size (256KB - cân bằng giữa speed và memory)
  chunkSize: 256 * 1024,
  
  // Memory buffer (2MB - để xử lý peaks)
  memoryBuffer: 2 * 1024 * 1024,
  
  // File I/O buffer size (128KB)
  ioBufferSize: 128 * 1024,
  
  // Keep alive timeout (30s - để connection sống lâu hơn)
  keepAliveTimeout: 30000,

  // ===== ADVANCED OPTIMIZATION =====
  
  // Custom user agent (để tránh bị block)
  userAgent: 'CrackVingheo/1.0',
  
  // Auto-port mapping (UPnP) - để NAT traversal
  upnp: true,
  
  // Auto-NAT traversal (PCP/NAT-PMP)
  natTraversal: true,
  
  // Connection backoff (exponential retry strategy)
  backoffMin: 50,     // 50ms minimum backoff
  backoffMax: 10000,  // 10s maximum backoff
  
  // Piece selection strategy
  // 'random' = random pieces (bad for slow connections)
  // 'sequential' = sequential pieces (good for streaming)
  // 'rarest-first' = rarest pieces first (best overall)
  pieceSelection: 'rarest-first',

  // ===== BANDWIDTH MANAGEMENT =====
  
  // Enable bandwidth estimation
  estimateBandwidth: true,
  
  // Update interval for bandwidth estimation (ms)
  bandwidthUpdateInterval: 1000,
  
  // Smart peer selection
  smartPeerSelection: true,
  
  // Preferred peer countries (empty = all)
  preferredCountries: [],

  // ===== TCP/UDP SETTINGS =====
  
  // TCP keep-alive interval
  tcpKeepAliveInterval: 60000,
  
  // UDP socket timeout
  udpSocketTimeout: 5000,
  
  // STUN servers for NAT detection
  stunServers: [
    'stun.l.google.com:19302',
    'stun1.l.google.com:19302',
    'stun2.l.google.com:19302'
  ],

  // ===== FAST DOWNLOAD PRESETS =====
  
  // Use these for maximum speed on cocccoc 128kb torrents
  fastMode: {
    maxConnections: 150,      // Tối đa connections
    maxPeers: 100,           // Tối đa peers
    requestPipeline: 32,     // Tối đa requests
    blockSize: 32768,        // 32KB blocks (larger for faster throughput)
    chunkSize: 512 * 1024,   // 512KB chunks (larger buffer)
    pieceSelection: 'rarest-first'
  },

  // Estimate interval
  estimateInterval: 5000,
  
  // Chunk pipeline (số chunks in parallel)
  chunkPipeline: 10,

  // ===== COCCCOC SPECIFIC (128KB CHUNKS) =====
  
  // Optimized for small files (128KB)
  // - Tăng concurrency
  // - Nhỏ buffer
  cocccoc: {
    // Số connections song song cho small files
    maxConcurrentConnections: 100,
    
    // Chunk size tương ứng (128KB)
    optimalChunkSize: 128 * 1024,
    
    // Request timeout (shorter for small files)
    timeoutForSmallFiles: 3000,
    
    // Retry attempts
    maxRetries: 5,
    
    // Aggressive peer discovery
    aggressivePeerDiscovery: true,
    
    // Download strategy
    strategy: 'sequential' // Sequential for small files
  },

  // ===== NETWORK OPTIMIZATION =====
  
  // TCP congestion control
  tcpNoDelay: true,
  
  // Nagle's algorithm (disabled for lower latency)
  nagleAlgorithm: false,
  
  // Send buffer size (128KB)
  sendBufferSize: 128 * 1024,
  
  // Receive buffer size (256KB)
  receiveBufferSize: 256 * 1024,

  // ===== ERROR HANDLING =====
  
  // Automatic retry on failure
  autoRetry: true,
  
  // Max retries per piece
  maxPieceRetries: 3,
  
  // Ban peer on bad behavior
  banPeerOnBadBehavior: true,
  
  // Ban duration (minutes)
  banDuration: 5
};

/**
 * 📊 RECOMMENDED SETTINGS FOR COCCCOC 128KB TORRENTS
 * 
 * Để download nhanh nhất:
 * 
 * 1. Multi-source:
 *    - DHT (mạng ngang hàng lớn nhất)
 *    - Trackers (server theo dõi)
 *    - PEX (peer exchange từ peers)
 * 
 * 2. Connection pooling:
 *    - maxConnections: 50 (socket connections)
 *    - maxPeers: 30 (peers per torrent)
 *    - requestPipeline: 5 (pending requests)
 * 
 * 3. Bandwidth:
 *    - Upload unlimited để được serve tốt hơn
 *    - Download unlimited để max speed
 * 
 * 4. Piece strategy:
 *    - rarest-first: ưu tiên rare pieces
 *    - sequential: tốt cho streaming
 * 
 * 5. Network:
 *    - TCP NoDelay: gửi packets ngay (latency thấp)
 *    - Large buffers: xử lý burst traffic
 * 
 * Expected speed:
 * - 128KB file: 1-10 MB/s (phụ thuộc seeders)
 * - Cocccoc format: Download quickly due to small files
 */
