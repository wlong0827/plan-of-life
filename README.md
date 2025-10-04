# Plan of Life

A progressive web application for tracking your spiritual norms and building consistency in your plan of life.

## About

Plan of Life is a mobile-first web app designed to help you track your daily spiritual practices and norms. The app provides:

- **Daily Checklist**: Track completion of your spiritual norms each day
- **Weekly Overview**: Visual progress indicators showing completion percentages for the week
- **AI-Powered Suggestions**: Get personalized, actionable advice based on your completion history
- **Custom Norms**: Add, remove, and reorder norms to fit your personal spiritual routine
- **Offline Support**: Progressive Web App (PWA) capabilities for use without internet

## Understanding the Plan of Life

A "Plan of Life" is a structured approach to spiritual growth through consistent daily practices. It typically includes prayer, Mass, spiritual reading, examination of conscience, and devotions like the Rosary.

### Helpful Resources

- [Towards Holiness Blog - St. Josemaría](https://stjosemaria.org/towards-holiness-blog/) - Spiritual guidance and reflections
- [What is a Plan of Life?](https://stjosemaria.org/towards-holiness-blog/) - Understanding the foundation
- [The Spiritual Life](https://opusdei.org/en/article/spiritual-life/) - Opus Dei resources on developing a spiritual life

### Default Spiritual Norms

The app includes these traditional spiritual practices by default:

1. Morning Offering
2. Morning Prayer
3. Holy Mass
4. Angelus
5. Visit to the Blessed Sacrament
6. Holy Rosary
7. Spiritual Reading
8. Examination of Conscience
9. Three Purity Hail Marys

You can customize these norms, add your own, and reorder them in the Settings page.

## Features

### Daily Tracking
- Check off norms as you complete them throughout the day
- View any day's checklist by selecting it from the week view
- Progress automatically syncs across devices

### Visual Progress
- Week view with date boxes that fill proportionally with completion percentage
- Each norm checked adds 1/9th (or 1/total norms) to the daily progress indicator
- Quick visual reference of your consistency

### AI Insights
- Daily personalized suggestions for improving consistency
- Based on your historical completion patterns
- Actionable advice like setting alarms or prayer samples

### Customization
- Add custom spiritual practices beyond the defaults
- Enable/disable norms without deleting them
- Drag and drop to reorder norms in your preferred sequence
- Changes reflect immediately in your daily checklist

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL database, Auth, Edge Functions)
- **AI**: Lovable AI integration for daily suggestions
- **Build Tool**: Vite
- **PWA**: Service Worker with offline capabilities

## Local Development

### Prerequisites

- Node.js 18+ (install with [nvm](https://github.com/nvm-sh/nvm))
- npm or bun package manager

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd plan-of-life

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

The app uses Supabase for backend services. Environment variables are managed automatically, but if setting up a fresh instance you'll need:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Database Schema

The app uses two main tables:

**user_norms**
- Stores each user's norms (default and custom)
- Includes `display_order` for custom ordering
- `is_active` flag for enabling/disabling norms

**daily_completions**
- Records which norms were completed on which dates
- Links to user via `user_id`
- Uses `completed_date` and `norm_name` for tracking

### Building for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

## Deployment

This app can be deployed to any static hosting service that supports PWAs:

- **Lovable**: One-click deployment via the Lovable dashboard
- **Vercel**: `vercel deploy`
- **Netlify**: Connect your Git repository
- **GitHub Pages**: Build and deploy to `gh-pages` branch

Ensure environment variables are set in your hosting platform's dashboard.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or feature requests, please open an issue in the GitHub repository.

---

*"Persevere, God never abandons us. He will transform your struggles into victories." - St. Josemaría Escrivá*
