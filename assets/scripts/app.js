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

// Get user input from form submission in order to filter tequila products
app.getUserInput = function() {

	// Get user input -- price range and bottle volume
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
		priceRange  = app.utils.getPriceRange(Number(priceRange));
		volumeRange = app.utils.getVolumeRange(Number(volumeRange));

		// Get products matching user search
		app.getProductRange(priceRange, volumeRange, userLocation);	
	});
}

// Get all currently available tequila products that match the user's specifications
app.getProductRange = function(priceRange, volumeRange, userLocation) {

// console.log('priceRange', priceRange);
// console.log('volumeRange', volumeRange);
// console.log('userLocation', userLocation);	

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

// console.log('data - sorted by price', data);

		// // Filter by categories (get all tequila products for reference)		
		// var tequilaProducts = data.result.filter(function(obj) {
		// 	return obj.primary_category === 'Spirits' && obj.secondary_category === 'Tequila';
		// });

// console.log('all tequila products', tequilaProducts);

		// Filter by categories, user selected price and volume ranges
		var products = data.result.filter(function(obj) {
			return obj.primary_category === 'Spirits' && obj.secondary_category === 'Tequila';
		}).filter(function(obj) {
			return obj.price_in_cents >= priceRange[0] && obj.price_in_cents <= priceRange[1];
		}).filter(function(obj) {
			return obj.volume_in_milliliters >= volumeRange[0] && obj.volume_in_milliliters <= volumeRange[1];
		});

// console.log('products', products);
// console.log('no of products', products.length);

		// Display products on the page
		products.forEach(function(product) {
			// Create an option element and append to select element
			var option       = $('<option>').val(product.id),
				roundedPrice = Math.ceil(product.price_in_cents / 100);

			option.text(`${product.name} ${product.package} \$${roundedPrice}`);
			$('#productSelection').append(option);

// console.info('name:', product.name);
// console.log('producer_name:', product.producer_name);			
// console.log('origin:', product.origin);			
// console.log('varietal:', product.varietal);
// console.log('style:', product.style);

		});

		// When the user selects a product from the preview section, display the 
		// product in the showcase section
		$('#productSelectionForm').on('submit', function(e) {
			// Prevent default action
			e.preventDefault();

console.log('products', products);

			// Get the user selection
			var userSelection = Number($('#productSelection').val());

console.log('userSelection', userSelection);

			var selectedProduct = products.filter(function(product) {
				return product.id === userSelection;
			})[0];

console.log('selectedProduct', selectedProduct);
console.log('url', selectedProduct.image_thumb_url);
console.log('name', selectedProduct.name);
console.log('lcbo url', app.utils.getProductUrl(selectedProduct.name, selectedProduct.id));

			$('#devShowcase img').attr('src', selectedProduct.image_thumb_url);
			$('#devShowcase h2').text(selectedProduct.name);
			$('#devShowcase a').attr('href', app.utils.getProductUrl(selectedProduct.name, selectedProduct.id));

			// When the user clicks on the store availability button, display a map
			// and a list of stores nearest to the user's location
			$('#showInventory').on('click', function(e) {
				$('#dev-map').css('height', '300px').show();
				app.countProductAvailabilityPages(selectedProduct, products, userLocation);
			});
		});
	});	
}

// Get a count of the number of response pages at the inventories endpoint
app.countProductAvailabilityPages = function(selectedProduct, products, userLocation) {


// console.log('product ID', selectedProduct.id);

	$.ajax({
		url: app.lcboApiUrl + 'inventories',
		dataType: 'json',
		method: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', app.requestHeaderToken);
		},
		data: {
			product_id : selectedProduct.id//,
			//per_page: 5  /*! Reduce this number as much as possible if we just need a record count */			              
			// order: quantity.desc  /*! Maybe order by store quantities */
		}
	}).then(function(data) {

console.info('inventory data', data);

		// Count the total number of results pages
		var dataPages = data.pager.total_pages;

// console.log('total_pages', data.pager.total_pages);

		// If there are multiple pages, use multiple requests to page results
		// Otherwise, use the results from the current page
		if (dataPages > 1) {
			app.getProductAvailability(dataPages, selectedProduct, products, userLocation);
		} else {
			var inventories = data.result;

// console.info('inventories (one page)', inventories);

			app.countStoreLocations(inventories, selectedProduct, products, userLocation);
		}
	});
};

// Make a request for each response page at the inventories endpoint, when necessary
app.getProductAvailability = function(dataPages, selectedProduct, products, userLocation) {

// console.info('dataPages', dataPages);	
// console.info('selectedProduct', selectedProduct);	
// console.info('products', products);	
// console.info('userLocation', userLocation);	

	// Add page numbers to an array
	var pages = [];
	for (var i = 1; i <= dataPages; i++) {
		pages.push(i);
	}

	// Create an array of $.ajax requests - one request per page
	var pageRequests = pages.map(function(page) {
		return $.ajax({
		    url: app.lcboApiUrl + 'inventories',
    		dataType: 'json',
    		method: 'GET',
    		beforeSend: function(request) {
    			request.setRequestHeader('Authorization', app.requestHeaderToken);
    		},
    		data: {
/*! UNCOMMENT THIS !*/
    			product_id: selectedProduct.id,
    			page: page
		    }
		}); // $.ajax
	}); // pageRequests

	$.when.apply(null, pageRequests)
		.then(function() {			
			// Convert the list of arguments passed to the function into an array
			// This array will contain the data for each of the ajax responses
			var returnedPages = Array.prototype.slice.call(arguments);

console.info('returnedPages', returnedPages);

			// Initialize an array to contain store inventories
			var inventories = [];
			
			// Transform the array to include only event data
			returnedPages = returnedPages.map(function(page) {
				return page[0].result;
			});

			// Flatten results into one array with all the listings
			inventories = _.flatten(returnedPages);

// console.info('inventories', inventories);

			// Get the store locations
			app.countStoreLocations(inventories, selectedProduct, products, userLocation);
		});
};

// Get a count of the number of response pages at the stores endpoint
app.countStoreLocations = function(inventories, selectedProduct, product, userLocation) {

console.info('inventories', inventories);
console.info('selectedProduct', selectedProduct);
console.info('product', product);
console.info('userLocation', userLocation);

	$.ajax({
		url: app.lcboApiUrl + 'stores',
		dataType: 'json',
		method: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', app.requestHeaderToken);
		},
		data: {
			product_id: selectedProduct.id,
			geo: userLocation,
			distance_in_meters: 5000
		}
	}).then(function(data) {

console.log('store data', data);

		var stores = data.result;
		
		// stores.forEach(function(store) {
		// 	console.log(store.address_line_1, store.address_line_2, store.city, store.distance_in_meters);
		// });

		// Append the inventory of the selected product and related properties to each store
		stores.forEach(function(store) {
			for (var i = 0; i < inventories.length; i++) {
				if (store.store_no === inventories[i].store_no) {

// console.log('store_no', store.store_no);

					store.selected_product_id = inventories[i].product_id;
					store.selected_product_quantity = inventories[i].quantity;
					store.selected_product_updated_at = inventories[i].updated_at;
					store.selected_product_updated_on = inventories[i].updated_on;
				}
			} 
		});

console.info('stores', stores);

		app.plotInventoryMap(stores);

	});

};

app.plotInventoryMap = function(stores) {
	// Initialize the map
	var map = L.map('dev-map');

	var CartoDB_Positron = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
		subdomains: 'abcd',
		maxZoom: 19
	}).addTo(map);

	// Define a custom marker for stores
	var storeIcon = L.icon({
		// 191x494
		iconSize: [14.4, 40],
		iconAnchor: [7.2, 40], // [1/10 width, height]
		popupAnchor:  [-1, -35],
		iconUrl: 'assets/images/tequila-bottle-solid-icon.png'//,
		// shadowUrl: 'assets/images/leaflet/marker-shadow.png'
	});

	// Initialize an array for all markers to be added to the map
	var markers = [];

	// Iterate through the restaurantsArray
	// and create a marker for each restaurant
	stores.forEach(function(store) {
		// Get the restaurant's coordinates
		var latLng = L.latLng(store.latitude, store.longitude);
		// Calculate the distance to the venue (in kilometres)
		// var distance = (latLng.distanceTo(eventLatLng) / 1000).toFixed(1);
		var marker = L.marker(latLng, {
			icon: storeIcon,
			alt: store.address_line_1,
			title: store.address_line_1
		}).bindPopup(
			`
			<div class="popup-container">
				<p>
					${store.address_line_1}<br>
					${store.city}<br>
					Distance: ${(store.distance_in_meters / 1000).toFixed(1)} km <br>
					Quantity: ${store.selected_product_quantity}<br>
					Last updated: ${store.selected_product_updated_on}
				</p>
			</div>
			`
		);

		// Add the marker to the marker array
		markers.push(marker);
	});

	// Create a feature group to handle all the markers
	var markerGroup = L.featureGroup(markers);

	// Fit the map to the extent of all markers
	map.fitBounds(markerGroup);

	// Add markers to the map
	markerGroup.addTo(map);
};


// UTILITY FUNCTIONS
app.utils = {
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
	},
	// Convert a product name into an appropriate LCBO 
	getProductUrl: function(name, id) {
		var baseUrl = 'http://www.lcbo.com/lcbo/product/';
		return baseUrl + name.toLowerCase().replace(/\s/g, '-') + '/' + id;
	}
}

// Start the app
$(function() {
	app.init();
	
	// $("#showcase").flickity({
	// 	wrapAround: true,
	//   //pageDots: false
	// });
});