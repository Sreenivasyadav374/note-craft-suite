import { useState } from "react";
import { useNotes } from "../context/NotesContext";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, isSameDay, parseISO, isFuture, isPast, isToday } from "date-fns";

interface Note {
  id: string;
  title: string;
  content: string;
  reminderDate?: string | null;
  type: "file" | "folder";
}

export default function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { notes: allNotes, isLoading } = useNotes();
  const navigate = useNavigate();

  // Filter notes to only include those with reminders
  const notes = allNotes.filter(note => note.reminderDate && note.type === "file");

  const notesForSelectedDate = notes.filter((note) => {
    if (!note.reminderDate || !selectedDate) return false;
    try {
      const noteDate = typeof note.reminderDate === 'string' 
        ? parseISO(note.reminderDate) 
        : note.reminderDate;
      return isSameDay(noteDate, selectedDate);
    } catch {
      return false;
    }
  });

  const upcomingReminders = notes
    .filter((note) => {
      if (!note.reminderDate) return false;
      try {
        const noteDate = typeof note.reminderDate === 'string' 
          ? parseISO(note.reminderDate) 
          : note.reminderDate;
        return isFuture(noteDate) || isToday(noteDate);
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      const dateA = typeof a.reminderDate === 'string' 
        ? new Date(a.reminderDate) 
        : a.reminderDate!;
      const dateB = typeof b.reminderDate === 'string' 
        ? new Date(b.reminderDate) 
        : b.reminderDate!;
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 5);

  const datesWithReminders = notes
    .filter((note) => note.reminderDate)
    .map((note) => {
      try {
        return typeof note.reminderDate === 'string' 
          ? parseISO(note.reminderDate) 
          : note.reminderDate!;
      } catch {
        return null;
      }
    })
    .filter((date): date is Date => date !== null);

  const modifiers = {
    hasReminder: datesWithReminders,
  };

  const modifiersClassNames = {
    hasReminder: "bg-primary/20 font-bold",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/notes")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <CalendarIcon className="h-8 w-8" />
                Calendar View
              </h1>
              <p className="text-muted-foreground">
                View and manage your reminders
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Upcoming Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingReminders.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No upcoming reminders
                </p>
              ) : (
                upcomingReminders.map((note) => {
                  const reminderDate = typeof note.reminderDate === 'string' 
                    ? parseISO(note.reminderDate) 
                    : note.reminderDate!;
                  const isPastDue = isPast(reminderDate) && !isToday(reminderDate);
                  
                  return (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate("/notes")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {note.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(reminderDate, "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        {isPastDue && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                        {isToday(reminderDate) && (
                          <Badge variant="default" className="text-xs">
                            Today
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Notes for Selected Date */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>
                {selectedDate
                  ? `Reminders on ${format(selectedDate, "MMMM d, yyyy")}`
                  : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notesForSelectedDate.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No reminders on this date
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {notesForSelectedDate.map((note) => {
                    const reminderDate = typeof note.reminderDate === 'string' 
                      ? parseISO(note.reminderDate) 
                      : note.reminderDate!;
                    return (
                      <Card
                        key={note.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate("/notes")}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {note.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div
                            className="text-sm text-muted-foreground line-clamp-3"
                            dangerouslySetInnerHTML={{
                              __html:
                                note.content
                                  .replace(/<[^>]*>/g, "")
                                  .substring(0, 100) || "No content",
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-3">
                            {format(reminderDate, "h:mm a")}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
