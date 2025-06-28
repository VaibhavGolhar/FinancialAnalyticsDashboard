# Financial Analytics Dashboard - FinSight

A full-stack web application for analyzing and visualizing financial transactions. This project includes a secure backend API and a responsive frontend dashboard.

## 📦 Repository Structure

This monorepo contains two main components:
```
.
├── backend/     # REST API built with Node.js, Express, TypeScript, MongoDB
├── frontend/    # Frontend built with React, TypeScript, and Vite
```
- **`backend/`**: Manages user authentication using JWT, serves financial transaction data, and supports CSV report generation.
- **`frontend/`**: Offers a user-friendly interface to login, view financial analytics, and download reports.

>**NOTE**: Each subdirectory contains its own `README.md` file with setup instructions, tech stack, and detailed usage.

---

## Features
- User authentication with JWT
- View categorized transactions and charts
- Download reports in CSV format
- Secure password hashing and input validation
- Modular backend and frontend setup with TypeScript

## Learn More
- Backend Docs: backend/README.md
- Frontend Docs: frontend/README.md
