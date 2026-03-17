# Day-by-Day Violation Tracking System

## Overview
The Helmet Detection System now stores and tracks violations day by day. This enables admins to:
- View violations aggregated by each day
- Analyze patterns and trends
- Generate daily reports for each zone
- Compare violation rates across different days

## Components

### Frontend
**File**: `frontend/helmet_frontend/src/pages/admin/DailyViolationHistory.jsx`

New admin page with two view modes:
1. **By Zone Mode**: View daily violations for a specific zone
   - Select date range (start and end date)
   - Choose a zone
   - See daily breakdown with statistics

2. **All Zones Mode**: View violations across all zones for a single date
   - Select a specific date
   - See violations for each zone on that day
   - Identify which zones had most violations

#### Features
- **Statistics Dashboard**:
  - Total Violations (sum of all days)
  - Average Daily Violations
  - Highest Day with violation count

- **Severity Color Coding**:
  - Green: Safe (0 violations)
  - Yellow: Low (1-4 violations)
  - Orange: Medium (5-9 violations)
  - Red: High (10+ violations)

- **Violation Frames**: Shows number of violation frames recorded per day

#### Access
- **Route**: `/admin/daily-violations`
- **Sidebar**: "Daily Report" under Control Center
- **Role**: Admin only

### Backend

#### API Endpoints
**Base URL**: `http://localhost:5000/api/daily-summary`

1. **Get Day-Wise Violations for a Zone**
   ```
   GET /day-wise?zone_id={zone_id}&start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}
   ```
   - Returns daily breakdown for a specific zone
   - Includes violation frames and people count

2. **Get All Zones Day-Wise (Specific Date)**
   ```
   GET /day-wise/all-zones?date={YYYY-MM-DD}
   ```
   - Returns all zones' violations for a single date
   - Shows which zones had violations

3. **Get Weekly Violations**
   ```
   GET /weekly?zone_id={zone_id}
   ```
   - Returns last 7 days violations
   - Includes totals and averages

4. **Get Today's Violations**
   ```
   GET /today?zone_id={zone_id}
   ```
   - Returns only today's violations for a zone

#### Database Structure
**Collection**: `daily_summaries`

```javascript
{
  "_id": ObjectId,
  "date": ISODate,               // Start of day (midnight UTC)
  "zone_id": ObjectId,           // Reference to zone
  "violations_count": Number,    // Total violations for the day
  "people_without_helmets": Number, // Count of people without helmets
  "violation_frames": [String],  // Array of frame image paths
  "updated_at": ISODate          // Last update timestamp
}
```

#### How Violations Are Stored

When a detection occurs:
1. Image/video is uploaded
2. YOLO model processes the file
3. If violations found:
   - Detection event is created in `detections` collection
   - **Daily summary is automatically updated** via:
     ```python
     DailySummary.increment_daily_summary(
         date=datetime.utcnow(),
         zone_id=zone_id,
         increment_count=violations_count,
         frame_path=annotated_image_path
     )
     ```

### Frontend API Service
**File**: `frontend/helmet_frontend/src/utils/api.js`

```javascript
api.dailySummary = {
  getDayWiseViolations(zoneId, startDate, endDate),
  getAllZonesDayWise(date),
  getWeeklyViolations(zoneId),
  getTodayViolations(zoneId)
}
```

## Usage

### Admin Dashboard Workflow
1. Navigate to **Admin Dashboard**
2. Click **"Daily Report"** in sidebar (under Control Center)
3. Choose view mode:
   - **By Zone**: Select zone and date range, view daily breakdown
   - **All Zones**: Select date, see violations across all zones

### Example Queries

**Get last 30 days violations for Zone A**:
```
GET /api/daily-summary/day-wise?zone_id=<zone_id>&start_date=2026-02-16&end_date=2026-03-17
```

**Get today's violations for all zones**:
```
GET /api/daily-summary/day-wise/all-zones?date=2026-03-17
```

## Features

### Statistics
- **Total Violations**: Sum of all violations in the selected period
- **Average Daily**: Average violations per day
- **Highest Day**: The day with the most violations

### Filtering
- **Zone Selection**: Choose specific zone or view all zones
- **Date Range**: Select custom start and end dates
- **Daily Grouping**: Automatic aggregation by day (midnight UTC)

### Visualization
- Color-coded severity levels
- Violation counts with badges
- Frame counts per day
- People-without-helmets count

## Data Flow

```
Upload Image/Video
        ↓
Process with YOLO
        ↓
Violations Detected?
        ↓ YES
Create Detection Event
        ↓
Update Daily Summary (Auto)
        ↓
Aggregate by Date & Zone
```

## Integration Points

### With Detection System
- Listens for new violations
- Automatically updates daily summaries
- No manual action required

### With Zone Management
- Links to zone_id in database
- Supports zone filtering
- Zone names in UI

## Troubleshooting

### No Data Showing
1. Check if violations were actually uploaded
2. Verify zone_id is correct
3. Check date range includes detection dates
4. Verify MongoDB daily_summaries collection exists

### Wrong Date/Time
- Ensure backend uses UTC
- Check browser timezone settings
- Verify date format (YYYY-MM-DD)

### Performance Issues
- Limit date range to 90 days or less
- Use zone filtering for better performance
- Archive old summaries if needed

## Future Enhancements

- Export daily reports as PDF/CSV
- Email daily summaries to stakeholders
- Real-time daily updates (WebSocket)
- Predictive analytics for violation trends
- Custom time zone support
- Detailed hourly breakdown within each day

## Technical Notes

- All dates stored in UTC (midnight start)
- Violations aggregated at day level (not hourly)
- Frame paths stored for evidence access
- Uses MongoDB upsert for efficient updates
- Frontend caches zone data for performance
