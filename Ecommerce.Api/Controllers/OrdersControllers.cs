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
    public async Task<ActionResult<IEnumerable<Order>>> GetOrders()
    {
        return await _context.Orders
            .Include(o => o.Customer)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder(Order order)
    {
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return Ok(order);
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