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
}