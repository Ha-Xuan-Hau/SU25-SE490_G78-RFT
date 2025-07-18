package com.rft.rft_be.util;

import java.util.Set;

public class ProfanityValidator {
    private static final Set<String> PROFANITY_WORDS = Set.of(
            "má", "mẹ", "cc", "đmm", "cl", "lồn", "cặc", "địt", "bú", "chịch", "fuck"
    );

    public static boolean containsProfanity(String text) {
        String normalized = text.toLowerCase();
        return PROFANITY_WORDS.stream().anyMatch(normalized::contains);
    }
}
