package com.smarthospital.repository;

import com.smarthospital.model.LinenHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LinenHistoryRepository extends JpaRepository<LinenHistory, Long> {

    @Query("SELECT h FROM LinenHistory h WHERE h.linen.linenId = :linenId ORDER BY h.recordedAt DESC")
    List<LinenHistory> findByLinenIdOrderByRecordedAtDesc(@Param("linenId") Long linenId);
}
