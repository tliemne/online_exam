-- ✅ KIỂM TRA ĐỒNG BỘ DỮ LIỆU

-- 1. Kiểm tra attempts của exam API (id=30)
SELECT 'ATTEMPTS' as table_name, COUNT(*) as count, 
       GROUP_CONCAT(CONCAT('id=', id, ' status=', status, ' score=', score) SEPARATOR '; ') as details
FROM attempts 
WHERE exam_id = 30;

-- 2. Kiểm tra attempt_answers của exam API
SELECT 'ATTEMPT_ANSWERS' as table_name, COUNT(*) as count
FROM attempt_answers aa
JOIN attempts a ON a.id = aa.attempt_id
WHERE a.exam_id = 30;

-- 3. Kiểm tra question_statistics của course API (id=2)
SELECT 'QUESTION_STATS' as table_name, COUNT(*) as count,
       GROUP_CONCAT(CONCAT('q_id=', question_id, ' total=', total_attempts, ' correct=', correct_count) SEPARATOR '; ') as details
FROM question_statistics
WHERE question_id IN (
  SELECT id FROM questions WHERE course_id = 2
);

-- 4. Kiểm tra questions của course API
SELECT 'QUESTIONS' as table_name, COUNT(*) as count
FROM questions
WHERE course_id = 2;

-- 5. Kiểm tra exam_questions của exam API
SELECT 'EXAM_QUESTIONS' as table_name, COUNT(*) as count
FROM exam_questions
WHERE exam_id = 30;

-- 6. Kiểm tra xem exam 30 thuộc course nào
SELECT e.id, e.title, e.course_id, c.name as course_name
FROM exams e
LEFT JOIN courses c ON c.id = e.course_id
WHERE e.id = 30;

-- 7. Kiểm tra tất cả attempts + scores
SELECT a.id, a.exam_id, a.student_id, a.status, a.score, a.submitted_at
FROM attempts a
WHERE a.exam_id = 30
ORDER BY a.id;

-- 8. Kiểm tra attempt_answers chi tiết
SELECT aa.id, aa.attempt_id, aa.question_id, aa.is_correct, aa.score
FROM attempt_answers aa
JOIN attempts a ON a.id = aa.attempt_id
WHERE a.exam_id = 30
ORDER BY aa.attempt_id, aa.question_id;

-- 9. Kiểm tra question_statistics chi tiết
SELECT qs.question_id, qs.total_attempts, qs.correct_count, qs.correct_rate, qs.difficulty_flag
FROM question_statistics qs
WHERE qs.question_id IN (
  SELECT eq.question_id FROM exam_questions eq WHERE eq.exam_id = 30
)
ORDER BY qs.question_id;
