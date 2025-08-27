package com.rft.rft_be.util;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.regex.Pattern; // chỉ dùng regex Pattern

public final class ProfanityValidator {

    private static final List<String> TERMS = List.of(
            "má","mẹ","bố","cha","ông nội","bà nội","con đĩ","con chó","con cặc","thằng ngu",
            "đmm","đm","vkl","vl","cl","lồn","cặc","buồi","địt","bú","chịch","nứng","dâm","phê",
            "đéo","đụ","cđmm","cc","shit","dm","vlcc","fuck","fucking","bitch","dcm","vcl","lol","wtf","cac","dick","cum"
    );

    private static final List<Pattern> PROFANITY_PATTERNS;

    static {
        String[] terms = TERMS.stream()
                .flatMap(t -> Stream.of(t, stripAccents(t)))
                .distinct()
                .toArray(String[]::new);

        PROFANITY_PATTERNS = Arrays.stream(terms)
                .map(s -> Pattern.quote(s)) // tránh ký tự đặc biệt
                // (?iu): ignore-case + Unicode; dùng ranh giới "không phải chữ" hai đầu
                .map(q -> Pattern.compile("(?iu)(?<!\\p{L})" + q + "(?!\\p{L})"))
                .collect(Collectors.toUnmodifiableList());
    }

    private ProfanityValidator() {}

    public static boolean containsProfanity(String text) {
        if (text == null || text.isBlank()) return false;

        String lower = text.toLowerCase(Locale.ROOT);
        String lowerNoAccent = stripAccents(lower);

        for (Pattern p : PROFANITY_PATTERNS) {
            if (p.matcher(lower).find() || p.matcher(lowerNoAccent).find()) {
                return true;
            }
        }
        return false;
    }

    private static String stripAccents(String input) {
        String norm = Normalizer.normalize(input, Normalizer.Form.NFD);
        String noMarks = norm.replaceAll("\\p{M}+", "");
        return noMarks.replace('đ','d').replace('Đ','D');
    }
}