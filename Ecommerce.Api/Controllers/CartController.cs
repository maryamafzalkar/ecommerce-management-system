using Ecommerce.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ecommerce.Api.Models;


namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CartController : ControllerBase

{
    private readonly EcommerceDbContext _context;

    public CartController(EcommerceDbContext context)
    {
        _context = context;
    }

    [HttpGet]
public async Task<IActionResult> GetCart()
{
    var userIdClaim = User.FindFirst(
        System.Security.Claims.ClaimTypes.NameIdentifier
    );

    if (userIdClaim == null)
    {
        return Unauthorized();
    }

    var userId = int.Parse(userIdClaim.Value);

    var customer = await _context.Customers
        .FirstOrDefaultAsync(c => c.UserId == userId);

    if (customer == null)
    {
        return NotFound("Customer profile not found.");
    }

    var cart = await _context.Carts
        .FirstOrDefaultAsync(c => c.CustomerId == customer.Id);

    if (cart == null)
    {
        cart = new Cart
        {
            CustomerId = customer.Id
        };

        _context.Carts.Add(cart);
        await _context.SaveChangesAsync();
    }

    return Ok(new
    {
        CartId = cart.Id,
        CustomerId = customer.Id
    });
}
}