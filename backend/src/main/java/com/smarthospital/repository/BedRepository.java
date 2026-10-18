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
    Optional<Bed> findByRoom_RoomIdAndBedNumber(Long roomId, String bedNumber);
    List<Bed> findByRoom_RoomId(Long roomId);
    List<Bed> findByRoom_Ward_WardId(Integer wardId);
    List<Bed> findByOperationalStatus(OperationalStatus operationalStatus);
    List<Bed> findByBedType(BedType bedType);
    List<Bed> findByBedNumberContainingIgnoreCase(String bedNumber);
    long countByOperationalStatus(OperationalStatus operationalStatus);
    long countByRoom_RoomId(Long roomId);
}
