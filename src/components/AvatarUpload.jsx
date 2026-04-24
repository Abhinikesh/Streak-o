import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Spinner from './ui/Spinner';

export default function AvatarUpload({ avatarUrl, name, size = 40, onUpdate }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const displayName = name || 'U';
  const initChar = displayName.charAt(0).toUpperCase();

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validation: Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      e.target.value = ''; // Reset input
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/api/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data && response.data.avatar) {
        onUpdate(response.data.avatar);
      }
    } catch (error) {
      console.error('Avatar upload failed:', error);
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div
      className="relative group cursor-pointer inline-block"
      style={{ width: size, height: size }}
      onClick={() => fileInputRef.current?.click()}
    >
      {/* Avatar Display */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Profile"
          className="rounded-full object-cover shadow-sm bg-gray-50"
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <div
          className="rounded-full bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-indigo-100 flex items-center justify-center font-bold shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-600"
          style={{ width: '100%', height: '100%', fontSize: size * 0.4 }}
        >
          {initChar}
        </div>
      )}

      {/* Loading Overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
          <Spinner size="sm" />
        </div>
      )}

      {/* Hover Overlay */}
      {!isUploading && (
        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-[10px] font-bold text-center leading-tight drop-shadow-md">
            📷<br />Change
          </span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
