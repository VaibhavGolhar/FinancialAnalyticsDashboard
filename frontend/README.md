# Financial Analytics Dashboard Frontend

This is the frontend for the Financial Analytics Dashboard application. 

## Technologies Used

- React with Vite
- TypeScript
- HTML and CSS

## Getting Started
#### Prerequisites

- Node.js (v14 or higher)
- Backend server running on port 3000 (default)

### Frontend Setup

1. Navigate to the frontend directory
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root of the frontend directory with the following variable:
   ```
   VITE_API_BASE_URL=http://localhost:<port_number_backend_is_running_on>
   ```
> **NOTE**: Ensure this URL matches the port your backend is running on. By default, it's set to `3000`.

4. Start the frontend development server:
   ```
   npm run dev
   ```
5. Open your browser and visit:
   ```
   http://localhost:5173
   ```
   
