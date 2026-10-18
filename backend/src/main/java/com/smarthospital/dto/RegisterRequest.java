package com.smarthospital.dto;

import com.smarthospital.model.enums.RoleCode;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Employee ID is required")
    @Size(max = 50, message = "Employee ID cannot exceed 50 characters")
    private String employeeId;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;

    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name cannot exceed 100 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name cannot exceed 100 characters")
    private String lastName;

    @NotBlank(message = "Department is required")
    @Size(max = 100, message = "Department cannot exceed 100 characters")
    private String department;

    @NotNull(message = "Role code is required (ADMIN, HOSPITAL_MANAGER, CLEANING_STAFF, MAINTENANCE_STAFF, STORE_MANAGER, AUDITOR)")
    private RoleCode roleCode;

    @Size(max = 25, message = "Phone number cannot exceed 25 characters")
    private String phoneNumber;

    public RegisterRequest() {}

    public RegisterRequest(String employeeId, String email, String password,
                           String firstName, String lastName, String department,
                           RoleCode roleCode, String phoneNumber) {
        this.employeeId = employeeId;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.department = department;
        this.roleCode = roleCode;
        this.phoneNumber = phoneNumber;
    }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public RoleCode getRoleCode() { return roleCode; }
    public void setRoleCode(RoleCode roleCode) { this.roleCode = roleCode; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
}
