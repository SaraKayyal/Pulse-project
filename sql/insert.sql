USE pulse;

-- Delete tables, in order, depending on foreign key constraints.
DELETE FROM profile;
DELETE FROM user;

-- Insert user data into the user table
INSERT INTO user (name, birth_date, phone_number, email, role, address)
VALUES
    ('Usman Nasir', '1997-12-13', '0723679103', 'usman.nasir@bth.se', 'manager', 'karlskrona');

-- Insert profile data into the profile table with hashed password
INSERT INTO profile (profile_id, name, email, username, password)
VALUES ('mana', 'Usman Nasir', 'usman.nasir@bth.se', 'usn1', '$2a$10$eE0.cY3IQmK/2epVB1DCHuC787pcGVVFbvUbvT60dhwB/kgimw3gm');

SELECT * FROM user;
SELECT * FROM profile;
