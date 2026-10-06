using Ecommerce.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Data;

public class EcommerceDbContext : DbContext
{
    public EcommerceDbContext(DbContextOptions<EcommerceDbContext> options)
        : base(options)
    {
    }

    public DbSet<Product> Products { get; set; }

    public DbSet<Category> Categories { get; set; }

    public DbSet<Customer> Customers { get; set; }

    public DbSet<Order> Orders { get; set; }

    public DbSet<User> Users { get; set; }

    public DbSet<OrderItem> OrderItems { get; set; }

    public DbSet<Cart> Carts { get; set; }

    public DbSet<CartItem> CartItems { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
{
   
    base.OnModelCreating(modelBuilder);

    modelBuilder.Entity<Customer>()
        .HasOne(c=> c.User)
        .WithOne()
        .HasForeignKey<Customer>(c => c.UserId)
        .IsRequired(false);

     modelBuilder.Entity<Order>()
        .HasMany(o => o.OrderItems)
        .WithOne(oi => oi.Order)
        .HasForeignKey(oi => oi.OrderId);

     modelBuilder.Entity<Product>()
    .HasMany<OrderItem>()
    .WithOne(oi => oi.Product)
    .HasForeignKey(oi => oi.ProductId);

     modelBuilder.Entity<Cart>()
     .HasOne(c => c.Customer)
     .WithMany()
     .HasForeignKey(c => c.CustomerId)
     .OnDelete(DeleteBehavior.Cascade);

     modelBuilder.Entity<Cart>()
    .HasMany<CartItem>()
    .WithOne(ci => ci.Cart)
    .HasForeignKey(ci => ci.CartId)
    .OnDelete(DeleteBehavior.Cascade);

     modelBuilder.Entity<Product>()
    .HasMany<CartItem>()
    .WithOne(ci => ci.Product)
    .HasForeignKey(ci => ci.ProductId)
    .OnDelete(DeleteBehavior.Restrict);

}
}