using System.ComponentModel.DataAnnotations;

namespace Ecommerce.Api.Models;

public class RegisterRequest
{
    [Required(ErrorMessage = "Username is required.")]
    [StringLength(
        100,
        MinimumLength = 2,
        ErrorMessage = "Username must contain 2 to 100 characters."
    )]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [RegularExpression(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$",
        ErrorMessage =
            "Password must be at least 8 characters and contain " +
            "uppercase, lowercase, number, and special character."
    )]
    public string Password { get; set; } = string.Empty;
}