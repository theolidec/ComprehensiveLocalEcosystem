import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const Toast = () => {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700';
      case 'error': return 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700';
      default: return 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start space-x-3 p-4 rounded-lg border shadow-lg ${getStyles(notification.type)}`}
        >
          {getIcon(notification.type)}
          <p className="flex-1 text-sm text-gray-900 dark:text-white">{notification.message}</p>
          <button
            onClick={() => removeNotification(notification.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
