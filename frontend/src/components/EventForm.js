import React, { useState } from 'react';

const getEventId = (event) => event._id || event.id;

const EventForm = ({ selectedDate, categories, editingEvent, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: editingEvent?.title || '',
    description: editingEvent?.description || '',
    time: editingEvent?.time || '',
    location: editingEvent?.location || '',
    category: editingEvent?.category || 'work',
    attendees: editingEvent?.attendees?.join(', ') || '',
    reminder: editingEvent?.reminder || '15',
    isRecurring: editingEvent?.isRecurring || false,
    recurringPattern: editingEvent?.recurringPattern || 'daily',
    recurringEndDate: editingEvent?.recurringEndDate ? new Date(editingEvent.recurringEndDate).toISOString().split('T')[0] : '',
    recurringOccurrences: editingEvent?.recurringOccurrences || '',
    isAllDay: editingEvent?.isAllDay || false,
    duration: editingEvent?.duration || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const eventData = {
      ...formData,
      duration: formData.duration ? parseInt(formData.duration, 10) : null,
      recurringEndDate: formData.recurringEndDate || null,
      recurringOccurrences: formData.recurringOccurrences ? parseInt(formData.recurringOccurrences, 10) : null,
      attendees: formData.attendees ? formData.attendees.split(',').map(email => email.trim()).filter(email => email) : []
    };
    
    if (editingEvent) {
      onSubmit(getEventId(editingEvent), eventData);
    } else {
      onSubmit(eventData);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {editingEvent ? 'Edit Event' : 'Add Event'} for {selectedDate?.toLocaleDateString()}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter event title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.slice(1).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter event description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                disabled={formData.isAllDay}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter location"
              />
            </div>
          </div>

          {/* All-day and Duration section */}
          <div className="border-t pt-4 mt-2">
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="isAllDay"
                name="isAllDay"
                checked={formData.isAllDay}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  isAllDay: e.target.checked,
                  time: e.target.checked ? '' : prev.time,
                  duration: e.target.checked ? '' : prev.duration
                }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isAllDay" className="text-sm font-medium text-gray-700">
                All-day event
              </label>
            </div>

            {!formData.isAllDay && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No specific duration</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                    <option value="180">3 hours</option>
                    <option value="240">4 hours</option>
                    <option value="360">6 hours</option>
                    <option value="480">8 hours</option>
                  </select>
                </div>

                {formData.duration && formData.time && (
                  <div className="flex items-end">
                    <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="font-medium">End time:</span>{' '}
                      {(() => {
                        const [hours, minutes] = formData.time.split(':').map(Number);
                        const durationMinutes = parseInt(formData.duration, 10);
                        const endDate = new Date();
                        endDate.setHours(hours, minutes + durationMinutes);
                        return endDate.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false 
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attendees (comma separated emails)
            </label>
            <input
              type="text"
              name="attendees"
              value={formData.attendees}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="email1@example.com, email2@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reminder
            </label>
            <select
              name="reminder"
              value={formData.reminder}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="0">No reminder</option>
              <option value="5">5 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="1440">1 day before</option>
            </select>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="checkbox"
                id="isRecurring"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                Repeat this event
              </label>
            </div>

            {formData.isRecurring && (
              <div className="ml-6 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repeat pattern
                  </label>
                  <select
                    name="recurringPattern"
                    value={formData.recurringPattern}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="daily">Every day</option>
                    <option value="weekly">Every week</option>
                    <option value="monthly">Every month</option>
                    <option value="yearly">Every year</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.recurringPattern === 'daily' && 'Event will repeat every day from the start date'}
                    {formData.recurringPattern === 'weekly' && 'Event will repeat on the same day every week'}
                    {formData.recurringPattern === 'monthly' && 'Event will repeat on the same date every month'}
                    {formData.recurringPattern === 'yearly' && 'Event will repeat on the same date every year'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ends on
                    </label>
                    <input
                      type="date"
                      name="recurringEndDate"
                      value={formData.recurringEndDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Or after occurrences
                    </label>
                    <select
                      name="recurringOccurrences"
                      value={formData.recurringOccurrences}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">No limit</option>
                      <option value="5">5 times</option>
                      <option value="10">10 times</option>
                      <option value="25">25 times</option>
                      <option value="50">50 times</option>
                      <option value="100">100 times</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingEvent ? 'Update Event' : 'Add Event'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
