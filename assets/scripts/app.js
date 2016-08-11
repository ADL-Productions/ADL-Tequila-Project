'use strict';

var app = {};

// API key, API URL and request header token
app.lcboApiKey = lcboApiKey;
app.lcboApiUrl = 'http://lcboapi.com/';
app.requestHeaderToken = 'Token token=' + app.lcboApiKey;

app.init = function() {
	// console.log('api key >>>', app.lcboApiKey);
	app.getUserInput();
};

// Get all currently available Tequila products
app.getUserInput = function() {

	// Get user input --  price range and bottle volume
	$('#userInputForm').on('submit', function(e) {
		// Prevent default action
		e.preventDefault();

		// Get selected price range, bottle volume range and user location
		var priceRange   = $('#priceRange').val(),
			volumeRange  = $('#volumeRange').val(),
			userLocation = $('#userLocation').val();

		$('#priceRange').empty();
		$('#volumeRange').empty();
		$('#userLocation').empty();

		// Convert price and volume values to ranges
		priceRange  = app.utilities.getPriceRange(Number(priceRange));
		volumeRange = app.utilities.getVolumeRange(Number(volumeRange));

		// Get products matching user search
		app.getProductRange(priceRange, volumeRange, userLocation);	
	});

}

app.getProductRange = function(priceRange, volumeRange, userLocation) {

	console.log('priceRange', priceRange);
	console.log('volumeRange', volumeRange);
	console.log('userLocation', userLocation);	

	// Get products sorted by price
	$.ajax({
		url: app.lcboApiUrl + 'products',
		dataType: 'json',
		method: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', app.requestHeaderToken);
		},
		data: {
			q : 'tequila',
			where_not: 'is_dead, is_discontinued',
			per_page: 100,
			order: 'price_in_cents.asc'
		}
	}).then(function(data) {

		console.log('data - sorted by price', data);

		// Filter by categories (get all tequila products for reference)		
		var tequilaProducts = data.result.filter(function(obj) {
			return obj.primary_category === 'Spirits' && obj.secondary_category === 'Tequila';
		});
		console.log('all tequila products', tequilaProducts);

		// Filter by categories, user selected price and volume ranges
		var products = data.result.filter(function(obj) {
			return obj.primary_category === 'Spirits' && obj.secondary_category === 'Tequila';
		}).filter(function(obj) {
			return obj.price_in_cents >= priceRange[0] && obj.price_in_cents <= priceRange[1];
		}).filter(function(obj) {
			return obj.volume_in_milliliters >= volumeRange[0] && obj.volume_in_milliliters <= volumeRange[1];
		});

		console.log('products', products);
		console.log('no of products', products.length);

		// Display products on page
		products.forEach(function(product) {
			/*	
				PROPERTIES FOR PREVIEW SECTION:
				id
				image_thumb
				name
				package
				price_in_cents
				volume_in_millilitres
			*/

			/*	
				PROPERTIES FOR SHOWCASE SECTION:
				id
				image_thumb
				image_url
				name
				origin
				package
				price_in_cents
				producer_name
				style
				volume_in_millilitres
				varietal
			*/
		});

		// When the user selects a product from the preview section, display the 
		// product in the showcase section

		// When the user clicks on the store availability button, display a map
		// and a list of stores nearest to the user's location

	});	
}

app.countProductAvailabilityPages = function(productId, products, userLocation) {


	$.ajax({
		url: app.lcboApiUrl + 'inventories',
		dataType: 'json',
		method: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', app.requestHeaderToken);
		},
		data: {
			product_id : productId,
			per_page: 5  /*! Reduce this number as much as possible 
			                 if we just need a record count.
			                 The minimum number appears to be 5 and the 
			                 default is 50.
			              */
			// order: quantity.desc  /*! Maybe order by store quantities */
		}
	}).then(function(data) {

		console.log('inventory data', data);

	});
};


// UTILITY FUNCTIONS
app.utilities = {
	// Get the price range limits that correspond to the input value
	getPriceRange: function(d) {
	    return d === 4  ? [7000, 999999] :
	    	   d === 3  ? [5000, 6999]   :
	    	   d === 2  ? [3500, 4999]   :
	                      [0, 3499]      ;
	},
	// Get the volume range limits that correspond to the input value
	getVolumeRange: function(d) {
	    return d === 3  ? [1140, 9999] :
	    	   d === 2  ? [750, 1139]  :
	                      [0, 749]     ;
	}
}

// Start the app
$(function() {
	app.init();
	
	$("#showcase").flickity({
		wrapAround: true,
	  //pageDots: false
	});
});