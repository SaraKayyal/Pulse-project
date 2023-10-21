/**
 * Contains functions for pulse webb application.
 * @author Sara Kayyal.
 */
"use strict";

const mysql = require("promise-mysql");
const config = require("../config/db/pulse.json");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Mail = require("nodemailer/lib/mailer");
const ejs = require('ejs');
const { log } = require("console");
const { stat } = require("fs");

// Check if this function is needed!
async function closeDatabaseConnection() {
    const db = await mysql.createConnection(config);
    if (db) {
        try {
            await db.end();
            console.log('Database connection closed.');
        } catch (error) {
            console.error('Error closing database connection:', error);
        }
    }
}

// For the public contact page.
async function ShowContactInfo() {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL contact_manager();`;
        const res = await db.query(sql);
        console.info(`SQL: ${sql} got ${res.length} rows.`);
        return res[0];
    } finally {
        db.end();
    }
}


async function AllMembers() {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL all_members();`;
        const res = await db.query(sql);
        console.info(`SQL: ${sql} got ${res.length} rows.`);
        return res[0];
    } finally {
        db.end();
    }
}

// For the dashboard overview of the members.
async function RecentMembers() {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL recent_members();`;
        const res = await db.query(sql);
        console.info(`SQL: ${sql} got ${res.length} rows.`);
        return res[0];
    } finally {
        db.end();
    }
}

//For the dashboard team page
async function AllTeams() {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL all_teams();`;
        const res = await db.query(sql);
        console.info(`SQL: ${sql} got ${res.length} rows.`);
        return res[0];
    } finally {
        db.end();
    }
}

// For team creation, manager will be able to select members
async function membersNames() {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL get_members_names();`;
        const res = await db.query(sql);
        console.info(`SQL: ${sql} got ${res.length} rows.`);
        return res[0];
    } finally {
        db.end();
    }
}

//For the dashboard project page
async function AllProjects() {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL get_all_projects();`;
        const res = await db.query(sql);
        console.info(`SQL: ${sql} got ${res.length} rows.`);
        return res[0];
    } finally {
        db.end();
    }
}

// Display the info about projects
async function projects_info() {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL get_projects_data();`;
        const res = await db.query(sql);
        console.info(`SQL: ${sql} got ${res.length} rows.`);
        return res[0];
    } finally {
        db.end();
    }
}

// Get the project Name
async function project_name(name) {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL get_project_name(?);`;
        const res = await db.query(sql, [name]);
        console.info(`SQL: ${sql} got ${res.length} rows.`);
        return res[0];
    } catch (error) {
        console.error(error);
    } finally {
        db.end();
    }
}

async function deleteProject(projectName) {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL delete_project(?);`;
        const res = await db.query(sql, [projectName]);
        console.info(`SQL: ${sql} got ${res.length} rows.`);
        return res[0];
    } catch (error) {
        console.error(error);
    } finally {
        db.end();
    }
}

async function updateProject(projectName, newReportingDate) {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL update_project(?, ?);`;
        await db.query(sql, [projectName, newReportingDate]);
        console.info(`SQL: ${sql} executed.`);
    } catch (error) {
        console.error(error);
    } finally {
        db.end();
    }
}

// For the dashboard counter of members.
async function count_members() {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL count_members();`;
        const [rows] = await db.query(sql);
        const count = rows[0]['COUNT(*)'];

        return count;
    } finally {
        db.end();
    }
}

// For the dashboard counter of projects.
async function count_projects() {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL count_projects();`;
        const [rows] = await db.query(sql);
        const count = rows[0]['COUNT(*)'];

        return count;
    } finally {
        db.end();
    }
}

// For the dashboard counter of submitted report.
async function count_report_unread() {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL count_unread_reports();`;
        const [rows] = await db.query(sql);
        console.log('Rows:', rows);
        const count = rows[0].report_count;

        return count;
    } finally {
        db.end();
    }
}

// Count the project that is linked to the member.
async function countProjectsForMember(employeeId) {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL count_projects_member(?);`;
        const [rows] = await db.query(sql, [employeeId]);
        const count = rows[0].project_count;

        return count;
    } finally {
        db.end();
    }
}

// Count the report the user has to write.
async function countDraftReportsForUser(employeeId) {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL count_draft_reports_for_user(?);`;
        const [rows] = await db.query(sql, [employeeId]);
        const count = rows[0] ? rows[0].draft_report_count : 0;

        return count;
    } catch (error) {
        console.error('Error retrieving member name: ' + error.message);
        return 0;
    } finally {
        db.end();
    }
}

// Count the feedback each member get from the manager.
async function countCommentsForUser(employeeId) {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL count_comments_for_user(?);`;
        const [rows] = await db.query(sql, [employeeId]);
        const count = rows[0].comment_count;

        return count;
    } finally {
        db.end();
    }
}

async function insertTeamWithEmployees(teamName, employeeNames) {
    const db = await mysql.createConnection(config);
    try {
        // Insert the team
        const teamInsertResult = await db.query('INSERT INTO team (name) VALUES (?)', [teamName]);
        const teamId = teamInsertResult.insertId;

        console.log('Team inserted successfully:', teamName, 'Team ID:', teamId);

        const callProcedure = `CALL InsertTeamWithEmployees(?, ?)`;
        await db.query(callProcedure, [teamName, employeeNames.join(',')]);

        console.log('Team members inserted successfully:', employeeNames);

        console.log('Team and employees inserted successfully.');
    } catch (error) {
        console.error('Error inserting team and employees:', error);
    } finally {
        db.end();
    }
}

async function createProject(name, start_date, end_date, reporting_freq, reporting_date, status, description, team_id) {
    const db = await mysql.createConnection(config);
    try {
        const insertQuery =
            "INSERT INTO project (name, start_date, end_date, reporting_freq, reporting_date, status, description, team_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        await db.query(insertQuery, [name, start_date, end_date, reporting_freq, reporting_date, status, description, team_id]);

        console.log("Project creation succeeded");

        // Fetch the inserted project's ID
        const selectProjectIdQuery = "CALL project_calc(?)";
        const [result] = await db.query(selectProjectIdQuery, [name]);

        console.log("Result: ", result);
        console.log("Result 0: ", result[0]);

        if (result.length > 0) {
            const project_id = result[0].project_id;

            // Call the submission date calculation function
            await calculateSubmissionDates(project_id, reporting_date, start_date, end_date, reporting_freq);
        } else {
            console.error("No project found with the name:", name);
        }
    } catch (error) {
        console.error("Error inserting project:", error);
    } finally {
        db.end();
    }
}

async function calculateSubmissionDates(project_id, reporting_date, start_date, end_date, reporting_freq) {
    const db = await mysql.createConnection(config);

    try {
        let currentDate = new Date(reporting_date);
        let end = new Date(end_date);


        while (currentDate.getTime() <= end.getTime()) {
            if (currentDate.getDay() >= 1 && currentDate.getDay() <= 5) {
                const submissionDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');
                const insertQuery = 'INSERT INTO rapport (project_id, submission_date) VALUES (?, ?)';
                await db.query(insertQuery, [project_id, submissionDate]);
                console - log("Has been inserted in rapport: ", submissionDate);
            }

            // Move to the next date based on reporting frequency
            switch (reporting_freq) {
                case 'Daily':
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;
                case 'Weekly':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'Fortnightly':
                    currentDate.setDate(currentDate.getDate() + 14);
                    break;
                case 'Monthly':
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    currentDate.setDate(1);
                    break;
            }
        }
    } catch (error) {
        console.error('Error calculating submission dates:', error);
    } finally {
        db.end();
    }
}

// For the set-up page to create a password.
async function setupPassword(req, res, username, password, confirmPassword) {
    // Check if passwords match
    if (password !== confirmPassword) {
        return res.render('pages/setup.ejs', { error: 'Passwords do not match' });
    }

    try {
        // Hash the password for security.
        const hashedPassword = await bcrypt.hash(password, 10);

        const db = await mysql.createConnection(config);

        const updateQuery = 'UPDATE profile SET password = ? WHERE username = ?';
        const updateValues = [hashedPassword, username];

        // Log the query and values for debugging
        console.log('Update Query:', updateQuery);
        console.log('Update Values:', updateValues);

        // Update the 'profile' table using 'username' as the identifier
        await db.query(updateQuery, updateValues);

        console.log('Password updated successfully.');

        // Redirect the user to a login page
        res.redirect('/pulse/welcome');
    } catch (error) {
        console.error('Error setting up password:', error);
        res.render('pages/setup.ejs', { error: 'An error occurred while setting up your password' });
    }
}

async function getUserByUsername(username) {
    const db = await mysql.createConnection(config);

    try {
        const results = await db.query('SELECT * FROM profile WHERE username = ?', [username]);
        if (results.length === 0) {
            // User not found
            return null;
        }
        return results[0];
    } catch (error) {
        throw error;
    } finally {
        db.end();
    }
}

async function getUser(username) {
    const db = await mysql.createConnection(config);

    try {
        const results = await db.query('SELECT * FROM user WHERE name = ?', [username]);
        if (results.length === 0) {
            // User not found
            return null;
        }
        return results[0];
    } catch (error) {
        throw error;
    } finally {
        db.end();
    }
}

// The manager is created manually beforehand so encryption for the password is needed, I use update function that updated the database with encrypted password.
// I override the encrypted password manually for the manager in the insert.sql.
async function updatePasswords() {
    let db;

    try {
        // Create a database connection
        db = await mysql.createConnection(config);

        // Query all users with plaintext passwords
        const users = await db.query('SELECT profile_id, password FROM profile WHERE password IS NOT NULL');

        for (const user of users) {
            // Hash the user's password
            const hashedPassword = await bcrypt.hash(user.password, 10);

            // Update the user's password in the database with the hashed version
            await db.query('UPDATE profile SET password = ? WHERE profile_id = ?', [hashedPassword, user.profile_id]);
        }

        console.log('Password update completed successfully.');
    } catch (error) {
        console.error('Error updating passwords:', error);
    } finally {
        if (db) {
            db.end();
        }
    }
}

// Every user should have a uniq token when they get the link
//for the password creation via email.
function generateRandomToken(length) {
    const token = crypto.randomBytes(length).toString('hex');
    return token;
}

// Function to send the password setup email
async function sendPasswordSetupEmail(token, emailReceiver, nameUser) {
    try {
        if (emailReceiver) {
            const firstTransporter = nodemailer.createTransport({
                host: 'smtp-mail.outlook.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'setupAs2023@outlook.com',
                    pass: 'sommar123',
                },
                tls: {
                    ciphers: 'SSLv3',
                },
            });

            // Use EJS to render the email template
            const emailTemplate = await ejs.renderFile('views/pages/email.ejs', { nameUser, token, email: emailReceiver, username: nameUser });

            const firstMsg = {
                from: 'setupAs2023@outlook.com',
                to: emailReceiver,
                subject: 'Password Setup',
                html: emailTemplate,
            };
            
            try {
                const firstInfo = await firstTransporter.sendMail(firstMsg);
                console.log("Sent: " + firstInfo.response);
            } catch (firstError) {
                console.log("Error sending email to the first address:", firstError);

                // If sending to the first address fails, try sending to a second address
                const secondTransporter = nodemailer.createTransport({
                    host: 'smtp-mail.outlook.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'setupPass@outlook.com',
                        pass: 'sommar123',
                    },
                    tls: {
                        ciphers: 'SSLv3',
                    },
                });

                const secondMsg = {
                    from: 'setupPass@outlook.com',
                    to: emailReceiver,
                    subject: 'Password Setup',
                    html: emailTemplate,
                };

                try {
                    const secondInfo = await secondTransporter.sendMail(secondMsg);
                    console.log("Sent (fallback): " + secondInfo.response);
                } catch (secondError) {
                    console.log("Error sending email to the second address:", secondError);
                }
            }
        } else {
            console.log('Token not found or expired.');
        }
        console.log('After sending email');
    } catch (error) {
        console.error('Error sending password setup email:', error);
    }
}

// Function to create a user
async function createUser(name, birth_date, phone_number, email, role, address, username, password) {

    const db = await mysql.createConnection(config);

    try {
        // Begin a database transaction
        await db.beginTransaction();

        // Insert the user's information into the 'user' table
        const userSql = 'INSERT INTO user (name, birth_date, phone_number, email, role, address) VALUES (?, ?, ?, ?, ?, ?)';
        const userValues = [name, birth_date, phone_number, email, role, address];

        // Execute the SQL query to insert the user into the 'user' table
        const userResult = await db.query(userSql, userValues);

        // Get the generated employee_id for the user
        const employee_id = userResult.insertId;

        await db.commit();

        console.log('User creation completed successfully.');

        // Return the generated employee_id
        return employee_id;
    } catch (error) {
        // If an error occurred, roll back the transaction
        await db.rollback();

        console.error('Error creating user:', error);
        throw error;
    } finally {
        // Close the database connection
        db.end();
    }
}

// Function to create a profile
async function createProfile(employee_id, name, email, chosenPassword) {

    const db = await mysql.createConnection(config);
    const token = generateRandomToken(32);

    // Creating the username.
    const nameWords = name.split(' ');
    const firstName = nameWords[0];
    const secondName = nameWords.length > 1 ? nameWords[1] : '';
    const lastName = nameWords[nameWords.length - 1];

    // Extracting the first, second, and last letters.
    const firstLetter = firstName.charAt(0);
    const secondLetter = secondName.charAt(0);
    const lastLetter = lastName.charAt(lastName.length - 1);

    // Generating a random number between 1 and 999
    const randomNum = Math.floor(Math.random() * 999) + 1;

    const username = `${firstLetter}${secondLetter}${lastLetter}${randomNum}`;

    const profile_id = username;

    try {
        // Begin a database transaction
        await db.beginTransaction();

        // Insert the user's information into the 'profile' table
        const profileSql = 'INSERT INTO profile (profile_id, name, email, username, password, employee_id) VALUES (?, ?, ?, ?, ?, ?)';
        const profileValues = [profile_id, name, email, username, chosenPassword, employee_id];
        await db.query(profileSql, profileValues);

        // Insert the token into the 'user_tokens' table, associating it with the user
        const tokenSql = 'INSERT INTO user_tokens (token, user_id, email, expiration) VALUES (?, ?, ?, ?)';

        const expirationTimestamp = new Date();
        expirationTimestamp.setHours(expirationTimestamp.getHours() + 1);
        expirationTimestamp.setUTCHours(0, 0, 0, 0);
        const tokenValues = [token, employee_id, email, expirationTimestamp];
        await db.query(tokenSql, tokenValues);

        // Commit the transaction if everything was successful
        await db.commit();

        console.log('Profile creation completed successfully.');

        await sendPasswordSetupEmail(token, email, username);
        console.log('email: ', email, 'username: ', username);

    } catch (error) {
        // If an error occurred, roll back the transaction
        await db.rollback();

        console.error('Error creating profile:', error);
        throw error;
    } finally {
        // Close the database connection
        db.end();
    }
}

async function initializeLogin(req, res, username, password) {
    let db;

    try {
        // Create a database connection
        db = await mysql.createConnection(config);

        const errors = [];

        // Query the database to fetch the user data for the provided username
        const results = await db.query('SELECT * FROM profile WHERE username = ?', [username]);

        if (results.length === 0) {
            // User not found.
            errors.push('Invalid username or password. Please check your credentials!');
            return res.render('pages/welcome.ejs', { errors });
        }

        const user = results[0];

        // Compare the provided password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            // Passwords do not match
            errors.push('Invalid username or password. Please check your credentials!');
            return res.render('pages/welcome.ejs', { errors });
        }

        // Check for errors and render the welcome page with errors if necessary
        if (errors.length > 0) {
            return res.render('pages/welcome.ejs', { errors });
        }

        // Passwords match, the user is authenticated
        // Set up a session here to remember the user's login state
        req.session.user = user;

        console.log('User information:', req.session.user);

        // Redirect the user to a different page upon successful login
        if (req.session.user && req.session.user.username === 'usn1') {
            res.redirect('/logged');
        }
        else if (req.session.user && req.session.user.employee_id > 1) {
            res.redirect('/dashboard/team_member')
        }
        else {
            res.redirect('pulse/welcome');
        }

    } catch (error) {
        console.error('Login error: ' + error.message);
        const errors = ['Internal Server Error'];
        return res.status(500).render('pages/welcome.ejs', { errors });
    } finally {
        if (db) {
            db.end();
        }
    }
}

// Get the projects based on the user.
async function getProjectsForUser(employeeId) {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL project_user(?);`;
        const res = await db.query(sql, [employeeId]);
        console.info(`SQL: ${sql} got ${res.length} rows.`);
        console.log(res);
        return res[0];
    } finally {
        db.end();
    }
}

async function getMemberName(employeeId) {
    const db = await mysql.createConnection(config);

    try {
        const sql = 'SELECT name FROM user WHERE employee_id = ?';
        const res = await db.query(sql, [employeeId]);
        console.info(`SQL: ${sql} got ${res.length} rows.`);
        console.log(res);
        return res[0];
    } finally {
        db.end();
    }
}

// Function to create a report
async function createReport(project_id, submissionDate, reportContent) {
    const db = await mysql.createConnection(config);

    try {
        // Get the current date and time
        const currentDate = new Date();
        const submissionDateTime = new Date(submissionDate);

        // Initialize the status as 'Submitted on time'
        let status = 'Submitted on time';

        // Check if the report is late or early
        if (currentDate > submissionDateTime) {
            status = 'Late';
        } else if (currentDate < submissionDateTime) {
            status = 'Early';
        }

        // Perform the SQL update with the formatted date
        const updateSql = "UPDATE rapport SET content = ?, status = ?, submitted_at = ? WHERE submission_date = ? AND project_id = ?";
        const updateRes = await db.query(updateSql, [reportContent, status, currentDate, submissionDate, project_id]);

        console.info(`SQL (update): ${updateSql} updated ${updateRes.affectedRows} rows.`);
    } catch (error) {
        console.error("Error creating report:", error);
        throw error;
    } finally {
        db.end();
    }
}

// Show the due dates so that the user can select the due date.
async function getDueDatesForProject(projectId) {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL report_dates(?);`;
        const [results] = await db.query(sql, [projectId]);

        console.log("Result:", results);
        
        if (Array.isArray(results)) {
            const dueDates = results.map(result => result.submission_date);

            console.info(`SQL: ${sql} got ${dueDates.length} rows.`);
            console.log(dueDates);
            console.log(typeof results);
            return dueDates;
        } else {
            // Handle the case when no results are found, e.g., return an empty array or an error message
            console.error(`No results found for project ID: ${projectId}`);
            return [];
        }
    } finally {
        db.end();
    }
}

// Show some o the report info to the manager
async function getReportInfo() {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL report_info();`;
        const res = await db.query(sql, []);
        console.info(`SQL: ${sql} got ${res[0].length} rows.`);
        console.log(res[0]);
        return res[0];
    } catch (error) {
        console.error("Error fetching report info:", error);
        throw error;
    } finally {
        db.end();
    }
}

async function getReportDetails(user_name, date) {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL report_details(?, ?);`;
        const res = await db.query(sql, [date, user_name]);
        console.info(`SQL: ${sql} got ${res[0].length} rows.`);
        console.log(res[0]);

        // Structure the comments from the database response
        const reportDetails = res[0].map(row => ({
            rapport_id: row.rapport_id,
            content: row.content,
            status: row.status,
            comments: [] // Initialize an empty array for comments
        }));

        return reportDetails;
    } catch (error) {
        console.error("Error fetching report info:", error);
        throw error;
    } finally {
        db.end();
    }
}

// manager can submit the comments
async function updateReportComment(report_id, comment) {
    const db = await mysql.createConnection(config);

    try {
        const sql = "UPDATE rapport SET comments = ?, reviewed = 'Read' WHERE rapport_id = ?";
        await db.query(sql, [comment, report_id]);
    } catch (error) {
        console.error("Error updating report comment:", error);
        throw error;
    } finally {
        db.end();
    }
}

// Display the manager comment on the team member dashboard
async function getCommentsForProject(projectName, submissionDate, userName) {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL feedback_manager(?, ?, ?);`;
        const comments = await db.query(sql, [projectName, submissionDate, userName]);
        return comments[0];
    } catch (error) {
        console.error("Error fetching comments:", error);
        throw error;
    } finally {
        db.end();
    }
}

async function getCommentsForUser(userId) {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL feedback_user(?);`;
        const comments = await db.query(sql, [userId]);
        return comments[0];
    } catch (error) {
        console.error("Error fetching comments:", error);
        throw error;
    } finally {
        db.end();
    }
}


async function getReportComment(report_id) {
    const db = await mysql.createConnection(config);

    try {
        const sql = "CALL get_report_comment(?)";
        const result = await db.query(sql, [report_id]);
        return result[0][0].comments; // Get the comment from the result
    } catch (error) {
        console.error("Error fetching report comment:", error);
        throw error;
    } finally {
        db.end();
    }
}

// Get the 5 recent project a user is linked to
async function getRecentProjectsForUser(employeeId) {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL get_recent_projects_for_user(?);`;
        const [rows] = await db.query(sql, [employeeId]);
        return rows;
    } finally {
        db.end();
    }
}

// Get 5 recent feedback for a member.
async function getRecentFeedbackForUser(employeeId) {
    const db = await mysql.createConnection(config);

    try {
        const sql = `CALL get_recent_feedback_for_user(?);`;
        const [rows] = await db.query(sql, [employeeId]);
        return rows;
    } finally {
        db.end();
    }
}


async function isAuthenticated(req, res, next) {
    if (req.session.user) {
        console.log(`User ${req.session.user.username} is authenticated.`);
        return next();
    } else {
        console.log("User is not authenticated.");
        res.redirect("/pulse/welcome");
    }
}

// Middleware to check if the user is a manager
async function requireManager(req, res, next) {
    if (req.session.user && req.session.user.username === 'usn1') {
        return next(); // Allow access to the route
    } else {
        res.status(403).send('Access denied'); // Forbidden
    }
}

// Middleware to check if the user is a team member
async function requireTeamMember(req, res, next) {
    if (req.user && req.user.username != 'usn1') {
        return next(); // Allow access to the route
    } else {
        res.status(403).send('Access denied'); // Forbidden
    }
}

module.exports = {
    ShowContactInfo: ShowContactInfo,
    updatePasswords: updatePasswords,
    createUser: createUser,
    initializeLogin: initializeLogin,
    isAuthenticated: isAuthenticated,
    createProfile: createProfile,
    closeDatabaseConnection: closeDatabaseConnection,
    AllMembers: AllMembers,
    count_members: count_members,
    sendPasswordSetupEmail: sendPasswordSetupEmail,
    AllTeams: AllTeams,
    insertTeamWithEmployees: insertTeamWithEmployees,
    setupPassword: setupPassword,
    AllProjects: AllProjects,
    createProject: createProject,
    count_projects: count_projects,
    projects_info: projects_info,
    project_name: project_name,
    deleteProject: deleteProject,
    updateProject: updateProject,
    requireManager: requireManager,
    requireTeamMember: requireTeamMember,
    getUserByUsername: getUserByUsername,
    membersNames: membersNames,
    RecentMembers: RecentMembers,
    getProjectsForUser: getProjectsForUser,
    getMemberName: getMemberName,
    createReport: createReport,
    getDueDatesForProject: getDueDatesForProject,
    getReportInfo: getReportInfo,
    getReportDetails: getReportDetails,
    updateReportComment: updateReportComment,
    getCommentsForProject: getCommentsForProject,
    getUser: getUser,
    getReportComment: getReportComment,
    count_report_unread: count_report_unread,
    countProjectsForMember: countProjectsForMember,
    countDraftReportsForUser: countDraftReportsForUser,
    countCommentsForUser: countCommentsForUser,
    getRecentProjectsForUser: getRecentProjectsForUser,
    getRecentFeedbackForUser: getRecentFeedbackForUser,
    getCommentsForUser: getCommentsForUser
};