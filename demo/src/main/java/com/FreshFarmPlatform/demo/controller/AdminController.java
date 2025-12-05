package com.FreshFarmPlatform.demo.controller;

import com.FreshFarmPlatform.demo.dto.admin.ReportResponse;
import com.FreshFarmPlatform.demo.dto.admin.TransactionSummaryResponse;
import com.FreshFarmPlatform.demo.dto.admin.UserManagementResponse;
import com.FreshFarmPlatform.demo.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserManagementResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PutMapping("/users/{userId}/deactivate")
    public ResponseEntity<UserManagementResponse> deactivateUser(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.deactivateUser(userId));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<TransactionSummaryResponse>> getAllTransactions() {
        return ResponseEntity.ok(adminService.getAllTransactions());
    }

    @GetMapping("/reports")
    public ResponseEntity<ReportResponse> generateReport(@RequestParam(defaultValue = "MONTHLY") String period) {
        return ResponseEntity.ok(adminService.generateReport(period));
    }
}

