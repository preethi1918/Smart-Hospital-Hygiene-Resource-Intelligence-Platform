package com.smarthospital.repository;

import com.smarthospital.model.Ward;
import com.smarthospital.model.enums.WardType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WardRepository extends JpaRepository<Ward, Integer> {
    Optional<Ward> findByWardCode(String wardCode);
    List<Ward> findByWardType(WardType wardType);
    List<Ward> findByFloor_FloorId(Integer floorId);
    List<Ward> findByStatus(String status);
    List<Ward> findByNameContainingIgnoreCase(String name);
    long countByFloor_FloorId(Integer floorId);
}
