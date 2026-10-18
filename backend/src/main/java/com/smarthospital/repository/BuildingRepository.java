package com.smarthospital.repository;

import com.smarthospital.model.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Integer> {
    List<Building> findByHospital_HospitalId(Integer hospitalId);
    Optional<Building> findByHospital_HospitalIdAndBuildingCode(Integer hospitalId, String buildingCode);
    List<Building> findByStatus(String status);
    List<Building> findByNameContainingIgnoreCase(String name);
    long countByHospital_HospitalId(Integer hospitalId);
}
