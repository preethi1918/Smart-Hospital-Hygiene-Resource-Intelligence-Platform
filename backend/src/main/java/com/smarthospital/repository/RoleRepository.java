package com.smarthospital.repository;

import com.smarthospital.model.Role;
import com.smarthospital.model.enums.RoleCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {
    Optional<Role> findByRoleCode(RoleCode roleCode);
}
