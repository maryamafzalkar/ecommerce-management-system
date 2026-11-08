using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Ecommerce.Api.Models;

public class Category
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Category name is required.")]
    [StringLength(
        100,
        MinimumLength = 2,
        ErrorMessage = "Category name must contain 2 to 100 characters."
    )]
    public string Name { get; set; } = string.Empty;

    [JsonIgnore]
    public ICollection<Product> Products { get; set; } = new List<Product>();
}