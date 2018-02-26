<template>
	<div id="MyBookmarks" class="container">
		<div class="row">
	        <div class="col s12 m12 l8 push-l2">
				<nav style="background-color: #4caf50; margin-bottom: .8rem; margin-top: 8px;">
					<div class="nav-wrapper">
					<form onsubmit="return false;">
						<div class="input-field">
						<input id="search" type="search" placeholder="Search My Bookmarks (On Enter)" v-on:change.prevent="getZites" v-model="searchQuery" required>
						<label class="label-icon" for="search"><i class="material-icons">search</i></label>
						<i class="material-icons" v-on:click.prevent="clearSearch()">close</i>
						</div>
					</form>
					</div>
				</nav>

				<!--<ul class="pagination center-align" v-if="zites.length >= 4">
					<li><a href="#!" v-on:click.prevent="previousPage"><i class="material-icons">chevron_left</i></a></li>
					<li class="disabled"><a href="#!">{{ pageNum + 1 }}</a></li>
					<li><a href="#!" v-on:click.prevent="nextPage"><i class="material-icons">chevron_right</i></a></li>
				</ul>-->

				<component :is="zite_list_item" :user-info="userInfo" v-for="zite in zites" :zite="zite" :show-category="true" :categories="categories" v-on:update="getZites()"></component>


				<!-- TODO: Use getSearchResults when check for length once search has been implemented -->
				<ul class="pagination center-align" v-if="zites.length != 0">
					<li><a href="#!" v-on:click.prevent="previousPage"><i class="material-icons">chevron_left</i></a></li>
					<li class="disabled"><a href="#!">{{ pageNum + 1 }}</a></li>
					<li><a href="#!" v-on:click.prevent="nextPage"><i class="material-icons">chevron_right</i></a></li>
				</ul>
	        </div>
	        <div class="col s12 m12 l3">
	        	<component :is="categoriesSidebar" :categories="categories"></component>
	        </div>
	    </div>
	</div>
</template>

<script>
	var Router = require("../libs/router.js");
	//var categoriesSidebar = require("../vue_components/categories.vue");
	var ziteListItem = require("../vue_components/zite_list_item.vue");

	module.exports = {
		props: ["userInfo"],
		name: "MyBookmarks",
		data: () => {
			return {
				//categoriesSidebar: categoriesSidebar,
				zite_list_item: ziteListItem,
				zites: [],
				categories: [],
				pageNum: 0,
				searchQuery: ""
			}
		},
		beforeMount: function() {
			var self = this;

			if (Router.currentParams["page"])
				this.pageNum = parseInt(Router.currentParams["page"]);

			if (this.userInfo) {
				this.getZites();
			}
			this.getCategories();
			this.$parent.$on("update", function() {
				//self.getQuestions();
				self.getZites();
			});
		},
		methods: {
			goto: function(to) {
				Router.navigate(to);
			},
			getCategories: function() {
				var self = this;
				page.getCategories()
					.then((categories) => {
						self.categories = categories;
					});
			},
			getZites: function() {
				var self = this;
				page.getBookmarkZitesSearch(this.searchQuery, this.pageNum)
					.then((zites) => {
						if (zites.length == 0 && self.pageNum != 0) {
							self.pageNum--;
							self.getZites();
							return;
						}
						self.zites = zites;
					});
			},
			previousPage: function() { // TODO: Scroll to top
				this.pageNum -= 1;
				if (this.pageNum <= 0) this.pageNum = 0;
				this.getZites();
			},
			nextPage: function() {
				this.pageNum += 1;
				this.getZites();
            },
			clearSearch: function() {
				this.searchQuery = "";
				this.getZites();
			}
		}
	}
</script>

