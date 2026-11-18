-- Shared category taxonomy from original src/lib/constants.ts, not user data.
INSERT INTO public."Domain"("id","key","name","description","icon","color","order") VALUES
('lifeos-domain-mind_soul','mind_soul','Mind & Soul','Core values, visions, fears, affirmations, therapy notes, meditation.','Compass','#a78bfa',0),
('lifeos-domain-time_action','time_action','Time & Action','Tasks, habits, routines, deep work blocks, bucket lists.','Hourglass','#f59e0b',1),
('lifeos-domain-health','health','Health & Body','Sleep, fitness, nutrition, symptoms, medications, appointments.','HeartPulse','#f43f5e',2),
('lifeos-domain-wealth','wealth','Wealth & Career','Income, expenses, subscriptions, bills, savings goals, career.','TrendingUp','#10b981',3),
('lifeos-domain-network','network','Network','Contacts, important dates, interaction logs, follow-ups, gifts, pets.','Users','#06b6d4',4),
('lifeos-domain-growth','growth','Growth','Reading list, courses, skill building, saved articles, takeaways.','BookOpen','#3b82f6',5),
('lifeos-domain-creativity','creativity','Creativity & Joy','Idea vault, side projects, media log, hobbies, travel, events.','Palette','#ec4899',6),
('lifeos-domain-admin','admin','Admin','Document vault, home maintenance, inventory, grocery lists, recipes.','Home','#71717a',7)
ON CONFLICT ("key") DO NOTHING;
