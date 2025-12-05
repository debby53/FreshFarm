package com.FreshFarmPlatform.demo.dto.message;

import java.time.LocalDateTime;

public record MessageResponse(
        Long messageId,
        Long senderId,
        Long recipientId,
        String content,
        Boolean isRead,
        LocalDateTime sentDate
) {}

