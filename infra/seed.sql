-- Seed data for Viralit-YT

INSERT INTO themes (slug, title, search_keywords, default_hashtags) VALUES
  ('fortnite', 'Fortnite', 
   ARRAY['fortnite shorts', 'fortnite clips', 'fortnite gaming'],
   ARRAY['#Fortnite', '#FortniteShorts', '#Gaming', '#Shorts']),
  
  ('fitness', 'Fitness & Workout', 
   ARRAY['fitness shorts', 'workout clips', 'gym motivation'],
   ARRAY['#Fitness', '#Workout', '#Gym', '#HealthyLifestyle', '#Shorts']),
  
  ('curiosities', 'Fun Facts & Curiosities', 
   ARRAY['fun facts shorts', 'did you know', 'interesting facts'],
   ARRAY['#Facts', '#DidYouKnow', '#Curiosities', '#Learning', '#Shorts']),
  
  ('cooking', 'Cooking & Recipes', 
   ARRAY['cooking shorts', 'recipe videos', 'food hacks'],
   ARRAY['#Cooking', '#Recipe', '#Food', '#Foodie', '#Shorts']),
  
  ('tech', 'Tech & Gadgets', 
   ARRAY['tech shorts', 'gadget reviews', 'tech tips'],
   ARRAY['#Tech', '#Technology', '#Gadgets', '#TechTips', '#Shorts'])
ON CONFLICT (slug) DO NOTHING;

-- Extra theme: Roblox
INSERT INTO themes (slug, title, search_keywords, default_hashtags) VALUES
  ('roblox', 'Roblox',
   ARRAY['roblox shorts', 'roblox gameplay', 'roblox funny moments'],
   ARRAY['#Roblox', '#RobloxShorts', '#Gaming', '#Shorts'])
ON CONFLICT (slug) DO NOTHING;

