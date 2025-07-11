# Financial Analytics Dashboard Backend

This is the backend API for the Financial Analytics Dashboard application. It provides authentication and data services for the frontend application.

## Technologies Used

- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing
- express-validator for request validation

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root of the backend directory with the following variables:
   ```
   # Server configuration
   PORT=3000

   # Database configuration
   MONGODB_URI=<your_mongodb_url_here>

   # JWT configuration
   # The application will automatically generate a secure JWT secret if this default value is used
   JWT_SECRET=your_jwt_secret_key_here

   # JWT token expiration time (examples: 60, "2 days", "10h", "7d")
   JWT_EXPIRES_IN=1d
   ```
   > **NOTE**: Make sure that mongodb url points to the correct database containing collections transactions and users.
   > **NOTE**: You don't need to manually generate a JWT secret. The application will automatically generate a secure random secret and update the .env file if the default value is used. See the [JWT Security](#jwt-security) section for more details.
5. Start the development server:
   ```
   npm run dev
   ```

## API Documentation

### Authentication Endpoints

#### Register a new user

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "example",
    "password": "password123"
  }
  ```
- **Success Response**:
  - **Code**: 201 Created
  - **Content**:
    ```json
    {
      "message": "User registered successfully",
      "user": {
        "id": "user_id",
        "username": "example",
        "createdAt": "timestamp"
      },
      "token": "jwt_token"
    }
    ```
- **Error Response**:
  - **Code**: 400 Bad Request
  - **Content**:
    ```json
    {
      "errors": [
        {
          "msg": "Username is required",
          "param": "username",
          "location": "body"
        }
      ]
    }
    ```
  OR
  - **Code**: 400 Bad Request
  - **Content**:
    ```json
    {
      "message": "User already exists with that username"
    }
    ```

#### Login

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "username",
    "password": "password123"
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "message": "Login successful",
      "user": {
        "id": "user_id",
        "username": "example",
        "createdAt": "timestamp"
      },
      "token": "jwt_token"
    }
    ```
- **Error Response**:
  - **Code**: 401 Unauthorized
  - **Content**:
    ```json
    {
      "message": "Invalid credentials"
    }
    ```

#### Get Current User

- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Headers**:
  - `Authorization`: `Bearer jwt_token`
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "user": {
        "_id": "user_id",
        "username": "example",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      }
    }
    ```
- **Error Response**:
  - **Code**: 401 Unauthorized
  - **Content**:
    ```json
    {
      "message": "No token provided, authorization denied"
    }
    ```
  OR
  - **Code**: 401 Unauthorized
  - **Content**:
    ```json
    {
      "message": "Token is not valid"
    }
    ```

### Transaction Endpoints

#### Get All Transactions

- **URL**: `/api/transactions/get-transactions`
- **Method**: `GET`
- **Headers**:
  - `Authorization`: `Bearer jwt_token`
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    [
      {
        "_id": "transaction_id",
        "user": "user_id",
        "amount": 100.5,
        "type": "income",
        "category": "Salary",
        "date": "2024-06-28T00:00:00.000Z",
        "description": "June Salary"
      }
    ]
    ```

#### Generate Transaction Report (PDF)

- **URL**: `/api/transactions/get-report`
- **Method**: `POST`
- **Headers**:
  - `Authorization`: `Bearer jwt_token`
- **Request Body**:
  ```json
  {
    "columns": ["date", "amount", "category", "type"],
    "filters": {
      "type": "income"
    }
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: PDF file (Content-Type: application/pdf)

> **Note:**
> - There are no endpoints for creating, updating, or deleting transactions in the current backend implementation.
> - There is no analytics/summary endpoint in the current backend implementation.

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # Express routes
|   |── utils/
│   └── index.ts        # Entry point
├── .env                # Environment variables
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Authentication Flow

1. User registers with username, email, and password
2. Password is hashed using bcrypt before saving to the database
3. Upon successful registration or login, a JWT token is generated and returned
4. For protected routes, the client must include the JWT token in the Authorization header
5. The auth middleware verifies the token and attaches the user to the request object

## JWT Security

### JWT Secret Management

The JWT secret is a critical security component used to sign and verify JSON Web Tokens. Proper management of this secret is essential for maintaining the security of your application.

#### Best Practices

1. **Use a Strong Secret**: The JWT secret should be a long, random string (at least 32 characters) to prevent brute force attacks.

2. **Keep it Private**: Never commit your JWT secret to version control or share it publicly.

3. **Rotate Periodically**: In production environments, consider rotating your JWT secret periodically.

4. **Environment-Specific Secrets**: Use different JWT secrets for development, testing, and production environments.

#### Generating a Secure JWT Secret

You can generate a secure random string for your JWT secret using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Security Measures in This Application

This application implements several security measures for JWT secret management:

1. **Automatic Secret Generation**: The application automatically generates a secure random JWT secret and updates the .env file if the default value is used.

2. **Validation**: The application validates that the JWT secret is strong enough (at least 32 characters).

3. **Warning Logs**: The application logs warnings if:
   - The JWT secret is too short
   - When a new secret is generated and saved to the .env file

4. **Documentation**: Clear documentation is provided in both the code and README to guide proper JWT secret management.
