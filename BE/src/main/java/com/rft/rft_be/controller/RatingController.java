package com.rft.rft_be.controller;

import com.rft.rft_be.mapper.RatingMapper;
import com.rft.rft_be.service.admin.CouponService;
import com.rft.rft_be.service.rating.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {
    private final RatingService ratingService;
    private final RatingMapper ratingMapper;



}
