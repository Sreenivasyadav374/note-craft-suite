import { notificationService } from './notificationService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export interface ReminderNote {
  _id: string;
  title: string;
  content: string;
  reminderDate: string;
  notificationSent: boolean;
}

export class ReminderService {
  private static instance: ReminderService;

  private constructor() {}

  static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  async checkPendingReminders(token: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/notes/reminders/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending reminders');
      }

      const notes: ReminderNote[] = await response.json();

      for (const note of notes) {
        await notificationService.showNotification(
          `Reminder: ${note.title}`,
          note.content.replace(/<[^>]*>/g, '').substring(0, 100) || 'No content',
          note._id
        );

        await this.markReminderAsSent(token, note._id);
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  async markReminderAsSent(token: string, noteId: string): Promise<void> {
    try {
      await fetch(`${API_URL}/api/notes/reminders/${noteId}/mark-sent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error marking reminder as sent:', error);
    }
  }
}

export const reminderService = ReminderService.getInstance();
