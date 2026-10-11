using Ecommerce.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = "Admin")]
public class AdminOrdersController : ControllerBase
{
    private readonly EcommerceDbContext _context;

    public AdminOrdersController(EcommerceDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetOrders()
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new
            {
                o.Id,
                o.CustomerId,
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

        public class UpdateOrderStatusRequest
    {
        public string Status { get; set; } = "";
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        UpdateOrderStatusRequest request)
    {
        var order = await _context.Orders.FindAsync(id);

        if (order == null)
        {
            return NotFound("Order not found.");
        }

        var nextStatus = order.Status switch
        {
            "Pending" => "Processing",
            "Processing" => "Shipped",
            "Shipped" => "Delivered",
            _ => null
        };

        if (nextStatus == null || request.Status != nextStatus)
        {
            return BadRequest(
                "Invalid order status transition."
            );
        }

        order.Status = nextStatus;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            order.Id,
            order.Status
        });
    }
}