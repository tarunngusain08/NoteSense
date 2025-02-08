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
        navigate('/notes');
      } else {
        // Sign up
        await signup(email, password, name);
        navigate('/notes');
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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBg}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="form-container bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 w-full max-w-md relative z-10 transition-all duration-500"
      >
        <div className="flex items-center justify-center mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIcon}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <CurrentIcon className="w-12 h-12 text-purple-600" />
            </motion.div>
          </AnimatePresence>
        </div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl font-bold text-center mb-8 text-gray-800"
        >
          {isLogin ? '✨ Welcome back! 📝' : '🌟 Create an account 📚'}
        </motion.h2>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm"
          >
            ❌ {error}
          </motion.div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
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
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
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
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
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
            whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all"
          >
            {isLogin ? '🚀 Sign In' : '✨ Sign Up'}
          </motion.button>
        </form>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center text-gray-600"
        >
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={toggleAuthMode}
            className="text-purple-600 font-semibold hover:text-purple-700 transition-colors"
          >
            {isLogin ? '✍️ Sign up' : '🔑 Sign in'}
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
}