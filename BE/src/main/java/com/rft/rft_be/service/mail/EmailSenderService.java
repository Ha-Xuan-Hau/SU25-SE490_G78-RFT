package com.rft.rft_be.service.mail;

import com.rft.rft_be.entity.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailSenderService {

    private final JavaMailSender mailSender;
    private static final String TEMPLATE_PATH = "src/main/resources/templates/";

    public EmailSenderService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async("taskExecutor")
    public void sendEmail(String toEmail, String subject, String content) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("quizzesonlinebeta@gmail.com");
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(content);
        mailSender.send(message);
    }

    @Async("taskExecutor")
    public void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        MimeMessage message = mailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("quizzesonlinebeta@gmail.com");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // `true` để báo là HTML

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Gửi mail HTML thất bại", e);
        }
    }

    public void sendTwoFlagsWarningEmail(User user, long flagCount) {
        String subject = String.format("Cảnh báo: Tài khoản đã bị báo cáo %d lần", flagCount);

        String template;
        try {
            ClassPathResource resource = new ClassPathResource("templates/two_flags_warning.html");
            template = new String(resource.getInputStream().readAllBytes() , StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Không thể đọc file template email", e);
        }

        String filledContent = template
                .replace("${fullName}", user.getFullName())
                .replace("${email}", user.getEmail())
                .replace("${flagCount}", String.valueOf(flagCount));

        sendHtmlEmail(user.getEmail(), subject, filledContent);
    }

    public void sendPermanentBanEmail(User user, LocalDateTime appealDeadline) {
        String subject = "Thông báo khóa tài khoản";

        String template;
        try {
            ClassPathResource resource = new ClassPathResource("templates/permanent_ban.html");
            template = new String(resource.getInputStream().readAllBytes() , StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Không thể đọc file template email", e);
        }

        String formattedDeadline = appealDeadline.format(
                DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")
        );

        String filledContent = template
                .replace("${fullName}", user.getFullName())
                .replace("${email}", user.getEmail())
                .replace("${appealDeadline}", formattedDeadline);

        sendHtmlEmail(user.getEmail(), subject, filledContent);

    }

}
