import { FileText, Folder, HardDrive, Activity } from "lucide-react";
import { useNotes } from "../context/NotesContext";
import { useMemo } from "react";

export default function UsageStats() {
  const { notes } = useNotes();

  const stats = useMemo(() => {
    const notesCount = notes.filter(n => n.type === 'file').length;
    const foldersCount = notes.filter(n => n.type === 'folder').length;
    
    // Calculate storage used (approximate based on content length)
    const storageBytes = notes.reduce((acc, note) => {
      const contentSize = note.content.length;
      const titleSize = note.title.length;
      return acc + contentSize + titleSize;
    }, 0);
    const storageKB = (storageBytes / 1024).toFixed(2);
    
    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = notes.filter(note => {
      const updatedDate = new Date(note.updatedAt);
      return updatedDate >= sevenDaysAgo;
    }).length;

    return {
      notesCount,
      foldersCount,
      storageKB,
      recentActivity
    };
  }, [notes]);

  const statItems = [
    {
      icon: FileText,
      label: "Notes",
      value: stats.notesCount,
      color: "text-blue-500"
    },
    {
      icon: Folder,
      label: "Folders",
      value: stats.foldersCount,
      color: "text-amber-500"
    },
    {
      icon: HardDrive,
      label: "Storage",
      value: `${stats.storageKB} KB`,
      color: "text-purple-500"
    },
    {
      icon: Activity,
      label: "Recent (7d)",
      value: stats.recentActivity,
      color: "text-green-500"
    }
  ];

  return (
    <div className="bg-gradient-card rounded-2xl p-5 border border-border/50 shadow-card">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Usage Statistics
      </h4>
      
      <div className="grid grid-cols-2 gap-3">
        {statItems.map((stat, index) => (
          <div
            key={index}
            className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-border/50 hover:shadow-card transition-smooth"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
