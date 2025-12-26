const WebSocket = require('ws');
const EventEmitter = require('events');
const cacheManager = require('./cacheManager');

class RealTimeUpdateService extends EventEmitter {
    constructor() {
        super();
        this.clients = new Set();
        this.wss = null;
        this.updateBuffer = new Map(); // Buffer updates để tránh spam
        this.bufferTimeout = 1000; // 1 giây
        
        this.init();
    }
    
    init() {
        console.log('🔄 Real-time Update Service initializing...');
        
        // Listen for cache updates
        this.setupCacheListeners();
        
        console.log('✅ Real-time Update Service ready');
    }
    
    // Setup WebSocket server
    setupWebSocketServer(server) {
        this.wss = new WebSocket.Server({ server });
        
        this.wss.on('connection', (ws, req) => {
            console.log('🔌 New WebSocket connection');
            this.clients.add(ws);
            
            // Send initial data
            this.sendInitialData(ws);
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleClientMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 WebSocket connection closed');
                this.clients.delete(ws);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });
        
        console.log('🔌 WebSocket server setup complete');
    }
    
    // Send initial data to new client
    async sendInitialData(ws) {
        try {
            const initialData = {
                type: 'initial',
                data: {
                    popularGames: await cacheManager.get('popular_games', 'popular'),
                    gamesList: await cacheManager.get('games_list', 'games'),
                    dlcData: await cacheManager.get('dlc_data', 'dlc'),
                    cacheStats: cacheManager.getStats()
                },
                timestamp: Date.now()
            };
            
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(initialData));
            }
        } catch (error) {
            console.error('Send initial data error:', error);
        }
    }
    
    // Handle client messages
    handleClientMessage(ws, data) {
        switch (data.type) {
            case 'subscribe':
                // Client subscribe to specific updates
                ws.subscriptions = data.topics || [];
                break;
                
            case 'ping':
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                }
                break;
                
            case 'request_update':
                // Client request manual update
                this.handleUpdateRequest(data.updateType);
                break;
        }
    }
    
    // Setup cache listeners
    setupCacheListeners() {
        // Listen for popular games updates
        this.on('popularGamesUpdated', (data) => {
            this.broadcastUpdate('popular_games', data);
        });
        
        // Listen for games list updates
        this.on('gamesListUpdated', (data) => {
            this.broadcastUpdate('games_list', data);
        });
        
        // Listen for DLC updates
        this.on('dlcUpdated', (data) => {
            this.broadcastUpdate('dlc_data', data);
        });
        
        // Listen for Steam data updates
        this.on('steamDataUpdated', (data) => {
            this.broadcastUpdate('steam_data', data);
        });
        
        // Listen for image updates
        this.on('imagesUpdated', (data) => {
            this.broadcastUpdate('images', data);
        });
        
        // Listen for size updates
        this.on('sizesUpdated', (data) => {
            this.broadcastUpdate('sizes', data);
        });
    }
    
    // Broadcast update to all clients
    broadcastUpdate(type, data) {
        const updateMessage = {
            type: 'update',
            updateType: type,
            data: data,
            timestamp: Date.now()
        };
        
        // Buffer updates để tránh spam
        this.bufferUpdate(type, updateMessage);
    }
    
    // Buffer updates
    bufferUpdate(type, message) {
        // Clear existing timeout
        if (this.updateBuffer.has(type)) {
            clearTimeout(this.updateBuffer.get(type).timeout);
        }
        
        // Set new timeout
        const timeout = setTimeout(() => {
            this.sendBufferedUpdate(type, message);
            this.updateBuffer.delete(type);
        }, this.bufferTimeout);
        
        this.updateBuffer.set(type, { message, timeout });
    }
    
    // Send buffered update
    sendBufferedUpdate(type, message) {
        const activeClients = [];
        
        this.clients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                // Check if client subscribed to this type
                if (!ws.subscriptions || ws.subscriptions.includes(type) || ws.subscriptions.includes('all')) {
                    try {
                        ws.send(JSON.stringify(message));
                        activeClients.push(ws);
                    } catch (error) {
                        console.error('Send update error:', error);
                        this.clients.delete(ws);
                    }
                }
            } else {
                this.clients.delete(ws);
            }
        });
        
        console.log(`📡 Broadcasted ${type} update to ${activeClients.length} clients`);
    }
    
    // Handle update requests
    async handleUpdateRequest(updateType) {
        try {
            const autoUpdateScheduler = require('./autoUpdateScheduler');
            await autoUpdateScheduler.triggerUpdate(updateType);
        } catch (error) {
            console.error('Handle update request error:', error);
        }
    }
    
    // Notify specific update
    notifyUpdate(type, data) {
        this.emit(`${type}Updated`, data);
    }
    
    // Send notification to clients
    sendNotification(message, type = 'info') {
        const notification = {
            type: 'notification',
            level: type,
            message: message,
            timestamp: Date.now()
        };
        
        this.clients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(JSON.stringify(notification));
                } catch (error) {
                    console.error('Send notification error:', error);
                    this.clients.delete(ws);
                }
            }
        });
    }
    
    // Get service stats
    getStats() {
        return {
            connectedClients: this.clients.size,
            bufferedUpdates: this.updateBuffer.size,
            wsServerRunning: !!this.wss
        };
    }
    
    // Close all connections
    close() {
        if (this.wss) {
            this.wss.close();
        }
        
        this.clients.forEach(ws => {
            ws.close();
        });
        
        this.clients.clear();
        this.updateBuffer.clear();
        
        console.log('🔌 Real-time Update Service closed');
    }
}

module.exports = new RealTimeUpdateService();