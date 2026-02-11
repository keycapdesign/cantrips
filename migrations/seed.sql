-- Seed data: 5 sample games with deals for local development

INSERT OR IGNORE INTO games (id, title, itad_id, slug, game_type, boxart_url, release_date, tags, early_access, players_recent, players_peak, history_low, history_low_store, price_threshold, added_by, needs_review, created_at, updated_at)
VALUES
  (1, 'Zort', '019109e5-8cb2-712a-991d-11047097f14f', 'zort', 'game', 'https://assets.isthereanydeal.com/019109e5-8cb2-712a-991d-11047097f14f/boxart.jpg?t=1760442008', '2024-12-07', '["Horror","Online Co-Op","Co-op","Funny","Psychological Horror"]', 1, 110, 3141, 3, 'Steam', 0, NULL, 0, datetime('now'), datetime('now')),
  (2, 'CRYO', '0192f855-cd8d-73d7-8971-474d94d4a812', 'cryo', 'game', 'https://assets.isthereanydeal.com/0192f855-cd8d-73d7-8971-474d94d4a812/boxart.jpg?t=1768447508', '2025-10-24', '["Action Roguelike","PvE","3D","First-Person","Horror"]', 1, 22, 148, 11.99, 'Steam', 0, NULL, 0, datetime('now'), datetime('now')),
  (3, 'Dreadway', '01921966-33ef-7331-83ce-06e4171f3a1e', 'dreadway', 'game', 'https://assets.isthereanydeal.com/01921966-33ef-7331-83ce-06e4171f3a1e/boxart.jpg?t=1769875806', '2026-01-23', '["Psychological Horror","Online Co-Op","Atmospheric","Action-Adventure","Adventure"]', 0, 4, 112, 7.99, 'Steam', 0, NULL, 0, datetime('now'), datetime('now')),
  (4, 'Haunted Heist', '0199c60d-f75f-7199-94ae-52e9ff8e1216', 'haunted-heist', 'game', 'https://assets.isthereanydeal.com/0199c60d-f75f-7199-94ae-52e9ff8e1216/boxart.jpg?t=1768348218', NULL, '["Team-Based","Co-op","PvP","Action","PvE"]', 0, 0, 0, NULL, NULL, 0, NULL, 0, datetime('now'), datetime('now')),
  (5, 'Den of Wolves', '018d937f-79c0-73ff-a7ab-fab82f4adf03', 'den-of-wolves', 'game', 'https://assets.isthereanydeal.com/018d937f-79c0-73ff-a7ab-fab82f4adf03/boxart.jpg?t=1765357213', NULL, '["Co-op","Online Co-Op","Heist","FPS","Cyberpunk"]', 0, 0, 0, NULL, NULL, 0, NULL, 0, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO deals (id, game_id, sale_price, regular_price, cut_percent, shop_name, deal_url, source, received_at)
VALUES
  (1, 1, 4, 4, 0, 'Steam', 'https://itad.link/0193a220-da54-7161-a2e5-b2fdd444371e/', 'poll', datetime('now')),
  (2, 2, 14.99, 14.99, 0, 'Steam', 'https://itad.link/019a176e-db12-72bd-915a-b311d6982683/', 'poll', datetime('now')),
  (3, 3, 9.99, 9.99, 0, 'Steam', 'https://itad.link/019bea83-4f0c-7356-a5b7-ec37b34d46f6/', 'poll', datetime('now'));
