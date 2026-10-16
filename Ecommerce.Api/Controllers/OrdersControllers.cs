using Ecommerce.Api.Data;
using Ecommerce.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class OrdersController : ControllerBase
{
    private readonly EcommerceDbContext _context;

    public OrdersController(EcommerceDbContext context)
    {
        _context = context;
    }
[HttpGet]
public async Task<IActionResult> GetOrders()
{
    var userIdClaim = User.FindFirst(
        System.Security.Claims.ClaimTypes.NameIdentifier
    );

    if (userIdClaim == null ||
        !int.TryParse(userIdClaim.Value, out int userId))
    {
        return Unauthorized();
    }

    var orders = await _context.Orders
        .AsNoTracking()
        .Where(o => o.Customer != null &&
                    o.Customer.UserId == userId)
        .OrderByDescending(o => o.OrderDate)
        .Select(o => new
        {
            o.Id,
            o.OrderDate,
            o.TotalAmount,
            o.Status,

           Items = o.OrderItems.Select(item => new
{
    item.ProductId,
    ProductName = item.Product != null
        ? item.Product.Name
        : "Unknown Product",
    item.Quantity,
    item.UnitPrice
             }).ToList()
        })
        .ToListAsync();

    return Ok(orders);
}

    [HttpPost]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    public async Task<ActionResult<Order>> CreateOrder(Order order)
    {
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return Ok(order);
    }
    
  [HttpPost("checkout")]
[Microsoft.AspNetCore.Authorization.Authorize(Roles = "Customer")]
public async Task<IActionResult> Checkout(
    [FromHeader(Name = "Idempotency-Key")] Guid? requestId)
{
    if (!requestId.HasValue || requestId.Value == Guid.Empty)
    {
        return BadRequest("A valid checkout request ID is required.");
    }

    var userIdValue = User.FindFirst(
        System.Security.Claims.ClaimTypes.NameIdentifier
    )?.Value;

    if (!int.TryParse(userIdValue, out var userId))
    {
        return Unauthorized();
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

        var existingOrder = await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o =>
                o.CustomerId == customer.Id &&
                o.CheckoutRequestId == requestId.Value
            );

        if (existingOrder != null)
        {
            return Ok(new
            {
                OrderId = existingOrder.Id,
                TotalAmount = existingOrder.TotalAmount,
                Status = existingOrder.Status,
                Message = "Order already placed successfully."
            });
        }

        var cart = await _context.Carts
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.CustomerId == customer.Id);

        if (cart == null)
        {
            return NotFound("Cart not found.");
        }

        var cartItems = await _context.CartItems
            .Include(ci => ci.Product)
            .Where(ci => ci.CartId == cart.Id)
            .OrderBy(ci => ci.ProductId)
            .ThenBy(ci => ci.Id)
            .ToListAsync();

        if (cartItems.Count == 0)
        {
            return BadRequest("Cart is empty.");
        }

        if (cartItems.Any(item =>
            item.Quantity <= 0 || item.Product == null))
        {
            return BadRequest("Your cart contains an invalid item.");
        }

        var order = new Order
        {
            CustomerId = customer.Id,
            CheckoutRequestId = requestId.Value,
            TotalAmount = cartItems.Sum(
                item => item.Quantity * item.Product!.Price
            ),
            Status = "Pending"
        };

        foreach (var item in cartItems)
        {
            var updatedRows = await _context.Products
                .Where(p =>
                    p.Id == item.ProductId &&
                    p.StockQuantity >= item.Quantity
                )
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(
                        p => p.StockQuantity,
                        p => p.StockQuantity - item.Quantity
                    )
                );

            if (updatedRows == 0)
            {
                return Conflict(
                    $"Not enough stock for product: {item.Product!.Name}"
                );
            }

            order.OrderItems.Add(new OrderItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = item.Product!.Price
            });
        }

        _context.Orders.Add(order);
        _context.CartItems.RemoveRange(cartItems);

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new
        {
            OrderId = order.Id,
            TotalAmount = order.TotalAmount,
            Status = order.Status,
            Message = "Checkout completed successfully."
        });
    }
    catch (Exception exception) when (
        exception is Npgsql.PostgresException
        {
            SqlState: "40001" or "40P01" or "23505"
        } ||
        exception is DbUpdateException
        {
            InnerException: Npgsql.PostgresException
            {
                SqlState: "40001" or "40P01" or "23505"
            }
        })
    {
        await transaction.RollbackAsync();

        return Conflict(
            "Your cart changed during checkout. Retry with the same request ID."
        );
    }

}


    [HttpPut("{id}")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
public async Task<IActionResult> UpdateOrder(int id, Order order)
{
    if (id != order.Id)
    {
        return BadRequest();
    }

    var existingOrder = await _context.Orders.FindAsync(id);

    if (existingOrder == null)
    {
        return NotFound();
    }

    existingOrder.CustomerId = order.CustomerId;
    existingOrder.TotalAmount = order.TotalAmount;
    existingOrder.Status = order.Status;

    await _context.SaveChangesAsync();

    return Ok(existingOrder);
}

    [HttpDelete("{id}")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
public async Task<IActionResult> DeleteOrder(int id)
{
    var order = await _context.Orders.FindAsync(id);

    if (order == null)
    {
        return NotFound();
    }

    _context.Orders.Remove(order);
    await _context.SaveChangesAsync();

    return NoContent();
}
}