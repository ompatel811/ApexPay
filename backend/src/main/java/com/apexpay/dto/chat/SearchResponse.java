package com.apexpay.dto.chat;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class SearchResponse {

    private List<ConversationResponse> conversations;
    private List<MessageResponse> messages;
    private List<UserSearchDTO> users;

    @Getter
    @Setter
    @Builder
    public static class UserSearchDTO {
        private String id;
        private String fullName;
        private String username;
        private String profilePhoto;
        private String mobileNumber;
    }
}
