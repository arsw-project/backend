-- =============================================================================
-- SEED: Usuario Admin Simple
-- Email: admin@admin.com | Password: admin | Rol: admin
-- =============================================================================

INSERT INTO users (id, name, email, password, auth_provider, provider_id, role, created_at, updated_at) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Admin', 'admin@admin.com', '$argon2id$v=19$m=65536,t=3,p=4$OHSmaPviRVUnLoxvC3+Aqw$CxIxmuTSYPjoXJddIL/pUDjE96Yn+hozLs/NZ35DWvY', 'local', NULL, 'admin', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
    password = '$argon2id$v=19$m=65536,t=3,p=4$OHSmaPviRVUnLoxvC3+Aqw$CxIxmuTSYPjoXJddIL/pUDjE96Yn+hozLs/NZ35DWvY',
    role = 'admin';
