# GitHub Parser

A modern web application for analyzing and visualizing GitHub repository data.

## Overview

GitHub Parser is a tool that helps developers and teams gain insights from GitHub repositories through advanced parsing and analysis features.

## Features

- Summarize GitHub repositories into resume ready points
- Update dependencies directly with auto PR creation

More features coming soon!

## Tech Stack

- Frontend: React.js with Tailwind CSS
- Backend: Django REST Framework
- API: GitHub REST API

## Setup and Installation

### Backend Setup

1. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install Python dependencies:

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Fill in your environment variables

4. Run migrations and start the Django server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

### Frontend Setup

1. Install Node.js dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

## Development

- Frontend runs on http://localhost:3000
- Backend API runs on http://localhost:8000
- Uses Tailwind CSS for styling

## API Documentation

- Interactive API documentation available at:
  - Swagger UI: http://localhost:8000/swagger/
  - Redoc: http://localhost:8000/redoc/

## API Endpoints

- `/api/v1/repositories/` - GitHub repository analysis
- `/api/v1/auth/` - Authentication endpoints
- Full API documentation available in the Django REST Framework browsable API

## Contributing

1. Fork the repository
2. Create your feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add some amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
