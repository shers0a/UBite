-- The canteen uploads its emailed Excel menu (services/menu-import.ts). Each row is matched to a dish
-- by import_key: the sheet's name without diacritics, case or punctuation, so a dish renamed for
-- students is still recognised the next day.
ALTER TABLE dishes ADD COLUMN import_key text UNIQUE;

-- The menu of 10 Nov 2026 went in by hand, with names rewritten for students. These are the keys
-- the canteen's own sheet gives them, so its next upload finds them instead of adding copies. No
-- rows match on a database without them.
WITH map(pattern, key) AS (VALUES
  ('Pulpă de pui la cuptor, 140%', 'pulpe de pui la cuptor 140'),
  ('Pulpă de pui la cuptor, 180%', 'pulpe de pui la cuptor 180'),
  ('Pulpă de pui la cuptor, 210%', 'pulpe de pui la cuptor 210'),
  ('Varză călită', 'varza calita 1'),
  ('Apă plată 0,5 l%', 'apa plata 0 5l'),
  ('Apă minerală 0,5 l%', 'apa minerala 0 5l'),
  ('Coca-Cola 0,5 l%', 'coca cola 0 5l'),
  ('Prigat 0,5 l%', 'prigat 0 5l'),
  ('Fuzetea 0,5 l%', 'fuzetea 0 5l'),
  ('Tacâmuri de unică folosință', 'tacam unica fol'),
  ('Bol la pachet', 'bol'),
  ('Caserolă cu 3 compartimente', 'meniu 3 comp'),
  ('Caserolă cu 2 compartimente', 'meniu 2 comp'),
  ('Sacoșă de hârtie', 'sacosa hartie 22x10x28cm'),
  ('Caserolă pentru salată, 550 ml', 'caserola salata 550 ml'),
  ('Caserolă pentru salată, 750 ml', 'caserola salata 750 ml')
)
UPDATE dishes d SET import_key = m.key FROM map m
WHERE d.id = (SELECT x.id FROM dishes x WHERE x.name_ro LIKE m.pattern ORDER BY x.created_at, x.id LIMIT 1);
