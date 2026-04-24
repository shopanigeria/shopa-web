'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export function usePushNotifications() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    const registerToken = async () => {
      try {
        const token = await requestNotificationPermission();
        if (!token) return;

        // Register token with backend
        await apiClient.post('/notifications/register-device', {
          fcmToken: token,
          platform: 'web',
        });
      } catch {
        // Silent fail — notifications are non-critical
      }
    };

    registerToken();

    // Handle foreground notifications
    onForegroundMessage((payload) => {
      const p = payload as { notification?: { title?: string; body?: string } };
      const title = p.notification?.title || 'Shopa';
      const body = p.notification?.body || 'You have a new notification';
      toast(title, { description: body });
    });
  }, [isAuthenticated, user]);
}
