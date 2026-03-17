"use client";

import { motion } from "framer-motion";

interface ProductScreenshotProps {
  title: string;
  description: string;
  imageSrc?: string;
  children?: React.ReactNode;
  reverse?: boolean;
}

export function ProductScreenshot({ 
  title, 
  description, 
  imageSrc, 
  children,
  reverse = false 
}: ProductScreenshotProps) {
  return (
    <div className={`flex flex-col ${reverse ? "md:flex-row-reverse" : "md:flex-row"} gap-12 items-center`}>
      {/* Screenshot/Preview */}
      <motion.div
        initial={{ opacity: 0, x: reverse ? 20 : -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex-1 w-full"
      >
        <div className="relative rounded-2xl overflow-hidden border-2 border-[#e5e7eb] shadow-2xl bg-white">
          {/* Browser chrome */}
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 mx-4 px-3 py-1 bg-white rounded-md text-xs text-gray-400">
              compakt.app
            </div>
          </div>
          
          {/* Content */}
          <div className="bg-gradient-to-br from-gray-50 to-white p-8">
            {imageSrc ? (
              <img src={imageSrc} alt={title} className="w-full rounded-lg" />
            ) : children ? (
              <div className="w-full">{children}</div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-[#059cc0]/10 to-[#03b28c]/10 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#059cc0] to-[#03b28c] flex items-center justify-center">
                    <span className="text-white text-2xl">🎵</span>
                  </div>
                  <p className="text-sm text-gray-400">תצוגה מקדימה</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, x: reverse ? -20 : 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex-1"
      >
        <h3 className="text-2xl md:text-3xl font-bold text-[#1f1f21] mb-4">
          {title}
        </h3>
        <p className="text-lg text-[#4b5563] leading-relaxed">
          {description}
        </p>
      </motion.div>
    </div>
  );
}
