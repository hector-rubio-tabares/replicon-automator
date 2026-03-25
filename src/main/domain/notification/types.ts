/**
 * Domain types for notification system
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: 'success' | 'error' | 'warning' | 'info';
  silent?: boolean;
  onClick?: () => void;
}
