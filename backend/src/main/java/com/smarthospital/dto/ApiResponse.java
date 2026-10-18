package com.smarthospital.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private LocalDateTime timestamp;
    private int status;
    private boolean success;
    private String message;
    private T data;
    private Object errors;
    private String path;

    public ApiResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public ApiResponse(int status, String message, T data) {
        this.timestamp = LocalDateTime.now();
        this.status = status;
        this.success = (status >= 200 && status < 300);
        this.message = message;
        this.data = data;
    }

    public ApiResponse(int status, String message, T data, Object errors) {
        this.timestamp = LocalDateTime.now();
        this.status = status;
        this.success = (status >= 200 && status < 300);
        this.message = message;
        this.data = data;
        this.errors = errors;
    }

    public ApiResponse(int status, String message, T data, Object errors, String path) {
        this.timestamp = LocalDateTime.now();
        this.status = status;
        this.success = (status >= 200 && status < 300);
        this.message = message;
        this.data = data;
        this.errors = errors;
        this.path = path;
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(200, message, data);
    }

    public static <T> ApiResponse<T> created(String message, T data) {
        return new ApiResponse<>(201, message, data);
    }

    public static <T> ApiResponse<T> error(int status, String message, Object errors) {
        return new ApiResponse<>(status, message, null, errors);
    }

    public static <T> ApiResponse<T> error(int status, String message, Object errors, String path) {
        return new ApiResponse<>(status, message, null, errors, path);
    }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public int getStatus() { return status; }
    public void setStatus(int status) { 
        this.status = status;
        this.success = (status >= 200 && status < 300);
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public T getData() { return data; }
    public void setData(T data) { this.data = data; }

    public Object getErrors() { return errors; }
    public void setErrors(Object errors) { this.errors = errors; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
}
