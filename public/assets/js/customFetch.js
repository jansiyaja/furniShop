<script src="https://code.jquery.com/jquery-3.6.4.min.js"></script> 
    // Attach an event listener to the cancel order button
    $(document).on('click', '#cancelOrderButton', function (e) {
        e.preventDefault();
        const orderId = $(this).data('order-id');
        const productId = $(this).data('product-id');

        // Send an AJAX request to cancel the order
        $.ajax({
            url: '/cancelOrder',
            method: 'POST',
            data: JSON.stringify({ orderId, productId }),
            contentType: 'application/json'
        }).then((response) => {
            if (response.cancel) {
                // Handle success, e.g., update UI or show a confirmation message
                console.log('Order cancelled successfully');
            } else {
                // Handle failure, e.g., show an error message
                console.error('Failed to cancel order');
            }
        });
    });
