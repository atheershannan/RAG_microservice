/**
 * Floating Chat Widget - Main Component
 */

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box } from '@mui/material';
import { toggleWidget } from '../../../store/slices/ui.slice.js';
import ChatInterface from '../ChatInterface/ChatInterface.jsx';

const FloatingChatWidget = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.ui.isWidgetOpen);

  // TODO: Implement floating widget UI
  return (
    <Box>
      <ChatInterface />
    </Box>
  );
};

export default FloatingChatWidget;



