# E-Commerce Management System

A full-stack e-commerce management system built with ASP.NET Core Web API, SQL Server, Entity Framework Core, React, and TypeScript.

## 🚀 Technologies

### Backend
- C#
- ASP.NET Core Web API
- .NET 10
- Entity Framework Core
- SQL Server
- JWT Authentication
- BCrypt Password Hashing
- Swagger / OpenAPI

### Frontend
- React
- TypeScript
- JavaScript
- HTML5
- CSS3

### Development & Testing
- Git
- GitHub
- Unit Testing
- Docker

## ✨ Features

- User Registration and Login
- JWT Authentication
- Role-based Authorization
- Product Management
- Category Management
- Customer Management
- Order Management
- CRUD Operations
- SQL Server Database
- Entity Framework Core Migrations
- Swagger API Documentation

## 🔐 Authentication

The API uses JWT Bearer Authentication.

Users can register and login through the authentication endpoints and use the generated JWT token to access protected endpoints.

## 📦 API Endpoints

### Authentication
- `POST /api/Auth/register`
- `POST /api/Auth/login`

### Products
- `GET /api/Products`
- `POST /api/Products`
- `PUT /api/Products/{id}`
- `DELETE /api/Products/{id}`

### Categories
- `GET /api/Categories`
- `POST /api/Categories`
- `PUT /api/Categories/{id}`
- `DELETE /api/Categories/{id}`

### Customers
- `GET /api/Customers`
- `POST /api/Customers`
- `PUT /api/Customers/{id}`
- `DELETE /api/Customers/{id}`

### Orders
- `GET /api/Orders`
- `POST /api/Orders`
- `PUT /api/Orders/{id}`
- `DELETE /api/Orders/{id}`

## 🗄️ Database

The application uses SQL Server with Entity Framework Core.

Database migrations are included in the project.

## 📚 API Documentation

Swagger UI is available during development:

`http://localhost:5112/swagger`

## 🧪 Testing

Unit tests are included to verify application functionality and business logic.

## 🐳 Docker

Docker support is planned for containerized deployment of the application.

## 📌 Project Status

Backend API and database functionality are implemented.

Frontend development and additional features are planned as the project progresses.

## 👩‍💻 Author

Maryam Afzalkar