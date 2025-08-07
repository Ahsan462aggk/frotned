
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Camera, Edit, Save, Mail, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, UnauthorizedError } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface ProfileData {
  fullName: string;
  email: string;
  bio: string;
  avatarUrl: string;
}

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [originalProfileData, setOriginalProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth('/api/profile/profile');
      const data = await response.json();
      
      const userSession = JSON.parse(localStorage.getItem('user') || '{}');

      const fetchedData = {
        fullName: data.full_name || "New User",
        email: userSession.email, // Use email from localStorage session
        bio: data.bio || "This is your bio. Click edit to change it.",
        avatarUrl: data.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${data.full_name || 'U'}`
      };
      setProfileData(fetchedData);
      setOriginalProfileData(fetchedData);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        toast({ title: "Session Expired", description: "Please log in again.", variant: "destructive" });
        navigate('/login');
      } else {
        setError("Failed to fetch profile data.");
        toast({ title: "Error", description: "Could not load your profile.", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!profileData) return;

    try {
      const response = await fetchWithAuth('/api/profile/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        data: {
          full_name: profileData.fullName,
          bio: profileData.bio,
        },
      });
      const updatedProfile = await response.json();
      
      const newData = {
        ...profileData,
        fullName: updatedProfile.full_name,
        bio: updatedProfile.bio,
      };
      setProfileData(newData);
      setOriginalProfileData(newData);

      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        navigate('/login');
      } else {
        toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
      }
    }
  };

  const handleCancel = () => {
    setProfileData(originalProfileData);
    setIsEditing(false);
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation for file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid File Type", description: "Please select a valid image file (JPEG, PNG, GIF).", variant: "destructive" });
      return;
    }

    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      toast({ title: "File Too Large", description: "Please select a file smaller than 5MB.", variant: "destructive" });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setProfileData(prev => prev ? { ...prev, avatarUrl: previewUrl } : null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await fetchWithAuth('/api/profile/profile/avatar', {
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await uploadResponse.json();
      toast({
        title: "Upload Successful",
        description: "Refreshing profile...",
      });
      await fetchProfile(); // Re-fetch the profile to get the new avatar URL
    } catch (err) {
      setProfileData(originalProfileData); // Revert on failure
      console.error("Avatar upload error:", err);
      toast({ title: "Error", description: "Failed to upload avatar. Please try again.", variant: "destructive" });
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  };



  if (isLoading) {
    return (
      <DashboardLayout userType="student">
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profileData) {
    return (
      <DashboardLayout userType="student">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error</h2>
          <p className="text-muted-foreground">{error || "Could not load profile."}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="student">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground">Manage your account settings and track your progress</p>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="glass-card p-8 lg:col-span-1">
            <div className="text-center space-y-6">
              <div className="relative inline-block">
                <img 
                  src={profileData.avatarUrl}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover mx-auto"
                />
                <button 
                  onClick={handleImageUploadClick}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors"
                >
                  <Camera className="h-5 w-5 text-primary-foreground" />
                </button>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold">{profileData.fullName}</h2>
                <p className="text-muted-foreground">Student</p>
              </div>

              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3 text-muted-foreground">
                  <Mail className="h-5 w-5" />
                  <span>{profileData.email}</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="lg:col-span-2">
            <Card className="glass-card p-8">
              {isEditing ? (
                <>
                  <h3 className="text-xl font-bold mb-6">Edit Information</h3>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        rows={5}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-6">About Me</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {profileData.bio}
                  </p>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;

              