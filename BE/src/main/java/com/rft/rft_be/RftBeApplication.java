package com.rft.rft_be;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RftBeApplication {

	public static void main(String[] args) {
		SpringApplication.run(RftBeApplication.class, args);
	}

}
