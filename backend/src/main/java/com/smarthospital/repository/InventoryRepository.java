package com.smarthospital.repository;

import com.smarthospital.model.Inventory;
import com.smarthospital.model.enums.InventoryCategory;
import com.smarthospital.model.enums.InventoryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByItemCode(String itemCode);
    List<Inventory> findByCategory(InventoryCategory category);
    List<Inventory> findByStatus(InventoryStatus status);
    List<Inventory> findByWard_WardId(Integer wardId);
}
