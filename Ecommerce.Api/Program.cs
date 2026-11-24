
using Ecommerce.Api.Data;
using Ecommerce.Api.Settings;
using Ecommerce.Api.Models;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

// =====================================
// 1. JWT SETTINGS
// =====================================

builder.Services
    .AddOptions<JwtSettings>()
    .Bind(builder.Configuration.GetSection("Jwt"))
    .Validate(
        settings => !string.IsNullOrWhiteSpace(settings.Key),
        "JWT Key is missing.")
    .Validate(
        settings => settings.Key.Length >= 32,
        "JWT Key must be at least 32 characters.")
    .Validate(
        settings => !string.IsNullOrWhiteSpace(settings.Issuer),
        "JWT Issuer is missing.")
    .Validate(
        settings => !string.IsNullOrWhiteSpace(settings.Audience),
        "JWT Audience is missing.")
    .Validate(
        settings => settings.ExpirationHours > 0,
        "JWT ExpirationHours must be positive.")
    .ValidateOnStart();

// =====================================
// 2. ADMIN SEED SETTINGS
// =====================================

builder.Services
    .AddOptions<AdminSeedSettings>()
    .Bind(builder.Configuration.GetSection("AdminSeed"))
    .Validate(
        settings => !string.IsNullOrWhiteSpace(settings.Username),
        "AdminSeed Username is required.")
    .Validate(
        settings => !string.IsNullOrWhiteSpace(settings.Password),
        "AdminSeed Password is required.")
    .ValidateOnStart();

// =====================================
// 3. CONTROLLERS
// =====================================

builder.Services.AddControllers();

// =====================================
// 4. CORS
// =====================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "https://ecommerce-management-system-frontend.onrender.com")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// =====================================
// 5. AUTHENTICATION - JWT
// =====================================

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSettings = builder.Configuration
            .GetSection("Jwt")
            .Get<JwtSettings>()!;

        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtSettings.Issuer,

                ValidateAudience = true,
                ValidAudience = jwtSettings.Audience,

                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtSettings.Key))
            };
    });

// =====================================
// 6. AUTHORIZATION
// =====================================

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy =
        new AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .Build();
});

// =====================================
// 7. SWAGGER
// =====================================

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(
        "bearer",
        new Microsoft.OpenApi.OpenApiSecurityScheme
        {
            Type = Microsoft.OpenApi.SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description =
                "JWT Authorization header using the Bearer scheme."
        });

    options.AddSecurityRequirement(document =>
        new Microsoft.OpenApi.OpenApiSecurityRequirement
        {
            [new Microsoft.OpenApi.OpenApiSecuritySchemeReference(
                "bearer", document)] = []
        });
});

// =====================================
// 8. DATABASE - POSTGRESQL
// =====================================

builder.Services.AddDbContext<EcommerceDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString(
            "DefaultConnection")));

// =====================================
// 9. OPENAPI
// =====================================

builder.Services.AddOpenApi();

// =====================================
// 10. BUILD APPLICATION
// =====================================

var app = builder.Build();

// =====================================
// 11. MIDDLEWARE
// =====================================

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

// =====================================
// 12. MAP CONTROLLERS
// =====================================

app.MapControllers();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// =====================================
// 13. ADMIN SEED
// =====================================

var adminSeedSettings = app.Services
    .GetRequiredService<IOptions<AdminSeedSettings>>()
    .Value;

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider
        .GetRequiredService<EcommerceDbContext>();

    var existingUser = await context.Users
        .FirstOrDefaultAsync(
            user => user.Username == adminSeedSettings.Username);

    if (existingUser == null)
    {
        var adminUser = new User
        {
            Username = adminSeedSettings.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                adminSeedSettings.Password),
            Role = "Admin"
        };

        context.Users.Add(adminUser);

        await context.SaveChangesAsync();
    }
    else if (existingUser.Role != "Admin")
    {
        throw new InvalidOperationException(
            "Admin seed username is already used by a non-admin account.");
    }
}

// =====================================
// 14. RUN APPLICATION
// =====================================

// app.UseHttpsRedirection();

app.Run();
