package com.apexpay.dto.media;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class SearchMediaResponse {

    private String query;
    private int totalResults;
    private List<MediaResponse> files;
}
