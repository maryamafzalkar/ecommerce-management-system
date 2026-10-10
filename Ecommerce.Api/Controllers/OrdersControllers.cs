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
    public async Task<ActionResult<Order>> CreateOrder(Order order)
    {
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return Ok(order);
    }
    [HttpPost("checkout")]
public async Task<IActionResult> Checkout()
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

    var cartItems = await _context.CartItems
        .Include(ci => ci.Product)
        .Where(ci => ci.CartId == cart.Id)
        .ToListAsync();

    if (cartItems.Count == 0)
    {
        return BadRequest("Cart is empty.");
    }
    
    var transaction = await _context.Database.BeginTransactionAsync();

    foreach (var item in cartItems)
    {
        if (item.Product == null)
        {
            return NotFound("Product not found.");
        }

        if (item.Quantity > item.Product.StockQuantity)
        {
            return BadRequest(
                $"Not enough stock for product: {item.Product.Name}"
            );
        }
    }
   
    
    var order = new Order
    {
        CustomerId = customer.Id,
        TotalAmount = cartItems.Sum(
            item => item.Quantity * item.Product!.Price
        ),
        Status = "Pending"
    };

    _context.Orders.Add(order);

    foreach (var item in cartItems)
    {
        var orderItem = new OrderItem
        {
            Order = order,
            ProductId = item.ProductId,
            Quantity = item.Quantity,
            UnitPrice = item.Product!.Price
        };

        item.Product!.StockQuantity -= item.Quantity;

        _context.OrderItems.Add(orderItem);
    }

    _context.CartItems.RemoveRange(cartItems);

    await _context.SaveChangesAsync();
    await transaction.CommitAsync();

   return Ok(new
{
    OrderId = order.Id,
    TotalAmount = order.TotalAmount,
    Status = order.Status,
    Message = "Checkout completed successfully"
});
}


    [HttpPut("{id}")]
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