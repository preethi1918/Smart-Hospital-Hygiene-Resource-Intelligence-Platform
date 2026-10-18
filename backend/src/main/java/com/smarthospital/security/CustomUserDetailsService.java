package com.smarthospital.security;

import com.smarthospital.model.User;
import com.smarthospital.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usernameOrEmailOrEmployeeId) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(usernameOrEmailOrEmployeeId)
                .or(() -> userRepository.findByEmployeeId(usernameOrEmailOrEmployeeId))
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with identifier: " + usernameOrEmailOrEmployeeId));

        return UserPrincipal.create(user);
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        return UserPrincipal.create(user);
    }
}
