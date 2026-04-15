# LazyInitializationException Fix

## Problem
Backend was throwing `LazyInitializationException` when loading discussion stats:
```
org.hibernate.LazyInitializationException: Could not initialize proxy [com.example.online_exam.discussion.entity.DiscussionPost#2] - no session
```

This happened when the frontend tried to fetch discussion stats for the Top Contributors section.

## Root Cause
In `DiscussionStatsService.getCourseForumStats()`, the code was:
1. Loading all posts and replies using `findAll()` and filtering in memory
2. Accessing lazy-loaded relationships (`r.getPost().getCourse()`) after the Hibernate session was closed
3. This caused the LazyInitializationException

### Problematic Code:
```java
// ❌ BAD: Loads all entities and filters in memory, causes lazy loading issues
List<DiscussionPost> coursePosts = postRepository.findAll().stream()
    .filter(p -> p.getCourse().getId().equals(courseId))
    .collect(Collectors.toList());

List<DiscussionReply> courseReplies = replyRepository.findAll().stream()
    .filter(r -> r.getPost().getCourse().getId().equals(courseId) && !r.getIsDeleted())
    .collect(Collectors.toList());
```

## Solution

### 1. Added @Transactional to Service
```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)  // ✅ Keeps session open for read operations
public class DiscussionStatsService {
```

### 2. Created Repository Methods with Eager Loading
Added methods to fetch data with `JOIN FETCH` to eagerly load relationships:

**DiscussionPostRepository:**
```java
@Query("SELECT p FROM DiscussionPost p JOIN FETCH p.author WHERE p.course.id = :courseId")
List<DiscussionPost> findByCourseIdWithAuthor(@Param("courseId") Long courseId);
```

**DiscussionReplyRepository:**
```java
@Query("SELECT r FROM DiscussionReply r JOIN FETCH r.author WHERE r.post.course.id = :courseId AND r.isDeleted = false")
List<DiscussionReply> findByCourseIdWithAuthor(@Param("courseId") Long courseId);
```

### 3. Updated Service to Use New Methods
```java
// ✅ GOOD: Uses database query with eager loading
List<DiscussionPost> coursePosts = postRepository.findByCourseIdWithAuthor(courseId);
List<DiscussionReply> courseReplies = replyRepository.findByCourseIdWithAuthor(courseId);
```

## Benefits

1. **No LazyInitializationException**: All required data is loaded eagerly within the transaction
2. **Better Performance**: Database does the filtering instead of loading all entities into memory
3. **Cleaner Code**: No need for `.stream().filter()` chains
4. **Scalability**: Works efficiently even with large datasets

## Technical Details

### What is LazyInitializationException?
- Hibernate uses lazy loading by default for relationships (@ManyToOne, @OneToMany, etc.)
- When you access a lazy-loaded relationship outside of a transaction/session, Hibernate can't fetch the data
- This throws `LazyInitializationException`

### Why @Transactional(readOnly = true)?
- Keeps the Hibernate session open for the entire method execution
- `readOnly = true` optimizes for read operations (no dirty checking)
- Allows lazy-loaded relationships to be accessed safely

### Why JOIN FETCH?
- Tells Hibernate to eagerly load the relationship in the same query
- Prevents N+1 query problem
- Ensures data is available even after session closes

## Files Modified
1. `src/main/java/com/example/online_exam/discussion/service/DiscussionStatsService.java`
   - Added `@Transactional(readOnly = true)` to class
   - Updated `getCourseForumStats()` to use new repository methods

2. `src/main/java/com/example/online_exam/discussion/repository/DiscussionPostRepository.java`
   - Added `findByCourseIdWithAuthor()` method

3. `src/main/java/com/example/online_exam/discussion/repository/DiscussionReplyRepository.java`
   - Added `findByCourseIdWithAuthor()` method

## Testing
After this fix:
1. No more LazyInitializationException in logs
2. Discussion stats load successfully
3. Top Contributors section displays data correctly
4. Better performance (database filtering instead of in-memory)
