import { useState, useRef, ChangeEvent } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface ProfilePictureUploadProps {
  currentPicture?: string;
  username: string;
  onUploadSuccess: (imageUrl: string) => void;
}

export default function ProfilePictureUpload({
  currentPicture,
  username,
  onUploadSuccess,
}: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const userInitials = username.substring(0, 2).toUpperCase();

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4002/api/profile/update-picture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profilePicture: preview }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile picture');
      }

      const data = await response.json();
      onUploadSuccess(data.profilePicture);
      setPreview(null);

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to update profile picture. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayImage = preview || currentPicture;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-lg">
            <AvatarImage src={displayImage} alt={username} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>

          {preview && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">Preview</span>
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 bg-primary rounded-full shadow-lg hover:bg-primary/90 transition-smooth border-4 border-background"
            disabled={uploading}
          >
            <Camera className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {preview ? (
          <div className="flex gap-2 w-full">
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={uploading}
              variant="outline"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full"
            disabled={uploading}
          >
            <Camera className="h-4 w-4 mr-2" />
            Change Photo
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Recommended: Square image, max 5MB
      </p>
    </div>
  );
}
