package com.smarthospital.config;

import com.smarthospital.model.Role;
import com.smarthospital.model.User;
import com.smarthospital.model.enums.RoleCode;
import com.smarthospital.model.enums.UserStatus;
import com.smarthospital.repository.RoleRepository;
import com.smarthospital.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        initializeRoles();
        initializeDefaultAdmin();
    }

    private void initializeRoles() {
        for (RoleCode roleCode : RoleCode.values()) {
            if (roleRepository.findByRoleCode(roleCode).isEmpty()) {
                String roleName = roleCode.name().replace('_', ' ');
                String description = "Hospital system role for " + roleName;
                Role role = new Role(roleCode, roleName, description);
                roleRepository.save(role);
                logger.info("Initialized system role: {}", roleCode);
            }
        }
    }

    private void initializeDefaultAdmin() {
        String adminEmail = "admin@hospital.com";
        String adminEmployeeId = "EMP-ADM-001";

        if (userRepository.findByEmail(adminEmail).isEmpty() &&
                userRepository.findByEmployeeId(adminEmployeeId).isEmpty()) {

            Role adminRole = roleRepository.findByRoleCode(RoleCode.ADMIN).orElse(null);
            if (adminRole == null) {
                adminRole = roleRepository.save(new Role(RoleCode.ADMIN, "System Administrator", "Full Access"));
            }

            User admin = new User();
            admin.setEmployeeId(adminEmployeeId);
            admin.setEmail(adminEmail);
            // Secure BCrypt hash: Never store plaintext passwords!
            admin.setPasswordHash(passwordEncoder.encode("Admin@123456"));
            admin.setFirstName("Hospital");
            admin.setLastName("Administrator");
            admin.setDepartment("Executive & IT Administration");
            admin.setPhoneNumber("+1-555-0100");
            admin.setRole(adminRole);
            admin.setStatus(UserStatus.ACTIVE);

            userRepository.save(admin);
            logger.info("Initialized default secure admin user: {}", adminEmail);
        }
    }
}
