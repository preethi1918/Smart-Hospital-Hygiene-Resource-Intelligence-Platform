package com.smarthospital.repository;

import com.smarthospital.model.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, Integer> {
    Optional<Hospital> findByHospitalCode(String hospitalCode);
    Optional<Hospital> findByLicenseNumber(String licenseNumber);
    List<Hospital> findByStatus(String status);
    List<Hospital> findByCityIgnoreCase(String city);
    List<Hospital> findByNameContainingIgnoreCase(String name);
}
