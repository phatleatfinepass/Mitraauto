import { useCallback, useState } from 'react';
import { supabase } from '../../../utils/supabase/client';
import type { ProductCMS, TireRow } from './types';

export function useTiresCmsImages({
  editData,
  selectedTire,
  setEditData,
}: {
  editData: Partial<ProductCMS>;
  selectedTire: TireRow | null;
  setEditData: React.Dispatch<React.SetStateAction<Partial<ProductCMS>>>;
}) {
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const clearImageFeedback = () => {
    setUploadError(null);
  };

  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0 || !selectedTire) return;
    setUploadingImages(true);
    setUploadError(null);

    try {
      const currentGallery = (editData.gallery as string[]) || [];
      if (currentGallery.length + files.length > 10) {
        throw new Error('Maximum 10 images allowed');
      }

      const newImages: string[] = [];

      for (const file of files) {
        const mimeExtension = file.type.startsWith('image/')
          ? file.type.slice('image/'.length).replace('jpeg', 'jpg')
          : '';
        const originalExtension = file.name.includes('.') ? file.name.split('.').pop() ?? '' : '';
        const ext = originalExtension || mimeExtension || 'png';

        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image`);
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} exceeds 5MB limit`);
        }

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const filename = `${timestamp}_${randomStr}.${ext}`;
        const path = `tires/${selectedTire.variant_id}/${filename}`;

        const { error } = await supabase.storage
          .from('product-images')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from('product-images').getPublicUrl(path);

        newImages.push(publicUrl);
      }

      const updatedGallery = [...currentGallery, ...newImages];
      setEditData((prev) => ({
        ...prev,
        gallery: updatedGallery,
        hero_image_url: updatedGallery[0] || prev.hero_image_url,
      }));
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  }, [editData.gallery, selectedTire, setEditData]);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await uploadFiles(Array.from(files));
  };

  const handleClipboardImagePaste = useCallback(async (clipboardData: DataTransfer | null) => {
    if (!clipboardData) return false;

    const pastedImages = Array.from(clipboardData.items)
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (pastedImages.length === 0) {
      return false;
    }

    await uploadFiles(pastedImages);
    return true;
  }, [uploadFiles]);

  const handleRemoveImage = async (index: number) => {
    const gallery = (editData.gallery as string[]) || [];
    const imageUrl = gallery[index];

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

    const updatedGallery = gallery.filter((_, i) => i !== index);
    setEditData((prev) => ({
      ...prev,
      gallery: updatedGallery,
      hero_image_url: updatedGallery[0] || null,
    }));
  };

  return {
    clearImageFeedback,
    handleClipboardImagePaste,
    handleImageUpload,
    handleRemoveImage,
    setUploadError,
    uploadError,
    uploadingImages,
  };
}
