package com.smarthospital.repository;

import com.smarthospital.model.Floor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FloorRepository extends JpaRepository<Floor, Integer> {
    List<Floor> findByBuilding_BuildingId(Integer buildingId);
    Optional<Floor> findByBuilding_BuildingIdAndFloorNumber(Integer buildingId, Integer floorNumber);
}
