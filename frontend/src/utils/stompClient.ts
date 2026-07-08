type FrameCallback = (headers: Record<string, string>, body: string) => void;

export class MinimalStompClient {
  private ws: WebSocket | null = null;
  private subscriptions: Record<string, FrameCallback> = {};
  private connected = false;
  private onConnectCallback: (() => void) | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(private url: string) {}

  connect(onConnect: () => void, onError?: (err: any) => void) {
    this.onConnectCallback = onConnect;
    
    // Convert HTTP to WS URL
    let wsUrl = this.url.replace(/^http/, 'ws');
    // Spring Boot endpoint matches registered raw websocket endpoint /ws
    wsUrl = `${wsUrl}/ws`;
    
    console.log(`Connecting Minimal STOMP Client to: ${wsUrl}`);
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connection opened. Sending CONNECT frame...');
        this.sendFrame('CONNECT', {
          'accept-version': '1.1,1.2',
          host: 'localhost',
        });
      };

      this.ws.onmessage = (event) => {
        this.parseFrame(event.data);
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket error in minimal STOMP client:', err);
        if (onError) onError(err);
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket connection closed (code: ${event.code}). Retrying in 5s...`);
        this.connected = false;
        
        // Reconnect schedule
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.connect(onConnect, onError);
        }, 5000);
      };
    } catch (e) {
      console.error('Failed to create WebSocket instance:', e);
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        this.connect(onConnect, onError);
      }, 5000);
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.onclose = null; // Prevent triggers
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.subscriptions = {};
    console.log('WebSocket client disconnected.');
  }

  subscribe(destination: string, callback: FrameCallback) {
    console.log(`Registering subscription for: ${destination}`);
    this.subscriptions[destination] = callback;
    if (this.connected) {
      const subId = `sub-${Math.random().toString(36).substring(2, 11)}`;
      this.sendFrame('SUBSCRIBE', { id: subId, destination });
    }
  }

  private sendFrame(command: string, headers: Record<string, string>, body = '') {
    let frame = `${command}\n`;
    for (const [k, v] of Object.entries(headers)) {
      frame += `${k}:${v}\n`;
    }
    frame += `\n${body}\0`;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(frame);
    }
  }

  private parseFrame(data: string) {
    const lines = data.split('\n');
    const command = lines[0].trim();
    if (!command) return;

    const headers: Record<string, string> = {};
    let lineIdx = 1;
    while (lineIdx < lines.length && lines[lineIdx].trim() !== '') {
      const parts = lines[lineIdx].split(':');
      if (parts.length >= 2) {
        headers[parts[0].trim()] = parts.slice(1).join(':').trim();
      }
      lineIdx++;
    }

    const bodyLines = lines.slice(lineIdx + 1);
    let body = bodyLines.join('\n');
    if (body.endsWith('\0')) {
      body = body.substring(0, body.length - 1);
    }

    if (command === 'CONNECTED') {
      console.log('STOMP Client CONNECTED successfully.');
      this.connected = true;
      if (this.onConnectCallback) {
        this.onConnectCallback();
      }
      // Subscribe to all registered paths
      for (const dest of Object.keys(this.subscriptions)) {
        const subId = `sub-${Math.random().toString(36).substring(2, 11)}`;
        this.sendFrame('SUBSCRIBE', { id: subId, destination: dest });
      }
    } else if (command === 'MESSAGE') {
      const dest = headers['destination'];
      const cb = this.subscriptions[dest];
      if (cb) {
        cb(headers, body);
      }
    }
  }
}
