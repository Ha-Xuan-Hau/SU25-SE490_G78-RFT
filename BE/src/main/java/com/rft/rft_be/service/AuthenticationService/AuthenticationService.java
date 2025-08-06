package com.rft.rft_be.service.AuthenticationService;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.rft.rft_be.dto.authentication.*;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.service.mail.EmailSenderService;
import com.rft.rft_be.service.otp.OtpService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
    SecureRandom random = new SecureRandom();
    UserRepository userRepository;
    OtpService otpService;
    EmailSenderService emailSenderService;
    PasswordEncoder passwordEncoder;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        var token = request.getToken();
        boolean isValid = true;
        try {
            verifyToken(token);

        } catch (RuntimeException e) {
            isValid=false;
        }
        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not exits"));
        if(user.getStatus().name().equals("INACTIVE")){
            throw new RuntimeException("User not active");
        }

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        boolean authenticated = passwordEncoder.matches(request.getPassword(),
                user.getPassword());

        if(!authenticated) {
            throw new RuntimeException("Invalid username or password");
        }

        var token= generateToken(user);
        log.info(token);
        return AuthenticationResponse.builder()
                .token(token)
                .build();
    }

    public void sendForgotPasswordOtpEmail(String email) {
        User user =userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("The email address doesn’t exist. Please try again."));


        String otp = generateOtp();
        otpService.saveOtp(email, otp);
        String subject = "Mã OTP: "+otp;

        String template;
        try {
            template = Files.readString(Path.of("src/main/resources/templates/otp_template.html"));
        } catch (IOException e) {
            throw new RuntimeException("Không thể đọc file template email", e);
        }

        String filled = template.replace("${otpCode}", otp);

        emailSenderService.sendHtmlEmail(email, subject, filled);
    }

    public void sendOtpVerificationEmail(String email) {
        String otp = generateOtp();
        otpService.saveOtp(email, otp);
        String subject = "Mã OTP Xác thực địa chỉ email: "+otp;

        String template;
        try {
            template = Files.readString(Path.of("src/main/resources/templates/otp_register_template.html"));
        } catch (IOException e) {
            throw new RuntimeException("Không thể đọc file template email", e);
        }
        String filled = template.replace("${otpCode}", otp);

        emailSenderService.sendHtmlEmail(email, subject, filled);
    }

    public void changePassword(ChangePasswordRequest request) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy người dùng"));

        if (!user.getPassword().equals(passwordEncoder.encode(request.getPassword()))) {
            throw new IllegalStateException("Sai mật khẩu hiện tại");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu và mật khẩu xác nhận lại không trùng nhau. Hãy thử lại");
        }

        if (!isPasswordValid(request.getNewPassword())) {
            throw new IllegalArgumentException("Mật khẩu phải chứa ít nhất một số, một ký tự chữ, và bảy ký tự.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public void logout(IntrospectRequest request) {


    }

    private String generateToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(30, ChronoUnit.MINUTES).toEpochMilli()
                ))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", user.getRole())
                .claim("userId", user.getId())
                .claim("phone", user.getPhone())
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create token", e);
            throw new RuntimeException(e);
        }
    }
    private SignedJWT verifyToken(String token) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY);

        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expityTime = signedJWT.getJWTClaimsSet().getExpirationTime();

        var verified = signedJWT.verify(verifier);

        if (!(verified && expityTime.after(new Date())))
            throw new RuntimeException("UNAUTHENTICATED");

        return signedJWT;
    }

    private String generateOtp() {
        int otp = 100000 + random.nextInt(900000); // tạo số từ 100000 đến 999999
        return String.valueOf(otp);
    }

    private boolean isPasswordValid(String password) {
        // Password must contain at least one number, one letter, and be at least 7 characters long
        String regex = "^(?=.*[0-9])(?=.*[a-zA-Z]).{7,}$";
        return password.matches(regex);
    }
}
