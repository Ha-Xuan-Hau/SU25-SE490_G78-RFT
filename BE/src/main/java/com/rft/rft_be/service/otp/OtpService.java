package com.rft.rft_be.service.otp;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OtpService {
    RedisTemplate<String, String> redisTemplate;
    Duration OTP_TTL = Duration.ofMinutes(5);
    public void saveOtp(String email, String otp) {
        ValueOperations<String, String> ops = redisTemplate.opsForValue();
        ops.set("OTP:" + email, otp, OTP_TTL);
    }

    public boolean verifyOtp(String email, String inputOtp) {
        String key = "OTP:" + email;
        String storedOtp = redisTemplate.opsForValue().get(key);
        return storedOtp != null && storedOtp.equals(inputOtp);
    }

    public void deleteOtp(String email) {
        redisTemplate.delete("OTP:" + email);
    }
}
