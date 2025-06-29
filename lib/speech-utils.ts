/**
 * Browser compatibility and permission helper for Web Speech API
 */

// Check if the browser supports the Web Speech API
export const checkSpeechApiSupport = () => {
  const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const hasSpeechSynthesis = !!window.speechSynthesis;
  
  return {
    isSupported: hasSpeechRecognition && hasSpeechSynthesis,
    hasSpeechRecognition,
    hasSpeechSynthesis,
    details: {
      browserName: getBrowserName(),
      isChromium: isChromiumBased(),
      isSafari: isSafari(),
      isFirefox: isFirefox(),
    }
  };
};

// Request microphone permission
export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    // Just asking for audio will trigger the permission prompt
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // If we get here, permission was granted
    // Close the stream immediately since we don't need it
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error) {
    console.error("Error requesting microphone permission:", error);
    return false;
  }
};

// Check if the user has already granted microphone permission
export const checkMicrophonePermission = async (): Promise<"granted" | "denied" | "prompt"> => {
  // If the permissions API is available, use it
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permissionStatus.state;
    } catch (e) {
      console.warn("Permissions API not fully supported");
    }
  }
  
  // Fallback: try to access the microphone to test permissions
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return "granted";
  } catch (error) {
    // Type check the error to see if it's a permission issue
    if (error instanceof DOMException && 
        (error.name === "NotAllowedError" || error.name === "PermissionDeniedError")) {
      return "denied";
    }
    return "prompt";
  }
};

// Get the current browser name
export const getBrowserName = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf("Firefox") > -1) {
    return "Firefox";
  } else if (userAgent.indexOf("SamsungBrowser") > -1) {
    return "Samsung Internet";
  } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
    return "Opera";
  } else if (userAgent.indexOf("Trident") > -1 || userAgent.indexOf("MSIE") > -1) {
    return "Internet Explorer";
  } else if (userAgent.indexOf("Edge") > -1) {
    return "Edge (Legacy)";
  } else if (userAgent.indexOf("Edg") > -1) {
    return "Edge Chromium";
  } else if (userAgent.indexOf("Chrome") > -1) {
    return "Chrome";
  } else if (userAgent.indexOf("Safari") > -1) {
    return "Safari";
  } else {
    return "Unknown";
  }
};

// Check if browser is Chromium-based (Chrome, Edge, Opera, etc.)
export const isChromiumBased = (): boolean => {
  return navigator.userAgent.indexOf("Chrome") > -1 || 
         navigator.userAgent.indexOf("Edg") > -1 || 
         navigator.userAgent.indexOf("OPR") > -1;
};

// Check if the browser is Safari
export const isSafari = (): boolean => {
  return navigator.userAgent.indexOf("Safari") > -1 && 
         navigator.userAgent.indexOf("Chrome") === -1 &&
         navigator.userAgent.indexOf("Edg") === -1;
};

// Check if the browser is Firefox
export const isFirefox = (): boolean => {
  return navigator.userAgent.indexOf("Firefox") > -1;
};

// Handle browser quirks for speech synthesis
export const getOptimalVoicesForLanguage = (language: string): SpeechSynthesisVoice[] => {
  if (!window.speechSynthesis) return [];
  
  // Get all available voices
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return [];
  
  // Get the language code's first part (e.g., 'en' from 'en-US')
  const languagePrefix = language.split('-')[0].toLowerCase();
  const fullLanguage = language.toLowerCase();
  
  // First try an exact match
  const exactMatches = voices.filter(voice => 
    voice.lang.toLowerCase() === fullLanguage
  );
  
  // Then try prefix matches
  const prefixMatches = voices.filter(voice => 
    voice.lang.toLowerCase().startsWith(languagePrefix) && 
    !exactMatches.includes(voice)
  );
  
  // Combine matches, putting exact matches first
  const allMatches = [...exactMatches, ...prefixMatches];
  
  // If no matching voices, return the first voice as fallback
  if (allMatches.length === 0) {
    console.log(`No matching voices found for ${language}, using default voice`);
    return voices.length > 0 ? [voices[0]] : [];
  }
  
  // Sort by quality criteria
  return allMatches.sort((a, b) => {
    // Exact match preference
    const aIsExact = a.lang.toLowerCase() === fullLanguage;
    const bIsExact = b.lang.toLowerCase() === fullLanguage;
    if (aIsExact && !bIsExact) return -1;
    if (!aIsExact && bIsExact) return 1;
    
    // Prefer local/native voices
    if (a.localService && !b.localService) return -1;
    if (!a.localService && b.localService) return 1;
    
    // Quality indicators in voice name (based on common naming patterns)
    const aQualityScore = getVoiceQualityScore(a);
    const bQualityScore = getVoiceQualityScore(b);
    if (aQualityScore !== bQualityScore) return bQualityScore - aQualityScore;
    
    return 0;
  });
};

// Helper function to score voice quality based on name patterns
// Higher score means better quality
function getVoiceQualityScore(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  let score = 0;
  
  // Prefer neural/natural voices
  if (name.includes('neural') || name.includes('natural')) score += 5;
  
  // Prefer enhanced voices
  if (name.includes('enhanced') || name.includes('premium')) score += 4;
  
  // Gender preferences (female voices are often clearer)
  if (name.includes('female')) score += 2;
  if (name.includes('male')) score += 1;
  
  // Avoid obviously robotic voices
  if (name.includes('robot')) score -= 2;
  
  // Apple voices are generally good quality
  if (name.includes('siri') || name.includes('apple')) score += 3;
  
  // Google voices are generally good quality too
  if (name.includes('google')) score += 3;
  
  // Microsoft voices vary in quality
  if (name.includes('microsoft')) score += 1;
  
  return score;
}

// Helper function to check if speech recognition is currently active
export const isSpeechRecognitionActive = (recognition: any): boolean => {
  // This is a best-effort implementation as browsers don't expose a standard way to check
  try {
    // For Chrome/Edge
    if (recognition && typeof recognition.start === 'function' && 
        typeof recognition.stop === 'function' && recognition._started) {
      return true;
    }
    // There's no reliable cross-browser way to check, so we return false as default
    return false;
  } catch (e) {
    return false;
  }
};

/**
 * Diagnose speech recognition issues and provide troubleshooting advice
 * @returns An object containing diagnosis results and troubleshooting tips
 */
export const diagnoseSpeechRecognitionIssues = async () => {
  // Check browser support
  const supportInfo = checkSpeechApiSupport();
  
  // Check microphone permission
  const micPermission = await checkMicrophonePermission();
  
  // Check if there's audio input devices available
  const hasAudioDevices = await hasAudioInputDevices();
  
  // Build diagnosis object
  const diagnosis = {
    browserSupport: supportInfo,
    microphonePermission: micPermission,
    audioInputDevices: hasAudioDevices,
    issues: [] as string[],
    tips: [] as string[]
  };
  
  // Identify issues and provide tips
  if (!supportInfo.isSupported) {
    diagnosis.issues.push("Browser does not fully support Web Speech API");
    diagnosis.tips.push("Use Chrome or Edge for best speech recognition support");
  }
  
  if (micPermission !== "granted") {
    diagnosis.issues.push("Microphone permission not granted");
    diagnosis.tips.push("Check browser settings and grant microphone permission");
  }
  
  if (!hasAudioDevices) {
    diagnosis.issues.push("No audio input devices detected");
    diagnosis.tips.push("Connect a microphone or check device settings");
  }
  
  // Add browser-specific tips
  if (isFirefox()) {
    diagnosis.tips.push("Firefox has limited speech recognition support, consider using Chrome");
  } else if (isSafari()) {
    diagnosis.tips.push("Safari may require HTTPS for speech recognition");
  }
  
  return diagnosis;
};

/**
 * Check if there are audio input devices available
 */
async function hasAudioInputDevices(): Promise<boolean> {
  try {
    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return false;
    }
    
    // Get all media devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    // Check if there are any audio input devices
    return devices.some(device => device.kind === 'audioinput');
  } catch (error) {
    console.error("Error checking audio devices:", error);
    return false;
  }
}

// Declare these interfaces to make TypeScript happy
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  
  // We don't need to modify Navigator interface as it's already defined in lib.dom.d.ts
}
