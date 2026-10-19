package com.smarthospital.repository;

import com.smarthospital.model.Linen;
import com.smarthospital.model.enums.DamageStatus;
import com.smarthospital.model.enums.LinenStatus;
import com.smarthospital.model.enums.LinenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LinenRepository extends JpaRepository<Linen, Long> {

    Optional<Linen> findByLinenCode(String linenCode);

    boolean existsByLinenCode(String linenCode);

    List<Linen> findByStatus(LinenStatus status);

    List<Linen> findByLinenType(LinenType linenType);

    List<Linen> findByDamageStatus(DamageStatus damageStatus);

    List<Linen> findByAssignedBed_BedId(Long bedId);

    @Query("SELECT l FROM Linen l " +
           "LEFT JOIN FETCH l.assignedBed b " +
           "LEFT JOIN FETCH b.room r " +
           "WHERE (:keyword IS NULL OR LOWER(l.linenCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(l.currentLocation) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:linenType IS NULL OR l.linenType = :linenType) " +
           "AND (:status IS NULL OR l.status = :status) " +
           "AND (:damageStatus IS NULL OR l.damageStatus = :damageStatus) " +
           "AND (:bedId IS NULL OR (l.assignedBed IS NOT NULL AND l.assignedBed.bedId = :bedId)) " +
           "ORDER BY l.updatedAt DESC")
    List<Linen> searchLinen(@Param("keyword") String keyword,
                            @Param("linenType") LinenType linenType,
                            @Param("status") LinenStatus status,
                            @Param("damageStatus") DamageStatus damageStatus,
                            @Param("bedId") Long bedId);

    long countByStatus(LinenStatus status);

    long countByLinenType(LinenType linenType);
}
