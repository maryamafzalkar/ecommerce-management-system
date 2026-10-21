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
    var userIdValue = User.FindFirst(
        System.Security.Claims.ClaimTypes.NameIdentifier
    )?.Value;

    if (!int.TryParse(userIdValue, out var userId))
    {
        return Unauthorized();
    }

    var customer = await _context.Customers
        .AsNoTracking()
        .FirstOrDefaultAsync(c => c.UserId == userId);

    if (customer == null)
    {
        return NotFound("Customer profile not found.");
    }

    var cart = await _context.Carts
        .AsNoTracking()
        .FirstOrDefaultAsync(c => c.CustomerId == customer.Id);

    if (cart == null)
    {
        return Ok(new
        {
            Items = Array.Empty<CartItem>(),
            Total = 0m
        });
    }

    var items = await _context.CartItems
        .AsNoTracking()
        .Include(ci => ci.Product)
        .Where(ci => ci.CartId == cart.Id)
        .ToListAsync();

    var total = items.Sum(ci => ci.Quantity * ci.UnitPrice);

    return Ok(new
    {
        Items = items,
        Total = total
    });
}


   
    [HttpPost]
public async Task<IActionResult> AddToCart(int productId, int quantity)
{
    var userIdValue = User.FindFirst(
        System.Security.Claims.ClaimTypes.NameIdentifier
    )?.Value;

    if (!int.TryParse(userIdValue, out var userId))
    {
        return Unauthorized();
    }

    if (quantity <= 0)
    {
        return BadRequest("Quantity must be greater than zero.");
    }

    await using var transaction =
        await _context.Database.BeginTransactionAsync(
            System.Data.IsolationLevel.Serializable
        );

    try
    {
        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (customer == null)
        {
            return NotFound("Customer profile not found.");
        }

        var product = await _context.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
        {
            return NotFound("Product not found.");
        }

        if (quantity > product.StockQuantity)
        {
            return BadRequest("Not enough stock.");
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

        var existingItem = await _context.CartItems
            .FirstOrDefaultAsync(ci =>
                ci.CartId == cart.Id &&
                ci.ProductId == productId);

        if (existingItem != null)
        {
            var newQuantity = (long)existingItem.Quantity + quantity;

            if (newQuantity > product.StockQuantity)
            {
                return BadRequest("Not enough stock.");
            }

            existingItem.Quantity = (int)newQuantity;
            existingItem.UnitPrice = product.Price;
        }
        else
        {
            _context.CartItems.Add(new CartItem
            {
                CartId = cart.Id,
                ProductId = productId,
                Quantity = quantity,
                UnitPrice = product.Price
            });
        }

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok();
    }
    catch (Exception exception) when (IsCartConflict(exception))
    {
        await transaction.RollbackAsync();

        return Conflict(
            "Your cart changed during this request. " +
            "Refresh your cart before trying again."
        );
    }
}

private static bool IsCartConflict(Exception exception)
{
    for (
        Exception? current = exception;
        current != null;
        current = current.InnerException
    )
    {
        if (current is not Npgsql.PostgresException postgresException)
        {
            continue;
        }

        if (postgresException.SqlState is "40001" or "40P01")
        {
            return true;
        }

        if (postgresException.SqlState == "23505" &&
            (postgresException.ConstraintName == "IX_Carts_CustomerId" ||
             postgresException.ConstraintName ==
                 "IX_CartItems_CartId_ProductId"))
        {
            return true;
        }
    }

    return false;
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


