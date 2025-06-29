"use client";

import { useEffect, useRef, useState } from 'react';
import { 
  checkSpeechApiSupport, 
  requestMicrophonePermission, 
  getOptimalVoicesForLanguage 
} from '@/lib/speech-utils';

interface DemoVoiceProps {
  isActive: boolean;
  scenario: any;
  language: string;
  onTranscriptUpdate?: (text: string) => void;
}

/**
 * Component that provides speech synthesis and recognition for demo calls
 */
export function DemoVoice({ isActive, scenario, language, onTranscriptUpdate }: DemoVoiceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [assistantResponse, setAssistantResponse] = useState("");
  const recognitionRef = useRef<any>(null);
  const conversationHistoryRef = useRef<string[]>([]);
  
  // Support both a set of language codes and full language names
  const languageCodeMap: Record<string, string> = {
    'English': 'en-US',
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'German': 'de-DE',
    'Italian': 'it-IT',
    'Portuguese': 'pt-BR',
    'Japanese': 'ja-JP',
    'Chinese': 'zh-CN',
    'Korean': 'ko-KR',
    'Russian': 'ru-RU',
    'Dutch': 'nl-NL',
    'Hindi': 'hi-IN',
    'Arabic': 'ar-SA',
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-BR',
    'ja': 'ja-JP',
    'zh': 'zh-CN',
    'ko': 'ko-KR',
    'ru': 'ru-RU',
    'nl': 'nl-NL',
    'hi': 'hi-IN',
    'ar': 'ar-SA',
  };

  // Map the language to a language code
  const getLanguageCode = (lang: string) => {
    return languageCodeMap[lang] || 'en-US';
  };

  // Track the last recognized text to avoid duplicates  
  const lastRecognizedText = useRef<string>("");
  
  // Generate demo responses based on scenario and input
  const generateDemoResponse = (input: string) => {
    // If this is the first response, use the scenario intro
    if (conversationHistoryRef.current.length === 0) {
      const greetings: Record<string, string> = {
        'en-US': `Hi there! I'm your language coach for today. We'll be practicing ${scenario.title || "conversation"}. How are you doing today?`,
        'es-ES': `¡Hola! Soy tu profesor de idiomas. Vamos a practicar ${scenario.title || "conversación"}. ¿Cómo estás hoy?`,
        'fr-FR': `Bonjour! Je suis votre professeur de langue. Nous allons pratiquer ${scenario.title || "conversation"}. Comment allez-vous aujourd'hui?`,
        'de-DE': `Hallo! Ich bin dein Sprachlehrer. Wir werden ${scenario.title || "Konversation"} üben. Wie geht es dir heute?`,
      };
      
      const languageCode = getLanguageCode(language);
      return greetings[languageCode] || greetings['en-US'];
    }
    
    // Generate contextual responses based on input
    if (input.toLowerCase().includes("hello") || input.toLowerCase().includes("hi")) {
      return "Hello! It's great to be practicing with you today. How can I help you with your language learning?";
    }
    
    if (input.toLowerCase().includes("how are you")) {
      return "I'm doing well, thank you for asking! How about you? How has your language learning journey been going?";
    }
    
    if (input.toLowerCase().includes("weather")) {
      return "Discussing the weather is a great way to practice everyday conversation. What's the weather like where you are?";
    }
    
    if (input.toLowerCase().includes("difficult") || input.toLowerCase().includes("hard")) {
      return "Language learning can be challenging sometimes. What specific aspects are you finding difficult? We can work on them together.";
    }
    
    if (input.toLowerCase().includes("thank")) {
      return "You're welcome! It's my pleasure to help you practice. Is there anything specific you'd like to focus on today?";
    }
    
    // Default responses if no patterns match
    const defaultResponses = [
      "That's interesting! Could you tell me more about that?",
      "I see. How does that make you feel?",
      "Let's explore that topic further. What else do you know about it?",
      "Good point. Could you expand on that idea?",
      "I understand. Let's practice some vocabulary related to this topic.",
      "Great job with your pronunciation! Let's continue the conversation.",
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  // Start the speech recognition
  const startSpeechRecognition = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.error("Speech recognition is not supported in this browser");
      // Notify that we're in compatibility mode - use text only
      if (onTranscriptUpdate) {
        onTranscriptUpdate("System: Speech recognition not supported in your browser. Using text-only mode.");
      }
      return;
    }
    
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      // If there's an existing recognition instance, clean it up first
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
          recognitionRef.current = null;
        } catch (e) {
          console.warn("Error cleaning up previous recognition instance:", e);
        }
      }
      
      // Create a new instance with enhanced settings for better transcription
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Enable continuous recognition for better results
      recognitionRef.current.interimResults = true; // Get interim results for responsive feedback
      recognitionRef.current.maxAlternatives = 3; // Get multiple alternatives to improve accuracy
      
      // Set the language based on the scenario
      recognitionRef.current.lang = getLanguageCode(language);
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        console.log("Speech recognition started");
      };
      
      recognitionRef.current.onresult = (event: any) => {
        // Get the most recent result
        const resultIndex = event.results.length - 1;
        const latestResult = event.results[resultIndex];
        
        // Only process final results, not interim ones
        if (latestResult.isFinal) {
          // Find the most confident interpretation (first alternative has highest confidence)
          const transcript = latestResult[0].transcript.trim();
          const confidence = latestResult[0].confidence;
          
          console.log("Recognition result:", transcript, "Confidence:", confidence);
          
          // Only update if we have meaningful text and it's not a duplicate of the last recognition
          // We add multiple checks to ensure good quality transcriptions:
          // 1. Not empty
          // 2. More than 2 chars (to filter out short noises)
          // 3. Not a duplicate of the last recognition
          // 4. Either good confidence or substantial content length
          if (transcript && 
              transcript.length > 0 && 
              transcript.length > 2 &&
              transcript !== lastRecognizedText.current &&
              (confidence > 0.5 || transcript.length > 10)) {
              
            console.log("Updating transcript with recognized text");
            
            // Save the current text to avoid duplicates
            lastRecognizedText.current = transcript;
            
            // Update the component state
            setTranscript(transcript);
            
            // Call the onTranscriptUpdate callback if provided
            if (onTranscriptUpdate) {
              onTranscriptUpdate(`User: ${transcript}`);
            }
          } else if (transcript === lastRecognizedText.current) {
            console.log("Skipping duplicate transcript:", transcript);
          } else if (confidence <= 0.5 && transcript.length <= 10) {
            console.log("Skipping low confidence/short transcript:", transcript, "Confidence:", confidence);
          }
        } else {
          // For interim results, just update the component state but don't send to transcript
          const interimTranscript = latestResult[0].transcript.trim();
          if (interimTranscript && interimTranscript.length > 0) {
            setTranscript(interimTranscript + " ...");
          }
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        
        // Stop if the component is no longer active
        if (!isActive) return;
        
        // Generate a response and speak it
        if (transcript && transcript.trim().length > 0) {
          // Filter out any interim markers if present
          const cleanTranscript = transcript.replace(' ...', '');
          
          // Save to conversation history
          conversationHistoryRef.current.push(`User: ${cleanTranscript}`);
          
          // Generate response
          const response = generateDemoResponse(cleanTranscript);
          setAssistantResponse(response);
          conversationHistoryRef.current.push(`Assistant: ${response}`);
          
          // Speak the response
          speakText(response);
          
          // After speaking, start listening again with a delay
          setTimeout(() => {
            if (isActive) {
              startSpeechRecognition();
            }
          }, 1000);
        } else {
          console.log("No transcript captured, restarting recognition");
          // Restart after a short delay to avoid rapid retries
          setTimeout(() => {
            if (isActive) {
              startSpeechRecognition();
            }
          }, 1000);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        
        // Handle common error types with better recovery
        if (event.error === 'not-allowed') {
          console.error("Microphone permission denied");
          setPermissionGranted(false);
          
          // Notify the user about permission issues
          if (onTranscriptUpdate) {
            onTranscriptUpdate("System: Microphone access was denied. Please check your browser permissions and try again.");
          }
          return;
        } else if (event.error === 'no-speech') {
          // No speech detected, just restart with a slightly longer delay
          console.log("No speech detected, restarting recognition after short delay");
          if (onTranscriptUpdate && Math.random() < 0.3) { // Only show sometimes to avoid spamming transcript
            onTranscriptUpdate("System: No speech detected. Please speak clearly or check your microphone.");
          }
        } else if (event.error === 'network') {
          // Network error
          if (onTranscriptUpdate) {
            onTranscriptUpdate("System: Network issue detected with speech recognition. Recognition may be unstable.");
          }
        } else if (event.error === 'audio-capture') {
          // Audio capture problem
          console.error("Audio capture problem");
          if (onTranscriptUpdate) {
            onTranscriptUpdate("System: Problem with audio capture. Please check your microphone connection.");
          }
        } else if (event.error === 'aborted') {
          // Recognition was aborted, likely by our code - no need to restart
          return;
        }
        
        // Restart after a short delay if still active, with exponential backoff
        // to avoid rapid restarts that might cause browser issues
        if (isActive && permissionGranted !== false) {
          const errorCount = (recognitionRef.current.errorCount || 0) + 1;
          recognitionRef.current.errorCount = errorCount;
          
          // Calculate backoff delay (1s, 2s, 4s, 8s, max 10s)
          const backoffDelay = Math.min(Math.pow(2, errorCount - 1) * 1000, 10000);
          
          console.log(`Restarting speech recognition after ${backoffDelay}ms delay (error count: ${errorCount})`);
          
          setTimeout(() => {
            if (isActive) {
              try {
                startSpeechRecognition();
              } catch (e) {
                console.error("Failed to restart speech recognition:", e);
                if (onTranscriptUpdate && errorCount > 3) {
                  onTranscriptUpdate("System: Having trouble with speech recognition. You might need to refresh the page.");
                }
              }
            }
          }, backoffDelay);
        }
      };
      
      recognitionRef.current.start();
    } catch (error) {
      console.error("Error starting speech recognition:", error);
    }
  };
  
  // Speak text using the speech synthesis API
  const speakText = (text: string) => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis is not supported in this browser");
      // Update transcript even without speech synthesis
      if (onTranscriptUpdate) {
        onTranscriptUpdate(`Assistant: ${text}`);
      }
      return;
    }
    
    try {
      setIsSpeaking(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLanguageCode(language);
      
      // Get available voices
      let voices = window.speechSynthesis.getVoices();
      
      // Chrome sometimes needs a delay to load voices
      if (voices.length === 0) {
        setTimeout(() => {
          voices = window.speechSynthesis.getVoices();
          applyVoiceAndSpeak(utterance, text, voices);
        }, 100);
        return;
      }
      
      applyVoiceAndSpeak(utterance, text, voices);
    } catch (error) {
      console.error("Error with speech synthesis:", error);
      setIsSpeaking(false);
      
      // Still update the transcript even if speaking fails
      if (onTranscriptUpdate) {
        onTranscriptUpdate(`Assistant: ${text}`);
      }
    }
  };
  
  // Helper function to apply voice and speak
  const applyVoiceAndSpeak = (utterance: SpeechSynthesisUtterance, text: string, voices: SpeechSynthesisVoice[]) => {
    // Use our helper to get the best voices for this language
    const optimalVoices = getOptimalVoicesForLanguage(getLanguageCode(language));
    
    // Apply the best voice if available
    if (optimalVoices.length > 0) {
      utterance.voice = optimalVoices[0];
    } else {
      // Fallback to manual filtering if our helper doesn't work
      const languageVoices = voices.filter(voice => 
        voice.lang.startsWith(getLanguageCode(language).substring(0, 2)));
        
      if (languageVoices.length > 0) {
        // Prefer female voices if available
        const femaleVoice = languageVoices.find(voice => 
          voice.name.toLowerCase().includes('female'));
        utterance.voice = femaleVoice || languageVoices[0];
      }
    }
    
    utterance.onend = () => {
      setIsSpeaking(false);
      
      // Update transcript through callback
      if (onTranscriptUpdate) {
        onTranscriptUpdate(`Assistant: ${text}`);
      }
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // Check browser compatibility
  const [browserCompatible, setBrowserCompatible] = useState<boolean | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check browser compatibility on mount
    const support = checkSpeechApiSupport();
    setBrowserCompatible(support.isSupported);
    
    if (!support.isSupported) {
      console.warn("Browser compatibility issues detected:", support.details);
      
      // Notify about compatibility issues
      if (onTranscriptUpdate) {
        const missingAPIs = [];
        if (!support.hasSpeechRecognition) missingAPIs.push("speech recognition");
        if (!support.hasSpeechSynthesis) missingAPIs.push("speech synthesis");
        
        onTranscriptUpdate(`System: Your browser (${support.details.browserName}) doesn't support ${missingAPIs.join(" and ")}. Please try Chrome, Edge, or Safari for the full interactive experience.`);
      }
    } else {
      // Request microphone permission if browser is compatible
      requestMicrophonePermission().then(granted => {
        setPermissionGranted(granted);
        
        if (!granted && onTranscriptUpdate) {
          onTranscriptUpdate(`System: Microphone permission denied. Please allow microphone access in your browser settings to use voice features.`);
        }
      });
    }
  }, []);

  // Initial setup and cleanup
  useEffect(() => {
    // Only proceed if browser is compatible and permission is granted (or still pending)
    if (isActive && browserCompatible && permissionGranted !== false) {
      // Wait a moment then start with an introduction
      const introTimer = setTimeout(() => {
        const introResponse = generateDemoResponse("");
        setAssistantResponse(introResponse);
        speakText(introResponse);
        
        // If permission was specifically granted, notify the user
        if (permissionGranted === true && onTranscriptUpdate) {
          onTranscriptUpdate(`System: Microphone access granted. You can now speak when the green "Listening..." indicator is active.`);
        }
      }, 1500);
      
      // Start listening after the intro
      const recognitionTimer = setTimeout(() => {
        if (isActive && (permissionGranted === true || permissionGranted === null)) {
          startSpeechRecognition();
        }
      }, 5000);
      
      return () => {
        // Clear timers on cleanup
        clearTimeout(introTimer);
        clearTimeout(recognitionTimer);
      };
    } else if (!isActive) {
      // Clean up
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.log("Error aborting speech recognition:", e);
        }
      }
      
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
    
    return () => {
      // Cleanup on unmount
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.log("Error aborting speech recognition:", e);
        }
      }
      
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isActive, browserCompatible]);

  return (
    <div className="demo-voice-status">
      {isActive && (
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm text-white">
                {isListening ? 'Listening...' : 'Not listening'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm text-white">
                {isSpeaking ? 'Speaking...' : 'Not speaking'}
              </span>
            </div>
          </div>
          
          {/* Browser compatibility warning */}
          {browserCompatible === false && (
            <div className="text-sm mt-2 p-2 bg-yellow-900/30 rounded border border-yellow-500/30 text-yellow-100">
              <span className="font-semibold">⚠️ Compatibility Issue:</span> Your browser doesn't fully support 
              speech recognition. For the best experience, please use Chrome, Edge, or Safari.
            </div>
          )}
          
          {/* Permission warning */}
          {permissionGranted === false && (
            <div className="text-sm mt-2 p-2 bg-red-900/30 rounded border border-red-500/30 text-red-100">
              <span className="font-semibold">⚠️ Permission Error:</span> Microphone access denied. 
              Please check your browser settings and allow microphone access.
            </div>
          )}
          
          {transcript && (
            <div className="text-sm mt-2 p-2 bg-green-900/30 rounded border border-green-500/30 text-green-100">
              <span className="font-semibold">You:</span> {transcript}
            </div>
          )}
          
          {assistantResponse && (
            <div className="text-sm mt-2 p-2 bg-blue-900/30 rounded border border-blue-500/30 text-blue-100">
              <span className="font-semibold">Assistant:</span> {assistantResponse}
            </div>
          )}
          
          {!transcript && !assistantResponse && !isListening && !isSpeaking && browserCompatible !== false && permissionGranted !== false && (
            <div className="text-xs text-white/60 italic mt-2">
              Once activated, you'll see your transcript here. Please allow browser permissions when prompted.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
