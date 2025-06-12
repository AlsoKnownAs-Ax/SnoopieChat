package com.snoopiechat.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.snoopiechat.backend.model.Users;
import com.snoopiechat.backend.model.FriendRequest.FriendRequest;
import com.snoopiechat.backend.model.FriendRequest.RequestStatus;

@Repository
public interface FriendRequestRepo extends JpaRepository<FriendRequest, Long>{
    boolean existsBySenderAndRecipientAndStatus(Users sender, Users recipient, RequestStatus status);

    List<FriendRequest> findByRecipientAndStatus(Users recipient, RequestStatus status);

    long countByRecipientAndStatus(Users recipient, RequestStatus status);
}
