import { GripVertical, Upload, X } from 'lucide-react';

interface TiresImagesSectionProps {
  draggedIndex: number | null;
  editGallery: string[];
  handleDragEnd: () => void;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>, index: number) => void;
  handleDragStart: (index: number) => void;
  handleImageUpload: (files: FileList | null) => void;
  handleRemoveImage: (index: number) => void;
  isDark: boolean;
  language: string;
  uploadError: string | null;
  uploadingImages: boolean;
}

export function TiresImagesSection({
  draggedIndex,
  editGallery,
  handleDragEnd,
  handleDragOver,
  handleDragStart,
  handleImageUpload,
  handleRemoveImage,
  isDark,
  language,
  uploadError,
  uploadingImages,
}: TiresImagesSectionProps) {
  return (
    <div>
      <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {language === 'fi' ? 'Kuvat' : 'Images'}
      </h3>

      {editGallery.length < 10 && (
        <label className="block cursor-pointer mb-4">
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDark
              ? 'border-white/20 hover:border-white/40 bg-white/5'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}>
            <Upload className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {uploadingImages
                ? (language === 'fi' ? 'Ladataan...' : 'Uploading...')
                : (language === 'fi' ? 'Klikkaa tai liitä kuvia' : 'Click or paste images')}
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG max 5MB ({editGallery.length}/10)
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'fi'
                ? 'Kopioi kuva ja paina Cmd/Ctrl+V editorissa'
                : 'Copy an image and press Cmd/Ctrl+V in the editor'}
            </p>
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleImageUpload(e.target.files)}
            disabled={uploadingImages}
            className="hidden"
          />
        </label>
      )}

      {uploadError && (
        <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
          <p className="text-sm">{uploadError}</p>
        </div>
      )}

      {editGallery.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {editGallery.map((url, index) => (
            <div
              key={url}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
              } ${
                isDark ? 'border-white/10 hover:border-white/30' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="aspect-square bg-white">
                <img
                  src={url}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-move"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-5 h-5 text-white" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="p-2 rounded-lg bg-red-500/80 hover:bg-red-500 transition-colors"
                  title="Remove"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                index === 0 ? 'bg-blue-500 text-white' : 'bg-black/50 text-white'
              }`}>
                {index === 0 ? 'Hero' : `#${index + 1}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
