import * as Network from 'expo-network';

type NetworkCallback = (isOnline: boolean) => void;

class NetworkMonitor {
  private online = true;
  private listeners: Set<NetworkCallback> = new Set();
  private intervalId: any = null;

  constructor() {
    this.checkInitialState();
    this.startPolling();
  }

  private async checkInitialState() {
    try {
      const state = await Network.getNetworkStateAsync();
      this.online = Boolean(state.isConnected && state.isInternetReachable !== false);
    } catch {
      this.online = true;
    }
  }

  private startPolling() {
    // Periodically inspect connection state every 10 seconds
    if (this.intervalId) return;

    this.intervalId = setInterval(async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        const current = Boolean(state.isConnected && state.isInternetReachable !== false);
        if (current !== this.online) {
          this.online = current;
          this.notifyListeners();
        }
      } catch {
        // safe fallback
      }
    }, 10000);
  }

  public async isOnline(): Promise<boolean> {
    try {
      const state = await Network.getNetworkStateAsync();
      this.online = Boolean(state.isConnected && state.isInternetReachable !== false);
      return this.online;
    } catch {
      return this.online;
    }
  }

  public getCachedOnline(): boolean {
    return this.online;
  }

  public subscribe(cb: NetworkCallback): () => void {
    this.listeners.add(cb);
    cb(this.online);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notifyListeners() {
    for (const cb of this.listeners) {
      try {
        cb(this.online);
      } catch {
        // ignore subscriber error
      }
    }
  }

  public cleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.listeners.clear();
  }
}

export const networkMonitor = new NetworkMonitor();
