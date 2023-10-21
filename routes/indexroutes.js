"Use strict";

const express = require("express");
const router = express.Router();
const pulse = require("./../src/pulse.js");
const fs = require("fs");
const csvParser = require("csv-parser");
const nodemailer = require("nodemailer");

// Router for the public page.
router.get("/pulse/welcome", (req, res) => {
    let data = {};

    data.title = "Welcome";

    console.log(req.session);
    res.render("pages/welcome.ejs", data);
});

router.get("/pulse/contact", async (req, res) => {
    let data = {};

    data.title = "Contact";
    data.all = await pulse.ShowContactInfo();

    res.render("pages/contact.ejs", data)
});

router.get("/pulse/service", (req, res) => {
    console.log("Service route accessed.");
    let data = {};

    data.title = "Service";

    res.render("pages/service.ejs", data);
});

router.get("/pulse/about", (req, res) => {
    console.log("About route accessed.");
    let data = {};

    data.title = "About";

    res.render("pages/about.ejs", data);
});

// Role-based pages where Authentication is used.
router.get("/logged", pulse.isAuthenticated, pulse.requireManager, async (req, res) => {
    console.log("Logged route accessed.");

    try {
        // Call the AllMembers function to retrieve member data
        const members = await pulse.RecentMembers();
        const memberCount = await pulse.count_members();
        const projectCount = await pulse.count_projects();
        const projectData = await pulse.projects_info();
        const reportCount = await pulse.count_report_unread();
        console.log('Project Count:', projectCount);
        console.log('Report Count', reportCount);

        // Render the dashboard.ejs template with the members data
        res.render("pages/dashboard.ejs", {
            title: "Logged",
            members: members,
            memberCount: memberCount,
            projectCount: projectCount,
            projects: projectData,
            reportCount: reportCount
        });
    } catch (error) {
        console.error('Error fetching members data: ' + error.message);
        res.status(500).send('Internal Server Error');
    }
});

router.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Call the initializeLogin function from your pulse module
    pulse.initializeLogin(req, res, username, password);
});


router.get("/pulse/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        console.log('Logged out succeed')
        res.redirect("/pulse/welcome");
    });
});

router.get("/register/members", pulse.isAuthenticated, pulse.requireManager, (req, res) => {
    console.log("Register members succeed.");
    let data = {};

    data.title = "Register members";

    res.render("pages/register.ejs", data);
});

// //check if i use this
router.get("/register/succeed", (req, res) => {
    console.log("Member is registered");
    let data = {};

    data.title = "Member is registered";

    res.render("pages/registerSuccess.ejs", data);
});

// Route for handling CSV file upload
router.post("/register/members", pulse.isAuthenticated, pulse.requireManager, async (req, res) => {
    const results = [];
    let registrationError = null;
    let data = {}; // Define the data variable

    // Check if a file was uploaded
    if (!req.files || !req.files.csvFile) {
        return res.status(400).send("No file uploaded.");
    }

    const csvFile = req.files.csvFile.data;

    // Parse the CSV data
    csvParser()
        .on("data", (row) => {
            // Process each row of CSV data
            results.push(row);
        })
        .on("end", async () => {
            console.log("CSV data parsed:", results);

            // Iterate through the parsed CSV data and insert each user into the database
            for (const userData of results) {
                const { name, birth_date, phone_number, email, role, address, username, password } = userData;

                // Check if a user with the same name already exists in the database
                const existingUser = await pulse.getUser(name);

                if (existingUser) {
                    console.error("User with the same name already exists:", name);
                    registrationError = `User with name '${name}' already exists.`;
                } else {
                    try {
                        // Insert the user into the database
                        const employee_id = await pulse.createUser(name, birth_date, phone_number, email, role, address, username, password);

                        // Use the generated employee_id to create the profile
                        await pulse.createProfile(employee_id, name, email, password);
                    } catch (error) {
                        console.error("Error inserting user:", error);
                    }
                }
            }

            await pulse.closeDatabaseConnection();

            if (registrationError) {
                data.errorMessage = registrationError;
                return res.render("pages/register.ejs", data);
            }

            console.log("Register is finished!");
            res.redirect("/members");
        })
        .end(csvFile);
});


// Page that will be in a link, send to the user to create a password.
router.get('/register/setup-password', (req, res) => {
    const username = req.query.username;
    console.log("Username: ", username);
    res.render("pages/setup.ejs", { username });
});

router.post('/register/setup-password', async (req, res) => {
    const { username, password, confirmPassword } = req.body;
    console.log(req.body);

    try {
        // Check if the user already exists with a non-null password
        const profile = await pulse.getUserByUsername(username);

        if (profile && profile.password !== null) {
            // If a user already has a password redirect.
            console.log("Password can not be set agin.");
            return res.redirect('/password-already-set');
        }

        await pulse.setupPassword(req, res, username, password, confirmPassword);
    } catch (error) {
        console.error('Error setting up password:', error);
        res.render('pages/setup.ejs', { error: 'An error occurred while setting up your password' });
    }
});

router.get('/password-already-set', (req, res) => {
    res.render("pages/passwordComplete.ejs");
});

router.get("/teams", pulse.isAuthenticated, pulse.requireManager, async (req, res) => {
    console.log("Teams route accessed.");

    const member = await pulse.AllTeams();

    res.render("pages/teams.ejs", { all: member });
});


router.get("/create/team", pulse.isAuthenticated, pulse.requireManager, async (req, res) => {
    try {
        const nonManagerMembers = await pulse.membersNames();
        const data = {
            title: "Create a Team",
            members: nonManagerMembers
        };
        res.render("pages/createTeam.ejs", data);
    } catch (error) {
        console.error("Error getting non-manager members: ", error);
        res.redirect("/teams");
    }
});

router.post("/create/team", pulse.isAuthenticated, pulse.requireManager, async (req, res) => {
    const { team_name, selected_members_str } = req.body;
    const selectedMembers = selected_members_str.split(',');
    console.log('Selected Members:', selected_members_str);

    try {
        await pulse.insertTeamWithEmployees(team_name, selectedMembers);

        // Redirect back to the Teams page or an appropriate page upon successful team creation.
        res.redirect("/teams");
    } catch (error) {
        console.error("Error creating the team: ", error);
        res.redirect("/error");
    }
});

router.get("/members", pulse.isAuthenticated, pulse.requireManager, async (req, res) => {
    console.log("Members route accessed.");

    const member = await pulse.AllMembers();

    res.render("pages/members.ejs", { all: member });
});

router.get("/projects", pulse.isAuthenticated, pulse.requireManager, async (req, res) => {
    console.log("Projects route accessed.");

    const projects = await pulse.AllProjects();

    res.render("pages/projects.ejs", { all: projects });
})

// The manager should be able to create projects and link them to members.
router.get("/create/project", pulse.isAuthenticated, pulse.requireManager, async (req, res) => {
    console.log("Projects route accessed.");

    const existingTeams = await pulse.AllTeams();
    res.render("pages/projectCreate.ejs", { existingTeams });
})

router.post("/create/project", async (req, res) => {
    // Extract project data from the form submission
    const { name, start_date, end_date, reporting_freq, reporting_date, status, description, team_id } = req.body;

    await pulse.createProject(name, start_date, end_date, reporting_freq, reporting_date, status, description, team_id);

    res.redirect("/projects");
});

router.get("/projects/delete/:name", pulse.isAuthenticated, pulse.requireManager, async (req, res) => {
    let data = {};

    data.title = "Delete a project";
    data.one = await pulse.project_name(req.params.name);
    console.log(data.one);
    res.render("pages/delete.ejs", { data: data });
})

router.post("/projects/delete", async (req, res) => {
    const projectName = req.body.name;
    await pulse.deleteProject(projectName);
    res.redirect("/projects");
});

router.get("/projects/update/:name", pulse.isAuthenticated, pulse.requireManager, async (req, res) => {
    let data = {};

    data.title = "Update a project";
    data.one = await pulse.project_name(req.params.name);
    console.log(data.one);
    res.render("pages/update.ejs", { data: data });
});

router.post("/projects/update", async (req, res) => {
    const projectName = req.body.name;
    const newReportingDate = req.body.new_reporting_date;

    await pulse.updateProject(projectName, newReportingDate);
    res.redirect("/projects");
});

// Show all the reports to the manager.
router.get("/submitted/reports", pulse.isAuthenticated, pulse.requireManager, async (re, res) => {
    console.log("All submitted report route");

    const reportInfo = await pulse.getReportInfo();
    res.render("pages/reportInfo.ejs", {all: reportInfo});
})


router.get("/dashboard/team_member", pulse.isAuthenticated, async (req, res) => {
    const { employee_id, profile_id } = req.session.user;
    console.log("Team member route accessed for employee_id:", employee_id);

    try {
        const memberName = await pulse.getMemberName(employee_id);
        const projectCount = await pulse.countProjectsForMember(employee_id);
        const countReport = await pulse.countDraftReportsForUser(employee_id);
        const feedback = await pulse.countCommentsForUser(employee_id);
        const recentProjects = await pulse.getRecentProjectsForUser(employee_id);
        const recentFeedback = await pulse.getRecentFeedbackForUser(employee_id);
        console.log("MemberName: ", memberName);

        // Check if memberName is not undefined
        if (memberName === undefined) {
            memberName = ""; // Set a default value
        }

        res.render("pages/memberDashboard.ejs", { employee_id, profile_id, memberName, projectCount, countReport, feedback,
            recentProjects, recentFeedback });
    } catch (error) {
        console.error("Error retrieving member name:", error);
        res.status(500).send("Error retrieving member name");
    }
});

router.get("/Your/projects", pulse.isAuthenticated, async (req, res) => {
    const { employee_id } = req.session.user; // Retrieve employee_id from the session
    console.log("Team member Projects route accessed for employee_id:", employee_id);

    try {
        const projects = await pulse.getProjectsForUser(employee_id);
        const memberName = await pulse.getMemberName(employee_id);
        console.log("Projects retrieved:", projects);
        res.render("pages/yourProjects.ejs", { projects, memberName });
    } catch (error) {
        console.error("Error retrieving projects:", error);
        res.status(500).send("Error retrieving projects");
    }
})

router.get("/due/report", pulse.isAuthenticated, async (req, res) => {
    if (req.session && req.session.user) {
        const { employee_id } = req.session.user; // Retrieve employee_id from the session
        console.log("Team member due report accessed for employee_id:", employee_id);

        try {
            const projects = await pulse.getProjectsForUser(employee_id);
            const memberName = await pulse.getMemberName(employee_id);
            console.log("Projects retrieved:", projects);
            res.render("pages/submission.ejs", { projects, memberName });
        } catch (error) {
            console.error("Error retrieving projects:", error);
            res.status(500).send("Error retrieving projects");
        }
    } else {
        // Handle the case when req.session.user is not available
        res.redirect("/login"); // Redirect to the login page or another appropriate action
    }
});

router.get("/write/report",  pulse.isAuthenticated, async (req, res) => {
    const { employee_id } = req.session.user;
    const project_id = req.query.project_id;
    console.log("Write report route is accessed for project_id:", project_id);

    try {
        const dueDates = await pulse.getDueDatesForProject(project_id);
        console.log("Due Dates:", dueDates);
        res.render("pages/writeReport.ejs", { employee_id, dueDates, project_id });
    } catch (error) {
        console.error("Error fetching due dates:", error);
        res.status(500).send("Error fetching due dates");
    }
});


// Team member
router.post("/write/report",  pulse.isAuthenticated, async (req, res) => {
    const { employee_id } = req.session.user;
    const project_id = req.body.project_id;
    const { submissionDate, reportContent } = req.body;

    console.log("Project id:", project_id);
    console.log("Submission Date:", submissionDate);
    console.log("Report Content:", reportContent);
    try {
        // Save the new report to the database
        await pulse.createReport(project_id, submissionDate, reportContent);
        
        console.log("project Id, submission date, content: ", project_id, submissionDate, reportContent)

        // res.render("pages/debug", { project_id, submissionDate, reportContent });
        res.redirect("/Your/projects");
    } catch (error) {
        console.error("Error creating report:", error);
        res.status(500).send("Error creating report");
    }
});

router.get("/review/report", pulse.isAuthenticated, async (req, res) => {
    const { user, date } = req.query;
    console.log("Review report route!");
    console.log("User, date: ", user, date);

    const reportDetails = await pulse.getReportDetails(user, date);
    res.render("pages/reviewReport.ejs", {all: reportDetails});
});

router.post("/review/report", pulse.isAuthenticated, async (req, res) => {
    try {
        // Access the report_id and comment directly from req.body
        const report_id = req.body.report_id;
        const comment = req.body.comment;

        console.log("Report ID:", report_id);
        console.log("Comment:", comment);

        const existingComment = await pulse.getReportComment(report_id);
        console.log(existingComment);

        if (existingComment) {
            // A comment already exists, set the error message
            const error = "You are not allowed to write another comment for this report.";
            res.render("pages/error.ejs", { error });
        } else {
            // Update the comment
            await pulse.updateReportComment(report_id, comment);
            res.redirect("/submitted/reports");
        }
    } catch (error) {
        console.error("Error submitting review:", error);
        // Handle the error and redirect to an error page or an appropriate route.
        res.redirect("/error");
    }
});

router.get("/feedback", pulse.isAuthenticated, async (req, res) => {
    const { employee_id } = req.session.user;
    const userName = req.query.user_name;

    // Query the database to get all feedback for the specified user
    const comments = await pulse.getCommentsForUser(employee_id);
    
    // Pass the comments to the template for rendering
    res.render("pages/comments.ejs", { all: comments, userName });
});


module.exports = router;