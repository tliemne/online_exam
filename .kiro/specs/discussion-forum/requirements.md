# Requirements Document - Discussion/Q&A Forum

## Introduction

Hệ thống Discussion/Q&A Forum cho phép sinh viên và giáo viên tương tác, đặt câu hỏi và thảo luận trong phạm vi từng khóa học. Tính năng này tăng cường sự tương tác giữa sinh viên và giáo viên, hỗ trợ học tập hiệu quả hơn thông qua việc chia sẻ kiến thức và giải đáp thắc mắc.

## Glossary

- **Discussion_Forum_System**: Hệ thống diễn đàn thảo luận/hỏi đáp
- **Discussion_Post**: Bài đăng thảo luận hoặc câu hỏi được tạo bởi thành viên khóa học
- **Reply**: Câu trả lời cho một Discussion_Post
- **Course_Member**: Người dùng là thành viên của khóa học (giáo viên hoặc sinh viên)
- **Post_Author**: Người tạo Discussion_Post
- **Vote**: Hành động upvote hoặc downvote một Discussion_Post hoặc Reply
- **Best_Answer**: Câu trả lời được đánh dấu là tốt nhất cho một Discussion_Post
- **Tag**: Nhãn phân loại cho Discussion_Post
- **Notification_System**: Hệ thống thông báo
- **Search_Engine**: Công cụ tìm kiếm và lọc bài đăng

## Requirements

### Requirement 1: Tạo Discussion Post

**User Story:** Là một sinh viên, tôi muốn tạo câu hỏi hoặc bài thảo luận trong khóa học mà tôi tham gia, để tôi có thể nhận được sự hỗ trợ từ giáo viên và bạn học.

#### Acceptance Criteria

1. WHEN a Course_Member creates a Discussion_Post, THE Discussion_Forum_System SHALL save the Discussion_Post with title, content, author, course reference, and creation timestamp
2. WHEN a Course_Member creates a Discussion_Post, THE Discussion_Forum_System SHALL validate that the author is a member of the specified course
3. WHEN a non-member attempts to create a Discussion_Post in a course, THE Discussion_Forum_System SHALL reject the request with an authorization error
4. WHEN a Discussion_Post is created, THE Discussion_Forum_System SHALL initialize the vote count to zero
5. THE Discussion_Forum_System SHALL require Discussion_Post title to be between 10 and 200 characters
6. THE Discussion_Forum_System SHALL require Discussion_Post content to be between 20 and 10000 characters

### Requirement 2: Trả lời Discussion Post

**User Story:** Là một giáo viên hoặc sinh viên, tôi muốn trả lời câu hỏi của người khác, để tôi có thể chia sẻ kiến thức và hỗ trợ cộng đồng học tập.

#### Acceptance Criteria

1. WHEN a Course_Member creates a Reply to a Discussion_Post, THE Discussion_Forum_System SHALL save the Reply with content, author, parent post reference, and creation timestamp
2. WHEN a Course_Member creates a Reply, THE Discussion_Forum_System SHALL validate that the author is a member of the course containing the Discussion_Post
3. WHEN a non-member attempts to create a Reply, THE Discussion_Forum_System SHALL reject the request with an authorization error
4. WHEN a Reply is created, THE Discussion_Forum_System SHALL initialize the vote count to zero
5. THE Discussion_Forum_System SHALL require Reply content to be between 10 and 5000 characters
6. WHEN a Reply is created, THE Discussion_Forum_System SHALL increment the reply count of the parent Discussion_Post

### Requirement 3: Đánh dấu Best Answer

**User Story:** Là một Post_Author hoặc giáo viên, tôi muốn đánh dấu câu trả lời tốt nhất, để người khác có thể dễ dàng tìm thấy giải pháp hữu ích nhất.

#### Acceptance Criteria

1. WHEN a Post_Author marks a Reply as Best_Answer, THE Discussion_Forum_System SHALL set the Best_Answer flag for that Reply
2. WHEN a teacher of the course marks a Reply as Best_Answer, THE Discussion_Forum_System SHALL set the Best_Answer flag for that Reply
3. WHEN a Best_Answer is marked for a Discussion_Post that already has a Best_Answer, THE Discussion_Forum_System SHALL remove the Best_Answer flag from the previous Reply and set it for the new Reply
4. WHEN a user who is neither the Post_Author nor a course teacher attempts to mark a Best_Answer, THE Discussion_Forum_System SHALL reject the request with an authorization error
5. WHEN a Best_Answer is marked, THE Discussion_Forum_System SHALL update the Discussion_Post status to indicate it has a Best_Answer

### Requirement 4: Vote cho Post và Reply

**User Story:** Là một Course_Member, tôi muốn upvote hoặc downvote các bài đăng và câu trả lời, để tôi có thể đánh giá chất lượng nội dung.

#### Acceptance Criteria

1. WHEN a Course_Member creates an upvote for a Discussion_Post or Reply, THE Discussion_Forum_System SHALL increment the vote count by one
2. WHEN a Course_Member creates a downvote for a Discussion_Post or Reply, THE Discussion_Forum_System SHALL decrement the vote count by one
3. WHEN a Course_Member changes their Vote from upvote to downvote, THE Discussion_Forum_System SHALL decrement the vote count by two
4. WHEN a Course_Member changes their Vote from downvote to upvote, THE Discussion_Forum_System SHALL increment the vote count by two
5. WHEN a Course_Member removes their Vote, THE Discussion_Forum_System SHALL adjust the vote count accordingly
6. THE Discussion_Forum_System SHALL allow each Course_Member to cast at most one Vote per Discussion_Post or Reply
7. WHEN a non-member attempts to Vote, THE Discussion_Forum_System SHALL reject the request with an authorization error

### Requirement 5: Phân loại bài đăng bằng Tags

**User Story:** Là một Course_Member, tôi muốn gắn tags cho bài đăng của mình, để người khác có thể dễ dàng tìm kiếm theo chủ đề.

#### Acceptance Criteria

1. WHEN a Course_Member creates a Discussion_Post with Tags, THE Discussion_Forum_System SHALL associate the specified Tags with the Discussion_Post
2. THE Discussion_Forum_System SHALL allow a Discussion_Post to have between zero and five Tags
3. THE Discussion_Forum_System SHALL require each Tag name to be between 2 and 30 characters
4. WHEN a Course_Member updates Tags for their Discussion_Post, THE Discussion_Forum_System SHALL replace the existing Tags with the new Tags
5. THE Discussion_Forum_System SHALL store Tags in lowercase format for consistency
6. WHEN a Tag is used for the first time in a course, THE Discussion_Forum_System SHALL create a new Tag record for that course

### Requirement 6: Tìm kiếm và lọc bài đăng

**User Story:** Là một Course_Member, tôi muốn tìm kiếm và lọc bài đăng theo từ khóa, tags, hoặc trạng thái, để tôi có thể nhanh chóng tìm thấy thông tin cần thiết.

#### Acceptance Criteria

1. WHEN a Course_Member searches with a keyword, THE Search_Engine SHALL return Discussion_Posts where the keyword appears in the title or content
2. WHEN a Course_Member filters by Tags, THE Search_Engine SHALL return Discussion_Posts that have at least one of the specified Tags
3. WHEN a Course_Member filters by answered status, THE Search_Engine SHALL return Discussion_Posts that have or do not have a Best_Answer based on the filter
4. WHEN a Course_Member applies multiple filters, THE Search_Engine SHALL return Discussion_Posts that satisfy all filter conditions
5. THE Search_Engine SHALL order search results by relevance score when keyword search is used
6. THE Search_Engine SHALL support ordering results by creation date, vote count, or reply count
7. THE Search_Engine SHALL return only Discussion_Posts from courses where the user is a member

### Requirement 7: Thông báo khi có Reply mới

**User Story:** Là một Post_Author, tôi muốn nhận thông báo khi có người trả lời câu hỏi của tôi, để tôi có thể theo dõi và phản hồi kịp thời.

#### Acceptance Criteria

1. WHEN a Reply is created for a Discussion_Post, THE Notification_System SHALL create a notification for the Post_Author
2. WHEN a Reply is created, THE Notification_System SHALL create notifications for all Course_Members who have previously replied to the same Discussion_Post
3. THE Notification_System SHALL include the Reply author name, Discussion_Post title, and Reply preview in the notification
4. WHEN a Course_Member marks a Reply as Best_Answer, THE Notification_System SHALL create a notification for the Reply author
5. WHERE a Course_Member has enabled email notifications, THE Notification_System SHALL send an email notification in addition to in-app notification
6. THE Notification_System SHALL mark notifications as read when the Course_Member views the Discussion_Post

### Requirement 8: Xem danh sách Discussion Posts

**User Story:** Là một Course_Member, tôi muốn xem danh sách các bài đăng trong khóa học, để tôi có thể duyệt qua các thảo luận hiện có.

#### Acceptance Criteria

1. WHEN a Course_Member requests the Discussion_Post list for a course, THE Discussion_Forum_System SHALL return all Discussion_Posts for that course
2. THE Discussion_Forum_System SHALL include post title, author name, creation date, vote count, reply count, and Best_Answer status in the list
3. THE Discussion_Forum_System SHALL support pagination with configurable page size between 10 and 50 items
4. THE Discussion_Forum_System SHALL order the list by creation date descending by default
5. WHEN a non-member requests the Discussion_Post list for a course, THE Discussion_Forum_System SHALL reject the request with an authorization error

### Requirement 9: Xem chi tiết Discussion Post

**User Story:** Là một Course_Member, tôi muốn xem chi tiết một bài đăng bao gồm tất cả các câu trả lời, để tôi có thể đọc toàn bộ cuộc thảo luận.

#### Acceptance Criteria

1. WHEN a Course_Member requests a Discussion_Post detail, THE Discussion_Forum_System SHALL return the complete post information including title, content, author, creation date, vote count, and Tags
2. WHEN a Course_Member requests a Discussion_Post detail, THE Discussion_Forum_System SHALL return all Replies ordered by vote count descending
3. WHEN a Discussion_Post has a Best_Answer, THE Discussion_Forum_System SHALL display the Best_Answer at the top of the Reply list
4. THE Discussion_Forum_System SHALL include the current user's Vote status for the Discussion_Post and each Reply
5. WHEN a non-member requests a Discussion_Post detail, THE Discussion_Forum_System SHALL reject the request with an authorization error

### Requirement 10: Chỉnh sửa và xóa Discussion Post

**User Story:** Là một Post_Author, tôi muốn chỉnh sửa hoặc xóa bài đăng của mình, để tôi có thể sửa lỗi hoặc xóa nội dung không còn phù hợp.

#### Acceptance Criteria

1. WHEN a Post_Author updates their Discussion_Post, THE Discussion_Forum_System SHALL save the new title and content with an updated timestamp
2. WHEN a teacher updates any Discussion_Post in their course, THE Discussion_Forum_System SHALL save the changes with an updated timestamp
3. WHEN a Post_Author deletes their Discussion_Post, THE Discussion_Forum_System SHALL mark the post as deleted and hide it from the list
4. WHEN a teacher deletes any Discussion_Post in their course, THE Discussion_Forum_System SHALL mark the post as deleted and hide it from the list
5. WHEN a Discussion_Post is deleted, THE Discussion_Forum_System SHALL also mark all associated Replies as deleted
6. WHEN a user who is neither the Post_Author nor a course teacher attempts to edit or delete a Discussion_Post, THE Discussion_Forum_System SHALL reject the request with an authorization error
7. THE Discussion_Forum_System SHALL prevent editing a Discussion_Post more than 24 hours after creation

### Requirement 11: Chỉnh sửa và xóa Reply

**User Story:** Là một Reply author, tôi muốn chỉnh sửa hoặc xóa câu trả lời của mình, để tôi có thể cập nhật thông tin hoặc xóa nội dung không chính xác.

#### Acceptance Criteria

1. WHEN a Reply author updates their Reply, THE Discussion_Forum_System SHALL save the new content with an updated timestamp
2. WHEN a teacher updates any Reply in their course, THE Discussion_Forum_System SHALL save the changes with an updated timestamp
3. WHEN a Reply author deletes their Reply, THE Discussion_Forum_System SHALL mark the Reply as deleted and hide it from the Discussion_Post
4. WHEN a teacher deletes any Reply in their course, THE Discussion_Forum_System SHALL mark the Reply as deleted and hide it from the Discussion_Post
5. WHEN a Reply marked as Best_Answer is deleted, THE Discussion_Forum_System SHALL remove the Best_Answer status from the Discussion_Post
6. WHEN a user who is neither the Reply author nor a course teacher attempts to edit or delete a Reply, THE Discussion_Forum_System SHALL reject the request with an authorization error
7. THE Discussion_Forum_System SHALL prevent editing a Reply more than 24 hours after creation

### Requirement 12: Thống kê hoạt động Forum

**User Story:** Là một giáo viên, tôi muốn xem thống kê hoạt động của diễn đàn trong khóa học, để tôi có thể đánh giá mức độ tương tác của sinh viên.

#### Acceptance Criteria

1. WHEN a course teacher requests forum statistics, THE Discussion_Forum_System SHALL return the total number of Discussion_Posts in the course
2. WHEN a course teacher requests forum statistics, THE Discussion_Forum_System SHALL return the total number of Replies in the course
3. WHEN a course teacher requests forum statistics, THE Discussion_Forum_System SHALL return the number of Discussion_Posts with Best_Answer
4. WHEN a course teacher requests forum statistics, THE Discussion_Forum_System SHALL return the list of most active students ranked by number of posts and replies created
5. WHEN a course teacher requests forum statistics, THE Discussion_Forum_System SHALL return the list of most popular Tags ranked by usage count
6. WHEN a non-teacher requests forum statistics, THE Discussion_Forum_System SHALL reject the request with an authorization error
