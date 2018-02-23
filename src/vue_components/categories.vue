<template>
	<div id="categories">
    	<div class="card">
    		<div class="card-content">
	        	<span class="card-title center-align">Categories</span>
	        	<ul class="collection">
					<a class="collection-item center-align" :class="{ 'active': isActive('') }" href="./?/">All</a>
	        		<a class="collection-item center-align" v-for="category in categories" :class="{ 'active': isActive(category.slug) }" :href="'./?/category/' + category.slug">{{ category.name }}</a>
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
		props: ["categories"],
		name: "categories",
		methods: {
			goto: function(to) {
				Router.navigate(to);
			},
			isActive: function(slug) {
				if (slug == "") return Router.currentRoute == "";
				return Router.currentParams['categoryslug'] == slug;
			}
		}
	};
</script>