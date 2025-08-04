package com.rft.rft_be.util;

import java.util.List;

public class PaginationUtils {
    public static <T> List<T> paginate(List<T> list, int page, int size) {
        int fromIndex = page * size;
        if (fromIndex >= list.size()) return List.of();
        int toIndex = Math.min(fromIndex + size, list.size());
        return list.subList(fromIndex, toIndex);
    }
}
