using System.ComponentModel.DataAnnotations;

namespace Ecommerce.Api.Models;
    


public class RegisterRequest
{
    public string Username { get; set; } = string.Empty;


    [RegularExpression(
    @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$",
    ErrorMessage = "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character."
)]
    public string Password { get; set; } = string.Empty;



    public string Role { get; set; } = "Customer";
}