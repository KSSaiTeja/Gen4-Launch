"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import Image from "next/image";
import confetti from "canvas-confetti";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const DynamicWheel = dynamic(
  () => import("react-custom-roulette").then((mod) => mod.Wheel),
  { ssr: false },
);

const DynamicConfetti = dynamic(
  () => import("canvas-confetti").then((mod) => mod.default),
  { ssr: false },
);

const data = [
  {
    option: "Flat ₹2500 off*",
    style: { backgroundColor: "#4A90E2", textColor: "white" },
  },
  {
    option: "Flat ₹2000 off*",
    style: { backgroundColor: "#4169E1", textColor: "white" },
  },
  {
    option: "Flat ₹1000 off",
    style: { backgroundColor: "#87CEEB", textColor: "black" },
  },
  {
    option: "Flat ₹750 off",
    style: { backgroundColor: "#1E90FF", textColor: "white" },
  },
  {
    option: "Flat ₹500 off",
    style: { backgroundColor: "#00BFFF", textColor: "white" },
  },
];

// Sophisticated probability distribution - balanced for engagement & profitability
// Total weight: 1000 spins
// HOW IT WORKS ACROSS MULTIPLE DEVICES:
// - Each spin is INDEPENDENT and generates a random number between 0-999
// - Rare offers: ₹2500 off (1%), ₹2000 off (8%)
// - Common offers: ₹1000 off (35%), ₹750 off (30%), ₹500 off (26%)
// - The probability is consistent whether 10 users or 10,000 users spin
const probabilityDistribution = [
  10, // Flat ₹2500 off* (index 0) - Very rare (1%) - ~10 in 1000 users
  80, // Flat ₹2000 off* (index 1) - Rare (8%) - ~80 in 1000 users
  350, // Flat ₹1000 off (index 2) - Common (35%) - ~350 in 1000 users
  300, // Flat ₹750 off (index 3) - Common (30%) - ~300 in 1000 users
  260, // Flat ₹500 off (index 4) - Common (26%) - ~260 in 1000 users
];

const getOfferDetails = (offer: string) => {
  const basePriceXE = 6999; // Base price for Savart XE including GST
  const basePriceXPlus = 17999; // Base price for Savart X+ including GST

  switch (offer) {
    case "Flat ₹2500 off*":
      return {
        discountAmount: 2500,
        finalPrice: basePriceXPlus - 2500,
        subscriptionType: "Savart X+",
        savings: 2500,
        discountPercentage: Math.round((2500 / basePriceXPlus) * 100),
        basePrice: basePriceXPlus,
        showBasePrice: true,
      };
    case "Flat ₹2000 off*":
      return {
        discountAmount: 2000,
        finalPrice: basePriceXPlus - 2000,
        subscriptionType: "Savart X+",
        savings: 2000,
        discountPercentage: Math.round((2000 / basePriceXPlus) * 100),
        basePrice: basePriceXPlus,
        showBasePrice: true,
      };
    case "Flat ₹1000 off":
      return {
        discountAmount: 1000,
        finalPrice: basePriceXE - 1000,
        subscriptionType: "Savart XE",
        savings: 1000,
        discountPercentage: Math.round((1000 / basePriceXE) * 100),
        basePrice: basePriceXE,
        showBasePrice: true,
      };
    case "Flat ₹750 off":
      return {
        discountAmount: 750,
        finalPrice: basePriceXE - 750,
        subscriptionType: "Savart XE",
        savings: 750,
        discountPercentage: Math.round((750 / basePriceXE) * 100),
        basePrice: basePriceXE,
        showBasePrice: true,
      };
    case "Flat ₹500 off":
      return {
        discountAmount: 500,
        finalPrice: basePriceXE - 500,
        subscriptionType: "Savart XE",
        savings: 500,
        discountPercentage: Math.round((500 / basePriceXE) * 100),
        basePrice: basePriceXE,
        showBasePrice: true,
      };
    default:
      return {
        discountAmount: 500,
        finalPrice: basePriceXE - 500,
        subscriptionType: "Savart XE",
        savings: 500,
        discountPercentage: Math.round((500 / basePriceXE) * 100),
        basePrice: basePriceXE,
        showBasePrice: true,
      };
  }
};

const offerContent: Record<
  string,
  {
    planLabel: string;
    headline: string;
    subHeadline: string;
    body: string[];
    footer: string;
  }
> = {
  "Flat ₹500 off": {
    planLabel: "Savart XE — ₹500 Off",
    headline: "Congratulations!",
    subHeadline: "You've won ₹500 off on your Savart XE subscription!",
    body: [
      "Unlock Gen 4's multi-asset strategy designed for serious investors.",
      "Receive personalised insights across stocks, mutual funds, and ETFs with disciplined rebalancing support and expert monitoring.",
    ],
    footer: "Welcome to Gen 4 — elevate your portfolio with deeper insights.",
  },
  "Flat ₹750 off": {
    planLabel: "Savart XE — ₹750 Off",
    headline: "Congratulations!",
    subHeadline: "You've won ₹750 off on your Savart XE subscription!",
    body: [
      "Access Gen 4's AI-powered multi-asset investment intelligence.",
      "Diversify confidently across equities, funds, and ETFs while staying ahead with performance tracking and proactive risk monitoring.",
    ],
    footer: "Smarter investing starts with Gen 4. Claim your offer today.",
  },
  "Flat ₹1000 off": {
    planLabel: "Savart XE — ₹1,000 Off",
    headline: "Congratulations!",
    subHeadline: "You've won ₹1,000 off on your Savart XE subscription!",
    body: [
      "Unlock Gen 4's most sought-after multi-asset advisory experience — with tailored portfolio insights, stock and fund-level guidance, and real-time rebalancing prompts.",
    ],
    footer: "Welcome to Gen 4 — make every investment decision count.",
  },
  "Flat ₹2000 off*": {
    planLabel: "Savart X+ — ₹2,000 Off",
    headline: "Congratulations!",
    subHeadline: "You've won ₹2,000 off on your Savart X+ subscription!",
    body: [
      "Step into Gen 4's global advisory experience with curated exposure to Indian and U.S. markets across stocks, ETFs, and IPOs.",
      "Benefit from deep-dive portfolio insights and cross-market strategies crafted by our research desk.",
    ],
    footer: "Welcome to Gen 4 — your gateway to global investing excellence.",
  },
  "Flat ₹2500 off*": {
    planLabel: "Savart X+ — ₹2,500 Off",
    headline: "Congratulations!",
    subHeadline: "You've won ₹2,500 off on your Savart X+ subscription!",
    body: [
      "Experience the best of Gen 4 with a personalised, cross-market portfolio combining India and U.S. opportunities.",
      "Gain access to advanced tracking, expert reviews, and curated global equities and IPO opportunities.",
    ],
    footer: "Welcome to Gen 4 — invest globally, grow confidently.",
  },
};

const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

const GOOGLE_FORM_ACTION_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfqfJiFfBWjCAGSkyMZnc4KzXtulW7gCNIBJqpD1L1qv4wRJA/formResponse";

const sendToGoogleForm = async (data: Record<string, string>) => {
  const formData = new FormData();
  for (const key in data) {
    formData.append(key, data[key]);
  }
  try {
    const response = await fetch(GOOGLE_FORM_ACTION_URL, {
      method: "POST",
      body: formData,
      mode: "no-cors",
    });
    console.log("Form submission response:", response);
  } catch (error) {
    console.error("Error sending data to Google Form:", error);
    throw error;
  }
};

export default function EnhancedSpinWheel() {
  // 🧪 TESTING MODE: Add ?test=true to URL to enable
  // Example: http://localhost:3000?test=true
  const [isTestMode, setIsTestMode] = useState(false);

  const [step, setStep] = useState(2);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [wheelClassName, setWheelClassName] = useState("animate-wheel-jerk");
  const [hasPlayed, setHasPlayed] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentOffer, setCurrentOffer] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const [sessionData, setSessionData] = useState({
    sessionId: "",
    startTime: Date.now(),
    attempts: 0,
    lastOffer: "",
  });
  const [spinningAudio, setSpinningAudio] = useState<HTMLAudioElement | null>(
    null,
  );

  // Enhanced local storage management (bypassed in test mode)
  const saveSessionData = useCallback(
    (data: Record<string, string | number>) => {
      if (isTestMode) return; // Skip in test mode
      if (typeof window !== "undefined") {
        try {
          const existingData = JSON.parse(
            localStorage.getItem("sessionData") || "{}",
          );
          const updatedData = {
            ...existingData,
            ...data,
            timestamp: Date.now(),
          };
          localStorage.setItem("sessionData", JSON.stringify(updatedData));
        } catch (error) {
          console.error("Error saving session data:", error);
        }
      }
    },
    [isTestMode],
  );

  const clearSessionData = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sessionData");
      localStorage.removeItem("currentOffer");
      localStorage.removeItem("currentPhoneNumber");
      localStorage.removeItem("uniqueId");
      localStorage.removeItem("spinCount");
      localStorage.removeItem("remainingChances");
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      // Get URL parameters - handle both ?test=true&offer=0 and ?test=true?offer=0 formats
      const searchString = window.location.search;
      const urlParams = new URLSearchParams(searchString);

      // Also check for malformed URLs with multiple ? separators
      let testMode = urlParams.get("test") === "true";
      let offerParam = urlParams.get("offer");

      // Handle malformed URL like ?test=true?offer=0 (should be ?test=true&offer=0)
      if (!offerParam && searchString.includes("?offer=")) {
        const match = searchString.match(/[?&]offer=(\d+)/);
        if (match) {
          offerParam = match[1];
          console.warn(
            "⚠️ URL format issue detected. Use ?test=true&offer=0 (with &) instead of ?test=true?offer=0",
          );
        }
      }
      if (!testMode && searchString.includes("test=true")) {
        testMode = true;
        console.warn(
          "⚠️ URL format issue detected. Use ?test=true&offer=0 (with &) instead of ?test=true?offer=0",
        );
      }

      setIsTestMode(testMode);

      // DEV MODE: Check for direct offer selection (?offer=0 to ?offer=5)
      let selectedOfferIndex = null;
      if (offerParam !== null) {
        const offerIndex = parseInt(offerParam, 10);
        if (offerIndex >= 0 && offerIndex < data.length) {
          selectedOfferIndex = offerIndex;
          console.log(`🎯 DEV MODE: Direct offer selection enabled`);
          console.log(`Offer Index ${offerIndex}: ${data[offerIndex].option}`);
          console.log(
            `Available offers: 0=₹2500 off, 1=₹2000 off, 2=₹1000 off, 3=₹750 off, 4=₹500 off`,
          );
          console.log("To disable, remove ?offer=X from URL");
        } else {
          console.warn(
            `⚠️ Invalid offer index: ${offerIndex}. Use 0-${data.length - 1}`,
          );
        }
      }

      if (testMode) {
        console.log("🧪 TEST MODE ENABLED - Local storage disabled");
        console.log("To disable test mode, remove ?test=true from URL");
        console.log("Functionality works normally, just without persistence");

        // In test mode, clear everything and force step 2
        // Clear any localStorage data that might interfere
        localStorage.removeItem("currentOffer");
        localStorage.removeItem("currentPhoneNumber");
        localStorage.removeItem("uniqueId");

        // Reset all state to initial values
        setStep(2);
        setPhoneNumber("");
        setName("");
        setEmail("");
        setUniqueId("");
        setHasPlayed(false);
        setPhoneError("");
        setMustSpin(false);
        setIsSpinning(false);

        // If offer is selected via URL, set it (but don't auto-advance)
        if (selectedOfferIndex !== null) {
          const selectedOffer = data[selectedOfferIndex].option;
          setCurrentOffer(selectedOffer);
          setPrizeNumber(selectedOfferIndex);
          console.log(
            `✅ Test mode: Offer ${selectedOfferIndex} pre-selected. Enter phone and click spin to test.`,
          );
        } else {
          setCurrentOffer("");
          console.log("✅ Test mode: Reset to step 2 (phone entry page)");
        }
        return;
      }

      // If not in test mode but offer is selected, set it
      if (selectedOfferIndex !== null) {
        const selectedOffer = data[selectedOfferIndex].option;
        setCurrentOffer(selectedOffer);
        setPrizeNumber(selectedOfferIndex);
        // Don't auto-advance - let user enter phone and click spin normally
        // The handleSpinClick will detect this and skip the animation
      }

      // Initialize session data (only in production mode)
      const sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      setSessionData((prev) => ({ ...prev, sessionId, startTime: Date.now() }));
      saveSessionData({ sessionId, startTime: Date.now() });

      // Restore previous session if exists (only in production mode)
      const savedOffer = localStorage.getItem("currentOffer");
      const savedPhoneNumber = localStorage.getItem("currentPhoneNumber");
      const savedUniqueId = localStorage.getItem("uniqueId");

      if (savedOffer && savedPhoneNumber && savedUniqueId) {
        setCurrentOffer(savedOffer);
        setPhoneNumber(savedPhoneNumber);
        setUniqueId(savedUniqueId);
        setStep(3);
      }
    }
  }, [saveSessionData]);

  const checkIfPlayed = useCallback(
    (number: string) => {
      if (isTestMode) return false; // Always allow playing in test mode
      if (typeof window !== "undefined") {
        try {
          const playedUsers = JSON.parse(
            localStorage.getItem("playedUsers") || "{}",
          );
          const currentPhoneNumber = localStorage.getItem("currentPhoneNumber");
          return !!playedUsers[number] || number === currentPhoneNumber;
        } catch (error) {
          console.error("Error checking played status:", error);
        }
      }
      return false;
    },
    [isTestMode],
  );

  useEffect(() => {
    if (isMounted) {
      setHasPlayed(checkIfPlayed(phoneNumber));
    }
  }, [phoneNumber, checkIfPlayed, isMounted]);

  const handleSubmitPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneError && phoneNumber.length >= 10 && !hasPlayed) {
      const savedOffer = localStorage.getItem("currentOffer");
      if (savedOffer) {
        setCurrentOffer(savedOffer);
        setStep(3);
      } else {
        handleSpinClick();
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhoneNumber = e.target.value;
    setPhoneNumber(newPhoneNumber);

    if (newPhoneNumber.length > 0 && !/^\d+$/.test(newPhoneNumber)) {
      setPhoneError("Please enter only numbers");
    } else if (newPhoneNumber.length > 0 && newPhoneNumber.length < 10) {
      setPhoneError("Phone number must be at least 10 digits");
    } else {
      setPhoneError("");
    }

    if (newPhoneNumber.length >= 10 && isMounted) {
      const hasPlayedBefore = checkIfPlayed(newPhoneNumber);
      setHasPlayed(hasPlayedBefore);
      if (hasPlayedBefore) {
        setPhoneError("You have already participated in this offer.");
      }
    } else {
      setHasPlayed(false);
    }
  };

  const handleSpinClick = () => {
    if (!mustSpin) {
      // DEV MODE: Check if offer is pre-selected via URL parameter
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const offerParam = urlParams.get("offer");
        if (offerParam !== null && currentOffer) {
          // Offer already set via URL, skip spinning animation and go directly to result
          console.log(
            `🎯 DEV MODE: Skipping spin, using pre-selected offer: ${currentOffer}`,
          );
          const newUniqueId = Date.now().toString();
          setUniqueId(newUniqueId);
          if (!isTestMode) {
            localStorage.setItem("currentOffer", currentOffer);
            localStorage.setItem("currentPhoneNumber", phoneNumber);
            localStorage.setItem("uniqueId", newUniqueId);
          }

          // Simulate the result directly (skip animation)
          playSound("/confetti-sound.wav");
          if (typeof DynamicConfetti === "function") {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#0066FF", "#00BFFF", "#1E90FF", "#87CEEB", "#4169E1"],
            });
          }

          // Send initial data to Google Form
          const offerDetails = getOfferDetails(currentOffer);
          const offerDescription =
            offerDetails.subscriptionType === "Savart X+"
              ? `${currentOffer} - ${offerDetails.subscriptionType} (${
                  offerDetails.discountPercentage
                }% off - Save ${formatCurrency(offerDetails.savings)})`
              : `${currentOffer} - ${offerDetails.subscriptionType} (${
                  offerDetails.discountPercentage
                }% off - Save ${formatCurrency(offerDetails.savings)})`;

          sendToGoogleForm({
            "entry.924906700": phoneNumber,
            "entry.855479267": offerDescription,
            "entry.724459354": "",
            "entry.514386980": "",
            "entry.299128917": newUniqueId,
          })
            .then(() => console.log("✅ Initial data sent successfully!"))
            .catch((error) =>
              console.error("❌ Failed to send initial data:", error),
            );

          setStep(3);
          return;
        }
      }

      const totalProbability = probabilityDistribution.reduce(
        (a, b) => a + b,
        0,
      );
      let randomNum = Math.floor(Math.random() * totalProbability);
      let selectedIndex = 0;

      for (let i = 0; i < probabilityDistribution.length; i++) {
        if (randomNum < probabilityDistribution[i]) {
          selectedIndex = i;
          break;
        }
        randomNum -= probabilityDistribution[i];
      }

      // Direct mapping since we now have 6 options (0-5)
      const newPrizeNumber = selectedIndex;

      setPrizeNumber(newPrizeNumber);
      setMustSpin(true);
      setIsSpinning(true);
      setWheelClassName("");

      // Play spinning sound
      startSpinningSound();

      // Enhanced session tracking
      setSessionData((prev) => ({
        ...prev,
        attempts: prev.attempts + 1,
        lastOffer: data[newPrizeNumber].option,
      }));

      saveSessionData({
        attempts: sessionData.attempts + 1,
        lastOffer: data[newPrizeNumber].option,
        spinTime: Date.now(),
      });
    }
  };

  const playSound = (soundFile: string) => {
    if (typeof window !== "undefined") {
      const audio = new Audio(soundFile);
      audio
        .play()
        .catch((error) => console.error("Error playing sound:", error));
    }
  };

  const startSpinningSound = useCallback(() => {
    if (typeof window !== "undefined") {
      // Create a simple spinning sound using Web Audio API
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Create a "whooshing" sound effect
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        100,
        audioContext.currentTime + 0.5,
      );

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5,
      );

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);

      // Create audio element for looping spinning sound
      const audio = new Audio();
      audio.volume = 0.3;
      audio.loop = false;
      audio.src = "/spinning-sound.wav";
      setSpinningAudio(audio);

      // Play the spinning sound
      audio
        .play()
        .catch((error) =>
          console.error("Error playing spinning sound:", error),
        );
    }
  }, []);

  const stopSpinningSound = useCallback(() => {
    if (spinningAudio) {
      spinningAudio.pause();
      spinningAudio.currentTime = 0;
    }
  }, [spinningAudio]);

  const handleStopSpinning = () => {
    setMustSpin(false);
    setIsSpinning(false);

    // Stop spinning sound
    stopSpinningSound();

    const newOffer = data[prizeNumber].option;
    setCurrentOffer(newOffer);
    const newUniqueId = Date.now().toString();
    setUniqueId(newUniqueId);
    if (typeof window !== "undefined" && !isTestMode) {
      localStorage.setItem("currentOffer", newOffer);
      localStorage.setItem("currentPhoneNumber", phoneNumber);
      localStorage.setItem("uniqueId", newUniqueId);
    }
    if (isMounted) {
      playSound("/confetti-sound.wav");

      if (typeof DynamicConfetti === "function") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#0066FF", "#00BFFF", "#1E90FF", "#87CEEB", "#4169E1"],
        });
      }

      // Immediately capture phone number and offer (in case user leaves)
      // Include all fields with empty values for name and email to avoid 400 error
      const offerDetails = getOfferDetails(newOffer);
      console.log("🎯 Sending initial data to Google Form...");
      console.log("Phone:", phoneNumber);
      console.log("Offer:", newOffer);
      console.log("Unique ID:", newUniqueId);

      const offerDescription =
        offerDetails.subscriptionType === "Savart X+"
          ? `${newOffer} - ${offerDetails.subscriptionType} (${
              offerDetails.discountPercentage
            }% off - Save ${formatCurrency(offerDetails.savings)})`
          : `${newOffer} - ${offerDetails.subscriptionType} (${
              offerDetails.discountPercentage
            }% off - Save ${formatCurrency(offerDetails.savings)})`;

      sendToGoogleForm({
        "entry.924906700": phoneNumber,
        "entry.855479267": offerDescription,
        "entry.724459354": "", // Name - empty (not required in form)
        "entry.514386980": "", // Email - empty (not required in form)
        "entry.299128917": newUniqueId,
      })
        .then(() => console.log("✅ Initial data sent successfully!"))
        .catch((error) =>
          console.error("❌ Failed to send initial data:", error),
        );

      setStep(3);
    }
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Submit complete information (this will create a second row in Google Sheets)
      const offerDetails = getOfferDetails(currentOffer);

      console.log("📧 Sending complete data to Google Form...");
      console.log("Phone:", phoneNumber);
      console.log("Offer:", currentOffer);
      console.log("Name:", name);
      console.log("Email:", email);
      console.log("Unique ID:", uniqueId);

      const offerDescription =
        offerDetails.subscriptionType === "Savart X+"
          ? `${currentOffer} - ${offerDetails.subscriptionType} (${
              offerDetails.discountPercentage
            }% off - Save ${formatCurrency(offerDetails.savings)})`
          : `${currentOffer} - ${offerDetails.subscriptionType} (${
              offerDetails.discountPercentage
            }% off - Save ${formatCurrency(offerDetails.savings)})`;

      await sendToGoogleForm({
        "entry.924906700": phoneNumber,
        "entry.855479267": offerDescription,
        "entry.724459354": name,
        "entry.514386980": email,
        "entry.299128917": uniqueId,
      });

      console.log("✅ Complete data sent successfully!");

      // Track lead count (non-blocking, don't fail if this fails)
      try {
        const trackResponse = await fetch("/api/leads/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uniqueId,
            phoneNumber,
            offer: currentOffer,
          }),
        });
        const trackData = await trackResponse.json();
        if (trackData.success) {
          console.log(`📊 Lead tracked. Total leads: ${trackData.count}`);
        }
      } catch (error) {
        console.error("Failed to track lead (non-critical):", error);
        // Don't throw - this is non-critical
      }
      if (typeof window !== "undefined" && !isTestMode) {
        // Enhanced user tracking (skip in test mode)
        const playedUsers = JSON.parse(
          localStorage.getItem("playedUsers") || "{}",
        );
        playedUsers[phoneNumber] = {
          timestamp: Date.now(),
          offer: currentOffer,
          sessionData: sessionData,
          completionTime: Date.now() - sessionData.startTime,
        };
        localStorage.setItem("playedUsers", JSON.stringify(playedUsers));

        // Clear session data after successful submission
        clearSessionData();
      }
      setStep(4);
    } catch (error) {
      console.error("Error submitting entry:", error);
      setSubmitError("Failed to submit entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-gray-900 to-black flex flex-col items-center justify-start relative overflow-hidden">
      {/* Testing Mode Indicator */}
      {isTestMode && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-center py-2 px-4 z-50 font-bold shadow-lg">
          🧪 TEST MODE ACTIVE - Local Storage Disabled - Remove ?test=true from
          URL to disable
        </div>
      )}

      <div
        className={`w-full bg-black py-2 px-4 flex justify-start ${
          isTestMode ? "mt-16" : "mt-4"
        }`}
      >
        <Link href="https://savart.com" passHref>
          <Button
            variant="outline"
            size="sm"
            className="bg-black text-[#00BFFF] border-[#0066FF] hover:bg-[#0066FF] hover:border-[#00BFFF] hover:text-white transition-colors duration-300 flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="w-full text-white relative mt-4">
        <div className="relative w-full" style={{ aspectRatio: "1920/450" }}>
          <Image
            src="/banner-image.svg"
            alt="Gen4 Launch - Spin to Win Banner"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
      </div>

      <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-center z-20 space-y-8 md:space-y-0 md:space-x-8 p-4 mt-8">
        {step < 3 && (
          <div className="w-full px-4 sm:px-0 md:hidden">
            <h1 className="text-2xl sm:text-3xl  font-bold text-white mb-4 text-center">
              <span className="bg-gradient-to-r from-[#00BFFF] to-[#0066FF] bg-clip-text text-transparent">
                GEN4 LAUNCH
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#00BFFF] to-[#0066FF] bg-clip-text text-transparent">
                SPIN TO WIN!
              </span>
            </h1>
            <p className="mb-4 text-sm sm:text-base text-white text-center">
              Be among the first to experience{" "}
              <span className="text-[#00BFFF] font-semibold">
                Gen4's revolutionary investment platform
              </span>{" "}
              with exclusive launch offers!
            </p>
          </div>
        )}

        <div className="w-full md:w-1/2 max-w-[80vw] md:max-w-none aspect-square">
          <div className={`${wheelClassName} relative`}>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0066FF]/20 to-[#00BFFF]/20 blur-xl -z-10"></div>
            {isMounted && (
              <DynamicWheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeNumber}
                data={data}
                onStopSpinning={handleStopSpinning}
                outerBorderColor="#0066FF"
                outerBorderWidth={8}
                innerBorderColor="#00BFFF"
                innerBorderWidth={25}
                innerRadius={0}
                radiusLineColor="#1E90FF"
                radiusLineWidth={2}
                fontSize={16}
                textDistance={60}
              />
            )}
          </div>
        </div>

        <div className="w-full md:w-1/2 px-4 sm:px-0">
          {step < 3 && (
            <div className="hidden md:block">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-8 text-left">
                <span className="bg-gradient-to-r from-[#00BFFF] to-[#0066FF] bg-clip-text text-transparent">
                  GEN4 LAUNCH
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#00BFFF] to-[#0066FF] bg-clip-text text-transparent">
                  SPIN TO WIN!
                </span>
              </h1>
              <p className="mb-4  text-sm sm:text-base md:text-lg text-white text-left">
                Be among the first to experience{" "}
                <span className="text-[#00BFFF] font-semibold">
                  Gen4's revolutionary investment platform
                </span>{" "}
                with exclusive launch offers!
              </p>
            </div>
          )}
          {step === 2 && (
            <form onSubmit={handleSubmitPhone} className="space-y-4">
              <Label
                htmlFor="phone"
                className="text-white text-sm sm:text-base"
              >
                Enter your phone number to play
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={handlePhoneChange}
                required
                aria-invalid={!!phoneError}
                aria-describedby={phoneError ? "phone-error" : undefined}
                className={`border-[#0066FF]/30 bg-white text-black p-2 sm:p-3 text-sm sm:text-base focus:border-[#00BFFF] focus:ring-2 focus:ring-[#00BFFF]/20 ${
                  phoneError ? "border-red-500" : ""
                }`}
              />
              {phoneError && (
                <p id="phone-error" className="text-red-500 text-sm">
                  {phoneError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#0066FF] to-[#00BFFF] hover:from-[#00BFFF] hover:to-[#1E90FF] text-white text-sm sm:text-base shadow-lg shadow-blue-500/25"
                disabled={
                  hasPlayed ||
                  !!phoneError ||
                  phoneNumber.length < 10 ||
                  isSpinning
                }
                aria-label={
                  isSpinning
                    ? "Spinning..."
                    : hasPlayed
                    ? "You have already played"
                    : "Spin The Gen4 Launch Wheel"
                }
              >
                {isSpinning
                  ? "Spinning..."
                  : hasPlayed
                  ? "You have already played"
                  : "Spin The Gen4 Launch Wheel"}
              </Button>
            </form>
          )}

          {step === 3 &&
            (() => {
              const offerDetails = getOfferDetails(currentOffer);
              const offerInfo = offerContent[currentOffer];
              const headline = offerInfo?.headline ?? "Congratulations!";
              const subHeadline =
                offerInfo?.subHeadline ??
                `You've won ${
                  offerDetails.discountAmount
                    ? formatCurrency(offerDetails.discountAmount)
                    : "an"
                } discount on your ${
                  offerDetails.subscriptionType
                } subscription!`;
              const bodyCopy = offerInfo?.body ?? [
                "Experience Gen 4’s multi-asset intelligence built for modern investors.",
              ];
              const footerCopy =
                offerInfo?.footer ??
                "Welcome to Gen 4 — smarter investing starts here.";

              return (
                <div className="text-center md:text-left bg-gradient-to-br from-gray-900 to-black p-6 rounded-lg border border-[#0066FF]/30 shadow-lg shadow-blue-500/10">
                  {offerInfo?.planLabel && (
                    <div className="mb-4">
                      <span className="inline-flex items-center rounded-full border border-[#00BFFF]/40 bg-[#00BFFF]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#8ED9FF]">
                        {offerInfo.planLabel}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-center md:justify-start mb-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#00BFFF]">
                      {headline}
                    </h3>
                    <span className="ml-3 bg-gradient-to-r from-[#0066FF] to-[#00BFFF] text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                      {offerDetails.discountPercentage}% OFF
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl font-semibold text-white mb-2">
                    {subHeadline}
                  </p>
                  <div className="text-base sm:text-lg text-white mb-5 space-y-2">
                    {bodyCopy.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                  <div className="flex items-center justify-center md:justify-start space-x-4 mb-3">
                    <span className="text-lg sm:text-xl text-gray-400 line-through font-bold">
                      {formatCurrency(offerDetails.basePrice)}
                    </span>
                    <span className="text-lg sm:text-xl font-semibold text-[#8ED9FF]">
                      →
                    </span>
                    <span className="text-2xl sm:text-3xl font-bold text-[#00BFFF]">
                      {formatCurrency(offerDetails.finalPrice)}
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-[#0066FF]/20 to-[#00BFFF]/20 rounded-lg p-3 mb-4 border border-[#00BFFF]/30">
                    <p className="text-sm text-[#00BFFF] font-semibold">
                      💰 You Save: {formatCurrency(offerDetails.savings)}
                    </p>
                    <div className="mt-2 space-y-1 text-xs text-[#8ED9FF]">
                      <p>
                        <span className="font-semibold text-white">
                          Offer valid on 1-year {offerDetails.subscriptionType}{" "}
                          subscriptions.
                        </span>
                      </p>
                      <p>
                        Activation begins after the official Gen4 app launch.
                      </p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-white mb-6">
                    {footerCopy}
                  </p>
                  <form onSubmit={handleSubmitDetails} className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="border-[#0066FF]/30 bg-white text-black p-2 sm:p-3 text-sm sm:text-base focus:border-[#00BFFF] focus:ring-2 focus:ring-[#00BFFF]/20"
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-[#0066FF]/30 bg-white text-black p-2 sm:p-3 text-sm sm:text-base focus:border-[#00BFFF] focus:ring-2 focus:ring-[#00BFFF]/20"
                    />
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#0066FF] to-[#00BFFF] hover:from-[#00BFFF] hover:to-[#1E90FF] text-white text-sm sm:text-base shadow-lg shadow-blue-500/25"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Claim Your Offer"}
                    </Button>
                    {submitError && (
                      <p className="text-red-500 mt-2 text-sm sm:text-base">
                        {submitError}
                      </p>
                    )}
                  </form>
                </div>
              );
            })()}
          {step === 4 && (
            <div className="text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                Thank you for participating!
              </h3>
              <p className="text-sm sm:text-base md:text-lg text-white">
                We'll contact you soon with more details about your exclusive
                Gen4 launch offer.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-white">
                Help us spread the word about <br /> Gen4's revolutionary
                investment platform!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Terms and Conditions Section */}
      <div className="w-full max-w-6xl px-4 py-6 mt-8 mb-8">
        <div className="bg-gradient-to-br from-gray-900/90 to-black/90 p-6 sm:p-8 rounded-lg border border-[#0066FF]/30 shadow-lg shadow-blue-500/10">
          <div className="text-xs sm:text-sm text-gray-300 leading-relaxed space-y-3">
            <p className="text-center font-bold text-white text-base sm:text-lg mb-4 pb-2 border-b border-[#0066FF]/30">
              Terms & Conditions
            </p>
            <ul className="space-y-2.5 text-left max-w-4xl mx-auto">
              <li className="flex items-start">
                <span className="text-[#00BFFF] mr-2 mt-0.5">•</span>
                <span>
                  <span className="font-semibold text-white">Eligibility:</span>{" "}
                  Offers apply exclusively to 1-year{" "}
                  <span className="font-semibold text-white">Savart XE</span>{" "}
                  and{" "}
                  <span className="font-semibold text-white">Savart X+</span>{" "}
                  subscriptions and are extended to verified campaign
                  participants.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00BFFF] mr-2 mt-0.5">•</span>
                <span>
                  <span className="font-semibold text-white">
                    Discount Structure:
                  </span>{" "}
                  Discounts of ₹500, ₹750, and ₹1,000 apply to{" "}
                  <span className="font-semibold text-white">Savart XE</span>{" "}
                  plans. Discounts of ₹2,000 and ₹2,500 apply to{" "}
                  <span className="font-semibold text-white">Savart X+</span>{" "}
                  plans. Offers are allocated based on spin outcomes and sales
                  consultation.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00BFFF] mr-2 mt-0.5">•</span>
                <span>
                  <span className="font-semibold text-white">
                    Multiple Attempts:
                  </span>{" "}
                  Participants using the same credentials (phone number, email,
                  or other identifying information) for multiple spin attempts
                  will receive the{" "}
                  <span className="font-semibold text-white">
                    lowest discount offer
                  </span>{" "}
                  among all their entries.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00BFFF] mr-2 mt-0.5">•</span>
                <span>
                  <span className="font-semibold text-white">
                    Effective Window:
                  </span>{" "}
                  Offers activate after the official Gen4 app launch and remain
                  valid until{" "}
                  <span className="font-semibold text-white">
                    31 December 2025
                  </span>
                  .
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00BFFF] mr-2 mt-0.5">•</span>
                <span>
                  <span className="font-semibold text-white">General:</span>{" "}
                  Availability is subject to eligibility checks, prevailing
                  program policies, and may be withdrawn without prior notice.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-[#00BFFF] mr-2 mt-0.5">•</span>
                <span>
                  <span className="font-semibold text-white">Additional:</span>{" "}
                  All terms and conditions published on{" "}
                  <a
                    href="https://savart.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#00BFFF] hover:text-[#00BFFF]/80 underline transition-colors"
                  >
                    savart.com
                  </a>{" "}
                  apply to this offer campaign.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
