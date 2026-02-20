# Alumni Connect Platform

The Alumni Connect Platform is a dynamic full-stack web application designed to bridge the gap between college students and alumni. It facilitates networking, mentorship, and career opportunities through a suite of features including job referrals, skill-based quizzes, real-time chat, and a robust user management system.

## Key Features

* **User Management:** Role-based authentication (Student, Alumni, Admin) with email-based OTP verification for students and admin approval for alumni.
* **Job Referrals:** Alumni can post job opportunities, and students receive personalized alerts for jobs that match their skills.
* **Skill-Based Quizzes:** Students can attempt quizzes linked to job referrals to validate their skills and stand out to recruiters.
* **Real-time Chat:** A secure, one-on-one real-time chat system for established connections (alumni and students).
* **Admin Panel:** A comprehensive dashboard for administrators to manage user approvals, monitor platform analytics, and view recent activities.
* **Profile Management:** Users can manage their personal details, social links, resume, and profile pictures.

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

* Java 17 or higher
* Maven 3.8.1 or higher
* Node.js 18 or higher
* MongoDB Atlas or a local MongoDB instance
* Cloudinary Account (for file uploads)
* Gmail Account with an App Password (for email notifications)

### 1. Backend Setup (Spring Boot)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/shannu4466/alumni-connect
    cd alumni-connect/backend
    ```

2.  **Configure `application.properties`:**
    Create a file named `application.properties` in `src/main/resources/` and add your configuration details.
    ```properties
    # MongoDB Configuration
    spring.data.mongodb.uri=mongodb://[your_mongodb_uri]

    # Cloudinary Configuration
    cloudinary.cloud-name=[your_cloudinary_cloud_name]
    cloudinary.api-key=[your_cloudinary_api_key]
    cloudinary.api-secret=[your_cloudinary_api_secret]

    # JWT Configuration
    jwt.secret=[your_jwt_secret_key]
    jwt.expiration=86400000

    # Email Service Configuration (Gmail)
    spring.mail.host=smtp.gmail.com
    spring.mail.port=587
    spring.mail.username=[your_gmail_address]
    spring.mail.password=[your_gmail_app_password]
    spring.mail.properties.mail.smtp.auth=true
    spring.mail.properties.mail.smtp.starttls.enable=true
    spring.mail.test-connection=false
    ```

3.  **Build and Run the Backend:**
    Use Maven to build and run the application.
    ```bash
    mvn clean install or mvn clean compile
    mvn spring-boot:run
    ```
    The backend will start on `http://localhost:8080`.

### 2. Frontend Setup (React)

1.  **Navigate to the frontend directory and install dependencies:**
    ```bash
    cd ../frontend
    npm install
    npm install framer-motion recharts
    ```

2.  **Configure environment variables:**
    Create a `.env` file in the root of the frontend directory.
    ```
    VITE_API_URL=http://localhost:8081
    ```

3.  **Run the Frontend:**
    ```bash
    npm run dev
    ```
    The application will start on `http://localhost:8081` (or another port if configured).

### 3. Usage

* Navigate to the registration page to create a new account.
* For student accounts, use a unique email and roll number (e.g., `22A81A0561@sves.org.in`).
* Verify your email with the OTP sent to your inbox.
* Alumni accounts will require admin approval before they can log in.
* Log in to access your dashboard and the full range of features.
