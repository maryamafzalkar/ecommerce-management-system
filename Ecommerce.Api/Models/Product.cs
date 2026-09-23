namespace Ecommerce.Api.Models;
using System.ComponentModel.DataAnnotations;    
public class Product
{
    public int Id { get; set; }


    [Required]
    [StringLength(100 ,MinimumLength=2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Description { get; set; } = string.Empty;

    [Range(0.01 ,1000000)]
    public decimal Price { get; set; }

    [Range(0 ,100000)]
    public int StockQuantity { get; set; }

    public int CategoryId { get; set; }

    public Category? Category { get; set; }
}