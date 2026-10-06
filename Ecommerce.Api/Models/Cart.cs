namespace Ecommerce.Api.Models
{
    public class Cart
    {
        public int Id { get; set; }

        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }
    }
}