// Real-time Update Client
class RealTimeClient {
    constructor(serverUrl = 'ws://localhost:3000') {
        this.serverUrl = serverUrl;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.subscriptions = ['all']; // Subscribe to all updates by default
        this.listeners = new Map();
        
        this.connect();
    }
    
    // Connect to WebSocket server
    connect() {
        try {
            console.log('🔌 Connecting to real-time updates...');
            this.ws = new WebSocket(this.serverUrl);
            
            this.ws.onopen = () => {
                console.log('✅ Real-time connection established');
                this.reconnectAttempts = 0;
                
                // Subscribe to updates
                this.subscribe(this.subscriptions);
                
                // Send ping to keep connection alive
                this.startPingInterval();
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('🔌 Real-time connection closed');
                this.stopPingInterval();
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            this.attemptReconnect();
        }
    }
    
    // Handle incoming messages
    handleMessage(data) {
        switch (data.type) {
            case 'initial':
                console.log('📦 Received initial data');
                this.emit('initial', data.data);
                break;
                
            case 'update':
                console.log(`🔄 Received ${data.updateType} update`);
                this.emit('update', data);
                this.emit(data.updateType, data.data);
                break;
                
            case 'notification':
                console.log(`📢 ${data.level}: ${data.message}`);
                this.emit('notification', data);
                break;
                
            case 'pong':
                // Keep-alive response
                break;
                
            default:
                console.log('Unknown message type:', data.type);
        }
    }
    
    // Subscribe to specific update types
    subscribe(topics) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.subscriptions = Array.isArray(topics) ? topics : [topics];
            this.ws.send(JSON.stringify({
                type: 'subscribe',
                topics: this.subscriptions
            }));
            console.log('📡 Subscribed to:', this.subscriptions);
        }
    }
    
    // Request manual update
    requestUpdate(updateType) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'request_update',
                updateType: updateType
            }));
            console.log(`🔄 Requested ${updateType} update`);
        }
    }
    
    // Add event listener
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    // Remove event listener
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    // Emit event
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }
    
    // Start ping interval
    startPingInterval() {
        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000); // Ping every 30 seconds
    }
    
    // Stop ping interval
    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
    
    // Attempt to reconnect
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
            
            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error('❌ Max reconnection attempts reached');
            this.emit('connectionFailed');
        }
    }
    
    // Disconnect
    disconnect() {
        this.stopPingInterval();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        console.log('🔌 Disconnected from real-time updates');
    }
    
    // Get connection status
    getStatus() {
        return {
            connected: this.ws && this.ws.readyState === WebSocket.OPEN,
            reconnectAttempts: this.reconnectAttempts,
            subscriptions: this.subscriptions
        };
    }
}

// Auto-update UI components
class AutoUpdateUI {
    constructor(realTimeClient) {
        this.client = realTimeClient;
        this.setupEventListeners();
        this.createStatusIndicator();
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Popular games update
        this.client.on('popular_games', (data) => {
            this.updatePopularGames(data);
            this.showUpdateNotification('Popular games updated!');
        });
        
        // Games list update
        this.client.on('games_list', (data) => {
            this.updateGamesList(data);
            this.showUpdateNotification('Games list updated!');
        });
        
        // DLC update
        this.client.on('dlc_data', (data) => {
            this.updateDLCData(data);
            this.showUpdateNotification('DLC data updated!');
        });
        
        // Steam data update
        this.client.on('steam_data', (data) => {
            this.updateSteamData(data);
            this.showUpdateNotification('Steam data updated!');
        });
        
        // Images update
        this.client.on('images', (data) => {
            this.updateImages(data);
            this.showUpdateNotification('Game images updated!');
        });
        
        // Sizes update
        this.client.on('sizes', (data) => {
            this.updateSizes(data);
            this.showUpdateNotification('Game sizes updated!');
        });
        
        // Notifications
        this.client.on('notification', (data) => {
            this.showNotification(data.message, data.level);
        });
    }
    
    // Create status indicator
    createStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'realtime-status';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            z-index: 9999;
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(indicator);
        this.statusIndicator = indicator;
        
        // Update status
        this.updateStatusIndicator();
        
        // Update status every 5 seconds
        setInterval(() => {
            this.updateStatusIndicator();
        }, 5000);
    }
    
    // Update status indicator
    updateStatusIndicator() {
        const status = this.client.getStatus();
        
        if (status.connected) {
            this.statusIndicator.textContent = '🟢 Real-time ON';
            this.statusIndicator.style.backgroundColor = '#10b981';
            this.statusIndicator.style.color = 'white';
        } else {
            this.statusIndicator.textContent = '🔴 Real-time OFF';
            this.statusIndicator.style.backgroundColor = '#ef4444';
            this.statusIndicator.style.color = 'white';
        }
    }
    
    // Update popular games in UI
    updatePopularGames(data) {
        const container = document.querySelector('[data-popular-games]');
        if (container && data) {
            // Trigger re-render or update data
            const event = new CustomEvent('popularGamesUpdated', { detail: data });
            container.dispatchEvent(event);
        }
    }
    
    // Update games list in UI
    updateGamesList(data) {
        const container = document.querySelector('[data-games-list]');
        if (container && data) {
            const event = new CustomEvent('gamesListUpdated', { detail: data });
            container.dispatchEvent(event);
        }
    }
    
    // Update DLC data in UI
    updateDLCData(data) {
        const containers = document.querySelectorAll('[data-dlc]');
        containers.forEach(container => {
            const event = new CustomEvent('dlcUpdated', { detail: data });
            container.dispatchEvent(event);
        });
    }
    
    // Update Steam data in UI
    updateSteamData(data) {
        const containers = document.querySelectorAll('[data-steam]');
        containers.forEach(container => {
            const event = new CustomEvent('steamDataUpdated', { detail: data });
            container.dispatchEvent(event);
        });
    }
    
    // Update images in UI
    updateImages(data) {
        const images = document.querySelectorAll('img[data-game-id]');
        images.forEach(img => {
            const gameId = img.getAttribute('data-game-id');
            if (data[gameId]) {
                img.src = data[gameId].cover || img.src;
            }
        });
    }
    
    // Update sizes in UI
    updateSizes(data) {
        const sizeElements = document.querySelectorAll('[data-game-size]');
        sizeElements.forEach(element => {
            const gameId = element.getAttribute('data-game-id');
            if (data[gameId]) {
                element.textContent = data[gameId].formatted || element.textContent;
            }
        });
    }
    
    // Show update notification
    showUpdateNotification(message) {
        this.showNotification(message, 'success');
    }
    
    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            padding: 12px 16px;
            border-radius: 4px;
            font-size: 14px;
            max-width: 300px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        // Set colors based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#10b981';
                notification.style.color = 'white';
                break;
            case 'error':
                notification.style.backgroundColor = '#ef4444';
                notification.style.color = 'white';
                break;
            case 'warning':
                notification.style.backgroundColor = '#f59e0b';
                notification.style.color = 'white';
                break;
            default:
                notification.style.backgroundColor = '#3b82f6';
                notification.style.color = 'white';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize real-time client
const realTimeClient = new RealTimeClient();
const autoUpdateUI = new AutoUpdateUI(realTimeClient);

// Export for global access
window.realTimeClient = realTimeClient;
window.autoUpdateUI = autoUpdateUI;

console.log('🚀 Real-time auto-update system initialized!');
console.log('Available methods:');
console.log('- realTimeClient.requestUpdate("popular") - Request popular games update');
console.log('- realTimeClient.requestUpdate("games") - Request games list update');
console.log('- realTimeClient.requestUpdate("all") - Request all updates');
console.log('- realTimeClient.subscribe(["popular", "games"]) - Subscribe to specific updates');