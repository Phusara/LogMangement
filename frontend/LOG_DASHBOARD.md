# Log Management Dashboard

A modern, real-time log management dashboard built with Vue 3, featuring beautiful dark UI and interactive charts.

## Features

- 📊 **Interactive Charts** - Real-time event timeline visualization using vue-chartjs
- 📈 **Stats Cards** - Quick overview of total events, unique users, IPs, and errors
- 🔍 **Advanced Filtering** - Filter logs by tenant, event type, and date range
- 📋 **Detailed Logs Table** - View comprehensive log entries with severity badges
- 🎨 **Dark Theme UI** - Sleek dark interface matching modern design standards
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next-generation frontend tooling
- **vue-chartjs** - Chart.js wrapper for Vue
- **Chart.js** - Simple yet flexible JavaScript charting
- **date-fns** - Modern JavaScript date utility library
- **Vue Router** - Official router for Vue.js

## Project Structure

```
src/
├── components/
│   ├── FilterPanel.vue      # Sidebar filter panel
│   ├── LogsTable.vue         # Logs data table
│   ├── Sidebar.vue           # Main navigation sidebar
│   ├── StatsCard.vue         # Statistics card component
│   ├── TimelineChart.vue     # Chart.js line chart
│   ├── TopItemsList.vue      # Top items list with progress bars
│   └── icons/                # SVG icon components
│       ├── IconActivity.vue
│       ├── IconAlert.vue
│       ├── IconServer.vue
│       └── IconUsers.vue
├── utils/
│   └── mockData.js           # Mock data generator
├── views/
│   └── DashboardView.vue     # Main dashboard view
├── router/
│   └── index.js              # Router configuration
├── App.vue                   # Root component
└── main.js                   # Application entry point
```

## Components

### StatsCard
Displays key metrics with icons, values, and trend information.

**Props:**
- `title` - Card title
- `value` - Main value to display
- `icon` - Icon component
- `trend` - Optional trend text

### TimelineChart
Line chart showing event distribution over 24 hours using vue-chartjs.

**Props:**
- `data` - Array of {time, count} objects

### TopItemsList
Displays top 5 items with progress bars.

**Props:**
- `title` - List title
- `items` - Array of {name, count} objects

### LogsTable
Table displaying detailed log entries with severity badges.

**Props:**
- `logs` - Array of log entry objects

### FilterPanel
Sidebar panel for filtering logs by various criteria.

**Props:**
- `tenant` - Selected tenant
- `eventType` - Selected event type
- `dateFrom` - Start date filter

**Events:**
- `update:tenant` - Tenant selection changed
- `update:eventType` - Event type changed
- `update:dateFrom` - Date range changed
- `reset` - Reset all filters

## Getting Started

### Prerequisites

- Node.js ^20.19.0 || >=22.12.0
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Preview production build:
   ```bash
   npm run preview
   ```

## Mock Data

The dashboard uses generated mock data for demonstration purposes. The mock data includes:

- **100 log entries** with random timestamps (last 24 hours)
- **5 users**: jane.smith, alice.jones, john.doe, charlie.brown, bob.wilson
- **5 IP addresses**: Various internal network IPs
- **4 tenants**: Tenant A, B, C, D
- **Event types**: login, logout, file_access, config_change, error
- **Severity levels**: info, warning, error, success

You can modify the data generation in `src/utils/mockData.js`.

## Customization

### Colors

The dashboard uses a cyan/blue accent color (`#22d3ee`). To change the theme color, update these values in the component styles:

- Primary color: `#22d3ee`
- Background: `#0f172a` to `#1e293b` gradient
- Card backgrounds: `rgba(30, 41, 59, 0.5)`
- Borders: `rgba(71, 85, 105, 0.5)`

### Chart Configuration

Chart options can be customized in `TimelineChart.vue`:

```javascript
const chartOptions = {
  // Modify chart appearance, tooltips, scales, etc.
}
```

## Features Walkthrough

1. **Dashboard Header** - Shows total events, unique users, IPs, and error count
2. **Event Timeline** - 24-hour view of event distribution
3. **Top Lists** - Quick insights into most active IPs, users, and event types
4. **Filters** - Real-time filtering by tenant, event type, and date
5. **Logs Table** - Detailed view of recent log entries with color-coded severity

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is part of an internship project.

## Developer

Built with ❤️ using Vue 3 and vue-chartjs
