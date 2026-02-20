import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [bgStyle, setBgStyle] = useState('bg-white');
  const [textColor, setTextColor] = useState('text-black');

  useEffect(() => {
    const storedTheme = localStorage.getItem('alumni-portal-theme');

    if (storedTheme) {
      setBgStyle(storedTheme);

      if (storedTheme.includes('white') || storedTheme.includes('light')) {
        setTextColor('text-black');
      } else {
        setTextColor('text-white');
      }
    } else {
      setBgStyle('bg-gradient-to-br from-purple-600 to-indigo-700');
      setTextColor('text-white');
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${bgStyle}`}
      >
        <motion.img
          src="/project_logo.png"
          alt="Alumni Connect Logo"
          className="w-92 h-92 md:w-96 md:h-96"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: [0.5, 1.1, 0.95, 1],
            opacity: 1
          }}
          transition={{
            duration: 2,
            ease: [0.175, 0.885, 0.32, 1.275]
          }}
        />

        <div className="flex space-x-2 mt-4">
          {[...Array(3)].map((_, index) => (
            <motion.div
              key={index}
              className={`w-3 h-3 rounded-full ${textColor === 'text-white' ? 'bg-white' : 'bg-indigo-600'}`}
              animate={{
                y: [0, -10, 0],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                repeat: Infinity,
                duration: 0.6,
                delay: index * 0.2
              }}
            />
          ))}
        </div>

        <motion.p
          className={`mt-8 text-2xl md:text-3xl font-semibold ${textColor} flex items-center`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 1,
            duration: 1,
            ease: 'easeOut'
          }}
        >
          Connecting Alumni
          <span className="flex ml-1">
            {[...Array(3)].map((_, i) => (
              <motion.span
                key={i}
                className="mx-0.5"
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  delay: i * 0.3
                }}
              >
                .
              </motion.span>
            ))}
          </span>
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
