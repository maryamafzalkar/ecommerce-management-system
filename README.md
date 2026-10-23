# E-Commerce Management System

A full-stack e-commerce application with separate customer and administrator experiences. Customers can browse products, manage a cart, place orders, and review their order history. Administrators can manage products and review orders.

## Live application

- **Frontend:** [ecommerce-management-system-frontend.onrender.com](https://ecommerce-management-system-frontend.onrender.com)
- **Backend API:** [ecommerce-management-system-2-gzzl.onrender.com](https://ecommerce-management-system-2-gzzl.onrender.com)
- **Source code:** [github.com/maryamafzalkar/ecommerce-management-system](https://github.com/maryamafzalkar/ecommerce-management-system)

The frontend and API are hosted on Render. The PostgreSQL database is hosted on Neon. Render free services may take a short time to wake after inactivity.

## Features

### Customers

- Register and sign in using JWT-based authentication.
- Browse, search, and sort products by name or price.
- Add products to a personal shopping cart.
- Change cart quantities or remove items.
- Place orders and view order history with expandable order details.
- Browse paginated order lists.

### Administrators

- Use a role-specific administration experience.
- Create, edit, and delete products.
- Review customer orders and their items.
- Advance an order through its supported statuses.
- Browse paginated order lists.

### Reliability and security

- API authorization separates administrator and customer operations.
- Cart operations validate quantities and available stock.
- Cart updates use database transactions to help protect concurrent changes.
- User-specific cart and order access is enforced by the API.
- Configuration secrets are supplied through environment variables and must not be committed to source control.

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, Axios, lucide-react |
| Backend | ASP.NET Core Web API (.NET 10), Entity Framework Core, Npgsql |
| Database | PostgreSQL (Neon) |
| Authentication | JWT bearer tokens and role-based authorization |
| Deployment | Render |

## Repository structure

```text
.
├── ecommerce.api/    # ASP.NET Core Web API
└── frontend/         # React + TypeScript application
```

## Run locally

### Prerequisites

- .NET 10 SDK
- Node.js and npm
- A PostgreSQL database (or access to the configured Neon database)

### 1. Configure the backend

From the repository root, set the backend configuration values in your local environment or .NET user secrets. Do not put real credentials in a committed `appsettings.json` file.

The application reads these environment-variable keys in Render:

- `ConnectionStrings__DefaultConnection`
- `Jwt__Key`
- `AdminSeed__Username`
- `AdminSeed__Password`

`ConnectionStrings__DefaultConnection` must be an Npgsql connection string, for example:

```text
Host=<host>;Port=5432;Database=<database>;Username=<username>;Password=<password>;SSL Mode=Require
```

Use your own database values. Keep passwords and signing keys private.

In PowerShell, environment variables can be set for the current terminal session like this (replace each placeholder locally):

```powershell
$env:ConnectionStrings__DefaultConnection = "Host=<host>;Port=5432;Database=<database>;Username=<username>;Password=<password>;SSL Mode=Require"
$env:Jwt__Key = "<a-long-random-secret>"
$env:AdminSeed__Username = "<admin-username>"
$env:AdminSeed__Password = "<strong-admin-password>"
```

Then restore and run the API:

```powershell
cd ecommerce.api
dotnet restore
dotnet run
```

Use the local API address printed by `dotnet run` when configuring the frontend.

### 2. Configure and run the frontend

Open `frontend/src/api.ts` and make sure its API base URL points to the local API address while developing locally. Then, in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite.

For a production frontend build:

```powershell
cd frontend
npm run build
```

## API areas

The frontend uses the products, categories, cart, customer orders, and administrator orders API areas. Examples of routes used by the application include:

- `/Products`
- `/Categories`
- `/CartItems`
- `/Orders`
- `/admin/orders`

The API requires the appropriate authentication token for protected operations.

## Deployment notes

- Deploy the backend API and frontend as separate Render services.
- Set backend secrets in the API service's Render **Environment** settings.
- Configure the frontend API base URL to use the deployed API address.
- The backend database connection must use the PostgreSQL/Npgsql connection-string format expected by the API.
- Never publish database passwords, JWT keys, or administrator credentials in source code, screenshots, or logs.

## License

No license has been specified for this repository. Contact the repository owner before reusing or distributing the code.
