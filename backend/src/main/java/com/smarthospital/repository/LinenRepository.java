package com.smarthospital.repository;

import com.smarthospital.model.Linen;
import com.smarthospital.model.enums.HygieneState;
import com.smarthospital.model.enums.LinenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LinenRepository extends JpaRepository<Linen, Long> {
    @Query("SELECT l FROM Linen l WHERE l.rfidTagOrBarcode = :rfidTagOrBarcode")
    Optional<Linen> findByRfidTagOrBarcode(@Param("rfidTagOrBarcode") String rfidTagOrBarcode);
    List<Linen> findByHygieneState(HygieneState hygieneState);
    List<Linen> findByLinenType(LinenType linenType);
    List<Linen> findByAssignedWard_WardId(Integer wardId);
    List<Linen> findByAssignedBed_BedId(Long bedId);
}
