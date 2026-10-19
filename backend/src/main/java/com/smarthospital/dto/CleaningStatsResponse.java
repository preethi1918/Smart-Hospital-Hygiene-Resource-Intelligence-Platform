package com.smarthospital.dto;

import java.util.Map;

public class CleaningStatsResponse {

    private long totalTasks;
    private long pendingTasks;
    private long inProgressTasks;
    private long completedTasks;
    private long overdueTasks;
    private long verifiedTasks;
    private long totalLogs;
    private Map<String, Long> tasksByLocation;

    public CleaningStatsResponse() {}

    public CleaningStatsResponse(long totalTasks, long pendingTasks, long inProgressTasks,
                                 long completedTasks, long overdueTasks, long verifiedTasks,
                                 long totalLogs, Map<String, Long> tasksByLocation) {
        this.totalTasks = totalTasks;
        this.pendingTasks = pendingTasks;
        this.inProgressTasks = inProgressTasks;
        this.completedTasks = completedTasks;
        this.overdueTasks = overdueTasks;
        this.verifiedTasks = verifiedTasks;
        this.totalLogs = totalLogs;
        this.tasksByLocation = tasksByLocation;
    }

    public long getTotalTasks() { return totalTasks; }
    public void setTotalTasks(long totalTasks) { this.totalTasks = totalTasks; }

    public long getPendingTasks() { return pendingTasks; }
    public void setPendingTasks(long pendingTasks) { this.pendingTasks = pendingTasks; }

    public long getInProgressTasks() { return inProgressTasks; }
    public void setInProgressTasks(long inProgressTasks) { this.inProgressTasks = inProgressTasks; }

    public long getCompletedTasks() { return completedTasks; }
    public void setCompletedTasks(long completedTasks) { this.completedTasks = completedTasks; }

    public long getOverdueTasks() { return overdueTasks; }
    public void setOverdueTasks(long overdueTasks) { this.overdueTasks = overdueTasks; }

    public long getVerifiedTasks() { return verifiedTasks; }
    public void setVerifiedTasks(long verifiedTasks) { this.verifiedTasks = verifiedTasks; }

    public long getTotalLogs() { return totalLogs; }
    public void setTotalLogs(long totalLogs) { this.totalLogs = totalLogs; }

    public Map<String, Long> getTasksByLocation() { return tasksByLocation; }
    public void setTasksByLocation(Map<String, Long> tasksByLocation) { this.tasksByLocation = tasksByLocation; }
}
