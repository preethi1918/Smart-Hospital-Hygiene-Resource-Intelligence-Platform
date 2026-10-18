package com.smarthospital.dto;

import com.smarthospital.model.enums.RoleCode;
import com.smarthospital.model.enums.UserStatus;

public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private long expiresInMs;
    private Long userId;
    private String employeeId;
    private String email;
    private String firstName;
    private String lastName;
    private String department;
    private RoleCode role;
    private UserStatus status;

    public AuthResponse() {}

    public AuthResponse(String token, String tokenType, long expiresInMs, Long userId,
                        String employeeId, String email, String firstName,
                        String lastName, String department, RoleCode role, UserStatus status) {
        this.token = token;
        this.tokenType = tokenType != null ? tokenType : "Bearer";
        this.expiresInMs = expiresInMs;
        this.userId = userId;
        this.employeeId = employeeId;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.department = department;
        this.role = role;
        this.status = status;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public long getExpiresInMs() { return expiresInMs; }
    public void setExpiresInMs(long expiresInMs) { this.expiresInMs = expiresInMs; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public RoleCode getRole() { return role; }
    public void setRole(RoleCode role) { this.role = role; }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }
}
