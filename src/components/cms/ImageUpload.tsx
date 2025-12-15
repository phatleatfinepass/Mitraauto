import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { Upload, X, GripVertical } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface ImageUploadProps {
  images: string[];
  maxImages?: number;
  onImagesChange: (images: string[]) => void;
  productType: 'tire' | 'rim';
  variantId: string;
}

export function ImageUpload({ images, maxImages = 10, onImagesChange, productType, variantId }: ImageUploadProps) {
  const { theme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    try {
      const newImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image`);
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} exceeds 5MB limit`);
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const ext = file.name.split('.').pop();
        const filename = `${timestamp}_${randomStr}.${ext}`;
        const path = `${productType}s/${variantId}/${filename}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(path);

        newImages.push(publicUrl);
      }

      // Add new images to existing ones (up to max)
      const updatedImages = [...images, ...newImages].slice(0, maxImages);
      onImagesChange(updatedImages);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (index: number) => {
    const imageUrl = images[index];
    
    // Try to delete from storage (optional - may fail if already deleted)
    try {
      const urlPath = new URL(imageUrl).pathname;
      const pathParts = urlPath.split('/product-images/');
      if (pathParts.length > 1) {
        const storagePath = pathParts[1];
        await supabase.storage.from('product-images').remove([storagePath]);
      }
    } catch (error) {
      console.warn('Could not delete from storage:', error);
    }

    // Remove from list
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    
    onImagesChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const isDark = theme === 'dark';
  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {canAddMore && (
        <label className={`block cursor-pointer`}>
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDark 
              ? 'border-white/20 hover:border-white/40 bg-white/5' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}>
            <Upload className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {uploading ? 'Uploading...' : 'Click to upload images'}
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              PNG, JPG up to 5MB ({images.length}/{maxImages} images)
            </p>
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading || !canAddMore}
            className="hidden"
          />
        </label>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
          <p className="text-sm">{uploadError}</p>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div
              key={url}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                draggedIndex === index 
                  ? 'opacity-50 scale-95' 
                  : 'opacity-100 scale-100'
              } ${
                isDark ? 'border-white/10 hover:border-white/30' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {/* Image */}
              <div className="aspect-square bg-white">
                <img 
                  src={url} 
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Overlay */}
              <div className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2`}>
                {/* Drag Handle */}
                <button
                  type="button"
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-move"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-5 h-5 text-white" />
                </button>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-2 rounded-lg bg-red-500/80 hover:bg-red-500 transition-colors"
                  title="Remove image"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Image Number Badge */}
              <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                index === 0 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-black/50 text-white'
              }`}>
                {index === 0 ? 'Hero' : `#${index + 1}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <p className={`text-sm text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          No images uploaded yet
        </p>
      )}
    </div>
  );
}
