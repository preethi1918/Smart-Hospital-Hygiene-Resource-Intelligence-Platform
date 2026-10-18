package com.smarthospital.repository;

import com.smarthospital.model.WasteLog;
import com.smarthospital.model.enums.HazardStatus;
import com.smarthospital.model.enums.WasteCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WasteLogRepository extends JpaRepository<WasteLog, Long> {
    List<WasteLog> findByWard_WardId(Integer wardId);
    List<WasteLog> findByWasteCategory(WasteCategory wasteCategory);
    List<WasteLog> findByHazardStatus(HazardStatus hazardStatus);
    List<WasteLog> findByCollectedBy_UserId(Long userId);
}
