<template>
	<div id="categories">
    	<div class="card">
    		<div class="card-content">
	        	<span class="card-title center-align">Categories</span>
	        	<ul class="collection">
					<a class="collection-item center-align active" href="./?/">All</a>
	        		<a class="collection-item center-align" v-for="category in categories" href="#">{{ category.name }}</a>
	        	</ul>
	        	<div class="center-align">
	        		<a href="./?/request-category" v-on:click.prevent="goto('request-category')">Request New Category</a> <!-- TODO -->
	        	</div>
	        </div>
        </div>
	</div>
</template>

<script>
	var Router = require("../libs/router.js");

	module.exports = {
		props: [],
		name: "categories",
		data: function() {
			return {
				categories: [
					{ name: "Search Engine" },
					{ name: "Social Network" },
					{ name: "Gaming" },
					{ name: "Blog" },
					{ name: "File Sharing/Streaming" },
					{ name: "News/Info" },
					{ name: "Productivity" },
					{ name: "Other" }
				]
			};
		},
		methods: {
			goto: function(to) {
				Router.navigate(to);
			}
		}
	};
</script>