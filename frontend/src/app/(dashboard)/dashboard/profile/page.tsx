'use client';

import React, { useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Upload, 
  Trash2, 
  Check, 
  Loader2, 
  AlertCircle,
  Camera,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileFormInputs {
  fullName: string;
  dateOfBirth?: string;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { 
    updateProfile, 
    isUpdatingProfile, 
    updateProfileError,
    uploadPhoto,
    isUploadingPhoto,
    removePhoto,
    isRemovingPhoto
  } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormInputs>({
    defaultValues: {
      fullName: user?.fullName || '',
      dateOfBirth: user?.dateOfBirth || '',
    }
  });

  const onSubmit = (data: ProfileFormInputs) => {
    updateProfile(data);
  };

  const handlePhotoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);

    // Client-side validations
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Only JPEG, PNG, and WEBP formats are allowed.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setPhotoError('Image file size must be less than 5MB.');
      return;
    }

    uploadPhoto(file);
  };

  const handleRemovePhoto = () => {
    if (confirm('Are you sure you want to remove your profile photo?')) {
      removePhoto();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-black text-white">Profile Management</h2>
        <p className="text-xs text-slate-400 mt-1">Review your contact information and customize your personal settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Side: Avatar Management */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center gap-6"
        >
          <div className="relative group">
            {user?.profilePhoto ? (
              <img 
                src={`http://localhost:8080${user.profilePhoto}`} 
                alt="Profile photo" 
                className="w-32 h-32 rounded-full object-cover border-2 border-indigo-500/20"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-4xl flex items-center justify-center border-2 border-indigo-500/20 shadow-inner">
                {user ? getInitials(user.fullName) : 'U'}
              </div>
            )}
            
            {/* Camera Hover Overlay */}
            <button 
              onClick={handlePhotoUploadClick}
              disabled={isUploadingPhoto}
              className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-indigo-400"
            >
              {isUploadingPhoto ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Camera className="w-7 h-7 text-white" />}
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">{user?.fullName}</h3>
            <p className="text-xs text-slate-500">@{user?.username}</p>
          </div>

          {/* Hidden file input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp" 
            className="hidden" 
          />

          <div className="flex gap-2 w-full">
            <button 
              onClick={handlePhotoUploadClick}
              disabled={isUploadingPhoto}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 text-xs py-2 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" /> Upload
            </button>
            
            {user?.profilePhoto && (
              <button 
                onClick={handleRemovePhoto}
                disabled={isRemovingPhoto}
                className="p-2 border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:text-white hover:bg-rose-600 rounded-xl transition-all disabled:opacity-50"
                title="Remove photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Photo upload error banner */}
          {photoError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex gap-2 items-start text-left w-full">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{photoError}</span>
            </div>
          )}
        </motion.div>

        {/* Right Side: Form details */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="md:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-6.5"
        >
          <div className="mb-6 border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white">Personal Information</h3>
            <p className="text-xs text-slate-500">View and update your personal identification fields.</p>
          </div>

          {/* Form edit errors */}
          {updateProfileError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs flex gap-2.5 items-start">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <span>{(updateProfileError as any).response?.data?.message || 'Error updating profile. Please try again.'}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name (Editable) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    {...register('fullName', { required: 'Full name is required' })}
                  />
                </div>
                {errors.fullName && (
                  <span className="text-rose-400 text-xs flex gap-1 items-center mt-1">
                    <AlertCircle className="w-3 h-3" /> {errors.fullName.message}
                  </span>
                )}
              </div>

              {/* Date of Birth (Editable) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Date of Birth</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    {...register('dateOfBirth')}
                  />
                </div>
              </div>
            </div>

            {/* Read-Only Grid (Security restriction notice) */}
            <div className="bg-slate-950/60 rounded-2xl p-5 border border-white/5">
              <div className="flex gap-2 items-center text-xs text-indigo-400 mb-4 font-semibold uppercase tracking-wider">
                <Info className="w-4.5 h-4.5" />
                <span>Non-Editable Parameters</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-bold">Username</span>
                  <span className="text-slate-350 block mt-1 font-mono">@{user?.username}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-bold">Email Address</span>
                  <span className="text-slate-350 block mt-1">{user?.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-bold">Mobile Number</span>
                  <span className="text-slate-350 block mt-1">{user?.mobileNumber}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-650 text-white font-semibold text-sm py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Profile Details
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
