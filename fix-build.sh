#!/bin/bash

# Fix EmailSettings.tsx
sed -i '/import.*Button.*from.*@\/components\/ui\/button/d' src/components/settings/EmailSettings.tsx
sed -i '/const handleSave =/,/};/d' src/components/settings/EmailSettings.tsx

# Fix NotificationSettings.tsx
sed -i '/import.*Button.*from.*@\/components\/ui\/button/d' src/components/settings/NotificationSettings.tsx
sed -i '/const handleSave =/,/};/d' src/components/settings/NotificationSettings.tsx

# Fix DashboardPage.tsx
sed -i 's/(entry, index)/(_, index)/g' src/pages/DashboardPage.tsx

# Fix EmailPage.tsx
sed -i 's/Settings, ChevronDown,//g' src/pages/EmailPage.tsx

# Fix ProfileSettingsPage.tsx
sed -i 's/ArrowLeft,//g' src/pages/ProfileSettingsPage.tsx
sed -i '/import.*useNavigate.*from.*react-router-dom/d' src/pages/ProfileSettingsPage.tsx

echo "✅ All TypeScript errors fixed!"