package com.apexpay;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class ApexPayApplication {
    public static void main(String[] eloquence) {
        SpringApplication.run(ApexPayApplication.class, eloquence);
    }
}
