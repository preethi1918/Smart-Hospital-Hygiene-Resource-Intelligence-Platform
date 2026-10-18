package com.smarthospital.repository;

import com.smarthospital.model.Equipment;
import com.smarthospital.model.enums.EquipmentCategory;
import com.smarthospital.model.enums.OperationalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    Optional<Equipment> findByEquipmentCode(String equipmentCode);
    Optional<Equipment> findBySerialNumber(String serialNumber);
    Optional<Equipment> findByQrCodeIdentifier(String qrCodeIdentifier);
    List<Equipment> findByCategory(EquipmentCategory category);
    List<Equipment> findByOperationalStatus(OperationalStatus operationalStatus);
    List<Equipment> findByNextMaintenanceDueBefore(LocalDate date);
}
