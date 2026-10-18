package com.smarthospital.service;

import com.smarthospital.dto.AuthResponse;
import com.smarthospital.dto.LoginRequest;
import com.smarthospital.dto.RegisterRequest;
import com.smarthospital.exception.BadRequestException;
import com.smarthospital.exception.DuplicateResourceException;
import com.smarthospital.model.Role;
import com.smarthospital.model.User;
import com.smarthospital.model.enums.RoleCode;
import com.smarthospital.model.enums.UserStatus;
import com.smarthospital.repository.RoleRepository;
import com.smarthospital.repository.UserRepository;
import com.smarthospital.security.JwtTokenProvider;
import com.smarthospital.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();
        String normalizedEmployeeId = request.getEmployeeId().trim();

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new DuplicateResourceException("Email is already registered: " + normalizedEmail);
        }

        if (userRepository.findByEmployeeId(normalizedEmployeeId).isPresent()) {
            throw new DuplicateResourceException("Employee ID is already registered: " + normalizedEmployeeId);
        }

        RoleCode roleCode = request.getRoleCode();
        if (roleCode == null) {
            throw new BadRequestException("Role code is required");
        }

        Role role = roleRepository.findByRoleCode(roleCode)
                .orElseGet(() -> {
                    Role newRole = new Role(roleCode, roleCode.name().replace('_', ' '), "System role for " + roleCode);
                    return roleRepository.save(newRole);
                });

        // BCrypt password hashing - never store plaintext passwords!
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User();
        user.setEmployeeId(normalizedEmployeeId);
        user.setEmail(normalizedEmail);
        user.setPasswordHash(encodedPassword);
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setDepartment(request.getDepartment().trim());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);

        User savedUser = userRepository.save(user);

        UserPrincipal principal = UserPrincipal.create(savedUser);
        String token = tokenProvider.generateTokenFromUserPrincipal(principal);

        return new AuthResponse(
                token,
                "Bearer",
                tokenProvider.getExpirationMs(),
                savedUser.getUserId(),
                savedUser.getEmployeeId(),
                savedUser.getEmail(),
                savedUser.getFirstName(),
                savedUser.getLastName(),
                savedUser.getDepartment(),
                savedUser.getRole().getRoleCode(),
                savedUser.getStatus()
        );
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getEmail().trim();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, request.getPassword())
        );

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        // Update last login timestamp
        userRepository.findById(userPrincipal.getUserId()).ifPresent(user -> {
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);
        });

        String token = tokenProvider.generateToken(authentication);

        return new AuthResponse(
                token,
                "Bearer",
                tokenProvider.getExpirationMs(),
                userPrincipal.getUserId(),
                userPrincipal.getEmployeeId(),
                userPrincipal.getUsername(),
                userPrincipal.getFirstName(),
                userPrincipal.getLastName(),
                userPrincipal.getDepartment(),
                userPrincipal.getRoleCode(),
                userPrincipal.isEnabled() ? UserStatus.ACTIVE : UserStatus.INACTIVE
        );
    }
}
