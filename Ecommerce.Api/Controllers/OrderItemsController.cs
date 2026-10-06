using Ecommerce.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrderItemsController : ControllerBase
{
    private readonly EcommerceDbContext _context;

    public OrderItemsController(EcommerceDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetOrderItems()
    {
        var items = await _context.OrderItems
            .Include(oi => oi.Product) //mokhafafe order item
            .ToListAsync();

        return Ok(items);
    }
}
