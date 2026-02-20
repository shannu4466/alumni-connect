package com.alumni.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "bookmarks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@CompoundIndex(name = "user_job_unique", def = "{'userId' : 1, 'jobPostId' : 1}", unique = true)
public class Bookmark {
    @Id
    private String id;
    private String userId;
    private String jobPostId;
}