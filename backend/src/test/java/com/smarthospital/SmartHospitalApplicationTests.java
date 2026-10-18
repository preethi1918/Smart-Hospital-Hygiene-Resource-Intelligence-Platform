package com.smarthospital;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class SmartHospitalApplicationTests {

    @Test
    void contextLoads() {
        // Validates that Spring Boot application context, JPA configurations and beans initialize cleanly
    }
}
