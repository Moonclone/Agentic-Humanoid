package com.agentic.humanoid;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HumanoidApplication {

	public static void main(String[] args) {

		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
		System.setProperty("user.timezone", "Asia/Kolkata");
		SpringApplication.run(HumanoidApplication.class, args);
	}

}
