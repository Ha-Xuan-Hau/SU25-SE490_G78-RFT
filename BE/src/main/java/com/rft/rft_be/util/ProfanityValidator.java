package com.rft.rft_be.util;

import java.util.Set;

public class ProfanityValidator {
    private static final Set<String> PROFANITY_WORDS = Set.of(
            "má", "mẹ", "bố", "cha", "ông nội", "bà nội", "con đĩ", "con chó", "con cặc", "thằng ngu",
            "đmm", "đm", "vkl", "vl", "cl", "lồn", "cặc", "buồi", "địt", "bú", "chịch", "nứng", "dâm", "phê", "đú",
            "đéo", "đụ", "đù", "cđmm", "cc", "shit", "dm", "vlcc", "fuck", "fucking", "bitch", "dcm", "vcl", "lol", "wtf"
    );

    public static boolean containsProfanity(String text) {
        String normalized = text.toLowerCase();
        return PROFANITY_WORDS.stream().anyMatch(normalized::contains);
    }
}
