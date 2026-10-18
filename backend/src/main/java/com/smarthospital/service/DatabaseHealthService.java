package com.smarthospital.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

@Service
public class DatabaseHealthService {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseHealthService.class);

    private final DataSource dataSource;

    @Autowired
    public DatabaseHealthService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public boolean isDatabaseConnected() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(3);
        } catch (SQLException e) {
            logger.warn("Database connection check failed: {}", e.getMessage());
            return false;
        }
    }

    public Map<String, Object> getDatabaseDetails() {
        Map<String, Object> details = new HashMap<>();
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            details.put("connected", true);
            details.put("databaseProductName", metaData.getDatabaseProductName());
            details.put("databaseProductVersion", metaData.getDatabaseProductVersion());
            details.put("driverName", metaData.getDriverName());
            details.put("driverVersion", metaData.getDriverVersion());
            details.put("url", metaData.getURL());
        } catch (SQLException e) {
            details.put("connected", false);
            details.put("error", e.getMessage());
        }
        return details;
    }
}
