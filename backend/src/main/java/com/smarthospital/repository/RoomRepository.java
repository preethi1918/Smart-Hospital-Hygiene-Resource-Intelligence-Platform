package com.smarthospital.repository;

import com.smarthospital.model.Room;
import com.smarthospital.model.enums.ReadinessStatus;
import com.smarthospital.model.enums.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByQrCodeIdentifier(String qrCodeIdentifier);
    List<Room> findByWard_WardId(Integer wardId);
    List<Room> findByReadinessStatus(ReadinessStatus readinessStatus);
    List<Room> findByRoomType(RoomType roomType);
}
