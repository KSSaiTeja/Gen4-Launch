# Gen4 Launch - Spin to Win 🎰

An interactive promotional spin wheel website for the **Gen4 Launch** featuring exclusive discounts on Savart X premium investment subscriptions.

## 🎯 Overview

This is a Next.js-based promotional campaign site that offers users a chance to spin a wheel and win exclusive discounts on Gen4's revolutionary investment platform. The site collects user information and provides discounts ranging from ₹500 to ₹2000 off, with a special chance to win a subscription for just ₹1.

## ✨ Features

- **Interactive Spin Wheel**: Beautifully animated prize wheel with customizable probability distribution
- **Phone Number Validation**: Prevents duplicate entries using localStorage
- **Dynamic Prize Distribution**: Sophisticated probability system for balanced engagement
- **Confetti Animations**: Engaging visual feedback when users win
- **Sound Effects**: Immersive audio experience with spinning and celebration sounds
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop devices
- **Google Forms Integration**: Automatic submission of user data and prize information
- **Test Mode**: Debug-friendly mode that bypasses localStorage persistence

## 🎁 Prize Distribution

The wheel offers 6 different prizes with the following probability distribution:

| Prize          | Discount   | Probability | Expected Winners per 1000 Users |
| -------------- | ---------- | ----------- | ------------------------------- |
| ₹1 Only        | ₹7,078 off | 0.5%        | ~5 users                        |
| Flat ₹500 off  | ₹500 off   | 35%         | ~350 users                      |
| Flat ₹750 off  | ₹750 off   | 28%         | ~280 users                      |
| Flat ₹1000 off | ₹1,000 off | 20%         | ~200 users                      |
| Flat ₹1500 off | ₹1,500 off | 12%         | ~120 users                      |
| Flat ₹2000 off | ₹2,000 off | 4.5%        | ~45 users                       |

**Base Price**: ₹7,079 (includes GST)

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Spin Wheel**: react-custom-roulette
- **Animations**: canvas-confetti
- **Icons**: Lucide React
- **Audio**: Web Audio API + use-sound

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## 🧪 Testing Mode

Add `?test=true` to the URL to enable test mode:

```
http://localhost:3000?test=true
```

Test mode features:

- Disables localStorage persistence
- Allows multiple spins with the same phone number
- Resets to initial state on page load
- Clear visual indicator showing test mode is active

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main page component
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── components/
│   ├── enhanced-spin-wheel.tsx # Main spin wheel component
│   └── ui/                    # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── label.tsx
└── lib/
    └── utils.ts               # Utility functions
```

## 🎨 Customization

### Changing Prize Options

Edit the `data` array in `src/components/enhanced-spin-wheel.tsx`:

```typescript
const data = [
  {
    option: "Your Prize Name",
    style: { backgroundColor: "#color", textColor: "white" },
  },
  // ... more prizes
];
```

### Adjusting Probability Distribution

Modify the `probabilityDistribution` array to change win rates:

```typescript
const probabilityDistribution = [
  5, // Prize 0 - 0.5% chance
  350, // Prize 1 - 35% chance
  // ... etc
];
```

### Updating Base Price

Change the `basePrice` variable in the `getOfferDetails` function:

```typescript
const basePrice = 7079; // Update this value
```

## 📊 Data Collection

The site automatically submits user data to a Google Form with the following fields:

- Phone Number
- Prize Won
- Name
- Email
- Unique ID

## 🔒 User Restrictions

- **One Entry Per Phone Number**: Users can only participate once per device
- **Phone Validation**: Must be at least 10 digits
- **Data Persistence**: LocalStorage tracks participation across sessions

## 🎯 Use Cases

- Product launch campaigns
- Promotional marketing events
- Customer engagement initiatives
- Lead generation campaigns
- Exclusive offer distributions

## 📝 Notes

- The probability system is designed to be consistent across multiple users and devices
- Each spin is independent and generates random results
- Test mode bypasses all persistence mechanisms for debugging
- The site includes immersive animations and sound effects for better user engagement

## 🔗 Links

- Main Site: [savart.com](https://savart.com)
- Next.js Documentation: [nextjs.org/docs](https://nextjs.org/docs)

## 📄 License

This project is private and proprietary.

---

**Built with ❤️ for Gen4 Launch**
