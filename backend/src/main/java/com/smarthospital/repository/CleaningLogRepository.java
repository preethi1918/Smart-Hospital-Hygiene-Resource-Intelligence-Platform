package com.smarthospital.repository;

import com.smarthospital.model.CleaningLog;
import com.smarthospital.model.enums.CleaningLocationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CleaningLogRepository extends JpaRepository<CleaningLog, Long> {
    List<CleaningLog> findByRoom_RoomId(Long roomId);
    List<CleaningLog> findByBed_BedId(Long bedId);
    List<CleaningLog> findByPerformedBy_UserId(Long userId);
    List<CleaningLog> findByStatus(String status);
    List<CleaningLog> findAllByOrderByCompletedAtDesc();
    List<CleaningLog> findByQrScannedTokenOrderByCompletedAtDesc(String qrScannedToken);
    List<CleaningLog> findByLocationTypeOrderByCompletedAtDesc(CleaningLocationType locationType);
}
