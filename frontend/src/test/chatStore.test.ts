import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatStore } from '../features/chat/presentation/store/chatStore';

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.setState({ messages: [], isLoading: false, error: null });
  });

  it('initializes with empty messages', () => {
    const { result } = renderHook(() => useChatStore());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loads messages successfully', async () => {
    const { result } = renderHook(() => useChatStore());

    await act(async () => {
      await result.current.loadMessages();
    });

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });
  });

  it('adds a message successfully', async () => {
    const { result } = renderHook(() => useChatStore());

    await act(async () => {
      await result.current.addMessage('Hello', 'user');
    });

    await waitFor(() => {
      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].content).toBe('Hello');
      expect(result.current.messages[0].role).toBe('user');
    });
  });

  it('clears error', async () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
