import { Bell, ArrowUpDown, Type, Save, CheckCheck, Palette } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/context/PreferencesContext";
import { useToast } from "@/hooks/use-toast";
import { notificationService } from "@/services/notificationService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ThemeToggle from "@/components/ThemeToggle";

export default function AppPreferences() {
  const { preferences, updatePreference, resetPreferences } = usePreferences();
  const { toast } = useToast();

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await notificationService.requestPermission();
      if (!granted) {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
        return;
      }
    }
    updatePreference('notificationsEnabled', enabled);
    toast({
      title: "Preferences updated",
      description: `Notifications ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  const handleReset = () => {
    resetPreferences();
    toast({
      title: "Preferences reset",
      description: "All preferences have been reset to defaults",
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="mt-6">
          <ThemeToggle />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6 mt-6">

      {/* Notifications */}
      <div className="space-y-4 bg-gradient-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm">Notifications</h4>
            <p className="text-xs text-muted-foreground">Get reminders for your notes</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Label htmlFor="notifications" className="text-sm">Enable notifications</Label>
          <Switch
            id="notifications"
            checked={preferences.notificationsEnabled}
            onCheckedChange={handleNotificationToggle}
          />
        </div>
      </div>

      {/* Sort Order */}
      <div className="space-y-4 bg-gradient-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ArrowUpDown className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm">Default Sort Order</h4>
            <p className="text-xs text-muted-foreground">How notes are organized by default</p>
          </div>
        </div>
        <div className="pt-2">
          <Select
            value={preferences.defaultSortOrder}
            onValueChange={(value) => updatePreference('defaultSortOrder', value as any)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Updated</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Editor Preferences */}
      <div className="space-y-4 bg-gradient-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Type className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm">Editor Settings</h4>
            <p className="text-xs text-muted-foreground">Customize your writing experience</p>
          </div>
        </div>
        
        <div className="space-y-4 pt-2">
          <div>
            <Label htmlFor="fontSize" className="text-sm mb-2 block">Font Size</Label>
            <Select
              value={preferences.editorFontSize}
              onValueChange={(value) => updatePreference('editorFontSize', value as any)}
            >
              <SelectTrigger id="fontSize" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="autoSave" className="text-sm">Auto-save</Label>
            </div>
            <Switch
              id="autoSave"
              checked={preferences.autoSave}
              onCheckedChange={(checked) => updatePreference('autoSave', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCheck className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="spellCheck" className="text-sm">Spell check</Label>
            </div>
            <Switch
              id="spellCheck"
              checked={preferences.editorSpellCheck}
              onCheckedChange={(checked) => updatePreference('editorSpellCheck', checked)}
            />
          </div>
        </div>
      </div>

          {/* Reset Button */}
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full"
          >
            Reset to Defaults
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
