<template>
	<div id="categoryPage" class="container">
		<div class="row">
	        <div class="col s12 m12 l9">

				<nav style="background-color: #4caf50; margin-bottom: .8rem; margin-top: 8px;">
					<div class="nav-wrapper">
						<form onsubmit="return false;">
							<div class="row" style="padding: 0; margin: 0; height: 100%;">
								<div class="input-field col s10 m11 l12" style="display: inline-block; margin: 0; padding: 0;"> <!-- TODO: Translate placeholder -->
									<input id="search" type="search" :placeholder="categoryName ? langTranslation['Search In ... Category'].replace(/\.\.\./, langTranslation[categoryName]) : 'Search'" v-on:keyup.enter="searchEnter($event)" v-on:input.prevent="getZites" v-model="searchQuery" required style="margin: 0;">
									<label class="label-icon" for="search" style="padding-left: 10px;"><i class="material-icons">search</i></label>
									<i class="material-icons" style="padding-right: 10px;" v-on:click.prevent="clearSearch()">close</i>
								</div>
								<div class="col s2 m1 hide-on-large-only">
									<a class="dropdown-trigger" href="#" data-target='searchDropdown' ref="searchDropdownTrigger" style="margin: auto; text-align: center;">
										<i class="material-icons">keyboard_arrow_down</i>
									</a>
								</div>
							</div>
						</form>
					</div>
				</nav>

				<ul id='searchDropdown' class='dropdown-content' ref="searchDropdown">
					<li><a href="./?/" v-on:click.prevent="goto('')">{{ langTranslation["All"] }}</a></li>
					<li v-for="category in categories" :class="{ 'active': currentCategory == category.slug }"><a :href="'./?/category/' + category.slug">{{ langTranslation[category.name] }}</a></li>
				</ul>

				<component :is="zite_list_item" :user-info="userInfo" v-for="zite in zites" :zite="zite" :show-category="true" :categories="categories" v-on:update="getZites()" :lang-translation="langTranslation"></component>

				<ul class="pagination center-align" v-if="zites.length != 0">
					<li><a href="#!" v-on:click.prevent="previousPage"><i class="material-icons">chevron_left</i></a></li>
					<li class="disabled"><a href="#!">{{ pageNum + 1 }}</a></li>
					<li><a href="#!" v-on:click.prevent="nextPage"><i class="material-icons">chevron_right</i></a></li>
				</ul>
	        </div>
	        <div class="col s12 m12 l3 hide-on-med-and-down">
	        	<component :is="categoriesSidebar" :categories="categories" :lang-translation="langTranslation"></component>
	        </div>
	    </div>
	</div>
</template>

<script>
	var Router = require("../libs/router.js");
	var categoriesSidebar = require("../vue_components/categories.vue");
	var ziteListItem = require("../vue_components/zite_list_item.vue");

	module.exports = {
		props: ["userInfo", "langTranslation"],
		name: "categoryPage",
		data: () => {
			return {
				firstUpdate: false,
				categoriesSidebar: categoriesSidebar,
				zite_list_item: ziteListItem,
				zites: [],
                categories: [],
                pageNum: 0,
				searchQuery: "",
				currentCategory: "",
				categoryName: ""
			}
		},
		beforeMount: function() {
			var self = this;
			
			this.currentCategory = Router.currentParams["categoryslug"];

            if (Router.currentParams["page"])
                this.pageNum = parseInt(Router.currentParams["page"]);

			this.getZites(); // TODO: Loads twice on initial page load
			this.getCategories();

			this.$parent.$on("update", function() {
				//self.getQuestions();
				self.getZites();
				self.firstUpdate = false;
			});
		},
		mounted: function() {
			var searchDropdown = this.$refs.searchDropdownTrigger;
			var searchDropdown_instance = M.Dropdown.init(searchDropdown, {
				alignment: "right",
				constrainWidth: false,
				coverTrigger: false
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
						for (var i in categories) {
							var category = categories[i];
							if (category.slug == self.currentCategory) {
								self.categoryName = category.name;
							}
						}
					});
			},
			getZites: function() {
				var self = this;
				page.getZitesInCategorySearch(this.currentCategory, this.searchQuery, this.pageNum)
					.then((zites) => {
                        if (zites.length == 0 && self.pageNum != 0) {
							self.pageNum--;
							self.getZites();
							return;
						}
						self.zites = zites;
						self.$emit("resultsChanged");
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
			},
			searchEnter: function(e) {
				page.cmd("wrapperOpenWindow", ["/" + this.zites[0].address]);
			}
		}
	}
</script>
