using Ecommerce.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ecommerce.Api.Models;
using System.Reflection.Metadata.Ecma335;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CartItemsController : ControllerBase
{
    private readonly EcommerceDbContext _context;

    public CartItemsController(EcommerceDbContext context)
    {
        _context = context;
    }



    [HttpGet]
    public async Task<IActionResult> GetCartItems()
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
            return NotFound("Cart not found.");
        }

        var items = await _context.CartItems
            .Include(ci => ci.Product)
            .Where(ci => ci.CartId == cart.Id)
            .ToListAsync();

       var total = items.Sum(ci => ci.Quantity * ci.UnitPrice);

        return Ok(new { Items = items, Total = total });    
    }





    [HttpPost]
public async Task<IActionResult> AddToCart(int productId, int quantity)
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
        return NotFound("Cart not found.");
    }

    var product = await _context.Products
        .FirstOrDefaultAsync(p => p.Id == productId);

    if (product == null)
    {
        return NotFound("Product not found.");
    }

    if (quantity <= 0)
    {
        return BadRequest("Quantity must be greater than zero.");
    }

    if (quantity > product.StockQuantity)
    {
        return BadRequest("Not enough stock.");
    }

    var existingItem = await _context.CartItems
        .FirstOrDefaultAsync(ci =>
            ci.CartId == cart.Id &&
            ci.ProductId == productId);

    if (existingItem != null)
    {
        existingItem.Quantity += quantity;
        existingItem.UnitPrice = product.Price; // Update the unit price in case it has changed
    }
    else
    {
        var cartItem = new CartItem
        {
            CartId = cart.Id,
            ProductId = productId,
            Quantity = quantity,
            UnitPrice= product.Price
        };


        _context.CartItems.Add(cartItem);
    }
    await _context.SaveChangesAsync();
        return Ok();
    }


[HttpDelete("{id}")]
public async Task<IActionResult> RemoveFromCart(int id)
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
        return NotFound("Cart not found.");
    }

    var cartItem = await _context.CartItems
        .FirstOrDefaultAsync(ci =>
            ci.Id == id &&
            ci.CartId == cart.Id);

    if (cartItem == null)
    {
        return NotFound("Cart item not found.");
    }

    _context.CartItems.Remove(cartItem);

    await _context.SaveChangesAsync();

    return NoContent();
}


[HttpPut("{id}")]
public async Task<IActionResult> UpdateQuantity(int id, int quantity)
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
        return NotFound("Cart not found.");
    }

    var cartItem = await _context.CartItems
        .FirstOrDefaultAsync(ci =>
            ci.Id == id &&
            ci.CartId == cart.Id);

    if (cartItem == null)
    {
        return NotFound("Cart item not found.");
    }

    if (quantity <= 0)
    {
        return BadRequest("Quantity must be greater than zero.");
    }

    var product = await _context.Products
        .FirstOrDefaultAsync(p => p.Id == cartItem.ProductId);

    if (product == null)
    {
        return NotFound("Product not found.");
    }

    if (quantity > product.StockQuantity)
    {
        return BadRequest("Not enough stock.");
    }

    cartItem.Quantity = quantity;

    await _context.SaveChangesAsync();

    return Ok(cartItem);
}
}


