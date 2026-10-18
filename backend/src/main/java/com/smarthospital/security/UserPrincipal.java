package com.smarthospital.security;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.smarthospital.model.User;
import com.smarthospital.model.enums.RoleCode;
import com.smarthospital.model.enums.UserStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;

public class UserPrincipal implements UserDetails {

    private final Long userId;
    private final String employeeId;
    private final String email;
    private final String firstName;
    private final String lastName;
    private final String department;
    private final RoleCode roleCode;

    @JsonIgnore
    private final String password;

    private final boolean enabled;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(Long userId, String employeeId, String email, String firstName,
                         String lastName, String department, RoleCode roleCode,
                         String password, boolean enabled,
                         Collection<? extends GrantedAuthority> authorities) {
        this.userId = userId;
        this.employeeId = employeeId;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.department = department;
        this.roleCode = roleCode;
        this.password = password;
        this.enabled = enabled;
        this.authorities = authorities;
    }

    public static UserPrincipal create(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        if (user.getRole() != null && user.getRole().getRoleCode() != null) {
            String roleName = user.getRole().getRoleCode().name();
            // Add both with and without "ROLE_" prefix for maximum compatibility
            authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName));
            authorities.add(new SimpleGrantedAuthority(roleName));
        }

        boolean isActive = user.getStatus() == UserStatus.ACTIVE;

        return new UserPrincipal(
                user.getUserId(),
                user.getEmployeeId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getDepartment(),
                user.getRole() != null ? user.getRole().getRoleCode() : null,
                user.getPasswordHash(),
                isActive,
                authorities
        );
    }

    public Long getUserId() { return userId; }
    public String getEmployeeId() { return employeeId; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getDepartment() { return department; }
    public RoleCode getRoleCode() { return roleCode; }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserPrincipal that)) return false;
        return Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId);
    }
}
