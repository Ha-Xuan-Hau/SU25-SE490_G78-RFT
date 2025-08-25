package com.rft.rft_be.controller;

import com.rft.rft_be.dto.metric.MetricRequest;
import com.rft.rft_be.dto.metric.MetricResponse;
import com.rft.rft_be.dto.user.RegisterProviderRequestDTO;
import com.rft.rft_be.service.metrics.MetricService;
import com.rft.rft_be.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/providers")
@RequiredArgsConstructor
public class ProviderController {

    private final UserService userService;
    private final MetricService metricService;

    @PostMapping("/register")
    public ResponseEntity<?> registerAsProvider(@RequestBody RegisterProviderRequestDTO request) {
        userService.registerUserAsProvider(request);
        return ResponseEntity.ok().header("Content-Type", "text/plain; charset=UTF-8").body("Đăng ký trở thành đối tác thành công.");

    }

    @PostMapping("/metric")
    public ResponseEntity<MetricResponse> getMetric(@RequestBody MetricRequest request) {
        return ResponseEntity.ok(metricService.getMetric(request));
    }
}