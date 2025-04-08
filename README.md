
# SentinelSync

The design for Sentinel Sync will allow healthcare professionals such as doctors, nurses, and pharmacists to log into the Sentinel Sync reporting system, create an anonymous report about a sentinel event, track the status of previous reports, and receive alerts and notifications about earlier reports. The reports will then be used to identify trends, provide training and education for staff, and mitigate the risk of similar sentinel events occurring in the future. 


## Features

- User registration and login
- Role-based form input (Nurse, Physician, Pharmacist, Other)
- Event type dropdown and freetext option for "Other"
- Data storage using SQLite
- Confirmation page for successful transmissions
- Admin-only dashboard to view reports to enhance anonymity
- Chart.js integration for visualizations
- Utilizes Bootstrap for responsive UI design

## Technologies Used

- Node.js
- Express
- SQLite3
- EJS
- Bootstrap 5
- Chart.js (for dashboard visualization)

