export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}

export class CalendarService {
  private static instance: CalendarService;

  private constructor() {}

  static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  generateICSFile(event: CalendarEvent): string {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NotesApp//Reminder//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(event.startDate)}`,
      `DTEND:${formatDate(event.endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      event.location ? `LOCATION:${event.location}` : '',
      `UID:${Date.now()}@notesapp.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${event.title}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line).join('\r\n');

    return icsContent;
  }

  downloadICSFile(event: CalendarEvent, filename: string = 'reminder.ics'): void {
    const icsContent = this.generateICSFile(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  addToGoogleCalendar(event: CalendarEvent): void {
    const formatDateForGoogle = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      details: event.description,
      dates: `${formatDateForGoogle(event.startDate)}/${formatDateForGoogle(event.endDate)}`,
    });

    if (event.location) {
      params.append('location', event.location);
    }

    const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
    window.open(url, '_blank');
  }

  addToOutlookCalendar(event: CalendarEvent): void {
    const formatDateForOutlook = (date: Date): string => {
      return date.toISOString();
    };

    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.title,
      body: event.description,
      startdt: formatDateForOutlook(event.startDate),
      enddt: formatDateForOutlook(event.endDate),
    });

    if (event.location) {
      params.append('location', event.location);
    }

    const url = `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
    window.open(url, '_blank');
  }

  addToAppleCalendar(event: CalendarEvent): void {
    this.downloadICSFile(event, `${event.title.replace(/\s+/g, '_')}.ics`);
  }
}

export const calendarService = CalendarService.getInstance();
