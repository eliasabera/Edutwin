-- Auto-generated insert for EduTwin textbooks
-- Source: Supabase storage links

-- Ensure subject rows exist (grade + subject + cover image)
insert into public.subjects (
  name,
  grade_level,
  cover_image_url
)
select
  v.name,
  v.grade_level,
  v.cover_image_url
from (values
  ('Biology', 9, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G9%20Biology.png'),
  ('Chemistry', 9, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G9%20Chemistry.png'),
  ('Math', 9, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G9%20Maths.png'),
  ('Physics', 9, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G9%20Physics.png'),
  ('Biology', 10, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G10%20Biology.png'),
  ('Chemistry', 10, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G10%20Chemistry.png'),
  ('Math', 10, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G10%20Maths.png'),
  ('Biology', 11, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G11%20Biology.png'),
  ('Chemistry', 11, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G11%20Chemistry.png'),
  ('Physics', 11, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G11%20Physics.png'),
  ('Biology', 12, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G12%20Biology.png'),
  ('Chemistry', 12, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G12%20Chemistry.png'),
  ('Math', 12, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G12%20Maths.png'),
  ('Physics', 12, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G12%20Physics.png')
) as v(name, grade_level, cover_image_url)
left join public.subjects s
  on lower(s.name) = lower(v.name)
 and s.grade_level = v.grade_level
where s.id is null;

-- Update missing cover images for existing subjects
update public.subjects s
set cover_image_url = v.cover_image_url
from (values
  ('Biology', 9, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G9%20Biology.png'),
  ('Chemistry', 9, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G9%20Chemistry.png'),
  ('Math', 9, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G9%20Maths.png'),
  ('Physics', 9, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G9%20Physics.png'),
  ('Biology', 10, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G10%20Biology.png'),
  ('Chemistry', 10, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G10%20Chemistry.png'),
  ('Math', 10, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G10%20Maths.png'),
  ('Biology', 11, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G11%20Biology.png'),
  ('Chemistry', 11, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G11%20Chemistry.png'),
  ('Physics', 11, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G11%20Physics.png'),
  ('Biology', 12, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G12%20Biology.png'),
  ('Chemistry', 12, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G12%20Chemistry.png'),
  ('Math', 12, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G12%20Maths.png'),
  ('Physics', 12, 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G12%20Physics.png')
) as v(name, grade_level, cover_image_url)
where lower(s.name) = lower(v.name)
  and s.grade_level = v.grade_level
  and (s.cover_image_url is null or btrim(s.cover_image_url) = '');

-- Insert textbook links
insert into public.textbooks (
  subject_id,
  title,
  pdf_url
)
select
  s.id,
  v.title,
  v.pdf_url
from (values
  ('Biology', 9, 'Biology Grade 9 Student Textbook', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/books/G9-Biology-STB-2023-web.pdf'),
  ('Biology', 10, 'Biology Grade 10 Student Textbook', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/books/Biology%20Grade%2010%20Student%20Textbook%20July%202014%20(1).pdf'),
  ('Biology', 11, 'Biology Grade 11 Student Textbook', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/books/G11-Biology-STB-2023-web.pdf'),
  ('Biology', 12, 'Biology Grade 12 Student Textbook', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/books/Biology%20Grade%2012%20New%20Textbook.pdf'),
  ('Chemistry', 9, 'Chemistry Grade 9 Student Textbook', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/books/G9-Chemistry-STB-2023-web.pdf'),
  ('Chemistry', 10, 'Chemistry Grade 10 Student Textbook', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/books/Chemistry%20Grade%2010%20ST%20(MT)(BOOK).pdf'),
  ('Chemistry', 11, 'Chemistry Grade 11 Student Textbook', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/books/G11-Chemistry-STB-2023-web.pdf'),
  ('Chemistry', 12, 'Chemistry Grade 12 Student Textbook', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/books/Chemistry%20Grade%2012%20new%20textbook.pdf'),
  ('Physics', 9, 'Physics Grade 9 Student Textbook', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/books/G9-Physics-STB-2023-web.pdf'),
  ('Physics', 11, 'Physics Grade 11 Student Textbook', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/books/G11-Physics-STB-2023-web.pdf'),
  ('Physics', 12, 'Physics Grade 12 Student Textbook', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/books/Physics%20Grade%2012%20new%20textbook.pdf'),
  ('Math', 9, 'Mathematics Grade 9 Student Textbook', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/books/G9-Mathematics-STB-2023-web.pdf'),
  ('Math', 10, 'Mathematics Grade 10 Student Textbook', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/books/Maths%20Grade%2010%20Students%20Textbook%201Aug22.pdf'),
  ('Math', 12, 'Mathematics Grade 12 Student Textbook', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/books/Maths%20Grade%2012%20New%20textbook%20@Ethiopian_Digital_Library.pdf')
) as v(subject_name, grade_level, title, pdf_url)
join public.subjects s
  on lower(s.name) = lower(v.subject_name)
 and s.grade_level = v.grade_level
left join public.textbooks t
  on t.subject_id = s.id
 and lower(t.title) = lower(v.title)
where t.id is null;
