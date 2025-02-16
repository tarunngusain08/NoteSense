import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Paperclip } from 'lucide-react';

interface RichTextEditorProps {
  onFileAttach?: (files: File[]) => void;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  onFileAttach, 
  className = '',
  ...props 
}) => {
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachedFiles(prevFiles => [...prevFiles, ...newFiles]);
      
      // If a callback is provided, call it
      if (onFileAttach) {
        onFileAttach(newFiles);
      }
    }
  };

  return (
    <div className={`rich-text-editor relative ${className}`}>
      {/* Existing editor content */}
      
      <div 
        className="attach-file-container absolute bottom-4 left-4 z-10"
      >
        <input 
          type="file" 
          id="file-attach" 
          multiple 
          className="hidden"
          onChange={handleFileAttach}
        />
        <motion.label 
          htmlFor="file-attach"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="attach-file-button flex items-center justify-center 
                     w-12 h-12 rounded-full bg-gray-100 
                     cursor-pointer shadow-md hover:bg-gray-200"
        >
          <Paperclip className="text-gray-600" size={24} />
        </motion.label>
      </div>

      {attachedFiles.length > 0 && (
        <div className="attached-files mt-2 text-sm text-gray-600">
          <div>Attached Files:</div>
          {attachedFiles.map((file, index) => (
            <div key={index} className="truncate">
              {file.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;