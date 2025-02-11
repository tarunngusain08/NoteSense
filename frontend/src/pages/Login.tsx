import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StickyNote, BookOpen, PenTool, BookMarked, NotebookPen } from 'lucide-react';
import authService from '../services/authService';

const backgrounds = [
  'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80', // Notebook and coffee
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80', // Clean desk setup
  'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80', // Writing setup
  'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&q=80', // Minimal desk
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80'  // Peaceful mountains
];

const icons = [StickyNote, BookOpen, PenTool, BookMarked, NotebookPen];

const backgroundVariants = {
  initial: { 
    scale: 0.8, 
    opacity: 0 
  },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      duration: 1,
      type: 'spring',
      stiffness: 50
    }
  },
  exit: { 
    scale: 1.2, 
    opacity: 0,
    transition: {
      duration: 0.6
    }
  }
};

const formContainerVariants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    rotateX: -20
  },
  visible: { 
    opacity: 1, 
    y: 0,
    rotateX: 0,
    transition: {
      type: 'spring',
      stiffness: 70,
      damping: 10,
      duration: 0.8
    }
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    transition: { duration: 0.3 }
  }
};

const inputVariants = {
  initial: { 
    opacity: 0, 
    x: -50 
  },
  animate: (custom: number) => ({ 
    opacity: 1, 
    x: 0,
    transition: {
      delay: custom * 0.1,
      type: 'spring',
      stiffness: 100
    }
  }),
  focus: {
    scale: 1.05,
    borderColor: '#4A90E2',
    transition: { duration: 0.3 }
  }
};

const buttonVariants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 120
    }
  },
  hover: { 
    scale: 1.1,
    backgroundColor: '#4A90E2',
    transition: { duration: 0.3 }
  },
  tap: { 
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [currentBg, setCurrentBg] = useState(0);
  const [currentIcon, setCurrentIcon] = useState(0);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const bgInterval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000);

    const iconInterval = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % icons.length);
    }, 2000);

    return () => {
      clearInterval(bgInterval);
      clearInterval(iconInterval);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        // Sign in
        await login(email, password);
        // Navigate to notes page after successful login
        navigate('/notes', {
          state: { 
            transition: {
              type: 'spring',
              stiffness: 300,
              damping: 30
            }
          }
        });
      } else {
        // Sign up
        await signup(email, password, name);
        navigate('/notes', {
          state: { 
            transition: {
              type: 'spring',
              stiffness: 300,
              damping: 30
            }
          }
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during authentication');
    }
  };

  const toggleAuthMode = () => {
    const formContainer = document.querySelector('.form-container');
    formContainer?.classList.add('flip-out');
    setTimeout(() => {
      setIsLogin(!isLogin);
      formContainer?.classList.remove('flip-out');
      formContainer?.classList.add('flip-in');
      setTimeout(() => {
        formContainer?.classList.remove('flip-in');
      }, 500);
    }, 500);
  };

  const CurrentIcon = icons[currentIcon];

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      exit="exit"
      variants={backgroundVariants}
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBg}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8 }}  
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${backgrounds[currentBg]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-[2px]" />
        </motion.div>
      </AnimatePresence>

      <motion.div
        variants={formContainerVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        className="form-container bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 w-full max-w-md relative z-10 transition-all duration-500"
      >
        <div className="flex items-center justify-center mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIcon}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", duration: 0.8, stiffness: 60, damping: 12 }}  
            >
              <CurrentIcon className="w-12 h-12 text-purple-600" />
            </motion.div>
          </AnimatePresence>
        </div>
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="text-3xl font-bold text-center mb-6 text-gray-800"
        >
          {isLogin ? '✨ Welcome back! 📝' : '🌟 Create an account 📚'}
        </motion.h2>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}  
            className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm"
          >
            ❌ {error}
          </motion.div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <motion.div
              custom={0}
              variants={inputVariants}
              initial="initial"
              animate="animate"
              whileFocus="focus"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👤 Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                placeholder="Enter your name"
                required={!isLogin}
              />
            </motion.div>
          )}
          <motion.div
            custom={1}
            variants={inputVariants}
            initial="initial"
            animate="animate"
            whileFocus="focus"
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📧 Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
              placeholder="Enter your email"
              required
            />
          </motion.div>
          <motion.div
            custom={2}
            variants={inputVariants}
            initial="initial"
            animate="animate"
            whileFocus="focus"
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔒 Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
              placeholder="Enter your password"
              required
            />
          </motion.div>
          <motion.button
            variants={buttonVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            type="submit"
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold"
          >
            {isLogin ? '🚀 Sign In' : '✨ Sign Up'}
          </motion.button>
        </form>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-gray-600"
        >
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <motion.span
            whileHover={{ scale: 1.1, color: '#4A90E2' }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleAuthMode}
            className="text-purple-600 cursor-pointer font-bold"
          >
            {isLogin ? '✍️ Sign up' : '🔑 Sign in'}
          </motion.span>
        </motion.p>
      </motion.div>
    </motion.div>
  );
}