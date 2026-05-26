# Daily Tracker Module

## Overview

The Daily Tracker is a personal productivity and habit-tracking module that allows users to manage recurring tasks, answer custom daily check-in questions, and visualize their progress through interactive statistics and analytics.

## Features

### Task Management
- **Recurring Tasks**: Set up tasks with daily, weekly, bi-weekly, monthly, quarterly, yearly, or custom recurrence
- **Weekly Day Selection**: Choose specific days of the week for weekly recurring tasks
- **Custom Recurrence**: Specify any number of days for custom recurrence intervals
- **Due Dates & Deadlines**: Set due dates for one-time tasks with time constraints
- **Priority Levels**: low, medium, high, urgent — with color-coded badges
- **Categories**: Organize tasks into custom categories (e.g., Work, Health, Learning)
- **Estimated Time**: Track estimated minutes per task
- **Task States**: active, paused, completed, archived
- **Tags**: Add custom tags for flexible organization

### Daily Check-in Questions
- **Custom Questions**: Create personalized daily reflection questions
- **Response Types**:
  - **Yes/No**: Simple boolean answers (e.g., "Did I learn something today?")
  - **Yes/No/Maybe**: Three-option answers for uncertain responses
  - **Scale**: Configurable numeric scale with min/max labels (e.g., "Rate your energy level 1-5")
  - **Text**: Free-form text responses
  - **Number**: Numeric value responses
- **Question Icons**: Predefined icons (Learning, Wellness, Mental, Fitness, Gratitude, Energy, Goals)
- **Categories**: Group questions by category
- **Required/Optional**: Mark questions as required or optional
- **Active/Inactive**: Toggle questions on/off without deleting

### Daily Check-in (Today View)
- **Progress Bar**: Visual progress indicator for today's task completion
- **Mood Tracker**: 5-level mood selection (Bad → Great)
- **Task Checklist**: Quick toggle for today's tasks
- **Question Answers**: Interactive response widgets per question type
- **Daily Notes**: Free-form notes for daily reflections

### Statistics & Analytics
- **Streak Tracking**: Current streak and longest streak calculations
- **Completion Rate**: 30-day task completion percentage
- **Priority Breakdown**: Visual bar chart of tasks by priority
- **Category Breakdown**: Task distribution across categories
- **Daily Activity Chart**: 30-day bar chart of completed tasks
- **Mood Trend**: Color-coded mood visualization over time
- **Activity Heatmap**: GitHub-style yearly activity heatmap with year navigation
- **Question Statistics**: Aggregated responses per question (yes/no ratios, averages)

### Data Management
- **Export**: Full data export (tasks, questions, responses) as JSON
- **Import**: Bulk import of tracker data from JSON

## API Endpoints

### Base: `/api/tracker`

#### Tasks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/tasks` | Yes | List tasks with filtering and pagination |
| GET | `/tasks/today` | Yes | Get today's tasks with completion status |
| POST | `/tasks` | Yes | Create new task |
| PUT | `/tasks/:id` | Yes | Update task |
| DELETE | `/tasks/:id` | Yes | Delete task (cleans up responses) |

**Query Parameters for GET /tasks**:
- `status` - Filter by status (active, paused, completed, archived)
- `recurrence` - Filter by recurrence type
- `priority` - Filter by priority
- `category` - Filter by category
- `search` - Search in title/description
- `sort` - Sort by (order, priority, dueDate, createdAt)
- `page`, `limit` - Pagination

**Task Object**:
```json
{
  "title": "Morning Meditation",
  "description": "10 minutes mindfulness",
  "category": "Health",
  "priority": "high",
  "recurrence": "daily",
  "weeklyDays": [],
  "dueDate": null,
  "startDate": "2026-05-01",
  "estimatedMinutes": 10,
  "tags": ["mindfulness", "health"]
}
```

#### Questions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/questions` | Yes | List questions |
| POST | `/questions` | Yes | Create question |
| PUT | `/questions/:id` | Yes | Update question |
| DELETE | `/questions/:id` | Yes | Delete question (cleans up responses) |

**Question Object**:
```json
{
  "question": "Did I learn something today?",
  "responseType": "yesno",
  "category": "Learning",
  "isRequired": true,
  "icon": "book",
  "isActive": true
}
```

**Scale Question**:
```json
{
  "question": "Rate your energy level",
  "responseType": "scale",
  "scaleMin": 1,
  "scaleMax": 5,
  "scaleLabels": {
    "minLabel": "Exhausted",
    "maxLabel": "Energized"
  }
}
```

#### Responses / Check-in

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/responses` | Yes | List responses with date filtering |
| GET | `/responses/today` | Yes | Get today's response |
| POST | `/responses` | Yes | Save/upsert daily response |

**Response Object**:
```json
{
  "date": "2026-05-02",
  "taskCompletions": [
    { "task": "taskId", "completed": true, "completedAt": "2026-05-02T08:30:00Z" }
  ],
  "questionResponses": [
    { "question": "questionId", "value": true }
  ],
  "mood": 4,
  "overallNotes": "Great day! Got a lot done."
}
```

The POST `/responses` endpoint performs an **upsert**: if a response for the given date already exists, it merges the new data into the existing record.

#### Statistics & Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stats` | Yes | Overview statistics |
| GET | `/analytics` | Yes | Detailed analytics (daily activity, mood trends, question stats) |
| GET | `/heatmap` | Yes | Yearly activity heatmap data |

**Query Parameters for GET /heatmap**:
- `year` - Target year (default: current year)

#### Data Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/export` | Yes | Export all tracker data as JSON |
| POST | `/import` | Yes | Import tracker data from JSON |

## Database Models

### TrackerTask
- Fields: title, description, user, category, priority, recurrence, customRecurrenceDays, weeklyDays, dueDate, startDate, endDate, estimatedMinutes, status, isCompleted, completedAt, order, tags
- Indexes: user+status, user+dueDate, user+recurrence, user+category
- Static methods: `getStatsByUser(userId)`

### TrackerQuestion
- Fields: question, user, responseType, scaleMin, scaleMax, scaleLabels, category, isActive, isRequired, order, icon, color, reminderTime
- Indexes: user+isActive, user+category

### TrackerResponse
- Fields: user, date, taskCompletions[], questionResponses[], mood, overallNotes
- Indexes: user+date (unique), user+taskCompletions.task, user+questionResponses.question
- Static methods: `getStreakByUser(userId)`, `getCompletionRateByUser(userId, days)`, `getAnalyticsByUser(userId)`

## Frontend Components

### DailyTracker.js
Main page component with 4 tabs:
1. **Today** — Daily check-in view with progress bar, mood selector, task checklist, question answers, notes
2. **Tasks** — Task management with CRUD, filtering, search, recurrence configuration
3. **Questions** — Question management with CRUD, response type configuration, icon selection
4. **Statistics** — Interactive stats dashboard with charts, heatmap, streaks, completion rates

### trackerAPI.js
Frontend API service with methods for all tracker endpoints.

## Navigation

- **Route**: `/tracker`
- **Header**: Apps dropdown → "Daily Tracker" (CheckSquare icon, emerald color)
- **Home**: Quick Access grid → "Daily Tracker" card
- **Sidebar**: Tab navigation (Today, Tasks, Questions, Statistics)

---

**Last Updated**: May 7, 2026
**Version**: 2.0.0
