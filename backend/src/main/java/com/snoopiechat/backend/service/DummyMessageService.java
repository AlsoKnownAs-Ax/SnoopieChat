package com.snoopiechat.backend.service;

import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.List;

@Service
public class DummyMessageService {
    
    private final SecureRandom random = new SecureRandom();
    
    // Pool of realistic but meaningless messages
    private final List<String> dummyMessages = Arrays.asList(
        "Just checking in",
        "How's everything?",
        "Thinking about that conversation we had",
        "Hope you're doing well",
        "Quick question for you",
        "Let me know when you're free",
        "Thanks for earlier",
        "That reminds me",
        "By the way",
        "Just wanted to say",
        "Did you see that?",
        "Interesting point",
        "Makes sense",
        "I agree",
        "Good idea",
        "Sounds good",
        "Will do",
        "No problem",
        "Of course",
        "Absolutely",
        "Perfect timing",
        "Great catch",
        "Nice work",
        "Well done",
        "Keep me posted",
        "Looking forward to it",
        "Talk soon",
        "Catch up later",
        "Have a good one",
        "Take care"
    );
    
    /**
     * Generates a random dummy message content
     * @return A random dummy message string
     */
    public String generateDummyContent() {
        return dummyMessages.get(random.nextInt(dummyMessages.size()));
    }
    
    /**
     * Generates a random interval between dummy messages (in milliseconds)
     * Range: 5 seconds to 15 seconds (for testing)
     * @return Random interval in milliseconds
     */
    public long generateRandomInterval() {
        int minSeconds = 5;   // 5 seconds (was 30)
        int maxSeconds = 15;  // 15 seconds (was 300)
        return (minSeconds + random.nextInt(maxSeconds - minSeconds)) * 1000L;
    }
} 