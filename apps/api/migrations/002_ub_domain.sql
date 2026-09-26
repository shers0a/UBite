-- Every UB mailbox may hold an account, not only students' (docs/10, D-28): s.unibuc.ro,
-- g.unibuc.ro, unibuc.ro and the faculties' subdomains. The role keeps its name.
ALTER TABLE users DROP CONSTRAINT student_domain;
ALTER TABLE users ADD CONSTRAINT student_domain
  CHECK (role <> 'student' OR email IS NULL OR email LIKE '%@unibuc.ro' OR email LIKE '%@%.unibuc.ro');
