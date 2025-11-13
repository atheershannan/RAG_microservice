/**
 * ChatInput - Input component with search icon and send button
 */

import React, { useState } from 'react';
import { HiMagnifyingGlass, HiPaperAirplane } from 'react-icons/hi2';
import { motion } from 'framer-motion';
import { MODES } from '../../../store/slices/chatMode.slice.js';

const ChatInput = ({ onSend, placeholder = 'Type your message...', disabled = false, currentMode = MODES.GENERAL }) => {
  const isSupportMode = currentMode !== MODES.GENERAL;
  
  const getPlaceholder = () => {
    if (currentMode === MODES.ASSESSMENT_SUPPORT) {
      return 'Ask about assessments, exams, scoring...';
    }
    if (currentMode === MODES.DEVLAB_SUPPORT) {
      return 'Ask about code execution, sandbox, submissions...';
    }
    return placeholder;
  };
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className={`border-t ${isSupportMode ? 'border-blue-300' : 'border-gray-200'} p-4 bg-white`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {isSupportMode && (
        <div className="mb-2 text-xs text-gray-600 font-medium px-2">
          {currentMode === MODES.ASSESSMENT_SUPPORT ? (
            <span className="text-blue-600">💡 Assessment Support Mode - General chat disabled</span>
          ) : (
            <span className="text-purple-600">💡 DevLab Support Mode - General chat disabled</span>
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <HiMagnifyingGlass className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isSupportMode ? 'text-blue-400' : 'text-gray-400'}`} />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className={`w-full pl-10 pr-4 py-3 border ${isSupportMode ? 'border-blue-300 focus:ring-blue-500' : 'border-gray-300 focus:ring-emerald-500'} rounded-full focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed`}
          />
        </div>
        <motion.button
          type="submit"
          disabled={!message.trim() || disabled}
          className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full flex items-center justify-center shadow-glow hover:shadow-glow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus-ring"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <HiPaperAirplane className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.form>
  );
};

export default ChatInput;

