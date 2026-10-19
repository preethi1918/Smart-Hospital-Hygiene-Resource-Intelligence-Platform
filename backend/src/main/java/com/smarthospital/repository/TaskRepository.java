package com.smarthospital.repository;

import com.smarthospital.model.Task;
import com.smarthospital.model.enums.CleaningLocationType;
import com.smarthospital.model.enums.TaskPriority;
import com.smarthospital.model.enums.TaskStatus;
import com.smarthospital.model.enums.TaskType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    Optional<Task> findByTaskCode(String taskCode);
    List<Task> findByStatus(TaskStatus status);
    List<Task> findByTaskType(TaskType taskType);
    List<Task> findByPriority(TaskPriority priority);
    List<Task> findByAssignedTo_UserId(Long userId);
    List<Task> findByTargetWard_WardId(Integer wardId);
    List<Task> findByTargetRoom_RoomId(Long roomId);
    List<Task> findByTargetQrCode(String targetQrCode);
    List<Task> findByTargetQrCodeAndStatusIn(String targetQrCode, List<TaskStatus> statuses);
    List<Task> findByLocationType(CleaningLocationType locationType);
    List<Task> findAllByOrderByScheduledStartTimeDesc();
    List<Task> findByStatusOrderByScheduledStartTimeDesc(TaskStatus status);
    List<Task> findByScheduledStartTimeBeforeAndStatusIn(LocalDateTime cutoff, List<TaskStatus> statuses);
}
