package com.FreshFarmPlatform.demo.service;

import com.FreshFarmPlatform.demo.dto.message.MessageRequest;
import com.FreshFarmPlatform.demo.dto.message.MessageResponse;
import com.FreshFarmPlatform.demo.exception.ResourceNotFoundException;
import com.FreshFarmPlatform.demo.model.message.Message;
import com.FreshFarmPlatform.demo.model.user.User;
import com.FreshFarmPlatform.demo.repository.MessageRepository;
import com.FreshFarmPlatform.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public MessageService(MessageRepository messageRepository,
                          UserRepository userRepository,
                          UserService userService) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Transactional
    public MessageResponse sendMessage(MessageRequest request) {
        User sender = userService.getCurrentUser();
        User recipient = userRepository.findById(request.recipientId())
                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));
        Message message = Message.builder()
                .sender(sender)
                .recipient(recipient)
                .content(request.content())
                .build();
        return toResponse(messageRepository.save(message));
    }

    public List<MessageResponse> myMessages() {
        User user = userService.getCurrentUser();
        return messageRepository.findBySenderOrRecipientOrderBySentDateDesc(user, user).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MessageResponse markAsRead(Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        User current = userService.getCurrentUser();
        if (!message.getRecipient().getUserId().equals(current.getUserId())) {
            throw new ResourceNotFoundException("Message not found");
        }
        message.setIsRead(true);
        return toResponse(messageRepository.save(message));
    }

    private MessageResponse toResponse(Message message) {
        return new MessageResponse(
                message.getMessageId(),
                message.getSender().getUserId(),
                message.getRecipient().getUserId(),
                message.getContent(),
                message.getIsRead(),
                message.getSentDate()
        );
    }
}

