package com.rft.rft_be.repository;


import com.rft.rft_be.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    @Query("SELECT n FROM Notification n WHERE n.receiver.id = :receiverId AND n.isDeleted = false ORDER BY n.createdAt DESC")
    Page<Notification> findByReceiverIdAndNotDeleted(@Param("receiverId") String receiverId, Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE n.receiver.id = :receiverId AND n.isRead = false AND n.isDeleted = false")
    List<Notification> findUnreadByReceiverId(@Param("receiverId") String receiverId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.receiver.id = :receiverId AND n.isRead = false AND n.isDeleted = false")
    Long countUnreadByReceiverId(@Param("receiverId") String receiverId);
    
    // Admin methods
    Page<Notification> findByReceiverId(String receiverId, Pageable pageable);
    Page<Notification> findByReceiverIdAndIsReadFalse(String receiverId, Pageable pageable);
    Long countByReceiverId(String receiverId);
    Long countByReceiverIdAndIsReadFalse(String receiverId);
}
