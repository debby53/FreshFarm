package com.FreshFarmPlatform.demo.repository;

import com.FreshFarmPlatform.demo.model.message.Message;
import com.FreshFarmPlatform.demo.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findBySenderOrRecipientOrderBySentDateDesc(User sender, User recipient);
}

