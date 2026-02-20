package com.alumni.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean; // This import might not be strictly necessary if passwordEncoder is only in SecurityConfig
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; // This import might not be strictly necessary
import org.springframework.security.crypto.password.PasswordEncoder; // This import might not be strictly necessary


@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}
}