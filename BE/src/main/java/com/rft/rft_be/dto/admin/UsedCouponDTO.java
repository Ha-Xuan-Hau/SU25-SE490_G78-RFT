package com.rft.rft_be.dto.admin;

public class UsedCouponDTO {
    private String id;
    private String userId;
    private String couponId;

    public UsedCouponDTO() {}

    public UsedCouponDTO(String id, String userId, String couponId) {
        this.id = id;
        this.userId = userId;
        this.couponId = couponId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getCouponId() { return couponId; }
    public void setCouponId(String couponId) { this.couponId = couponId; }
}
