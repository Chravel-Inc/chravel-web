import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('defaults to dark and adds Tailwind `dark` class (not `light`)', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDarkMode).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('persists light mode and adds html.light for global CSS', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggleTheme(false);
    });
    expect(result.current.isDarkMode).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('removes light class when switching back to dark', () => {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDarkMode).toBe(false);
    act(() => {
      result.current.toggleTheme(true);
    });
    expect(result.current.isDarkMode).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
