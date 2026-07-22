package com.apexpay.service.media;

import com.apexpay.dto.media.AttachmentResponse;
import com.apexpay.dto.media.MediaResponse;
import com.apexpay.dto.media.SearchMediaResponse;
import org.springframework.core.io.Resource;

import java.util.List;
import java.util.UUID;

public interface MediaService {

    MediaResponse getMediaById(UUID id);

    Resource loadMediaAsResource(UUID id);

    SearchMediaResponse searchMedia(String query);

    List<AttachmentResponse> getMediaForConversation(UUID conversationId);

    void deleteMedia(UUID id, UUID userId);
}
