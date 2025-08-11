
import DashboardLayout from "@/components/DashboardLayout";

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
      <div className="relative min-h-screen w-full bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-600 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-pink-600 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-3000"></div>
        </div>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">My Profile</h1>
              <p className="text-gray-400 mt-1">Manage your account settings and track your progress.</p>
            </div>
            {isEditing ? (
              <div className="flex gap-3">
                <Button onClick={handleSave} className="bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold hover:scale-105 transition-transform"><Save className="mr-2 h-4 w-4" />Save</Button>
                <Button variant="outline" onClick={handleCancel} className="border-gray-600 hover:bg-gray-800 hover:text-white">Cancel</Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:scale-105 transition-transform shadow-lg hover:shadow-pink-500/40"><Edit className="mr-2 h-4 w-4" />Edit Profile</Button>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-gray-900/50 backdrop-blur-lg border border-purple-500/20 shadow-2xl rounded-2xl p-8 text-center">
                <div className="relative inline-block group mb-6">
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
                  <img src={profileData.avatarUrl} alt="Profile" className="relative w-36 h-36 rounded-full object-cover mx-auto border-4 border-gray-800" />
                  <button onClick={handleImageUploadClick} className="absolute bottom-1 right-1 w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors border-2 border-purple-500/50">
                    <Camera className="h-5 w-5 text-purple-400 group-hover:text-white" />
                  </button>
                </div>
                <h2 className="text-3xl font-bold text-white">{profileData.fullName}</h2>
                <p className="text-purple-400 font-medium">Student</p>
                <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
                  <Mail className="h-5 w-5" />
                  <span>{profileData.email}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-gray-900/50 backdrop-blur-lg border border-purple-500/20 shadow-2xl rounded-2xl p-8 h-full">
                {isEditing ? (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="fullName" className="font-semibold text-pink-400">Full Name</Label>
                      <Input id="fullName" value={profileData.fullName} onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })} className="mt-2 bg-white/5 border-white/10 focus:border-pink-500 rounded-lg" />
                    </div>
                    <div>
                      <Label htmlFor="bio" className="font-semibold text-pink-400">About Me</Label>
                      <Textarea id="bio" value={profileData.bio} onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })} rows={6} className="mt-2 bg-white/5 border-white/10 focus:border-pink-500 rounded-lg styled-scrollbar" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">About Me</h3>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{profileData.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;

              