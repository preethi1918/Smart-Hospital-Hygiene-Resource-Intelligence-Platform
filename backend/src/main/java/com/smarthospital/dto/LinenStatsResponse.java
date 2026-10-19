package com.smarthospital.dto;

import com.smarthospital.model.enums.LinenStatus;
import com.smarthospital.model.enums.LinenType;

import java.util.Map;

public class LinenStatsResponse {

    private long totalLinen;
    private long cleanCount;
    private long inUseCount;
    private long dueForChangeCount;
    private long inLaundryCount;
    private long damagedCount;
    private long retiredCount;
    private Map<LinenType, Long> typeCounts;
    private Map<LinenStatus, Long> statusCounts;

    public LinenStatsResponse() {}

    public long getTotalLinen() { return totalLinen; }
    public void setTotalLinen(long totalLinen) { this.totalLinen = totalLinen; }

    public long getCleanCount() { return cleanCount; }
    public void setCleanCount(long cleanCount) { this.cleanCount = cleanCount; }

    public long getInUseCount() { return inUseCount; }
    public void setInUseCount(long inUseCount) { this.inUseCount = inUseCount; }

    public long getDueForChangeCount() { return dueForChangeCount; }
    public void setDueForChangeCount(long dueForChangeCount) { this.dueForChangeCount = dueForChangeCount; }

    public long getInLaundryCount() { return inLaundryCount; }
    public void setInLaundryCount(long inLaundryCount) { this.inLaundryCount = inLaundryCount; }

    public long getDamagedCount() { return damagedCount; }
    public void setDamagedCount(long damagedCount) { this.damagedCount = damagedCount; }

    public long getRetiredCount() { return retiredCount; }
    public void setRetiredCount(long retiredCount) { this.retiredCount = retiredCount; }

    public Map<LinenType, Long> getTypeCounts() { return typeCounts; }
    public void setTypeCounts(Map<LinenType, Long> typeCounts) { this.typeCounts = typeCounts; }

    public Map<LinenStatus, Long> getStatusCounts() { return statusCounts; }
    public void setStatusCounts(Map<LinenStatus, Long> statusCounts) { this.statusCounts = statusCounts; }
}
