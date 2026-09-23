using Ecommerce.Api.Data;
using Ecommerce.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;


namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]


public class ProductsController : ControllerBase
{
    private readonly EcommerceDbContext _context;

    public ProductsController(EcommerceDbContext context)
    {
        _context = context;
    }



 [HttpGet]
public async Task<ActionResult<IEnumerable<Product>>> GetProducts(
    string? search,string? sort)
    
{
    var query = _context.Products     
    .AsQueryable();

    if (!string.IsNullOrWhiteSpace(search))
    {
        query = query.Where(p =>
            p.Name.Contains(search) ||    
            p.Description.Contains(search) ||
           p.Category != null && p.Category.Name.Contains(search));
    }
    if(sort=="price_asc")
    {
        query=query.OrderBy(p=>p.Price);
    }
    else if(sort=="price_desc")
    {
        query=query.OrderByDescending(p=>p.Price);
    }
    else if(sort=="name_asc")
    {
        query=query.OrderBy(p=>p.Name);
    }
    else if(sort=="name_desc")
    {
        query=query.OrderByDescending(p=>p.Name);
    }

    return await query.ToListAsync();
}


    [HttpPost]
    public async Task<ActionResult<Product>> CreateProduct(Product product)
{
    if (Regex.IsMatch(product.Name, @"<[^>]*>") ||
    Regex.IsMatch(product.Description, @"<[^>]*>"))
{
    return BadRequest("Product name or description contains invalid characters.");
}
    var categoryExists = await _context.Categories
    .AnyAsync(c => c.Id == product.CategoryId);

if (!categoryExists)
{
    return BadRequest("Category does not exist.");
}
    _context.Products.Add(product);
    await _context.SaveChangesAsync();

    return Ok( product);
}



[HttpPut("{id}")]
public async Task<IActionResult> UpdateProduct(int id, Product product)
{
    if (id != product.Id)
    {
        return BadRequest();
    }

    if (Regex.IsMatch(product.Name, @"<[^>]*>") ||
    Regex.IsMatch(product.Description, @"<[^>]*>"))
{
    return BadRequest("Product name or description contains invalid characters.");
}


    var existingProduct = await _context.Products.FindAsync(id);

    if (existingProduct == null)
    {
        return NotFound();
    }
     var categoryExists = await _context.Categories
    .AnyAsync(c => c.Id == product.CategoryId);

   if (!categoryExists)
{
       return BadRequest("Category does not exist.");
}
    existingProduct.Name = product.Name;
    existingProduct.Description = product.Description;
    existingProduct.Price = product.Price;
    existingProduct.StockQuantity = product.StockQuantity;
    existingProduct.CategoryId = product.CategoryId;

    await _context.SaveChangesAsync();

    return Ok(existingProduct);
}


[Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]


[HttpDelete("{id}")]
public async Task<IActionResult> DeleteProduct(int id)
{
    var product = await _context.Products.FindAsync(id);

    if (product == null)
    {
        return NotFound();
    }

    _context.Products.Remove(product);
    await _context.SaveChangesAsync();

    return NoContent();
}
}