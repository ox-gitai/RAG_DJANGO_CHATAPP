'use client';

import { motion } from 'framer-motion';

export default function PageLoadingSkeleton() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans overflow-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
        body { font-family: 'Montserrat', sans-serif; }
      `}</style>

      {/* Sidebar Skeleton */}
      <div className="w-72 bg-[#0a1428] flex flex-col shadow-xl relative">
        {/* Logo Section */}
        <div className="p-5 border-b border-[#142350] h-20 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-700 rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-32 animate-pulse" />
            <div className="h-2 bg-gray-700 rounded w-24 animate-pulse" />
          </div>
        </div>

        {/* Connections Skeleton */}
        <div className="flex-1 p-3 space-y-3">
          <div className="h-3 bg-gray-700 rounded w-24 animate-pulse mb-4" />
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 px-3 py-3 rounded-lg"
            >
              <div className="w-4 h-4 bg-gray-700 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-700 rounded w-full animate-pulse" />
                <div className="h-2 bg-gray-700/50 rounded w-3/4 animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* User Section Skeleton */}
        <div className="p-4 border-t border-[#142350] bg-[#0d133a] h-20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-700 rounded w-24 animate-pulse" />
            <div className="h-2 bg-gray-700 rounded w-16 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="flex-1 flex flex-col">
        {/* Header Skeleton */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200 flex items-center px-6 justify-between shadow-sm"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-300 rounded animate-pulse" />
            <div className="h-4 bg-gray-300 rounded w-48 animate-pulse" />
          </div>
          <div className="w-8 h-8 bg-gray-300 rounded-lg animate-pulse" />
        </motion.header>

        {/* Chat Area Skeleton */}
        <div className="flex-1 p-8 space-y-8 overflow-hidden">
          {/* Empty State Skeleton */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="h-full flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-16 h-16 bg-red-200 rounded-full mb-4"
            />
            <div className="h-6 bg-gray-300 rounded w-64 animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
          </motion.div>
        </div>

        {/* Input Area Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-white/80 backdrop-blur-sm border-t border-gray-200"
        >
          <div className="max-w-4xl mx-auto relative">
            <div className="h-14 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
