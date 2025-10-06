export class NotificationService {
  private static instance: NotificationService;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async showNotification(title: string, body: string, noteId?: string): Promise<void> {
    if (Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: noteId,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  startReminderCheck(
    token: string | null,
    checkCallback: () => Promise<void>,
    intervalMs: number = 60000
  ): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    if (!token) return;

    checkCallback();

    this.checkInterval = setInterval(() => {
      checkCallback();
    }, intervalMs);
  }

  stopReminderCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }
}

export const notificationService = NotificationService.getInstance();
