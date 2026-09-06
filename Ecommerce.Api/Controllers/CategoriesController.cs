using Ecommerce.Api.Data;
using Ecommerce.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly EcommerceDbContext _context;

    public CategoriesController(EcommerceDbContext context)
    {
        _context = context;
    }



    [HttpGet]
    public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
    {
        return await _context.Categories.ToListAsync();
    }



    [HttpPost]
    public async Task<ActionResult<Category>> CreateCategory(Category category)
    {
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return Ok(category);
    }


    [HttpPut("{id}")]
public async Task<IActionResult> UpdateCategory(int id, Category category)
{
    if (id != category.Id)
    {
        return BadRequest();
    }

    var existingCategory = await _context.Categories.FindAsync(id);

    if (existingCategory == null)
    {
        return NotFound();
    }

    existingCategory.Name = category.Name;

    await _context.SaveChangesAsync();

    return Ok(existingCategory);
}


[HttpDelete("{id}")]
public async Task<IActionResult> DeleteCategory(int id)
{
    var category = await _context.Categories.FindAsync(id);

    if (category == null)
    {
        return NotFound();
    }

    _context.Categories.Remove(category);
    await _context.SaveChangesAsync();

    return NoContent();
}
}