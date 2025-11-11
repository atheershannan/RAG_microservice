/**
 * useChat hook - Chat management
 */

import { useSelector, useDispatch } from 'react-redux';
import { addMessage, setLoading, setTyping, setError } from '../store/slices/chat.slice.js';
import { useSubmitQueryMutation } from '../store/api/ragApi.js';

export const useChat = () => {
  const dispatch = useDispatch();
  const chat = useSelector((state) => state.chat);
  const [submitQuery, { isLoading }] = useSubmitQueryMutation();

  const sendMessage = async (message) => {
    dispatch(addMessage({ type: 'user', content: message, timestamp: new Date() }));
    dispatch(setTyping(true));

    try {
      const response = await submitQuery({ query: message }).unwrap();
      dispatch(addMessage({
        type: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      }));
      dispatch(setTyping(false));
    } catch (error) {
      dispatch(setError(error.message));
      dispatch(setTyping(false));
    }
  };

  return {
    ...chat,
    isLoading,
    sendMessage,
  };
};



