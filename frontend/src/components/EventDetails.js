import React from 'react';
import { Calendar, Clock, MapPin, Users, Repeat, Edit, Trash2 } from 'lucide-react';

const EventDetails = ({ event, categories, onEdit, onDelete, onClose }) => {
  const category = categories.find(cat => cat.id === event.category) || { icon: '📅', name: 'Other' };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Event Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: event.color }}
            ></div>
            <span className="text-2xl">{category.icon}</span>
            <h4 className="text-lg font-medium text-gray-900">{event.title}</h4>
          </div>

          {event.description && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">Description</h5>
              <p className="text-gray-600">{event.description}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{new Date(event.date).toLocaleDateString()}</span>
            </div>
            
            {event.isAllDay ? (
              <div className="flex items-center space-x-2 text-sm text-blue-600 font-medium">
                <Clock className="h-4 w-4" />
                <span>All-day event</span>
              </div>
            ) : event.time && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  {event.time}
                  {event.duration && (
                    <span className="ml-1 text-gray-500">
                      ({Math.floor(event.duration / 60)}h{event.duration % 60}m)
                    </span>
                  )}
                </span>
              </div>
            )}
            
            {event.location && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
            
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{event.attendees.length} attendees</span>
              </div>
            )}

            {event.isRecurring && (
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <Repeat className="h-4 w-4" />
                <span className="capitalize">
                  {event.recurringPattern === 'daily' && 'Repeats daily'}
                  {event.recurringPattern === 'weekly' && 'Repeats weekly'}
                  {event.recurringPattern === 'monthly' && 'Repeats monthly'}
                  {event.recurringPattern === 'yearly' && 'Repeats yearly'}
                </span>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={onDelete}
              className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
