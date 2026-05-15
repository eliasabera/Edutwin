-- Auto-generated insert for EduTwin AR labs
-- Source: Supabase storage links
insert into public.virtual_lab_resources (
  subject_id,
  grade_level,
  chapter,
  topic,
  title,
  description,
  thumbnail_url,
  interaction_type,
  resource_url,
  parameters
)
select
  s.id,
  v.grade_level,
  v.chapter,
  v.topic,
  v.title,
  v.description,
  v.thumbnail_url,
  v.interaction_type::interaction_type,
  v.resource_url,
  v.parameters
from (values
('biology', 9, 'Chapter 1', 'Atco Hand Lens', 'Atco Hand Lens', 'Atco Hand Lens AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_9_Biology/chapter1_atco_hand_lens.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 9, 'Chapter 2', 'Microscope (1)', 'Microscope (1)', 'Microscope (1) AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_9_Biology/chapter2_microscope(1).glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 9, 'Chapter 2', 'Paramecium', 'Paramecium', 'Paramecium AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_9_Biology/chapter2_paramecium.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 9, 'Chapter 2', 'Structure of Amoeba', 'Structure of Amoeba', 'Structure of Amoeba AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_9_Biology/chapter2_structure_of_amoeba.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 9, 'Chapter 3', 'Animal Cell', 'Animal Cell', 'Animal Cell AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_9_Biology/chapter3_animal_cell.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 9, 'Chapter 3', 'Mitochondria', 'Mitochondria', 'Mitochondria AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_9_Biology/chapter3_mitochondria.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 9, 'Chapter 3', 'Nerve Cell Collection of Thunthu', 'Nerve Cell Collection of Thunthu', 'Nerve Cell Collection of Thunthu AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_9_Biology/chapter3_nerve_cell_collection_of_thunthu.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 9, 'Chapter 3', 'Structure of Cilia', 'Structure of Cilia', 'Structure of Cilia AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_9_Biology/chapter3_structure_of_cilia.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 9, 'Chapter 4', 'Female Reproductive Organs X Section', 'Female Reproductive Organs X Section', 'Female Reproductive Organs X Section AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_9_Biology/chapter4_female_reproductive_organs-x_section.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 9, 'Chapter 5', 'Corona Covid-19 Virus', 'Corona Covid-19 Virus', 'Corona Covid-19 Virus AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_9_Biology/chapter5_corona_covid-19_virus.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 10, 'Chapter 2', 'Anatomy of a Flower', 'Anatomy of a Flower', 'Anatomy of a Flower AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_10_biology/chapter2_anatomy_of_a_flower.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 10, 'Chapter 2', 'Chloroplast', 'Chloroplast', 'Chloroplast AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_10_biology/chapter2_chloroplast.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 10, 'Chapter 5', 'Anatomy of the Airways', 'Anatomy of the Airways', 'Anatomy of the Airways AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_10_biology/chapter5_anatomy_of_the_airways.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 10, 'Chapter 5', 'Beating Heart', 'Beating Heart', 'Beating Heart AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_10_biology/chapter5_beating-heart.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 10, 'Chapter 5', 'Types of Human Teeth', 'Types of Human Teeth', 'Types of Human Teeth AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_10_biology/chapter5_types_of_human_teeth.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 11, 'Chapter 1', 'Kingfisher', 'Kingfisher', 'Kingfisher AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_11_biology/chapter1_kingfisher.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 11, 'Chapter 2', 'Microscope (2)', 'Microscope (2)', 'Microscope (2) AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_11_biology/chapter2_microscope(2).glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 11, 'Chapter 2', 'Thermometer', 'Thermometer', 'Thermometer AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_11_biology/chapter2_thermometer.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 11, 'Chapter 3', 'Oxygenated Hemoglobin Cells', 'Oxygenated Hemoglobin Cells', 'Oxygenated Hemoglobin Cells AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_11_biology/chapter3_oxygenated_hemoglobin_cells.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 11, 'Chapter 3', 'Pokeweed Antiviral Protein', 'Pokeweed Antiviral Protein', 'Pokeweed Antiviral Protein AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_11_biology/chapter3_pokeweed_antiviral_protein.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 11, 'Chapter 4', 'DNA', 'DNA', 'DNA AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_11_biology/chapter4_dna.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 11, 'Chapter 4', 'DNA Helix With Base Pairing 3D', 'DNA Helix With Base Pairing 3D', 'DNA Helix With Base Pairing 3D AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_11_biology/chapter4_dna_helix_with_base_pairing_3d.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 11, 'Chapter 5', 'Free Pack - Human Skeleton', 'Free Pack - Human Skeleton', 'Free Pack - Human Skeleton AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_11_biology/chapter5_free_pack_-_human_skeleton.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 11, 'Chapter 5', 'Hepatitis B', 'Hepatitis B', 'Hepatitis B AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_11_biology/chapter5_hepatitis_b.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('biology', 12, 'Chapter 5', 'Liver 3D', 'Liver 3D', 'Liver 3D AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_12_biology/chapter5_liver_3d.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('chemistry', 9, 'Chapter 2', 'Chapter 2 Figure 2.2 Some common measuring devices found in a chemistry laboratory', 'Chapter 2 Figure 2.2 Some common measuring devices found in a chemistry laboratory', 'Chapter 2 Figure 2.2 Some common measuring devices found in a chemistry laboratory AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_9_chemistry/Chapter%202%20Figure%202.2%20Some%20common%20measuring%20devices%20found%20in%20a%20chemistry%20laboratory.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('chemistry', 9, 'Chapter 3', 'Chapter 3 Figure 3.12 Cathode rays bend passing through electric field', 'Chapter 3 Figure 3.12 Cathode rays bend passing through electric field', 'Chapter 3 Figure 3.12 Cathode rays bend passing through electric field AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_9_chemistry/Chapter%203%20Figure%203.12%20Cathode%20rays%20bend%20passing%20through%20electric%20fi%20eld..glb', '{"source":"supabase-storage","format":"glb"}'::jsonb),
('chemistry', 9, 'Chapter 3', 'Chapter 3 Figure 3.15 The apparatus used by Millikan to determine the charge of an electron', 'Chapter 3 Figure 3.15 The apparatus used by Millikan to determine the charge of an electron', 'Chapter 3 Figure 3.15 The apparatus used by Millikan to determine the charge of an electron AR model.', '', 'AR', 'https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/grade_9_chemistry/Chapter%203%20Figure%203.15%20The%20apparatus%20used%20by%20Millikan%20to%20determine%20the%20charge%20of%20an%20electron.glb', '{"source":"supabase-storage","format":"glb"}'::jsonb)
) as v(
  subject_name,
  grade_level,
  chapter,
  topic,
  title,
  description,
  thumbnail_url,
  interaction_type,
  resource_url,
  parameters
)
join public.subjects s
  on lower(s.name) = lower(v.subject_name)
 and s.grade_level = v.grade_level
left join public.virtual_lab_resources r
  on r.resource_url = v.resource_url
where r.resource_url is null;