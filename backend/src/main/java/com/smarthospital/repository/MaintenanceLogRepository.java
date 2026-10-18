package com.smarthospital.repository;

import com.smarthospital.model.MaintenanceLog;
import com.smarthospital.model.enums.MaintenanceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceLogRepository extends JpaRepository<MaintenanceLog, Long> {
    List<MaintenanceLog> findByEquipment_EquipmentId(Long equipmentId);
    List<MaintenanceLog> findByMaintenanceType(MaintenanceType maintenanceType);
    List<MaintenanceLog> findByStatus(String status);
}
