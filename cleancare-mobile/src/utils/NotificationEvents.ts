// Simple event emitter for React Native (no Node.js dependencies)
class NotificationEventEmitter {
  private listeners: Set<() => void> = new Set();

  emitBadgeRefresh() {
    this.listeners.forEach(callback => callback());
  }

  onBadgeRefresh(callback: () => void) {
    this.listeners.add(callback);
  }

  removeBadgeRefreshListener(callback: () => void) {
    this.listeners.delete(callback);
  }
}

export default new NotificationEventEmitter();
