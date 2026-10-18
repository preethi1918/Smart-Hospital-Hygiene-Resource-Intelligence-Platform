package com.smarthospital.repository;

import com.smarthospital.model.User;
import com.smarthospital.model.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmployeeId(String employeeId);
    List<User> findByStatus(UserStatus status);
    List<User> findByDepartment(String department);
    boolean existsByEmail(String email);
    boolean existsByEmployeeId(String employeeId);
}
