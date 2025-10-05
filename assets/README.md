# Assets Directory

This directory contains all static assets for the mesonRadio app.

## Required Assets

Please add the following image files:

### App Icons
- **icon.png** (1024x1024 px): Main app icon
- **adaptive-icon.png** (1024x1024 px): Android adaptive icon
- **favicon.png** (48x48 px): Web favicon

### Splash Screen
- **splash.png** (1242x2436 px): Launch screen image

## Design Guidelines

### Icon
- Use a simple, recognizable radio-themed design
- Primary color: #0e7490 (cyan-700)
- Background: #1a1a2e (dark blue)
- Include a radio wave or broadcast symbol

### Splash Screen
- Same design as icon but larger
- Background: #1a1a2e
- Center the logo/icon

## Generating Assets

You can use online tools to generate app icons and splash screens:
- [App Icon Generator](https://appicon.co/)
- [Expo Asset Generator](https://github.com/expo/expo-cli)

Or use Expo's built-in asset generation:
```bash
npx expo-optimize
```

