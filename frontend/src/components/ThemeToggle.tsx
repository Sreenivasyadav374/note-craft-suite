import { Palette, Sun, Moon, Monitor, Zap, Eye, Type } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePreferences, ThemeMode, ThemeColor, FontSize } from "@/context/PreferencesContext";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const { preferences, updatePreference } = usePreferences();

  const themeIcons: Record<ThemeMode, React.ReactNode> = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  };

  const themeColors: { value: ThemeColor; label: string; class: string }[] = [
    { value: 'gold', label: 'Gold', class: 'bg-gradient-to-r from-yellow-400 to-yellow-600' },
    { value: 'blue', label: 'Blue', class: 'bg-gradient-to-r from-blue-400 to-blue-600' },
    { value: 'green', label: 'Green', class: 'bg-gradient-to-r from-green-400 to-green-600' },
    { value: 'rose', label: 'Rose', class: 'bg-gradient-to-r from-rose-400 to-rose-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Theme & Appearance</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Customize the look and feel of your workspace
        </p>
      </div>

      <div className="space-y-4 bg-gradient-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            {preferences.themeMode === 'light' ? (
              <Sun className="h-4 w-4 text-primary" />
            ) : preferences.themeMode === 'dark' ? (
              <Moon className="h-4 w-4 text-primary" />
            ) : (
              <Monitor className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm">Dark Mode</h4>
            <p className="text-xs text-muted-foreground">Choose your preferred theme</p>
          </div>
        </div>

        <div className="pt-2">
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <Button
                key={mode}
                variant={preferences.themeMode === mode ? 'default' : 'outline'}
                size="sm"
                onClick={() => updatePreference('themeMode', mode)}
                className="flex items-center gap-2 justify-center"
              >
                {themeIcons[mode]}
                <span className="capitalize">{mode}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-gradient-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Palette className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm">Theme Color</h4>
            <p className="text-xs text-muted-foreground">Select your accent color</p>
          </div>
        </div>

        <div className="pt-2">
          <div className="grid grid-cols-2 gap-2">
            {themeColors.map((color) => (
              <Button
                key={color.value}
                variant={preferences.themeColor === color.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => updatePreference('themeColor', color.value)}
                className="flex items-center gap-2 justify-start"
              >
                <div className={`w-4 h-4 rounded-full ${color.class}`} />
                <span>{color.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-gradient-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Type className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm">Font Size</h4>
            <p className="text-xs text-muted-foreground">Adjust text size for readability</p>
          </div>
        </div>

        <div className="pt-2">
          <Select
            value={preferences.fontSize}
            onValueChange={(value) => updatePreference('fontSize', value as FontSize)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="large">Large</SelectItem>
              <SelectItem value="extra-large">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 bg-gradient-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Eye className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm">Accessibility</h4>
            <p className="text-xs text-muted-foreground">Options for better accessibility</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="reducedMotion" className="text-sm">Reduce motion</Label>
            </div>
            <Switch
              id="reducedMotion"
              checked={preferences.reducedMotion}
              onCheckedChange={(checked) => updatePreference('reducedMotion', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="highContrast" className="text-sm">High contrast</Label>
            </div>
            <Switch
              id="highContrast"
              checked={preferences.highContrast}
              onCheckedChange={(checked) => updatePreference('highContrast', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
