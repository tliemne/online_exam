package com.example.online_exam.discussion.dto;

import com.example.online_exam.discussion.enums.VoteType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DiscussionVoteRequest {

    @NotNull
    private VoteType voteType;
}
