# Pulse project

## OVERVIEW
Pulse project provides a management and reporting system where a manager and a member can work in organized and structured way. Pulse project is a web application for creating projects and sending reports to the manger, a manager and a member is connected to review and sending feedback.

## App functions

 - User registration interface and log in.
    - Manager dashboard which has the following:
      - Register one/multiple members.
      - Creating teams that contains one/multiple members.
      - Creating projects and assign the projects to the team.
      - Reviewing the reports and adding a comment.
      
 - User interface and login.
    - Member dashboard which has the following:
       - Reviewing the projects each member is assigned to.
       - Reviewing the due dates for reports based on the project.
       - Creating a report to a specific due date and submit it.
       - Reviewing the feedback from the manager.
      
  - Security part:
      - Manager and users passwords are encrypted.
      - Authorization and authentication is set for both users and manager.
      - Tokens are used for the setting password.
      - Sessions are used to track user interactions and maintain their authentication state throughout their use of the application. This helps prevent unauthorized access to sensitive features and data.
  
  - Uploading a CSV-file:
    - You must to upload a CSV-file to register members.
    - Recommendation create an excel file for the CSV-file.
    - Upload the file with this format in the first row have this data
name	birth_date	phone_number	email	role	address
    - Then fill the other rows with the members data.
    - An overview of how the file should looks like with a member as an example:
name|birth_date|phone_number|email|role|address
John Doe|19901210|071234567|johdoe648@exampel.com|Team Member|123 Main St

  ##  Installtions and setup.
   This web application was created using:
   MySQL, Node js, HTML and CSS.

   Note: You can use a terminal of your choice, but I will recommend you Ubuntu. If you do not have it installed and you want to use it please install Ubuntu follow the documentation
https://ubuntu.com/tutorials/install-ubuntu-desktop#1-overview
    
  1 - In the documentation of Mysql, we choose the appropriate operating system and follow the documentation  https://dev.mysql.com/doc/refman/8.0/en/installing.html

     In Linux we use the following commands:
     * Note in the installation you will choose a password for the root user( remember the password as we will need it to log in to the database in the terminal ).

     - sudo apt-get install mysql-server
     - sudo service mysql start
     - sudo mysql_secure_installation
     - We can check the status of the server by (sudo service mysql status)
     - Now the server is working and we can log in to the database by typing (sudo mysql -uroot -p) and entering the root password.

 2- We need to install Node js https://nodejs.org/en/download/.

 3-  Setup the needed node modules for the project.
   - In Terminal we locate us in the path of the project folder $ /pulse_project
   - I have already written the needed modules in package.json file, therefore just type( sudo apt install npm ) then ( npm install ).

 4- Setup our database:
  - In Terminal we locate us in the path of the project folder $ /pulse_project/sql
  - Log into the database by using (mysql -uroot -p) or for Linux (sudo mysql -uroot -p) and entering the root password(which you have chosen in the MySQL installation).
     - Create our database and new user of the database by typing ( source setup.sql ).
     - Create our tables in the database by typing ( source reset.sql ).
     - Type Exit.
     
 5- Running the app:
   - In the terminal, we locate us in the path of the project folder $ /pulse_project.
       - Type the following command: nodemon start or node index.js.
         - This will start the app in the address( http://localhost:1337 ).

To access Admin dashboard use the following:
```
Username: usn1
Password: sommar123

```

# About
This web application was developed as an individual project course 
in the Software Engineering program at BTH university in 2023.

The webb application fulfill the customer requirements and it was created for this intention.

Please if you have any question or if you are not able to install or run the application contact me at sarakayy9@gmail.com.


# Project developed by
Sara Kayyal
Software Engineering student