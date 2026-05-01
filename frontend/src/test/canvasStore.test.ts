import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCanvasStore } from '../features/canvas/presentation/store/canvasStore';

describe('useCanvasStore', () => {
  beforeEach(() => {
    useCanvasStore.setState({ document: null, isLoading: false, error: null });
  });

  it('initializes with null document', () => {
    const { result } = renderHook(() => useCanvasStore());
    expect(result.current.document).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loads document successfully', async () => {
    const { result } = renderHook(() => useCanvasStore());

    await act(async () => {
      await result.current.loadDocument();
    });

    await waitFor(() => {
      expect(result.current.document).not.toBeNull();
      expect(result.current.document?.title).toBe('Welcome Document');
    });
  });

  it('updates document content', async () => {
    const { result } = renderHook(() => useCanvasStore());

    await act(async () => {
      await result.current.loadDocument();
    });

    await waitFor(() => {
      expect(result.current.document).not.toBeNull();
    });

    await act(async () => {
      await result.current.updateContent('# Updated Content');
    });

    await waitFor(() => {
      expect(result.current.document?.content).toBe('# Updated Content');
    });
  });

  it('clears error', () => {
    const { result } = renderHook(() => useCanvasStore());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
