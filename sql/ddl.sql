USE pulse;

-- Drop all the tables.

DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `rapport`;
DROP TABLE IF EXISTS `project`;
DROP TABLE IF EXISTS `team_employee`;
DROP TABLE IF EXISTS `team`;
DROP TABLE IF EXISTS `profile`;
DROP TABLE IF EXISTS `user_tokens`;
DROP TABLE IF EXISTS `user`;



CREATE TABLE `user`(
    `employee_id` INT AUTO_INCREMENT,
    `name` VARCHAR(80) NOT NULL,
    `birth_date` DATETIME,
    `phone_number` VARCHAR(20),
    `email` VARCHAR(80) NOT NULL,
    `role` VARCHAR(80),
    `address` VARCHAR(80) NOT NULL,

    PRIMARY KEY(`employee_id`)
);

CREATE TABLE `team` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(80) NOT NULL,
    `employee_id` INT,

    FOREIGN KEY(`employee_id`) REFERENCES `user` (`employee_id`)
);

CREATE TABLE `team_employee`(
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    employee_id INT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES team (id),
    FOREIGN KEY (employee_id) REFERENCES user (employee_id)
);


CREATE TABLE `project` (
    `project_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(60),
    `start_date` Date,
    `end_date` Date,
    `reporting_freq` VARCHAR(60),
    `reporting_date` DATE,
    `description` VARCHAR(60) DEFAULT('No description available'),
    `status` VARCHAR(40),
    `team_id` INT,

    FOREIGN KEY(`team_id`) REFERENCES `team` (`id`)
);


CREATE TABLE `profile`(
    `profile_id` VARCHAR(20),
    `name` VARCHAR(80) NOT NULL,
    `email` VARCHAR(80),
    `username` VARCHAR(20) NOT NULL,
    `password` VARCHAR(255),
    `employee_id` INT AUTO_INCREMENT,

    PRIMARY KEY(`profile_id`),
    FOREIGN KEY(`employee_id`) REFERENCES `user` (`employee_id`)
);

CREATE TABLE `rapport`(
    `rapport_id` INT AUTO_INCREMENT,
    `content` TEXT,
    `submission_date` DATETIME,
    `submitted_at` DATETIME,
    `status` VARCHAR(40) DEFAULT("Draft"),
    `project_id` INT,
    `comments` TEXT,
    `reviewed` VARCHAR(40) DEFAULT("Unread"),

    PRIMARY KEY(`rapport_id`),
    FOREIGN KEY(`project_id`) REFERENCES `project` (`project_id`)
);

CREATE TABLE user_tokens (
    token VARCHAR(255) PRIMARY KEY,
    user_id INT AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    expiration TIMESTAMP NOT NULL,

    FOREIGN KEY (user_id) REFERENCES user(employee_id)
);


-- Show the project manager contact information
DROP PROCEDURE IF EXISTS `contact_manager`;
DELIMITER ;;
CREATE PROCEDURE contact_manager()
BEGIN
    SELECT phone_number, email
    FROM `user`
    WHERE `user`.role = 'manager';
END
;;
DELIMITER ;


-- Show all the team-members 
DROP PROCEDURE IF EXISTS `all_members`;
DELIMITER ;;
CREATE PROCEDURE all_members()
BEGIN
    SELECT * FROM `user`
    WHERE `user`.role != 'manager';
END
;;
DELIMITER ;

-- Show the recent members
DROP PROCEDURE IF EXISTS `recent_members`;
DELIMITER ;;
CREATE PROCEDURE recent_members()
BEGIN
    SELECT * FROM `user`
    WHERE `user`.role != 'manager'
    ORDER BY name DESC
    LIMIT 5;
END;
;;
DELIMITER ;

-- Count how many team members there is
DROP PROCEDURE IF EXISTS `count_members`;
DELIMITER ;;
CREATE PROCEDURE count_members()
BEGIN
    SELECT COUNT(*) FROM `user`
    WHERE `user`.role != 'manager';
END
;;
DELIMITER ;

-- Count how many team members there is
DROP PROCEDURE IF EXISTS `count_projects`;
DELIMITER ;;
CREATE PROCEDURE count_projects()
BEGIN
    SELECT COUNT(*) FROM `project`
    ORDER BY name DESC
    LIMIT 5;
END
;;
DELIMITER ;


-- Count the projects for a specific member.
DROP PROCEDURE IF EXISTS `count_member_projects`;
DELIMITER ;;
CREATE PROCEDURE count_member_projects(IN member_id INT)
BEGIN
    SELECT COUNT(*) AS project_count
    FROM project
    WHERE team_id IN (
    SELECT id
    FROM team
    WHERE employee_id = member_id);
END;
;;
DELIMITER ;

-- Count the report that should be read
DROP PROCEDURE IF EXISTS `count_unread_reports`;
DELIMITER ;;
CREATE PROCEDURE count_unread_reports()
BEGIN
    SELECT COUNT(*) AS report_count
    FROM rapport
    WHERE status != 'Draft' and reviewed = 'Unread';
END;
;;
DELIMITER ;

-- Count the projects assigned to a team member.
DROP PROCEDURE IF EXISTS `count_projects_member`;
DELIMITER ;;
CREATE PROCEDURE count_projects_member(IN employeeId INT)
BEGIN
    SELECT u.employee_id, u.name, COUNT(p.project_id) AS project_count
    FROM `user` u
    LEFT JOIN `team_employee` te ON u.employee_id = te.employee_id
    LEFT JOIN `team` t ON te.team_id = t.id
    LEFT JOIN `project` p ON t.id = p.team_id
    WHERE u.employee_id = employeeId
    GROUP BY u.employee_id, u.name;
END;
;;
DELIMITER ;

-- Count the feedback from the manager.
DROP PROCEDURE IF EXISTS `count_comments_for_user`;
DELIMITER ;;
CREATE PROCEDURE count_comments_for_user(IN employeeId INT)
BEGIN
    SELECT u.employee_id, u.name, COUNT(r.comments) AS comment_count
    FROM `user` u
    LEFT JOIN `team_employee` te ON u.employee_id = te.employee_id
    LEFT JOIN `team` t ON te.team_id = t.id
    LEFT JOIN `project` p ON t.id = p.team_id
    LEFT JOIN `rapport` r ON p.project_id = r.project_id
    WHERE u.employee_id = employeeId
    GROUP BY u.employee_id, u.name;
END;
;;
DELIMITER ;

-- Count the report each user has to write.
DROP PROCEDURE IF EXISTS `count_draft_reports_for_user`;
DELIMITER ;;
CREATE PROCEDURE count_draft_reports_for_user(IN employeeId INT)
BEGIN
    SELECT u.employee_id, u.name, COUNT(r.rapport_id) AS draft_report_count
    FROM `user` u
    LEFT JOIN `team_employee` te ON u.employee_id = te.employee_id
    LEFT JOIN `team` t ON te.team_id = t.id
    LEFT JOIN `project` p ON t.id = p.team_id
    LEFT JOIN `rapport` r ON p.project_id = r.project_id
    WHERE u.employee_id = employeeId
    AND r.status = 'Draft'
    GROUP BY u.employee_id, u.name;
END;
;;
DELIMITER ;

-- Display the projects info
DROP PROCEDURE IF EXISTS `get_projects_data`;
DELIMITER ;;
CREATE PROCEDURE get_projects_data()
BEGIN
    SELECT p.name AS project_name, t.name AS team_name, p.status AS project_status
    FROM project p
    JOIN team t ON p.team_id = t.id
    ORDER BY p.start_date DESC
    LIMIT 5;
END;
;;
DELIMITER ;

-- Get the project Name
DROP PROCEDURE IF EXISTS get_project_name;
DELIMITER ;;
CREATE PROCEDURE get_project_name(
    project_name VARCHAR(60)
)
BEGIN
    SELECT * FROM project WHERE name = project_name;
END
;;
DELIMITER ;

-- Delete the project
DROP PROCEDURE IF EXISTS delete_project;
DELIMITER ;;
CREATE PROCEDURE delete_project(
    project_name VARCHAR(60)
)
BEGIN
    DELETE FROM project
    WHERE
        `name` = project_name;
END
;;
DELIMITER ;

-- Update the project
DROP PROCEDURE IF EXISTS update_project;
DELIMITER ;;
CREATE PROCEDURE update_project(
    project_name VARCHAR(60),
    new_reporting_date DATE
)
BEGIN
    UPDATE project
    SET reporting_date = new_reporting_date
    WHERE name = project_name;
END;
;;
DELIMITER ;

-- Get the user info based on the employee_id to be able to delete the user.
DROP PROCEDURE IF EXISTS member_info;
DELIMITER ;;
CREATE PROCEDURE member_info(employee_id INT)
BEGIN
    SELECT `name`, `role` FROM `user` WHERE `employee_id` = employee_id;
END;
;;
DELIMITER ;



-- Delete a member
DROP PROCEDURE IF EXISTS delete_member;
DELIMITER ;;
CREATE PROCEDURE delete_member(
    IN employee_id INT
)
BEGIN
    -- Use a DELETE statement to remove the user and profile
    DELETE FROM user WHERE id = employee_id;
    DELETE FROM profile WHERE employee_id = employee_id;
END
;;
DELIMITER ;


-- Get all teams

DROP PROCEDURE IF EXISTS `all_teams`;
DELIMITER ;;
CREATE PROCEDURE all_teams()
BEGIN
    SELECT team.id AS team_id, team.name AS team_name, GROUP_CONCAT(user.name) AS team_members
    FROM team
    LEFT JOIN team_employee ON team.id = team_employee.team_id
    LEFT JOIN user ON team_employee.employee_id = user.employee_id
    GROUP BY team.id, team.name;
END
;;
DELIMITER ;

-- Get all projects
DROP PROCEDURE IF EXISTS `get_all_projects`;
DELIMITER ;;
CREATE PROCEDURE get_all_projects()
BEGIN
    -- Select all project data
    SELECT name, team_id, reporting_freq, DATE_FORMAT(reporting_date, '%W %M %d %Y') AS formatted_reporting_date, DATE_FORMAT(start_date, '%W %M %d %Y') AS start_date, DATE_FORMAT(end_date, '%W %M %d %Y') AS end_date, description, status
    FROM project;
END;
;;
DELIMITER ;

-- Get names of all the members that is not a manager so that the manager will be able to create a team by select.
DROP PROCEDURE IF EXISTS `get_members_names`;
DELIMITER ;;
CREATE PROCEDURE get_members_names()
BEGIN
    SELECT user.name FROM `user`
    WHERE `user`.role != 'manager';
END;
;;
DELIMITER ;



-- Insert data about the teams and connect them to the user.
DROP PROCEDURE IF EXISTS InsertTeamWithEmployees;
DELIMITER ;;

CREATE PROCEDURE InsertTeamWithEmployees(
    IN p_team_name VARCHAR(80),
    IN p_employee_names TEXT
)
BEGIN
    -- Declare variables
    DECLARE done INT DEFAULT 0;
    DECLARE employeeName VARCHAR(80);
    DECLARE employeeId INT;
    DECLARE teamId INT;

    -- Declare a handler for SQL errors
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'An error occurred during the transaction';
    END;

    -- Start a transaction
    START TRANSACTION;

    -- Check if a team with the same name already exists
    SELECT id INTO teamId FROM team WHERE name = p_team_name LIMIT 1;

    IF teamId IS NULL THEN
        -- Create a team record if it doesn't exist
        INSERT INTO team (name) VALUES (p_team_name);
        SET teamId = LAST_INSERT_ID();
    END IF;

    -- Temporarily change the delimiter
    SET SESSION sql_mode='';
    SET @employee_names = p_employee_names;
    SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'STRICT_TRANS_TABLES',''));

    -- Split and insert employees into the team
    WHILE LENGTH(@employee_names) > 0 DO
        SET @employeeName = TRIM(SUBSTRING_INDEX(@employee_names, ',', 1));
        SET @employee_names = TRIM(BOTH ',' FROM SUBSTRING(@employee_names, LENGTH(@employeeName) + 1));

        -- Find the employee ID based on the name (you may need to adjust this query)
        SELECT employee_id INTO employeeId FROM user WHERE name = @employeeName LIMIT 1;

        -- Only insert if a valid employee ID is found
        IF employeeId IS NOT NULL THEN
            INSERT IGNORE INTO team_employee (team_id, employee_id) VALUES (teamId, employeeId);
        END IF;

    END WHILE;

    -- Commit the transaction
    COMMIT;
END;
;;
DELIMITER ;

-- Get the project_id to calc the reports.
DROP PROCEDURE IF EXISTS `project_calc`;
DELIMITER ;;
CREATE PROCEDURE project_calc(
    IN project_name VARCHAR(60)
)
BEGIN
    SELECT project_id
    FROM `project`
    WHERE name = project_name;
END
;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `project_user`;
DELIMITER ;;
CREATE PROCEDURE project_user(IN employeeId INT)
BEGIN
    SELECT
        project.project_id, project.team_id,
        project.name,
        DATE_FORMAT(project.start_date, '%W %M %d %Y') AS start_date,
        DATE_FORMAT(project.end_date, '%W %M %d %Y') AS end_date,
        project.reporting_freq,
        DATE_FORMAT(project.reporting_date, '%Y-%m-%d %H:%i:%s') AS reporting_date,
        project.description,
        project.status,
        GROUP_CONCAT(DISTINCT DATE_FORMAT(rapport.submission_date, '%W %M %d %Y %H:%i:%s') ORDER BY rapport.submission_date SEPARATOR ', ') AS submission_dates
    FROM project
    LEFT JOIN rapport ON project.project_id = rapport.project_id
    WHERE project.team_id IN (SELECT team_id FROM team_employee WHERE employee_id = employeeId)
    GROUP BY project.project_id;
END;
;;
DELIMITER ;

-- Display due dates in the report page.
DROP PROCEDURE IF EXISTS `report_dates`;
DELIMITER ;;
CREATE PROCEDURE report_dates(IN projectId INT)
BEGIN
    SELECT DATE_FORMAT(rapport.submission_date, '%Y-%m-%d %H:%i:%s') AS submission_date
    FROM rapport 
    WHERE project_id = projectId AND status = "Draft";
END;
;;
DELIMITER ;

-- Get some of the report information to display that to the manager.
DROP PROCEDURE IF EXISTS `report_info`;
DELIMITER ;;
CREATE PROCEDURE report_info()
BEGIN
    SELECT
        u.name AS user_name,
        t.name AS team_name,
        DATE_FORMAT(r.submission_date, '%Y-%m-%d %H:%i:%s') AS submission_date,
        p.project_id,
        te.employee_id,
        r.status,
        DATE_FORMAT(r.submitted_at, '%Y-%m-%d %H:%i:%s') AS submitted_at
    FROM rapport AS r
    JOIN project AS p ON r.project_id = p.project_id
    JOIN team AS t ON p.team_id = t.id
    JOIN team_employee AS te ON t.id = te.team_id
    JOIN user AS u ON te.employee_id = u.employee_id
    WHERE r.status != 'Draft';
END;
;;
DELIMITER ;


-- Get the content of the report based on the submission date and user.
DROP PROCEDURE IF EXISTS `report_details`;
DELIMITER ;;
CREATE PROCEDURE report_details(IN p_submission_date DATETIME, IN p_user_name VARCHAR(80))
BEGIN
    SELECT
        r.rapport_id,
        r.content,
        r.status
    FROM
        rapport AS r
    JOIN
        project AS p ON r.project_id = p.project_id
    JOIN
        team AS t ON p.team_id = t.id
    JOIN
        team_employee AS te ON t.id = te.team_id
    JOIN
        user AS u ON te.employee_id = u.employee_id
    WHERE
        r.submission_date = p_submission_date
        AND u.name = p_user_name
        AND r.status != 'Draft';
END;
;;
DELIMITER ;

-- Manager feedback for a specific user based on employee_id.
DROP PROCEDURE IF EXISTS `feedback_user`;
DELIMITER ;;
CREATE PROCEDURE feedback_user (
    IN p_employee_id INT
)
BEGIN
    SELECT
        p.name AS project_name,
        DATE_FORMAT(r.submission_date, '%Y-%m-%d %H:%i:%s') AS submission_date,
        r.comments AS comments,
        r.reviewed AS reviewed,
        DATE_FORMAT(MAX(r.submitted_at), '%Y-%m-%d %H:%i:%s') AS submitted_at,
        r.status
    FROM
        user AS u
    JOIN
        team_employee AS te ON u.employee_id = te.employee_id
    JOIN
        team AS t ON te.team_id = t.id
    JOIN
        project AS p ON t.id = p.team_id
    JOIN
        rapport AS r ON p.project_id = r.project_id
    WHERE
        u.employee_id = p_employee_id
        AND r.status != 'Draft'  -- Exclude records with a status of 'Draft'
    GROUP BY project_name, submission_date;
END;
;;
DELIMITER ;



-- Get if there is any comment on the report so that the manager can only write one comment.
DROP PROCEDURE IF EXISTS `get_report_comment`;
DELIMITER ;;
CREATE PROCEDURE get_report_comment(IN rapportId INT)
BEGIN
    SELECT comments FROM rapport WHERE rapport_id = rapportId;
END;
;;
DELIMITER ;

-- Display 5 recent projects for each user.
DROP PROCEDURE IF EXISTS `get_recent_projects_for_user`;
DELIMITER ;;
CREATE PROCEDURE get_recent_projects_for_user(IN employeeId INT)
BEGIN
    SELECT
        u.employee_id,
        u.name AS member_name,
        p.name AS project_name,
        t.name AS team_name,
        p.status AS project_status
    FROM
        `user` u
    LEFT JOIN
        `team_employee` te ON u.employee_id = te.employee_id
    LEFT JOIN
        `team` t ON te.team_id = t.id
    LEFT JOIN
        `project` p ON t.id = p.team_id
    WHERE
        u.employee_id = employeeId
    ORDER BY
        p.start_date DESC
    LIMIT 5;
END;
;;
DELIMITER ;

-- Display the 5 recent feedback a member got from a manager
DROP PROCEDURE IF EXISTS `get_recent_feedback_for_user`;
DELIMITER ;;
CREATE PROCEDURE get_recent_feedback_for_user(
    IN employeeId INT)
BEGIN
    SELECT
        u.employee_id,
        u.name AS member_name,
        p.name AS project_name,
        DATE_FORMAT(r.submitted_at, '%Y-%m-%d %H:%i:%s') AS submitted_at,
        r.comments AS comment
    FROM
        `user` u
    LEFT JOIN
        `team_employee` te ON u.employee_id = te.employee_id
    LEFT JOIN
        `team` t ON te.team_id = t.id
    LEFT JOIN
        `project` p ON t.id = p.team_id
    LEFT JOIN
        `rapport` r ON p.project_id = r.project_id
    WHERE
        u.employee_id = employeeId
    ORDER BY
        r.submitted_at DESC
    LIMIT 5;
END;
;;
DELIMITER ;

