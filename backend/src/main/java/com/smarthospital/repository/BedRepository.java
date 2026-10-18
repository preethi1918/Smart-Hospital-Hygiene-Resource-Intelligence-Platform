package com.smarthospital.repository;

import com.smarthospital.model.Bed;
import com.smarthospital.model.enums.BedType;
import com.smarthospital.model.enums.OperationalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {
    Optional<Bed> findByQrCodeIdentifier(String qrCodeIdentifier);
    List<Bed> findByRoom_RoomId(Long roomId);
    List<Bed> findByOperationalStatus(OperationalStatus operationalStatus);
    List<Bed> findByBedType(BedType bedType);
    long countByOperationalStatus(OperationalStatus operationalStatus);
}
