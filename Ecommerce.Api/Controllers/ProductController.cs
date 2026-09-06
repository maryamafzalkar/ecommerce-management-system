using Ecommerce.Api.Data;
using Ecommerce.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


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
public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
{
    return await _context.Products.ToListAsync();
}



    [HttpPost]
public async Task<ActionResult<Product>> CreateProduct(Product product)
{
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

    var existingProduct = await _context.Products.FindAsync(id);

    if (existingProduct == null)
    {
        return NotFound();
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