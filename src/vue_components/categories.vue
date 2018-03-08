<template>
	<div id="categories">
    	<div class="card">
    		<div class="card-content">
	        	<!--<span class="card-title center-align">Categories</span>-->
				<div class="center-align side-header">Categories</div>
	        	<ul class="collection">
					<a class="collection-item center-align" :class="{ 'active': isActive('') }" href="./?/">All</a>
	        		<a class="collection-item center-align" v-for="category in categories" :class="{ 'active': isActive(category.slug) }" :href="'./?/category/' + category.slug">{{ category.name }}</a>
	        	</ul>
				<div class="center-align side-header">Search Other Zites</div>
				<ul class="collection">
					<a class="collection-item center-align" :class="{ 'active': false }" :href="'./?/zite/zeroup'" v-on:click.prevent="goto('zite/zeroup');">ZeroUp</a>
				</ul>
	        	<div class="center-align">
	        		<a href="/Mail.ZeroNetwork.bit/?to=krixano">Request New Category or Claim Ownership of zite: krixano@zeroid.bit</a> <!-- TODO -->
	        	</div>
	        </div>
        </div>
	</div>
</template>

<style>
	.collection .collection-item {
		padding-top: 7px;
		padding-bottom: 7px;
	}
	.side-header {
		font-weight: 400;
	}
</style>

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